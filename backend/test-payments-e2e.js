const crypto = require('crypto');

async function runPaymentsE2ETest() {
  console.log('=== EarnXpress Phase 4: Real International Payment System E2E Test ===\n');

  const BASE_URL = 'http://localhost:4000/api/v1';
  const MOCK_SECRET = 'earnxpress_sandbox_webhook_secret_key_999!';

  // Helper for HMAC-SHA256 signature
  function signPayload(payloadStr) {
    return crypto.createHmac('sha256', MOCK_SECRET).update(payloadStr).digest('hex');
  }

  // 1. Authenticate Actors
  console.log('1. Authenticating Buyer, Worker, and Admin...');
  const [buyerLoginRes, workerLoginRes, adminLoginRes] = await Promise.all([
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'buyer@earnxpress.demo', password: 'Password123!' }),
    }),
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'worker1@earnxpress.demo', password: 'Password123!' }),
    }),
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@earnxpress.demo', password: 'Password123!' }),
    }),
  ]);

  const buyerLogin = await buyerLoginRes.json();
  const workerLogin = await workerLoginRes.json();
  const adminLogin = await adminLoginRes.json();

  const buyerToken = buyerLogin.data.accessToken;
  const workerToken = workerLogin.data.accessToken;
  const adminToken = adminLogin.data.accessToken;

  console.log('   ✓ Buyer ID:', buyerLogin.data.user.id);
  console.log('   ✓ Worker ID:', workerLogin.data.user.id);
  console.log('   ✓ Admin ID:', adminLogin.data.user.id);

  // 2. Safety Guard Test: Live payment provider blocked when ENABLE_REAL_PAYMENTS=false
  console.log('\n2. Testing Financial Safety Guard (Live provider unconfigured block)...');
  const liveProviderRes = await fetch(`${BASE_URL}/payments/checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      amountCents: 10000,
      provider: 'STRIPE',
    }),
  });
  console.log('   Status:', liveProviderRes.status, '(Expected 403 Forbidden)');
  if (liveProviderRes.status !== 403) {
    throw new Error('Safety guard failed: Live provider checkout was not blocked!');
  }
  const liveProviderErr = await liveProviderRes.json();
  console.log('   ✓ Block message:', liveProviderErr.message);

  // 3. Create Sandbox Mock Payment Order (Deposit $250.00 USD = 25000 cents)
  console.log('\n3. Creating Sandbox Mock Payment Order for Buyer Deposit ($250.00 USD)...');
  const createOrderRes = await fetch(`${BASE_URL}/payments/checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      amountCents: 25000,
      provider: 'SANDBOX_MOCK',
      currency: 'USD',
    }),
  });

  const createOrder = await createOrderRes.json();
  console.log('   Order Status:', createOrder.status, '| Order ID:', createOrder.data.orderId);
  console.log('   Provider Order ID:', createOrder.data.providerOrderId);
  console.log('   Checkout URL:', createOrder.data.checkoutUrl);
  if (createOrderRes.status !== 201 || createOrder.data.status !== 'PENDING') {
    throw new Error('Failed to create sandbox payment order');
  }

  const orderId = createOrder.data.orderId;
  const providerOrderId = createOrder.data.providerOrderId;

  // 4. Webhook Security Testing
  console.log('\n4. Testing Webhook Signature Verification & Idempotency...');

  const webhookEventId = `evt_test_${Date.now()}`;
  const webhookPayload = {
    eventId: webhookEventId,
    eventType: 'PAYMENT_SUCCEEDED',
    orderId: orderId,
    providerTransactionId: providerOrderId,
    amountMinor: '25000',
    currency: 'USD',
  };
  const rawBodyStr = JSON.stringify(webhookPayload);

  // 4a. Tampered signature test
  const tamperedRes = await fetch(`${BASE_URL}/payments/webhooks/SANDBOX_MOCK`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-mock-signature': 'tampered_invalid_signature_hex_1234567890abcdef',
    },
    body: rawBodyStr,
  });
  console.log('   Tampered signature response:', tamperedRes.status, '(Expected: 401 Unauthorized)');
  if (tamperedRes.status !== 401) {
    throw new Error('Webhook security failed: Tampered signature was accepted!');
  }

  // 4b. Valid signature test
  const validSignature = signPayload(rawBodyStr);
  const validWebhookRes = await fetch(`${BASE_URL}/payments/webhooks/SANDBOX_MOCK`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-mock-signature': validSignature,
    },
    body: rawBodyStr,
  });
  const validWebhook = await validWebhookRes.json();
  console.log('   Valid webhook response:', validWebhookRes.status, '| Result:', validWebhook.data?.status);
  if (validWebhookRes.status !== 200 || validWebhook.data?.status !== 'PROCESSED') {
    throw new Error('Valid webhook processing failed');
  }

  // 4c. Duplicate webhook event idempotency test
  const duplicateWebhookRes = await fetch(`${BASE_URL}/payments/webhooks/SANDBOX_MOCK`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-mock-signature': validSignature,
    },
    body: rawBodyStr,
  });
  const duplicateWebhook = await duplicateWebhookRes.json();
  console.log('   Duplicate webhook response:', duplicateWebhookRes.status, '| Result:', duplicateWebhook.data?.status, '(Expected: DUPLICATE_IGNORED)');
  if (duplicateWebhook.data?.status !== 'DUPLICATE_IGNORED') {
    throw new Error('Idempotency test failed: Duplicate event was not ignored!');
  }

  // 5. Inspect Buyer Real Ledger Wallet
  console.log('\n5. Inspecting Buyer Real Ledger Post-Deposit...');
  const buyerWalletRes = await fetch(`${BASE_URL}/payments/wallets/buyer`, {
    headers: { 'Authorization': `Bearer ${buyerToken}` },
  });
  const buyerWallet = await buyerWalletRes.json();
  console.log('   Buyer Available Real Funds:', buyerWallet.data.formattedAvailableUSD);
  console.log('   Buyer Real Transactions Count:', buyerWallet.data.transactions.length);
  if (Number(buyerWallet.data.availableBalanceCents) < 25000) {
    throw new Error('Buyer wallet was not credited accurately!');
  }

  // 6. Direct Real Escrow Task Funding
  console.log('\n6. Creating & Funding a Real-Escrow Task Campaign...');
  const tasksListRes = await fetch(`${BASE_URL}/tasks`);
  const tasksList = await tasksListRes.json();
  const sampleTask = tasksList.data[0];
  const catId = sampleTask.category.id;
  const subCatId = sampleTask.subcategory.id;

  const createTaskRes = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      categoryId: catId,
      subcategoryId: subCatId,
      taskModel: 'MULTI_WORKER',
      title: `E2E Payment Verified Campaign #${Date.now()}`,
      descriptionMarkdown: 'Verify real payment escrow lock and settlement workflows.',
      totalSlots: 2,
      unitBudgetCents: 3000, // $30.00
      startDeadlineHours: 6,
      completionDurationHours: 24,
      maxRevisions: 2,
      acceptanceCriteria: [
        { key: 'c1', description: 'Accurate data submission' },
        { key: 'c2', description: 'Zero corruption' },
      ],
      deliverableRequirements: [
        { type: 'URL', label: 'Cloud link' },
      ],
    }),
  });
  const createdTask = await createTaskRes.json();
  if (createTaskRes.status !== 201) {
    console.error('Task creation failed:', createdTask);
    throw new Error('Task creation returned ' + createTaskRes.status);
  }
  const taskId = createdTask.data.id;
  console.log('   ✓ Task created with ID:', taskId, '| Slots: 2 | Unit Budget: $30.00');

  // Create direct task escrow funding order for this task
  const taskOrderRes = await fetch(`${BASE_URL}/payments/checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      amountCents: 6120, // 2 * (3000 + 60 fee) = $61.20
      provider: 'SANDBOX_MOCK',
      taskId: taskId,
    }),
  });
  const taskOrder = await taskOrderRes.json();
  const taskOrderId = taskOrder.data.orderId;

  // Confirm task funding via signed webhook
  const taskWebhookPayload = {
    eventId: `evt_task_${Date.now()}`,
    eventType: 'PAYMENT_SUCCEEDED',
    orderId: taskOrderId,
    providerTransactionId: taskOrder.data.providerOrderId,
    amountMinor: '6120',
    currency: 'USD',
  };
  const taskRawBody = JSON.stringify(taskWebhookPayload);
  await fetch(`${BASE_URL}/payments/webhooks/SANDBOX_MOCK`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-mock-signature': signPayload(taskRawBody),
    },
    body: taskRawBody,
  });

  // Verify task status is now OPEN with FUNDED_REAL
  const taskDetailsRes = await fetch(`${BASE_URL}/tasks/${taskId}`);
  const taskDetails = await taskDetailsRes.json();
  console.log('   Task Status:', taskDetails.data.status, '| Escrow Status:', taskDetails.data.escrowFundingStatus);
  if (taskDetails.data.status !== 'OPEN' || taskDetails.data.escrowFundingStatus !== 'FUNDED_REAL') {
    throw new Error('Task was not opened and real-funded via webhook!');
  }

  // 7. Worker Slot Claim, Deliverable Submission & Settlement
  console.log('\n7. Worker Slot Claim & Real Settlement Payout...');
  const claimRes = await fetch(`${BASE_URL}/tasks/${taskId}/accept-slot`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${workerToken}` },
  });
  const claim = await claimRes.json();
  const participationId = claim.data.participationId || claim.data.id;
  console.log('   ✓ Slot claimed! Participation ID:', participationId);

  // Worker submits deliverable
  await fetch(`${BASE_URL}/tasks/participations/${participationId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${workerToken}`,
    },
    body: JSON.stringify({
      content: 'Payment verified sample deliverables archive URL: https://storage.test/v1.zip',
      deliverableUrls: ['https://storage.test/v1.zip'],
    }),
  });
  console.log('   ✓ Deliverable submitted');

  // Buyer evaluates and approves submission
  const reviewRes = await fetch(`${BASE_URL}/tasks/participations/${participationId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      decision: 'APPROVE',
      feedback: 'Excellent work meeting all acceptance criteria.',
      rating: 5,
    }),
  });
  const review = await reviewRes.json();
  console.log('   ✓ Submission APPROVED! Status:', review.data.status);

  // Worker inspects real ledger wallet
  const workerWalletRes = await fetch(`${BASE_URL}/payments/wallets/worker`, {
    headers: { 'Authorization': `Bearer ${workerToken}` },
  });
  const workerWallet = await workerWalletRes.json();
  console.log('   Worker Available Real Funds:', workerWallet.data.formattedAvailableUSD);

  // 8. Worker Withdrawal Workflow
  console.log('\n8. Testing Worker Real Withdrawal Lifecycle...');
  const withdrawRes = await fetch(`${BASE_URL}/payments/withdrawals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${workerToken}`,
    },
    body: JSON.stringify({
      amountCents: 1500, // $15.00
      method: 'BANK_TRANSFER',
      payoutCurrency: 'BDT',
      destinationDetails: {
        bankName: 'BRAC Bank PLC',
        accountHolder: 'Rahim Chowdhury',
        accountNumber: '1501204859632001',
        routingNumber: '060271845',
      },
    }),
  });
  const withdraw = await withdrawRes.json();
  const withdrawalId = withdraw.data.withdrawalId;
  console.log('   Withdrawal Request Created: ID:', withdrawalId);
  console.log('   Status:', withdraw.data.status, '| Masked:', withdraw.data.destinationDetailsMasked.accountMasked);
  console.log('   Estimated BDT Payout:', (Number(withdraw.data.estimatedPayoutMinor) / 100).toFixed(2), 'BDT (Rate: 121.50)');

  // Admin approves and completes withdrawal
  const completeRes = await fetch(`${BASE_URL}/payments/withdrawals/${withdrawalId}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      decision: 'COMPLETE',
      providerPayoutId: `beftn_trx_${Date.now()}`,
    }),
  });
  const complete = await completeRes.json();
  if ((completeRes.status !== 200 && completeRes.status !== 201) || !complete.data) {
    console.error('Complete withdrawal failed:', completeRes.status, complete);
    throw new Error('Failed to complete withdrawal');
  }
  console.log('   ✓ Admin processed withdrawal to status:', complete.data.status);

  // 9. Exchange Rates Benchmarks
  console.log('\n9. Inspecting Multi-Currency Benchmark Rates...');
  const ratesRes = await fetch(`${BASE_URL}/payments/exchange-rates`);
  const rates = await ratesRes.json();
  console.log('   Benchmark Rates:');
  for (const r of rates.data) {
    console.log(`     • ${r.sourceCurrency} -> ${r.targetCurrency}: ${r.rate} (${r.provider})`);
  }

  // 10. Mathematical Double-Entry Reconciliation Audit
  console.log('\n10. Executing Double-Entry Ledger Mathematical Reconciliation Audit...');
  const reconRes = await fetch(`${BASE_URL}/payments/reconciliation`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  const recon = await reconRes.json();
  console.log('   Reconciliation Audit Result:');
  console.log('     • Double-Entry Balanced:', recon.data.isDoubleEntryBalanced ? '✓ YES (Debits == Credits)' : '✗ FAILED');
  console.log('     • Total Real Transactions:', recon.data.totalTransactions);
  console.log('     • Total Ledger Entries:', recon.data.totalEntries);
  console.log('     • Total Debited:', recon.data.totalDebitedUSD);
  console.log('     • Total Credited:', recon.data.totalCreditedUSD);
  console.log('     • Balances by Account Type:', recon.data.accountBalancesByRole);

  if (!recon.data.isDoubleEntryBalanced) {
    throw new Error('Double-entry ledger is not balanced!');
  }

  console.log('\n=== All Phase 4 Real International Payment Tests Passed 100%! ===');
}

runPaymentsE2ETest().catch((err) => {
  console.error('\nE2E Payment Test Error:', err.message);
  process.exit(1);
});
