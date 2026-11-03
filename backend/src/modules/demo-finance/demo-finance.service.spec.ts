import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DemoFinanceService } from './demo-finance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DemoAccountType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('DemoFinanceService (Integer Cent Double-Entry Ledger Engine)', () => {
  let service: DemoFinanceService;
  let mockPrisma: any;
  let mockAudit: any;

  beforeEach(async () => {
    mockPrisma = {
      demoLedgerAccount: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      demoLedgerTransaction: {
        create: jest.fn(),
      },
      demoLedgerEntry: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemoFinanceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, def: any) => def),
          },
        },
      ],
    }).compile();

    service = module.get<DemoFinanceService>(DemoFinanceService);
  });

  describe('1. Fee Calculation & Integer Precision Math', () => {
    it('should accurately compute standard 2% Buyer and 4% Worker fees in integer cents ($100.00)', () => {
      const budgetCents = 10000n; // $100.00
      const result = service.calculateFees(budgetCents, 2.0, 4.0);

      expect(result.unitBudgetCents).toBe(10000n);
      expect(result.buyerFeeCents).toBe(200n); // $2.00
      expect(result.workerFeeCents).toBe(400n); // $4.00
      expect(result.workerNetPayoutCents).toBe(9600n); // $96.00
      expect(result.totalSlotEscrowCents).toBe(10200n); // $102.00
      expect(result.totalPlatformTakeCents).toBe(600n); // $6.00
    });

    it('should preserve double-entry invariant: Escrow = Net Payout + Total Platform Take', () => {
      const oddBudgets = [100n, 125n, 333n, 777n, 9999n, 123456n];
      for (const budget of oddBudgets) {
        const result = service.calculateFees(budget, 2.0, 4.0);
        expect(result.totalSlotEscrowCents).toBe(
          result.workerNetPayoutCents + result.totalPlatformTakeCents,
        );
      }
    });

    it('should accurately handle fractional half-up cent roundings without precision drift', () => {
      // $1.25 (125 cents): Buyer 2% = 2.5 -> 3 cents, Worker 4% = 5.0 -> 5 cents
      const result = service.calculateFees(125n, 2.0, 4.0);
      expect(result.buyerFeeCents).toBe(3n);
      expect(result.workerFeeCents).toBe(5n);
      expect(result.totalSlotEscrowCents).toBe(128n);
      expect(result.workerNetPayoutCents).toBe(120n);
      expect(result.totalPlatformTakeCents).toBe(8n);
    });
  });

  describe('2. Demo Faucet & Balance Minting', () => {
    it('should reject non-positive faucet claim amounts', async () => {
      await expect(service.claimFaucet('user-1', 0n)).rejects.toThrow(BadRequestException);
      await expect(service.claimFaucet('user-1', -500n)).rejects.toThrow(BadRequestException);
    });

    it('should execute double-entry balanced transaction on faucet claim ($1,000.00)', async () => {
      const userId = 'buyer-123';
      const faucetAccount = { id: 'faucet-acc', balanceCents: 100000000000n };
      const buyerAccount = { id: 'buyer-acc', balanceCents: 0n };

      mockPrisma.demoLedgerAccount.findFirst.mockResolvedValue(faucetAccount);
      mockPrisma.demoLedgerAccount.findUnique.mockResolvedValue(buyerAccount);
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, primaryRole: 'BUYER' });
      mockPrisma.demoLedgerTransaction.create.mockResolvedValue({ id: 'tx-1' });
      mockPrisma.demoLedgerAccount.update.mockImplementation(({ data }: any) => {
        return {
          balanceCents: data.balanceCents.increment ? 100000n : 99999900000n,
        };
      });

      const result = await service.claimFaucet(userId, 100000n);

      expect(result.success).toBe(true);
      expect(result.formattedCreditedUSD).toBe('DEMO $1000.00 USD');
      expect(mockPrisma.demoLedgerEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          debitAccountId: faucetAccount.id,
          creditAccountId: buyerAccount.id,
          amountCents: 100000n,
        }),
      });
    });
  });

  describe('3. Escrow Locking & Insufficient Balance Protection', () => {
    it('should throw BadRequestException if Buyer available demo balance is insufficient to cover escrow + 2% fee', async () => {
      const buyerId = 'buyer-1';
      const taskId = 'task-1';
      const availableAccount = { id: 'buyer-avail', balanceCents: 5000n }; // $50.00 available
      const escrowAccount = { id: 'buyer-escrow', balanceCents: 0n };

      mockPrisma.demoLedgerAccount.findUnique.mockImplementation(({ where }: any) => {
        if (where.userId_accountType_currency.accountType === DemoAccountType.DEMO_BUYER_AVAILABLE) {
          return availableAccount;
        }
        return escrowAccount;
      });

      // 10 slots at $10.00 = $100.00 + $2.00 fee = $102.00 (10200 cents) required
      await expect(
        service.lockTaskEscrow(buyerId, taskId, 10, 1000n, mockPrisma),
      ).rejects.toThrow(BadRequestException);
    });

    it('should lock demo escrow atomically when available balance is sufficient', async () => {
      const buyerId = 'buyer-1';
      const taskId = 'task-1';
      const availableAccount = { id: 'buyer-avail', balanceCents: 20000n }; // $200.00 available
      const escrowAccount = { id: 'buyer-escrow', balanceCents: 0n };

      mockPrisma.demoLedgerAccount.findUnique.mockImplementation(({ where }: any) => {
        if (where.userId_accountType_currency.accountType === DemoAccountType.DEMO_BUYER_AVAILABLE) {
          return availableAccount;
        }
        return escrowAccount;
      });

      mockPrisma.demoLedgerTransaction.create.mockResolvedValue({ id: 'tx-lock-1' });

      // 10 slots at $10.00 = 10,200 cents escrow
      const result = await service.lockTaskEscrow(buyerId, taskId, 10, 1000n, mockPrisma);

      expect(result.totalEscrowLockedCents).toBe(10200n);
      expect(mockPrisma.demoLedgerEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          debitAccountId: availableAccount.id,
          creditAccountId: escrowAccount.id,
          amountCents: 10200n,
        }),
      });
    });
  });

  describe('4. Slot Payout Disbursement & Double-Entry Invariance', () => {
    it('should disburse net earnings to Worker and platform fee to Revenue account', async () => {
      const buyerId = 'buyer-1';
      const workerId = 'worker-1';
      const taskId = 'task-1';
      const participationId = 'part-1';
      const unitBudgetCents = 2000n; // $20.00

      const buyerEscrow = { id: 'escrow-acc', balanceCents: 5000n };
      const workerAvailable = { id: 'worker-avail', balanceCents: 0n };
      const revenueAccount = { id: 'rev-acc', balanceCents: 0n };

      mockPrisma.demoLedgerAccount.findFirst.mockResolvedValue(revenueAccount);
      mockPrisma.demoLedgerAccount.findUnique.mockImplementation(({ where }: any) => {
        if (where.userId_accountType_currency.accountType === DemoAccountType.DEMO_BUYER_ESCROW_RESERVED) {
          return buyerEscrow;
        }
        return workerAvailable;
      });
      mockPrisma.demoLedgerTransaction.create.mockResolvedValue({ id: 'tx-payout-1' });

      const result = await service.disburseSlotPayout(
        buyerId,
        workerId,
        taskId,
        participationId,
        unitBudgetCents,
        mockPrisma,
      );

      // Unit $20.00 (2000 cents): Worker fee 4% (80c) -> Net $19.20 (1920c). Platform take: 40c (Buyer) + 80c (Worker) = 120c.
      expect(result.workerNetPayoutCents).toBe(1920n);
      expect(result.totalPlatformFeeCents).toBe(120n);
      expect(mockPrisma.demoLedgerEntry.create).toHaveBeenCalledTimes(2);
    });
  });
});
