import { PrismaClient, UserRole, UserStatus, IdvStatus, TaskModel, TaskStatus, ParticipationStatus, DemoAccountType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('--- EarnXpress Database Seeding Started ---');

  // 1. Categories and Subcategories
  const categoriesData = [
    {
      name: 'Data Annotation & AI Training',
      slug: 'data-annotation',
      description: 'Bounding boxes, segmentation, audio transcriptions, and RLHF classification tasks.',
      subcategories: [
        { name: 'Computer Vision Bounding Boxes', slug: 'computer-vision' },
        { name: 'Audio & Speech Transcription', slug: 'speech-transcription' },
        { name: 'NLP & Text Classification', slug: 'nlp-classification' },
      ],
    },
    {
      name: 'Translation & Localization',
      slug: 'translation',
      description: 'Human translations, proofreading, subtitle localization, and bilingual reviews.',
      subcategories: [
        { name: 'English to Bengali Translation', slug: 'en-bn-translation' },
        { name: 'Bengali to English Translation', slug: 'bn-en-translation' },
        { name: 'Technical Docs Localization', slug: 'technical-localization' },
      ],
    },
    {
      name: 'Software & Code Bounties',
      slug: 'software-bounties',
      description: 'Bug fixes, algorithm optimizations, API integrations, and code reviews.',
      subcategories: [
        { name: 'Database Query Optimization', slug: 'database-optimization' },
        { name: 'Frontend Bug Fixes', slug: 'frontend-bug-fixes' },
        { name: 'API Security Audits', slug: 'security-audits' },
      ],
    },
    {
      name: 'UI/UX & Design Feedback',
      slug: 'design-feedback',
      description: 'App usability testing, design audits, heuristics evaluations, and mobile testing.',
      subcategories: [
        { name: 'Mobile App Usability Testing', slug: 'mobile-usability' },
        { name: 'Design Heuristics Review', slug: 'heuristics-review' },
      ],
    },
    {
      name: 'Content & Research',
      slug: 'content-research',
      description: 'Technical writing, data collection, market surveys, and product research.',
      subcategories: [
        { name: 'Developer Documentation', slug: 'developer-docs' },
        { name: 'Market Intelligence Reports', slug: 'market-reports' },
      ],
    },
  ];

  const createdCategories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        subcategories: {
          create: cat.subcategories.map((sub) => ({
            name: sub.name,
            slug: sub.slug,
          })),
        },
      },
      include: { subcategories: true },
    });
    createdCategories[cat.slug] = category;
  }
  console.log('✓ Categories & Subcategories seeded');

  // 2. System Demo Ledger Accounts
  const faucetAccount = await prisma.demoLedgerAccount.upsert({
    where: {
      userId_accountType_currency: {
        userId: '00000000-0000-0000-0000-000000000000',
        accountType: DemoAccountType.DEMO_SYSTEM_FAUCET_POOL,
        currency: 'USD',
      },
    },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      accountType: DemoAccountType.DEMO_SYSTEM_FAUCET_POOL,
      currency: 'USD',
      balanceCents: BigInt(1000000000), // $10,000,000.00
    },
  }).catch(async () => {
    return prisma.demoLedgerAccount.findFirst({
      where: { accountType: DemoAccountType.DEMO_SYSTEM_FAUCET_POOL },
    });
  });

  const revenueAccount = await prisma.demoLedgerAccount.upsert({
    where: {
      userId_accountType_currency: {
        userId: '00000000-0000-0000-0000-000000000000',
        accountType: DemoAccountType.DEMO_SYSTEM_REVENUE,
        currency: 'USD',
      },
    },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      accountType: DemoAccountType.DEMO_SYSTEM_REVENUE,
      currency: 'USD',
      balanceCents: BigInt(0),
    },
  }).catch(async () => {
    return prisma.demoLedgerAccount.findFirst({
      where: { accountType: DemoAccountType.DEMO_SYSTEM_REVENUE },
    });
  });
  console.log('✓ System Demo Ledger Accounts initialized');

  // 3. Demo Users
  const passwordHash = await hashPassword('Password123!');

  // Platform Owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@earnxpress.demo' },
    update: {},
    create: {
      email: 'owner@earnxpress.demo',
      passwordHash,
      primaryRole: UserRole.PLATFORM_OWNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          displayName: 'EarnXpress Platform Owner',
          headline: 'Platform Architect & Super Administrator',
          countryCode: 'BD',
          reputationScore: 5.0,
        },
      },
    },
  });

  // Super Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@earnxpress.demo' },
    update: {},
    create: {
      email: 'admin@earnxpress.demo',
      passwordHash,
      primaryRole: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Sarah Jenkins',
          headline: 'Operations & Compliance Lead',
          countryCode: 'US',
          reputationScore: 5.0,
        },
      },
    },
  });

  // Demo Buyer
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@earnxpress.demo' },
    update: {},
    create: {
      email: 'buyer@earnxpress.demo',
      passwordHash,
      primaryRole: UserRole.BUYER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Apex AI Labs',
          headline: 'Computer Vision & AI Research Team',
          countryCode: 'US',
          reputationScore: 4.95,
        },
      },
    },
  });

  // Demo Worker 1
  const worker1 = await prisma.user.upsert({
    where: { email: 'worker1@earnxpress.demo' },
    update: {},
    create: {
      email: 'worker1@earnxpress.demo',
      passwordHash,
      primaryRole: UserRole.WORKER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Rahim Ahmed',
          headline: 'Senior Data Annotator & Bengali Localization Specialist',
          countryCode: 'BD',
          reputationScore: 4.92,
          completionRate: 98.5,
          totalReviewsCount: 42,
        },
      },
    },
  });

  // Demo Worker 2
  const worker2 = await prisma.user.upsert({
    where: { email: 'worker2@earnxpress.demo' },
    update: {},
    create: {
      email: 'worker2@earnxpress.demo',
      passwordHash,
      primaryRole: UserRole.WORKER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Elena Rostova',
          headline: 'Full-Stack Developer & PostgreSQL Optimization Specialist',
          countryCode: 'EE',
          reputationScore: 4.88,
          completionRate: 96.0,
          totalReviewsCount: 29,
        },
      },
    },
  });
  console.log('✓ Demo Users created (Owner, Admin, Buyer, Worker1, Worker2)');

  // 4. Demo Ledger Accounts for Users
  await prisma.demoLedgerAccount.upsert({
    where: {
      userId_accountType_currency: {
        userId: buyer.id,
        accountType: DemoAccountType.DEMO_BUYER_AVAILABLE,
        currency: 'USD',
      },
    },
    update: { balanceCents: BigInt(500000) },
    create: {
      userId: buyer.id,
      accountType: DemoAccountType.DEMO_BUYER_AVAILABLE,
      currency: 'USD',
      balanceCents: BigInt(500000), // $5,000.00
    },
  });

  await prisma.demoLedgerAccount.upsert({
    where: {
      userId_accountType_currency: {
        userId: buyer.id,
        accountType: DemoAccountType.DEMO_BUYER_ESCROW_RESERVED,
        currency: 'USD',
      },
    },
    update: { balanceCents: BigInt(45000) },
    create: {
      userId: buyer.id,
      accountType: DemoAccountType.DEMO_BUYER_ESCROW_RESERVED,
      currency: 'USD',
      balanceCents: BigInt(45000), // $450.00
    },
  });

  await prisma.demoLedgerAccount.upsert({
    where: {
      userId_accountType_currency: {
        userId: worker1.id,
        accountType: DemoAccountType.DEMO_WORKER_AVAILABLE,
        currency: 'USD',
      },
    },
    update: { balanceCents: BigInt(25000) },
    create: {
      userId: worker1.id,
      accountType: DemoAccountType.DEMO_WORKER_AVAILABLE,
      currency: 'USD',
      balanceCents: BigInt(25000), // $250.00
    },
  });

  await prisma.demoLedgerAccount.upsert({
    where: {
      userId_accountType_currency: {
        userId: worker2.id,
        accountType: DemoAccountType.DEMO_WORKER_AVAILABLE,
        currency: 'USD',
      },
    },
    update: { balanceCents: BigInt(10000) },
    create: {
      userId: worker2.id,
      accountType: DemoAccountType.DEMO_WORKER_AVAILABLE,
      currency: 'USD',
      balanceCents: BigInt(10000), // $100.00
    },
  });
  console.log('✓ User Demo Ledger Accounts funded');

  // 5. Open Marketplace Tasks
  const dataCat = createdCategories['data-annotation'];
  const dataSub = dataCat.subcategories[0];

  const transCat = createdCategories['translation'];
  const transSub = transCat.subcategories[0];

  const codeCat = createdCategories['software-bounties'];
  const codeSub = codeCat.subcategories[0];

  const uiCat = createdCategories['design-feedback'];
  const uiSub = uiCat.subcategories[0];

  // Task 1: Multi-Worker Autonomous Driving
  const task1 = await prisma.task.create({
    data: {
      buyerId: buyer.id,
      categoryId: dataCat.id,
      subcategoryId: dataSub.id,
      taskModel: TaskModel.MULTI_WORKER,
      title: 'Annotate 500 Autonomous Driving Camera Frames',
      status: TaskStatus.OPEN,
      totalSlots: 10,
      availableSlots: 8,
      unitBudgetCents: BigInt(4500), // $45.00
      totalEscrowCents: BigInt(45000), // $450.00
      buyerFeeCents: BigInt(900), // 2%
      workerFeeCents: BigInt(180), // 4%
      maxRevisions: 2,
      startDeadlineHours: 6,
      completionDurationHours: 24,
      reviewSlaHours: 72,
      instructionVersions: {
        create: {
          versionNumber: 1,
          createdById: buyer.id,
          descriptionMarkdown: 'Please annotate 2D bounding boxes for pedestrians, cyclists, and vehicles across 500 highway camera sequence frames.',
          acceptanceCriteriaJson: [
            'All pedestrians and vehicles labeled with tight bounding boxes within ±2 pixels',
            'Occluded objects marked with the occlusion attribute flag',
            'Export completed annotations in standard COCO JSON format',
          ],
          deliverableRequirementsJson: [
            { field: 'coco_json_url', label: 'COCO JSON Export Link', required: true },
            { field: 'qa_summary', label: 'Self QA Summary Note', required: true },
          ],
        },
      },
      slots: {
        create: Array.from({ length: 10 }, (_, i) => ({
          slotNumber: i + 1,
          isClaimed: i < 2, // 2 claimed
        })),
      },
    },
    include: {
      instructionVersions: true,
      slots: true,
    },
  });

  // Participation for Worker 1 on Task 1
  const slot1 = task1.slots[0];
  const now = new Date();
  const startDl = new Date(now.getTime() + 6 * 3600 * 1000);
  const execDl = new Date(now.getTime() + 24 * 3600 * 1000);

  const part1 = await prisma.workerParticipation.create({
    data: {
      taskId: task1.id,
      slotId: slot1.id,
      workerId: worker1.id,
      instructionVersionId: task1.instructionVersions[0].id,
      status: ParticipationStatus.IN_PROGRESS,
      startDeadlineAt: startDl,
      executionDeadlineAt: execDl,
      progressPercentage: 66,
      milestones: {
        create: [
          {
            milestoneOrder: 1,
            title: 'Download frame dataset and setup labeling workspace',
            isCompleted: true,
            isVerified: true,
            completedAt: new Date(now.getTime() - 3600 * 1000),
          },
          {
            milestoneOrder: 2,
            title: 'Complete annotations for batch 1 to 250',
            isCompleted: true,
            isVerified: true,
            completedAt: new Date(now.getTime() - 1800 * 1000),
          },
          {
            milestoneOrder: 3,
            title: 'Complete annotations for batch 251 to 500 and run validation linter',
            isCompleted: false,
            isVerified: false,
          },
        ],
      },
    },
  });

  // Task 2: Translation with a pending submission
  const task2 = await prisma.task.create({
    data: {
      buyerId: buyer.id,
      categoryId: transCat.id,
      subcategoryId: transSub.id,
      taskModel: TaskModel.MULTI_WORKER,
      title: 'Translate Technical Documentation: English to Bengali',
      status: TaskStatus.OPEN,
      totalSlots: 5,
      availableSlots: 4,
      unitBudgetCents: BigInt(6000), // $60.00
      totalEscrowCents: BigInt(30000), // $300.00
      buyerFeeCents: BigInt(600),
      workerFeeCents: BigInt(240),
      maxRevisions: 2,
      startDeadlineHours: 8,
      completionDurationHours: 48,
      reviewSlaHours: 72,
      instructionVersions: {
        create: {
          versionNumber: 1,
          createdById: buyer.id,
          descriptionMarkdown: 'Translate 3,500 words of technical backend developer documentation from English into fluent, natural Bengali.',
          acceptanceCriteriaJson: [
            'Maintain technical terminology accuracy (e.g. API, Endpoint, Microservices)',
            'Natural grammatical flow without awkward literal machine translation',
            'Markdown formatting and code block snippets preserved unchanged',
          ],
          deliverableRequirementsJson: [
            { field: 'doc_url', label: 'Translated Google Docs / Markdown link', required: true },
            { field: 'translator_notes', label: 'Glossary notes for specific terms', required: false },
          ],
        },
      },
      slots: {
        create: Array.from({ length: 5 }, (_, i) => ({
          slotNumber: i + 1,
          isClaimed: i < 1,
        })),
      },
    },
    include: {
      instructionVersions: true,
      slots: true,
    },
  });

  // Worker 2 submitted work for Task 2 (Awaiting Buyer Review in queue!)
  const slot2 = task2.slots[0];
  const part2 = await prisma.workerParticipation.create({
    data: {
      taskId: task2.id,
      slotId: slot2.id,
      workerId: worker2.id,
      instructionVersionId: task2.instructionVersions[0].id,
      status: ParticipationStatus.SUBMITTED,
      startDeadlineAt: startDl,
      executionDeadlineAt: execDl,
      submittedAt: new Date(now.getTime() - 15 * 60 * 1000),
      reviewOverdueAt: new Date(now.getTime() + 72 * 3600 * 1000),
      progressPercentage: 100,
      milestones: {
        create: [
          {
            milestoneOrder: 1,
            title: 'Initial glossary alignment',
            isCompleted: true,
            isVerified: true,
            completedAt: new Date(now.getTime() - 2 * 3600 * 1000),
          },
          {
            milestoneOrder: 2,
            title: 'Full draft translation',
            isCompleted: true,
            isVerified: true,
            completedAt: new Date(now.getTime() - 3600 * 1000),
          },
          {
            milestoneOrder: 3,
            title: 'Proofreading and terminology verification',
            isCompleted: true,
            isVerified: true,
            completedAt: new Date(now.getTime() - 15 * 60 * 1000),
          },
        ],
      },
      submissions: {
        create: {
          currentVersion: 1,
          status: 'PENDING_REVIEW',
          versions: {
            create: {
              versionNumber: 1,
              textNotes: 'Completed full translation of 3,500 words with preserved Markdown anchors and terminology glossary.',
              deliverableUrlsJson: ['https://earnxpress.demo/deliverables/translation-en-bn-v1.pdf'],
              criteriaAttestationsJson: {
                terminology_accurate: true,
                grammar_verified: true,
                markdown_preserved: true,
              },
            },
          },
        },
      },
    },
  });

  // Task 3: FIRST_APPROVED model bounty
  const task3 = await prisma.task.create({
    data: {
      buyerId: buyer.id,
      categoryId: codeCat.id,
      subcategoryId: codeSub.id,
      taskModel: TaskModel.FIRST_APPROVED,
      title: 'Fastest Solution: Optimize PostgreSQL Slow Query Indexing',
      status: TaskStatus.OPEN,
      totalSlots: 5,
      availableSlots: 4,
      unitBudgetCents: BigInt(15000), // $150.00
      totalEscrowCents: BigInt(15000), // only 1 payout for first approved!
      buyerFeeCents: BigInt(300),
      workerFeeCents: BigInt(600),
      maxRevisions: 1,
      startDeadlineHours: 4,
      completionDurationHours: 12,
      reviewSlaHours: 24,
      instructionVersions: {
        create: {
          versionNumber: 1,
          createdById: buyer.id,
          descriptionMarkdown: 'Analyze provided EXPLAIN ANALYZE plan on a 15M row ledger table and provide index definitions reducing runtime below 10ms.',
          acceptanceCriteriaJson: [
            'Composite B-Tree or BRIN index definition provided with reasoning',
            'EXPLAIN ANALYZE demonstrates runtime reduction from 840ms to <10ms',
            'Zero table locking impact on write path during CREATE INDEX CONCURRENTLY',
          ],
          deliverableRequirementsJson: [
            { field: 'sql_script', label: 'Index DDL Script', required: true },
            { field: 'benchmark_log', label: 'Query execution benchmark log', required: true },
          ],
        },
      },
      slots: {
        create: Array.from({ length: 5 }, (_, i) => ({
          slotNumber: i + 1,
          isClaimed: i === 0,
        })),
      },
    },
    include: {
      instructionVersions: true,
      slots: true,
    },
  });

  // Task 4: UI/UX Audit
  await prisma.task.create({
    data: {
      buyerId: buyer.id,
      categoryId: uiCat.id,
      subcategoryId: uiSub.id,
      taskModel: TaskModel.MULTI_WORKER,
      title: 'Audit Mobile App Onboarding Flow UX',
      status: TaskStatus.OPEN,
      totalSlots: 8,
      availableSlots: 8,
      unitBudgetCents: BigInt(3500), // $35.00
      totalEscrowCents: BigInt(28000), // $280.00
      buyerFeeCents: BigInt(560),
      workerFeeCents: BigInt(140),
      maxRevisions: 2,
      startDeadlineHours: 6,
      completionDurationHours: 24,
      reviewSlaHours: 48,
      instructionVersions: {
        create: {
          versionNumber: 1,
          createdById: buyer.id,
          descriptionMarkdown: 'Perform a comprehensive heuristic evaluation of a fintech onboarding flow. Record friction points, dropout risks, and accessibility issues.',
          acceptanceCriteriaJson: [
            'Test on iOS 17+ or Android 14+ device',
            'Identify minimum 5 UX friction points with screenshot evidence',
            'Provide Nielsen Norman heuristic classification for each issue',
          ],
          deliverableRequirementsJson: [
            { field: 'figjam_url', label: 'Figma / FigJam audit link', required: true },
            { field: 'summary_pdf', label: 'Executive UX summary PDF', required: true },
          ],
        },
      },
      slots: {
        create: Array.from({ length: 8 }, (_, i) => ({
          slotNumber: i + 1,
          isClaimed: false,
        })),
      },
    },
  });

  console.log('✓ Initial Marketplace Tasks and Participations created');
  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
