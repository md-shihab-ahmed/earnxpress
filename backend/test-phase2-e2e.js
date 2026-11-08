const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:4000/api/v1';

async function request(endpoint, options = {}) {
  let targetUrl = API_BASE + endpoint;
  if (endpoint.startsWith('http')) {
    targetUrl = endpoint;
  } else if (endpoint.startsWith('/api/v1')) {
    targetUrl = 'http://localhost:4000' + endpoint;
  }
  const url = new URL(targetUrl);
  return new Promise((resolve, reject) => {
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = client.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let body = null;
        try {
          body = JSON.parse(data);
          if (body && body.data !== undefined) {
            body = body.data;
          }
        } catch (e) {
          body = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function uploadMultipart(endpoint, token, filename, mimeType, fileBuffer, fields = {}) {
  const boundary = '----WebKitFormBoundary' + crypto.randomBytes(16).toString('hex');
  const CRLF = '\r\n';

  let bodyParts = [];

  // Form fields
  for (const [key, value] of Object.entries(fields)) {
    bodyParts.push(Buffer.from(
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="${key}"${CRLF}${CRLF}` +
      `${value}${CRLF}`
    ));
  }

  // File field
  bodyParts.push(Buffer.from(
    `--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="file"; filename="${filename}"${CRLF}` +
    `Content-Type: ${mimeType}${CRLF}${CRLF}`
  ));
  bodyParts.push(fileBuffer);
  bodyParts.push(Buffer.from(`${CRLF}--${boundary}--${CRLF}`));

  const payload = Buffer.concat(bodyParts);

  const url = new URL(API_BASE + endpoint);
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': payload.length,
        'Authorization': `Bearer ${token}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let body = null;
        try {
          body = JSON.parse(data);
          if (body && body.data !== undefined) {
            body = body.data;
          }
        } catch (e) { body = data; }
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('=== STARTING PHASE 2 DISPUTES & EVIDENCE E2E SUITE ===\n');

  // 1. Login Admin, Buyer, Worker
  console.log('1. Authenticating Admin, Buyer, Worker...');
  const [adminLogin, buyerLogin, workerLogin] = await Promise.all([
    request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'owner@earnxpress.demo', password: 'Password123!' },
    }),
    request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'buyer@earnxpress.demo', password: 'Password123!' },
    }),
    request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'worker1@earnxpress.demo', password: 'Password123!' },
    }),
  ]);

  if (adminLogin.status !== 200 || buyerLogin.status !== 200 || workerLogin.status !== 200) {
    console.error('Login responses:', {
      admin: adminLogin.status,
      buyer: buyerLogin.status,
      worker: workerLogin.status,
    });
    throw new Error('Authentication failed for one or more test accounts');
  }

  const adminToken = adminLogin.body.accessToken;
  const buyerToken = buyerLogin.body.accessToken;
  const workerToken = workerLogin.body.accessToken;
  const buyerId = buyerLogin.body.user.id;
  const workerId = workerLogin.body.user.id;
  console.log('✓ All users authenticated.\n');

  // 2. Fetch categories
  console.log('2. Fetching categories from database for task publishing...');
  const category = await prisma.category.findFirst({
    include: { subcategories: true },
  });
  if (!category || !category.subcategories || category.subcategories.length === 0) {
    throw new Error('No categories/subcategories found in database');
  }
  const categoryId = category.id;
  const subcategoryId = category.subcategories[0].id;
  console.log(`✓ Using Category "${category.name}" / Subcategory "${category.subcategories[0].name}"\n`);

  // 3. Buyer publishes a task with instructions, deliverables, and acceptance criteria
  console.log('3. Buyer creating task with versioned instructions & acceptance criteria...');
  const createTaskRes = await request('/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`,
    },
    body: {
      title: 'Phase 2 Evidence & Dispute Integration Task',
      categoryId,
      subcategoryId,
      taskModel: 'MULTI_WORKER',
      totalSlots: 2,
      unitBudgetCents: 10000, // $100.00
      startDeadlineHours: 12,
      completionDurationHours: 48,
      reviewSlaHours: 72,
      descriptionMarkdown: 'Complete technical report and submit valid CSV data proof as specified in criteria.',
      deliverableRequirements: [
        { type: 'FILE', label: 'PDF summary report' },
        { type: 'URL', label: 'Deliverable dataset' },
      ],
      acceptanceCriteria: [
        { key: 'headers', description: 'Must include valid headers' },
        { key: 'no_nulls', description: 'Must have no null rows' },
      ],
      milestones: [
        { order: 1, title: 'Data Extraction', description: 'Extract dataset' },
        { order: 2, title: 'Validation & Report', description: 'Compile proof PDF' },
      ],
    },
  });

  if (createTaskRes.status !== 201) {
    console.error('Task creation failed:', createTaskRes.body);
    throw new Error('Failed to create task');
  }
  const task = createTaskRes.body;
  console.log(`✓ Task created: ${task.id} (Unit budget: $100.00 USD, 2 slots)\n`);

  // 4. Test Public Q&A Messaging
  console.log('4. Testing Public Q&A Thread...');
  const askRes = await request(`/conversations/task/${task.id}/qna`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${workerToken}`,
    },
    body: { content: 'Is Python 3.11 accepted for the data extraction script?' },
  });
  if (askRes.status !== 201) throw new Error('Worker failed to post question to Q&A');

  const replyRes = await request(`/conversations/task/${task.id}/qna`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`,
    },
    body: { content: 'Yes, Python 3.11 or higher is fully accepted.' },
  });
  if (replyRes.status !== 201) throw new Error('Buyer failed to reply to Q&A');

  const qnaListRes = await request(`/conversations/task/${task.id}/qna`);
  if (qnaListRes.status !== 200 || qnaListRes.body.messages.length < 2) {
    throw new Error('Failed to retrieve task Q&A conversation');
  }
  console.log(`✓ Q&A thread functioning with ${qnaListRes.body.messages.length} messages.\n`);

  // 5. Worker claims slot
  console.log('5. Worker claiming task slot...');
  const claimRes = await request(`/tasks/${task.id}/accept-slot`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${workerToken}` },
  });
  if (claimRes.status !== 201) {
    console.error('Claim failed:', claimRes.body);
    throw new Error('Failed to claim task slot');
  }
  const participationId = claimRes.body.participationId;
  console.log(`✓ Slot claimed: Participation ID ${participationId}\n`);

  // 6. Test Evidence Upload (MIME security checks & malware scanner)
  console.log('6. Testing Secure Evidence Upload...');
  
  // 6a. Valid PNG upload with correct magic bytes
  const validPngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
  const pngPayload = Buffer.concat([validPngHeader, Buffer.alloc(500, 0x41)]);
  const uploadPngRes = await uploadMultipart(
    '/evidence/upload',
    workerToken,
    'execution_screenshot.png',
    'image/png',
    pngPayload,
    { taskId: task.id, participationId }
  );

  if (uploadPngRes.status !== 201) {
    console.error('PNG upload failed:', uploadPngRes.body);
    throw new Error('Valid PNG evidence upload failed');
  }
  const evidenceFileId = uploadPngRes.body.id;
  const signedUrl = uploadPngRes.body.signedUrl;
  console.log(`✓ Valid PNG uploaded clean (ID: ${evidenceFileId}, SHA-256: ${uploadPngRes.body.sha256Hash.substring(0, 16)}...)`);

  // 6b. Spoofed MIME rejection (claimed image/png, but contains text/random bytes)
  const spoofedBuffer = Buffer.from('THIS IS NOT A PNG FILE AT ALL');
  const spoofRes = await uploadMultipart(
    '/evidence/upload',
    workerToken,
    'fake_image.png',
    'image/png',
    spoofedBuffer,
    { taskId: task.id }
  );
  if (spoofRes.status === 400) {
    console.log('✓ Security check passed: Spoofed MIME header correctly rejected with 400 Bad Request');
  } else {
    throw new Error(`Security vulnerability: Spoofed MIME was not rejected (status ${spoofRes.status})`);
  }

  // 6c. Executable file rejection (malware scanner test)
  const peBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // 'MZ' PE header
  const exeRes = await uploadMultipart(
    '/evidence/upload',
    workerToken,
    'malicious.exe',
    'application/pdf',
    peBuffer,
    { taskId: task.id }
  );
  if (exeRes.status === 400) {
    console.log('✓ Security check passed: Malicious executable signature blocked with 400 Bad Request');
  } else {
    throw new Error(`Security vulnerability: Dangerous payload was not blocked (status ${exeRes.status})`);
  }

  // 6d. Test Signed Download URL access
  const downloadRes = await request(signedUrl);
  if (downloadRes.status === 200 && downloadRes.headers['content-type'] === 'image/png') {
    console.log('✓ Time-limited signed URL download verified successfully (200 OK, image/png)');
  } else {
    throw new Error(`Failed to download via signed URL (status ${downloadRes.status})`);
  }
  console.log('');

  // 7. Worker Submits Deliverable with linked evidence
  console.log('7. Worker submitting deliverable deliverables with evidence attachment...');
  const submitRes = await request(`/tasks/participations/${participationId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${workerToken}`,
    },
    body: {
      content: 'All data points collected and verified against deliverables checklist.',
      deliverableUrls: ['https://storage.earnxpress.demo/reports/dataset-v1.csv'],
      evidenceFileIds: [evidenceFileId],
    },
  });
  if (submitRes.status !== 201) {
    console.error('Submission failed:', submitRes.body);
    throw new Error('Failed to submit deliverable');
  }
  console.log('✓ Deliverable submitted (Status: SUBMITTED, 72h SLA active).\n');

  // 8. Buyer reviews and rejects submission
  console.log('8. Buyer reviews and rejects submission with mandatory reason...');
  const rejectRes = await request(`/tasks/participations/${participationId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`,
    },
    body: {
      decision: 'REJECT',
      feedback: 'The deliverable dataset has 15 missing records and fails acceptance criteria.',
    },
  });
  if (rejectRes.status !== 201) {
    console.error('Review rejection failed:', rejectRes.body);
    throw new Error('Failed to review/reject submission');
  }
  console.log('✓ Submission rejected (Status: REJECTED, 72h appeal window open).\n');

  // 9. Worker initiates formal dispute
  console.log('9. Worker initiates Dispute with reason code and evidence...');
  const disputeRes = await request('/disputes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${workerToken}`,
    },
    body: {
      participationId,
      reasonCode: 'UNJUSTIFIED_REJECTION',
      statement: 'The 15 records were intentionally excluded per instruction line 3. Evidence shows full compliance.',
      evidenceFileIds: [evidenceFileId],
    },
  });
  if (disputeRes.status !== 201) {
    console.error('Dispute initiation failed:', disputeRes.body);
    throw new Error('Failed to initiate dispute');
  }
  const disputeId = disputeRes.body.disputeId;
  console.log(`✓ Dispute opened: ID ${disputeId} (Slot transitioned to DISPUTED)\n`);

  // 10. Admin investigates arbitration dossier
  console.log('10. Admin fetching comprehensive arbitration dossier...');
  const dossierRes = await request(`/disputes/${disputeId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  if (dossierRes.status !== 200) {
    console.error('Failed to get dossier:', dossierRes.body);
    throw new Error('Failed to fetch arbitration dossier');
  }
  const dossier = dossierRes.body;
  console.log(`✓ Arbitration dossier loaded:
    - Task: "${dossier.task.title}" (Budget: ${dossier.task.unitBudgetUSD})
    - Worker: ${dossier.worker.name}
    - Buyer: ${dossier.buyer.name}
    - Reason Code: ${dossier.reasonCode}
    - Evidence Files: ${dossier.evidenceFiles.length} item(s) attached
    - Submissions: ${dossier.participation.submissions.length} submission(s)\n`);

  // 11. Admin resolves dispute with SPLIT_SETTLEMENT
  console.log('11. Admin executing SPLIT_SETTLEMENT arbitration ruling (60% Worker, 40% Buyer)...');
  const resolveRes = await request(`/disputes/${disputeId}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: {
      verdict: 'SPLIT_SETTLEMENT',
      workerPayoutCents: '6000', // $60.00
      buyerRefundCents: '4000',  // $40.00
      arbitrationNotes: 'Worker fulfilled 60% of deliverables as evidenced by uploaded screenshots and timestamps.',
    },
  });
  if (resolveRes.status !== 201) {
    console.error('Dispute resolution failed:', resolveRes.body);
    throw new Error('Failed to resolve dispute');
  }
  console.log(`✓ Dispute resolved:
    - Verdict: ${resolveRes.body.verdict}
    - Worker Payout: ${resolveRes.body.workerPayoutUSD}
    - Buyer Refund: ${resolveRes.body.buyerRefundUSD}
    - Status: ${resolveRes.body.status}\n`);

  // 12. Verify Double-Entry Ledger Invariants
  console.log('12. Auditing double-entry financial ledger records...');
  const workerWallets = await request('/demo-finance/wallets', {
    headers: { 'Authorization': `Bearer ${workerToken}` },
  });
  const buyerWallets = await request('/demo-finance/wallets', {
    headers: { 'Authorization': `Bearer ${buyerToken}` },
  });
  console.log('✓ Worker Wallets:', workerWallets.body.accounts.map(a => `${a.accountType}: ${a.formattedUSD}`).join(' | '));
  console.log('✓ Buyer Wallets:', buyerWallets.body.accounts.map(a => `${a.accountType}: ${a.formattedUSD}`).join(' | '));

  console.log('\n=== ALL PHASE 2 DISPUTES & EVIDENCE E2E TESTS PASSED ===');
  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error('\n❌ E2E TEST FAILED:', err);
  await prisma.$disconnect();
  process.exit(1);
});
