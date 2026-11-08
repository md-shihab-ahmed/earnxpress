import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { WithdrawalMethodType } from '@prisma/client';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 400, description: 'Withdrawal amount in USD cents (min $4.00 = 400 cents)' })
  @IsNumber()
  @Min(400)
  amountCents: number;

  @ApiProperty({ enum: WithdrawalMethodType, example: WithdrawalMethodType.BANK_TRANSFER })
  @IsEnum(WithdrawalMethodType)
  method: WithdrawalMethodType;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  payoutCurrency?: string;

  @ApiProperty({
    example: {
      bankName: 'Dutch-Bangla Bank PLC',
      accountHolder: 'Rahim Chowdhury',
      accountNumberMasked: '****5678',
      routingNumber: '090271234',
    },
    description: 'Masked destination payout credentials',
  })
  @IsObject()
  destinationDetails: Record<string, any>;
}
