import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PlatformOwnerGuard } from './guards/platform-owner.guard';

@Module({
  controllers: [AdminController],
  providers: [AdminService, PlatformOwnerGuard],
  exports: [AdminService],
})
export class AdminModule {}
