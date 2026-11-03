import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';
import { AssignRoleDto, SanctionUserDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReAuthGuard } from '../auth/guards/re-auth.guard';
import { PlatformOwnerGuard } from './guards/platform-owner.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireReAuth } from '../../common/decorators/require-reauth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, UserStatus } from '@prisma/client';

@ApiTags('Admin & Platform Governance')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

  @Get('users')
  @Roles(UserRole.PLATFORM_OWNER, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List platform users with filtering for staff governance' })
  async getUsers(
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getUsers({
      role,
      status,
      search,
      limit: Number(limit) || 50,
      offset: Number(offset) || 0,
    });
  }

  @Post('users/:id/role')
  @Roles(UserRole.PLATFORM_OWNER)
  @UseGuards(PlatformOwnerGuard, ReAuthGuard)
  @RequireReAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Owner assigns administrative staff roles (Requires recent re-authentication)' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  async assignRole(
    @CurrentUser('id') actorId: string,
    @Param('id') targetUserId: string,
    @Body() dto: AssignRoleDto,
    @Ip() ipAddress: string,
  ) {
    return this.adminService.assignRole(actorId, targetUserId, dto, ipAddress);
  }

  @Patch('users/:id/sanction')
  @Roles(UserRole.PLATFORM_OWNER, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue sanctions on user account (Restriction, Suspension, Ban)' })
  async sanctionUser(
    @CurrentUser('id') actorId: string,
    @CurrentUser('primaryRole') actorRole: string,
    @Param('id') targetUserId: string,
    @Body() dto: SanctionUserDto,
    @Ip() ipAddress: string,
  ) {
    return this.adminService.sanctionUser(actorId, actorRole, targetUserId, dto, ipAddress);
  }

  @Get('audit-logs')
  @Roles(UserRole.PLATFORM_OWNER, UserRole.SUPER_ADMIN, UserRole.MODERATOR, UserRole.SUPPORT_AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inspect immutable append-only audit trail' })
  async getAuditLogs(
    @Query('actorId') actorId?: string,
    @Query('resourceType') resourceType?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.auditService.getLogs({
      actorId,
      resourceType,
      limit: Number(limit) || 50,
      offset: Number(offset) || 0,
    });
  }

  @Get('dashboard-stats')
  @Roles(UserRole.PLATFORM_OWNER, UserRole.SUPER_ADMIN, UserRole.MODERATOR, UserRole.SUPPORT_AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get global marketplace governance overview metrics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}
