import { Module } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { DemoFinanceModule } from '../demo-finance/demo-finance.module';
import { EvidenceModule } from '../evidence/evidence.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    DemoFinanceModule,
    EvidenceModule,
  ],
  controllers: [DisputesController],
  providers: [DisputesService],
  exports: [DisputesService],
})
export class DisputesModule {}
