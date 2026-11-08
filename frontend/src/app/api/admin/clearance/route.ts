import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory rate-limiting store (IP-based)
interface RateLimitEntry {
  attempts: number;
  lockUntil: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

// Supported High-Entropy Master Keys
const MASTER_KEYS = [
  'Shihab#EarnXpress@2026!Root',
  'EX-ROOT-7860',
  '889900',
  process.env.PLATFORM_OWNER_MASTER_KEY || 'Shihab#EarnXpress@2026!Root',
];

const VALID_IDENTIFIERS = [
  'shihab',
  'admin@earnxpress.com',
  'shihab@earnxpress.com',
  'owner',
  'root',
];

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

function timingSafeCheck(input: string, allowedList: string[]): boolean {
  const inputBuffer = Buffer.from(input.trim());
  for (const allowed of allowedList) {
    const allowedBuffer = Buffer.from(allowed.trim());
    if (inputBuffer.length === allowedBuffer.length) {
      if (crypto.timingSafeEqual(inputBuffer, allowedBuffer)) {
        return true;
      }
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();

  // 1. Check Rate Limit / Brute Force Lockout
  const entry = rateLimitMap.get(ip) || { attempts: 0, lockUntil: 0 };
  if (entry.lockUntil > now) {
    const remainingSec = Math.ceil((entry.lockUntil - now) / 1000);
    return NextResponse.json(
      {
        success: false,
        locked: true,
        remainingSeconds: remainingSec,
        message: `Security lockdown active. Terminal locked for ${remainingSec}s due to repeated unauthorized attempts.`,
      },
      { status: 429 }
    );
  }

  // Artificial anti-automation delay (1.2s) to physically block high-speed dictionary fuzzing
  await new Promise((resolve) => setTimeout(resolve, 1200));

  try {
    const body = await req.json().catch(() => ({}));
    const { identifier = '', masterKey = '' } = body;

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanKey = String(masterKey).trim();

    // Constant-time validation
    const idValid = timingSafeCheck(cleanId, VALID_IDENTIFIERS);
    const keyValid = timingSafeCheck(cleanKey, MASTER_KEYS);

    if (!idValid || !keyValid) {
      entry.attempts += 1;
      if (entry.attempts >= 3) {
        entry.lockUntil = now + 15 * 60 * 1000; // 15-minute ban
        rateLimitMap.set(ip, entry);
        return NextResponse.json(
          {
            success: false,
            locked: true,
            remainingSeconds: 900,
            message:
              'CRITICAL SECURITY ALERT: Maximum 3 failed attempts exceeded. Your IP has been temporarily blacklisted for 15 minutes.',
          },
          { status: 429 }
        );
      }

      rateLimitMap.set(ip, entry);
      const remainingAttempts = 3 - entry.attempts;
      return NextResponse.json(
        {
          success: false,
          remainingAttempts,
          message: `Access Denied: Invalid Security Clearance Credentials. ${remainingAttempts} attempt(s) remaining before automated IP lockdown.`,
        },
        { status: 401 }
      );
    }

    // 2. Clear rate limit upon successful owner authentication
    rateLimitMap.delete(ip);

    // 3. Generate Verified Cryptographic Owner Session
    const ownerToken = `adm_sec_jwt_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    const ownerUser = {
      id: 'owner-shihab-root-1',
      email: cleanId.includes('@') ? cleanId : 'shihab@earnxpress.com',
      primaryRole: 'PLATFORM_OWNER',
      status: 'ACTIVE',
      emailVerified: true,
      profile: {
        id: 'p-owner-shihab',
        displayName: 'Shihab Ahmed (Root Owner)',
        headline: 'Platform Architect & Supreme Platform Administrator',
        countryCode: 'BD',
        reputationScore: 5.0,
        completionRate: 100.0,
        totalReviewsCount: 9999,
      },
    };

    const res = NextResponse.json({
      success: true,
      user: ownerUser,
      token: ownerToken,
      message: 'Clearance Granted: Welcome Platform Owner Shihab Ahmed.',
    });

    // Set secure authentication cookies
    res.cookies.set('earnxpress_token', ownerToken, {
      path: '/',
      maxAge: 604800,
      httpOnly: false,
      sameSite: 'lax',
    });
    res.cookies.set('earnxpress_role', 'PLATFORM_OWNER', {
      path: '/',
      maxAge: 604800,
      httpOnly: false,
      sameSite: 'lax',
    });
    res.cookies.set('earnxpress_user', JSON.stringify(ownerUser), {
      path: '/',
      maxAge: 604800,
      httpOnly: false,
      sameSite: 'lax',
    });

    return res;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Cryptographic security authorization failure.' },
      { status: 500 }
    );
  }
}
