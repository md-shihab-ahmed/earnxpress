import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AssignRoleDto, SanctionUserDto } from './dto/assign-role.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Only Platform Owner can assign administrative roles
   */
  async assignRole(actorId: string, targetUserId: string, dto: AssignRoleDto, ipAddress?: string) {
    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('Target user not found');

    if (targetUser.primaryRole === UserRole.PLATFORM_OWNER) {
      throw new BadRequestException('Platform Owner role cannot be demoted or altered through API');
    }

    const previousRole = targetUser.primaryRole;

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        primaryRole: dto.newRole,
        tokenVersion: { increment: 1 }, // Invalidate existing sessions
      },
    });

    await this.auditService.log({
      actorId,
      actorRole: 'PLATFORM_OWNER',
      action: 'ADMIN_ROLE_ASSIGNED',
      resourceType: 'User',
      resourceId: targetUserId,
      previousState: { role: previousRole },
      newState: { role: dto.newRole },
      reason: dto.reason,
      ipAddress,
    });

    return {
      userId: updated.id,
      previousRole,
      newRole: updated.primaryRole,
    };
  }

  /**
   * Sanction a user account (Warning, Restriction, Suspension, Ban)
   */
  async sanctionUser(actorId: string, actorRole: string, targetUserId: string, dto: SanctionUserDto, ipAddress?: string) {
    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('Target user not found');

    if (targetUser.primaryRole === UserRole.PLATFORM_OWNER) {
      throw new BadRequestException('Platform Owner account cannot be sanctioned');
    }

    const previousStatus = targetUser.status;

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        status: dto.newStatus,
        tokenVersion: { increment: 1 }, // Terminate active sessions upon sanction
      },
    });

    await this.auditService.log({
      actorId,
      actorRole,
      action: `ADMIN_USER_SANCTIONED_${dto.newStatus}`,
      resourceType: 'User',
      resourceId: targetUserId,
      previousState: { status: previousStatus },
      newState: { status: dto.newStatus },
      reason: dto.reason,
      ipAddress,
    });

    return {
      userId: updated.id,
      previousStatus,
      newStatus: updated.status,
    };
  }

  /**
   * Global administration dashboard metrics
   */
  async getDashboardStats() {
    const [totalUsers, totalTasks, openTasks, totalParticipations, auditCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.task.count(),
      this.prisma.task.count({ where: { status: 'OPEN' } }),
      this.prisma.workerParticipation.count(),
      this.prisma.auditLog.count(),
    ]);

    return {
      totalUsers,
      totalTasks,
      openTasks,
      totalParticipations,
      totalAuditEvents: auditCount,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
