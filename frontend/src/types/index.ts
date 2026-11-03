export type UserRole =
  | 'PLATFORM_OWNER'
  | 'SUPER_ADMIN'
  | 'MODERATOR'
  | 'SUPPORT_AGENT'
  | 'BUYER'
  | 'WORKER';

export type UserStatus =
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'RESTRICTED'
  | 'SUSPENDED'
  | 'BANNED';

export type TaskModel = 'MULTI_WORKER' | 'FIRST_APPROVED';

export type TaskStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'OPEN'
  | 'FULL'
  | 'PAUSED'
  | 'CLOSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type ParticipationStatus =
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUESTED'
  | 'REVIEW_OVERDUE'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISPUTED'
  | 'ABANDONED'
  | 'CANCELLED'
  | 'FIRST_APPROVED_CLOSED';

export interface UserProfile {
  id: string;
  displayName: string;
  headline?: string;
  bio?: string;
  countryCode: string;
  avatarUrl?: string;
  reputationScore: number;
  completionRate: number;
  totalReviewsCount: number;
}

export interface User {
  id: string;
  email: string;
  primaryRole: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  profile?: UserProfile;
}

export interface AcceptanceCriterion {
  key: string;
  description: string;
}

export interface DeliverableRequirement {
  type: 'TEXT' | 'URL' | 'FILE_ATTACHMENT';
  label: string;
  required?: boolean;
}

export interface MilestoneTemplate {
  order: number;
  title: string;
  description?: string;
}

export interface TaskInstruction {
  versionNumber: number;
  descriptionMarkdown: string;
  acceptanceCriteria: AcceptanceCriterion[];
  deliverableRequirements: DeliverableRequirement[];
  milestones?: MilestoneTemplate[];
}

export interface ParticipationStats {
  totalCapacity: number;
  remainingAvailableSlots: number;
  acceptedTotal: number;
  currentlyWorking: number;
  submittedForReview: number;
  reviewOverdue: number;
  approvedSettled: number;
  rejectedTerminated: number;
}

export interface Task {
  id: string;
  title: string;
  taskModel: TaskModel;
  status: TaskStatus;
  totalSlots: number;
  availableSlots: number;
  unitBudgetCents: string;
  formattedUnitUSD: string;
  startDeadlineHours: number;
  completionDurationHours: number;
  reviewSlaHours: number;
  maxRevisions: number;
  buyer?: {
    id: string;
    profile?: UserProfile;
  };
  category?: { id: string; name: string; slug: string };
  subcategory?: { id: string; name: string; slug: string };
  participationStats?: ParticipationStats;
  instructions?: TaskInstruction;
  participationCount?: number;
  createdAt: string;
}

export interface ProgressMilestone {
  id: string;
  participationId: string;
  milestoneOrder: number;
  title: string;
  description?: string;
  isCompleted: boolean;
  isVerified: boolean;
  completedAt?: string;
  verifiedAt?: string;
}

export interface SubmissionVersion {
  id: string;
  versionNumber: number;
  textNotes: string;
  deliverableUrls?: string[];
  submittedAt: string;
}

export interface WorkerParticipation {
  id: string;
  taskId: string;
  slotNumber: number;
  workerId: string;
  status: ParticipationStatus;
  startDeadlineAt: string;
  executionDeadlineAt: string;
  submittedAt?: string;
  reviewOverdueAt?: string;
  approvedAt?: string;
  revisionsUsed: number;
  progressPercentage: number;
  task?: Task;
  milestones?: ProgressMilestone[];
  submissionVersions?: SubmissionVersion[];
  rejectionReason?: string;
  feedback?: string;
}

export interface DemoLedgerAccount {
  id: string;
  userId?: string;
  accountType: string;
  balanceCents: string;
  formattedBalanceUSD: string;
}

export interface DemoLedgerTransaction {
  id: string;
  referenceType: string;
  referenceId: string;
  description: string;
  amountCents: string;
  formattedAmountUSD: string;
  createdAt: string;
}
