import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { IdvService } from './idv.service';
import { QuerySupportedDocumentsDto, SubmitMockKycDto } from './dto/idv.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('International KYC & Identity Verification')
@Controller('idv')
export class IdvController {
  constructor(private readonly idvService: IdvService) {}

  @Get('supported-documents')
  @ApiOperation({ summary: 'Get supported government ID types for an ISO-3166-1 country' })
  @ApiResponse({ status: 200, description: 'List of country-specific accepted identification documents' })
  async getSupportedDocuments(@Query() query: QuerySupportedDocumentsDto) {
    return this.idvService.getSupportedDocuments(query.countryCode);
  }

  @Post('liveness-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request a biometric liveness / face-match session' })
  async initiateLiveness(@CurrentUser('id') userId: string) {
    return this.idvService.initiateLiveness(userId);
  }

  @Post('submit-mock')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit mock KYC verification for testing (Sandbox/Dev only)' })
  async submitMockVerification(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitMockKycDto,
  ) {
    return this.idvService.submitMockVerification(userId, dto);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check current KYC verification status for the authenticated user' })
  async getStatus(@CurrentUser('id') userId: string) {
    return this.idvService.getStatus(userId);
  }
}
