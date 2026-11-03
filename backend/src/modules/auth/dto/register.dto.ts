import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'worker@earnxpress.com' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, and a number or symbol',
  })
  password: string;

  @ApiProperty({ example: 'Rahim Ahmed' })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({ example: 'BD', description: 'ISO-3166-1 alpha-2 country code' })
  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty({ enum: [UserRole.BUYER, UserRole.WORKER], default: UserRole.WORKER })
  @IsEnum([UserRole.BUYER, UserRole.WORKER], {
    message: 'Primary role on registration must be BUYER or WORKER',
  })
  primaryRole: UserRole;
}
