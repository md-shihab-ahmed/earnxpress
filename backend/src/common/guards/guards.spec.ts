import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { ReAuthGuard } from '../../modules/auth/guards/re-auth.guard';
import { UserRole } from '@prisma/client';

describe('Security Guards (RBAC & Re-Authentication)', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('1. RolesGuard (Role-Based Access Control)', () => {
    it('should permit access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
      const guard = new RolesGuard(reflector);

      const mockContext = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ user: { primaryRole: UserRole.WORKER } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should permit Platform Owner regardless of required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.BUYER]);
      const guard = new RolesGuard(reflector);

      const mockContext = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ user: { primaryRole: UserRole.PLATFORM_OWNER } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should deny unauthorized user with ForbiddenException', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.BUYER]);
      const guard = new RolesGuard(reflector);

      const mockContext = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ user: { primaryRole: UserRole.WORKER } }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
  });

  describe('2. ReAuthGuard (Sensitive Operation Protection)', () => {
    it('should permit access if re-authentication occurred within 5 minutes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const guard = new ReAuthGuard(reflector);

      const mockContext = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: { lastReAuthAt: new Date(Date.now() - 60 * 1000) }, // 1 minute ago
          }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should reject with ForbiddenException if re-authentication is older than 5 minutes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const guard = new ReAuthGuard(reflector);

      const mockContext = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: { lastReAuthAt: new Date(Date.now() - 10 * 60 * 1000) }, // 10 minutes ago
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
  });
});
