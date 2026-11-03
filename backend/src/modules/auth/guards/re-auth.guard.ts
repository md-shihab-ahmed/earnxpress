import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_REAUTH_KEY } from '../../../common/decorators/require-reauth.decorator';

@Injectable()
export class ReAuthGuard implements CanActivate {
  private readonly REAUTH_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isRequired = this.reflector.getAllAndOverride<boolean>(REQUIRE_REAUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isRequired) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.lastReAuthAt) {
      throw new ForbiddenException({
        code: 'ERR_REAUTH_REQUIRED',
        message: 'Re-authentication required. Please confirm your password or MFA before proceeding.',
      });
    }

    const elapsed = Date.now() - new Date(user.lastReAuthAt).getTime();
    if (elapsed > this.REAUTH_TIMEOUT_MS) {
      throw new ForbiddenException({
        code: 'ERR_REAUTH_EXPIRED',
        message: 'Recent authentication expired. Please re-authenticate to perform this action.',
      });
    }

    return true;
  }
}
