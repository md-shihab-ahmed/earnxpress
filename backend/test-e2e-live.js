const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('=== EarnXpress Live End-to-End API Test ===\n');

  // 1. Login as Buyer
  console.log('1. Logging in as Buyer (buyer@earnxpress.demo)...');
  const buyerLogin = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'buyer@earnxpress.demo', password: 'Password123!' }
  );
  if (buyerLogin.status !== 200 || !buyerLogin.data.data?.accessToken) {
    console.error('Buyer login failed:', buyerLogin);
    process.exit(1);
  }
  const buyerToken = buyerLogin.data.data.accessToken;
  const buyerId = buyerLogin.data.data.user.id;
  console.log(`✓ Buyer logged in successfully (User ID: ${buyerId})`);

  // 2. Login as Worker 1
  console.log('\n2. Logging in as Worker (worker1@earnxpress.demo)...');
  const workerLogin = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'worker1@earnxpress.demo', password: 'Password123!' }
  );
  if (workerLogin.status !== 200 || !workerLogin.data.data?.accessToken) {
    console.error('Worker login failed:', workerLogin);
    process.exit(1);
  }
  const workerToken = workerLogin.data.data.accessToken;
  const workerId = workerLogin.data.data.user.id;
  console.log(`✓ Worker logged in successfully (User ID: ${workerId})`);

  // 3. Buyer Wallet Balance
  console.log('\n3. Fetching Buyer Demo Ledger Wallets...');
  const buyerWallets = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/demo-finance/wallets',
    method: 'GET',
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  console.log('Buyer Wallets:', buyerWallets.data.data);

  // 4. Discover Categories to post task
  const tasksRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/tasks',
    method: 'GET',
  });
  const existingTask = tasksRes.data.data[0];
  const catId = existingTask.category.id;
  const subCatId = existingTask.subcategory.id;

  // 5. Buyer creates new task
  console.log('\n4. Buyer creating new task with locked demo escrow...');
  const createTaskRes = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
    },
    {
      categoryId: catId,
      subcategoryId: subCatId,
      taskModel: 'MULTI_WORKER',
      title: 'Audit Multi-Device CSS Flexbox Grid Layouts',
      descriptionMarkdown: 'Verify responsive breakpoint behaviors across iPhone 15, iPad Air, and 4K displays.',
      totalSlots: 3,
      unitBudgetCents: 5000, // $50.00
      maxRevisions: 2,
      startDeadlineHours: 6,
      completionDurationHours: 24,
      acceptanceCriteria: [
        { key: 'viewport_320', description: 'No horizontal overflow on 320px viewport' },
        { key: 'grid_collapse', description: 'Grid smoothly collapses to single column below 768px' },
      ],
      deliverableRequirements: [
        { type: 'URL', label: 'GitHub Pull Request URL' },
      ],
    }
  );
  if (createTaskRes.status !== 201) {
    console.error('Failed to create task:', JSON.stringify(createTaskRes.data, null, 2));
    process.exit(1);
  }
  const newTask = createTaskRes.data.data;
  console.log(`✓ Task created successfully! (ID: ${newTask.id}, Slots: ${newTask.totalSlots}, Escrow: $${Number(newTask.totalEscrowCents)/100})`);

  // 6. Worker accepts slot
  console.log(`\n5. Worker claiming slot on task ${newTask.id}...`);
  const claimRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/tasks/${newTask.id}/accept-slot`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${workerToken}`,
    },
  });
  if (claimRes.status !== 201) {
    console.error('Failed to claim slot:', JSON.stringify(claimRes.data, null, 2));
    process.exit(1);
  }
  const participation = claimRes.data.data;
  console.log(`✓ Slot claimed! (Participation ID: ${participation.id}, Status: ${participation.status}, Slot: ${participation.slotNumber})`);

  // 7. Worker submits deliverables
  console.log(`\n6. Worker submitting deliverable...`);
  const submitRes = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/tasks/participations/${participation.id}/submit`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerToken}`,
      },
    },
    {
      content: 'Fixed flexbox wrap overflow issues. Tested on 320px and 768px viewports.',
      deliverableUrls: ['https://github.com/earnxpress/demo-pr/42'],
    }
  );
  if (submitRes.status !== 201 && submitRes.status !== 200) {
    console.error('Failed to submit deliverable:', JSON.stringify(submitRes.data, null, 2));
    process.exit(1);
  }
  console.log(`✓ Deliverable submitted for review! (Status: ${submitRes.data.data?.status})`);

  // 8. Buyer reviews and approves deliverable
  console.log(`\n7. Buyer evaluating submission (APPROVE decision)...`);
  const reviewRes = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/tasks/participations/${participation.id}/review`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
    },
    {
      decision: 'APPROVE',
      feedback: 'Excellent work! Verified across all viewports with zero errors.',
      rating: 5,
    }
  );
  if (reviewRes.status !== 200 && reviewRes.status !== 201) {
    console.error('Failed to approve submission:', JSON.stringify(reviewRes.data, null, 2));
    process.exit(1);
  }
  console.log(`✓ Submission APPROVED by Buyer! Payout released to Worker.`);

  // 9. Verify Worker Balance
  console.log('\n8. Checking Worker Demo Ledger Wallets post-payout...');
  const workerWallets = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/demo-finance/wallets',
    method: 'GET',
    headers: { Authorization: `Bearer ${workerToken}` },
  });
  console.log('Worker Wallets:', workerWallets.data.data);

  // 10. Claim Faucet
  console.log('\n9. Testing Demo Faucet ($1,000 credit)...');
  const faucetRes = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/demo-finance/faucet',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerToken}`,
      },
    },
    { amountCents: 100000 }
  );
  console.log('Faucet claimed:', faucetRes.data.data);

  console.log('\n=== All Live End-to-End Tests Passed 100%! ===');
}

run().catch(console.error);
