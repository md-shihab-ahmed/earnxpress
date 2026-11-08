import { Module } from '@nestjs/common';
import { IdvController } from './idv.controller';
import { IdvService } from './idv.service';
import { MockKycProvider } from './providers/mock-kyc.provider';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [IdvController],
  providers: [IdvService, MockKycProvider],
  exports: [IdvService, MockKycProvider],
})
export class IdvModule {}
