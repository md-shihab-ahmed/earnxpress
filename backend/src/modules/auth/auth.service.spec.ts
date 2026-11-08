import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailDeliveryService } from './email-delivery.service';
import { UserRole, UserStatus } from '@prisma/client';

describe('AuthService (Authentication, Passwords, MFA & Sessions)', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwt: any;
  let mockAudit: any;
  let mockEmailDelivery: any;

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userProfile: {
        create: jest.fn(),
      },
      demoLedgerAccount: {
        createMany: jest.fn(),
      },
      emailVerificationToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      passwordResetToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb) => (typeof cb === 'function' ? cb(mockPrisma) : Promise.all(cb))),
    };

    mockJwt = {
      sign: jest.fn().mockReturnValue('mock_jwt_token_string'),
      verify: jest.fn(),
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue({ id: 'audit-id' }),
    };

    mockEmailDelivery = {
      sendVerificationEmail: jest.fn().mockResolvedValue({
        delivered: false,
        provider: 'NONE',
        status: 'PENDING_DELIVERY_UNCONFIGURED',
        recipient: 'test@earnxpress.com',
        message: 'Email provider not configured',
      }),
      sendPasswordResetEmail: jest.fn().mockResolvedValue({
        delivered: false,
        provider: 'NONE',
        status: 'PENDING_DELIVERY_UNCONFIGURED',
        recipient: 'test@earnxpress.com',
        message: 'Email provider not configured',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: AuditService, useValue: mockAudit },
        { provide: EmailDeliveryService, useValue: mockEmailDelivery },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, def: any) => def),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('1. Password Security & Hashing', () => {
    it('should hash password and verify match correctly', async () => {
      const password = 'SuperSecretP@ssw0rd2026!';
      const hash = await service.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);

      const isValid = await service.verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await service.verifyPassword('WrongPassword123!', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('2. User Registration', () => {
    it('should prevent registration with duplicate email address', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id', email: 'worker@earnxpress.com' });

      await expect(
        service.register({
          email: 'worker@earnxpress.com',
          password: 'ValidP@ssw0rd2026!',
          confirmPassword: 'ValidP@ssw0rd2026!',
          displayName: 'Test User',
          countryCode: 'BD',
          primaryRole: UserRole.WORKER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create User, Profile, and Demo Ledger accounts upon successful registration', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const createdUser = {
        id: 'new-user-1',
        email: 'newworker@earnxpress.com',
        primaryRole: UserRole.WORKER,
        status: UserStatus.ACTIVE,
        emailVerified: false,
        tokenVersion: 1,
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await service.register({
        email: 'newworker@earnxpress.com',
        password: 'ValidP@ssw0rd2026!',
        confirmPassword: 'ValidP@ssw0rd2026!',
        displayName: 'New Worker',
        countryCode: 'BD',
        primaryRole: UserRole.WORKER,
      });

      expect(result.user.id).toBe(createdUser.id);
      expect(result.accessToken).toBe('mock_jwt_token_string');
      expect(mockPrisma.userProfile.create).toHaveBeenCalled();
      expect(mockPrisma.demoLedgerAccount.createMany).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AUTH_REGISTER' }),
      );
    });
  });

  describe('3. Login & Credential Verification', () => {
    it('should reject login with non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@earnxpress.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login with incorrect password', async () => {
      const hash = await service.hashPassword('CorrectP@ssw0rd2026!');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'worker@earnxpress.com',
        passwordHash: hash,
        status: UserStatus.ACTIVE,
        consecutiveFailures: 0,
      });

      await expect(
        service.login({ email: 'worker@earnxpress.com', password: 'WrongP@ssw0rd2026!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should issue tokens upon valid credentials', async () => {
      const hash = await service.hashPassword('CorrectP@ssw0rd2026!');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'worker@earnxpress.com',
        passwordHash: hash,
        status: UserStatus.ACTIVE,
        consecutiveFailures: 0,
        primaryRole: UserRole.WORKER,
        profile: { displayName: 'Worker 1' },
      });

      const result = await service.login({ email: 'worker@earnxpress.com', password: 'CorrectP@ssw0rd2026!' });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('4. Token Invalidation and Logout', () => {
    it('should increment tokenVersion on logout to invalidate active sessions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', primaryRole: 'WORKER' });
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1', tokenVersion: 2 });

      const result = await service.logout('user-1');
      expect(result.loggedOut).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { tokenVersion: { increment: 1 } },
      });
    });
  });
});
