import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DisputeVerdict {
  SETTLE_WORKER = 'SETTLE_WORKER',
  REFUND_BUYER = 'REFUND_BUYER',
  SPLIT_SETTLEMENT = 'SPLIT_SETTLEMENT',
  DISMISS = 'DISMISS',
}

export class ResolveDisputeDto {
  @ApiProperty({
    enum: DisputeVerdict,
    description: 'Arbitration verdict',
    example: DisputeVerdict.SPLIT_SETTLEMENT,
  })
  @IsEnum(DisputeVerdict)
  @IsNotEmpty()
  verdict: DisputeVerdict;

  @ApiPropertyOptional({
    description: 'Worker payout portion in USD integer cents (mandatory for SPLIT_SETTLEMENT)',
    example: '6000',
  })
  @IsOptional()
  workerPayoutCents?: string;

  @ApiPropertyOptional({
    description: 'Buyer refund portion in USD integer cents (mandatory for SPLIT_SETTLEMENT)',
    example: '4000',
  })
  @IsOptional()
  buyerRefundCents?: string;

  @ApiProperty({
    description: 'Mandatory arbitrator statement and justification for the ruling',
    example: 'Worker fulfilled 60% of deliverables as evidenced by timestamps and repository links.',
  })
  @IsString()
  @IsNotEmpty()
  arbitrationNotes: string;
}
