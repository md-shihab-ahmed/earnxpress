import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateAuditLogParams {
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: CreateAuditLogParams) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          actorRole: params.actorRole,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          previousState: params.previousState ? JSON.parse(JSON.stringify(params.previousState)) : null,
          newState: params.newState ? JSON.parse(JSON.stringify(params.newState)) : null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          reason: params.reason || null,
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to record audit log: ${err.message}`, err.stack);
      // Fail closed or bubble up depending on critical operation
      throw err;
    }
  }

  async getLogs(filter: { actorId?: string; resourceType?: string; limit?: number; offset?: number }) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(filter.actorId && { actorId: filter.actorId }),
        ...(filter.resourceType && { resourceType: filter.resourceType }),
      },
      orderBy: { createdAt: 'desc' },
      take: filter.limit || 50,
      skip: filter.offset || 0,
    });
  }
}
