import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Ip,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { EvidenceService, MulterFile } from './evidence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';

@ApiTags('Evidence & Artifact Management')
@Controller('evidence')
export class EvidenceController {
  constructor(
    private readonly evidenceService: EvidenceService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an evidence file (image, PDF, video, ZIP, text) with MIME validation & malware scan' })
  async uploadFile(
    @CurrentUser('id') uploaderId: string,
    @UploadedFile() file: MulterFile,
    @Body('taskId') taskId?: string,
    @Body('participationId') participationId?: string,
    @Body('submissionVersionId') submissionVersionId?: string,
    @Body('disputeId') disputeId?: string,
    @Ip() ipAddress?: string,
  ) {
    return this.evidenceService.uploadEvidence(
      uploaderId,
      file,
      {
        taskId,
        participationId,
        submissionVersionId,
        disputeId,
      },
      ipAddress,
    );
  }

  @Get(':id/signed-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtain a time-limited signed URL to download private evidence' })
  async getSignedUrl(
    @CurrentUser('id') userId: string,
    @CurrentUser('primaryRole') role: UserRole,
    @Param('id') fileId: string,
  ) {
    await this.evidenceService.verifyUserCanAccessFile(userId, fileId, role);
    const signedUrl = this.evidenceService.generateSignedDownloadUrl(fileId, userId);
    return { fileId, signedUrl, expiresInMinutes: 60 };
  }

  @Get(':id/meta')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get evidence file metadata, checksum, and clean scan status' })
  async getMetadata(
    @CurrentUser('id') userId: string,
    @CurrentUser('primaryRole') role: UserRole,
    @Param('id') fileId: string,
  ) {
    return this.evidenceService.getEvidenceMetadata(fileId, userId, role);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Stream private evidence file using time-limited token or Authorization header' })
  async downloadFile(
    @Param('id') fileId: string,
    @Query('token') token: string,
    @Headers('authorization') authHeader: string,
    @Res() res: Response,
  ) {
    let userId: string | null = null;
    let role: string | undefined = undefined;

    if (token) {
      const verified = this.evidenceService.verifyDownloadToken(fileId, token);
      userId = verified.userId;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwtToken = authHeader.substring(7);
        const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
        const verified = this.jwtService.verify(jwtToken, { secret }) as any;
        if (verified && verified.sub) {
          userId = verified.sub;
          role = verified.primaryRole || verified.role;
        }
      } catch (err) {
        // Fall through to authentication check (token invalid, expired or tampered)
      }
    }

    if (!userId) {
      res.status(401).json({
        statusCode: 401,
        message: 'A valid signed token or Authorization header is required to download private evidence.',
      });
      return;
    }

    const fileData = await this.evidenceService.getFileForDownload(fileId, userId, role);

    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(fileData.originalFilename)}"`,
    );
    res.setHeader('Content-Length', fileData.sizeBytes);

    fileData.fileStream.pipe(res);
  }
}
