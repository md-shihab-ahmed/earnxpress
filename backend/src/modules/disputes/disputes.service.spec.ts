import { Test, TestingModule } from '@nestjs/testing';
import { DisputesService } from './disputes.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DemoFinanceService } from '../demo-finance/demo-finance.service';
import { EvidenceService } from '../evidence/evidence.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DisputeStatus, ParticipationStatus, UserRole } from '@prisma/client';
import { DisputeVerdict } from './dto/resolve-dispute.dto';

describe('DisputesService', () => {
  let service: DisputesService;
  let prisma: any;
  let demoFinance: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((cb) => cb(prisma)),
      workerParticipation: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      dispute: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      evidenceFile: {
        updateMany: jest.fn(),
      },
    };

    demoFinance = {
      settleDisputeSplit: jest.fn().mockResolvedValue({}),
      refundDisputeToBuyer: jest.fn().mockResolvedValue({}),
      payoutDisputeToWorker: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn().mockResolvedValue(true) } },
        { provide: DemoFinanceService, useValue: demoFinance },
        {
          provide: EvidenceService,
          useValue: {
            generateSignedDownloadUrl: jest.fn().mockReturnValue('/api/v1/evidence/f1/download?token=xyz'),
          },
        },
      ],
    }).compile();

    service = module.get<DisputesService>(DisputesService);
  });

  describe('createDispute', () => {
    it('should prevent non-participants from creating a dispute', async () => {
      prisma.workerParticipation.findUnique.mockResolvedValue({
        id: 'p1',
        workerId: 'w1',
        task: { buyerId: 'b1' },
      });

      await expect(
        service.createDispute('intruder-id', 'WORKER', {
          participationId: 'p1',
          reasonCode: 'UNJUSTIFIED_REJECTION',
          statement: 'I want money',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject dispute if participation is in ineligible status like IN_PROGRESS', async () => {
      prisma.workerParticipation.findUnique.mockResolvedValue({
        id: 'p1',
        workerId: 'w1',
        status: ParticipationStatus.IN_PROGRESS,
        task: { buyerId: 'b1' },
        dispute: null,
      });

      await expect(
        service.createDispute('w1', 'WORKER', {
          participationId: 'p1',
          reasonCode: 'UNJUSTIFIED_REJECTION',
          statement: 'Unfair review',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow worker to initiate dispute on REJECTED slot', async () => {
      prisma.workerParticipation.findUnique.mockResolvedValue({
        id: 'p1',
        workerId: 'w1',
        status: ParticipationStatus.REJECTED,
        task: { buyerId: 'b1' },
        dispute: null,
      });
      prisma.dispute.create.mockResolvedValue({
        id: 'd1',
        participationId: 'p1',
        status: DisputeStatus.OPEN,
        reasonCode: 'UNJUSTIFIED_REJECTION',
        createdAt: new Date(),
      });
      prisma.workerParticipation.update.mockResolvedValue({
        id: 'p1',
        status: ParticipationStatus.DISPUTED,
      });

      const result = await service.createDispute('w1', 'WORKER', {
        participationId: 'p1',
        reasonCode: 'UNJUSTIFIED_REJECTION',
        statement: 'Deliverables fully matched specification.',
      });

      expect(result.success).toBe(true);
      expect(result.disputeId).toBe('d1');
      expect(prisma.workerParticipation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: ParticipationStatus.DISPUTED },
        }),
      );
    });
  });

  describe('resolveDispute', () => {
    it('should enforce that split amounts equal total unit budget', async () => {
      prisma.dispute.findUnique.mockResolvedValue({
        id: 'd1',
        status: DisputeStatus.OPEN,
        participationId: 'p1',
        participation: {
          id: 'p1',
          workerId: 'w1',
          task: { id: 't1', buyerId: 'b1', unitBudgetCents: 10000n },
        },
      });

      await expect(
        service.resolveDispute('admin-1', 'SUPER_ADMIN', 'd1', {
          verdict: DisputeVerdict.SPLIT_SETTLEMENT,
          workerPayoutCents: '7000',
          buyerRefundCents: '2000', // sum = 9000, mismatch with 10000
          arbitrationNotes: 'Invalid split test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should resolve split dispute and disburse via double-entry ledger', async () => {
      prisma.dispute.findUnique.mockResolvedValue({
        id: 'd1',
        status: DisputeStatus.OPEN,
        participationId: 'p1',
        participation: {
          id: 'p1',
          workerId: 'w1',
          task: { id: 't1', buyerId: 'b1', unitBudgetCents: 10000n },
        },
      });
      prisma.dispute.update.mockResolvedValue({
        id: 'd1',
        status: DisputeStatus.RESOLVED,
        verdict: DisputeVerdict.SPLIT_SETTLEMENT,
        resolvedAt: new Date(),
      });
      prisma.workerParticipation.update.mockResolvedValue({});

      const res = await service.resolveDispute('admin-1', 'SUPER_ADMIN', 'd1', {
        verdict: DisputeVerdict.SPLIT_SETTLEMENT,
        workerPayoutCents: '6000',
        buyerRefundCents: '4000',
        arbitrationNotes: 'Split 60/40 justified.',
      });

      expect(res.success).toBe(true);
      expect(res.verdict).toBe(DisputeVerdict.SPLIT_SETTLEMENT);
      expect(res.workerPayoutUSD).toBe('$60.00');
      expect(res.buyerRefundUSD).toBe('$40.00');
      expect(demoFinance.settleDisputeSplit).toHaveBeenCalledWith(
        'b1',
        'w1',
        't1',
        'p1',
        10000n,
        6000n,
        4000n,
        expect.anything(),
      );
    });
  });
});
