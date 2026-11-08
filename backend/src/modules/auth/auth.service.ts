import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailDeliveryService } from './email-delivery.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-recovery.dto';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';
import { UserRole, UserStatus, DemoAccountType } from '@prisma/client';
import { isValidCountryCode } from '../../common/constants/countries.constant';
import { validatePassword } from '../../common/validators/password.validator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly emailDeliveryService: EmailDeliveryService,
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
   * Register a new user, initialize their demo ledger accounts,
   * and issue a SHA-256 hashed email verification token.
   */
  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    // 1. Password Confirmation Check
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException({
        code: 'ERR_PASSWORD_MISMATCH',
        message: 'Password and confirm password do not match.',
      });
    }

    // 2. Strict Role Check: Reject ADMIN or PLATFORM_OWNER registration
    if (dto.primaryRole !== UserRole.BUYER && dto.primaryRole !== UserRole.WORKER) {
      throw new BadRequestException({
        code: 'ERR_INVALID_ROLE',
        message: 'Public registration is restricted to BUYER or WORKER roles only.',
      });
    }

    // 3. Country Code Check (ISO 3166-1 alpha-2)
    const upperCountry = dto.countryCode?.toUpperCase()?.trim();
    if (!isValidCountryCode(upperCountry)) {
      throw new BadRequestException({
        code: 'ERR_INVALID_COUNTRY',
        message: `Country code '${dto.countryCode}' is not a valid ISO 3166-1 alpha-2 code.`,
      });
    }

    // 4. Password Policy & Dictionary Blacklist Check
    const pwdResult = validatePassword(dto.password, dto.email);
    if (!pwdResult.isValid) {
      throw new BadRequestException({
        code: 'ERR_WEAK_PASSWORD',
        message: pwdResult.errors.join(' '),
        errors: pwdResult.errors,
      });
    }

    // 5. Existing Email Check
    const normalizedEmail = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException({
        code: 'ERR_EMAIL_EXISTS',
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await this.hashPassword(dto.password);

    // 6. Create User and Ledger Accounts in Atomic Transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          primaryRole: dto.primaryRole,
          status: UserStatus.ACTIVE,
          emailVerified: false,
          consecutiveFailures: 0,
          tokenVersion: 1,
          lastReAuthAt: new Date(),
        },
      });

      await tx.userProfile.create({
        data: {
          userId: newUser.id,
          displayName: dto.displayName.trim(),
          countryCode: upperCountry,
          reputationScore: 5.0,
          completionRate: 100.0,
        },
      });

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

    // 7. Generate Random Single-Use 32-Byte Verification Token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours TTL

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // 8. Dispatch Verification Email (or hold in pending unconfigured status)
    const emailDispatch = await this.emailDeliveryService.sendVerificationEmail(
      user.email,
      rawToken,
      dto.displayName,
    );

    await this.auditService.log({
      actorId: user.id,
      actorRole: user.primaryRole,
      action: 'AUTH_REGISTER',
      resourceType: 'User',
      resourceId: user.id,
      ipAddress,
      userAgent,
      reason: 'User self-registration completed',
    });

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        primaryRole: user.primaryRole,
        status: user.status,
        emailVerified: user.emailVerified,
        countryCode: upperCountry,
        displayName: dto.displayName.trim(),
      },
      emailDelivery: {
        status: emailDispatch.status,
        message: emailDispatch.message,
        // Include manual verification URL for dev/test convenience when SMTP is unconfigured
        actionUrl: process.env.NODE_ENV !== 'production' ? emailDispatch.actionUrl : undefined,
      },
      ...tokens,
    };
  }

  /**
   * Verify email using raw single-use token (verified against SHA-256 hash in DB)
   */
  async verifyEmail(dto: VerifyEmailDto, ipAddress?: string) {
    if (!dto.token || typeof dto.token !== 'string') {
      throw new BadRequestException({
        code: 'ERR_TOKEN_REQUIRED',
        message: 'Verification token is required.',
      });
    }

    const tokenHash = crypto.createHash('sha256').update(dto.token.trim()).digest('hex');

    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record) {
      throw new BadRequestException({
        code: 'ERR_TOKEN_INVALID',
        message: 'Verification link is invalid or does not exist.',
      });
    }

    if (record.usedAt) {
      throw new BadRequestException({
        code: 'ERR_TOKEN_ALREADY_USED',
        message: 'This verification link has already been used.',
      });
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'ERR_TOKEN_EXPIRED',
        message: 'This verification link has expired. Please request a new one.',
      });
    }

    // Mark token used and update user status
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
    ]);

    await this.auditService.log({
      actorId: record.userId,
      actorRole: record.user.primaryRole,
      action: 'AUTH_EMAIL_VERIFIED',
      resourceType: 'User',
      resourceId: record.userId,
      ipAddress,
      reason: 'User successfully verified email address',
    });

    return {
      verified: true,
      email: record.user.email,
      message: 'Your email address has been successfully verified! You now have full access to marketplace actions.',
    };
  }

  /**
   * Resend email verification token with 60-second rate limiting
   */
  async resendVerification(dto: ResendVerificationDto) {
    const normalizedEmail = dto.email?.toLowerCase()?.trim();
    if (!normalizedEmail) {
      throw new BadRequestException({
        code: 'ERR_EMAIL_REQUIRED',
        message: 'Email address is required.',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    // If user does not exist or already verified, return generic success to prevent enumeration
    if (!user || user.emailVerified) {
      return {
        success: true,
        message: 'If an unverified account exists with that email address, a new verification link has been sent.',
      };
    }

    // Enforce 60-second cooldown between requests
    const lastToken = await this.prisma.emailVerificationToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (lastToken) {
      const elapsedMs = Date.now() - lastToken.createdAt.getTime();
      const COOLDOWN_MS = 60 * 1000;
      if (elapsedMs < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - elapsedMs) / 1000);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            code: 'ERR_RATE_LIMIT_EXCEEDED',
            message: `Please wait ${remainingSeconds} seconds before requesting another verification email.`,
            retryAfterSeconds: remainingSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Generate fresh 32-byte token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const emailDispatch = await this.emailDeliveryService.sendVerificationEmail(
      user.email,
      rawToken,
      user.profile?.displayName,
    );

    return {
      success: true,
      message: 'A new verification link has been sent.',
      emailDelivery: {
        status: emailDispatch.status,
        message: emailDispatch.message,
        actionUrl: process.env.NODE_ENV !== 'production' ? emailDispatch.actionUrl : undefined,
      },
    };
  }

  /**
   * Authenticate user with Email and Password, enforce brute-force lockout,
   * verify MFA if configured, and generate session tokens.
   */
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const normalizedEmail = dto.email?.toLowerCase()?.trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    // 1. Check Brute-Force Lockout
    if (user && user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.max(1, Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000));
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          code: 'ERR_ACCOUNT_LOCKED',
          message: `Account is temporarily locked due to 5 consecutive failed login attempts. Please try again in ${remainingMinutes} minute(s) or reset your password.`,
          lockedUntil: user.lockedUntil.toISOString(),
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // 2. Generic Credentials Verification (prevent email enumeration)
    if (!user) {
      throw new UnauthorizedException({
        code: 'ERR_INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    // Check account status
    if (user.status === UserStatus.BANNED || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException({
        code: 'ERR_ACCOUNT_SUSPENDED',
        message: `Account is ${user.status.toLowerCase()}. Please contact support.`,
      });
    }

    const isMatch = await this.verifyPassword(dto.password, user.passwordHash);

    if (!isMatch) {
      // Increment consecutive failures
      const newFailures = (user.consecutiveFailures || 0) + 1;
      const MAX_ATTEMPTS = 5;

      if (newFailures >= MAX_ATTEMPTS) {
        const lockoutPeriodMs = 15 * 60 * 1000; // 15 minutes
        const lockedUntil = new Date(Date.now() + lockoutPeriodMs);

        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            consecutiveFailures: newFailures,
            lockedUntil,
          },
        });

        await this.auditService.log({
          actorId: user.id,
          actorRole: user.primaryRole,
          action: 'AUTH_ACCOUNT_LOCKED',
          resourceType: 'User',
          resourceId: user.id,
          ipAddress,
          userAgent,
          reason: `Locked for 15 minutes after ${newFailures} failed login attempts`,
        });

        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            code: 'ERR_ACCOUNT_LOCKED',
            message: 'Account is temporarily locked due to 5 consecutive failed login attempts. Please try again in 15 minutes or reset your password.',
            lockedUntil: lockedUntil.toISOString(),
          },
          HttpStatus.FORBIDDEN,
        );
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { consecutiveFailures: newFailures },
      });

      throw new UnauthorizedException({
        code: 'ERR_INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    // Reset failed login counters upon successful authentication
    if (user.consecutiveFailures > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          consecutiveFailures: 0,
          lockedUntil: null,
        },
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
      reason: 'User authenticated successfully',
    });

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        primaryRole: user.primaryRole,
        status: user.status,
        emailVerified: user.emailVerified,
        displayName: user.profile?.displayName,
        countryCode: user.profile?.countryCode,
      },
      ...tokens,
    };
  }

  /**
   * Request password reset instructions. Always returns generic success.
   */
  async forgotPassword(dto: ForgotPasswordDto, _ipAddress?: string) {
    const normalizedEmail = dto.email?.toLowerCase()?.trim();
    if (!normalizedEmail) {
      return {
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent.',
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (user) {
      // 60-second cooldown check on password reset requests
      const lastToken = await this.prisma.passwordResetToken.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      const canSend = !lastToken || (Date.now() - lastToken.createdAt.getTime() >= 60 * 1000);

      if (canSend) {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour TTL

        await this.prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        });

        await this.emailDeliveryService.sendPasswordResetEmail(
          user.email,
          rawToken,
          user.profile?.displayName,
        );
      }
    }

    return {
      success: true,
      message: 'If an account with that email exists, password reset instructions have been sent.',
    };
  }

  /**
   * Reset user password using raw token, validate password policy,
   * invalidate all existing sessions by incrementing tokenVersion,
   * and clear brute-force lockouts.
   */
  async resetPassword(dto: ResetPasswordDto, ipAddress?: string) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException({
        code: 'ERR_PASSWORD_MISMATCH',
        message: 'Password and confirm password do not match.',
      });
    }

    const pwdResult = validatePassword(dto.password);
    if (!pwdResult.isValid) {
      throw new BadRequestException({
        code: 'ERR_WEAK_PASSWORD',
        message: pwdResult.errors.join(' '),
        errors: pwdResult.errors,
      });
    }

    const tokenHash = crypto.createHash('sha256').update(dto.token.trim()).digest('hex');

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record) {
      throw new BadRequestException({
        code: 'ERR_TOKEN_INVALID',
        message: 'Password reset link is invalid or does not exist.',
      });
    }

    if (record.usedAt) {
      throw new BadRequestException({
        code: 'ERR_TOKEN_ALREADY_USED',
        message: 'This password reset link has already been used.',
      });
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'ERR_TOKEN_EXPIRED',
        message: 'This password reset link has expired. Please request a new one.',
      });
    }

    const newPasswordHash = await this.hashPassword(dto.password);

    // Perform atomic update: update password, invalidate all sessions, clear lockouts, mark token used
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          passwordHash: newPasswordHash,
          tokenVersion: { increment: 1 }, // Invalidates all existing JWT sessions!
          consecutiveFailures: 0,
          lockedUntil: null,
          lastReAuthAt: new Date(),
        },
      }),
    ]);

    await this.auditService.log({
      actorId: record.userId,
      actorRole: record.user.primaryRole,
      action: 'AUTH_PASSWORD_RESET',
      resourceType: 'User',
      resourceId: record.userId,
      ipAddress,
      reason: 'Password reset via valid email token. All active sessions revoked.',
    });

    return {
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new credentials.',
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { primaryRole: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });

    await this.auditService.log({
      actorId: userId,
      actorRole: user?.primaryRole || 'USER',
      action: 'AUTH_LOGOUT',
      resourceType: 'User',
      resourceId: userId,
      reason: 'User logged out and session revoked',
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
