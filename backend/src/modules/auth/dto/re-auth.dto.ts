import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ReAuthDto {
  @ApiProperty({ example: 'SecurePassword123!', description: 'Current password for sensitive action re-authentication' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class VerifyMfaDto {
  @ApiProperty({ example: '123456', description: '6-digit TOTP code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
