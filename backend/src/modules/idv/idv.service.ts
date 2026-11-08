import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MockKycProvider } from './providers/mock-kyc.provider';
import { SubmitMockKycDto } from './dto/idv.dto';
import { isValidCountryCode } from '../../common/constants/countries.constant';
import { IdvStatus } from '@prisma/client';

@Injectable()
export class IdvService {
  private readonly logger = new Logger(IdvService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly kycProvider: MockKycProvider,
  ) {}

  /**
   * Get supported government-issued document types by ISO-3166-1 country code
   */
  async getSupportedDocuments(countryCode: string) {
    const code = countryCode?.toUpperCase()?.trim();
    if (!isValidCountryCode(code)) {
      throw new BadRequestException(`Invalid ISO-3166-1 country code: ${countryCode}`);
    }
    return this.kycProvider.getSupportedDocuments(code);
  }

  /**
   * Request biometric liveness session parameters
   */
  async initiateLiveness(userId: string) {
    return this.kycProvider.initiateLivenessCheck(userId);
  }

  /**
   * Submit mock KYC verification for testing and development
   */
  async submitMockVerification(userId: string, dto: SubmitMockKycDto) {
    const countryCode = dto.countryCode?.toUpperCase()?.trim();
    if (!isValidCountryCode(countryCode)) {
      throw new BadRequestException(`Invalid ISO-3166-1 country code: ${dto.countryCode}`);
    }

    const dedupSeed = dto.documentDedupSeed || `${userId}_${dto.documentType}_mock`;
    const identityDedupHash = crypto
      .createHash('sha256')
      .update(`${countryCode}_${dto.documentType}_${dedupSeed}`)
      .digest('hex');

    // Check if hash is already bound to another user
    const existingOther = await this.prisma.identityVerification.findFirst({
      where: {
        identityDedupHash,
        userId: { not: userId },
      },
    });

    if (existingOther) {
      throw new ConflictException({
        code: 'ERR_IDENTITY_DUPLICATE',
        message: 'This document identifier is already registered to another user account.',
      });
    }

    // Call provider contract
    const result = await this.kycProvider.submitVerification({
      userId,
      countryCode,
      documentType: dto.documentType,
      documentNumberMasked: dto.documentNumberMasked,
      documentDedupSeed: dedupSeed,
    });

    // Save record to database
    const record = await this.prisma.identityVerification.upsert({
      where: { identityDedupHash },
      create: {
        userId,
        countryCode,
        documentType: dto.documentType,
        documentNumberMasked: dto.documentNumberMasked,
        identityDedupHash,
        status: result.status,
        providerReferenceId: result.providerReferenceId,
        confidenceScore: result.confidenceScore,
        riskFlags: result.riskFlags,
        reviewerNotes: 'Verified automatically via Mock KYC Provider (Development/Sandbox)',
        reviewedAt: new Date(),
      },
      update: {
        status: result.status,
        providerReferenceId: result.providerReferenceId,
        confidenceScore: result.confidenceScore,
        riskFlags: result.riskFlags,
        reviewedAt: new Date(),
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { primaryRole: true },
    });

    await this.auditService.log({
      actorId: userId,
      actorRole: user?.primaryRole || 'USER',
      action: 'IDV_SUBMITTED_MOCK',
      resourceType: 'IdentityVerification',
      resourceId: record.id,
      reason: 'Mock KYC verification submitted and approved for testing',
    });

    return {
      success: true,
      status: record.status,
      isMock: true,
      provider: this.kycProvider.getProviderName(),
      providerReferenceId: record.providerReferenceId,
      message: result.message,
    };
  }

  /**
   * Get current user's KYC verification status
   */
  async getStatus(userId: string) {
    const record = await this.prisma.identityVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return {
        status: IdvStatus.NOT_STARTED,
        verified: false,
        isMock: true,
      };
    }

    return {
      status: record.status,
      verified: record.status === IdvStatus.VERIFIED,
      countryCode: record.countryCode,
      documentType: record.documentType,
      documentNumberMasked: record.documentNumberMasked,
      reviewedAt: record.reviewedAt,
      isMock: true,
    };
  }
}
