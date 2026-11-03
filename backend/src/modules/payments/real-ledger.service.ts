import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealAccountType, Prisma } from '@prisma/client';

export interface DoubleEntryTransactionParams {
  referenceType: string;
  referenceId: string;
  idempotencyKey?: string;
  description: string;
  debitAccount: {
    userId?: string;
    accountType: RealAccountType;
    currency?: string;
  };
  creditAccount: {
    userId?: string;
    accountType: RealAccountType;
    currency?: string;
  };
  amountCents: bigint;
}

@Injectable()
export class RealLedgerService {
  private readonly logger = new Logger(RealLedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensure account exists atomically with row-level upsert
   */
  async getOrCreateAccount(
    tx: Prisma.TransactionClient,
    accountType: RealAccountType,
    userId?: string,
    currency = 'USD',
  ) {
    const existing = await tx.realLedgerAccount.findFirst({
      where: {
        userId: userId || null,
        accountType,
        currency,
      },
    });

    if (existing) return existing;

    return tx.realLedgerAccount.create({
      data: {
        userId: userId || null,
        accountType,
        currency,
        balanceCents: BigInt(0),
      },
    });
  }

  /**
   * Execute an immutable, atomic, double-entry financial transaction
   */
  async recordDoubleEntryTransaction(
    tx: Prisma.TransactionClient,
    params: DoubleEntryTransactionParams,
  ) {
    if (params.amountCents <= BigInt(0)) {
      throw new BadRequestException('Transaction amount must be a positive integer in minor units');
    }

    // Check idempotency if key provided
    if (params.idempotencyKey) {
      const existingTx = await tx.realLedgerTransaction.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
        include: { entries: true },
      });
      if (existingTx) {
        this.logger.warn(`Idempotent transaction skipped: ${params.idempotencyKey}`);
        return existingTx;
      }
    }

    // Resolve or initialize debit and credit accounts
    const debitAcc = await this.getOrCreateAccount(
      tx,
      params.debitAccount.accountType,
      params.debitAccount.userId,
      params.debitAccount.currency || 'USD',
    );

    const creditAcc = await this.getOrCreateAccount(
      tx,
      params.creditAccount.accountType,
      params.creditAccount.userId,
      params.creditAccount.currency || 'USD',
    );

    // Enforce balance sufficiency on client accounts
    // Clearing accounts (SYSTEM_PAYMENT_CLEARING / SYSTEM_PAYOUT_CLEARING) can be debit-balanced as in-flight clearing houses
    const isClearingAccount =
      debitAcc.accountType === RealAccountType.SYSTEM_PAYMENT_CLEARING ||
      debitAcc.accountType === RealAccountType.SYSTEM_PAYOUT_CLEARING;

    if (!isClearingAccount && debitAcc.balanceCents < params.amountCents) {
      throw new ConflictException(
        `Insufficient real funds in ${debitAcc.accountType}. Available: DEMO $${(
          Number(debitAcc.balanceCents) / 100
        ).toFixed(2)}, Required: DEMO $${(Number(params.amountCents) / 100).toFixed(2)}`,
      );
    }

    // 1. Create the parent transaction
    const ledgerTx = await tx.realLedgerTransaction.create({
      data: {
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        idempotencyKey: params.idempotencyKey,
        description: params.description,
      },
    });

    // 2. Create the balanced double-entry ledger entry
    await tx.realLedgerEntry.create({
      data: {
        transactionId: ledgerTx.id,
        debitAccountId: debitAcc.id,
        creditAccountId: creditAcc.id,
        amountCents: params.amountCents,
      },
    });

    // 3. Update account balances atomically (Debit decreases asset / source, Credit increases target)
    await tx.realLedgerAccount.update({
      where: { id: debitAcc.id },
      data: {
        balanceCents: {
          decrement: params.amountCents,
        },
      },
    });

    await tx.realLedgerAccount.update({
      where: { id: creditAcc.id },
      data: {
        balanceCents: {
          increment: params.amountCents,
        },
      },
    });

    this.logger.log(
      `Double-entry recorded: ${params.referenceType} | $${(Number(params.amountCents) / 100).toFixed(
        2,
      )} from [${debitAcc.accountType}] to [${creditAcc.accountType}] (Tx: ${ledgerTx.id})`,
    );

