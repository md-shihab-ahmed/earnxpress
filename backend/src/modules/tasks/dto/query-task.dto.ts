import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { TaskModel, TaskStatus } from '@prisma/client';

export class QueryTaskDto {
  @ApiPropertyOptional({ example: 'translation' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'c1234567-89ab-cdef-0123-456789abcdef' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: TaskModel })
  @IsOptional()
  @IsEnum(TaskModel)
  taskModel?: TaskModel;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.OPEN })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ example: 1000, description: 'Minimum unit budget in USD cents' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBudgetCents?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class CreateQnaQuestionDto {
  @IsString()
  content: string;
}

export class ReplyQnaDto {
  @IsString()
  content: string;
}
