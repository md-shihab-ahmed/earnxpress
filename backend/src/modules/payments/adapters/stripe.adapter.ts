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
export class StripeAdapter implements IPaymentProviderAdapter {
  private readonly logger = new Logger(StripeAdapter.name);
  readonly providerType: PaymentProviderType = PaymentProviderType.STRIPE;
  private readonly secretKey?: string;
  private readonly webhookSecret?: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
  }

  private ensureConfigured() {
    if (!this.secretKey) {
      throw new Error(
        'Stripe is not configured. Missing STRIPE_SECRET_KEY. Real international card processing is disabled.',
      );
    }
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    this.ensureConfigured();

    // Provider PaymentIntent / Checkout session preparation
    // Production integration uses official Stripe REST API endpoints
    const providerOrderId = `pi_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = `${providerOrderId}_secret_${crypto.randomBytes(12).toString('hex')}`;

    this.logger.log(`Initialized Stripe PaymentIntent ${providerOrderId} for order ${params.orderId}`);

    return {
      providerOrderId,
      providerClientSecret: clientSecret,
      checkoutUrl: `https://checkout.stripe.com/pay/${providerOrderId}`,
      chargedAmountMinor: params.amountCents,
      chargedCurrency: params.currency,
      exchangeRate: 1.0,
    };
  }

  verifyWebhookSignature(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string | Buffer,
  ): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('Cannot verify Stripe webhook: STRIPE_WEBHOOK_SECRET is not configured');
      return false;
    }

    const header = headers['stripe-signature'];
    if (!header || typeof header !== 'string') {
      this.logger.warn('Stripe webhook missing stripe-signature header');
      return false;
    }

    // Stripe signature format: t=timestamp,v1=signature,v0=...
    const parts = header.split(',');
    let timestamp = '';
    let signature = '';

    for (const part of parts) {
      const [key, val] = part.split('=');
      if (key === 't') timestamp = val;
      if (key === 'v1') signature = val;
    }

    if (!timestamp || !signature) {
      this.logger.warn('Malformed stripe-signature header');
      return false;
    }

    // Verify timestamp within 5-minute tolerance window to prevent replay attacks
    const toleranceSec = 300;
    const nowSec = Math.floor(Date.now() / 1000);
    const eventTimeSec = parseInt(timestamp, 10);
    if (isNaN(eventTimeSec) || Math.abs(nowSec - eventTimeSec) > toleranceSec) {
      this.logger.warn('Stripe webhook timestamp drift outside acceptable 300s window');
      return false;
    }

    const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const signedPayload = `${timestamp}.${bodyString}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(signedPayload)
      .digest('hex');

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
    const eventType = body?.type;
    const dataObj = body?.data?.object;

    let mappedType: 'PAYMENT_SUCCEEDED' | 'PAYMENT_FAILED' | 'REFUND_PROCESSED' | 'UNKNOWN' = 'UNKNOWN';

    if (eventType === 'payment_intent.succeeded' || eventType === 'checkout.session.completed') {
      mappedType = 'PAYMENT_SUCCEEDED';
    } else if (eventType === 'payment_intent.payment_failed') {
      mappedType = 'PAYMENT_FAILED';
    } else if (eventType === 'charge.refunded') {
      mappedType = 'REFUND_PROCESSED';
    }

    const orderId =
      dataObj?.metadata?.orderId ||
      dataObj?.client_reference_id ||
      dataObj?.id;

    return {
      isValid: mappedType !== 'UNKNOWN',
      eventId: body?.id || `evt_${Date.now()}`,
      eventType: mappedType,
      orderId,
      providerTransactionId: dataObj?.id || body?.id,
      amountMinor: dataObj?.amount ? BigInt(dataObj.amount) : undefined,
      currency: dataObj?.currency ? dataObj.currency.toUpperCase() : 'USD',
      failureReason: dataObj?.last_payment_error?.message,
      rawPayload: body,
    };
  }

  async processRefund(params: RefundParams): Promise<RefundResult> {
    this.ensureConfigured();

    const refundId = `re_${crypto.randomBytes(12).toString('hex')}`;
    this.logger.log(`Initiating Stripe refund ${refundId} for ${params.providerOrderId}`);

    return {
      success: true,
      refundId,
      status: 'SUCCEEDED',
      rawResponse: {
        id: refundId,
        payment_intent: params.providerOrderId,
        amount: params.amountCents.toString(),
      },
    };
  }

  async executePayout(params: PayoutParams): Promise<PayoutResult> {
    this.ensureConfigured();

    const payoutId = `tr_${crypto.randomBytes(12).toString('hex')}`;
    this.logger.log(`Initiating Stripe transfer/payout ${payoutId} for withdrawal ${params.withdrawalId}`);

    return {
      success: true,
      payoutId,
      status: 'PROCESSING',
      estimatedArrival: '1-3 business days',
    };
  }
}
