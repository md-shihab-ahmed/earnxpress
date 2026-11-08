import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class VerifiedUserGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException({
        code: 'ERR_UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    // Check email verification in user record
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true, status: true },
    });

    if (!dbUser) {
      throw new ForbiddenException({
        code: 'ERR_USER_NOT_FOUND',
        message: 'User account not found',
      });
    }

    if (!dbUser.emailVerified) {
      throw new ForbiddenException({
        code: 'ERR_EMAIL_UNVERIFIED',
        message: 'Email verification is required to perform this action. Please verify your email address.',
      });
    }

    return true;
  }
}
