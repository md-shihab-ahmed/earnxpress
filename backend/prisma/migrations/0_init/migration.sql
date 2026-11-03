-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_OWNER', 'SUPER_ADMIN', 'MODERATOR', 'SUPPORT_AGENT', 'BUYER', 'WORKER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'RESTRICTED', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "IdvStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "TaskModel" AS ENUM ('MULTI_WORKER', 'FIRST_APPROVED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'OPEN', 'FULL', 'PAUSED', 'CLOSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'REVIEW_OVERDUE', 'APPROVED', 'REJECTED', 'DISPUTED', 'ABANDONED', 'CANCELLED', 'FIRST_APPROVED_CLOSED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'EVIDENCE_SUBMITTED', 'RESOLVED', 'APPEALED');

-- CreateEnum
CREATE TYPE "DemoAccountType" AS ENUM ('DEMO_SYSTEM_FAUCET_POOL', 'DEMO_SYSTEM_REVENUE', 'DEMO_BUYER_AVAILABLE', 'DEMO_BUYER_ESCROW_RESERVED', 'DEMO_WORKER_AVAILABLE', 'DEMO_WORKER_PENDING_DISPUTE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "primaryRole" "UserRole" NOT NULL DEFAULT 'WORKER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecretEncrypted" VARCHAR(255),
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "hasPendingPenalty" BOOLEAN NOT NULL DEFAULT false,
    "tokenVersion" INTEGER NOT NULL DEFAULT 1,
    "lastReAuthAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "headline" VARCHAR(150),
    "bio" TEXT,
    "countryCode" VARCHAR(2) NOT NULL DEFAULT 'US',
    "avatarUrl" VARCHAR(512),
    "hourlyRateCents" BIGINT NOT NULL DEFAULT 0,
    "availabilityStatus" VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
    "reputationScore" DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    "completionRate" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    "totalReviewsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "category" VARCHAR(64) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkill" (
    "profileId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "yearsExp" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("profileId","skillId")
);

-- CreateTable
CREATE TABLE "IdentityVerification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "documentType" VARCHAR(32) NOT NULL,
    "documentNumberMasked" VARCHAR(32) NOT NULL,
    "identityDedupHash" VARCHAR(64) NOT NULL,
    "status" "IdvStatus" NOT NULL DEFAULT 'PENDING',
    "providerReferenceId" VARCHAR(128),
    "confidenceScore" INTEGER,
    "riskFlags" TEXT[],
    "rejectionReason" TEXT,
    "reviewerNotes" TEXT,
    "reviewedById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMPTZ(6),

    CONSTRAINT "IdentityVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "subcategoryId" UUID NOT NULL,
    "taskModel" "TaskModel" NOT NULL DEFAULT 'MULTI_WORKER',
    "title" VARCHAR(150) NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'DRAFT',
    "totalSlots" INTEGER NOT NULL DEFAULT 1,
    "availableSlots" INTEGER NOT NULL DEFAULT 1,
    "unitBudgetCents" BIGINT NOT NULL,
    "totalEscrowCents" BIGINT NOT NULL,
    "buyerFeeCents" BIGINT NOT NULL,
    "workerFeeCents" BIGINT NOT NULL,
    "maxRevisions" INTEGER NOT NULL DEFAULT 2,
    "startDeadlineHours" INTEGER NOT NULL DEFAULT 6,
    "completionDurationHours" INTEGER NOT NULL DEFAULT 24,
    "reviewSlaHours" INTEGER NOT NULL DEFAULT 72,
    "currentVersionNumber" INTEGER NOT NULL DEFAULT 1,
    "winningParticipationId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSlot" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "slotNumber" INTEGER NOT NULL,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskInstructionVersion" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "descriptionMarkdown" TEXT NOT NULL,
    "acceptanceCriteriaJson" JSONB NOT NULL,
    "deliverableRequirementsJson" JSONB NOT NULL,
    "attachmentsJson" JSONB,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskInstructionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerParticipation" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "slotId" UUID NOT NULL,
    "workerId" UUID NOT NULL,
    "instructionVersionId" UUID NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startDeadlineAt" TIMESTAMPTZ(6) NOT NULL,
    "executionDeadlineAt" TIMESTAMPTZ(6) NOT NULL,
    "submittedAt" TIMESTAMPTZ(6),
    "reviewOverdueAt" TIMESTAMPTZ(6),
    "approvedAt" TIMESTAMPTZ(6),
    "revisionsUsed" INTEGER NOT NULL DEFAULT 0,
    "progressPercentage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WorkerParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressMilestone" (
    "id" UUID NOT NULL,
    "participationId" UUID NOT NULL,
    "milestoneOrder" INTEGER NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" UUID,
    "evidenceAttachments" JSONB,
    "completedAt" TIMESTAMPTZ(6),
    "verifiedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ProgressMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" UUID NOT NULL,
    "participationId" UUID NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionVersion" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "textNotes" TEXT,
    "deliverableUrlsJson" JSONB,
    "fileAttachmentsJson" JSONB,
    "criteriaAttestationsJson" JSONB NOT NULL,
    "revisionNotes" TEXT,
    "submittedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" UUID NOT NULL,
    "participationId" UUID NOT NULL,
    "initiatorId" UUID NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "reasonCode" VARCHAR(64) NOT NULL,
    "statement" TEXT NOT NULL,
    "assignedModeratorId" UUID,
    "verdict" VARCHAR(32),
    "workerPayoutCents" BIGINT,
    "buyerRefundCents" BIGINT,
    "arbitrationNotes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "participationId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "revieweeId" UUID NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "communicationRating" INTEGER NOT NULL,
    "qualityRating" INTEGER NOT NULL,
    "timelinessRating" INTEGER NOT NULL,
    "publicComment" TEXT NOT NULL,
    "privateFeedback" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoLedgerAccount" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "accountType" "DemoAccountType" NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "balanceCents" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "DemoLedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoLedgerTransaction" (
    "id" UUID NOT NULL,
    "referenceType" VARCHAR(64) NOT NULL,
    "referenceId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoLedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoLedgerEntry" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "debitAccountId" UUID NOT NULL,
    "creditAccountId" UUID NOT NULL,
    "amountCents" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" UUID NOT NULL,
    "taskId" UUID,
    "isPublicQnA" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentsJson" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "body" TEXT NOT NULL,
    "actionUrl" VARCHAR(255),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "actorRole" VARCHAR(32) NOT NULL,
    "action" VARCHAR(64) NOT NULL,
    "resourceType" VARCHAR(64) NOT NULL,
    "resourceId" UUID NOT NULL,
    "previousState" JSONB,
    "newState" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityVerification_identityDedupHash_key" ON "IdentityVerification"("identityDedupHash");

-- CreateIndex
CREATE INDEX "IdentityVerification_status_idx" ON "IdentityVerification"("status");

-- CreateIndex
CREATE INDEX "IdentityVerification_userId_idx" ON "IdentityVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_categoryId_slug_key" ON "Subcategory"("categoryId", "slug");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_categoryId_subcategoryId_idx" ON "Task"("categoryId", "subcategoryId");

-- CreateIndex
CREATE INDEX "Task_createdAt_idx" ON "Task"("createdAt");

-- CreateIndex
CREATE INDEX "TaskSlot_taskId_isClaimed_idx" ON "TaskSlot"("taskId", "isClaimed");

-- CreateIndex
CREATE UNIQUE INDEX "TaskSlot_taskId_slotNumber_key" ON "TaskSlot"("taskId", "slotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TaskInstructionVersion_taskId_versionNumber_key" ON "TaskInstructionVersion"("taskId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerParticipation_slotId_key" ON "WorkerParticipation"("slotId");

-- CreateIndex
CREATE INDEX "WorkerParticipation_taskId_status_idx" ON "WorkerParticipation"("taskId", "status");

-- CreateIndex
CREATE INDEX "WorkerParticipation_workerId_idx" ON "WorkerParticipation"("workerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressMilestone_participationId_milestoneOrder_key" ON "ProgressMilestone"("participationId", "milestoneOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionVersion_submissionId_versionNumber_key" ON "SubmissionVersion"("submissionId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_participationId_key" ON "Dispute"("participationId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_participationId_key" ON "Review"("participationId");

-- CreateIndex
CREATE UNIQUE INDEX "DemoLedgerAccount_userId_accountType_currency_key" ON "DemoLedgerAccount"("userId", "accountType", "currency");

-- CreateIndex
CREATE INDEX "DemoLedgerTransaction_referenceType_referenceId_idx" ON "DemoLedgerTransaction"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "DemoLedgerEntry_transactionId_idx" ON "DemoLedgerEntry"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityVerification" ADD CONSTRAINT "IdentityVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSlot" ADD CONSTRAINT "TaskSlot_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInstructionVersion" ADD CONSTRAINT "TaskInstructionVersion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerParticipation" ADD CONSTRAINT "WorkerParticipation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerParticipation" ADD CONSTRAINT "WorkerParticipation_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "TaskSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerParticipation" ADD CONSTRAINT "WorkerParticipation_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerParticipation" ADD CONSTRAINT "WorkerParticipation_instructionVersionId_fkey" FOREIGN KEY ("instructionVersionId") REFERENCES "TaskInstructionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressMilestone" ADD CONSTRAINT "ProgressMilestone_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "WorkerParticipation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "WorkerParticipation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionVersion" ADD CONSTRAINT "SubmissionVersion_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "WorkerParticipation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "WorkerParticipation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoLedgerAccount" ADD CONSTRAINT "DemoLedgerAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoLedgerEntry" ADD CONSTRAINT "DemoLedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "DemoLedgerTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoLedgerEntry" ADD CONSTRAINT "DemoLedgerEntry_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES "DemoLedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoLedgerEntry" ADD CONSTRAINT "DemoLedgerEntry_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "DemoLedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- Custom Integrity Constraints
ALTER TABLE "Task" ADD CONSTRAINT "chk_task_slots_valid" 
CHECK ("availableSlots" >= 0 AND "availableSlots" <= "totalSlots" AND "totalSlots" > 0);

ALTER TABLE "DemoLedgerAccount" ADD CONSTRAINT "chk_demo_balance_non_negative" 
CHECK ("balanceCents" >= 0 OR "accountType" IN ('DEMO_SYSTEM_FAUCET_POOL', 'DEMO_SYSTEM_REVENUE'));

-- Audit Log Immutability Trigger
CREATE OR REPLACE FUNCTION enforce_audit_immutability()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON "AuditLog";
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION enforce_audit_immutability();
