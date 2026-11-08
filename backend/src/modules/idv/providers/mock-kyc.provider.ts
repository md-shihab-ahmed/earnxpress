import { Injectable, Logger } from '@nestjs/common';
import { IdvStatus } from '@prisma/client';
import * as crypto from 'crypto';
import {
  IKycProvider,
  DocumentTypeInfo,
  LivenessCheckConfig,
  KycSubmissionRequest,
  KycVerificationResult,
} from '../interfaces/kyc-provider.interface';

@Injectable()
export class MockKycProvider implements IKycProvider {
  private readonly logger = new Logger(MockKycProvider.name);

  getProviderName(): string {
    return 'MOCK_SANDBOX_IDV';
  }

  /**
   * Return country-specific official ID types for all international jurisdictions
   */
  async getSupportedDocuments(countryCode: string): Promise<DocumentTypeInfo[]> {
    const code = countryCode?.toUpperCase()?.trim();

    switch (code) {
      case 'BD':
        return [
          {
            code: 'SMART_NID',
            label: 'Smart National Identity Card (Smart NID)',
            description: '10-digit Bangladesh Election Commission Smart Card',
            formatPlaceholder: 'XXXX-XXXX-XX',
            requiresBackSide: true,
          },
          {
            code: 'OLD_NID',
            label: 'National Identity Card (13 or 17 Digits)',
            description: 'Laminated traditional National Identity Card',
            formatPlaceholder: 'XXXXXXXXXXXXX',
            requiresBackSide: true,
          },
          {
            code: 'PASSPORT',
            label: 'Bangladesh International Passport',
            description: 'Machine-Readable Passport (MRP) or e-Passport',
            formatPlaceholder: 'AXXXXXXXX',
            requiresBackSide: false,
          },
          {
            code: 'DRIVING_LICENSE',
            label: 'BRTA Smart Driving License',
            description: 'Bangladesh Road Transport Authority smart card licence',
            formatPlaceholder: 'DKXXXXXXXX',
            requiresBackSide: true,
          },
        ];

      case 'US':
        return [
          {
            code: 'DRIVERS_LICENSE',
            label: "State Driver's License",
            description: 'Official DMV-issued real-ID or standard driver license',
            formatPlaceholder: 'XXXXXXXXX',
            requiresBackSide: true,
          },
          {
            code: 'PASSPORT',
            label: 'United States Passport Book or Card',
            description: 'U.S. Department of State official passport',
            formatPlaceholder: 'XXXXXXXXX',
            requiresBackSide: false,
          },
          {
            code: 'STATE_ID',
            label: 'State Non-Driver Identification Card',
            description: 'State-issued official photo identification card',
            formatPlaceholder: 'XXXXXXXXX',
            requiresBackSide: true,
          },
        ];

      case 'GB':
        return [
          {
            code: 'PASSPORT',
            label: 'HM Passport Office British Passport',
            description: 'United Kingdom biometric passport',
            formatPlaceholder: 'XXXXXXXXX',
            requiresBackSide: false,
          },
          {
            code: 'DRIVING_LICENSE',
            label: 'DVLA Driving Licence',
            description: 'Great Britain / Northern Ireland photocard driving licence',
            formatPlaceholder: 'XXXXX XXXXXX XX XX',
            requiresBackSide: true,
          },
          {
            code: 'BRP',
            label: 'Biometric Residence Permit (BRP)',
            description: 'UK Visas and Immigration biometric card',
            formatPlaceholder: 'RXXXXXXXX',
            requiresBackSide: true,
          },
        ];

      case 'DE':
        return [
          {
            code: 'PERSONALAUSWEIS',
            label: 'Personalausweis (German National ID)',
            description: 'German biometric identity card',
            formatPlaceholder: 'XXXXXXXXX',
            requiresBackSide: true,
          },
          {
            code: 'REISEPASS',
            label: 'Reisepass (German Passport)',
            description: 'Federal Republic of Germany passport',
            formatPlaceholder: 'CXXXXXXXX',
            requiresBackSide: false,
          },
          {
            code: 'FUEHRERSCHEIN',
            label: 'EU-Kartenführerschein',
            description: 'German EU driving licence',
            formatPlaceholder: 'BXXXXXXXXXX',
            requiresBackSide: true,
          },
        ];

      case 'IN':
        return [
          {
            code: 'AADHAAR_MASKED',
            label: 'Masked Aadhaar Card',
            description: 'UIDAI-issued 12-digit biometric ID (last 4 digits only)',
            formatPlaceholder: 'XXXX-XXXX-1234',
            requiresBackSide: true,
          },
          {
            code: 'PAN_CARD',
            label: 'Permanent Account Number (PAN)',
            description: 'Income Tax Department 10-character alphanumeric PAN',
            formatPlaceholder: 'ABCDE1234F',
            requiresBackSide: false,
          },
          {
            code: 'PASSPORT',
            label: 'Indian International Passport',
            description: 'Republic of India passport booklet',
            formatPlaceholder: 'AXXXXXXX',
            requiresBackSide: false,
          },
          {
            code: 'DRIVING_LICENSE',
            label: 'Motor Vehicles Department Driving Licence',
            description: 'State Transport Department Smart Card Driving Licence',
            formatPlaceholder: 'DL-XXXXXXXXXXXXX',
            requiresBackSide: true,
          },
        ];

      case 'NG':
        return [
          {
            code: 'NIN_SLIP',
            label: 'National Identity Number (NIN) Slip / Card',
            description: 'NIMC official national identity slip or digital card',
            formatPlaceholder: 'XXXXXXXXXXX',
            requiresBackSide: false,
          },
          {
            code: 'PASSPORT',
            label: 'Nigerian Standard Passport',
            description: 'Federal Republic of Nigeria international e-Passport',
            formatPlaceholder: 'AXXXXXXXX',
            requiresBackSide: false,
          },
          {
            code: 'DRIVERS_LICENSE',
            label: "FRSC National Driver's Licence",
            description: 'Federal Road Safety Corps photocard licence',
            formatPlaceholder: 'XXX XXXXX XXXX',
            requiresBackSide: true,
          },
        ];

      case 'PH':
        return [
          {
            code: 'PHILID',
            label: 'Philippine Identification System (PhilID)',
            description: 'National ID card issued by PSA',
            formatPlaceholder: 'XXXX-XXXX-XXXX-XXXX',
            requiresBackSide: true,
          },
          {
            code: 'PASSPORT',
            label: 'Philippine e-Passport',
            description: 'DFA-issued biometric passport',
            formatPlaceholder: 'PXXXXXXXA',
            requiresBackSide: false,
          },
          {
            code: 'UMID',
            label: 'Unified Multi-Purpose ID (UMID)',
            description: 'GSIS / SSS / PhilHealth / Pag-IBIG composite card',
            formatPlaceholder: 'XXXX-XXXXXXX-X',
            requiresBackSide: true,
          },
        ];

      default:
        // Universal ISO-3166-1 Fallback for any other country
        return [
          {
            code: 'PASSPORT',
            label: 'International Passport',
            description: 'Official government-issued international travel passport',
            formatPlaceholder: 'XXXXXXXXX',
            requiresBackSide: false,
          },
          {
            code: 'NATIONAL_ID',
            label: 'National Identity Card',
            description: 'Official government photo identification card',
            formatPlaceholder: 'XXXXXXXXX',
            requiresBackSide: true,
          },
          {
            code: 'DRIVING_LICENSE',
            label: 'Driver License',
            description: 'Official motor vehicle administration driving permit',
            formatPlaceholder: 'XXXXXXXXX',
            requiresBackSide: true,
          },
        ];
    }
  }

