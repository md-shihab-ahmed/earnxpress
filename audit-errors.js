const fs = require('fs');
const readline = require('readline');

async function auditErrors() {
  const fileStream = fs.createReadStream('C:\\Users\\acer\\.gemini\\antigravity\\brain\\179bd2c9-f4b0-4f96-9148-870aa1fb6856\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const errorCategories = {};

  for await (const line of rl) {
    if (!line.includes('exited with code 1')) continue;
    try {
      const obj = JSON.parse(line);
      const content = typeof obj.content === 'string' ? obj.content : JSON.stringify(obj.content);
      
      // Categorize
      let cat = 'Other';
      if (content.includes('Wsl/E_ACCESSDENIED') || content.includes('Access is denied')) cat = 'Sandbox WSL/Network Isolation (Requires BypassSandbox: true)';
      else if (content.includes('EPERM: operation not permitted, mkdir')) cat = 'Windows Sandboxed Webpack EPERM mkdir lock';
      else if (content.includes('cannot be loaded because running scripts is disabled')) cat = 'PowerShell Execution Policy for npx/npm';
      else if (content.includes('failed to connect to the docker API')) cat = 'Docker Desktop Daemon Offline (Resolved by WSL native Postgres)';
      else if (content.includes('No space left on device')) cat = 'WSL Rootfs 125MB full (Resolved by moving PGDATA to D: drive)';
      else if (content.includes('could not create lock file "/run/postgresql')) cat = 'PostgreSQL socket missing /run directory (Resolved by /tmp socket)';
      else if (content.includes('denied access on the database earnxpress_db')) cat = 'PostgreSQL role permissions (Resolved by init-db.sql superuser)';
      else if (content.includes('connect EACCES')) cat = 'Sandboxed TCP Loopback Connection blocked (Resolved by BypassSandbox: true)';
      else if (content.includes('PENDING_TASK_ID') || content.includes('Inconsistent column data: Error creating UUID')) cat = 'Task UUID bug in tasks.service.ts (Resolved by crypto.randomUUID)';
      else if (content.includes('reputationScore.toFixed is not a function')) cat = 'Prisma Decimal .toFixed() bug in TaskCard (Resolved by Number())';
      else if (content.includes('Type error: Property \'message\' does not exist')) cat = 'TypeScript typing on api.createBuyerTask (Resolved)';
      else if (content.includes('syntax error: unexpected') || content.includes('Missing terminator') || content.includes('PositionalParameterNotFound') || content.includes('ParserError')) cat = 'PowerShell / sh quote escaping syntax (Resolved)';
      else if (content.includes('Contains expected text: false')) cat = 'Route test script HTML entity check & vs &amp; (Resolved)';
      else if (content.includes('ERR_VALIDATION_FAILED')) cat = 'Test script payload DTO mismatch (Resolved in test script)';

      if (!errorCategories[cat]) errorCategories[cat] = { count: 0, sample: content.slice(0, 150) };
      errorCategories[cat].count++;
    } catch (e) {}
  }

  console.log(JSON.stringify(errorCategories, null, 2));
}

auditErrors();
