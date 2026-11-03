import { IsEnum, IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReviewDecision {
  APPROVE = 'APPROVE',
  REQUEST_REVISION = 'REQUEST_REVISION',
  REJECT = 'REJECT',
}

export class ReviewSubmissionDto {
  @ApiProperty({ enum: ReviewDecision, description: 'Evaluation decision for the submitted work' })
  @IsEnum(ReviewDecision)
  @IsNotEmpty()
  decision: ReviewDecision;

  @ApiProperty({ description: 'Review notes or revision feedback (required if rejected or requesting revision)', example: 'Deliverables verified and accepted.' })
  @IsString()
  @IsNotEmpty()
  feedback: string;

  @ApiProperty({ description: 'Optional star rating (1-5) on approval', required: false, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
