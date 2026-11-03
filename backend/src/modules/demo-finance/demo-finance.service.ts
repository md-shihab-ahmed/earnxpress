import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DemoAccountType } from '@prisma/client';

export interface FeeCalculationResult {
  unitBudgetCents: bigint;
  buyerFeeCents: bigint;
  workerFeeCents: bigint;
  workerNetPayoutCents: bigint;
  totalSlotEscrowCents: bigint;
  totalPlatformTakeCents: bigint;
}

@Injectable()
export class DemoFinanceService {
  private readonly logger = new Logger(DemoFinanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Calculate exact integer fees without floating-point inaccuracies
   * Banker's rounding / half-up integer cent arithmetic
   */
  calculateFees(
    unitBudgetCents: bigint,
    buyerFeeRate: number = 2.0,
    workerFeeRate: number = 4.0,
  ): FeeCalculationResult {
    // In integer minor units: fee = round(cents * rate / 100)
    // Formula for integer half-up: (cents * rate_num + 50) / 100
    const buyerRateNumerator = BigInt(Math.round(buyerFeeRate * 100)); // 2.0% -> 200
    const workerRateNumerator = BigInt(Math.round(workerFeeRate * 100)); // 4.0% -> 400

    const buyerFeeCents = (unitBudgetCents * buyerRateNumerator + 5000n) / 10000n;
    const workerFeeCents = (unitBudgetCents * workerRateNumerator + 5000n) / 10000n;
    const workerNetPayoutCents = unitBudgetCents - workerFeeCents;
    const totalSlotEscrowCents = unitBudgetCents + buyerFeeCents;
    const totalPlatformTakeCents = buyerFeeCents + workerFeeCents;

    // Invariant check
    if (totalSlotEscrowCents !== workerNetPayoutCents + totalPlatformTakeCents) {
      throw new Error('Ledger arithmetic invariant failure: Escrow does not match net payout + platform take');
    }

    return {
      unitBudgetCents,
      buyerFeeCents,
      workerFeeCents,
      workerNetPayoutCents,
      totalSlotEscrowCents,
      totalPlatformTakeCents,
    };
  }

  /**
   * Helper to ensure the system-wide faucet pool and revenue accounts exist
   */
  async ensureSystemAccounts(tx?: any) {
    const client = tx || this.prisma;

    let faucetAccount = await client.demoLedgerAccount.findFirst({
      where: { userId: null, accountType: DemoAccountType.DEMO_SYSTEM_FAUCET_POOL },
    });

    if (!faucetAccount) {
      faucetAccount = await client.demoLedgerAccount.create({
        data: {
          userId: null,
          accountType: DemoAccountType.DEMO_SYSTEM_FAUCET_POOL,
          currency: 'USD',
          balanceCents: 100000000000n, // $1,000,000,000.00 virtual pool
        },
      });
    }

    let revenueAccount = await client.demoLedgerAccount.findFirst({
      where: { userId: null, accountType: DemoAccountType.DEMO_SYSTEM_REVENUE },
    });

    if (!revenueAccount) {
      revenueAccount = await client.demoLedgerAccount.create({
        data: {
          userId: null,
          accountType: DemoAccountType.DEMO_SYSTEM_REVENUE,
          currency: 'USD',
          balanceCents: 0n,
        },
      });
    }

    return { faucetAccount, revenueAccount };
  }

  /**
   * Get or initialize a user's specific demo account
   */
  async getOrCreateUserAccount(userId: string, accountType: DemoAccountType, tx?: any) {
    const client = tx || this.prisma;

    let account = await client.demoLedgerAccount.findUnique({
      where: {
        userId_accountType_currency: {
          userId,
          accountType,
          currency: 'USD',
        },
      },
    });

    if (!account) {
      account = await client.demoLedgerAccount.create({
        data: {
          userId,
          accountType,
          currency: 'USD',
          balanceCents: 0n,
        },
      });
    }

    return account;
  }

  /**
   * Claim virtual funds from DEMO Faucet
   */
  async claimFaucet(userId: string, amountCents: bigint = 100000n, ipAddress?: string) {
    if (amountCents <= 0n) {
      throw new BadRequestException('Amount must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      const { faucetAccount } = await this.ensureSystemAccounts(tx);
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const targetAccountType =
        user.primaryRole === 'BUYER'
          ? DemoAccountType.DEMO_BUYER_AVAILABLE
          : DemoAccountType.DEMO_WORKER_AVAILABLE;

      const userAccount = await this.getOrCreateUserAccount(userId, targetAccountType, tx);

      // Create transaction header
      const transaction = await tx.demoLedgerTransaction.create({
        data: {
          referenceType: 'DEMO_FAUCET_INJECTION',
          referenceId: userId,
          description: `DEMO faucet credit injection of ${(Number(amountCents) / 100).toFixed(2)} USD`,
        },
      });

      // Double-entry record: DEBIT Faucet Pool, CREDIT User Account
      await tx.demoLedgerEntry.create({
        data: {
          transactionId: transaction.id,
          debitAccountId: faucetAccount.id,
          creditAccountId: userAccount.id,
          amountCents,
        },
      });

      // Update balances atomically
      await tx.demoLedgerAccount.update({
        where: { id: faucetAccount.id },
        data: { balanceCents: { decrement: amountCents } },
      });

      const updatedUserAccount = await tx.demoLedgerAccount.update({
        where: { id: userAccount.id },
        data: { balanceCents: { increment: amountCents } },
      });

      await this.auditService.log({
        actorId: userId,
        actorRole: user.primaryRole,
        action: 'DEMO_FAUCET_CLAIM',
        resourceType: 'DemoLedgerAccount',
        resourceId: userAccount.id,
        newState: { creditedCents: amountCents.toString(), newBalance: updatedUserAccount.balanceCents.toString() },
        ipAddress,
        reason: 'Claimed demo faucet test credits',
      });

      return {
        success: true,
        transactionId: transaction.id,
        creditedCents: amountCents.toString(),
        formattedCreditedUSD: `DEMO $${(Number(amountCents) / 100).toFixed(2)} USD`,
        currentBalanceCents: updatedUserAccount.balanceCents.toString(),
        formattedCurrentBalanceUSD: `DEMO $${(Number(updatedUserAccount.balanceCents) / 100).toFixed(2)} USD`,
      };
    });
  }

  /**
   * Lock demo escrow when a Buyer creates/funds a task campaign
   */
  async lockTaskEscrow(
    buyerId: string,
    taskId: string,
    totalSlots: number,
    unitBudgetCents: bigint,
    tx?: any,
  ) {
    const client = tx || this.prisma;
    const fees = this.calculateFees(unitBudgetCents);
    const totalRequiredEscrow = fees.totalSlotEscrowCents * BigInt(totalSlots);

    const buyerAvailable = await this.getOrCreateUserAccount(buyerId, DemoAccountType.DEMO_BUYER_AVAILABLE, client);
    const buyerEscrow = await this.getOrCreateUserAccount(buyerId, DemoAccountType.DEMO_BUYER_ESCROW_RESERVED, client);

    if (buyerAvailable.balanceCents < totalRequiredEscrow) {
      throw new BadRequestException({
        code: 'ERR_INSUFFICIENT_DEMO_BALANCE',
        message: `Insufficient DEMO balance. Required: DEMO $${(Number(totalRequiredEscrow) / 100).toFixed(2)} USD, Available: DEMO $${(Number(buyerAvailable.balanceCents) / 100).toFixed(2)} USD. Please claim demo faucet credits.`,
      });
    }

    const transaction = await client.demoLedgerTransaction.create({
      data: {
        referenceType: 'DEMO_TASK_ESCROW_LOCK',
        referenceId: taskId,
        description: `Reserved DEMO escrow for task (${totalSlots} slots at $${(Number(fees.totalSlotEscrowCents) / 100).toFixed(2)}/slot)`,
      },
    });

    await client.demoLedgerEntry.create({
      data: {
        transactionId: transaction.id,
        debitAccountId: buyerAvailable.id,
        creditAccountId: buyerEscrow.id,
        amountCents: totalRequiredEscrow,
      },
    });

    await client.demoLedgerAccount.update({
      where: { id: buyerAvailable.id },
      data: { balanceCents: { decrement: totalRequiredEscrow } },
    });

    await client.demoLedgerAccount.update({
      where: { id: buyerEscrow.id },
      data: { balanceCents: { increment: totalRequiredEscrow } },
    });

    return {
      transactionId: transaction.id,
      totalEscrowLockedCents: totalRequiredEscrow,
      buyerFeeCents: fees.buyerFeeCents * BigInt(totalSlots),
      workerFeeCents: fees.workerFeeCents * BigInt(totalSlots),
    };
  }

  /**
   * Disburse demo earnings upon submission approval
   */
  async disburseSlotPayout(
    buyerId: string,
    workerId: string,
    taskId: string,
    participationId: string,
    unitBudgetCents: bigint,
    tx?: any,
  ) {
    const client = tx || this.prisma;
    const fees = this.calculateFees(unitBudgetCents);
    const { revenueAccount } = await this.ensureSystemAccounts(client);

    const buyerEscrow = await this.getOrCreateUserAccount(buyerId, DemoAccountType.DEMO_BUYER_ESCROW_RESERVED, client);
    const workerAvailable = await this.getOrCreateUserAccount(workerId, DemoAccountType.DEMO_WORKER_AVAILABLE, client);

    if (buyerEscrow.balanceCents < fees.totalSlotEscrowCents) {
      throw new BadRequestException('Insufficient reserved escrow to disburse slot payout');
    }

    const transaction = await client.demoLedgerTransaction.create({
      data: {
        referenceType: 'DEMO_TASK_SLOT_PAYOUT',
        referenceId: participationId,
        description: `DEMO slot payout: $${(Number(fees.workerNetPayoutCents) / 100).toFixed(2)} to worker, $${(Number(fees.totalPlatformTakeCents) / 100).toFixed(2)} platform fee`,
      },
    });

    // 1. Entry: Escrow -> Worker Net Payout
    await client.demoLedgerEntry.create({
      data: {
        transactionId: transaction.id,
        debitAccountId: buyerEscrow.id,
        creditAccountId: workerAvailable.id,
        amountCents: fees.workerNetPayoutCents,
      },
    });

    // 2. Entry: Escrow -> Platform Revenue
    await client.demoLedgerEntry.create({
      data: {
        transactionId: transaction.id,
        debitAccountId: buyerEscrow.id,
        creditAccountId: revenueAccount.id,
        amountCents: fees.totalPlatformTakeCents,
      },
    });

    // Balances update
    await client.demoLedgerAccount.update({
      where: { id: buyerEscrow.id },
      data: { balanceCents: { decrement: fees.totalSlotEscrowCents } },
    });

    await client.demoLedgerAccount.update({
      where: { id: workerAvailable.id },
      data: { balanceCents: { increment: fees.workerNetPayoutCents } },
    });

    await client.demoLedgerAccount.update({
      where: { id: revenueAccount.id },
      data: { balanceCents: { increment: fees.totalPlatformTakeCents } },
    });

    return {
      transactionId: transaction.id,
      workerNetPayoutCents: fees.workerNetPayoutCents,
      totalPlatformFeeCents: fees.totalPlatformTakeCents,
    };
  }

  /**
   * Refund unused demo escrow when slots are closed or cancelled
   */
  async refundUnclaimedSlots(
    buyerId: string,
    taskId: string,
    slotsCount: number,
    unitBudgetCents: bigint,
    tx?: any,
  ) {
    if (slotsCount <= 0) return { refundedCents: 0n };

    const client = tx || this.prisma;
    const fees = this.calculateFees(unitBudgetCents);
    const refundAmountCents = fees.totalSlotEscrowCents * BigInt(slotsCount);

    const buyerEscrow = await this.getOrCreateUserAccount(buyerId, DemoAccountType.DEMO_BUYER_ESCROW_RESERVED, client);
    const buyerAvailable = await this.getOrCreateUserAccount(buyerId, DemoAccountType.DEMO_BUYER_AVAILABLE, client);

    const transaction = await client.demoLedgerTransaction.create({
      data: {
        referenceType: 'DEMO_SLOT_CLOSURE_REFUND',
        referenceId: taskId,
        description: `Refunded DEMO escrow for ${slotsCount} closed/unfilled slots`,
      },
    });

    await client.demoLedgerEntry.create({
      data: {
        transactionId: transaction.id,
        debitAccountId: buyerEscrow.id,
        creditAccountId: buyerAvailable.id,
        amountCents: refundAmountCents,
      },
    });

    await client.demoLedgerAccount.update({
      where: { id: buyerEscrow.id },
      data: { balanceCents: { decrement: refundAmountCents } },
    });

    await client.demoLedgerAccount.update({
      where: { id: buyerAvailable.id },
      data: { balanceCents: { increment: refundAmountCents } },
    });

    return {
      transactionId: transaction.id,
      refundedCents: refundAmountCents,
    };
  }

  /**
   * Get all user demo wallet balances
   */
  async getUserWallets(userId: string) {
    const accounts = await this.prisma.demoLedgerAccount.findMany({
      where: { userId },
    });

    const formattedAccounts = accounts.map(acc => ({
      accountType: acc.accountType,
      currency: acc.currency,
      balanceCents: acc.balanceCents.toString(),
      formattedUSD: `DEMO $${(Number(acc.balanceCents) / 100).toFixed(2)} USD`,
      updatedAt: acc.updatedAt,
    }));

    return {
      userId,
      isDemo: true,
      disclaimer: 'All balances and funds are strictly simulated demo credits. Zero real money.',
      accounts: formattedAccounts,
    };
  }

  /**
   * Get user transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 20, offset: number = 0) {
    const userAccounts = await this.prisma.demoLedgerAccount.findMany({
      where: { userId },
      select: { id: true },
    });
    const accountIds = userAccounts.map(a => a.id);

    const entries = await this.prisma.demoLedgerEntry.findMany({
      where: {
        OR: [
          { debitAccountId: { in: accountIds } },
          { creditAccountId: { in: accountIds } },
        ],
      },
      include: {
        transaction: true,
        debitAccount: true,
        creditAccount: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return entries.map(e => ({
      id: e.id,
      transactionId: e.transactionId,
      referenceType: e.transaction.referenceType,
      referenceId: e.transaction.referenceId,
      description: e.transaction.description,
      amountCents: e.amountCents.toString(),
      formattedUSD: `DEMO $${(Number(e.amountCents) / 100).toFixed(2)} USD`,
      isDebit: accountIds.includes(e.debitAccountId),
      isCredit: accountIds.includes(e.creditAccountId),
      createdAt: e.createdAt,
    }));
  }

  /**
   * Indicative real-time FX snapshot rates
   */
  getFxSnapshots() {
    return {
      baseCurrency: 'USD',
      isDemo: true,
      rates: {
        BDT: 121.50, // Bangladeshi Taka
        EUR: 0.92,   // Euro
        GBP: 0.79,   // British Pound
        INR: 84.20,  // Indian Rupee
        CAD: 1.38,   // Canadian Dollar
      },
      snapshotAt: new Date().toISOString(),
      disclaimer: 'Indicative rates for reference only; all platform demo operations settle in USD cents.',
    };
  }
}
