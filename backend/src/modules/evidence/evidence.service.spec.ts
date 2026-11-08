import { Test, TestingModule } from '@nestjs/testing';
import { EvidenceService } from './evidence.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('EvidenceService', () => {
  let service: EvidenceService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      evidenceFile: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    audit = {
      log: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test_signing_key_32_characters_12345'),
          },
        },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<EvidenceService>(EvidenceService);
  });

  describe('Security & MIME Validation', () => {
    it('should reject unapproved MIME types', async () => {
      const fakeFile: any = {
        buffer: Buffer.from('console.log("hello")'),
        mimetype: 'application/javascript',
        originalname: 'script.js',
        size: 20,
      };

      await expect(
        service.uploadEvidence('user-1', fakeFile, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject spoofed files where magic bytes do not match declared MIME', async () => {
      const spoofedFile: any = {
        buffer: Buffer.from('NOT A VALID PNG AT ALL'),
        mimetype: 'image/png',
        originalname: 'fake.png',
        size: 50,
      };

      await expect(
        service.uploadEvidence('user-1', spoofedFile, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject executable binaries with PE "MZ" header', async () => {
      const peFile: any = {
        buffer: Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]),
        mimetype: 'application/pdf',
        originalname: 'payload.exe',
        size: 6,
      };

      await expect(
        service.uploadEvidence('user-1', peFile, {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Signed URL Generation & Validation', () => {
    it('should generate valid signed token and verify it correctly', () => {
      const fileId = 'file-uuid-123';
      const userId = 'user-uuid-456';

      const signedUrl = service.generateSignedDownloadUrl(fileId, userId, 30);
      expect(signedUrl).toContain(`/api/v1/evidence/${fileId}/download?token=`);

      const token = signedUrl.split('token=')[1];
      const verified = service.verifyDownloadToken(fileId, token);
      expect(verified.userId).toBe(userId);
    });

    it('should reject tampered download token', () => {
      const fileId = 'file-uuid-123';
      const userId = 'user-uuid-456';
      const signedUrl = service.generateSignedDownloadUrl(fileId, userId, 30);
      const token = signedUrl.split('token=')[1] + 'tampered';

      expect(() => service.verifyDownloadToken(fileId, token)).toThrow(
        ForbiddenException,
      );
    });
  });
});
