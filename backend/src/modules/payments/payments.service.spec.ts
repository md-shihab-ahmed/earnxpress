import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { RealLedgerService } from './real-ledger.service';
import { PaymentProviderFactory } from './adapters/payment-provider.factory';
import { SandboxMockAdapter } from './adapters/sandbox-mock.adapter';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  PaymentProviderType,
  PaymentOrderStatus,
  WebhookProcessingStatus,
  WithdrawalStatus,
  WithdrawalMethodType,
  EscrowFundingStatus,
} from '@prisma/client';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockPrisma: any;
  let mockRealLedger: any;
  let mockFactory: any;
  let mockSandboxAdapter: any;
  let mockConfig: any;

  beforeEach(async () => {
    mockPrisma = {
      user: { findUnique: jest.fn() },
      task: { findUnique: jest.fn(), update: jest.fn() },
      paymentOrder: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      paymentWebhookEvent: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
      withdrawalRequest: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      workerParticipation: { findUnique: jest.fn() },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };

    mockRealLedger = {
      recordDoubleEntryTransaction: jest.fn().mockResolvedValue({ id: 'tx-1' }),
      getBuyerWallet: jest.fn(),
      getWorkerWallet: jest.fn(),
    };

    mockSandboxAdapter = {
      providerType: PaymentProviderType.SANDBOX_MOCK,
      createOrder: jest.fn().mockResolvedValue({
        providerOrderId: 'mock_ord_1',
        providerClientSecret: 'mock_sec_1',
        checkoutUrl: 'http://localhost:3000/payments/sandbox',
        chargedAmountMinor: BigInt(5000),
        chargedCurrency: 'USD',
        exchangeRate: 1.0,
      }),
      verifyWebhookSignature: jest.fn(),
      parseWebhookEvent: jest.fn(),
      processRefund: jest.fn(),
      executePayout: jest.fn(),
    };

    mockFactory = {
      getAdapter: jest.fn().mockReturnValue(mockSandboxAdapter),
    };

    mockConfig = {
      get: jest.fn((key: string, defaultVal?: any) => {
        if (key === 'ENABLE_REAL_PAYMENTS') return false; // Default safe production mode
        return defaultVal;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RealLedgerService, useValue: mockRealLedger },
        { provide: PaymentProviderFactory, useValue: mockFactory },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createPaymentOrder', () => {
    it('should forbid live payment provider integration if ENABLE_REAL_PAYMENTS is false', async () => {
      await expect(
        service.createPaymentOrder('buyer-1', {
          amountCents: 5000,
          provider: PaymentProviderType.STRIPE,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SANDBOX_MOCK provider and initialize pending PaymentOrder record', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'buyer-1',
        email: 'buyer@test.com',
        profile: { displayName: 'Buyer Test' },
      });

      mockPrisma.paymentOrder.create.mockImplementation((args: any) => ({
        id: 'order-uuid-1',
        ...args.data,
        createdAt: new Date(),
      }));

      const res = await service.createPaymentOrder('buyer-1', {
        amountCents: 5000,
        provider: PaymentProviderType.SANDBOX_MOCK,
      });

      expect(res.orderId).toBeDefined();
      expect(res.status).toBe(PaymentOrderStatus.PENDING);
      expect(res.formattedUSD).toBe('$50.00 USD');
      expect(mockSandboxAdapter.createOrder).toHaveBeenCalled();
    });
  });

  describe('processWebhook', () => {
    it('should reject webhook if provider cryptographic signature verification fails', async () => {
      mockSandboxAdapter.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        service.processWebhook(
          PaymentProviderType.SANDBOX_MOCK,
          { 'x-mock-signature': 'invalid_sig' },
          '{}',
          {},
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should skip duplicate webhook event if already PROCESSED', async () => {
      mockSandboxAdapter.verifyWebhookSignature.mockReturnValue(true);
      mockSandboxAdapter.parseWebhookEvent.mockResolvedValue({
        isValid: true,
        eventId: 'evt-dup-1',
        eventType: 'PAYMENT_SUCCEEDED',
        orderId: 'ord-1',
        providerTransactionId: 'txn-1',
        rawPayload: {},
      });

      mockPrisma.paymentWebhookEvent.findUnique.mockResolvedValue({
        eventId: 'evt-dup-1',
        status: WebhookProcessingStatus.PROCESSED,
      });

      const res = await service.processWebhook(
        PaymentProviderType.SANDBOX_MOCK,
        { 'x-mock-signature': 'valid_sig' },
        '{}',
        {},
      );

      expect(res.status).toBe('DUPLICATE_IGNORED');
      expect(mockRealLedger.recordDoubleEntryTransaction).not.toHaveBeenCalled();
    });

    it('should update order to SUCCEEDED and credit buyer real available on PAYMENT_SUCCEEDED webhook', async () => {
      mockSandboxAdapter.verifyWebhookSignature.mockReturnValue(true);
      mockSandboxAdapter.parseWebhookEvent.mockResolvedValue({
        isValid: true,
        eventId: 'evt-succ-1',
        eventType: 'PAYMENT_SUCCEEDED',
        orderId: 'ord-1',
        providerTransactionId: 'txn-succ-1',
        amountMinor: BigInt(5000),
        rawPayload: {},
      });

      mockPrisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);
      mockPrisma.paymentWebhookEvent.upsert.mockResolvedValue({ id: 'wh-1' });

      mockPrisma.paymentOrder.findFirst.mockResolvedValue({
        id: 'ord-1',
        buyerId: 'buyer-1',
        taskId: null,
        amountCents: BigInt(5000),
        currency: 'USD',
        status: PaymentOrderStatus.PENDING,
      });

      const res = await service.processWebhook(
        PaymentProviderType.SANDBOX_MOCK,
        { 'x-mock-signature': 'valid_sig' },
        '{}',
        {},
      );

      expect(res.status).toBe('PROCESSED');
      expect(mockPrisma.paymentOrder.update).toHaveBeenCalledWith({
        where: { id: 'ord-1' },
        data: {
          status: PaymentOrderStatus.SUCCEEDED,
          confirmedAt: expect.any(Date),
        },
      });

      expect(mockRealLedger.recordDoubleEntryTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          referenceType: 'BUYER_REAL_DEPOSIT',
          amountCents: BigInt(5000),
        }),
      );
    });
  });

  describe('Withdrawal Workflows', () => {
    it('should reserve worker available funds into pending withdrawal', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'worker-1',
        profile: { displayName: 'Worker Rahim' },
      });

      mockPrisma.withdrawalRequest.create.mockImplementation((args: any) => ({
        id: 'with-1',
        ...args.data,
      }));

      const res = await service.requestWithdrawal('worker-1', {
        amountCents: 5000,
        method: WithdrawalMethodType.BANK_TRANSFER,
        destinationDetails: {
          bankName: 'City Bank',
          accountNumber: '1234567890',
        },
      });

      expect(res.withdrawalId).toBeDefined();
      expect(res.status).toBe(WithdrawalStatus.PENDING);
      expect((res.destinationDetailsMasked as any).accountMasked).toBe('****7890');
      expect(mockRealLedger.recordDoubleEntryTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          referenceType: 'WITHDRAWAL_REQUEST_RESERVED',
          amountCents: BigInt(5000),
        }),
      );
    });

    it('should clear pending withdrawal to payout clearing when admin marks COMPLETE', async () => {
      mockPrisma.withdrawalRequest.findUnique.mockResolvedValue({
        id: 'with-1',
        workerId: 'worker-1',
        amountCents: BigInt(5000),
        status: WithdrawalStatus.APPROVED,
        method: WithdrawalMethodType.BANK_TRANSFER,
      });

      mockPrisma.withdrawalRequest.update.mockResolvedValue({
        id: 'with-1',
        workerId: 'worker-1',
        amountCents: BigInt(5000),
        status: WithdrawalStatus.COMPLETED,
        method: WithdrawalMethodType.BANK_TRANSFER,
        payoutCurrency: 'USD',
      });

      const res = await service.processWithdrawal('admin-1', 'with-1', {
        decision: 'COMPLETE',
        providerPayoutId: 'payout_beftn_123',
      });

      expect(res.status).toBe(WithdrawalStatus.COMPLETED);
      expect(mockRealLedger.recordDoubleEntryTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          referenceType: 'WITHDRAWAL_COMPLETED',
          amountCents: BigInt(5000),
        }),
      );
    });

    it('should refund pending withdrawal back to worker available when admin REJECTS', async () => {
      mockPrisma.withdrawalRequest.findUnique.mockResolvedValue({
        id: 'with-1',
        workerId: 'worker-1',
        amountCents: BigInt(5000),
        status: WithdrawalStatus.PENDING,
        method: WithdrawalMethodType.BANK_TRANSFER,
      });

      mockPrisma.withdrawalRequest.update.mockResolvedValue({
        id: 'with-1',
        workerId: 'worker-1',
        amountCents: BigInt(5000),
        status: WithdrawalStatus.REJECTED,
        method: WithdrawalMethodType.BANK_TRANSFER,
        payoutCurrency: 'USD',
      });

      const res = await service.processWithdrawal('admin-1', 'with-1', {
        decision: 'REJECT',
        rejectionReason: 'Invalid routing number',
      });

      expect(res.status).toBe(WithdrawalStatus.REJECTED);
      expect(mockRealLedger.recordDoubleEntryTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          referenceType: 'WITHDRAWAL_REJECTED_REFUND',
          amountCents: BigInt(5000),
        }),
      );
    });
  });

  describe('Currency & Exchange Benchmarks', () => {
    it('should return verified exchange benchmarks for USD, BDT, EUR, GBP', async () => {
      const rates = await service.getExchangeRates();
      expect(rates).toHaveLength(3);
      const bdt = rates.find((r) => r.targetCurrency === 'BDT');
      expect(bdt?.rate).toBe(121.50);
      expect(bdt?.provider).toBe('BANGLADESH_BANK_MID');
    });
  });
});
