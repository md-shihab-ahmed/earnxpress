const http = require('http');

const routes = [
  { path: '/', expectedText: 'Open International Task Marketplace' },
  { path: '/tasks', expectedText: 'Open Task Marketplace' },
  { path: '/tasks/fc8e1a59-5cff-4e4d-9a12-ed4b6c90aa38', expectedText: 'Translate Technical Documentation' },
  { path: '/worker', expectedText: 'Worker Execution Dashboard' },
  { path: '/worker/tasks/fc8e1a59-5cff-4e4d-9a12-ed4b6c90aa38', expectedText: 'Execution Deadline' },
  { path: '/worker/wallet', expectedText: 'Demo Wallet' },
  { path: '/buyer', expectedText: 'Buyer Campaign Control Center' },
  { path: '/buyer/tasks/new', expectedText: 'Five-Step Task Creation Wizard' },
  { path: '/buyer/submissions', expectedText: 'Submissions Review Queue' },
  { path: '/buyer/wallet', expectedText: 'Demo Wallet' },
  { path: '/admin', expectedText: 'Staff Governance' },
  { path: '/login', expectedText: 'Sign In to Your Portal' },
  { path: '/register', expectedText: 'Create Your Account' },
  { path: '/forgot-password', expectedText: 'Reset Password' },
  { path: '/about', expectedText: 'About EarnXpress' },
  { path: '/help', expectedText: 'Help Center' },
  { path: '/terms', expectedText: 'Terms of Service' },
  { path: '/privacy', expectedText: 'Identity Governance' },
  { path: '/contact', expectedText: 'Support &amp; Relations' },
];

function checkRoute(route) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${route.path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const containsText = data.includes(route.expectedText);
        resolve({
          path: route.path,
          status: res.statusCode,
          ok: res.statusCode === 200 && containsText,
          containsText,
        });
      });
    });
    req.on('error', (err) => {
      resolve({ path: route.path, status: 'ERROR', ok: false, error: err.message });
    });
    req.setTimeout(5000, () => {
      req.abort();
      resolve({ path: route.path, status: 'TIMEOUT', ok: false });
    });
  });
}

async function verifyAll() {
  console.log('=== Checking All 19 Frontend Routes on http://localhost:3000 ===\n');
  let passed = 0;
  for (const r of routes) {
    const res = await checkRoute(r);
    if (res.ok) {
      console.log(`[PASS] ${r.path.padEnd(45)} Status: ${res.status}`);
      passed++;
    } else {
      console.error(`[FAIL] ${r.path.padEnd(45)} Status: ${res.status} (Contains expected text: ${res.containsText})`);
    }
  }

  // Also check backend swagger / api docs
  const backendCheck = await new Promise((resolve) => {
    const req = http.get('http://localhost:4000/api/docs', (res) => {
      resolve({ path: 'http://localhost:4000/api/docs (OpenAPI)', status: res.statusCode, ok: res.statusCode === 200 });
    });
    req.on('error', (err) => resolve({ path: 'http://localhost:4000/api/docs', status: 'ERROR', ok: false }));
  });
  if (backendCheck.ok) {
    console.log(`[PASS] ${backendCheck.path.padEnd(45)} Status: ${backendCheck.status}`);
    passed++;
  } else {
    console.error(`[FAIL] ${backendCheck.path.padEnd(45)} Status: ${backendCheck.status}`);
  }

  console.log(`\nResults: ${passed} of ${routes.length + 1} endpoints verified with HTTP 200 OK!`);
  if (passed === routes.length + 1) {
    console.log('All 20 routes verified 100% OK!');
  } else {
    process.exit(1);
  }
}

verifyAll();
