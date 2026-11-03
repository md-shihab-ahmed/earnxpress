import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaymentProviderType } from '@prisma/client';

export class CreatePaymentOrderDto {
  @ApiProperty({ example: 5000, description: 'Deposit or funding amount in USD cents (min $1.00 = 100 cents)' })
  @IsNumber()
  @Min(100)
  amountCents: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: PaymentProviderType, example: PaymentProviderType.SANDBOX_MOCK })
  @IsEnum(PaymentProviderType)
  provider: PaymentProviderType;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'Associated Task UUID if direct task escrow funding' })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiPropertyOptional({ example: 'http://localhost:3000/buyer/wallet?payment=success' })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiPropertyOptional({ example: 'http://localhost:3000/buyer/wallet?payment=cancelled' })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
