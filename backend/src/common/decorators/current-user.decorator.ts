import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';

export interface CurrentUserPayload {
  id: string;
  email: string;
  primaryRole: UserRole;
  status: UserStatus;
  tokenVersion: number;
  lastReAuthAt?: Date;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;
    if (!user) return null;
    return data ? user[data] : user;
  },
);
