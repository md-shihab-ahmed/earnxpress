import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './config/env.config';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DemoFinanceModule } from './modules/demo-finance/demo-finance.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { IdvModule } from './modules/idv/idv.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 120),
        },
      ],
      inject: [ConfigService],
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    DemoFinanceModule,
    TasksModule,
    AdminModule,
    PaymentsModule,
    EvidenceModule,
    DisputesModule,
    ConversationsModule,
    IdvModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
