import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole, UserStatus, DemoAccountType } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Password hashing with Argon2id or secure bcrypt fallback
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const argon2 = await import('argon2');
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });
    } catch {
      // Secure fallback to bcrypt (12 rounds) if native Argon2 binary is unavailable
      const salt = await bcrypt.genSalt(12);
      return bcrypt.hash(password, salt);
    }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const argon2 = await import('argon2');
      if (hash.startsWith('$argon2')) {
        return await argon2.verify(hash, password);
      }
    } catch {
      // Fallback check
    }
    return bcrypt.compare(password, hash);
  }

  /**
   * Register a new user and initialize their demo ledger accounts
   */
  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException({
        code: 'ERR_EMAIL_EXISTS',
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      // 1. Create base user record
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          passwordHash,
          primaryRole: dto.primaryRole,
          status: UserStatus.ACTIVE,
          emailVerified: false,
          tokenVersion: 1,
          lastReAuthAt: new Date(),
        },
      });

      // 2. Create user profile
      await tx.userProfile.create({
        data: {
          userId: newUser.id,
          displayName: dto.displayName.trim(),
          countryCode: dto.countryCode.toUpperCase().trim(),
          reputationScore: 5.0,
          completionRate: 100.0,
        },
      });

      // 3. Initialize Demo Ledger Accounts based on primary role
      if (dto.primaryRole === UserRole.BUYER) {
        await tx.demoLedgerAccount.createMany({
          data: [
            { userId: newUser.id, accountType: DemoAccountType.DEMO_BUYER_AVAILABLE, currency: 'USD', balanceCents: 0n },
            { userId: newUser.id, accountType: DemoAccountType.DEMO_BUYER_ESCROW_RESERVED, currency: 'USD', balanceCents: 0n },
          ],
        });
      } else {
        await tx.demoLedgerAccount.createMany({
          data: [
            { userId: newUser.id, accountType: DemoAccountType.DEMO_WORKER_AVAILABLE, currency: 'USD', balanceCents: 0n },
            { userId: newUser.id, accountType: DemoAccountType.DEMO_WORKER_PENDING_DISPUTE, currency: 'USD', balanceCents: 0n },
          ],
        });
      }

      return newUser;
    });

    await this.auditService.log({
      actorId: user.id,
      actorRole: user.primaryRole,
      action: 'AUTH_REGISTER',
      resourceType: 'User',
      resourceId: user.id,
      ipAddress,
      userAgent,
      reason: 'User self-registration',
    });

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        primaryRole: user.primaryRole,
        status: user.status,
      },
      ...tokens,
    };
  }

  /**
   * Authenticate user, verify MFA if configured, and generate session tokens
   */
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'ERR_INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    if (user.status === UserStatus.BANNED || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException({
        code: 'ERR_ACCOUNT_SUSPENDED',
        message: `Account is ${user.status.toLowerCase()}. Please contact support.`,
      });
    }

    const isMatch = await this.verifyPassword(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException({
        code: 'ERR_INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    // Verify MFA if enabled
    if (user.mfaEnabled) {
      if (!dto.mfaCode) {
        return {
          requiresMfa: true,
          userId: user.id,
        };
      }
      const isValidMfa = this.verifyTotp(dto.mfaCode, user.mfaSecretEncrypted || '');
      if (!isValidMfa) {
        throw new UnauthorizedException({
          code: 'ERR_INVALID_MFA',
          message: 'Invalid two-factor authentication code.',
        });
      }
    }

    // Update lastReAuthAt on successful full login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastReAuthAt: new Date() },
    });

    await this.auditService.log({
      actorId: user.id,
      actorRole: user.primaryRole,
      action: 'AUTH_LOGIN',
      resourceType: 'User',
      resourceId: user.id,
      ipAddress,
      userAgent,
      reason: 'User authenticated',
    });

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        primaryRole: user.primaryRole,
        displayName: user.profile?.displayName,
      },
      ...tokens,
    };
  }

  /**
   * Re-authenticate user before sensitive operations
   */
  async reAuthenticate(userId: string, password: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const isMatch = await this.verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException({
        code: 'ERR_INVALID_REAUTH',
        message: 'Invalid password. Re-authentication failed.',
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { lastReAuthAt: new Date() },
    });

    await this.auditService.log({
      actorId: user.id,
      actorRole: user.primaryRole,
      action: 'AUTH_REAUTHENTICATE',
      resourceType: 'User',
      resourceId: user.id,
      ipAddress,
      reason: 'Confirmed credentials for sensitive operation',
    });

    return { reAuthenticated: true, timestamp: new Date().toISOString() };
  }

  /**
   * Refresh Token rotation and reissue
   */
  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev_jwt_refresh_secret_earnxpress_min_32_chars_long_456!',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('Refresh token revoked');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Invalidate all active sessions for a user (Logout)
   */
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    return { loggedOut: true };
  }

  /**
   * TOTP MFA Setup: Generates secret & QR code
   */
  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, 'EarnXpress', secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

    // Store secret temporarily until verified
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecretEncrypted: secret },
    });

    return { secret, qrCodeDataUrl };
  }

  /**
   * Confirm TOTP code and activate MFA
   */
  async verifyMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecretEncrypted) {
      throw new BadRequestException('MFA setup has not been initiated');
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.mfaSecretEncrypted,
    });

    if (!isValid) {
      throw new BadRequestException({
        code: 'ERR_INVALID_TOTP',
        message: 'Invalid 6-digit TOTP code',
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    await this.auditService.log({
      actorId: user.id,
      actorRole: user.primaryRole,
      action: 'AUTH_MFA_ENABLED',
      resourceType: 'User',
      resourceId: user.id,
      reason: 'TOTP MFA activated by user',
    });

    return { mfaEnabled: true };
  }

  verifyTotp(code: string, secret: string): boolean {
    return authenticator.verify({ token: code, secret });
  }

  private async generateTokens(user: { id: string; email: string; primaryRole: string; tokenVersion: number }) {
    const payload = {
      sub: user.id,
      email: user.email,
      primaryRole: user.primaryRole,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'dev_jwt_access_secret_earnxpress_min_32_chars_long_123!',
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev_jwt_refresh_secret_earnxpress_min_32_chars_long_456!',
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d',
    });

    return { accessToken, refreshToken };
  }
}
