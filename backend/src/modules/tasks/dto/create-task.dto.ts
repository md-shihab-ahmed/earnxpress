import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskModel } from '@prisma/client';

export class AcceptanceCriterionDto {
  @ApiProperty({ example: 'code_tests_pass' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'All unit and integration tests must pass with 100% green status' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class DeliverableRequirementDto {
  @ApiProperty({ example: 'FILE', enum: ['TEXT', 'URL', 'FILE'] })
  @IsString()
  @IsNotEmpty()
  type: 'TEXT' | 'URL' | 'FILE';

  @ApiProperty({ example: 'ZIP archive of source code deliverables' })
  @IsString()
  @IsNotEmpty()
  label: string;
}

export class MilestonePlanDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ example: 'Initial Prototype & Schema' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Submit initial schema definition for review' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateTaskDto {
  @ApiProperty({ example: 'Translate 500 Product Descriptions from English to Bangla' })
  @IsString()
  @MinLength(10)
  @MaxLength(150)
  title: string;

  @ApiProperty({ example: 'c1234567-89ab-cdef-0123-456789abcdef' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 's1234567-89ab-cdef-0123-456789abcdef' })
  @IsString()
  @IsNotEmpty()
  subcategoryId: string;

  @ApiProperty({ enum: TaskModel, default: TaskModel.MULTI_WORKER })
  @IsEnum(TaskModel)
  taskModel: TaskModel;

  @ApiProperty({ example: 50, description: 'Total slots capacity (e.g. 1 to 500)' })
  @IsNumber()
  @Min(1)
  @Max(1000)
  totalSlots: number;

  @ApiProperty({ example: 2000, description: 'Unit payout per approved slot in integer USD cents ($20.00 = 2000 cents)' })
  @IsNumber()
  @Min(100) // Minimum $1.00 USD
  unitBudgetCents: number;

  @ApiPropertyOptional({ example: 6, default: 6, description: 'Hours allowed to initiate activity before slot times out' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(72)
  startDeadlineHours?: number;

  @ApiPropertyOptional({ example: 24, default: 24, description: 'Total duration in hours to complete task' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(720) // up to 30 days
  completionDurationHours?: number;

  @ApiPropertyOptional({ example: 72, default: 72, description: 'Buyer review SLA in hours' })
  @IsOptional()
  @IsNumber()
  @Min(24)
  @Max(168)
  reviewSlaHours?: number;

  @ApiPropertyOptional({ example: 2, default: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  maxRevisions?: number;

  @ApiProperty({ example: 'Detailed instructions explaining the deliverable criteria...' })
  @IsString()
  @MinLength(20)
  descriptionMarkdown: string;

  @ApiProperty({ type: [AcceptanceCriterionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcceptanceCriterionDto)
  acceptanceCriteria: AcceptanceCriterionDto[];

  @ApiProperty({ type: [DeliverableRequirementDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliverableRequirementDto)
  deliverableRequirements: DeliverableRequirementDto[];

  @ApiPropertyOptional({ type: [MilestonePlanDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestonePlanDto)
  milestones?: MilestonePlanDto[];
}
