import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class QuerySupportedDocumentsDto {
  @ApiProperty({ example: 'BD', description: 'ISO 3166-1 alpha-2 country code' })
  @IsString()
  @IsNotEmpty()
  countryCode: string;
}

export class SubmitMockKycDto {
  @ApiProperty({ example: 'BD', description: 'ISO 3166-1 alpha-2 country code' })
  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty({ example: 'SMART_NID', description: 'Document type code' })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({ example: 'XXXX-XXXX-45', description: 'Masked document number for display only' })
  @IsString()
  @IsNotEmpty()
  documentNumberMasked: string;

  @ApiPropertyOptional({ description: 'Optional unique dedup seed to prevent duplicate identity claims' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  documentDedupSeed?: string;
}
