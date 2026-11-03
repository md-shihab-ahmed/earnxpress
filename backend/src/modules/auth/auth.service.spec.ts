import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRole, UserStatus } from '@prisma/client';

describe('AuthService (Authentication, Passwords, MFA & Sessions)', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwt: any;
  let mockAudit: any;

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userProfile: {
        create: jest.fn(),
      },
      demoLedgerAccount: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };

    mockJwt = {
      sign: jest.fn().mockReturnValue('mock_jwt_token_string'),
      verify: jest.fn(),
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue({ id: 'audit-id' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: AuditService, useValue: mockAudit },
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
      const password = 'SuperSecretPassword123!';
      const hash = await service.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);

      const isValid = await service.verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await service.verifyPassword('WrongPassword!', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('2. User Registration', () => {
    it('should prevent registration with duplicate email address', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id', email: 'worker@earnxpress.com' });

      await expect(
        service.register({
          email: 'worker@earnxpress.com',
          password: 'Password123!',
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
        tokenVersion: 1,
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await service.register({
        email: 'newworker@earnxpress.com',
        password: 'Password123!',
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
        service.login({
          email: 'ghost@earnxpress.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login for suspended or banned accounts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-banned',
        email: 'banned@earnxpress.com',
        status: UserStatus.BANNED,
      });

      await expect(
        service.login({
          email: 'banned@earnxpress.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should require MFA code when mfaEnabled is true', async () => {
      const password = 'Password123!';
      const passwordHash = await service.hashPassword(password);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-mfa',
        email: 'mfa@earnxpress.com',
        passwordHash,
        status: UserStatus.ACTIVE,
        mfaEnabled: true,
        mfaSecretEncrypted: 'JBSWY3DPEHPK3PXP',
      });

      const result = await service.login({
        email: 'mfa@earnxpress.com',
        password,
      });

      expect(result.requiresMfa).toBe(true);
      expect(result.userId).toBe('user-mfa');
    });
  });

  describe('4. Re-Authentication', () => {
    it('should update lastReAuthAt upon confirming password', async () => {
      const password = 'Password123!';
      const passwordHash = await service.hashPassword(password);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash,
        primaryRole: UserRole.BUYER,
      });
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await service.reAuthenticate('user-1', password);

      expect(result.reAuthenticated).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { lastReAuthAt: expect.any(Date) },
      });
    });
  });
});
