import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsNumber, Min } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Senior Fullstack TypeScript Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  headline?: string;

  @ApiPropertyOptional({ example: 'Experienced in Next.js, NestJS, and high-performance databases.' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'https://cdn.earnxpress.com/avatars/user123.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 2500, description: 'Hourly rate in integer USD cents ($25.00/hr)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRateCents?: number;

  @ApiPropertyOptional({ example: 'AVAILABLE', enum: ['AVAILABLE', 'BUSY', 'ON_LEAVE'] })
  @IsOptional()
  @IsString()
  availabilityStatus?: string;
}
