import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentProviderType } from '@prisma/client';
import { IPaymentProviderAdapter } from './payment-provider.interface';
import { SandboxMockAdapter } from './sandbox-mock.adapter';
import { StripeAdapter } from './stripe.adapter';
import { SslcommerzAdapter } from './sslcommerz.adapter';
import { PaypalAdapter } from './paypal.adapter';

@Injectable()
export class PaymentProviderFactory {
  constructor(
    private readonly sandboxMockAdapter: SandboxMockAdapter,
    private readonly stripeAdapter: StripeAdapter,
    private readonly sslcommerzAdapter: SslcommerzAdapter,
    private readonly paypalAdapter: PaypalAdapter,
  ) {}

  getAdapter(provider: PaymentProviderType): IPaymentProviderAdapter {
    switch (provider) {
      case PaymentProviderType.SANDBOX_MOCK:
        return this.sandboxMockAdapter;
      case PaymentProviderType.STRIPE:
        return this.stripeAdapter;
      case PaymentProviderType.SSLCOMMERZ:
        return this.sslcommerzAdapter;
      case PaymentProviderType.PAYPAL:
        return this.paypalAdapter;
      default:
        throw new BadRequestException(`Unsupported payment provider adapter: ${provider}`);
    }
  }
}
