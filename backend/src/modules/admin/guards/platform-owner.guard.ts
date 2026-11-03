import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class PlatformOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user || user.primaryRole !== UserRole.PLATFORM_OWNER) {
      throw new ForbiddenException({
        code: 'ERR_PLATFORM_OWNER_REQUIRED',
        message: 'This operation requires root Platform Owner privileges.',
      });
    }
    return true;
  }
}
