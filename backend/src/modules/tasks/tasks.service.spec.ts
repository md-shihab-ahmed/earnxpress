import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DemoFinanceService } from '../demo-finance/demo-finance.service';
import { AuditService } from '../audit/audit.service';
import { TaskModel, TaskStatus, ParticipationStatus } from '@prisma/client';
import { ReviewDecision } from './dto/review-submission.dto';

describe('TasksService (Open Marketplace Multi-Worker Engine)', () => {
  let service: TasksService;
  let mockPrisma: any;
  let mockFinance: any;
  let mockAudit: any;

  beforeEach(async () => {
    mockPrisma = {
      task: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      taskSlot: {
        createMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      taskInstructionVersion: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      workerParticipation: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
        count: jest.fn(),
      },
      submission: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      submissionVersion: {
        create: jest.fn(),
      },
      review: {
        create: jest.fn(),
      },
      userProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      progressMilestone: {
        update: jest.fn(),
        findMany: jest.fn(),
      },
      conversation: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
      $queryRaw: jest.fn(),
    };

    mockFinance = {
      calculateFees: jest.fn().mockReturnValue({
        unitBudgetCents: 2000n,
        buyerFeeCents: 40n,
        workerFeeCents: 80n,
        workerNetPayoutCents: 1920n,
        totalSlotEscrowCents: 2040n,
        totalPlatformTakeCents: 120n,
      }),
      lockTaskEscrow: jest.fn().mockResolvedValue({ totalEscrowLockedCents: 102000n }),
      refundUnclaimedSlots: jest.fn().mockResolvedValue({ refundedCents: 50000n }),
      disburseSlotPayout: jest.fn().mockResolvedValue({
        transactionId: 'tx-payout-1',
        workerNetPayoutCents: 1920n,
        totalPlatformFeeCents: 120n,
      }),
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue({ id: 'audit-task' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: DemoFinanceService, useValue: mockFinance },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('1. Task Publishing & Escrow Locking', () => {
    it('should throw BadRequestException if fewer than two acceptance criteria are defined', async () => {
      await expect(
        service.createTask('buyer-1', {
          title: 'Translate English product titles',
          categoryId: 'cat-1',
          subcategoryId: 'subcat-1',
          taskModel: TaskModel.MULTI_WORKER,
          totalSlots: 10,
          unitBudgetCents: 2000,
          descriptionMarkdown: 'Translate accurately...',
          acceptanceCriteria: [{ key: 'grammar', description: 'No spelling errors' }], // Only 1
          deliverableRequirements: [{ type: 'TEXT', label: 'Translation text' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should lock demo escrow atomically and create Task, Slots, and Version 1 Instructions', async () => {
      const createdTask = {
        id: 'task-1',
        title: 'Translate 50 titles',
        status: TaskStatus.OPEN,
        totalSlots: 50,
        availableSlots: 50,
        unitBudgetCents: 2000n,
        totalEscrowCents: 102000n,
        createdAt: new Date(),
      };
      mockPrisma.task.create.mockResolvedValue(createdTask);
      mockPrisma.taskInstructionVersion.create.mockResolvedValue({ id: 'v1', versionNumber: 1 });

      const result = await service.createTask('buyer-1', {
        title: 'Translate 50 titles',
        categoryId: 'cat-1',
        subcategoryId: 'subcat-1',
        taskModel: TaskModel.MULTI_WORKER,
        totalSlots: 50,
        unitBudgetCents: 2000,
        descriptionMarkdown: 'Detailed translation specifications...',
        acceptanceCriteria: [
          { key: 'grammar', description: 'Grammatically flawless' },
          { key: 'tone', description: 'Professional commerce tone' },
        ],
        deliverableRequirements: [{ type: 'TEXT', label: 'Translated strings' }],
      });

      expect(result.id).toBe(createdTask.id);
      expect(result.totalSlots).toBe(50);
      expect(mockFinance.lockTaskEscrow).toHaveBeenCalled();
      expect(mockPrisma.taskSlot.createMany).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'TASK_PUBLISHED' }),
      );
    });
  });

  describe('2. Atomic Slot Acceptance & Concurrency Protection', () => {
    it('should throw ConflictException if task has 0 available slots', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { id: 'task-1', status: TaskStatus.FULL, availableSlots: 0, totalSlots: 10 },
      ]);

      await expect(service.acceptSlot('worker-1', 'task-1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if worker already holds an active slot on the same task', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { id: 'task-1', status: TaskStatus.OPEN, availableSlots: 5, totalSlots: 10 },
      ]);
      mockPrisma.workerParticipation.findFirst.mockResolvedValue({
        id: 'existing-part',
        status: ParticipationStatus.IN_PROGRESS,
      });

      await expect(service.acceptSlot('worker-1', 'task-1')).rejects.toThrow(ConflictException);
    });

    it('should atomically claim slot and return isolated WorkerParticipation record', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          id: 'task-1',
          status: TaskStatus.OPEN,
          availableSlots: 5,
          totalSlots: 10,
          startDeadlineHours: 6,
          completionDurationHours: 24,
          currentVersionNumber: 1,
        },
      ]);
      mockPrisma.workerParticipation.findFirst.mockResolvedValue(null);
      mockPrisma.taskSlot.findFirst.mockResolvedValue({ id: 'slot-1', slotNumber: 1, isClaimed: false });
      mockPrisma.taskInstructionVersion.findUnique.mockResolvedValue({ id: 'v1', versionNumber: 1 });
      mockPrisma.workerParticipation.create.mockResolvedValue({
        id: 'new-part-1',
        status: ParticipationStatus.IN_PROGRESS,
        startDeadlineAt: new Date(Date.now() + 6 * 3600000),
        executionDeadlineAt: new Date(Date.now() + 24 * 3600000),
      });

      const result = await service.acceptSlot('worker-1', 'task-1');

      expect(result.success).toBe(true);
      expect(result.participationId).toBe('new-part-1');
      expect(result.slotNumber).toBe(1);
      expect(mockPrisma.taskSlot.update).toHaveBeenCalledWith({
        where: { id: 'slot-1' },
        data: { isClaimed: true },
      });
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { availableSlots: 4, status: TaskStatus.OPEN },
      });
    });
  });

  describe('3. Task Management Controls (Close Remaining Slots)', () => {
    it('should close unfilled slots and refund unallocated demo escrow to Buyer', async () => {
      const buyerId = 'buyer-1';
      const taskId = 'task-1';
      mockPrisma.task.findUnique.mockResolvedValue({
        id: taskId,
        buyerId,
        availableSlots: 20,
        unitBudgetCents: 2000n,
        status: TaskStatus.OPEN,
      });
      mockPrisma.task.update.mockResolvedValue({ id: taskId, status: TaskStatus.CLOSED });

      const result = await service.closeRemainingSlots(buyerId, taskId);

      expect(result.closedSlots).toBe(20);
      expect(mockFinance.refundUnclaimedSlots).toHaveBeenCalledWith(
        buyerId,
        taskId,
        20,
        2000n,
        mockPrisma,
      );
    });

    it('should reject closing slots if user is not the task creator', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        buyerId: 'different-buyer',
      });

      await expect(service.closeRemainingSlots('attacker-id', 'task-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('4. Worker Deliverable Submission', () => {
    it('should reject submission if worker does not own the participation record', async () => {
      mockPrisma.workerParticipation.findUnique.mockResolvedValue({
        id: 'part-1',
        workerId: 'worker-legit',
        task: { reviewSlaHours: 72 },
        status: ParticipationStatus.IN_PROGRESS,
        executionDeadlineAt: new Date(Date.now() + 3600000),
      });

      await expect(
        service.submitWork('worker-attacker', 'part-1', {
          content: 'Here are the deliverables for this task.',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject submission if status is not IN_PROGRESS or REVISION_REQUESTED', async () => {
      mockPrisma.workerParticipation.findUnique.mockResolvedValue({
        id: 'part-1',
        workerId: 'worker-1',
        task: { reviewSlaHours: 72 },
        status: ParticipationStatus.APPROVED,
        executionDeadlineAt: new Date(Date.now() + 3600000),
      });

      await expect(
        service.submitWork('worker-1', 'part-1', {
          content: 'Trying to submit again after already approved.',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject submission if execution deadline has expired', async () => {
      mockPrisma.workerParticipation.findUnique.mockResolvedValue({
        id: 'part-1',
        workerId: 'worker-1',
        task: { reviewSlaHours: 72 },
        status: ParticipationStatus.IN_PROGRESS,
        executionDeadlineAt: new Date(Date.now() - 3600000), // Expired 1 hr ago
      });

      await expect(
        service.submitWork('worker-1', 'part-1', {
          content: 'Deliverables submitted late after deadline.',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully submit deliverables, increment version, and set review SLA', async () => {
      const futureDeadline = new Date(Date.now() + 24 * 3600000);
      mockPrisma.workerParticipation.findUnique.mockResolvedValue({
        id: 'part-1',
        workerId: 'worker-1',
        task: { reviewSlaHours: 72 },
        status: ParticipationStatus.IN_PROGRESS,
        executionDeadlineAt: futureDeadline,
      });
      mockPrisma.submission.findFirst.mockResolvedValue(null);
      mockPrisma.submission.create.mockResolvedValue({ id: 'sub-1', currentVersion: 1 });
      mockPrisma.submissionVersion.create.mockResolvedValue({ id: 'subv-1', versionNumber: 1 });
      mockPrisma.workerParticipation.update.mockResolvedValue({
        id: 'part-1',
        status: ParticipationStatus.SUBMITTED,
        submittedAt: new Date(),
        reviewOverdueAt: new Date(Date.now() + 72 * 3600000),
      });

      const result = await service.submitWork('worker-1', 'part-1', {
        content: 'Finished data translation with all acceptance criteria met.',
        deliverableUrls: ['https://storage.earnxpress.demo/files/translation.json'],
      });

      expect(result.success).toBe(true);
      expect(result.submissionVersion).toBe(1);
      expect(result.status).toBe(ParticipationStatus.SUBMITTED);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'WORK_SUBMITTED' }),
      );
    });
  });

  describe('5. Buyer Review & Payout Disbursal', () => {
    it('should reject review if caller is not the task buyer', async () => {
      mockPrisma.workerParticipation.findUnique.mockResolvedValue({
        id: 'part-1',
        task: { buyerId: 'buyer-owner' },
        status: ParticipationStatus.SUBMITTED,
      });

      await expect(
        service.reviewParticipation('buyer-imposter', 'part-1', {
          decision: ReviewDecision.APPROVE,
          feedback: 'Approving without authorization.',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should release demo escrow and approve work on APPROVE decision', async () => {
      mockPrisma.workerParticipation.findUnique.mockResolvedValue({
        id: 'part-1',
        taskId: 'task-1',
        workerId: 'worker-1',
        task: { buyerId: 'buyer-1', unitBudgetCents: 2000n, availableSlots: 0 },
        status: ParticipationStatus.SUBMITTED,
        submissions: [{ id: 'sub-1', versions: [{ versionNumber: 1 }] }],
      });
      mockPrisma.workerParticipation.update.mockResolvedValue({
        id: 'part-1',
        status: ParticipationStatus.APPROVED,
        approvedAt: new Date(),
      });
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        id: 'prof-worker',
        totalReviewsCount: 4,
        reputationScore: 5.0,
      });
      mockPrisma.workerParticipation.count.mockResolvedValue(0); // All slots settled

      const result = await service.reviewParticipation('buyer-1', 'part-1', {
        decision: ReviewDecision.APPROVE,
        feedback: 'Excellent work quality and fast delivery!',
        rating: 5,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(ParticipationStatus.APPROVED);
      expect(mockFinance.disburseSlotPayout).toHaveBeenCalledWith(
        'buyer-1',
        'worker-1',
        'task-1',
        'part-1',
        2000n,
        mockPrisma,
      );
      expect(mockPrisma.review.create).toHaveBeenCalled();
      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: TaskStatus.COMPLETED } }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'WORK_APPROVED' }),
      );
    });

    it('should request revision and increment revisionsUsed', async () => {
      mockPrisma.workerParticipation.findUnique.mockResolvedValue({
        id: 'part-1',
        taskId: 'task-1',
        workerId: 'worker-1',
        revisionsUsed: 0,
        task: { buyerId: 'buyer-1', maxRevisions: 2 },
        status: ParticipationStatus.SUBMITTED,
      });
      mockPrisma.workerParticipation.update.mockResolvedValue({
        id: 'part-1',
        status: ParticipationStatus.REVISION_REQUESTED,
        revisionsUsed: 1,
      });

      const result = await service.reviewParticipation('buyer-1', 'part-1', {
        decision: ReviewDecision.REQUEST_REVISION,
        feedback: 'Please fix typo in section 3.',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(ParticipationStatus.REVISION_REQUESTED);
      expect((result as any).revisionsUsed).toBe(1);
    });

    it('should reject requesting revision if maxRevisions limit is exceeded', async () => {
      mockPrisma.workerParticipation.findUnique.mockResolvedValue({
        id: 'part-1',
        taskId: 'task-1',
        workerId: 'worker-1',
        revisionsUsed: 2,
        task: { buyerId: 'buyer-1', maxRevisions: 2 },
        status: ParticipationStatus.SUBMITTED,
      });

      await expect(
        service.reviewParticipation('buyer-1', 'part-1', {
          decision: ReviewDecision.REQUEST_REVISION,
          feedback: 'Need one more revision beyond the limit.',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject deliverables on REJECT decision', async () => {
      mockPrisma.workerParticipation.findUnique.mockResolvedValue({
        id: 'part-1',
        taskId: 'task-1',
        workerId: 'worker-1',
        task: { buyerId: 'buyer-1' },
        status: ParticipationStatus.SUBMITTED,
      });
      mockPrisma.workerParticipation.update.mockResolvedValue({
        id: 'part-1',
        status: ParticipationStatus.REJECTED,
      });

      const result = await service.reviewParticipation('buyer-1', 'part-1', {
        decision: ReviewDecision.REJECT,
        feedback: 'Deliverables did not meet published acceptance criteria.',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(ParticipationStatus.REJECTED);
      expect((result as any).appealWindowHours).toBe(72);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'WORK_REJECTED' }),
      );
    });
  });
});
