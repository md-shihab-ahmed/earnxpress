import { Module } from '@nestjs/common';
import { DemoFinanceService } from './demo-finance.service';
import { DemoFinanceController } from './demo-finance.controller';

@Module({
  controllers: [DemoFinanceController],
  providers: [DemoFinanceService],
  exports: [DemoFinanceService],
})
export class DemoFinanceModule {}
