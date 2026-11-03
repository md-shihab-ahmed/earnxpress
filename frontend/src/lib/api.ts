import {
  Task,
  ParticipationStats,
  WorkerParticipation,
  DemoLedgerAccount,
  DemoLedgerTransaction,
  User,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export const ENABLE_DEMO_SHORTCUTS = process.env.NEXT_PUBLIC_ENABLE_DEMO_SHORTCUTS === 'true';
export const ENABLE_DEMO_FAUCET = process.env.NEXT_PUBLIC_ENABLE_DEMO_FAUCET === 'true';

// In-memory demo state for seamless client interactions when offline
export const demoDb = {
  tasks: [
    {
      id: 'task-101',
      title: 'Annotate 2,000 E-Commerce Product Titles in English',
      taskModel: 'MULTI_WORKER' as const,
      status: 'OPEN' as const,
      totalSlots: 50,
      availableSlots: 28,
      unitBudgetCents: '2500',
      formattedUnitUSD: 'DEMO $25.00 USD',
      startDeadlineHours: 6,
      completionDurationHours: 24,
      reviewSlaHours: 72,
      maxRevisions: 2,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      category: { id: 'c1', name: 'Data Annotation', slug: 'data-annotation' },
      subcategory: { id: 'sc1', name: 'E-Commerce Tagging', slug: 'ecommerce-tagging' },
      buyer: {
        id: 'buyer-alex',
        profile: {
          id: 'p-alex',
          displayName: 'Global Retail AI Lab',
          headline: 'Enterprise Machine Learning Data Team',
          countryCode: 'US',
          reputationScore: 4.95,
          completionRate: 99.2,
          totalReviewsCount: 142,
        },
      },
      participationStats: {
        totalCapacity: 50,
        remainingAvailableSlots: 28,
        acceptedTotal: 22,
        currentlyWorking: 14,
        submittedForReview: 5,
        reviewOverdue: 0,
        approvedSettled: 3,
        rejectedTerminated: 0,
      },
      instructions: {
        versionNumber: 1,
        descriptionMarkdown: `### Objective
Tag and verify category, brand name, and attributes for 2,000 apparel product titles.

### Instructions:
1. Open the provided annotation template sheet.
2. Mark product categories according to standard taxonomy.
3. Validate that spelling is standard English and no emojis are included in tags.`,
        acceptanceCriteria: [
          { key: 'taxonomy', description: 'At least 98% tag agreement with standard retail taxonomy' },
          { key: 'completeness', description: 'All 2,000 entries tagged with non-empty attributes' },
          { key: 'formatting', description: 'Delivered in clean JSON or CSV format without corruption' },
        ],
        deliverableRequirements: [
          { type: 'URL', label: 'Cloud storage link or GitHub gist with completed dataset' },
          { type: 'TEXT', label: 'Summary notes and error edge-case log' },
        ],
        milestones: [
          { order: 1, title: 'Sample 100 entries batch verified', description: 'Initial calibration review' },
          { order: 2, title: '1,000 titles annotated (50% progress)', description: 'Midpoint milestone' },
          { order: 3, title: 'Complete 2,000 dataset validated', description: 'Final QA validation' },
        ],
      },
    },
    {
      id: 'task-102',
      title: 'Translate 50 Technical Documentation Articles (English to Bangla)',
      taskModel: 'MULTI_WORKER' as const,
      status: 'OPEN' as const,
      totalSlots: 20,
      availableSlots: 6,
      unitBudgetCents: '4500',
      formattedUnitUSD: 'DEMO $45.00 USD',
      startDeadlineHours: 8,
      completionDurationHours: 48,
      reviewSlaHours: 72,
      maxRevisions: 2,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      category: { id: 'c2', name: 'Translation & Localization', slug: 'translation' },
      subcategory: { id: 'sc2', name: 'Technical Docs', slug: 'technical-docs' },
      buyer: {
        id: 'buyer-techcorp',
        profile: {
          id: 'p-techcorp',
          displayName: 'OpenSource Cloud Docs',
          headline: 'Developer Platform Documentation Team',
          countryCode: 'GB',
          reputationScore: 5.0,
          completionRate: 100.0,
          totalReviewsCount: 88,
        },
      },
      participationStats: {
        totalCapacity: 20,
        remainingAvailableSlots: 6,
        acceptedTotal: 14,
        currentlyWorking: 8,
        submittedForReview: 4,
        reviewOverdue: 0,
        approvedSettled: 2,
        rejectedTerminated: 0,
      },
      instructions: {
        versionNumber: 1,
        descriptionMarkdown: `### Objective
Translate 50 developer documentation markdown guides from English into fluent, professional Bangla without transliteration errors.

Keep code snippets, variable names, and terminal commands in English.`,
        acceptanceCriteria: [
          { key: 'accuracy', description: 'Natural terminology and zero automated machine mistranslations' },
          { key: 'code_integrity', description: 'Code blocks and bash scripts must remain unmodified English' },
        ],
        deliverableRequirements: [
          { type: 'URL', label: 'Pull request link or markdown archive' },
          { type: 'TEXT', label: 'Glossary terms list used' },
        ],
        milestones: [
          { order: 1, title: 'First 10 articles translated', description: 'Terminology baseline check' },
          { order: 2, title: '30 articles completed', description: 'Midway progress checkpoint' },
          { order: 3, title: 'All 50 articles proofread', description: 'Complete translation package' },
        ],
      },
    },
    {
      id: 'task-103',
      title: 'Python Web Scraping Bounty: Extract Clean Product Specifications',
      taskModel: 'FIRST_APPROVED' as const,
      status: 'OPEN' as const,
      totalSlots: 10,
      availableSlots: 4,
      unitBudgetCents: '8000',
      formattedUnitUSD: 'DEMO $80.00 USD',
      startDeadlineHours: 4,
      completionDurationHours: 12,
      reviewSlaHours: 48,
      maxRevisions: 1,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      category: { id: 'c3', name: 'Software & Scripts', slug: 'software' },
      subcategory: { id: 'sc3', name: 'Web Scraping', slug: 'web-scraping' },
      buyer: {
        id: 'buyer-nexus',
        profile: {
          id: 'p-nexus',
          displayName: 'Nexus Data Intelligence',
          headline: 'Market Analytics Agency',
          countryCode: 'SG',
          reputationScore: 4.88,
          completionRate: 98.0,
          totalReviewsCount: 65,
        },
      },
      participationStats: {
        totalCapacity: 10,
        remainingAvailableSlots: 4,
        acceptedTotal: 6,
        currentlyWorking: 5,
        submittedForReview: 1,
        reviewOverdue: 0,
        approvedSettled: 0,
        rejectedTerminated: 0,
      },
      instructions: {
        versionNumber: 1,
        descriptionMarkdown: `### Competitive First-Approved Bounty
Build a robust Python script using Playwright or BeautifulSoup to parse electronic item specs.
The first worker whose script parses all 50 target URLs with zero parsing exceptions wins the full $80.00 DEMO bounty!`,
        acceptanceCriteria: [
          { key: 'schema', description: 'Outputs structured JSON adhering to the target schema' },
          { key: 'error_handling', description: 'Includes exponential retry and rate-limit backoff' },
        ],
        deliverableRequirements: [
          { type: 'URL', label: 'GitHub repository or Gist link' },
          { type: 'TEXT', label: 'Sample JSON output of 5 scraped items' },
        ],
      },
    },
    {
      id: 'task-104',
      title: 'UI/UX Mobile App Screen Review & Usability Heuristics Audit',
      taskModel: 'MULTI_WORKER' as const,
      status: 'OPEN' as const,
      totalSlots: 15,
      availableSlots: 9,
      unitBudgetCents: '3500',
      formattedUnitUSD: 'DEMO $35.00 USD',
      startDeadlineHours: 6,
      completionDurationHours: 24,
      reviewSlaHours: 72,
      maxRevisions: 2,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      category: { id: 'c4', name: 'Design & Creative', slug: 'design' },
      subcategory: { id: 'sc4', name: 'UI/UX Audit', slug: 'ui-ux-audit' },
      buyer: {
        id: 'buyer-fintech',
        profile: {
          id: 'p-fintech',
          displayName: 'Nova Fintech Studio',
          headline: 'Digital Banking Experience Designers',
          countryCode: 'DE',
          reputationScore: 4.98,
          completionRate: 100.0,
          totalReviewsCount: 92,
        },
      },
      participationStats: {
        totalCapacity: 15,
        remainingAvailableSlots: 9,
        acceptedTotal: 6,
        currentlyWorking: 4,
        submittedForReview: 1,
        reviewOverdue: 0,
        approvedSettled: 1,
        rejectedTerminated: 0,
      },
      instructions: {
        versionNumber: 1,
        descriptionMarkdown: `### Usability Review
Inspect our onboarding flows and note usability bottlenecks based on Nielsen's 10 Heuristics.`,
        acceptanceCriteria: [
          { key: 'heuristics', description: 'Cites at least 5 heuristics with actionable redesign suggestions' },
          { key: 'screenshots', description: 'Includes annotated Figma or image screenshots' },
        ],
        deliverableRequirements: [
          { type: 'URL', label: 'Figma review link or Google Slides link' },
          { type: 'TEXT', label: 'Executive summary bullet points' },
        ],
      },
    },
  ] as Task[],

  participations: [
    {
      id: 'part-201',
      taskId: 'task-101',
      slotNumber: 7,
      workerId: 'worker-user-1',
      status: 'IN_PROGRESS' as const,
      startDeadlineAt: new Date(Date.now() + 4 * 3600000).toISOString(),
      executionDeadlineAt: new Date(Date.now() + 20 * 3600000).toISOString(),
      revisionsUsed: 0,
      progressPercentage: 66,
      milestones: [
        {
          id: 'm1',
          participationId: 'part-201',
          milestoneOrder: 1,
          title: 'Sample 100 entries batch verified',
          isCompleted: true,
          isVerified: true,
          completedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        },
        {
          id: 'm2',
          participationId: 'part-201',
          milestoneOrder: 2,
          title: '1,000 titles annotated (50% progress)',
          isCompleted: true,
          isVerified: true,
          completedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 'm3',
          participationId: 'part-201',
          milestoneOrder: 3,
          title: 'Complete 2,000 dataset validated',
          isCompleted: false,
          isVerified: false,
        },
      ],
      task: {
        id: 'task-101',
        title: 'Annotate 2,000 E-Commerce Product Titles in English',
        taskModel: 'MULTI_WORKER' as const,
        status: 'OPEN' as const,
        totalSlots: 50,
        availableSlots: 28,
        unitBudgetCents: '2500',
        formattedUnitUSD: 'DEMO $25.00 USD',
        startDeadlineHours: 6,
        completionDurationHours: 24,
        reviewSlaHours: 72,
        maxRevisions: 2,
        createdAt: new Date().toISOString(),
      },
    },
    {
      id: 'part-202',
      taskId: 'task-102',
      slotNumber: 3,
      workerId: 'worker-user-1',
      status: 'SUBMITTED' as const,
      startDeadlineAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      executionDeadlineAt: new Date(Date.now() + 3600000 * 14).toISOString(),
      submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      reviewOverdueAt: new Date(Date.now() + 3600000 * 68).toISOString(),
      revisionsUsed: 0,
      progressPercentage: 100,
      milestones: [
        {
          id: 'm10',
          participationId: 'part-202',
          milestoneOrder: 1,
          title: 'First 10 articles translated',
          isCompleted: true,
          isVerified: true,
        },
        {
          id: 'm11',
          participationId: 'part-202',
          milestoneOrder: 2,
          title: '30 articles completed',
          isCompleted: true,
          isVerified: true,
        },
        {
          id: 'm12',
          participationId: 'part-202',
          milestoneOrder: 3,
          title: 'All 50 articles proofread',
          isCompleted: true,
          isVerified: true,
        },
      ],
      submissionVersions: [
        {
          id: 'subv-1',
          versionNumber: 1,
          textNotes: 'Completed full Bangla translation of the 50 articles with preserved bash code snippets.',
          deliverableUrls: ['https://storage.earnxpress.demo/deliverables/bangla-docs-v1.zip'],
          submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
      ],
      task: {
        id: 'task-102',
        title: 'Translate 50 Technical Documentation Articles (English to Bangla)',
        taskModel: 'MULTI_WORKER' as const,
        status: 'OPEN' as const,
        totalSlots: 20,
        availableSlots: 6,
        unitBudgetCents: '4500',
        formattedUnitUSD: 'DEMO $45.00 USD',
        startDeadlineHours: 8,
        completionDurationHours: 48,
        reviewSlaHours: 72,
        maxRevisions: 2,
        createdAt: new Date().toISOString(),
      },
    },
  ] as WorkerParticipation[],

  wallet: {
    availableCents: 18500, // DEMO $185.00
    escrowCents: 4500,     // DEMO $45.00
    transactions: [
      {
        id: 'tx-1',
        referenceType: 'DEMO_FAUCET_CLAIM',
        referenceId: 'faucet-init',
        description: 'DEMO faucet credit (welcome testing balance)',
        amountCents: '100000',
        formattedAmountUSD: 'DEMO +$1,000.00 USD',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'tx-2',
        referenceType: 'DEMO_TASK_ESCROW_LOCK',
        referenceId: 'task-101',
        description: 'DEMO escrow locked for Task: Annotate 2,000 E-Commerce Titles',
        amountCents: '127500',
        formattedAmountUSD: 'DEMO -$1,275.00 USD',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'tx-3',
        referenceType: 'DEMO_TASK_SLOT_PAYOUT',
        referenceId: 'part-prev',
        description: 'DEMO payout received: Data cleaning completed slot',
        amountCents: '2400',
        formattedAmountUSD: 'DEMO +$24.00 USD',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ] as DemoLedgerTransaction[],
  },

  auditLogs: [
    {
      id: 'audit-1',
      actorRole: 'PLATFORM_OWNER',
      action: 'PLATFORM_BOOTSTRAP',
      resourceType: 'System',
      resourceId: 'root-sys',
      ipAddress: '127.0.0.1',
      reason: 'Initialized EarnXpress Phase 1 backend modular monolith',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'audit-2',
      actorRole: 'BUYER',
      action: 'TASK_PUBLISHED',
      resourceType: 'Task',
      resourceId: 'task-101',
      ipAddress: '192.168.1.10',
      reason: 'Published campaign with 50 slots and locked demo escrow',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'audit-3',
      actorRole: 'WORKER',
      action: 'TASK_SLOT_ACCEPTED',
      resourceType: 'WorkerParticipation',
      resourceId: 'part-201',
      ipAddress: '192.168.1.45',
      reason: 'Worker claimed slot on open marketplace with row-level lock',
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: 'audit-4',
      actorRole: 'WORKER',
      action: 'WORK_SUBMITTED',
      resourceType: 'WorkerParticipation',
      resourceId: 'part-202',
      ipAddress: '192.168.1.45',
      reason: 'Worker submitted deliverables for review',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ],
};

// Helper to get auth headers with JWT from localStorage
function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('earnxpress_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

// Centralized Typed API Client
export const api = {
  // Public Market Stats
  async getPublicStats(): Promise<{
    activeTasksCount: number;
    verifiedWorkersCount: number;
    totalSlotsCount: number;
    availableSlotsCount: number;
    totalParticipationsCount: number;
    settlementRatePercent: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/public/platform-stats`);
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // ignore
    }
    return {
      activeTasksCount: 0,
      verifiedWorkersCount: 0,
      totalSlotsCount: 0,
      availableSlotsCount: 0,
      totalParticipationsCount: 0,
      settlementRatePercent: '100.0',
    };
  },

  // Tasks
  async getTasks(params?: { search?: string; categoryId?: string; taskModel?: string }): Promise<{ data: Task[]; meta: { totalCount: number } }> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.categoryId) query.append('categoryId', params.categoryId);
      if (params?.taskModel) query.append('taskModel', params.taskModel);

      const res = await fetch(`${API_BASE_URL}/tasks?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const taskArray = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : null;
        if (taskArray && taskArray.length > 0) {
          return { data: taskArray, meta: json.meta || { totalCount: taskArray.length } };
        }
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      let results = [...demoDb.tasks];
      if (params?.search) {
        const s = params.search.toLowerCase();
        results = results.filter((t) => t.title.toLowerCase().includes(s));
      }
      if (params?.taskModel) {
        results = results.filter((t) => t.taskModel === params.taskModel);
      }
      return { data: results, meta: { totalCount: results.length } };
    }

    return { data: [], meta: { totalCount: 0 } };
  },

  async getTaskById(id: string): Promise<Task | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`);
      if (res.ok) {
        const json = await res.json();
        const task = json.data || json;
        if (task && task.id) {
          return task as Task;
        }
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      const found = demoDb.tasks.find((t) => t.id === id);
      if (found) return found;
      return demoDb.tasks[0] || null;
    }

    return null;
  },

  async acceptSlot(taskId: string): Promise<{ success: boolean; participation?: any; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/accept-slot`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, ...(json.data || json) };
      } else {
        const errJson = await res.json().catch(() => null);
        return { success: false, message: errJson?.message || 'Failed to claim task slot' };
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      const task = demoDb.tasks.find((t) => t.id === taskId);
      if (task && task.availableSlots > 0) {
        task.availableSlots -= 1;
        if (task.participationStats) {
          task.participationStats.remainingAvailableSlots -= 1;
          task.participationStats.acceptedTotal += 1;
          task.participationStats.currentlyWorking += 1;
        }

        const newParticipation: WorkerParticipation = {
          id: `part-${Date.now()}`,
          taskId: task.id,
          slotNumber: task.totalSlots - task.availableSlots,
          workerId: 'worker-user-1',
          status: 'IN_PROGRESS',
          startDeadlineAt: new Date(Date.now() + task.startDeadlineHours * 3600000).toISOString(),
          executionDeadlineAt: new Date(Date.now() + task.completionDurationHours * 3600000).toISOString(),
          revisionsUsed: 0,
          progressPercentage: 0,
          task,
          milestones: task.instructions?.milestones?.map((m) => ({
            id: `m-${Date.now()}-${m.order}`,
            participationId: `part-${Date.now()}`,
            milestoneOrder: m.order,
            title: m.title,
            isCompleted: false,
            isVerified: false,
          })) || [],
        };

        demoDb.participations.unshift(newParticipation);
        return { success: true, participation: newParticipation };
      }
      return { success: false, message: 'All slots claimed' };
    }

    return { success: false, message: 'Server communication error claiming slot' };
  },

  // Worker Endpoints
  async getWorkerParticipations(): Promise<WorkerParticipation[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/participations/my`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        if (list.length > 0) return list;
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      return [...demoDb.participations];
    }

    return [];
  },

  async getParticipationById(id: string): Promise<WorkerParticipation | undefined> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/participations/${id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const part = json.data || json;
        if (part && part.id) return part;
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      return demoDb.participations.find((p) => p.id === id) || demoDb.participations[0];
    }

    return undefined;
  },

  async updateMilestone(participationId: string, milestoneId: string, isCompleted: boolean) {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/participations/${participationId}/milestones/${milestoneId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isCompleted }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      const part = demoDb.participations.find((p) => p.id === participationId);
      if (part && part.milestones) {
        const m = part.milestones.find((x) => x.id === milestoneId);
        if (m) {
          m.isCompleted = isCompleted;
          m.isVerified = isCompleted;
        }
        const completed = part.milestones.filter((x) => x.isCompleted).length;
        part.progressPercentage = Math.round((completed / part.milestones.length) * 100);
        return { success: true, progressPercentage: part.progressPercentage };
      }
      return { success: true, progressPercentage: 100 };
    }

    return { success: false, message: 'Server error updating milestone' };
  },

  async submitWork(participationId: string, content: string, deliverableUrls?: string[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/participations/${participationId}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: content || 'Deliverable submission', deliverableUrls: deliverableUrls || [] }),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, ...(json.data || json) };
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      const part = demoDb.participations.find((p) => p.id === participationId);
      if (part) {
        part.status = 'SUBMITTED';
        part.progressPercentage = 100;
        part.submittedAt = new Date().toISOString();
        part.reviewOverdueAt = new Date(Date.now() + 72 * 3600000).toISOString();
        if (!part.submissionVersions) part.submissionVersions = [];
        part.submissionVersions.push({
          id: `subv-${Date.now()}`,
          versionNumber: part.submissionVersions.length + 1,
          textNotes: content,
          deliverableUrls,
          submittedAt: new Date().toISOString(),
        });
        return { success: true, status: 'SUBMITTED', submissionVersion: part.submissionVersions.length };
      }
      return { success: true, status: 'SUBMITTED' };
    }

    return { success: false, message: 'Server error submitting deliverables' };
  },

  // Buyer Endpoints
  async createBuyerTask(data: any): Promise<{ success: boolean; task?: any; message?: string }> {
    try {
      const payload = {
        categoryId: data.categoryId || 'd2fdddae-e0ce-49c6-a04f-98b3cbf04928',
        subcategoryId: data.subcategoryId || 'a7c8c961-93cb-472a-9322-b64932680076',
        taskModel: data.taskModel || 'MULTI_WORKER',
        title: data.title,
        descriptionMarkdown: data.descriptionMarkdown || data.description || 'Task instructions and details',
        totalSlots: Number(data.totalSlots) || 1,
        unitBudgetCents: Number(data.unitBudgetCents) || 2500,
        maxRevisions: Number(data.maxRevisions) || 2,
        startDeadlineHours: Number(data.startDeadlineHours) || 6,
        completionDurationHours: Number(data.completionDurationHours) || 24,
        acceptanceCriteria: (data.acceptanceCriteria && data.acceptanceCriteria.length >= 2
          ? data.acceptanceCriteria
          : [
              { key: 'criterion_1', description: 'Deliverable complies with all technical guidelines' },
              { key: 'criterion_2', description: 'Zero defects or missing assets upon review' },
            ]
        ).map((c: any, i: number) =>
          typeof c === 'string' ? { key: `c_${i + 1}`, description: c } : { key: c.key || `c_${i + 1}`, description: c.description || 'Requirement' }
        ),
        deliverableRequirements: (data.deliverableRequirements && data.deliverableRequirements.length > 0
          ? data.deliverableRequirements
          : [{ type: 'URL', label: 'Cloud repository URL or deliverables file' }]
        ).map((d: any) =>
          typeof d === 'string' ? { type: 'URL', label: d } : { type: d.type || 'URL', label: d.label || 'Deliverable' }
        ),
      };

      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, task: json.data || json };
      } else {
        const errJson = await res.json().catch(() => null);
        return { success: false, message: errJson?.message || 'Failed to create task on server' };
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: data.title,
        taskModel: data.taskModel || 'MULTI_WORKER',
        status: 'OPEN',
        totalSlots: Number(data.totalSlots) || 10,
        availableSlots: Number(data.totalSlots) || 10,
        unitBudgetCents: String(data.unitBudgetCents),
        formattedUnitUSD: `DEMO $${(Number(data.unitBudgetCents) / 100).toFixed(2)} USD`,
        startDeadlineHours: Number(data.startDeadlineHours) || 6,
        completionDurationHours: Number(data.completionDurationHours) || 24,
        reviewSlaHours: 72,
        maxRevisions: Number(data.maxRevisions) || 2,
        createdAt: new Date().toISOString(),
        category: { id: 'c1', name: 'General Tasks', slug: 'general' },
        participationStats: {
          totalCapacity: Number(data.totalSlots) || 10,
          remainingAvailableSlots: Number(data.totalSlots) || 10,
          acceptedTotal: 0,
          currentlyWorking: 0,
          submittedForReview: 0,
          reviewOverdue: 0,
          approvedSettled: 0,
          rejectedTerminated: 0,
        },
        instructions: {
          versionNumber: 1,
          descriptionMarkdown: data.descriptionMarkdown,
          acceptanceCriteria: data.acceptanceCriteria || [],
          deliverableRequirements: data.deliverableRequirements || [],
        },
      };

      demoDb.tasks.unshift(newTask);
      return { success: true, task: newTask };
    }

    return { success: false, message: 'Failed to create task on server' };
  },

  async reviewParticipation(participationId: string, decision: 'APPROVE' | 'REQUEST_REVISION' | 'REJECT', feedback: string, rating?: number) {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/participations/${participationId}/review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ decision, feedback: feedback || `Evaluation decision: ${decision}`, rating: rating || 5 }),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, ...(json.data || json) };
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      const part = demoDb.participations.find((p) => p.id === participationId);
      if (part) {
        if (decision === 'APPROVE') {
          part.status = 'APPROVED';
          part.approvedAt = new Date().toISOString();
          demoDb.wallet.availableCents += 2400; // Worker earned
        } else if (decision === 'REQUEST_REVISION') {
          part.status = 'REVISION_REQUESTED';
          part.revisionsUsed += 1;
          part.feedback = feedback;
        } else {
          part.status = 'REJECTED';
          part.rejectionReason = feedback;
        }
        return { success: true, status: part.status };
      }
      return { success: true, status: decision };
    }

    return { success: false, message: 'Failed to record submission evaluation' };
  },

  // Wallet
  async getWallet() {
    try {
      const [wRes, txRes] = await Promise.all([
        fetch(`${API_BASE_URL}/demo-finance/wallets`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/demo-finance/transactions`, { headers: getAuthHeaders() }),
      ]);
      if (wRes.ok) {
        const wJson = await wRes.json();
        const txJson = txRes.ok ? await txRes.json() : null;
        const accounts = wJson.data?.accounts || [];
        const avail = accounts.find((a: any) => a.accountType.includes('AVAILABLE'));
        const escrow = accounts.find((a: any) => a.accountType.includes('ESCROW'));
        const availCents = avail ? Number(avail.balanceCents) : 0;
        const escrowCents = escrow ? Number(escrow.balanceCents) : 0;
        const rawTxs = txJson?.data?.transactions || [];
        const transactions: DemoLedgerTransaction[] = rawTxs.map((t: any) => ({
          id: t.id,
          referenceType: t.referenceType,
          referenceId: t.referenceId,
          description: t.description,
          amountCents: String(t.amountCents),
          formattedAmountUSD: `DEMO $${(Number(t.amountCents) / 100).toFixed(2)} USD`,
          createdAt: t.createdAt,
        }));

        return {
          availableBalanceCents: availCents,
          formattedAvailableUSD: `DEMO $${(availCents / 100).toFixed(2)} USD`,
          escrowBalanceCents: escrowCents,
          formattedEscrowUSD: `DEMO $${(escrowCents / 100).toFixed(2)} USD`,
          transactions,
        };
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      return {
        availableBalanceCents: demoDb.wallet.availableCents,
        formattedAvailableUSD: `DEMO $${(demoDb.wallet.availableCents / 100).toFixed(2)} USD`,
        escrowBalanceCents: demoDb.wallet.escrowCents,
        formattedEscrowUSD: `DEMO $${(demoDb.wallet.escrowCents / 100).toFixed(2)} USD`,
        transactions: demoDb.wallet.transactions,
      };
    }

    return {
      availableBalanceCents: 0,
      formattedAvailableUSD: 'DEMO $0.00 USD',
      escrowBalanceCents: 0,
      formattedEscrowUSD: 'DEMO $0.00 USD',
      transactions: [],
    };
  },

  async claimFaucet() {
    if (!ENABLE_DEMO_FAUCET) {
      return {
        success: false,
        message: 'Demo faucet is completely disabled in production mode.',
      };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/demo-finance/faucet`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amountCents: 100000 }),
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        return {
          success: true,
          creditedUSD: data.formattedCreditedUSD || 'DEMO $1,000.00 USD',
          newBalanceUSD: data.formattedCurrentBalanceUSD || 'DEMO $1,000.00 USD',
        };
      } else {
        const errJson = await res.json().catch(() => null);
        return {
          success: false,
          message: errJson?.message || 'Demo faucet claim rejected.',
        };
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      demoDb.wallet.availableCents += 100000;
      const newTx: DemoLedgerTransaction = {
        id: `tx-${Date.now()}`,
        referenceType: 'DEMO_FAUCET_CLAIM',
        referenceId: 'faucet',
        description: 'DEMO Faucet grant claimed',
        amountCents: '100000',
        formattedAmountUSD: 'DEMO +$1,000.00 USD',
        createdAt: new Date().toISOString(),
      };
      demoDb.wallet.transactions.unshift(newTx);
      return {
        success: true,
        creditedUSD: 'DEMO $1,000.00 USD',
        newBalanceUSD: `DEMO $${(demoDb.wallet.availableCents / 100).toFixed(2)} USD`,
      };
    }

    return {
      success: false,
      message: 'Demo faucet is unavailable.',
    };
  },

  // Admin
  async getAdminStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const d = json.data || json;
        return {
          totalUsers: d.totalUsers ?? 0,
          activeTasks: d.activeTasks ?? 0,
          totalSlotsFunded: d.totalSlotsFunded ?? 0,
          totalDemoVolumeUSD: d.formattedVolumeUSD ?? 'DEMO $0.00 USD',
          openDisputes: d.openDisputes ?? 0,
          overdueReviews: d.overdueReviews ?? 0,
          auditLogCount: d.auditLogCount ?? 0,
        };
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      return {
        totalUsers: 1842,
        activeTasks: demoDb.tasks.length,
        totalSlotsFunded: 2450,
        totalDemoVolumeUSD: 'DEMO $148,500.00 USD',
        openDisputes: 2,
        overdueReviews: 1,
        auditLogCount: demoDb.auditLogs.length,
      };
    }

    return {
      totalUsers: 0,
      activeTasks: 0,
      totalSlotsFunded: 0,
      totalDemoVolumeUSD: 'DEMO $0.00 USD',
      openDisputes: 0,
      overdueReviews: 0,
      auditLogCount: 0,
    };
  },

  async getAuditLogs() {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const logs = json.data?.logs || json.data || json;
        if (Array.isArray(logs) && logs.length > 0) {
          return logs;
        }
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      return demoDb.auditLogs;
    }

    return [];
  },
};
