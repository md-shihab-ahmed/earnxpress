import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class ClaimFaucetDto {
  @ApiPropertyOptional({
    example: 100000,
    description: 'Amount in integer USD cents ($1,000.00 = 100000 cents). Maximum $5,000.00 per claim.',
    default: 100000,
  })
  @IsOptional()
  @IsNumber()
  @Min(100) // Minimum $1.00
  @Max(500000) // Maximum $5,000.00
  amountCents?: number;
}
