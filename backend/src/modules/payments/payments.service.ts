import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RealLedgerService } from './real-ledger.service';
import { PaymentProviderFactory } from './adapters/payment-provider.factory';
import {
  PaymentProviderType,
  PaymentOrderStatus,
  WebhookProcessingStatus,
  WithdrawalStatus,
  WithdrawalMethodType,
  EscrowFundingStatus,
  RealAccountType,
  TaskStatus,
} from '@prisma/client';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ProcessWithdrawalDto } from './dto/process-withdrawal.dto';
import { CreateManualDepositDto } from './dto/create-manual-deposit.dto';
import { ProcessDepositDto } from './dto/process-deposit.dto';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realLedgerService: RealLedgerService,
    private readonly providerFactory: PaymentProviderFactory,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Initialize a new real payment order (Buyer deposit or direct task campaign funding)
   */
  async createPaymentOrder(buyerId: string, dto: CreatePaymentOrderDto) {
    const isRealPaymentsEnabled = this.configService.get<boolean>('ENABLE_REAL_PAYMENTS') ?? false;

    // Safety guard: Prevent live provider checkout if real payments are not enabled
    if (!isRealPaymentsEnabled && dto.provider !== PaymentProviderType.SANDBOX_MOCK) {
      throw new ForbiddenException(
        `Real international payments via ${dto.provider} are currently disabled pending regulatory compliance and merchant account activation. Use SANDBOX_MOCK provider for sandbox verification.`,
      );
    }

    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerId },
      include: { profile: true },
    });
    if (!buyer) throw new NotFoundException('Buyer user not found');

    let task: any = null;
    if (dto.taskId) {
      task = await this.prisma.task.findUnique({ where: { id: dto.taskId } });
      if (!task) throw new NotFoundException('Task not found');
      if (task.buyerId !== buyerId) {
        throw new ForbiddenException('You do not own this task');
      }
    }

    const orderId = crypto.randomUUID();
    const idempotencyKey = `pay_ord_${orderId}`;
    const amountCents = BigInt(dto.amountCents);
    const currency = dto.currency?.toUpperCase() || 'USD';

    const adapter = this.providerFactory.getAdapter(dto.provider);
    const orderResult = await adapter.createOrder({
      orderId,
      amountCents,
      currency,
      customerEmail: buyer.email,
      customerName: buyer.profile?.displayName || 'EarnXpress Buyer',
      description: task
        ? `Task Campaign Escrow Funding: ${task.title}`
        : 'EarnXpress Account Balance Deposit',
      successUrl: dto.successUrl || 'http://localhost:3000/buyer/wallet?payment=success',
      cancelUrl: dto.cancelUrl || 'http://localhost:3000/buyer/wallet?payment=cancelled',
      metadata: {
        orderId,
        buyerId,
        taskId: dto.taskId || '',
      },
    });

    const order = await this.prisma.paymentOrder.create({
      data: {
        id: orderId,
        buyerId,
        taskId: dto.taskId || null,
        provider: dto.provider,
        providerOrderId: orderResult.providerOrderId,
        providerClientSecret: orderResult.providerClientSecret || null,
        amountCents,
        currency,
        chargedAmountMinor: orderResult.chargedAmountMinor || null,
        chargedCurrency: orderResult.chargedCurrency || null,
        exchangeRate: orderResult.exchangeRate || 1.0,
        status: PaymentOrderStatus.PENDING,
        idempotencyKey,
      },
    });

    // If attached to a task, mark escrow as PENDING_CONFIRMATION
    if (task) {
      await this.prisma.task.update({
        where: { id: task.id },
        data: { escrowFundingStatus: EscrowFundingStatus.PENDING_CONFIRMATION },
      });
    }

    return {
      orderId: order.id,
      provider: order.provider,
      providerOrderId: order.providerOrderId,
      amountCents: order.amountCents.toString(),
      formattedUSD: `$${(Number(order.amountCents) / 100).toFixed(2)} USD`,
      chargedAmountMinor: order.chargedAmountMinor?.toString(),
      chargedCurrency: order.chargedCurrency,
      exchangeRate: order.exchangeRate,
      status: order.status,
      checkoutUrl: orderResult.checkoutUrl,
      providerClientSecret: orderResult.providerClientSecret,
      createdAt: order.createdAt,
    };
  }

  /**
   * Process and verify incoming provider webhook with idempotency and double-entry ledger execution
   */
  async processWebhook(
    provider: PaymentProviderType,
    headers: Record<string, string | string[] | undefined>,
    rawBody: string | Buffer,
    parsedBody: any,
  ) {
    const adapter = this.providerFactory.getAdapter(provider);

    // 1. Cryptographic Signature Verification
    const isSignatureValid = adapter.verifyWebhookSignature(headers, rawBody);
    if (!isSignatureValid) {
      this.logger.warn(`Rejected webhook from ${provider}: Invalid cryptographic signature`);
      throw new UnauthorizedException(`Invalid ${provider} webhook signature`);
    }

    // 2. Parse standardized event
    const parsedEvent = await adapter.parseWebhookEvent(headers, parsedBody);
    if (!parsedEvent.isValid) {
      this.logger.warn(`Ignored unmapped webhook event: ${parsedEvent.eventType} from ${provider}`);
      return { status: 'IGNORED_UNMAPPED_EVENT' };
    }

    // 3. Idempotency Check: prevent duplicate event processing
    const existingEvent = await this.prisma.paymentWebhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider,
          eventId: parsedEvent.eventId,
        },
      },
    });

    if (existingEvent) {
      if (existingEvent.status === WebhookProcessingStatus.PROCESSED) {
        this.logger.warn(
          `Idempotency Guard: Duplicate webhook event ${parsedEvent.eventId} from ${provider} ignored`,
        );
        return { status: 'DUPLICATE_IGNORED', eventId: parsedEvent.eventId };
      }
    }

    // Record webhook event as RECEIVED
    const webhookRecord = await this.prisma.paymentWebhookEvent.upsert({
      where: {
        provider_eventId: {
          provider,
          eventId: parsedEvent.eventId,
        },
      },
      create: {
        provider,
        eventId: parsedEvent.eventId,
        eventType: parsedEvent.eventType,
        status: WebhookProcessingStatus.RECEIVED,
        payload: parsedEvent.rawPayload,
        signatureHeader: (headers['stripe-signature'] ||
          headers['x-earnxpress-signature'] ||
          headers['x-mock-signature'] ||
          headers['paypal-transmission-sig'] ||
          '') as string,
      },
      update: {
        status: WebhookProcessingStatus.RECEIVED,
      },
    });

    // 4. Find corresponding PaymentOrder
    const order = await this.prisma.paymentOrder.findFirst({
      where: {
        OR: [
          { id: parsedEvent.orderId },
          { providerOrderId: parsedEvent.providerTransactionId },
          { providerOrderId: parsedEvent.orderId },
        ],
      },
      include: { task: true },
    });

    if (!order) {
      this.logger.error(
        `Webhook order mismatch: Could not find PaymentOrder for reference ${parsedEvent.orderId} or transaction ${parsedEvent.providerTransactionId}`,
      );
      await this.prisma.paymentWebhookEvent.update({
        where: { id: webhookRecord.id },
        data: {
          status: WebhookProcessingStatus.FAILED,
          errorMessage: 'No matching PaymentOrder found in platform database',
        },
      });
      throw new NotFoundException('Payment order not found for webhook event');
    }

    // 5. Atomic Double-Entry Financial Execution in Transaction
    try {
      await this.prisma.$transaction(async (tx) => {
        if (parsedEvent.eventType === 'PAYMENT_SUCCEEDED') {
          if (order.status === PaymentOrderStatus.SUCCEEDED) {
            return; // already processed
          }

          // A. Mark order as SUCCEEDED
          await tx.paymentOrder.update({
            where: { id: order.id },
            data: {
              status: PaymentOrderStatus.SUCCEEDED,
              confirmedAt: new Date(),
            },
          });

          // B. Double-Entry: Inward Deposit Clearing -> Buyer Available
          await this.realLedgerService.recordDoubleEntryTransaction(tx, {
            referenceType: 'BUYER_REAL_DEPOSIT',
            referenceId: order.id,
            idempotencyKey: `dep_tx_${order.id}`,
            description: `Real funding deposit confirmed via ${provider} (Order: ${order.id})`,
            debitAccount: {
              accountType: RealAccountType.SYSTEM_PAYMENT_CLEARING,
              currency: order.currency,
            },
            creditAccount: {
              userId: order.buyerId,
              accountType: RealAccountType.BUYER_REAL_AVAILABLE,
              currency: order.currency,
            },
            amountCents: order.amountCents,
          });

          // C. If direct task funding, lock task escrow atomically
          if (order.taskId && order.task) {
            const task = order.task;
            await this.realLedgerService.recordDoubleEntryTransaction(tx, {
              referenceType: 'TASK_REAL_ESCROW_LOCK',
              referenceId: task.id,
              idempotencyKey: `task_escrow_lock_${task.id}`,
              description: `Real escrow locked for Task: ${task.title} (${task.totalSlots} slots funded)`,
              debitAccount: {
                userId: order.buyerId,
                accountType: RealAccountType.BUYER_REAL_AVAILABLE,
                currency: order.currency,
              },
              creditAccount: {
                userId: order.buyerId,
                accountType: RealAccountType.BUYER_REAL_ESCROW_LOCKED,
                currency: order.currency,
              },
              amountCents: task.totalEscrowCents,
            });

            await tx.task.update({
              where: { id: task.id },
              data: {
                status: TaskStatus.OPEN,
                escrowFundingStatus: EscrowFundingStatus.FUNDED_REAL,
              },
            });

            this.logger.log(`Task ${task.id} escrow funded and published to open marketplace`);
          }
        } else if (parsedEvent.eventType === 'PAYMENT_FAILED') {
          await tx.paymentOrder.update({
            where: { id: order.id },
            data: {
              status: PaymentOrderStatus.FAILED,
              failureReason: parsedEvent.failureReason || 'Payment failed at external gateway',
            },
          });

          if (order.taskId) {
            await tx.task.update({
              where: { id: order.taskId },
              data: {
                escrowFundingStatus: EscrowFundingStatus.UNFUNDED,
              },
            });
          }
        } else if (parsedEvent.eventType === 'REFUND_PROCESSED') {
          await tx.paymentOrder.update({
            where: { id: order.id },
            data: { status: PaymentOrderStatus.REFUNDED },
          });

          // Reverse real funds: Buyer Escrow Locked / Available -> Clearing
          if (order.task && order.task.escrowFundingStatus === EscrowFundingStatus.FUNDED_REAL) {
            await this.realLedgerService.recordDoubleEntryTransaction(tx, {
              referenceType: 'TASK_REAL_ESCROW_REFUND',
              referenceId: order.task.id,
              idempotencyKey: `task_refund_${order.task.id}`,
              description: `Real refund reversed from escrow to payment clearing for Task: ${order.task.title}`,
              debitAccount: {
                userId: order.buyerId,
                accountType: RealAccountType.BUYER_REAL_ESCROW_LOCKED,
                currency: order.currency,
              },
              creditAccount: {
                accountType: RealAccountType.SYSTEM_PAYMENT_CLEARING,
                currency: order.currency,
              },
              amountCents: order.task.totalEscrowCents,
            });

            await tx.task.update({
              where: { id: order.task.id },
              data: {
                status: TaskStatus.CANCELLED,
                escrowFundingStatus: EscrowFundingStatus.REFUNDED,
              },
            });
          }
        }
      });

      // 6. Mark Webhook as successfully PROCESSED
      await this.prisma.paymentWebhookEvent.update({
        where: { id: webhookRecord.id },
        data: {
          status: WebhookProcessingStatus.PROCESSED,
          processedAt: new Date(),
        },
      });

      return {
        status: 'PROCESSED',
        eventId: parsedEvent.eventId,
        orderId: order.id,
        eventType: parsedEvent.eventType,
      };
    } catch (err: any) {
      this.logger.error(`Error processing webhook transaction: ${err.message}`, err.stack);
      await this.prisma.paymentWebhookEvent.update({
        where: { id: webhookRecord.id },
        data: {
          status: WebhookProcessingStatus.FAILED,
          errorMessage: err.message,
        },
      });
      throw err;
    }
  }

  /**
   * Settle approved worker deliverable slot using real double-entry accounting
   */
  async settleWorkerSlotReal(participationId: string) {
    const participation = await this.prisma.workerParticipation.findUnique({
      where: { id: participationId },
      include: { task: true },
    });

    if (!participation) throw new NotFoundException('Participation slot not found');
    const task = participation.task;

    if (task.escrowFundingStatus !== EscrowFundingStatus.FUNDED_REAL) {
      // Demo task settlement is handled by DemoFinanceService
      return { isReal: false };
    }

    const unitBudgetCents = task.unitBudgetCents;
    const workerFeeCents = task.workerFeeCents;
    const buyerFeeCents = task.buyerFeeCents;

    const workerNetEarningsCents = unitBudgetCents - workerFeeCents;
    const platformCommissionCents = buyerFeeCents + workerFeeCents;

    await this.prisma.$transaction(async (tx) => {
      // 1. Release net worker earnings: Buyer Escrow -> Worker Available
      await this.realLedgerService.recordDoubleEntryTransaction(tx, {
        referenceType: 'WORKER_SLOT_PAYOUT',
        referenceId: participation.id,
        idempotencyKey: `worker_payout_${participation.id}`,
        description: `Net earnings credited for approved slot #${participation.slotId} on Task: ${task.title}`,
        debitAccount: {
          userId: task.buyerId,
          accountType: RealAccountType.BUYER_REAL_ESCROW_LOCKED,
          currency: 'USD',
        },
        creditAccount: {
          userId: participation.workerId,
          accountType: RealAccountType.WORKER_REAL_AVAILABLE,
          currency: 'USD',
        },
        amountCents: workerNetEarningsCents,
      });

      // 2. Transfer platform commission: Buyer Escrow -> System Commission Revenue
      await this.realLedgerService.recordDoubleEntryTransaction(tx, {
        referenceType: 'PLATFORM_COMMISSION_REVENUE',
        referenceId: participation.id,
        idempotencyKey: `commission_payout_${participation.id}`,
        description: `Platform fee collected (Buyer 2% + Worker 4%) on Task: ${task.title}`,
        debitAccount: {
          userId: task.buyerId,
          accountType: RealAccountType.BUYER_REAL_ESCROW_LOCKED,
          currency: 'USD',
        },
        creditAccount: {
          accountType: RealAccountType.SYSTEM_COMMISSION_REVENUE,
          currency: 'USD',
        },
        amountCents: platformCommissionCents,
      });
    });

    return {
      isReal: true,
      workerNetEarningsUSD: `$${(Number(workerNetEarningsCents) / 100).toFixed(2)} USD`,
      platformCommissionUSD: `$${(Number(platformCommissionCents) / 100).toFixed(2)} USD`,
    };
  }

  /**
   * Worker requests real funds withdrawal to verified bank or MFS account
   */
  async requestWithdrawal(workerId: string, dto: CreateWithdrawalDto) {
    const amountCents = BigInt(dto.amountCents);
    const worker = await this.prisma.user.findUnique({
      where: { id: workerId },
      include: { profile: true },
    });

    if (!worker) throw new NotFoundException('Worker user not found');

    const withdrawalId = crypto.randomUUID();

    // Mask destination credentials for security (Never store unmasked account/card data)
    const rawDest = dto.destinationDetails || {};
    const maskedDest: Record<string, any> = {
      method: dto.method,
      bankName: rawDest.bankName || rawDest.provider || 'Bank',
      accountHolder: rawDest.accountHolder || worker.profile?.displayName || 'Worker',
      accountMasked: rawDest.accountNumber
        ? `****${String(rawDest.accountNumber).slice(-4)}`
        : rawDest.mobileNumber
        ? `****${String(rawDest.mobileNumber).slice(-4)}`
        : '****1234',
      routingNumber: rawDest.routingNumber ? String(rawDest.routingNumber) : undefined,
    };

    // Calculate estimated payout in local currency if requested (e.g. BDT)
    let estimatedPayoutMinor: bigint | null = null;
    let exchangeRate = 1.0;
    const payoutCurrency = dto.payoutCurrency?.toUpperCase() || 'USD';

    if (payoutCurrency === 'BDT') {
      exchangeRate = 121.50; // Reference Bangladesh Bank mid-market rate
      const bdtAmount = Math.round((Number(amountCents) / 100) * exchangeRate * 100) / 100;
      estimatedPayoutMinor = BigInt(Math.round(bdtAmount * 100)); // in poisha
    }

    const withdrawal = await this.prisma.$transaction(async (tx) => {
      // 1. Double-Entry: Lock funds from Worker Available into Worker Pending Withdrawal
      await this.realLedgerService.recordDoubleEntryTransaction(tx, {
        referenceType: 'WITHDRAWAL_REQUEST_RESERVED',
        referenceId: withdrawalId,
        idempotencyKey: `with_lock_${withdrawalId}`,
        description: `Funds reserved for withdrawal request ${withdrawalId} via ${dto.method}`,
        debitAccount: {
          userId: workerId,
          accountType: RealAccountType.WORKER_REAL_AVAILABLE,
          currency: 'USD',
        },
        creditAccount: {
          userId: workerId,
          accountType: RealAccountType.WORKER_REAL_WITHDRAWAL_PENDING,
          currency: 'USD',
        },
        amountCents,
      });

      // 2. Create WithdrawalRequest record
      return tx.withdrawalRequest.create({
        data: {
          id: withdrawalId,
          workerId,
          method: dto.method,
          destinationDetailsMasked: maskedDest,
          amountCents,
          payoutCurrency,
          estimatedPayoutAmountMinor: estimatedPayoutMinor,
          exchangeRate,
          status: WithdrawalStatus.PENDING,
        },
      });
    });

    return {
      withdrawalId: withdrawal.id,
      amountCents: withdrawal.amountCents.toString(),
      formattedUSD: `$${(Number(withdrawal.amountCents) / 100).toFixed(2)} USD`,
      payoutCurrency: withdrawal.payoutCurrency,
      estimatedPayoutMinor: withdrawal.estimatedPayoutAmountMinor?.toString(),
      exchangeRate: withdrawal.exchangeRate,
      status: withdrawal.status,
      method: withdrawal.method,
      destinationDetailsMasked: withdrawal.destinationDetailsMasked,
      requestedAt: withdrawal.requestedAt,
    };
  }

  /**
   * Process withdrawal request (Admin approval, payout processing, or rejection)
   */
  async processWithdrawal(adminId: string, withdrawalId: string, dto: ProcessWithdrawalDto) {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) throw new NotFoundException('Withdrawal request not found');
    if (
      withdrawal.status === WithdrawalStatus.COMPLETED ||
      withdrawal.status === WithdrawalStatus.REJECTED
    ) {
      throw new BadRequestException(`Withdrawal is already in terminal state: ${withdrawal.status}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.decision === 'APPROVE') {
        return tx.withdrawalRequest.update({
          where: { id: withdrawalId },
          data: {
            status: WithdrawalStatus.APPROVED,
            processedAt: new Date(),
          },
        });
      } else if (dto.decision === 'COMPLETE') {
        // Double-entry: Pending Withdrawal -> System Payout Clearing
        await this.realLedgerService.recordDoubleEntryTransaction(tx, {
          referenceType: 'WITHDRAWAL_COMPLETED',
          referenceId: withdrawal.id,
          idempotencyKey: `with_complete_${withdrawal.id}`,
          description: `Withdrawal payout cleared to destination ${withdrawal.method} (Ref: ${dto.providerPayoutId || 'BEFTN'})`,
          debitAccount: {
            userId: withdrawal.workerId,
            accountType: RealAccountType.WORKER_REAL_WITHDRAWAL_PENDING,
            currency: 'USD',
          },
          creditAccount: {
            accountType: RealAccountType.SYSTEM_PAYOUT_CLEARING,
            currency: 'USD',
          },
          amountCents: withdrawal.amountCents,
        });

        return tx.withdrawalRequest.update({
          where: { id: withdrawalId },
          data: {
            status: WithdrawalStatus.COMPLETED,
            providerPayoutId: dto.providerPayoutId || `payout_${Date.now()}`,
            completedAt: new Date(),
          },
        });
      } else {
        // REJECT: Return reserved funds back to Worker Real Available
        await this.realLedgerService.recordDoubleEntryTransaction(tx, {
          referenceType: 'WITHDRAWAL_REJECTED_REFUND',
          referenceId: withdrawal.id,
          idempotencyKey: `with_reject_${withdrawal.id}`,
          description: `Withdrawal request rejected; funds returned to available balance. Reason: ${dto.rejectionReason || 'Declined'}`,
          debitAccount: {
            userId: withdrawal.workerId,
            accountType: RealAccountType.WORKER_REAL_WITHDRAWAL_PENDING,
            currency: 'USD',
          },
          creditAccount: {
            userId: withdrawal.workerId,
            accountType: RealAccountType.WORKER_REAL_AVAILABLE,
            currency: 'USD',
          },
          amountCents: withdrawal.amountCents,
        });

        return tx.withdrawalRequest.update({
          where: { id: withdrawalId },
          data: {
            status: WithdrawalStatus.REJECTED,
            rejectionReason: dto.rejectionReason || 'Administrative review declined withdrawal',
            processedAt: new Date(),
          },
        });
      }
    });

    const target = updated || withdrawal;
    const finalAmountCents = target.amountCents || withdrawal.amountCents;

    return {
      id: target.id,
      workerId: target.workerId,
      amountCents: finalAmountCents.toString(),
      formattedUSD: `$${(Number(finalAmountCents) / 100).toFixed(2)} USD`,
      payoutCurrency: target.payoutCurrency || withdrawal.payoutCurrency,
      estimatedPayoutAmountMinor: (target.estimatedPayoutAmountMinor ?? withdrawal.estimatedPayoutAmountMinor)?.toString(),
      exchangeRate: target.exchangeRate || withdrawal.exchangeRate,
      status: target.status,
      method: target.method || withdrawal.method,
      providerPayoutId: target.providerPayoutId,
      rejectionReason: target.rejectionReason,
      requestedAt: target.requestedAt || withdrawal.requestedAt,
      processedAt: target.processedAt,
      completedAt: target.completedAt,
    };
  }

  /**
   * List all withdrawal requests for Platform Owner and Admin review
   */
  async listWithdrawals(query: { status?: WithdrawalStatus; limit?: number; offset?: number }) {
    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const take = Math.min(Math.max(query.limit ? Number(query.limit) : 20, 1), 100);
    const skip = Math.max(query.offset ? Number(query.offset) : 0, 0);

    const [total, records] = await Promise.all([
      this.prisma.withdrawalRequest.count({ where }),
      this.prisma.withdrawalRequest.findMany({
        where,
        take,
        skip,
        orderBy: { requestedAt: 'desc' },
        include: {
          worker: {
            select: {
              id: true,
              email: true,
              primaryRole: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  countryCode: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      total,
      limit: take,
      offset: skip,
      items: (records as any[]).map((r) => ({
        id: r.id,
        workerId: r.workerId,
        worker: {
          id: r.worker?.id || r.workerId,
          email: r.worker?.email || 'worker@earnxpress.com',
          country: r.worker?.profile?.countryCode || 'BD',
          displayName: r.worker?.profile?.displayName || 'EarnXpress Worker',
          avatarUrl: r.worker?.profile?.avatarUrl || null,
        },
        method: r.method,
        destinationDetailsMasked: r.destinationDetailsMasked,
        amountCents: r.amountCents.toString(),
        formattedUSD: `$${(Number(r.amountCents) / 100).toFixed(2)} USD`,
        payoutCurrency: r.payoutCurrency,
        estimatedPayoutMinor: r.estimatedPayoutAmountMinor?.toString(),
        exchangeRate: r.exchangeRate ? Number(r.exchangeRate) : null,
        status: r.status,
        providerPayoutId: r.providerPayoutId,
        rejectionReason: r.rejectionReason,
        requestedAt: r.requestedAt,
        processedAt: r.processedAt,
        completedAt: r.completedAt,
      })),
    };
  }

  /**
   * Worker retrieves their personal withdrawal requests history
   */
  async getMyWithdrawals(workerId: string) {
    const records = await this.prisma.withdrawalRequest.findMany({
      where: { workerId },
      orderBy: { requestedAt: 'desc' },
      take: 50,
    });

    return records.map((r) => ({
      id: r.id,
      method: r.method,
      destinationDetailsMasked: r.destinationDetailsMasked,
      amountCents: r.amountCents.toString(),
      formattedUSD: `$${(Number(r.amountCents) / 100).toFixed(2)} USD`,
      payoutCurrency: r.payoutCurrency,
      estimatedPayoutMinor: r.estimatedPayoutAmountMinor?.toString(),
      exchangeRate: r.exchangeRate ? Number(r.exchangeRate) : null,
      status: r.status,
      providerPayoutId: r.providerPayoutId,
      rejectionReason: r.rejectionReason,
      requestedAt: r.requestedAt,
      processedAt: r.processedAt,
      completedAt: r.completedAt,
    }));
  }

  /**
   * Refund remaining unfilled slots on real-funded task
   */
  async refundTaskUnfilledSlots(buyerId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { slots: true },
    });

    if (!task) throw new NotFoundException('Task not found');
    if (task.buyerId !== buyerId) throw new ForbiddenException('Not your task campaign');
    if (task.escrowFundingStatus !== EscrowFundingStatus.FUNDED_REAL) {
      throw new BadRequestException('Task is not funded with real escrow');
    }

    if (task.availableSlots <= 0) {
      throw new BadRequestException('No unfilled slots available for refund');
    }

    const unallocatedSlots = task.availableSlots;
    const slotUnitPriceCents = task.unitBudgetCents + task.buyerFeeCents;
    const refundAmountCents = BigInt(unallocatedSlots) * slotUnitPriceCents;

    await this.prisma.$transaction(async (tx) => {
      // 1. Double-Entry: Task Escrow Locked -> Buyer Real Available
      await this.realLedgerService.recordDoubleEntryTransaction(tx, {
        referenceType: 'TASK_UNFILLED_SLOTS_REFUND',
        referenceId: task.id,
        idempotencyKey: `unfilled_refund_${task.id}_${Date.now()}`,
        description: `Refunded ${unallocatedSlots} unfilled slots ($${(Number(refundAmountCents) / 100).toFixed(2)}) to buyer balance`,
        debitAccount: {
          userId: buyerId,
          accountType: RealAccountType.BUYER_REAL_ESCROW_LOCKED,
          currency: 'USD',
        },
        creditAccount: {
          userId: buyerId,
          accountType: RealAccountType.BUYER_REAL_AVAILABLE,
          currency: 'USD',
        },
        amountCents: refundAmountCents,
      });

      // 2. Close remaining unfilled slots
      await tx.task.update({
        where: { id: task.id },
        data: {
          availableSlots: 0,
          status: TaskStatus.CLOSED,
          escrowFundingStatus: EscrowFundingStatus.PARTIALLY_REFUNDED,
        },
      });
    });

    return {
      success: true,
      unallocatedSlotsRefunded: unallocatedSlots,
      refundAmountUSD: `$${(Number(refundAmountCents) / 100).toFixed(2)} USD`,
    };
  }

  /**
   * Get supported currencies and recorded foreign exchange conversion benchmarks
   */
  async getExchangeRates() {
    return [
      {
        sourceCurrency: 'USD',
        targetCurrency: 'BDT',
        rate: 121.50,
        provider: 'BANGLADESH_BANK_MID',
        description: 'Bangladesh Bank Reference Exchange Benchmark Rate',
        effectiveAt: new Date().toISOString(),
      },
      {
        sourceCurrency: 'USD',
        targetCurrency: 'EUR',
        rate: 0.92,
        provider: 'ECB_MID',
        description: 'European Central Bank Euro Conversion Benchmark Rate',
        effectiveAt: new Date().toISOString(),
      },
      {
        sourceCurrency: 'USD',
        targetCurrency: 'GBP',
        rate: 0.79,
        provider: 'BOE_MID',
        description: 'Bank of England British Pound Benchmark Rate',
        effectiveAt: new Date().toISOString(),
      },
    ];
  }

  /**
   * Buyer submits a manual deposit record (Binance Pay / USDT / bKash / Bank Transfer)
   */
  async createManualDeposit(buyerId: string, dto: CreateManualDepositDto) {
    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerId },
      include: { profile: true },
    });
    if (!buyer) throw new NotFoundException('Buyer account not found');

    const cleanTxRef = dto.transactionReference.trim();
    if (!cleanTxRef) {
      throw new BadRequestException('Transaction reference (TxID) is required');
    }

    // Anti-fraud duplicate check on transaction reference
    const duplicate = await this.prisma.paymentOrder.findFirst({
      where: { providerOrderId: cleanTxRef },
    });
    if (duplicate) {
      throw new ConflictException(
        'A deposit with this Transaction ID has already been recorded in the platform ledger',
      );
    }

    const orderId = crypto.randomUUID();
    const amountCents = BigInt(dto.amountCents);

    const order = await this.prisma.paymentOrder.create({
      data: {
        id: orderId,
        buyerId,
        provider: PaymentProviderType.SANDBOX_MOCK, // Internal verified manual flow
        providerOrderId: cleanTxRef,
        amountCents,
        currency: 'USD',
        status: PaymentOrderStatus.PENDING,
        idempotencyKey: `dep_man_${orderId}`,
        metadata: {
          isManualDeposit: true,
          depositMethod: dto.depositMethod,
          senderIdentifier: dto.senderIdentifier,
          transactionReference: cleanTxRef,
          proofScreenshotUrl: dto.proofScreenshotUrl || null,
          notes: dto.notes || null,
          submittedAt: new Date().toISOString(),
        },
      },
    });

    return {
      orderId: order.id,
      amountCents: order.amountCents.toString(),
      formattedUSD: `$${(Number(order.amountCents) / 100).toFixed(2)} USD`,
      status: order.status,
      depositMethod: dto.depositMethod,
      senderIdentifier: dto.senderIdentifier,
      transactionReference: cleanTxRef,
      createdAt: order.createdAt,
    };
  }

  /**
   * Buyer inspects their manual deposit history
   */
  async getMyDeposits(buyerId: string) {
    const orders = await this.prisma.paymentOrder.findMany({
      where: {
        buyerId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return orders.map((o) => {
      const meta = (o.metadata && typeof o.metadata === 'object' ? o.metadata : {}) as any;
      return {
        id: o.id,
        amountCents: o.amountCents.toString(),
        formattedUSD: `$${(Number(o.amountCents) / 100).toFixed(2)} USD`,
        currency: o.currency,
        status: o.status,
        provider: o.provider,
        transactionReference: o.providerOrderId || meta.transactionReference || 'N/A',
        depositMethod: meta.depositMethod || 'BINANCE_PAY',
        senderIdentifier: meta.senderIdentifier || 'N/A',
        proofScreenshotUrl: meta.proofScreenshotUrl || null,
        failureReason: o.failureReason,
        createdAt: o.createdAt,
        confirmedAt: o.confirmedAt,
      };
    });
  }

  /**
   * Platform Owner / Admin lists all deposits with optional status filter
   */
  async listDeposits(options?: {
    status?: PaymentOrderStatus;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (options?.status) {
      where.status = options.status;
    }

    const [total, items] = await Promise.all([
      this.prisma.paymentOrder.count({ where }),
      this.prisma.paymentOrder.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  countryCode: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
    ]);

    return {
      total,
      items: items.map((o) => {
        const meta = (o.metadata && typeof o.metadata === 'object' ? o.metadata : {}) as any;
        return {
          id: o.id,
          buyerId: o.buyerId,
          buyerEmail: o.buyer.email,
          buyerName: o.buyer.profile?.displayName || o.buyer.email,
          amountCents: o.amountCents.toString(),
          formattedUSD: `$${(Number(o.amountCents) / 100).toFixed(2)} USD`,
          status: o.status,
          transactionReference: o.providerOrderId || meta.transactionReference || 'N/A',
          depositMethod: meta.depositMethod || 'BINANCE_PAY',
          senderIdentifier: meta.senderIdentifier || 'N/A',
          proofScreenshotUrl: meta.proofScreenshotUrl || null,
          notes: meta.notes || null,
          adminNotes: meta.adminNotes || null,
          failureReason: o.failureReason,
          createdAt: o.createdAt,
          confirmedAt: o.confirmedAt,
        };
      }),
    };
  }

  /**
   * Admin / Platform Owner processes a manual deposit (APPROVE with double-entry ledger execution or REJECT)
   */
  async processDeposit(adminId: string, orderId: string, dto: ProcessDepositDto) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
      include: { buyer: { select: { email: true, profile: true } } },
    });
    if (!order) throw new NotFoundException('Deposit order not found');

    if (order.status !== PaymentOrderStatus.PENDING) {
      throw new BadRequestException(`Order cannot be processed: Current status is ${order.status}`);
    }

    const meta = (order.metadata && typeof order.metadata === 'object' ? order.metadata : {}) as any;

    if (dto.decision === 'APPROVE') {
      await this.prisma.$transaction(async (tx) => {
        // A. Mark order as SUCCEEDED
        await tx.paymentOrder.update({
          where: { id: order.id },
          data: {
            status: PaymentOrderStatus.SUCCEEDED,
            confirmedAt: new Date(),
            metadata: {
              ...meta,
              reviewedByAdminId: adminId,
              adminNotes: dto.adminNotes || 'Approved by Platform Governance',
              decision: 'APPROVE',
              processedAt: new Date().toISOString(),
            },
          },
        });

        // B. Double-Entry: System Clearing -> Buyer Real Available
        await this.realLedgerService.recordDoubleEntryTransaction(tx, {
          referenceType: 'BUYER_REAL_DEPOSIT',
          referenceId: order.id,
          idempotencyKey: `dep_manual_${order.id}`,
          description: `Manual deposit verified (${meta.depositMethod || 'BINANCE_PAY'} - TxID: ${order.providerOrderId})`,
          debitAccount: {
            accountType: RealAccountType.SYSTEM_PAYMENT_CLEARING,
            currency: order.currency,
          },
          creditAccount: {
            userId: order.buyerId,
            accountType: RealAccountType.BUYER_REAL_AVAILABLE,
            currency: order.currency,
          },
          amountCents: order.amountCents,
        });

        // C. Emit In-App Notification
        await tx.notification.create({
          data: {
            userId: order.buyerId,
            type: 'DEPOSIT_APPROVED',
            title: 'Deposit Approved & Balance Credited!',
            body: `Your deposit of $${(Number(order.amountCents) / 100).toFixed(2)} USD via ${meta.depositMethod || 'Direct Payment'} (TxID: ${order.providerOrderId}) has been approved and credited to your wallet balance.`,
            actionUrl: '/buyer/wallet',
          },
        });
      });

      return {
        success: true,
        orderId: order.id,
        status: PaymentOrderStatus.SUCCEEDED,
        message: 'Deposit approved and funds credited to Buyer Available wallet balance',
      };
    } else {
      // REJECT
      await this.prisma.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: PaymentOrderStatus.FAILED,
          failureReason: dto.rejectionReason || 'Deposit transaction could not be verified',
          metadata: {
            ...meta,
            reviewedByAdminId: adminId,
            rejectionReason: dto.rejectionReason,
            decision: 'REJECT',
            processedAt: new Date().toISOString(),
          },
        },
      });

      await this.prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: 'DEPOSIT_REJECTED',
          title: 'Deposit Request Declined',
          body: `Your deposit request of $${(Number(order.amountCents) / 100).toFixed(2)} USD was declined. Reason: ${dto.rejectionReason || 'Invalid Transaction ID / Unconfirmed payment'}.`,
          actionUrl: '/buyer/wallet',
        },
      });

      return {
        success: true,
        orderId: order.id,
        status: PaymentOrderStatus.FAILED,
        message: 'Deposit request has been rejected',
      };
    }
  }
}
