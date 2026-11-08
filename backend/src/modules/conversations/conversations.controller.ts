import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Task Communication & Messaging')
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get('task/:taskId/qna')
  @ApiOperation({ summary: 'Get public Q&A thread and messages for a marketplace task' })
  async getTaskQnA(@Param('taskId') taskId: string) {
    return this.conversationsService.getOrCreateTaskQnA(taskId);
  }

  @Post('task/:taskId/qna')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Post question or answer to public task Q&A thread' })
  async postTaskQnA(
    @Param('taskId') taskId: string,
    @CurrentUser('id') senderId: string,
    @Body('content') content: string,
    @Body('attachmentsJson') attachmentsJson?: any,
  ) {
    const qna = await this.conversationsService.getOrCreateTaskQnA(taskId);
    return this.conversationsService.postMessage(
      qna.id,
      senderId,
      content,
      attachmentsJson,
    );
  }

  @Get('slot/:taskId/worker/:workerId/buyer/:buyerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get or create private 1-on-1 thread between Task Buyer and Slot Worker' })
  async getPrivateSlotThread(
    @Param('taskId') taskId: string,
    @Param('workerId') workerId: string,
    @Param('buyerId') buyerId: string,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('primaryRole') role: UserRole,
  ) {
    return this.conversationsService.getOrCreatePrivateSlotThread(
      taskId,
      workerId,
      buyerId,
      requestingUserId,
      role,
    );
  }

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get messages for a conversation thread' })
  async getMessages(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('primaryRole') role: UserRole,
  ) {
    return this.conversationsService.getConversationMessages(
      conversationId,
      userId,
      role,
    );
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message in a conversation thread' })
  async sendMessage(
    @Param('id') conversationId: string,
    @CurrentUser('id') senderId: string,
    @Body('content') content: string,
    @Body('attachmentsJson') attachmentsJson?: any,
  ) {
    return this.conversationsService.postMessage(
      conversationId,
      senderId,
      content,
      attachmentsJson,
    );
  }
}
