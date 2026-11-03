const http = require('http');

async function main() {
  console.log('=== Verifying Phase 3.5 Security Gates & Demo Protection ===\n');

  // 1. Verify Public Platform Stats (Database-Backed)
  const statsRes = await fetch('http://localhost:4000/api/v1/tasks/public/platform-stats');
  const stats = await statsRes.json();
  console.log('1. Database-backed Public Stats:');
  console.log('   Status:', statsRes.status);
  console.log('   Data:', JSON.stringify(stats.data, null, 2));
  if (statsRes.status !== 200 || !stats.data?.settlementRatePercent) {
    throw new Error('Public platform stats verification failed');
  }

  // 2. Verify Worker Participations Endpoint with JWT
  const loginRes = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'worker1@earnxpress.demo', password: 'Password123!' })
  });
  const login = await loginRes.json();
  const token = login.data?.accessToken;
  console.log('\n2. Worker Authentication:');
  console.log('   Status:', loginRes.status, '| Worker ID:', login.data?.user?.id);

  const partsRes = await fetch('http://localhost:4000/api/v1/tasks/participations/my', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const parts = await partsRes.json();
  console.log('   GET /tasks/participations/my Status:', partsRes.status);
  console.log('   Worker Participations in DB:', Array.isArray(parts.data) ? parts.data.length : 'N/A');
  if (partsRes.status !== 200) {
    throw new Error('Worker participations endpoint failed');
  }

  // 3. Unauthorized access check (Anonymous user cannot access worker participations)
  const anonRes = await fetch('http://localhost:4000/api/v1/tasks/participations/my');
  console.log('\n3. Anonymous Access to Worker Participations Guard:');
  console.log('   Status:', anonRes.status, '(Expected: 401 Unauthorized)');
  if (anonRes.status !== 401) {
    throw new Error('Anonymous access guard failed - expected 401');
  }

  // 4. Role Guard Check: Worker attempting to publish a Buyer task
  const imposterTaskRes = await fetch('http://localhost:4000/api/v1/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // worker token
    },
    body: JSON.stringify({
      categoryId: 'd2fdddae-e0ce-49c6-a04f-98b3cbf04928',
      subcategoryId: 'a7c8c961-93cb-472a-9322-b64932680076',
      title: 'Malicious Task by Worker Role',
      totalSlots: 10,
      unitBudgetCents: 5000,
    })
  });
  console.log('\n4. Role Guard: Worker attempting Buyer Task Creation:');
  console.log('   Status:', imposterTaskRes.status, '(Expected: 403 Forbidden)');
  if (imposterTaskRes.status !== 403) {
    throw new Error('Role guard failed - worker was not forbidden from buyer task creation');
  }

  // 5. Environment Validation Test
  const { validateEnv } = require('./dist/src/config/env.config.js');
  console.log('\n5. Production Environment Validation:');
  console.log('   validateEnv function exists:', typeof validateEnv === 'function');
  let rejectedDevSecret = false;
  try {
    validateEnv({
      NODE_ENV: 'production',
      JWT_ACCESS_SECRET: 'dev_secret_key_insecure_123456789012345',
      JWT_REFRESH_SECRET: 'dev_refresh_key_insecure_1234567890123',
      DATABASE_URL: 'postgresql://earnxpress_admin:secret@localhost:5432/earnxpress_db',
    });
  } catch (err) {
    rejectedDevSecret = true;
    console.log('   Insecure dev_ secret correctly rejected in production:', err.message);
  }
  if (!rejectedDevSecret) {
    throw new Error('Production environment validation failed to reject dev_ secret!');
  }

  console.log('\n=== All Phase 3.5 Security Gates & Protections Verified 100%! ===');
}

main().catch((err) => {
  console.error('\nVerification Error:', err.message);
  process.exit(1);
});
