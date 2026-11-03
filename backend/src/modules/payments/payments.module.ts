import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RealLedgerService } from './real-ledger.service';
import { PaymentProviderFactory } from './adapters/payment-provider.factory';
import { SandboxMockAdapter } from './adapters/sandbox-mock.adapter';
import { StripeAdapter } from './adapters/stripe.adapter';
import { SslcommerzAdapter } from './adapters/sslcommerz.adapter';
import { PaypalAdapter } from './adapters/paypal.adapter';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    RealLedgerService,
    PaymentProviderFactory,
    SandboxMockAdapter,
    StripeAdapter,
    SslcommerzAdapter,
    PaypalAdapter,
  ],
  exports: [PaymentsService, RealLedgerService],
})
export class PaymentsModule {}
