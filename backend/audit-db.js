const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const [users, tasks, slots, participations, accounts, transactions] = await Promise.all([
    prisma.user.count(),
    prisma.task.count(),
    prisma.taskSlot.count(),
    prisma.workerParticipation.count(),
    prisma.demoLedgerAccount.count(),
    prisma.demoLedgerTransaction.count(),
  ]);

  console.log(JSON.stringify({
    users,
    tasks,
    slots,
    participations,
    accounts,
    transactions,
  }, null, 2));
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
