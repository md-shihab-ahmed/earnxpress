import { IsString, IsNotEmpty, IsOptional, IsArray, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitTaskDto {
  @ApiProperty({ description: 'Detailed submission notes and proof of work deliverables', example: 'Completed data scraping script and uploaded clean CSV dataset.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;

  @ApiProperty({ description: 'Links or storage paths to deliverables', required: false, example: ['https://storage.earnxpress.demo/deliverables/task-123-report.csv'] })
  @IsOptional()
  @IsArray()
  deliverableUrls?: string[];

  @ApiProperty({ description: 'Optional completed milestone identifiers', required: false })
  @IsOptional()
  @IsArray()
  completedMilestoneIds?: string[];
}
