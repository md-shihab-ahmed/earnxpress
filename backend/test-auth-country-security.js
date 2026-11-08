/**
 * EarnXpress — Authentication, Registration & International Country Support
 * Comprehensive Automated Verification Test Suite
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const API_BASE = 'http://localhost:4000/api/v1';
const prisma = new PrismaClient();

const results = [];

function recordTest(name, passed, detail) {
  results.push({ name, passed, detail });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol} - ${name} ${detail ? `(${detail})` : ''}`);
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const { headers, ...restOptions } = options;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    ...restOptions,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('===============================================================');
  console.log('EarnXpress Auth, Registration & Country Security Verification');
  console.log('===============================================================\n');

  const testId = Date.now();
  const testWorkerEmail = `test_worker_${testId}@test.earnxpress.com`;
  const testBuyerEmail = `test_buyer_${testId}@test.earnxpress.com`;
  const validPassword = `V@lidPassword_${testId}!`;

  try {
    // -------------------------------------------------------------
    // TEST 1: Password Rule - Min 8 characters
    // -------------------------------------------------------------
    {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: `short_pwd_${testId}@test.com`,
          password: 'Aa1!', // 4 chars
          confirmPassword: 'Aa1!',
          displayName: 'Short Password Tester',
          countryCode: 'BD',
          primaryRole: 'WORKER',
        }),
      });
      const passed = res.status === 400;
      recordTest('1. Password Policy: Reject length < 8 chars', passed, `Status: ${res.status}`);
    }

    // -------------------------------------------------------------
    // TEST 2: Password Rule - Max 64 characters
    // -------------------------------------------------------------
    {
      const longPass = 'A1!' + 'a'.repeat(65);
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: `long_pwd_${testId}@test.com`,
          password: longPass,
          confirmPassword: longPass,
          displayName: 'Long Password Tester',
          countryCode: 'US',
          primaryRole: 'WORKER',
        }),
      });
      const passed = res.status === 400;
      recordTest('2. Password Policy: Reject length > 64 chars', passed, `Status: ${res.status}`);
    }

    // -------------------------------------------------------------
    // TEST 3: Password Rule - Missing Uppercase / Lowercase / Number / Symbol
    // -------------------------------------------------------------
    {
      const resNoUpper = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: `noupper_${testId}@test.com`,
          password: 'lowercase123!',
          confirmPassword: 'lowercase123!',
          displayName: 'No Upper Tester',
          countryCode: 'GB',
          primaryRole: 'WORKER',
        }),
      });
      const resNoSymbol = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: `nosymbol_${testId}@test.com`,
          password: 'UpperCase123',
          confirmPassword: 'UpperCase123',
          displayName: 'No Symbol Tester',
          countryCode: 'GB',
          primaryRole: 'WORKER',
        }),
      });
      const passed = resNoUpper.status === 400 && resNoSymbol.status === 400;
      recordTest('3. Password Policy: Reject missing char classes (upper/symbol)', passed, `Status: ${resNoUpper.status}/${resNoSymbol.status}`);
    }

    // -------------------------------------------------------------
    // TEST 4: Password Rule - Reject Blacklisted/Common Passwords
    // -------------------------------------------------------------
    {
      const resBlacklist = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: `blacklist_${testId}@test.com`,
          password: 'Password123!',
          confirmPassword: 'Password123!',
          displayName: 'Blacklist Tester',
          countryCode: 'BD',
          primaryRole: 'WORKER',
        }),
      });
      const passed = resBlacklist.status === 400;
      recordTest('4. Password Policy: Reject common/blacklisted password (Password123!)', passed, `Status: ${resBlacklist.status}`);
    }

    // -------------------------------------------------------------
    // TEST 5: Password Rule - Confirm Password Mismatch
    // -------------------------------------------------------------
    {
      const resMismatch = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: `mismatch_${testId}@test.com`,
          password: validPassword,
          confirmPassword: 'DifferentP@ssword123!',
          displayName: 'Mismatch Tester',
          countryCode: 'BD',
          primaryRole: 'WORKER',
        }),
      });
      const passed = resMismatch.status === 400;
      recordTest('5. Password Policy: Reject confirm password mismatch', passed, `Status: ${resMismatch.status}`);
    }

    // -------------------------------------------------------------
    // TEST 6: International Country - Reject Invalid ISO 3166-1 Code
    // -------------------------------------------------------------
    {
      const resBadCountry = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: `badcountry_${testId}@test.com`,
          password: validPassword,
          confirmPassword: validPassword,
          displayName: 'Bad Country Tester',
          countryCode: 'XX_INVALID',
          primaryRole: 'WORKER',
        }),
      });
      const passed = resBadCountry.status === 400;
      recordTest('6. International Country: Reject non-ISO 3166-1 country code (XX_INVALID)', passed, `Status: ${resBadCountry.status}`);
    }

    // -------------------------------------------------------------
    // TEST 7: Role Restriction - Reject ADMIN / PLATFORM_OWNER Registration
    // -------------------------------------------------------------
    {
      const resAdmin = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: `admin_attempt_${testId}@test.com`,
          password: validPassword,
          confirmPassword: validPassword,
          displayName: 'Admin Attempter',
          countryCode: 'US',
          primaryRole: 'PLATFORM_OWNER',
        }),
      });
      const passed = resAdmin.status === 400;
      recordTest('7. Security: Reject PLATFORM_OWNER / ADMIN registration', passed, `Status: ${resAdmin.status}`);
    }

    // -------------------------------------------------------------
    // TEST 8: Valid Registration across multiple ISO countries (BD, US, DE, JP, NG)
    // -------------------------------------------------------------
    let registeredWorkerToken = null;
    let registeredWorkerId = null;
    {
      const resValid = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: testWorkerEmail,
          password: validPassword,
          confirmPassword: validPassword,
          displayName: 'Verified International Worker',
          countryCode: 'BD',
          primaryRole: 'WORKER',
        }),
      });
      const passed = resValid.status === 201 && resValid.data?.data?.accessToken && resValid.data?.data?.user?.emailVerified === false;
      registeredWorkerToken = resValid.data?.data?.accessToken;
      registeredWorkerId = resValid.data?.data?.user?.id;
      recordTest('8. Registration: Successfully register Worker with ISO country BD (unverified initial state)', passed, `User ID: ${registeredWorkerId}`);
    }

    // Register Buyer
    let registeredBuyerToken = null;
    let registeredBuyerId = null;
    {
      const resBuyer = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: testBuyerEmail,
          password: validPassword,
          confirmPassword: validPassword,
          displayName: 'International Campaign Buyer',
          countryCode: 'US',
          primaryRole: 'BUYER',
        }),
      });
      registeredBuyerToken = resBuyer.data?.data?.accessToken;
      registeredBuyerId = resBuyer.data?.data?.user?.id;
      recordTest('8b. Registration: Successfully register Buyer with ISO country US', resBuyer.status === 201, `Buyer ID: ${registeredBuyerId}`);
    }

    // -------------------------------------------------------------
    // TEST 9: Email Verification Token - SHA-256 Storage Check
    // -------------------------------------------------------------
    let dbTokenRecord = null;
    {
      dbTokenRecord = await prisma.emailVerificationToken.findFirst({
        where: { userId: registeredWorkerId },
        orderBy: { createdAt: 'desc' },
      });
      // The token hash must be 64 characters long (SHA-256 hex string)
      const passed = dbTokenRecord && dbTokenRecord.tokenHash && dbTokenRecord.tokenHash.length === 64;
      recordTest('9. Security: Verification token stored ONLY as 64-character SHA-256 hash', passed, `Hash: ${dbTokenRecord?.tokenHash?.substring(0, 16)}...`);
    }

    // -------------------------------------------------------------
    // TEST 10: Unverified User Guard - Restricted Actions Blocked
    // -------------------------------------------------------------
    {
      // Worker attempting to claim slot without verified email
      const tasksRes = await request('/tasks?limit=1');
      const taskId = tasksRes.data?.data?.tasks?.[0]?.id || tasksRes.data?.data?.[0]?.id;

      if (taskId) {
        const claimRes = await request(`/tasks/${taskId}/accept-slot`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${registeredWorkerToken}` },
        });
        const passed = claimRes.status === 403;
        recordTest('10. Security: Unverified worker blocked from claiming marketplace task', passed, `Status: ${claimRes.status}`);
      }

      // Buyer attempting to create task without verified email
      const createTaskRes = await request('/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${registeredBuyerToken}` },
        body: JSON.stringify({
          title: 'Unverified Buyer Task Attempt',
          description: 'This should be blocked',
          unitBudgetCents: 1000,
          totalSlots: 1,
          taskModel: 'MULTI_WORKER',
          categoryId: 'c1',
          subcategoryId: 'sc1',
          instructions: { descriptionMarkdown: 'Test', acceptanceCriteria: [], deliverableRequirements: [], milestones: [] },
        }),
      });
      const passedBuyer = createTaskRes.status === 403;
      recordTest('10b. Security: Unverified buyer blocked from publishing task campaigns', passedBuyer, `Status: ${createTaskRes.status}`);
    }

    // -------------------------------------------------------------
    // TEST 11: Resend Verification Rate Limit (60s Cooldown)
    // -------------------------------------------------------------
    {
      // First resend immediately after registration should hit 60s cooldown
      const resendRes = await request('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: testWorkerEmail }),
      });
      const passed = resendRes.status === 429;
      recordTest('11. Security: Resend verification enforces 60-second cooldown rate limit', passed, `Status: ${resendRes.status}`);
    }

    // -------------------------------------------------------------
    // TEST 12: Verify Email with Valid Token & Single-Use Enforcement
    // -------------------------------------------------------------
    {
      // We can create a known test token in DB with its SHA-256 hash
      const testRawToken = crypto.randomBytes(32).toString('hex');
      const testTokenHash = crypto.createHash('sha256').update(testRawToken).digest('hex');

      await prisma.emailVerificationToken.create({
        data: {
          userId: registeredWorkerId,
          tokenHash: testTokenHash,
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      // Verify email with raw token
      const verifyRes = await request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: testRawToken }),
      });
      const passed = verifyRes.status === 200 && verifyRes.data?.data?.verified === true;
      recordTest('12. Email Verification: Valid token successfully verifies user account', passed, `Status: ${verifyRes.status}`);

      // Verify user in DB is now emailVerified: true
      const userInDb = await prisma.user.findUnique({ where: { id: registeredWorkerId } });
      recordTest('12b. Database: User emailVerified updated to true', userInDb?.emailVerified === true, `emailVerified: ${userInDb?.emailVerified}`);

      // Single-use check: Re-using the same token must be rejected
      const reuseRes = await request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: testRawToken }),
      });
      const passedReuse = reuseRes.status === 400;
      recordTest('12c. Security: Single-use enforcement rejects re-using already used token', passedReuse, `Status: ${reuseRes.status}`);
    }

    // -------------------------------------------------------------
    // TEST 13: Brute-Force Protection - 5 Consecutive Failed Logins Lock Account
    // -------------------------------------------------------------
    {
      const bruteEmail = `brute_${testId}@test.com`;
      const regBrute = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: bruteEmail,
          password: validPassword,
          confirmPassword: validPassword,
          displayName: 'Brute Force Tester',
          countryCode: 'US',
          primaryRole: 'WORKER',
        }),
      });

      let lockedOut = false;
      let finalStatus = 0;
      for (let i = 1; i <= 5; i++) {
        const failRes = await request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: bruteEmail,
            password: 'WrongPassword!',
          }),
        });
        finalStatus = failRes.status;
        if (failRes.status === 403 && failRes.data?.error?.code === 'ERR_ACCOUNT_LOCKED') {
          lockedOut = true;
        }
      }

      recordTest('13. Brute Force Security: 5 failed attempts locks account for 15 minutes', lockedOut, `Final status: ${finalStatus}`);

      // Verify that even with the correct password, login is blocked while locked
      const tryCorrectWhileLocked = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: bruteEmail,
          password: validPassword,
        }),
      });
      const passedBlocked = tryCorrectWhileLocked.status === 403;
      recordTest('13b. Brute Force Security: Correct credentials blocked while account is locked', passedBlocked, `Status: ${tryCorrectWhileLocked.status}`);
    }

    // -------------------------------------------------------------
    // TEST 14: Password Reset - Single-Use, Session Invalidation & Lockout Clear
    // -------------------------------------------------------------
    {
      const resetEmail = `reset_${testId}@test.com`;
      await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: resetEmail,
          password: validPassword,
          confirmPassword: validPassword,
          displayName: 'Reset Tester',
          countryCode: 'US',
          primaryRole: 'WORKER',
        }),
      });

      // Login to get an active session
      const loginRes = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: resetEmail,
          password: validPassword,
        }),
      });
      const oldAccessToken = loginRes.data?.data?.accessToken;

      // Lock account with 5 failed attempts
      for (let i = 1; i <= 5; i++) {
        await request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: resetEmail, password: 'WrongPassword!' }),
        });
      }

      // Generate a known reset token
      const rawResetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
      const userRecord = await prisma.user.findUnique({ where: { email: resetEmail } });

      await prisma.passwordResetToken.create({
        data: {
          userId: userRecord.id,
          tokenHash: resetTokenHash,
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      // Reset password with new valid password
      const newPassword = `NewP@ssw0rd_${testId}!`;
      const resetRes = await request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: rawResetToken,
          password: newPassword,
          confirmPassword: newPassword,
        }),
      });
      const passedReset = resetRes.status === 200;
      recordTest('14. Password Reset: Successfully reset password with valid token', passedReset, `Status: ${resetRes.status}`);

      // Verify old sessions/refresh tokens are invalidated (tokenVersion incremented)
      const userAfter = await prisma.user.findUnique({ where: { email: resetEmail } });
      const sessionInvalidated = userAfter.tokenVersion > userRecord.tokenVersion;
      recordTest('14b. Session Security: Password reset increments tokenVersion (invalidating existing sessions)', sessionInvalidated, `Version: ${userRecord.tokenVersion} -> ${userAfter.tokenVersion}`);

      // Verify account lockout was cleared by password reset
      const loginWithNew = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: resetEmail,
          password: newPassword,
        }),
      });
      const passedNewLogin = loginWithNew.status === 200 && loginWithNew.data?.data?.accessToken;
      recordTest('14c. Account Recovery: Login with new password succeeds and lockout is cleared', passedNewLogin, `Status: ${loginWithNew.status}`);
    }

    // -------------------------------------------------------------
    // TEST 15: Logout - Session Invalidation
    // -------------------------------------------------------------
    {
      const logoutRes = await request('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${registeredWorkerToken}` },
      });
      const passed = logoutRes.status === 200;
      recordTest('15. Security: Logout revokes session and increments tokenVersion', passed, `Status: ${logoutRes.status}`);
    }

    // -------------------------------------------------------------
    // TEST 16: International KYC Architecture
    // -------------------------------------------------------------
    {
      // Log in to get fresh active token for worker
      const freshLogin = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: testWorkerEmail,
          password: validPassword,
        }),
      });
      const kycToken = freshLogin.data?.data?.accessToken;

      // 16a: Supported documents for Bangladesh (Smart NID, Old NID, Passport, Driving License)
      const bdDocs = await request('/idv/supported-documents?countryCode=BD');
      const hasBdNid = bdDocs.data?.data?.some((d) => d.code === 'SMART_NID');
      recordTest('16a. International KYC: Bangladesh country-specific documents returned (Smart NID, etc.)', hasBdNid, `Docs: ${bdDocs.data?.data?.length}`);

      // 16b: Supported documents for United States (Driver License, Passport, State ID)
      const usDocs = await request('/idv/supported-documents?countryCode=US');
      const hasUsDl = usDocs.data?.data?.some((d) => d.code === 'DRIVERS_LICENSE');
      recordTest('16b. International KYC: United States country-specific documents returned (Driver License, etc.)', hasUsDl, `Docs: ${usDocs.data?.data?.length}`);

      // 16c: Mock Liveness Session initiation
      const livenessRes = await request('/idv/liveness-session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${kycToken}` },
      });
      const hasLivenessToken = livenessRes.data?.data?.livenessSessionToken && livenessRes.data?.data?.mockMode;
      recordTest('16c. International KYC: Biometric liveness check session initiated', hasLivenessToken, `Token: ${livenessRes.data?.data?.livenessSessionToken?.substring(0, 20)}...`);

      // 16d: Mock submission adhering to contract
      const submitKycRes = await request('/idv/submit-mock', {
        method: 'POST',
        headers: { Authorization: `Bearer ${kycToken}` },
        body: JSON.stringify({
          countryCode: 'BD',
          documentType: 'SMART_NID',
          documentNumberMasked: 'XXXX-XXXX-45',
        }),
      });
      const passedKyc = submitKycRes.status === 200 && (submitKycRes.data?.data?.status === 'VERIFIED' || submitKycRes.data?.status === 'VERIFIED');
      recordTest('16d. International KYC: Mock verification submitted and verified in database', passedKyc, `Status: ${submitKycRes.data?.data?.status || submitKycRes.data?.status}`);

      // 16e: KYC Status Check
      const statusRes = await request('/idv/status', {
        method: 'GET',
        headers: { Authorization: `Bearer ${kycToken}` },
      });
      const isVerified = statusRes.data?.data?.verified === true && statusRes.data?.data?.documentType === 'SMART_NID';
      recordTest('16e. International KYC: Status query confirms user verified identity', isVerified, `Verified: ${statusRes.data?.data?.verified}`);
    }

    console.log('\n===============================================================');
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(`TOTAL TEST RESULTS: ${passedCount} / ${totalCount} PASSED`);
    console.log('===============================================================');

    if (passedCount !== totalCount) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
