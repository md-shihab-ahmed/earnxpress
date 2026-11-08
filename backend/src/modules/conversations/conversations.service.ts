import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class ConversationsService {
  private readonly adminRoles: UserRole[] = [
    UserRole.PLATFORM_OWNER,
    UserRole.SUPER_ADMIN,
    UserRole.MODERATOR,
    UserRole.SUPPORT_AGENT,
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get or create the public Q&A conversation for a task
   */
  async getOrCreateTaskQnA(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        taskId,
        isPublicQnA: true,
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                primaryRole: true,
                profile: { select: { displayName: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          taskId,
          isPublicQnA: true,
        },
        include: {
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  email: true,
                  primaryRole: true,
                  profile: { select: { displayName: true } },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    return conversation;
  }

  /**
   * Get or create a private 1-on-1 thread between Task Buyer and Slot Worker
   */
  async getOrCreatePrivateSlotThread(
    taskId: string,
    workerId: string,
    buyerId: string,
    requestingUserId: string,
    role: string,
  ) {
    const isAdmin = this.adminRoles.includes(role as UserRole);

    if (!isAdmin && requestingUserId !== workerId && requestingUserId !== buyerId) {
      throw new ForbiddenException('Not authorized to access this private conversation');
    }

    // Verify task existence and buyer ownership
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    if (task.buyerId !== buyerId) {
      throw new BadRequestException('Specified buyer is not the owner of this task');
    }

    // Verify worker has an actual participation on this task
    const participation = await this.prisma.workerParticipation.findFirst({
      where: { taskId, workerId },
    });
    if (!participation) {
      throw new ForbiddenException('Worker does not have a participation slot on this task');
    }

    // Check if conversation already exists with these two participants
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        taskId,
        isPublicQnA: false,
        AND: [
          { participants: { some: { userId: workerId } } },
          { participants: { some: { userId: buyerId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                primaryRole: true,
                profile: { select: { displayName: true } },
              },
            },
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                primaryRole: true,
                profile: { select: { displayName: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          taskId,
          isPublicQnA: false,
          participants: {
            create: [{ userId: workerId }, { userId: buyerId }],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  primaryRole: true,
                  profile: { select: { displayName: true } },
                },
              },
            },
          },
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  email: true,
                  primaryRole: true,
                  profile: { select: { displayName: true } },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    return conversation;
  }

  /**
   * Get messages for any conversation with permission validation
   */
  async getConversationMessages(
    conversationId: string,
    userId?: string,
    role?: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                primaryRole: true,
                profile: { select: { displayName: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Public Q&A is readable by anyone
    if (conversation.isPublicQnA) {
      return conversation.messages;
    }

    // Private thread check
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const isAdmin = this.adminRoles.includes(role as UserRole);

    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId,
    );

    if (!isAdmin && !isParticipant) {
      throw new ForbiddenException('Not authorized to view this private thread');
    }

    return conversation.messages;
  }

  /**
   * Post a message to a conversation
   */
  async postMessage(
    conversationId: string,
    senderId: string,
    content: string,
    attachmentsJson?: any,
  ) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
        task: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // If private, sender must be a participant or admin
    if (!conversation.isPublicQnA) {
      const isParticipant = conversation.participants.some(
        (p) => p.userId === senderId,
      );
      if (!isParticipant) {
        throw new ForbiddenException(
          'You are not a participant in this private conversation',
        );
      }
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: content.trim(),
        attachmentsJson: attachmentsJson || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            primaryRole: true,
            profile: { select: { displayName: true } },
          },
        },
      },
    });

    return message;
  }
}
