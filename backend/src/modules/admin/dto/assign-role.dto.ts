import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

export class AssignRoleDto {
  @ApiProperty({ enum: [UserRole.SUPER_ADMIN, UserRole.MODERATOR, UserRole.SUPPORT_AGENT, UserRole.BUYER, UserRole.WORKER] })
  @IsEnum(UserRole)
  newRole: UserRole;

  @ApiProperty({ example: 'Authorized as community moderator based on credentials' })
  @IsString()
  @MinLength(20, { message: 'Administrative rationale must be at least 20 characters' })
  reason: string;
}

export class SanctionUserDto {
  @ApiProperty({ enum: [UserStatus.ACTIVE, UserStatus.RESTRICTED, UserStatus.SUSPENDED, UserStatus.BANNED] })
  @IsEnum(UserStatus)
  newStatus: UserStatus;

  @ApiProperty({ example: 'Repeated non-compliance with acceptance criteria checklist' })
  @IsString()
  @MinLength(20, { message: 'Mandatory sanction rationale must be at least 20 characters' })
  reason: string;
}