  /**
   * Initiate mock liveness session (conforms to production camera/face-match session contracts)
   */
  async initiateLivenessCheck(userId: string): Promise<LivenessCheckConfig> {
    const sessionToken = `mock_live_session_${crypto.randomBytes(16).toString('hex')}`;
    this.logger.log(`Initialized mock liveness check session for user ${userId}: ${sessionToken}`);

    return {
      enabled: true,
      mockMode: true,
      livenessSessionToken: sessionToken,
      instructions:
        'Development Mock: In production, this launches an automated biometric face match scan. In sandbox/dev mode, completion is simulated without capturing video or biometrics.',
    };
  }

  /**
   * Process mock verification submission
   */
  async submitVerification(request: KycSubmissionRequest): Promise<KycVerificationResult> {
    this.logger.log(
      `Received mock IDV submission for user ${request.userId} (${request.countryCode} / ${request.documentType})`,
    );

    const refId = `mock_idv_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

    return {
      success: true,
      status: IdvStatus.VERIFIED,
      providerReferenceId: refId,
      confidenceScore: 98,
      riskFlags: [],
      isMock: true,
      message: 'Mock identity verification succeeded for local sandbox testing.',
    };
  }

  async getVerificationStatus(providerReferenceId: string): Promise<KycVerificationResult> {
    return {
      success: true,
      status: IdvStatus.VERIFIED,
      providerReferenceId,
      confidenceScore: 98,
      riskFlags: [],
      isMock: true,
      message: 'Mock verification record confirmed.',
    };
  }
}
