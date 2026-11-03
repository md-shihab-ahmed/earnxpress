import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ProcessWithdrawalDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT', 'COMPLETE'], example: 'APPROVE' })
  @IsIn(['APPROVE', 'REJECT', 'COMPLETE'])
  decision: 'APPROVE' | 'REJECT' | 'COMPLETE';

  @ApiPropertyOptional({ example: 'payout_tr_987654321', description: 'External provider payout transaction reference' })
  @IsOptional()
  @IsString()
  providerPayoutId?: string;

  @ApiPropertyOptional({ example: 'Bank account number does not match verified name on record', description: 'Rejection reason if rejected' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
