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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Open Marketplace Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Discover tasks on open marketplace with faceted filters & participation statistics' })
  @ApiResponse({ status: 200, description: 'Paginated marketplace task catalog' })
  async findTasks(@Query() query: QueryTaskDto) {
    return this.tasksService.findTasks(query);
  }

  @Get('public/platform-stats')
  @ApiOperation({ summary: 'Get live database-backed public marketplace metrics' })
  async getPublicPlatformStats() {
    return this.tasksService.getPublicPlatformStats();
  }

  @Get('participations/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all task participation records for the current worker' })
  async getMyParticipations(@CurrentUser('id') workerId: string) {
    return this.tasksService.getWorkerParticipations(workerId);
  }

  @Get('participations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get details for a single participation record' })
  async getParticipationById(
    @CurrentUser('id') userId: string,
    @Param('id') participationId: string,
  ) {
    return this.tasksService.getParticipationById(userId, participationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complete task details, versioned instructions, and Participation Dashboard' })
  async getTaskById(@Param('id') taskId: string) {
    return this.tasksService.getTaskById(taskId);
  }

  @Get(':id/participation-stats')
  @ApiOperation({ summary: 'Get real-time participation statistics (Total, Working, Submitted, Approved, Open)' })
  async getParticipationStats(@Param('id') taskId: string) {
    return this.tasksService.getParticipationStats(taskId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a new multi-worker task campaign with atomic demo escrow lock' })
  @ApiResponse({ status: 201, description: 'Task published on marketplace' })
  async createTask(
    @CurrentUser('id') buyerId: string,
    @Body() dto: CreateTaskDto,
    @Ip() ipAddress: string,
  ) {
    return this.tasksService.createTask(buyerId, dto, ipAddress);
  }

  @Post(':id/accept-slot')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Worker atomically claims an available slot on an open marketplace task' })
  @ApiResponse({ status: 201, description: 'Slot claimed; start deadline countdown active' })
  async acceptSlot(
    @CurrentUser('id') workerId: string,
    @Param('id') taskId: string,
    @Ip() ipAddress: string,
  ) {
    return this.tasksService.acceptSlot(workerId, taskId, ipAddress);
  }

  @Post(':id/pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pause task acceptance (freezes new slots, active workers continue)' })
  async pauseTask(
    @CurrentUser('id') buyerId: string,
    @Param('id') taskId: string,
  ) {
    return this.tasksService.pauseTask(buyerId, taskId);
  }

  @Post(':id/resume')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resume paused task acceptance' })
  async resumeTask(
    @CurrentUser('id') buyerId: string,
    @Param('id') taskId: string,
  ) {
    return this.tasksService.resumeTask(buyerId, taskId);
  }

  @Post(':id/close-remaining-slots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close remaining unfilled slots and refund unallocated demo escrow' })
  async closeRemainingSlots(
    @CurrentUser('id') buyerId: string,
    @Param('id') taskId: string,
  ) {
    return this.tasksService.closeRemainingSlots(buyerId, taskId);
  }

  @Post('participations/:id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Worker submits deliverables for review on their claimed slot' })
  async submitWork(
    @CurrentUser('id') workerId: string,
    @Param('id') participationId: string,
    @Body() dto: SubmitTaskDto,
    @Ip() ipAddress: string,
  ) {
    return this.tasksService.submitWork(workerId, participationId, dto, ipAddress);
  }

  @Post('participations/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buyer evaluates submission (APPROVE, REQUEST_REVISION, REJECT)' })
  async reviewParticipation(
    @CurrentUser('id') buyerId: string,
    @Param('id') participationId: string,
    @Body() dto: ReviewSubmissionDto,
    @Ip() ipAddress: string,
  ) {
    return this.tasksService.reviewParticipation(buyerId, participationId, dto, ipAddress);
  }

  @Post('participations/:id/milestones/:mId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Worker checks off milestone progress item' })
  async updateMilestoneProgress(
    @CurrentUser('id') workerId: string,
    @Param('id') participationId: string,
    @Param('mId') milestoneId: string,
    @Body('isCompleted') isCompleted: boolean,
  ) {
    return this.tasksService.updateMilestoneProgress(workerId, participationId, milestoneId, isCompleted);
  }
}
