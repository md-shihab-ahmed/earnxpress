import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProviderType } from '@prisma/client';
import * as crypto from 'crypto';
import {
  IPaymentProviderAdapter,
  CreateOrderParams,
  CreateOrderResult,
  WebhookParsedEvent,
  RefundParams,
  RefundResult,
  PayoutParams,
  PayoutResult,
} from './payment-provider.interface';

@Injectable()
export class SandboxMockAdapter implements IPaymentProviderAdapter {
  private readonly logger = new Logger(SandboxMockAdapter.name);
  readonly providerType: PaymentProviderType = PaymentProviderType.SANDBOX_MOCK;
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey =
      this.configService.get<string>('SANDBOX_MOCK_WEBHOOK_SECRET') ||
      'earnxpress_sandbox_webhook_secret_key_999!';
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const providerOrderId = `mock_order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const clientSecret = `mock_sec_${crypto.randomBytes(16).toString('hex')}`;
    const checkoutUrl = `http://localhost:3000/payments/sandbox-checkout?orderId=${params.orderId}&providerOrderId=${providerOrderId}`;

    this.logger.log(`Created sandbox mock order ${providerOrderId} for order ${params.orderId} ($${(Number(params.amountCents) / 100).toFixed(2)})`);

    return {
      providerOrderId,
      providerClientSecret: clientSecret,
      checkoutUrl,
      chargedAmountMinor: params.amountCents,
      chargedCurrency: params.currency,
      exchangeRate: 1.0,
    };
  }

  /**
   * Helper to compute valid test signatures for mock webhooks
   */
  generateTestSignature(payloadString: string): string {
    return crypto.createHmac('sha256', this.secretKey).update(payloadString).digest('hex');
  }

  verifyWebhookSignature(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string | Buffer,
  ): boolean {
    const signature = headers['x-earnxpress-signature'] || headers['x-mock-signature'];
    if (!signature || typeof signature !== 'string') {
      this.logger.warn('Mock webhook missing signature header');
      return false;
    }

    const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expectedSignature = this.generateTestSignature(bodyString);

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch {
      return false;
    }
  }

  async parseWebhookEvent(
    headers: Record<string, string | string[] | undefined>,
    body: any,
  ): Promise<WebhookParsedEvent> {
    const eventType = body.eventType || body.type;
    let mappedType: 'PAYMENT_SUCCEEDED' | 'PAYMENT_FAILED' | 'REFUND_PROCESSED' | 'UNKNOWN' = 'UNKNOWN';

    if (eventType === 'payment.succeeded' || eventType === 'PAYMENT_SUCCEEDED') {
      mappedType = 'PAYMENT_SUCCEEDED';
    } else if (eventType === 'payment.failed' || eventType === 'PAYMENT_FAILED') {
      mappedType = 'PAYMENT_FAILED';
    } else if (eventType === 'refund.processed' || eventType === 'REFUND_PROCESSED') {
      mappedType = 'REFUND_PROCESSED';
    }

    return {
      isValid: mappedType !== 'UNKNOWN',
      eventId: body.eventId || `mock_evt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      eventType: mappedType,
      orderId: body.orderId || body.data?.orderId,
      providerTransactionId: body.providerTransactionId || `mock_txn_${Date.now()}`,
      amountMinor: body.amountMinor ? BigInt(body.amountMinor) : undefined,
      currency: body.currency || 'USD',
      failureReason: body.failureReason,
      rawPayload: body,
    };
  }

  async processRefund(params: RefundParams): Promise<RefundResult> {
    const refundId = `mock_ref_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    this.logger.log(`Processed sandbox refund ${refundId} for provider order ${params.providerOrderId}`);

    return {
      success: true,
      refundId,
      status: 'SUCCEEDED',
      rawResponse: {
        amountCents: params.amountCents.toString(),
        reason: params.reason,
        simulatedAt: new Date().toISOString(),
      },
    };
  }

  async executePayout(params: PayoutParams): Promise<PayoutResult> {
    const payoutId = `mock_payout_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    this.logger.log(`Initiated sandbox payout ${payoutId} for withdrawal ${params.withdrawalId}`);

    return {
      success: true,
      payoutId,
      status: 'PROCESSING',
      estimatedArrival: '1-2 business days (Simulated)',
      rawResponse: {
        withdrawalId: params.withdrawalId,
        amountCents: params.amountCents.toString(),
        destination: params.destinationDetails,
      },
    };
  }
}
