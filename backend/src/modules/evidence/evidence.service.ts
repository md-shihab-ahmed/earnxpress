import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DefaultMalwareScanner, IMalwareScanner } from './interfaces/malware-scanner.interface';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadEvidenceDto {
  taskId?: string;
  participationId?: string;
  submissionVersionId?: string;
  disputeId?: string;
  metadata?: Record<string, any>;
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);
  private readonly storageDir: string;
  private readonly malwareScanner: IMalwareScanner;
  private readonly signingSecret: string;

  private readonly ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'text/plain',
    'text/csv',
  ]);

  private readonly MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
  private readonly MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {
    this.storageDir = path.resolve(process.cwd(), 'uploads', 'evidence');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    this.malwareScanner = new DefaultMalwareScanner();
    this.signingSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'dev_evidence_signing_key_fallback_earnxpress_32_chars';
  }

  /**
   * Validate magic bytes corresponding to claimed MIME type
   */
  private validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
    if (buffer.length < 4) return false;

    if (mimeType === 'image/jpeg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (mimeType === 'image/png') {
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      );
    }
    if (mimeType === 'image/gif') {
      const header = buffer.subarray(0, 3).toString('ascii');
      return header === 'GIF';
    }
    if (mimeType === 'image/webp') {
      const riff = buffer.subarray(0, 4).toString('ascii');
      const webp = buffer.subarray(8, 12).toString('ascii');
      return riff === 'RIFF' && webp === 'WEBP';
    }
    if (mimeType === 'application/pdf') {
      return buffer.subarray(0, 4).toString('ascii') === '%PDF';
    }
    if (
      mimeType === 'application/zip' ||
      mimeType === 'application/x-zip-compressed'
    ) {
      return (
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07)
      );
    }
    if (mimeType === 'video/mp4' || mimeType === 'video/quicktime') {
      if (buffer.length >= 8) {
        const ftyp = buffer.subarray(4, 8).toString('ascii');
        return ftyp === 'ftyp' || ftyp === 'moov';
      }
      return false;
    }
    if (mimeType === 'video/webm') {
      return (
        buffer[0] === 0x1a &&
        buffer[1] === 0x45 &&
        buffer[2] === 0xdf &&
        buffer[3] === 0xa3
      );
    }
    if (mimeType === 'text/plain' || mimeType === 'text/csv') {
      // Must not contain null bytes
      for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
        if (buffer[i] === 0) return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Secure evidence upload
   */
  async uploadEvidence(
    uploaderId: string,
    file: MulterFile,
    dto: UploadEvidenceDto,
    ipAddress?: string,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded or file payload is empty');
    }

    // 1. MIME type validation
    const mimeType = file.mimetype.toLowerCase();
    if (!this.ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException(
        `Unsupported evidence file type: ${mimeType}. Allowed formats: PNG, JPG, WEBP, PDF, MP4, WEBM, ZIP, CSV, TXT.`,
      );
    }

    // 2. File size limit
    const isVideo = mimeType.startsWith('video/');
    const maxSize = isVideo ? this.MAX_VIDEO_SIZE_BYTES : this.MAX_IMAGE_SIZE_BYTES;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File exceeds maximum allowed size of ${maxSize / (1024 * 1024)} MB`,
      );
    }

    // 3. Magic-byte verification
    const isValidBytes = this.validateMagicBytes(file.buffer, mimeType);
    if (!isValidBytes) {
      throw new BadRequestException(
        'File payload binary signature does not match claimed MIME type. Potential spoofing detected.',
      );
    }

    // 4. Malware scan
    const scanResult = await this.malwareScanner.scanFile(
      file.buffer,
      file.originalname,
    );
    if (!scanResult.isClean) {
      this.logger.warn(`Malware detected: ${scanResult.threatDetails}`);
      throw new BadRequestException(
        `Security inspection failed: ${scanResult.threatDetails}`,
      );
    }

    // 5. SHA-256 Checksum
    const sha256Hash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    // 6. Write to private filesystem
    const fileExt = path.extname(file.originalname) || '.bin';
    const storedFilename = `${crypto.randomUUID()}${fileExt}`;
    const storagePath = path.join(this.storageDir, storedFilename);

    await fs.promises.writeFile(storagePath, file.buffer);

    // 7. Persist record in database
    const evidence = await this.prisma.evidenceFile.create({
      data: {
        uploaderId,
        taskId: dto.taskId || null,
        participationId: dto.participationId || null,
        submissionVersionId: dto.submissionVersionId || null,
        disputeId: dto.disputeId || null,
        originalFilename: file.originalname,
        storedFilename,
        mimeType,
        sizeBytes: BigInt(file.size),
        sha256Hash,
        storagePath,
        isScannedClean: true,
        metadata: {
          ...dto.metadata,
          scanEngine: scanResult.scanEngine,
          scannedAt: scanResult.scannedAt.toISOString(),
        },
      },
    });

    await this.auditService.log({
      actorId: uploaderId,
      actorRole: 'USER',
      action: 'EVIDENCE_FILE_UPLOADED',
      resourceType: 'EvidenceFile',
      resourceId: evidence.id,
      newState: {
        originalFilename: file.originalname,
        storedFilename,
        mimeType,
        sizeBytes: file.size,
        sha256Hash,
      },
      ipAddress,
      reason: 'User uploaded evidence file',
    });

    const signedUrl = this.generateSignedDownloadUrl(evidence.id, uploaderId);

    return {
      id: evidence.id,
      originalFilename: evidence.originalFilename,
      mimeType: evidence.mimeType,
      sizeBytes: Number(evidence.sizeBytes),
      sha256Hash: evidence.sha256Hash,
      isScannedClean: evidence.isScannedClean,
      createdAt: evidence.createdAt,
      signedUrl,
    };
  }

  /**
   * Generate signed time-limited URL for downloading evidence
   */
  generateSignedDownloadUrl(
    fileId: string,
    userId: string,
    expiresInMinutes: number = 60,
  ): string {
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
    const dataToSign = `${fileId}:${userId}:${expiresAt}`;
    const signature = crypto
      .createHmac('sha256', this.signingSecret)
      .update(dataToSign)
      .digest('hex');

    const token = Buffer.from(
      JSON.stringify({ fileId, userId, expiresAt, signature }),
    ).toString('base64url');

    return `/api/v1/evidence/${fileId}/download?token=${token}`;
  }

  /**
   * Verify signature and time validity of token
   */
  verifyDownloadToken(fileId: string, token: string): { userId: string } {
    try {
      const decodedJson = Buffer.from(token, 'base64url').toString('utf8');
      const payload = JSON.parse(decodedJson);

      if (payload.fileId !== fileId) {
        throw new ForbiddenException('Token does not match requested file');
      }

      if (Date.now() > payload.expiresAt) {
        throw new ForbiddenException('Signed download link has expired');
      }

      const expectedData = `${fileId}:${payload.userId}:${payload.expiresAt}`;
      const expectedSig = crypto
        .createHmac('sha256', this.signingSecret)
        .update(expectedData)
        .digest('hex');

      if (payload.signature !== expectedSig) {
        throw new ForbiddenException('Invalid signature on download link');
      }

      return { userId: payload.userId };
    } catch (e: any) {
      if (e instanceof ForbiddenException) throw e;
      throw new ForbiddenException('Invalid download token structure');
    }
  }

  /**
   * Verify whether a user is authorized to view an evidence file
   */
  async verifyUserCanAccessFile(
    userId: string,
    fileId: string,
    role?: string,
  ): Promise<any> {
    const file = await this.prisma.evidenceFile.findUnique({
      where: { id: fileId },
      include: {
        task: true,
        participation: true,
        dispute: true,
      },
    });

    if (!file) {
      throw new NotFoundException('Evidence file not found');
    }

    // Admins and platform owners have full oversight
    const adminRoles = [
      'SUPER_ADMIN',
      'PLATFORM_OWNER',
      'MODERATOR',
      'SUPPORT_AGENT',
    ];
    if (role && adminRoles.includes(role)) {
      return file;
    }

    // Direct uploader has access
    if (file.uploaderId === userId) {
      return file;
    }

    // Task buyer has access
    if (file.task && file.task.buyerId === userId) {
      return file;
    }

    // Participation worker has access
    if (file.participation && file.participation.workerId === userId) {
      return file;
    }

    // Dispute initiator has access
    if (file.dispute && file.dispute.initiatorId === userId) {
      return file;
    }

    throw new ForbiddenException(
      'Not authorized to view this private evidence record',
    );
  }

  /**
   * Get file stream and metadata for download
   */
  async getFileForDownload(fileId: string, userId: string, role?: string) {
    const file = await this.verifyUserCanAccessFile(userId, fileId, role);

    if (!fs.existsSync(file.storagePath)) {
      throw new NotFoundException('Stored file payload missing on disk');
    }

    return {
      fileStream: fs.createReadStream(file.storagePath),
      mimeType: file.mimeType,
      originalFilename: file.originalFilename,
      sizeBytes: Number(file.sizeBytes),
    };
  }

  /**
   * Get evidence file metadata
   */
  async getEvidenceMetadata(fileId: string, userId: string, role?: string) {
    const file = await this.verifyUserCanAccessFile(userId, fileId, role);
    return {
      id: file.id,
      uploaderId: file.uploaderId,
      originalFilename: file.originalFilename,
      mimeType: file.mimeType,
      sizeBytes: Number(file.sizeBytes),
      sha256Hash: file.sha256Hash,
      isScannedClean: file.isScannedClean,
      createdAt: file.createdAt,
      signedUrl: this.generateSignedDownloadUrl(file.id, userId),
    };
  }

  /**
   * Link an existing evidence file to a dispute or submission version
   */
  async linkEvidence(
    fileId: string,
    links: { disputeId?: string; submissionVersionId?: string },
  ) {
    return this.prisma.evidenceFile.update({
      where: { id: fileId },
      data: {
        disputeId: links.disputeId || undefined,
        submissionVersionId: links.submissionVersionId || undefined,
      },
    });
  }
}
