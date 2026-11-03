import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRole, UserStatus } from '@prisma/client';

describe('AdminService (Governance, Owner Isolation & Sanctions)', () => {
  let service: AdminService;
  let mockPrisma: any;
  let mockAudit: any;

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      task: {
        count: jest.fn(),
      },
      workerParticipation: {
        count: jest.fn(),
      },
      auditLog: {
        count: jest.fn(),
      },
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue({ id: 'audit-admin' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  describe('1. Platform Owner Privilege Isolation', () => {
    it('should prevent demoting or altering the Platform Owner role through API', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'owner-id',
        primaryRole: UserRole.PLATFORM_OWNER,
      });

      await expect(
        service.assignRole('owner-id', 'owner-id', {
          newRole: UserRole.MODERATOR,
          reason: 'Attempted demotion',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent sanctioning or banning the Platform Owner account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'owner-id',
        primaryRole: UserRole.PLATFORM_OWNER,
      });

      await expect(
        service.sanctionUser('mod-id', 'MODERATOR', 'owner-id', {
          newStatus: UserStatus.BANNED,
          reason: 'Unauthorized attempt to ban root owner',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Role Assignment & Session Invalidation', () => {
    it('should elevate user to MODERATOR, invalidate active sessions, and record audit log', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'target-worker',
        primaryRole: UserRole.WORKER,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'target-worker',
        primaryRole: UserRole.MODERATOR,
      });

      const result = await service.assignRole(
        'owner-id',
        'target-worker',
        {
          newRole: UserRole.MODERATOR,
          reason: 'Vetted community member appointed as moderator',
        },
        '192.168.1.1',
      );

      expect(result.newRole).toBe(UserRole.MODERATOR);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'target-worker' },
        data: expect.objectContaining({
          primaryRole: UserRole.MODERATOR,
          tokenVersion: { increment: 1 },
        }),
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ADMIN_ROLE_ASSIGNED' }),
      );
    });
  });

  describe('3. User Sanctions & Audit Trails', () => {
    it('should suspend user account and terminate active sessions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'bad-user',
        primaryRole: UserRole.WORKER,
        status: UserStatus.ACTIVE,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'bad-user',
        status: UserStatus.SUSPENDED,
      });

      const result = await service.sanctionUser(
        'mod-1',
        'MODERATOR',
        'bad-user',
        {
          newStatus: UserStatus.SUSPENDED,
          reason: 'Violated marketplace communication guidelines repeatedly',
        },
      );

      expect(result.newStatus).toBe(UserStatus.SUSPENDED);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'bad-user' },
        data: expect.objectContaining({
          status: UserStatus.SUSPENDED,
          tokenVersion: { increment: 1 },
        }),
      });
    });
  });

  describe('4. User Listing and Governance', () => {
    it('should list users with applied filters and pagination', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'u-1',
          email: 'worker@earnxpress.demo',
          primaryRole: UserRole.WORKER,
          status: UserStatus.ACTIVE,
          idvStatus: 'VERIFIED',
          emailVerified: true,
          createdAt: new Date(),
          profile: {
            displayName: 'Rahim Worker',
            countryCode: 'BD',
            reputationScore: 4.95,
            completionRate: 98.0,
            totalReviewsCount: 15,
          },
        },
      ]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.getUsers({ role: UserRole.WORKER, limit: 10, offset: 0 });
      expect(result.users).toHaveLength(1);
      expect(result.users[0].displayName).toBe('Rahim Worker');
      expect(result.meta.totalCount).toBe(1);
    });
  });
});
