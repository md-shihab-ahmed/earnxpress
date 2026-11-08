import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EmailDeliveryService } from './email-delivery.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ReAuthGuard } from './guards/re-auth.guard';
import { VerifiedUserGuard } from './guards/verified-user.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET') || 'dev_jwt_access_secret_earnxpress_min_32_chars_long_123!',
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRY') || '15m',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailDeliveryService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    ReAuthGuard,
    VerifiedUserGuard,
  ],
  exports: [
    AuthService,
    EmailDeliveryService,
    JwtAuthGuard,
    RolesGuard,
    ReAuthGuard,
    VerifiedUserGuard,
  ],
})
export class AuthModule {}
