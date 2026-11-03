import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: {
              include: { skill: true },
            },
          },
        },
        demoAccounts: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    // Do not expose passwordHash or mfaSecret
    const { passwordHash, mfaSecretEncrypted, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...(dto.headline !== undefined && { headline: dto.headline }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.hourlyRateCents !== undefined && { hourlyRateCents: BigInt(dto.hourlyRateCents) }),
        ...(dto.availabilityStatus !== undefined && { availabilityStatus: dto.availabilityStatus }),
      },
    });

    return profile;
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        primaryRole: true,
        createdAt: true,
        profile: {
          select: {
            displayName: true,
            headline: true,
            bio: true,
            countryCode: true,
            avatarUrl: true,
            hourlyRateCents: true,
            availabilityStatus: true,
            reputationScore: true,
            completionRate: true,
            totalReviewsCount: true,
            skills: {
              select: {
                yearsExp: true,
                skill: {
                  select: { name: true, slug: true, category: true },
                },
              },
            },
          },
        },
        reviewsReceived: {
          where: { isPublished: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            overallRating: true,
            communicationRating: true,
            qualityRating: true,
            timelinessRating: true,
            publicComment: true,
            createdAt: true,
            reviewer: {
              select: {
                id: true,
                profile: { select: { displayName: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return user;
  }
}
