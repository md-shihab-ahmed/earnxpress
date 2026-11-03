import { Module, forwardRef } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { DemoFinanceModule } from '../demo-finance/demo-finance.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [DemoFinanceModule, forwardRef(() => PaymentsModule)],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
