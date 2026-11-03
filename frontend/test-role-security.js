/**
 * EarnXpress Role-Based Security & Direct URL Protection Audit Script
 */
const BASE_FRONTEND = 'http://localhost:3000';
const BASE_BACKEND = 'http://localhost:4000/api/v1';

async function runSecurityAudit() {
  console.log('=== EarnXpress: Role-Based Navigation & Security Audit ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. PUBLIC VISITOR TESTS
  console.log('1. Auditing Public Visitor Access (Logged Out)...');
  const homeRes = await fetch(`${BASE_FRONTEND}/`, { redirect: 'manual' });
  assert(homeRes.status === 200, 'Homepage is publicly accessible without login (200 OK)');

  const tasksRes = await fetch(`${BASE_FRONTEND}/tasks`, { redirect: 'manual' });
  assert(tasksRes.status === 200, 'Public marketplace is accessible without login (200 OK)');

  const aboutRes = await fetch(`${BASE_FRONTEND}/about`, { redirect: 'manual' });
  assert(aboutRes.status === 200, 'About page is publicly accessible (200 OK)');

  // 2. DIRECT URL PROTECTION VIA NEXT.JS MIDDLEWARE
  console.log('\n2. Auditing Direct URL Protection (Middleware Redirection)...');
  const unauthWorker = await fetch(`${BASE_FRONTEND}/worker`, { redirect: 'manual' });
  assert(
    unauthWorker.status === 307 || unauthWorker.status === 308,
    `Logged out access to /worker is redirected (${unauthWorker.status}) to ${unauthWorker.headers.get('location')}`
  );

  const unauthBuyer = await fetch(`${BASE_FRONTEND}/buyer`, { redirect: 'manual' });
  assert(
    unauthBuyer.status === 307 || unauthBuyer.status === 308,
    `Logged out access to /buyer is redirected (${unauthBuyer.status}) to ${unauthBuyer.headers.get('location')}`
  );

  const unauthAdmin = await fetch(`${BASE_FRONTEND}/admin`, { redirect: 'manual' });
  assert(
    unauthAdmin.status === 307 || unauthAdmin.status === 308,
    `Logged out access to /admin is redirected (${unauthAdmin.status}) to ${unauthAdmin.headers.get('location')}`
  );

  // 3. CROSS-ROLE UNAUTHORIZED DIRECT ACCESS
  console.log('\n3. Auditing Cross-Role Unauthorized Access...');
  const workerToBuyer = await fetch(`${BASE_FRONTEND}/buyer/tasks/new`, {
    headers: {
      Cookie: 'earnxpress_token=mock_token; earnxpress_role=WORKER',
    },
    redirect: 'manual',
  });
  assert(
    workerToBuyer.status === 307 || workerToBuyer.status === 308,
    `Worker accessing /buyer/tasks/new is redirected to: ${workerToBuyer.headers.get('location')}`
  );

  const buyerToWorker = await fetch(`${BASE_FRONTEND}/worker/wallet`, {
    headers: {
      Cookie: 'earnxpress_token=mock_token; earnxpress_role=BUYER',
    },
    redirect: 'manual',
  });
  assert(
    buyerToWorker.status === 307 || buyerToWorker.status === 308,
    `Buyer accessing /worker/wallet is redirected to: ${buyerToWorker.headers.get('location')}`
  );

  const workerToAdmin = await fetch(`${BASE_FRONTEND}/admin`, {
    headers: {
      Cookie: 'earnxpress_token=mock_token; earnxpress_role=WORKER',
    },
    redirect: 'manual',
  });
  assert(
    workerToAdmin.status === 307 || workerToAdmin.status === 308,
    `Worker accessing /admin is redirected to: ${workerToAdmin.headers.get('location')}`
  );

  const buyerToAdmin = await fetch(`${BASE_FRONTEND}/admin`, {
    headers: {
      Cookie: 'earnxpress_token=mock_token; earnxpress_role=BUYER',
    },
    redirect: 'manual',
  });
  assert(
    buyerToAdmin.status === 307 || buyerToAdmin.status === 308,
    `Buyer accessing /admin is redirected to: ${buyerToAdmin.headers.get('location')}`
  );

  // 4. BACKEND API ROLE GUARDS ENFORCEMENT
  console.log('\n4. Auditing Backend API Role Guards & Authorization...');
  // Direct unauthenticated call to admin
  const apiUnauth = await fetch(`${BASE_BACKEND}/admin/dashboard-stats`);
  assert(apiUnauth.status === 401, `Backend rejects unauthenticated admin stats call (Status: ${apiUnauth.status} Unauthorized)`);

  // Authenticate Worker and test admin API
  const workerLoginRes = await fetch(`${BASE_BACKEND}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'worker1@earnxpress.demo', password: 'Password123!' }),
  });
  const workerLogin = await workerLoginRes.json();
  const workerToken = workerLogin.data?.accessToken;

  const workerAdminApi = await fetch(`${BASE_BACKEND}/admin/users`, {
    headers: { Authorization: `Bearer ${workerToken}` },
  });
  assert(workerAdminApi.status === 403, `Backend blocks Worker from /admin/users (Status: ${workerAdminApi.status} Forbidden)`);

  // Authenticate Buyer and test admin API
  const buyerLoginRes = await fetch(`${BASE_BACKEND}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'buyer@earnxpress.demo', password: 'Password123!' }),
  });
  const buyerLogin = await buyerLoginRes.json();
  const buyerToken = buyerLogin.data?.accessToken;

  const buyerAdminApi = await fetch(`${BASE_BACKEND}/admin/users`, {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert(buyerAdminApi.status === 403, `Backend blocks Buyer from /admin/users (Status: ${buyerAdminApi.status} Forbidden)`);

  // Authenticate Admin and test admin API
  const adminLoginRes = await fetch(`${BASE_BACKEND}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@earnxpress.demo', password: 'Password123!' }),
  });
  const adminLogin = await adminLoginRes.json();
  const adminToken = adminLogin.data?.accessToken;

  const adminUsersApi = await fetch(`${BASE_BACKEND}/admin/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminUsers = await adminUsersApi.json();
  assert(
    adminUsersApi.status === 200 && adminUsers.data?.users?.length > 0,
    `Admin can query real platform users (Status: ${adminUsersApi.status} OK, Count: ${adminUsers.data?.users?.length})`
  );

  const adminStatsApi = await fetch(`${BASE_BACKEND}/admin/dashboard-stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminStats = await adminStatsApi.json();
  assert(
    adminStatsApi.status === 200 && adminStats.data?.totalUsers > 0,
    `Admin can access governance metrics (Total Users: ${adminStats.data?.totalUsers}, Open Tasks: ${adminStats.data?.openTasks})`
  );

  // 5. REGISTRATION SECURITY & ESCALATION PREVENTION
  console.log('\n5. Auditing Registration & Escalation Prevention...');
  // Attempt to register directly as PLATFORM_OWNER
  const escalateAttempt = await fetch(`${BASE_BACKEND}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `fake_admin_${Date.now()}@hack.demo`,
      password: 'HackerPassword123!',
      displayName: 'Self Escalated Admin',
      countryCode: 'US',
      primaryRole: 'PLATFORM_OWNER',
    }),
  });
  assert(
    escalateAttempt.status === 400,
    `Backend rejects public Admin self-escalation attempt during registration (Status: ${escalateAttempt.status} Bad Request)`
  );

  // Valid Worker registration
  const workerRegEmail = `test_worker_${Date.now()}@earnxpress.demo`;
  const workerReg = await fetch(`${BASE_BACKEND}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: workerRegEmail,
      password: 'Password123!',
      displayName: 'Test Registered Worker',
      countryCode: 'BD',
      primaryRole: 'WORKER',
    }),
  });
  const workerRegData = await workerReg.json();
  assert(
    workerReg.status === 201 && workerRegData.data?.user?.primaryRole === 'WORKER',
    `Real Worker registration succeeds and assigns WORKER role (User ID: ${workerRegData.data?.user?.id})`
  );

  // Valid Buyer registration
  const buyerRegEmail = `test_buyer_${Date.now()}@earnxpress.demo`;
  const buyerReg = await fetch(`${BASE_BACKEND}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: buyerRegEmail,
      password: 'Password123!',
      displayName: 'Test Registered Buyer',
      countryCode: 'US',
      primaryRole: 'BUYER',
    }),
  });
  const buyerRegData = await buyerReg.json();
  assert(
    buyerReg.status === 201 && buyerRegData.data?.user?.primaryRole === 'BUYER',
    `Real Buyer registration succeeds and assigns BUYER role (User ID: ${buyerRegData.data?.user?.id})`
  );

  console.log(`\n=== Audit Summary: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
