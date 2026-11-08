import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DisputeStatus, UserRole } from '@prisma/client';

@ApiTags('Dispute Arbitration & Resolution')
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate a formal dispute on a participation slot with reason code and evidence' })
  @ApiResponse({ status: 201, description: 'Dispute opened and slot transitioned to DISPUTED status' })
  async createDispute(
    @CurrentUser('id') userId: string,
    @CurrentUser('primaryRole') role: UserRole,
    @Body() dto: CreateDisputeDto,
    @Ip() ipAddress?: string,
  ) {
    return this.disputesService.createDispute(userId, role, dto, ipAddress);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List disputes filtered by current user role or status' })
  async getDisputes(
    @CurrentUser('id') userId: string,
    @CurrentUser('primaryRole') role: UserRole,
    @Query('status') status?: DisputeStatus,
  ) {
    return this.disputesService.getDisputes(userId, role, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get complete arbitration dossier (submissions, instructions, evidence, audit logs)' })
  async getDisputeById(
    @CurrentUser('id') userId: string,
    @CurrentUser('primaryRole') role: UserRole,
    @Param('id') disputeId: string,
  ) {
    return this.disputesService.getDisputeById(disputeId, userId, role);
  }

  @Post(':id/evidence')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Attach supplementary evidence files to an open dispute' })
  async addEvidence(
    @CurrentUser('id') userId: string,
    @Param('id') disputeId: string,
    @Body('evidenceFileIds') evidenceFileIds: string[],
    @Ip() ipAddress?: string,
  ) {
    return this.disputesService.addEvidenceToDispute(disputeId, userId, evidenceFileIds, ipAddress);
  }

  @Post(':id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.PLATFORM_OWNER,
    UserRole.SUPER_ADMIN,
    UserRole.MODERATOR,
    UserRole.SUPPORT_AGENT,
  )
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Admin arbitration ruling (SETTLE_WORKER, REFUND_BUYER, SPLIT_SETTLEMENT, DISMISS) with ledger settlement',
  })
  async resolveDispute(
    @CurrentUser('id') adminId: string,
    @CurrentUser('primaryRole') role: UserRole,
    @Param('id') disputeId: string,
    @Body() dto: ResolveDisputeDto,
    @Ip() ipAddress?: string,
  ) {
    return this.disputesService.resolveDispute(adminId, role, disputeId, dto, ipAddress);
  }
}
