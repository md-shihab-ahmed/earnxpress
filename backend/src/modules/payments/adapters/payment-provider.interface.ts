import { PaymentProviderType } from '@prisma/client';

export interface CreateOrderParams {
  orderId: string;
  amountCents: bigint;
  currency: string;
  customerEmail: string;
  customerName?: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CreateOrderResult {
  providerOrderId: string;
  providerClientSecret?: string;
  checkoutUrl?: string;
  chargedAmountMinor?: bigint;
  chargedCurrency?: string;
  exchangeRate?: number;
}

export interface WebhookParsedEvent {
  isValid: boolean;
  eventId: string;
  eventType: 'PAYMENT_SUCCEEDED' | 'PAYMENT_FAILED' | 'REFUND_PROCESSED' | 'UNKNOWN';
  orderId: string;
  providerTransactionId: string;
  amountMinor?: bigint;
  currency?: string;
  failureReason?: string;
  rawPayload: any;
}

export interface RefundParams {
  providerOrderId: string;
  amountCents: bigint;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  status: 'SUCCEEDED' | 'PENDING' | 'FAILED';
  rawResponse?: any;
}

export interface PayoutParams {
  withdrawalId: string;
  amountCents: bigint;
  destinationDetails: any;
  currency: string;
}

export interface PayoutResult {
  success: boolean;
  payoutId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  estimatedArrival?: string;
  rawResponse?: any;
}

export interface IPaymentProviderAdapter {
  readonly providerType: PaymentProviderType;

  /**
   * Initialize a payment order with the external provider (PaymentIntent, Checkout session, or Hosted Gateway)
   */
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;

  /**
   * Cryptographically verify the incoming webhook payload using the provider's signature header
   */
  verifyWebhookSignature(headers: Record<string, string | string[] | undefined>, rawBody: string | Buffer): boolean;

  /**
   * Parse standardized webhook event from the provider's raw request
   */
  parseWebhookEvent(headers: Record<string, string | string[] | undefined>, body: any): Promise<WebhookParsedEvent>;

  /**
   * Issue a refund for a previously settled transaction
   */
  processRefund(params: RefundParams): Promise<RefundResult>;

  /**
   * Initiate a worker withdrawal payout via the provider's payout API
   */
  executePayout(params: PayoutParams): Promise<PayoutResult>;
}
