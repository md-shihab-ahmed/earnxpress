import { IsString, IsNotEmpty, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDisputeDto {
  @ApiProperty({ description: 'ID of the participation record in dispute' })
  @IsUUID()
  @IsNotEmpty()
  participationId: string;

  @ApiProperty({
    description: 'Standard dispute reason code',
    example: 'UNJUSTIFIED_REJECTION',
    enum: [
      'BUYER_UNRESPONSIVE_SLA',
      'UNJUSTIFIED_REJECTION',
      'NON_COMPLIANT_DELIVERABLE',
      'COMMUNICATION_BREAKDOWN',
      'EVIDENCE_OF_FRAUD',
      'OTHER',
    ],
  })
  @IsString()
  @IsNotEmpty()
  reasonCode: string;

  @ApiProperty({ description: 'Detailed statement explaining the dispute' })
  @IsString()
  @IsNotEmpty()
  statement: string;

  @ApiPropertyOptional({ description: 'Array of evidence file IDs supporting the claim', type: [String] })
  @IsArray()
  @IsOptional()
  evidenceFileIds?: string[];
}
