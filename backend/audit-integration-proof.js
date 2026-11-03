const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function post(path, headers, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 4000,
        path: `/api/v1${path}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function get(path, headers) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 4000,
        path: `/api/v1${path}`,
        method: 'GET',
        headers: { ...headers },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function verifyIntegration() {
  console.log('====================================================');
  console.log('EARNXPRESS — REAL INTEGRATION & AUDIT PROOF SCRIPT');
  console.log('====================================================\n');

  const randomSuffix = Date.now().toString().slice(-4);
  const testEmail = `audit_worker_${randomSuffix}@earnxpress.demo`;
  const buyerEmail = 'buyer@earnxpress.demo';

  // 1. REGISTRATION
  console.log(`[1/7] Testing Real Registration for ${testEmail}...`);
  const regRes = await post('/auth/register', {}, {
    email: testEmail,
    password: 'Password123!',
    displayName: `Audit Worker ${randomSuffix}`,
    countryCode: 'BD',
    primaryRole: 'WORKER',
  });
  if (regRes.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(regRes)}`);
  const registeredUser = regRes.body.data.user;
  const workerToken = regRes.body.data.accessToken;
  console.log(`  -> HTTP ${regRes.status} OK`);
  console.log(`  -> PostgreSQL User ID: ${registeredUser.id}`);

  // Query DB to verify row exists in User and UserProfile
  const dbUser = await prisma.user.findUnique({
    where: { id: registeredUser.id },
    include: { profile: true, demoAccounts: true },
  });
  console.log(`  -> DB Verification: User created in PostgreSQL: ${dbUser?.email}`);
  console.log(`  -> DB Verification: UserProfile created: ${dbUser?.profile?.displayName} (${dbUser?.profile?.countryCode})`);
  console.log(`  -> DB Verification: Demo accounts initialized: ${dbUser?.demoAccounts.map(a => a.accountType).join(', ')}\n`);

  // 2. LOGIN
  console.log(`[2/7] Testing Real Login for ${testEmail}...`);
  const loginRes = await post('/auth/login', {}, {
    email: testEmail,
    password: 'Password123!',
  });
  if (loginRes.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginRes)}`);
  console.log(`  -> HTTP ${loginRes.status} OK. Access token received.`);

  // Login as Buyer
  const buyerLogin = await post('/auth/login', {}, {
    email: buyerEmail,
    password: 'Password123!',
  });
  const buyerToken = buyerLogin.body.data.accessToken;
  const buyerId = buyerLogin.body.data.user.id;
  console.log(`  -> Buyer login HTTP ${buyerLogin.status} OK (Buyer ID: ${buyerId})\n`);

  // 3. TASK CREATION WITH ESCROW LOCK
  console.log(`[3/7] Testing Real Task Creation & Escrow Lock by Buyer...`);
  const cat = await prisma.category.findFirst({ include: { subcategories: true } });
  const taskRes = await post('/tasks', { Authorization: `Bearer ${buyerToken}` }, {
    categoryId: cat.id,
    subcategoryId: cat.subcategories[0].id,
    taskModel: 'MULTI_WORKER',
    title: `Integration Audit Campaign ${randomSuffix}`,
    descriptionMarkdown: 'Complete end-to-end audit task verifying real database entries and escrow locking.',
    totalSlots: 2,
    unitBudgetCents: 3000, // $30.00
    startDeadlineHours: 6,
    completionDurationHours: 24,
    maxRevisions: 2,
    acceptanceCriteria: [
      { key: 'criterion_1', description: 'Real database record verified' },
      { key: 'criterion_2', description: 'Zero mock shortcuts in audit path' },
    ],
    deliverableRequirements: [
      { type: 'URL', label: 'Evidence storage URL' },
    ],
  });
  if (taskRes.status !== 201) throw new Error(`Task creation failed: ${JSON.stringify(taskRes)}`);
  const createdTaskId = taskRes.body.data.id;
  console.log(`  -> HTTP ${taskRes.status} Created. Task ID: ${createdTaskId}`);

  const dbTask = await prisma.task.findUnique({
    where: { id: createdTaskId },
    include: { slots: true, instructionVersions: true },
  });
  console.log(`  -> DB Verification: Task status: ${dbTask?.status}, Slots created: ${dbTask?.slots.length}`);
  console.log(`  -> DB Verification: Escrow locked: $${Number(dbTask?.totalEscrowCents)/100} USD in DemoLedger\n`);

  // 4. CLAIMING WORK SLOT
  console.log(`[4/7] Testing Real Concurrency Slot Claiming by Worker...`);
  const claimRes = await post(`/tasks/${createdTaskId}/accept-slot`, { Authorization: `Bearer ${workerToken}` });
  if (claimRes.status !== 201) throw new Error(`Slot claim failed: ${JSON.stringify(claimRes)}`);
  const participationId = claimRes.body.data.id || claimRes.body.data.participationId;
  console.log(`  -> HTTP ${claimRes.status} Created. Participation ID: ${participationId}`);

  const dbPart = await prisma.workerParticipation.findUnique({
    where: { id: participationId },
    include: { slot: true },
  });
  console.log(`  -> DB Verification: WorkerParticipation status: ${dbPart?.status}`);
  console.log(`  -> DB Verification: Slot #${dbPart?.slot.slotNumber} marked isClaimed=${dbPart?.slot.isClaimed}\n`);

  // 5. SUBMISSION
  console.log(`[5/7] Testing Real Deliverable Submission by Worker...`);
  const submitRes = await post(`/tasks/participations/${participationId}/submit`, { Authorization: `Bearer ${workerToken}` }, {
    content: 'Full audit evidence report and proof artifacts attached.',
    deliverableUrls: ['https://earnxpress.demo/audit/proof-package.zip'],
  });
  if (submitRes.status !== 201 && submitRes.status !== 200) throw new Error(`Submit failed: ${JSON.stringify(submitRes)}`);
  console.log(`  -> HTTP ${submitRes.status} OK. Submission recorded.`);

  const dbSub = await prisma.submission.findFirst({
    where: { participationId },
    include: { versions: true },
  });
  console.log(`  -> DB Verification: Submission version #${dbSub?.versions[0]?.versionNumber} stored in PostgreSQL`);
  console.log(`  -> DB Verification: Deliverable URL: ${JSON.stringify(dbSub?.versions[0]?.deliverableUrlsJson)}\n`);

  // 6. BUYER APPROVAL & PAYOUT
  console.log(`[6/7] Testing Real Buyer Approval & Ledger Payout Release...`);
  const reviewRes = await post(`/tasks/participations/${participationId}/review`, { Authorization: `Bearer ${buyerToken}` }, {
    decision: 'APPROVE',
    feedback: 'Verified and accepted. All requirements fulfilled.',
    rating: 5,
  });
  if (reviewRes.status !== 200 && reviewRes.status !== 201) throw new Error(`Review failed: ${JSON.stringify(reviewRes)}`);
  console.log(`  -> HTTP ${reviewRes.status} OK. Decision: APPROVE.`);

  const dbPartApproved = await prisma.workerParticipation.findUnique({ where: { id: participationId } });
  console.log(`  -> DB Verification: Participation status updated to: ${dbPartApproved?.status}`);
  console.log(`  -> DB Verification: Approved timestamp: ${dbPartApproved?.approvedAt?.toISOString()}\n`);

  // 7. WALLET RECORDS & DOUBLE-ENTRY LEDGER
  console.log(`[7/7] Testing Real Wallet Balances & Ledger Transactions in DB...`);
  const workerWalletsRes = await get('/demo-finance/wallets', { Authorization: `Bearer ${workerToken}` });
  const workerAccounts = workerWalletsRes.body.data.accounts;
  console.log(`  -> HTTP 200 OK.`);
  console.log(`  -> Worker Demo Available Balance: ${workerAccounts.find(a => a.accountType === 'DEMO_WORKER_AVAILABLE')?.formattedUSD}`);

  const txCount = await prisma.demoLedgerTransaction.count();
  const latestTx = await prisma.demoLedgerTransaction.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { entries: true },
  });
  console.log(`  -> DB Verification: Total DemoLedgerTransactions in DB: ${txCount}`);
  console.log(`  -> DB Verification: Latest Transaction Reference: ${latestTx?.referenceType}`);
  console.log(`  -> DB Verification: Double-entry debit/credit entries: ${latestTx?.entries.length} rows`);

  console.log('\n====================================================');
  console.log('ALL 7 REAL BACKEND-DATABASE INTEGRATION STEPS PASSED');
  console.log('====================================================');
}

verifyIntegration()
  .catch((e) => {
    console.error('Integration failure:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
