import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { DemoFinanceService } from '../demo-finance/demo-finance.service';
import { AuditService } from '../audit/audit.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { ReviewSubmissionDto, ReviewDecision } from './dto/review-submission.dto';
import { TaskStatus, ParticipationStatus, TaskModel, EscrowFundingStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly demoFinanceService: DemoFinanceService,
    private readonly auditService: AuditService,
    @Optional()
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService?: PaymentsService,
  ) {}

  /**
   * Create and fund an open marketplace task campaign via 5-step wizard
   */
  async createTask(buyerId: string, dto: CreateTaskDto, ipAddress?: string) {
    if (dto.acceptanceCriteria.length < 2) {
      throw new BadRequestException('At least two objective acceptance criteria are required');
    }

    const unitBudgetCents = BigInt(dto.unitBudgetCents);
    const fees = this.demoFinanceService.calculateFees(unitBudgetCents);
    const totalEscrowCents = fees.totalSlotEscrowCents * BigInt(dto.totalSlots);
    const taskId = randomUUID();

    return this.prisma.$transaction(async (tx) => {
      // 1. Lock demo escrow atomically
      await this.demoFinanceService.lockTaskEscrow(
        buyerId,
        taskId,
        dto.totalSlots,
        unitBudgetCents,
        tx,
      );

      // 2. Create parent task entity
      const task = await tx.task.create({
        data: {
          id: taskId,
          buyerId,
          categoryId: dto.categoryId,
          subcategoryId: dto.subcategoryId,
          taskModel: dto.taskModel,
          title: dto.title.trim(),
          status: TaskStatus.OPEN,
          totalSlots: dto.totalSlots,
          availableSlots: dto.totalSlots,
          unitBudgetCents,
          totalEscrowCents,
          buyerFeeCents: fees.buyerFeeCents * BigInt(dto.totalSlots),
          workerFeeCents: fees.workerFeeCents * BigInt(dto.totalSlots),
          maxRevisions: dto.maxRevisions || 2,
          startDeadlineHours: dto.startDeadlineHours || 6,
          completionDurationHours: dto.completionDurationHours || 24,
          reviewSlaHours: dto.reviewSlaHours || 72,
          currentVersionNumber: 1,
        },
      });

      // 3. Create immutable version 1 instructions
      const instructionVersion = await tx.taskInstructionVersion.create({
        data: {
          taskId: task.id,
          versionNumber: 1,
          descriptionMarkdown: dto.descriptionMarkdown,
          acceptanceCriteriaJson: JSON.parse(JSON.stringify(dto.acceptanceCriteria)),
          deliverableRequirementsJson: JSON.parse(JSON.stringify(dto.deliverableRequirements)),
          attachmentsJson: dto.milestones ? JSON.parse(JSON.stringify(dto.milestones)) : null,
          createdById: buyerId,
        },
      });

      // 4. Create capacity TaskSlots (1 to N)
      const slotData = [];
      for (let i = 1; i <= dto.totalSlots; i++) {
        slotData.push({
          taskId: task.id,
          slotNumber: i,
          isClaimed: false,
        });
      }
      await tx.taskSlot.createMany({ data: slotData });

      // 5. Create associated public Q&A conversation
      await tx.conversation.create({
        data: {
          taskId: task.id,
          isPublicQnA: true,
        },
      });

      await this.auditService.log({
        actorId: buyerId,
        actorRole: 'BUYER',
        action: 'TASK_PUBLISHED',
        resourceType: 'Task',
        resourceId: task.id,
        newState: { title: task.title, totalSlots: task.totalSlots, budgetCents: unitBudgetCents.toString() },
        ipAddress,
        reason: 'Published open marketplace task with locked demo escrow',
      });

      return {
        id: task.id,
        title: task.title,
        status: task.status,
        totalSlots: task.totalSlots,
        availableSlots: task.availableSlots,
        unitBudgetCents: task.unitBudgetCents.toString(),
        totalEscrowCents: task.totalEscrowCents.toString(),
        currentVersion: instructionVersion.versionNumber,
        createdAt: task.createdAt,
      };
    });
  }

  /**
   * Search and filter tasks on open marketplace with public participation dashboard stats
   */
  async findTasks(query: QueryTaskDto) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    } else {
      where.status = { in: [TaskStatus.OPEN, TaskStatus.FULL] };
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.taskModel) {
      where.taskModel = query.taskModel;
    }

    if (query.minBudgetCents) {
      where.unitBudgetCents = { gte: BigInt(query.minBudgetCents) };
    }

    if (query.search) {
      where.title = { contains: query.search.trim(), mode: 'insensitive' };
    }

    const [tasks, totalCount] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          subcategory: { select: { id: true, name: true, slug: true } },
          buyer: {
            select: {
              id: true,
              profile: { select: { displayName: true, countryCode: true, avatarUrl: true, reputationScore: true } },
            },
          },
          _count: {
            select: {
              participations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit || 20,
        skip: query.offset || 0,
      }),
      this.prisma.task.count({ where }),
    ]);

    const formatted = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      taskModel: t.taskModel,
      status: t.status,
      escrowFundingStatus: t.escrowFundingStatus,
      totalSlots: t.totalSlots,
      availableSlots: t.availableSlots,
      unitBudgetCents: t.unitBudgetCents.toString(),
      formattedUnitUSD: `DEMO $${(Number(t.unitBudgetCents) / 100).toFixed(2)} USD`,
      startDeadlineHours: t.startDeadlineHours,
      completionDurationHours: t.completionDurationHours,
      category: t.category,
      subcategory: t.subcategory,
      buyer: t.buyer,
      participationCount: t._count.participations,
      createdAt: t.createdAt,
    }));

    return {
      data: formatted,
      meta: {
        totalCount,
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
    };
  }

  /**
   * Get complete task details, active instructions, and Participation Dashboard statistics
   */
  async getTaskById(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        category: true,
        subcategory: true,
        buyer: {
          select: {
            id: true,
            profile: { select: { displayName: true, countryCode: true, avatarUrl: true, reputationScore: true } },
          },
        },
        instructionVersions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const stats = await this.getParticipationStats(taskId);
    const activeVersion = task.instructionVersions[0];

    return {
      id: task.id,
      title: task.title,
      taskModel: task.taskModel,
      status: task.status,
      escrowFundingStatus: task.escrowFundingStatus,
      unitBudgetCents: task.unitBudgetCents.toString(),
      formattedUnitUSD: `DEMO $${(Number(task.unitBudgetCents) / 100).toFixed(2)} USD`,
      totalSlots: task.totalSlots,
      availableSlots: task.availableSlots,
      startDeadlineHours: task.startDeadlineHours,
      completionDurationHours: task.completionDurationHours,
      reviewSlaHours: task.reviewSlaHours,
      maxRevisions: task.maxRevisions,
      buyer: task.buyer,
      category: task.category,
      subcategory: task.subcategory,
      participationStats: stats,
      instructions: activeVersion
        ? {
            versionNumber: activeVersion.versionNumber,
            descriptionMarkdown: activeVersion.descriptionMarkdown,
            acceptanceCriteria: activeVersion.acceptanceCriteriaJson,
            deliverableRequirements: activeVersion.deliverableRequirementsJson,
            milestones: activeVersion.attachmentsJson,
          }
        : null,
      createdAt: task.createdAt,
    };
  }

  /**
   * Database-backed live public metrics for marketplace discovery
   */
  async getPublicPlatformStats() {
    const [totalTasks, totalWorkers, totalParticipations, approvedParticipations, slotSums] = await Promise.all([
      this.prisma.task.count({ where: { status: { in: [TaskStatus.OPEN, TaskStatus.FULL] } } }),
      this.prisma.user.count({ where: { primaryRole: 'WORKER', status: 'ACTIVE' } }),
      this.prisma.workerParticipation.count(),
      this.prisma.workerParticipation.count({ where: { status: ParticipationStatus.APPROVED } }),
      this.prisma.task.aggregate({
        _sum: {
          totalSlots: true,
          availableSlots: true,
        },
      }),
    ]);

    const settlementRate = totalParticipations > 0
      ? ((approvedParticipations / totalParticipations) * 100).toFixed(1)
      : '100.0';

    return {
      activeTasksCount: totalTasks,
      verifiedWorkersCount: totalWorkers,
      totalSlotsCount: slotSums._sum.totalSlots || 0,
      availableSlotsCount: slotSums._sum.availableSlots || 0,
      totalParticipationsCount: totalParticipations,
      settlementRatePercent: settlementRate,
    };
  }

  /**
   * Get all task participation records for a worker
   */
  async getWorkerParticipations(workerId: string) {
    const list = await this.prisma.workerParticipation.findMany({
      where: { workerId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            taskModel: true,
            status: true,
            totalSlots: true,
            availableSlots: true,
            unitBudgetCents: true,
            startDeadlineHours: true,
            completionDurationHours: true,
            reviewSlaHours: true,
            maxRevisions: true,
            createdAt: true,
          },
        },
        milestones: { orderBy: { milestoneOrder: 'asc' } },
        submissions: {
          include: {
            versions: { orderBy: { versionNumber: 'desc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((p) => ({
      ...p,
      task: {
        ...p.task,
        unitBudgetCents: p.task.unitBudgetCents.toString(),
        formattedUnitUSD: `DEMO $${(Number(p.task.unitBudgetCents) / 100).toFixed(2)} USD`,
      },
    }));
  }

  /**
   * Get a single participation record by id with milestones & submissions
   */
  async getParticipationById(userId: string, participationId: string) {
    const p = await this.prisma.workerParticipation.findUnique({
      where: { id: participationId },
      include: {
        task: {
          include: {
            buyer: {
              select: {
                id: true,
                profile: { select: { displayName: true, countryCode: true, avatarUrl: true, reputationScore: true } },
              },
            },
            instructionVersions: { orderBy: { versionNumber: 'desc' }, take: 1 },
          },
        },
        milestones: { orderBy: { milestoneOrder: 'asc' } },
        submissions: {
          include: {
            versions: { orderBy: { versionNumber: 'desc' } },
          },
        },
      },
    });

    if (!p) throw new NotFoundException('Participation record not found');
    if (p.workerId !== userId && p.task.buyerId !== userId) {
      throw new ForbiddenException('You do not have access to this participation');
    }

    const latestInstruction = p.task.instructionVersions[0] || null;

    return {
      ...p,
      task: {
        ...p.task,
        instructions: latestInstruction,
        unitBudgetCents: p.task.unitBudgetCents.toString(),
        formattedUnitUSD: `DEMO $${(Number(p.task.unitBudgetCents) / 100).toFixed(2)} USD`,
      },
    };
  }

  /**
   * Real-time Task Participation Dashboard stats
   */
  async getParticipationStats(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const participations = await this.prisma.workerParticipation.groupBy({
      by: ['status'],
      where: { taskId },
      _count: { _all: true },
    });

    const statusCounts: Record<string, number> = {};
    for (const p of participations) {
      statusCounts[p.status] = p._count._all;
    }

    const acceptedTotal = Object.values(statusCounts).reduce((acc, count) => acc + count, 0);
    const currentlyWorking = statusCounts[ParticipationStatus.IN_PROGRESS] || 0;
    const submittedForReview =
      (statusCounts[ParticipationStatus.SUBMITTED] || 0) +
      (statusCounts[ParticipationStatus.UNDER_REVIEW] || 0);
    const approvedSettled = statusCounts[ParticipationStatus.APPROVED] || 0;
    const reviewOverdue = statusCounts[ParticipationStatus.REVIEW_OVERDUE] || 0;
    const rejectedTerminated =
      (statusCounts[ParticipationStatus.REJECTED] || 0) +
      (statusCounts[ParticipationStatus.ABANDONED] || 0);

    return {
      totalCapacity: task.totalSlots,
      remainingAvailableSlots: task.availableSlots,
      acceptedTotal,
      currentlyWorking,
      submittedForReview,
      reviewOverdue,
      approvedSettled,
      rejectedTerminated,
    };
  }

  /**
   * Worker atomically claims a slot on an open marketplace task
   * Protected with PostgreSQL row-level locking (SELECT ... FOR UPDATE)
   */
  async acceptSlot(workerId: string, taskId: string, ipAddress?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Row-level lock on task
      const taskRows: any[] = await tx.$queryRaw`
        SELECT "id", "status", "availableSlots", "totalSlots", "startDeadlineHours", 
               "completionDurationHours", "currentVersionNumber"
        FROM "Task"
        WHERE "id" = ${taskId}::uuid
        FOR UPDATE
      `;

      if (!taskRows || taskRows.length === 0) {
        throw new NotFoundException('Task not found');
      }

      const task = taskRows[0];

      if (task.status !== TaskStatus.OPEN || task.availableSlots <= 0) {
        throw new ConflictException({
          code: 'ERR_SLOT_UNAVAILABLE',
          message: 'All slots for this task have been claimed or closed.',
        });
      }

      // 2. Prevent multi-slot hoarding by the same worker on the same task
      const existing = await tx.workerParticipation.findFirst({
        where: {
          taskId,
          workerId,
          status: {
            in: [
              ParticipationStatus.IN_PROGRESS,
              ParticipationStatus.SUBMITTED,
              ParticipationStatus.UNDER_REVIEW,
              ParticipationStatus.REVISION_REQUESTED,
              ParticipationStatus.REVIEW_OVERDUE,
            ],
          },
        },
      });

      if (existing) {
        throw new ConflictException({
          code: 'ERR_ALREADY_PARTICIPATING',
          message: 'You already have an active work slot on this task.',
        });
      }

      // 3. Find first unclaimed slot
      const slot = await tx.taskSlot.findFirst({
        where: { taskId, isClaimed: false },
        orderBy: { slotNumber: 'asc' },
      });

      if (!slot) {
        throw new ConflictException({
          code: 'ERR_SLOT_UNAVAILABLE',
          message: 'No unclaimed slots available.',
        });
      }

      // 4. Mark slot claimed and decrement available count
      await tx.taskSlot.update({
        where: { id: slot.id },
        data: { isClaimed: true },
      });

      const newAvailable = task.availableSlots - 1;
      const newStatus = newAvailable === 0 ? TaskStatus.FULL : TaskStatus.OPEN;

      await tx.task.update({
        where: { id: taskId },
        data: {
          availableSlots: newAvailable,
          status: newStatus,
        },
      });

      // 5. Fetch active instruction version
      const instructionVersion = await tx.taskInstructionVersion.findUnique({
        where: {
          taskId_versionNumber: {
            taskId,
            versionNumber: task.currentVersionNumber,
          },
        },
      });

      if (!instructionVersion) {
        throw new Error('Instruction version not found');
      }

      // 6. Compute start and execution deadlines
      const now = new Date();
      const startDeadlineAt = new Date(now.getTime() + task.startDeadlineHours * 60 * 60 * 1000);
      const executionDeadlineAt = new Date(now.getTime() + task.completionDurationHours * 60 * 60 * 1000);

      // 7. Create isolated WorkerParticipation record
      const participation = await tx.workerParticipation.create({
        data: {
          taskId,
          slotId: slot.id,
          workerId,
          instructionVersionId: instructionVersion.id,
          status: ParticipationStatus.IN_PROGRESS,
          startDeadlineAt,
          executionDeadlineAt,
          progressPercentage: 0,
        },
      });

      await this.auditService.log({
        actorId: workerId,
        actorRole: 'WORKER',
        action: 'TASK_SLOT_ACCEPTED',
        resourceType: 'WorkerParticipation',
        resourceId: participation.id,
        newState: { taskId, slotNumber: slot.slotNumber, startDeadlineAt },
        ipAddress,
        reason: 'Worker claimed slot on open marketplace',
      });

      return {
        success: true,
        id: participation.id,
        participationId: participation.id,
        slotNumber: slot.slotNumber,
        status: participation.status,
        startDeadlineAt: participation.startDeadlineAt,
        executionDeadlineAt: participation.executionDeadlineAt,
      };
    });
  }

  /**
   * Pause task acceptance (new workers blocked, active workers finish)
   */
  async pauseTask(buyerId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.buyerId !== buyerId) throw new ForbiddenException('Not your task');

    if (task.status !== TaskStatus.OPEN && task.status !== TaskStatus.FULL) {
      throw new BadRequestException(`Cannot pause task in ${task.status} status`);
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { status: TaskStatus.PAUSED },
    });
  }

  /**
   * Resume paused task
   */
  async resumeTask(buyerId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.buyerId !== buyerId) throw new ForbiddenException('Not your task');

    if (task.status !== TaskStatus.PAUSED) {
      throw new BadRequestException('Task is not paused');
    }

    const nextStatus = task.availableSlots > 0 ? TaskStatus.OPEN : TaskStatus.FULL;
    return this.prisma.task.update({
      where: { id: taskId },
      data: { status: nextStatus },
    });
  }

  /**
   * Close remaining unfilled slots and refund unallocated demo escrow
   */
  async closeRemainingSlots(buyerId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.buyerId !== buyerId) throw new ForbiddenException('Not your task');

    const remainingSlots = task.availableSlots;
    if (remainingSlots <= 0) {
      throw new BadRequestException('No unclaimed slots remaining to close');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Refund demo escrow for unfilled slots
      await this.demoFinanceService.refundUnclaimedSlots(
        buyerId,
        taskId,
        remainingSlots,
        task.unitBudgetCents,
        tx,
      );

      // 2. Mark remaining slots closed
      const updated = await tx.task.update({
        where: { id: taskId },
        data: {
          availableSlots: 0,
          status: TaskStatus.CLOSED,
        },
      });

      return {
        taskId: updated.id,
        closedSlots: remainingSlots,
        status: updated.status,
      };
    });
  }

  /**
   * Worker submits deliverables for their claimed task slot
   */
  async submitWork(
    workerId: string,
    participationId: string,
    dto: SubmitTaskDto,
    ipAddress?: string,
  ) {
    const participation = await this.prisma.workerParticipation.findUnique({
      where: { id: participationId },
      include: { task: true },
    });

    if (!participation) {
      throw new NotFoundException('Participation record not found');
    }

    if (participation.workerId !== workerId) {
      throw new ForbiddenException('Not authorized for this work slot');
    }

    if (
      participation.status !== ParticipationStatus.IN_PROGRESS &&
      participation.status !== ParticipationStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException(`Cannot submit work in current status: ${participation.status}`);
    }

    if (new Date() > participation.executionDeadlineAt) {
      throw new BadRequestException('Execution deadline has expired for this slot');
    }

    return this.prisma.$transaction(async (tx) => {
      let submission = await tx.submission.findFirst({
        where: { participationId },
      });

      let nextVersion = 1;
      if (!submission) {
        submission = await tx.submission.create({
          data: {
            participationId,
            currentVersion: 1,
            status: 'PENDING_REVIEW',
          },
        });
      } else {
        nextVersion = submission.currentVersion + 1;
        await tx.submission.update({
          where: { id: submission.id },
          data: { currentVersion: nextVersion, status: 'PENDING_REVIEW' },
        });
      }

      const subVersion = await tx.submissionVersion.create({
        data: {
          submissionId: submission.id,
          versionNumber: nextVersion,
          textNotes: dto.content,
          deliverableUrlsJson: dto.deliverableUrls ? JSON.parse(JSON.stringify(dto.deliverableUrls)) : null,
          criteriaAttestationsJson: dto.completedMilestoneIds
            ? JSON.parse(JSON.stringify(dto.completedMilestoneIds))
            : null,
        },
      });

      if (dto.evidenceFileIds && dto.evidenceFileIds.length > 0) {
        await tx.evidenceFile.updateMany({
          where: { id: { in: dto.evidenceFileIds } },
          data: {
            submissionVersionId: subVersion.id,
            participationId,
          },
        });
      }

      const reviewOverdueAt = new Date(
        Date.now() + participation.task.reviewSlaHours * 60 * 60 * 1000,
      );

      const updated = await tx.workerParticipation.update({
        where: { id: participationId },
        data: {
          status: ParticipationStatus.SUBMITTED,
          progressPercentage: 100,
          submittedAt: new Date(),
          reviewOverdueAt,
        },
      });

      await this.auditService.log({
        actorId: workerId,
        actorRole: 'WORKER',
        action: 'WORK_SUBMITTED',
        resourceType: 'WorkerParticipation',
        resourceId: participationId,
        newState: { versionNumber: nextVersion, reviewOverdueAt },
        ipAddress,
        reason: 'Worker submitted task deliverables for buyer review',
      });

      return {
        success: true,
        participationId: updated.id,
        status: updated.status,
        submissionVersion: nextVersion,
        submittedAt: updated.submittedAt,
        reviewOverdueAt: updated.reviewOverdueAt,
      };
    });
  }

  /**
   * Buyer evaluates worker submission (APPROVE, REQUEST_REVISION, REJECT)
   */
  async reviewParticipation(
    buyerId: string,
    participationId: string,
    dto: ReviewSubmissionDto,
    ipAddress?: string,
  ) {
    const participation = await this.prisma.workerParticipation.findUnique({
      where: { id: participationId },
      include: {
        task: true,
        submissions: { include: { versions: true } },
      },
    });

    if (!participation) {
      throw new NotFoundException('Participation record not found');
    }

    if (participation.task.buyerId !== buyerId) {
      throw new ForbiddenException('Not authorized to review this task');
    }

    if (
      participation.status !== ParticipationStatus.SUBMITTED &&
      participation.status !== ParticipationStatus.UNDER_REVIEW &&
      participation.status !== ParticipationStatus.REVIEW_OVERDUE
    ) {
      throw new BadRequestException(
        `Cannot review participation in current status: ${participation.status}`,
      );
    }

    if (dto.decision === ReviewDecision.APPROVE) {
      return this.prisma.$transaction(async (tx) => {
        // 1. Pessimistic row-level lock on WorkerParticipation to serialize concurrent approval attempts
        let currentStatus = participation.status;
        if (typeof tx.$queryRaw === 'function') {
          const lockedRows: any[] = await tx.$queryRaw`
            SELECT "id", "status"
            FROM "WorkerParticipation"
            WHERE "id" = ${participationId}::uuid
            FOR UPDATE
          `;

          if (lockedRows && lockedRows.length > 0) {
            currentStatus = lockedRows[0].status;
          }
        }

        if (
          currentStatus !== ParticipationStatus.SUBMITTED &&
          currentStatus !== ParticipationStatus.UNDER_REVIEW &&
          currentStatus !== ParticipationStatus.REVIEW_OVERDUE
        ) {
          throw new BadRequestException(
            `Cannot approve participation in current status: ${currentStatus}`,
          );
        }

        if (participation.task.escrowFundingStatus === EscrowFundingStatus.FUNDED_REAL && this.paymentsService) {
          await this.paymentsService.settleWorkerSlotReal(participation.id);
        }

        const unitBudgetCents = BigInt(participation.task.unitBudgetCents || 0);
        const workerFeeCents = BigInt(participation.task.workerFeeCents || 0);
        let netPayoutCents = unitBudgetCents > workerFeeCents ? unitBudgetCents - workerFeeCents : unitBudgetCents;
        let formattedPayout = `$${(Number(netPayoutCents) / 100).toFixed(2)} USD`;

        if (participation.task.escrowFundingStatus !== EscrowFundingStatus.FUNDED_REAL) {
          // Release DEMO escrow payout to worker
          const payout = await this.demoFinanceService.disburseSlotPayout(
            buyerId,
            participation.workerId,
            participation.taskId,
            participation.id,
            participation.task.unitBudgetCents,
            tx,
          );
          netPayoutCents = payout.workerNetPayoutCents;
          formattedPayout = `DEMO $${(Number(payout.workerNetPayoutCents) / 100).toFixed(2)} USD`;
        }

        const now = new Date();
        const updated = await tx.workerParticipation.update({
          where: { id: participationId },
          data: {
            status: ParticipationStatus.APPROVED,
            approvedAt: now,
          },
        });

        // 2. Publish review & rating if provided
        if (dto.rating) {
          await tx.review.create({
            data: {
              taskId: participation.taskId,
              participationId: participation.id,
              reviewerId: buyerId,
              revieweeId: participation.workerId,
              overallRating: dto.rating,
              communicationRating: dto.rating,
              qualityRating: dto.rating,
              timelinessRating: dto.rating,
              publicComment: dto.feedback || 'Work accepted and approved.',
              isPublished: true,
              publishedAt: now,
            },
          });

          const profile = await tx.userProfile.findUnique({
            where: { userId: participation.workerId },
          });

          if (profile) {
            const newTotal = profile.totalReviewsCount + 1;
            const currentRep = Number(profile.reputationScore);
            const newRep = (currentRep * profile.totalReviewsCount + dto.rating) / newTotal;
            await tx.userProfile.update({
              where: { id: profile.id },
              data: {
                totalReviewsCount: newTotal,
                reputationScore: parseFloat(newRep.toFixed(2)),
              },
            });
          }
        }

        // 3. Mark task completed if all slots are approved or closed
        const activeCount = await tx.workerParticipation.count({
          where: {
            taskId: participation.taskId,
            status: {
              in: [
                ParticipationStatus.IN_PROGRESS,
                ParticipationStatus.SUBMITTED,
                ParticipationStatus.UNDER_REVIEW,
                ParticipationStatus.REVISION_REQUESTED,
                ParticipationStatus.REVIEW_OVERDUE,
              ],
            },
          },
        });

        if (activeCount === 0 && participation.task.availableSlots === 0) {
          await tx.task.update({
            where: { id: participation.taskId },
            data: { status: TaskStatus.COMPLETED },
          });
        }

        await this.auditService.log({
          actorId: buyerId,
          actorRole: 'BUYER',
          action: 'WORK_APPROVED',
          resourceType: 'WorkerParticipation',
          resourceId: participationId,
          newState: {
            status: ParticipationStatus.APPROVED,
            workerPayoutCents: netPayoutCents.toString(),
            approvedAt: now,
          },
          ipAddress,
          reason: 'Buyer approved deliverables; payout disbursed',
        });

        return {
          success: true,
          participationId: updated.id,
          status: updated.status,
          approvedAt: updated.approvedAt,
          workerNetPayoutCents: netPayoutCents.toString(),
          formattedPayoutUSD: formattedPayout,
          message: 'Deliverables approved and payout disbursed to worker.',
        };
      });
    }

    if (dto.decision === ReviewDecision.REQUEST_REVISION) {
      if (participation.revisionsUsed >= participation.task.maxRevisions) {
        throw new BadRequestException(
          `Maximum revisions limit (${participation.task.maxRevisions}) reached. You must either approve or reject the submission.`,
        );
      }

      const updated = await this.prisma.workerParticipation.update({
        where: { id: participationId },
        data: {
          status: ParticipationStatus.REVISION_REQUESTED,
          revisionsUsed: { increment: 1 },
        },
      });

      await this.auditService.log({
        actorId: buyerId,
        actorRole: 'BUYER',
        action: 'REVISION_REQUESTED',
        resourceType: 'WorkerParticipation',
        resourceId: participationId,
        newState: {
          status: ParticipationStatus.REVISION_REQUESTED,
          revisionsUsed: updated.revisionsUsed,
          feedback: dto.feedback,
        },
        ipAddress,
        reason: dto.feedback,
      });

      return {
        success: true,
        participationId: updated.id,
        status: updated.status,
        revisionsUsed: updated.revisionsUsed,
        maxRevisions: participation.task.maxRevisions,
        feedback: dto.feedback,
      };
    }

    if (dto.decision === ReviewDecision.REJECT) {
      const updated = await this.prisma.workerParticipation.update({
        where: { id: participationId },
        data: {
          status: ParticipationStatus.REJECTED,
        },
      });

      await this.auditService.log({
        actorId: buyerId,
        actorRole: 'BUYER',
        action: 'WORK_REJECTED',
        resourceType: 'WorkerParticipation',
        resourceId: participationId,
        newState: { status: ParticipationStatus.REJECTED, reason: dto.feedback },
        ipAddress,
        reason: dto.feedback,
      });

      return {
        success: true,
        participationId: updated.id,
        status: updated.status,
        feedback: dto.feedback,
        appealWindowHours: 72,
      };
    }
  }

  /**
   * Check off individual milestone progress (progressPercentage derived from milestones)
   */
  async updateMilestoneProgress(
    workerId: string,
    participationId: string,
    milestoneId: string,
    isCompleted: boolean,
  ) {
    const participation = await this.prisma.workerParticipation.findUnique({
      where: { id: participationId },
      include: { milestones: true },
    });

    if (!participation) throw new NotFoundException('Participation record not found');
    if (participation.workerId !== workerId) throw new ForbiddenException('Not your work slot');

    const milestone = participation.milestones.find((m) => m.id === milestoneId);
    if (!milestone) throw new NotFoundException('Milestone not found for this participation');

    await this.prisma.progressMilestone.update({
      where: { id: milestoneId },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // Recalculate derived progress percentage
    const allMilestones = await this.prisma.progressMilestone.findMany({
      where: { participationId },
    });

    const completedCount = allMilestones.filter((m) => m.isCompleted).length;
    const progressPercentage = allMilestones.length > 0
      ? Math.round((completedCount / allMilestones.length) * 100)
      : (isCompleted ? 100 : 0);

    const updated = await this.prisma.workerParticipation.update({
      where: { id: participationId },
      data: { progressPercentage },
    });

    return {
      success: true,
      milestoneId,
      isCompleted,
      progressPercentage: updated.progressPercentage,
    };
  }

  /**
   * Escalate overdue submission review past the 72h SLA
   */
  async escalateOverdueReview(userId: string, participationId: string, ipAddress?: string) {
    const participation = await this.prisma.workerParticipation.findUnique({
      where: { id: participationId },
      include: { task: true },
    });

    if (!participation) throw new NotFoundException('Participation record not found');
    if (participation.workerId !== userId && participation.task.buyerId !== userId) {
      throw new ForbiddenException('Not authorized for this participation');
    }

    if (participation.status !== ParticipationStatus.SUBMITTED && participation.status !== ParticipationStatus.UNDER_REVIEW) {
      throw new BadRequestException(`Cannot escalate review in ${participation.status} status`);
    }

    const now = new Date();
    if (participation.reviewOverdueAt && now < participation.reviewOverdueAt) {
      const remainingHours = Math.ceil((participation.reviewOverdueAt.getTime() - now.getTime()) / (1000 * 60 * 60));
      throw new BadRequestException(`Review SLA is still active. ${remainingHours} hours remaining before overdue escalation.`);
    }

    const updated = await this.prisma.workerParticipation.update({
      where: { id: participationId },
      data: { status: ParticipationStatus.REVIEW_OVERDUE },
    });

    await this.auditService.log({
      actorId: userId,
      actorRole: 'USER',
      action: 'REVIEW_SLA_BREACH_ESCALATED',
      resourceType: 'WorkerParticipation',
      resourceId: participationId,
      newState: { status: ParticipationStatus.REVIEW_OVERDUE },
      ipAddress,
      reason: '72-hour buyer review SLA breached without review decision',
    });

    return {
      success: true,
      participationId: updated.id,
      status: updated.status,
      message: 'Submission escalated to REVIEW_OVERDUE. Eligible for dispute arbitration.',
    };
  }
}