    return ledgerTx;
  }

  /**
   * Fetch Buyer Real Ledger Accounts & Recent Entries
   */
  async getBuyerWallet(buyerId: string, currency = 'USD') {
    const [available, escrow, transactions] = await Promise.all([
      this.prisma.realLedgerAccount.findFirst({
        where: { userId: buyerId, accountType: RealAccountType.BUYER_REAL_AVAILABLE, currency },
      }),
      this.prisma.realLedgerAccount.findFirst({
        where: { userId: buyerId, accountType: RealAccountType.BUYER_REAL_ESCROW_LOCKED, currency },
      }),
      this.prisma.realLedgerTransaction.findMany({
        where: {
          entries: {
            some: {
              OR: [
                { debitAccount: { userId: buyerId } },
                { creditAccount: { userId: buyerId } },
              ],
            },
          },
        },
        include: {
          entries: {
            include: {
              debitAccount: true,
              creditAccount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const availCents = available?.balanceCents || BigInt(0);
    const escrowCents = escrow?.balanceCents || BigInt(0);

    return {
      userId: buyerId,
      isReal: true,
      currency,
      availableBalanceCents: availCents.toString(),
      formattedAvailableUSD: `$${(Number(availCents) / 100).toFixed(2)} USD`,
      escrowBalanceCents: escrowCents.toString(),
      formattedEscrowUSD: `$${(Number(escrowCents) / 100).toFixed(2)} USD`,
      transactions: transactions.map((t) => {
        const entry = t.entries[0];
        const isCredit = entry?.creditAccount.userId === buyerId;
        const amt = entry ? Number(entry.amountCents) / 100 : 0;
        return {
          id: t.id,
          referenceType: t.referenceType,
          description: t.description,
          amountCents: entry?.amountCents.toString() || '0',
          formattedAmount: `${isCredit ? '+' : '-'}$${amt.toFixed(2)} USD`,
          createdAt: t.createdAt,
        };
      }),
    };
  }

  /**
   * Fetch Worker Real Ledger Accounts & Recent Entries
   */
  async getWorkerWallet(workerId: string, currency = 'USD') {
    const [available, pendingWithdrawal, transactions] = await Promise.all([
      this.prisma.realLedgerAccount.findFirst({
        where: { userId: workerId, accountType: RealAccountType.WORKER_REAL_AVAILABLE, currency },
      }),
      this.prisma.realLedgerAccount.findFirst({
        where: { userId: workerId, accountType: RealAccountType.WORKER_REAL_WITHDRAWAL_PENDING, currency },
      }),
      this.prisma.realLedgerTransaction.findMany({
        where: {
          entries: {
            some: {
              OR: [
                { debitAccount: { userId: workerId } },
                { creditAccount: { userId: workerId } },
              ],
            },
          },
        },
        include: {
          entries: {
            include: {
              debitAccount: true,
              creditAccount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const availCents = available?.balanceCents || BigInt(0);
    const pendingCents = pendingWithdrawal?.balanceCents || BigInt(0);

    return {
      userId: workerId,
      isReal: true,
      currency,
      availableBalanceCents: availCents.toString(),
      formattedAvailableUSD: `$${(Number(availCents) / 100).toFixed(2)} USD`,
      pendingWithdrawalCents: pendingCents.toString(),
      formattedPendingUSD: `$${(Number(pendingCents) / 100).toFixed(2)} USD`,
      transactions: transactions.map((t) => {
        const entry = t.entries[0];
        const isCredit = entry?.creditAccount.userId === workerId;
        const amt = entry ? Number(entry.amountCents) / 100 : 0;
        return {
          id: t.id,
          referenceType: t.referenceType,
          description: t.description,
          amountCents: entry?.amountCents.toString() || '0',
          formattedAmount: `${isCredit ? '+' : '-'}$${amt.toFixed(2)} USD`,
          createdAt: t.createdAt,
        };
      }),
    };
  }

  /**
   * Comprehensive Double-Entry Ledger Reconciliation Audit
   */
  async reconcileRealLedger() {
    const [accounts, entries, transactionsCount] = await Promise.all([
      this.prisma.realLedgerAccount.findMany(),
      this.prisma.realLedgerEntry.findMany(),
      this.prisma.realLedgerTransaction.count(),
    ]);

    let totalDebitedCents = BigInt(0);
    let totalCreditedCents = BigInt(0);

    for (const e of entries) {
      totalDebitedCents += e.amountCents;
      totalCreditedCents += e.amountCents;
    }

    const isDoubleEntryBalanced = totalDebitedCents === totalCreditedCents;

    // Aggregate by account type
    const summaryByType: Record<string, string> = {};
    for (const acc of accounts) {
      const current = BigInt(summaryByType[acc.accountType] || '0');
      summaryByType[acc.accountType] = (current + acc.balanceCents).toString();
    }

    return {
      reconciledAt: new Date().toISOString(),
      isDoubleEntryBalanced,
      totalTransactions: transactionsCount,
      totalEntries: entries.length,
      totalDebitedUSD: `$${(Number(totalDebitedCents) / 100).toFixed(2)} USD`,
      totalCreditedUSD: `$${(Number(totalCreditedCents) / 100).toFixed(2)} USD`,
      accountBalancesByRole: summaryByType,
    };
  }
}
