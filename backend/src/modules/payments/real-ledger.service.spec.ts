import { Test, TestingModule } from '@nestjs/testing';
import { RealLedgerService } from './real-ledger.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RealAccountType } from '@prisma/client';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('RealLedgerService', () => {
  let service: RealLedgerService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      realLedgerAccount: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      realLedgerTransaction: {
        findUnique: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      realLedgerEntry: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealLedgerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RealLedgerService>(RealLedgerService);
  });

  describe('recordDoubleEntryTransaction', () => {
    it('should reject non-positive transaction amounts', async () => {
      await expect(
        service.recordDoubleEntryTransaction(mockPrisma, {
          referenceType: 'TEST',
          referenceId: 'ref-1',
          description: 'Zero test',
          debitAccount: { accountType: RealAccountType.SYSTEM_PAYMENT_CLEARING },
          creditAccount: { accountType: RealAccountType.BUYER_REAL_AVAILABLE },
          amountCents: BigInt(0),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should skip duplicate transaction if idempotency key already exists', async () => {
      mockPrisma.realLedgerTransaction.findUnique.mockResolvedValue({
        id: 'existing-tx',
        idempotencyKey: 'idem-123',
      });

      const res = await service.recordDoubleEntryTransaction(mockPrisma, {
        referenceType: 'TEST',
        referenceId: 'ref-1',
        idempotencyKey: 'idem-123',
        description: 'Duplicate test',
        debitAccount: { accountType: RealAccountType.SYSTEM_PAYMENT_CLEARING },
        creditAccount: { accountType: RealAccountType.BUYER_REAL_AVAILABLE },
        amountCents: BigInt(5000),
      });

      expect(res.id).toBe('existing-tx');
      expect(mockPrisma.realLedgerEntry.create).not.toHaveBeenCalled();
    });

    it('should enforce balance sufficiency for client debit accounts', async () => {
      mockPrisma.realLedgerTransaction.findUnique.mockResolvedValue(null);
      // Debit account has only $10.00 (1000 cents), but needs $50.00 (5000 cents)
      mockPrisma.realLedgerAccount.findFirst
        .mockResolvedValueOnce({
          id: 'acc-buyer',
          accountType: RealAccountType.BUYER_REAL_AVAILABLE,
          balanceCents: BigInt(1000),
        })
        .mockResolvedValueOnce({
          id: 'acc-escrow',
          accountType: RealAccountType.BUYER_REAL_ESCROW_LOCKED,
          balanceCents: BigInt(0),
        });

      await expect(
        service.recordDoubleEntryTransaction(mockPrisma, {
          referenceType: 'TASK_ESCROW_LOCK',
          referenceId: 'task-1',
          description: 'Lock escrow',
          debitAccount: { userId: 'u1', accountType: RealAccountType.BUYER_REAL_AVAILABLE },
          creditAccount: { userId: 'u1', accountType: RealAccountType.BUYER_REAL_ESCROW_LOCKED },
          amountCents: BigInt(5000),
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should atomically create balanced debit and credit entries and update account balances', async () => {
      mockPrisma.realLedgerTransaction.findUnique.mockResolvedValue(null);
      mockPrisma.realLedgerAccount.findFirst
        .mockResolvedValueOnce({
          id: 'acc-clearing',
          accountType: RealAccountType.SYSTEM_PAYMENT_CLEARING,
          balanceCents: BigInt(0),
        })
        .mockResolvedValueOnce({
          id: 'acc-buyer',
          accountType: RealAccountType.BUYER_REAL_AVAILABLE,
          balanceCents: BigInt(0),
        });

      mockPrisma.realLedgerTransaction.create.mockResolvedValue({ id: 'tx-1' });
      mockPrisma.realLedgerEntry.create.mockResolvedValue({ id: 'entry-1' });

      await service.recordDoubleEntryTransaction(mockPrisma, {
        referenceType: 'BUYER_DEPOSIT',
        referenceId: 'ord-1',
        description: 'Deposit funds',
        debitAccount: { accountType: RealAccountType.SYSTEM_PAYMENT_CLEARING },
        creditAccount: { userId: 'u1', accountType: RealAccountType.BUYER_REAL_AVAILABLE },
        amountCents: BigInt(10000),
      });

      expect(mockPrisma.realLedgerEntry.create).toHaveBeenCalledWith({
        data: {
          transactionId: 'tx-1',
          debitAccountId: 'acc-clearing',
          creditAccountId: 'acc-buyer',
          amountCents: BigInt(10000),
        },
      });

      expect(mockPrisma.realLedgerAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-clearing' },
        data: { balanceCents: { decrement: BigInt(10000) } },
      });

      expect(mockPrisma.realLedgerAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-buyer' },
        data: { balanceCents: { increment: BigInt(10000) } },
      });
    });
  });

  describe('reconcileRealLedger', () => {
    it('should mathematically verify total debited equals total credited', async () => {
      mockPrisma.realLedgerAccount.findMany.mockResolvedValue([
        { accountType: RealAccountType.BUYER_REAL_AVAILABLE, balanceCents: BigInt(10000) },
        { accountType: RealAccountType.SYSTEM_COMMISSION_REVENUE, balanceCents: BigInt(500) },
      ]);
      mockPrisma.realLedgerEntry.findMany.mockResolvedValue([
        { amountCents: BigInt(10000) },
        { amountCents: BigInt(500) },
      ]);
      mockPrisma.realLedgerTransaction.count.mockResolvedValue(2);

      const audit = await service.reconcileRealLedger();

      expect(audit.isDoubleEntryBalanced).toBe(true);
      expect(audit.totalTransactions).toBe(2);
      expect(audit.totalEntries).toBe(2);
      expect(audit.totalDebitedUSD).toBe('$105.00 USD');
      expect(audit.totalCreditedUSD).toBe('$105.00 USD');
    });
  });
});
