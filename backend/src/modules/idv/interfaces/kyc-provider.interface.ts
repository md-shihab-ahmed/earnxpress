import { IdvStatus } from '@prisma/client';

export interface DocumentTypeInfo {
  code: string;
  label: string;
  description: string;
  formatPlaceholder?: string;
  requiresBackSide?: boolean;
}

export interface LivenessCheckConfig {
  enabled: boolean;
  livenessSessionToken?: string;
  instructions?: string;
  mockMode: boolean;
}

export interface KycSubmissionRequest {
  userId: string;
  countryCode: string;
  documentType: string;
  documentNumberMasked: string;
  documentDedupSeed: string; // Used to compute SHA-256 identityDedupHash without storing raw document number
  metadata?: Record<string, any>;
}

export interface KycVerificationResult {
  success: boolean;
  status: IdvStatus;
  providerReferenceId: string;
  confidenceScore: number;
  riskFlags: string[];
  isMock: boolean;
  message: string;
}

export interface IKycProvider {
  /**
   * Human-readable identifier for the provider (e.g. 'MOCK_SANDBOX', 'SUMSUB', 'ONFIDO', 'VERIFF')
   */
  getProviderName(): string;

  /**
   * Query supported document categories and formats for a specific ISO 3166-1 alpha-2 country
   */
  getSupportedDocuments(countryCode: string): Promise<DocumentTypeInfo[]>;

  /**
   * Initialize a secure biometric liveness / face-match session
   */
  initiateLivenessCheck(userId: string): Promise<LivenessCheckConfig>;

  /**
   * Submit an identity verification request according to the provider contract
   */
  submitVerification(request: KycSubmissionRequest): Promise<KycVerificationResult>;

  /**
   * Check status of an ongoing or completed verification with the provider
   */
  getVerificationStatus(providerReferenceId: string): Promise<KycVerificationResult>;
}
