import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DemoFinanceService } from '../demo-finance/demo-finance.service';
import { EvidenceService } from '../evidence/evidence.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto, DisputeVerdict } from './dto/resolve-dispute.dto';
import { DisputeStatus, ParticipationStatus, UserRole } from '@prisma/client';

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);
  private readonly adminRoles: UserRole[] = [
    UserRole.PLATFORM_OWNER,
    UserRole.SUPER_ADMIN,
    UserRole.MODERATOR,
    UserRole.SUPPORT_AGENT,
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly demoFinanceService: DemoFinanceService,
    private readonly evidenceService: EvidenceService,
  ) {}

  /**
   * Worker or Buyer initiates a dispute on a participation slot
   */
  async createDispute(
    userId: string,
    userRole: string,
    dto: CreateDisputeDto,
    ipAddress?: string,
  ) {
    const participation = await this.prisma.workerParticipation.findUnique({
      where: { id: dto.participationId },
      include: {
        task: true,
        dispute: true,
      },
    });

    if (!participation) {
      throw new NotFoundException('Participation slot not found');
    }

    // Must be either the worker or the buyer
    const isWorker = participation.workerId === userId;
    const isBuyer = participation.task.buyerId === userId;

    if (!isWorker && !isBuyer && userRole !== UserRole.PLATFORM_OWNER && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the assigned worker or task buyer can initiate a dispute');
    }

    if (participation.dispute) {
      throw new BadRequestException('A dispute already exists for this participation slot');
    }

    const eligibleStatuses: ParticipationStatus[] = [
      ParticipationStatus.SUBMITTED,
      ParticipationStatus.UNDER_REVIEW,
      ParticipationStatus.REVISION_REQUESTED,
      ParticipationStatus.REVIEW_OVERDUE,
      ParticipationStatus.REJECTED,
    ];

    if (!eligibleStatuses.includes(participation.status)) {
      throw new BadRequestException(
        `Cannot dispute a participation in current status: ${participation.status}. Eligible statuses: ${eligibleStatuses.join(', ')}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Dispute
      const dispute = await tx.dispute.create({
        data: {
          participationId: dto.participationId,
          initiatorId: userId,
          status: DisputeStatus.OPEN,
          reasonCode: dto.reasonCode,
          statement: dto.statement,
        },
      });

      // 2. Transition Participation to DISPUTED
      await tx.workerParticipation.update({
        where: { id: dto.participationId },
        data: {
          status: ParticipationStatus.DISPUTED,
        },
      });

      // 3. Link evidence files if provided
      if (dto.evidenceFileIds && dto.evidenceFileIds.length > 0) {
        await tx.evidenceFile.updateMany({
          where: { id: { in: dto.evidenceFileIds } },
          data: { disputeId: dispute.id },
        });
      }

      await this.auditService.log({
        actorId: userId,
        actorRole: userRole,
        action: 'DISPUTE_INITIATED',
        resourceType: 'Dispute',
        resourceId: dispute.id,
        newState: {
          participationId: dto.participationId,
          reasonCode: dto.reasonCode,
          status: DisputeStatus.OPEN,
        },
        ipAddress,
        reason: dto.statement,
      });

      return {
        success: true,
        disputeId: dispute.id,
        participationId: dto.participationId,
        status: dispute.status,
        reasonCode: dispute.reasonCode,
        createdAt: dispute.createdAt,
      };
    });
  }

  /**
   * List disputes with role-based filtering
   */
  async getDisputes(userId: string, userRole: string, statusFilter?: DisputeStatus) {
    const isAdmin = this.adminRoles.includes(userRole as UserRole);

    const whereClause: any = {};
    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    if (!isAdmin) {
      if (userRole === UserRole.BUYER) {
        whereClause.participation = {
          task: { buyerId: userId },
        };
      } else if (userRole === UserRole.WORKER) {
        whereClause.participation = {
          workerId: userId,
        };
      } else {
        whereClause.initiatorId = userId;
      }
    }

    const disputes = await this.prisma.dispute.findMany({
      where: whereClause,
      include: {
        initiator: {
          select: { id: true, email: true, primaryRole: true, profile: { select: { displayName: true } } },
        },
        participation: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                unitBudgetCents: true,
                buyerId: true,
                escrowFundingStatus: true,
                buyer: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
              },
            },
            worker: {
              select: { id: true, email: true, profile: { select: { displayName: true } } },
            },
            slot: { select: { slotNumber: true } },
          },
        },
        evidenceFiles: {
          select: { id: true, originalFilename: true, mimeType: true, sizeBytes: true, isScannedClean: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return disputes.map((d) => ({
      id: d.id,
      status: d.status,
      reasonCode: d.reasonCode,
      statement: d.statement,
      verdict: d.verdict,
      workerPayoutUSD: d.workerPayoutCents ? `$${(Number(d.workerPayoutCents) / 100).toFixed(2)}` : null,
      buyerRefundUSD: d.buyerRefundCents ? `$${(Number(d.buyerRefundCents) / 100).toFixed(2)}` : null,
      createdAt: d.createdAt,
      resolvedAt: d.resolvedAt,
      task: {
        id: d.participation.task.id,
        title: d.participation.task.title,
        unitBudgetUSD: `$${(Number(d.participation.task.unitBudgetCents) / 100).toFixed(2)}`,
        escrowFundingStatus: d.participation.task.escrowFundingStatus,
      },
      buyer: {
        id: d.participation.task.buyer.id,
        name: d.participation.task.buyer.profile?.displayName || d.participation.task.buyer.email,
      },
      worker: {
        id: d.participation.worker.id,
        name: d.participation.worker.profile?.displayName || d.participation.worker.email,
      },
      initiator: {
        id: d.initiator.id,
        name: d.initiator.profile?.displayName || d.initiator.email,
        primaryRole: d.initiator.primaryRole,
      },
      slotNumber: d.participation.slot.slotNumber,
      evidenceFilesCount: d.evidenceFiles.length,
    }));
  }

  /**
   * Get complete arbitration dossier for a dispute
   */
  async getDisputeById(disputeId: string, userId: string, userRole: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        initiator: {
          select: { id: true, email: true, primaryRole: true, profile: true },
        },
        participation: {
          include: {
            task: {
              include: {
                buyer: { select: { id: true, email: true, profile: true } },
                instructionVersions: { orderBy: { versionNumber: 'desc' } },
              },
            },
            worker: { select: { id: true, email: true, profile: true } },
            slot: true,
            submissions: {
              include: {
                versions: {
                  orderBy: { versionNumber: 'desc' },
                  include: { evidenceFiles: true },
                },
              },
            },
          },
        },
        evidenceFiles: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const isAdmin = this.adminRoles.includes(userRole as UserRole);

    const isWorker = dispute.participation.workerId === userId;
    const isBuyer = dispute.participation.task.buyerId === userId;

    if (!isAdmin && !isWorker && !isBuyer) {
      throw new ForbiddenException('Not authorized to access this arbitration dossier');
    }

    // Map evidence with signed URLs
    const formattedEvidence = dispute.evidenceFiles.map((f) => ({
      id: f.id,
      originalFilename: f.originalFilename,
      mimeType: f.mimeType,
      sizeBytes: Number(f.sizeBytes),
      sha256Hash: f.sha256Hash,
      isScannedClean: f.isScannedClean,
      createdAt: f.createdAt,
      downloadUrl: this.evidenceService.generateSignedDownloadUrl(f.id, userId),
    }));

    return {
      id: dispute.id,
      status: dispute.status,
      reasonCode: dispute.reasonCode,
      statement: dispute.statement,
      verdict: dispute.verdict,
      arbitrationNotes: dispute.arbitrationNotes,
      workerPayoutCents: dispute.workerPayoutCents ? dispute.workerPayoutCents.toString() : null,
      buyerRefundCents: dispute.buyerRefundCents ? dispute.buyerRefundCents.toString() : null,
      createdAt: dispute.createdAt,
      resolvedAt: dispute.resolvedAt,
      task: {
        id: dispute.participation.task.id,
        title: dispute.participation.task.title,
        unitBudgetCents: dispute.participation.task.unitBudgetCents.toString(),
        unitBudgetUSD: `$${(Number(dispute.participation.task.unitBudgetCents) / 100).toFixed(2)}`,
        escrowFundingStatus: dispute.participation.task.escrowFundingStatus,
        activeInstructions: dispute.participation.task.instructionVersions[0] || null,
      },
      participation: {
        id: dispute.participation.id,
        status: dispute.participation.status,
        slotNumber: dispute.participation.slot.slotNumber,
        progressPercentage: dispute.participation.progressPercentage,
        submittedAt: dispute.participation.submittedAt,
        revisionsUsed: dispute.participation.revisionsUsed,
        submissions: dispute.participation.submissions,
      },
      buyer: {
        id: dispute.participation.task.buyer.id,
        email: dispute.participation.task.buyer.email,
        name: dispute.participation.task.buyer.profile?.displayName || dispute.participation.task.buyer.email,
        displayName: dispute.participation.task.buyer.profile?.displayName,
      },
      worker: {
        id: dispute.participation.worker.id,
        email: dispute.participation.worker.email,
        name: dispute.participation.worker.profile?.displayName || dispute.participation.worker.email,
        displayName: dispute.participation.worker.profile?.displayName,
        reputationScore: dispute.participation.worker.profile?.reputationScore,
      },
      initiator: {
        id: dispute.initiator.id,
        email: dispute.initiator.email,
        name: dispute.initiator.profile?.displayName || dispute.initiator.email,
        primaryRole: dispute.initiator.primaryRole,
        displayName: dispute.initiator.profile?.displayName,
      },
      evidenceFiles: formattedEvidence,
    };
  }

  /**
   * Submit additional evidence to an active dispute
   */
  async addEvidenceToDispute(
    disputeId: string,
    userId: string,
    evidenceFileIds: string[],
    ipAddress?: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { participation: { include: { task: true } } },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.DISMISSED) {
      throw new BadRequestException('Cannot add evidence to an already closed dispute');
    }

    const isWorker = dispute.participation.workerId === userId;
    const isBuyer = dispute.participation.task.buyerId === userId;
    if (!isWorker && !isBuyer) {
      throw new ForbiddenException('Only the dispute participants can attach evidence');
    }

    await this.prisma.evidenceFile.updateMany({
      where: { id: { in: evidenceFileIds }, uploaderId: userId },
      data: { disputeId },
    });

    await this.prisma.dispute.update({
      where: { id: disputeId },
      data: { status: DisputeStatus.EVIDENCE_SUBMITTED },
    });

    await this.auditService.log({
      actorId: userId,
      actorRole: isBuyer ? 'BUYER' : 'WORKER',
      action: 'DISPUTE_EVIDENCE_ATTACHED',
      resourceType: 'Dispute',
      resourceId: disputeId,
      newState: { attachedFiles: evidenceFileIds },
      ipAddress,
      reason: 'Party attached supplementary evidence',
    });

    return { success: true, disputeId, attachedCount: evidenceFileIds.length };
  }

  /**
   * Admin arbitration ruling on a dispute
   * Resolves escrow funds atomically via double-entry ledger
   */
  async resolveDispute(
    adminId: string,
    adminRole: string,
    disputeId: string,
    dto: ResolveDisputeDto,
    ipAddress?: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        participation: {
          include: {
            task: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new BadRequestException('Dispute is already resolved');
    }

    if (dispute.status === DisputeStatus.DISMISSED) {
      throw new BadRequestException('Dispute is already dismissed');
    }

    const task = dispute.participation.task;
    const unitBudgetCents = BigInt(task.unitBudgetCents);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Pessimistic row-level lock on Dispute to serialize concurrent arbitration attempts
      let lockedStatus = dispute.status;
      if (typeof tx.$queryRaw === 'function') {
        const lockedDisputeRows: any[] = await tx.$queryRaw`
          SELECT "id", "status", "participationId"
          FROM "Dispute"
          WHERE "id" = ${disputeId}::uuid
          FOR UPDATE
        `;

        if (lockedDisputeRows && lockedDisputeRows.length > 0) {
          lockedStatus = lockedDisputeRows[0].status;
        }

        // 2. Pessimistic row-level lock on WorkerParticipation
        const lockedPartRows: any[] = await tx.$queryRaw`
          SELECT "id", "status"
          FROM "WorkerParticipation"
          WHERE "id" = ${dispute.participationId}::uuid
          FOR UPDATE
        `;

        if (lockedPartRows && lockedPartRows.length > 0 && lockedPartRows[0].status !== ParticipationStatus.DISPUTED) {
          throw new BadRequestException(
            `Participation slot is not in DISPUTED status (current: ${lockedPartRows[0].status})`,
          );
        }
      }

      if (lockedStatus === DisputeStatus.RESOLVED) {
        throw new BadRequestException('Dispute is already resolved');
      }
      if (lockedStatus === DisputeStatus.DISMISSED) {
        throw new BadRequestException('Dispute is already dismissed');
      }

      let workerPayout = 0n;
      let buyerRefund = 0n;
      let newParticipationStatus: ParticipationStatus = ParticipationStatus.REJECTED;

      if (dto.verdict === DisputeVerdict.SETTLE_WORKER) {
        workerPayout = unitBudgetCents;
        buyerRefund = 0n;
        newParticipationStatus = ParticipationStatus.APPROVED;

        // Disburse DEMO payout to worker
        await this.demoFinanceService.payoutDisputeToWorker(
          task.buyerId,
          dispute.participation.workerId,
          task.id,
          dispute.participation.id,
          unitBudgetCents,
          tx,
        );
      } else if (dto.verdict === DisputeVerdict.REFUND_BUYER) {
        workerPayout = 0n;
        buyerRefund = unitBudgetCents;
        newParticipationStatus = ParticipationStatus.REJECTED;

        // Refund DEMO escrow to buyer
        await this.demoFinanceService.refundDisputeToBuyer(
          task.buyerId,
          task.id,
          dispute.participation.id,
          unitBudgetCents,
          tx,
        );
      } else if (dto.verdict === DisputeVerdict.SPLIT_SETTLEMENT) {
        if (!dto.workerPayoutCents || !dto.buyerRefundCents) {
          throw new BadRequestException(
            'workerPayoutCents and buyerRefundCents are mandatory for SPLIT_SETTLEMENT',
          );
        }

        workerPayout = BigInt(dto.workerPayoutCents);
        buyerRefund = BigInt(dto.buyerRefundCents);

        if (workerPayout + buyerRefund !== unitBudgetCents) {
          throw new BadRequestException(
            `Split amounts (${workerPayout} + ${buyerRefund}) must equal task unit budget (${unitBudgetCents})`,
          );
        }

        newParticipationStatus = ParticipationStatus.APPROVED;

        // Settle split in demo finance
        await this.demoFinanceService.settleDisputeSplit(
          task.buyerId,
          dispute.participation.workerId,
          task.id,
          dispute.participation.id,
          unitBudgetCents,
          workerPayout,
          buyerRefund,
          tx,
        );
      } else if (dto.verdict === DisputeVerdict.DISMISS) {
        // Dismiss dispute - returns participation to REJECTED or retains prior state
        await tx.dispute.update({
          where: { id: disputeId },
          data: {
            status: DisputeStatus.DISMISSED,
            verdict: dto.verdict,
            assignedModeratorId: adminId,
            arbitrationNotes: dto.arbitrationNotes,
            resolvedAt: now,
          },
        });

        await tx.workerParticipation.update({
          where: { id: dispute.participationId },
          data: { status: ParticipationStatus.REJECTED },
        });

        await this.auditService.log({
          actorId: adminId,
          actorRole: adminRole,
          action: 'DISPUTE_DISMISSED',
          resourceType: 'Dispute',
          resourceId: disputeId,
          newState: { verdict: dto.verdict, arbitrationNotes: dto.arbitrationNotes },
          ipAddress,
          reason: dto.arbitrationNotes,
        });

        return {
          success: true,
          disputeId,
          status: DisputeStatus.DISMISSED,
          verdict: dto.verdict,
          resolvedAt: now,
        };
      }

      // Update Dispute record
      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          verdict: dto.verdict,
          workerPayoutCents: workerPayout,
          buyerRefundCents: buyerRefund,
          assignedModeratorId: adminId,
          arbitrationNotes: dto.arbitrationNotes,
          resolvedAt: now,
        },
      });

      // Update WorkerParticipation status
      await tx.workerParticipation.update({
        where: { id: dispute.participationId },
        data: {
          status: newParticipationStatus,
          approvedAt: newParticipationStatus === ParticipationStatus.APPROVED ? now : null,
        },
      });

      await this.auditService.log({
        actorId: adminId,
        actorRole: adminRole,
        action: 'DISPUTE_ARBITRATION_RESOLVED',
        resourceType: 'Dispute',
        resourceId: disputeId,
        newState: {
          verdict: dto.verdict,
          workerPayoutCents: workerPayout.toString(),
          buyerRefundCents: buyerRefund.toString(),
          arbitrationNotes: dto.arbitrationNotes,
          resolvedAt: now,
        },
        ipAddress,
        reason: dto.arbitrationNotes,
      });

      return {
        success: true,
        disputeId: updatedDispute.id,
        status: updatedDispute.status,
        verdict: updatedDispute.verdict,
        workerPayoutUSD: `$${(Number(workerPayout) / 100).toFixed(2)}`,
        buyerRefundUSD: `$${(Number(buyerRefund) / 100).toFixed(2)}`,
        arbitrationNotes: updatedDispute.arbitrationNotes,
        resolvedAt: updatedDispute.resolvedAt,
      };
    });
  }
}
