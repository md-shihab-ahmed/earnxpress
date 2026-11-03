# EarnXpress — Changelog

All notable changes to the **EarnXpress** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-11-03

### Phase 1: Backend Foundation & Core Modular Monolith

#### Added
- **Production NestJS 10 Modular Monolith**:
  - Express HTTP engine with TypeScript and centralized validation, logging, exception filters, and OpenAPI/Swagger documentation at `/api/docs`.
  - Global `TransformResponseInterceptor` ensuring unified `{ success: true, data, timestamp }` envelope and `HttpExceptionFilter` for standard `{ success: false, statusCode, error, message, timestamp }` errors.
  - Zod environment configuration validation (`env.config.ts`).
- **Complete PostgreSQL 16 Prisma Schema & Migration**:
  - 16 domain models: `User`, `UserProfile`, `Skill`, `UserSkill`, `IdentityVerification`, `Category`, `Subcategory`, `Task`, `TaskSlot`, `TaskInstructionVersion`, `WorkerParticipation`, `ProgressMilestone`, `Submission`, `SubmissionVersion`, `Dispute`, `Review`, `DemoLedgerAccount`, `DemoLedgerTransaction`, `DemoLedgerEntry`, `Conversation`, `ConversationParticipant`, `Message`, `Notification`, and `AuditLog`.
  - Generated initial migration `0_init/migration.sql`.
  - Added database check constraints `chk_task_slots_valid` (non-negative slots) and `chk_demo_balance_non_negative` (non-negative balances).
  - Added PostgreSQL PL/pgSQL function `enforce_audit_immutability()` and trigger `trg_audit_logs_immutable` prohibiting updates and deletes on `AuditLog`.
- **Authentication & Security Engine**:
  - Argon2id password hashing with bcrypt verification fallback.
  - Short-lived JWT access tokens (15m) and secure HttpOnly refresh token rotation (7d).
  - TOTP MFA architecture with Base32 secret generation and RFC 6238 token verification.
  - Role-based authorization (`RolesGuard`) and sensitive action re-authentication guard (`@RequireReAuth` / `RequireReAuthGuard`).
- **Double-Entry Demo Financial Engine**:
  - Executed strictly in integer USD cents (`BIGINT`) with zero floating-point math.
  - Double-entry ledger accounts (`DEMO_BUYER_AVAILABLE`, `DEMO_BUYER_ESCROW_RESERVED`, `DEMO_WORKER_AVAILABLE`, `DEMO_SYSTEM_REVENUE`, `DEMO_SYSTEM_FAUCET_POOL`).
  - Implemented `$1,000` test faucet (`POST /api/v1/demo-finance/faucet`).
  - Atomic escrow locking upon task creation and atomic payout disbursal upon submission approval.
- **Open Marketplace Task Engine & Multi-Worker Concurrency**:
  - 5-step task authoring wizard requiring at least two objective acceptance criteria.
  - Atomic slot reservation protected by PostgreSQL row-level locks (`SELECT ... FOR UPDATE`).
  - Independent `WorkerParticipation` record creation with start and completion deadlines.
  - Worker deliverable submission with versioning (`POST /api/v1/tasks/participations/:id/submit`).
  - Buyer review evaluation (`POST /api/v1/tasks/participations/:id/review`) supporting `APPROVE`, `REQUEST_REVISION` (with `maxRevisions` guard), and `REJECT`.
  - Derived progress calculation from verified milestone checkpoints (`POST /api/v1/tasks/participations/:id/milestones/:mId`).
- **Platform Governance & Admin Console**:
  - Platform Owner privilege isolation guard (`PlatformOwnerGuard`).
  - User sanction management (RESTRICTED, SUSPENDED, BANNED).
  - Immutable audit logging service recording all security and financial mutations.
- **Automated Testing & Verification**:
  - 40 Unit Tests across 5 suites passing 100% (`guards.spec.ts`, `admin.service.spec.ts`, `demo-finance.service.spec.ts`, `auth.service.spec.ts`, `tasks.service.spec.ts`).
  - 5 End-to-End integration tests passing 100% (`app.e2e-spec.ts`).
  - Verified full TypeScript compilation via `nest build` (exit code 0).

---

## [1.1.0] - 2026-11-03

### Master Requirements Audit, Open Marketplace Refinement & Documentation Correction

#### Added
- **Open International Marketplace Core Philosophy**:
  - Embedded the Open Marketplace paradigm into all specifications: Any registered Buyer can publish tasks; any registered Worker can discover and accept open slots without prior personal relationships or off-platform negotiation.
  - Added in-platform public Q&A threads allowing prospective Workers to clarify instructions before accepting slots.
- **Multiple Workers Per Task Architecture**:
  - Re-architected task execution around isolated `WorkerParticipation` records.
  - Formulated strict participation independence: One Worker's delay, rejection, or dispute never impacts other participating Workers; one Worker's approval does not finish the parent task.
- **Two Distinct Marketplace Task Models**:
  - `MULTI_WORKER`: Multiple workers execute independently; each approved worker receives unit demo earnings.
  - `FIRST_APPROVED`: Multiple workers compete concurrently; the first submission satisfying acceptance criteria wins the bounty; remaining participants transition gracefully to `FIRST_APPROVED_CLOSED`.
- **Task Participation Dashboard**:
  - Added public aggregate capacity metrics (Total slots, Working, Submitted, Approved, Remaining Slots) and private authorized milestone inspection.
- **Verifiable Milestone Progress Tracking**:
  - Banned self-reported progress percentages; progress is derived strictly from verified deliverable checkpoints.
- **Task Management Controls for Buyers**:
  - Added `PAUSE_TASK` (freezes new reservations, active workers finish), `CLOSE_REMAINING_SLOTS` (closes unfilled capacity, refunds unallocated demo escrow), and `CANCEL_TASK` (with evidence-based milestone compensation).
- **Decision Governance Classification**:
  - Classified every system rule into `[CONFIRMED]`, `[PROPOSED]`, `[DEFERRED]`, or `[LEGAL REVIEW REQUIRED]`.
- **Express vs. Fastify Architectural Evaluation**:
  - Evaluated NestJS HTTP adapters; adopted Express as the primary standard for 100% stable middleware and OpenAPI compatibility.
  - Marked Redis and MinIO as optional for frictionless development setup.

#### Changed / Corrected
- **Correction of 72-Hour Review Policy**:
  - **Permanently removed** naive automated fund release on Buyer inactivity.
  - Submissions unreviewed at 72 hours transition to `REVIEW_OVERDUE`, receive a final 24-hour response window, and escalate to Platform Moderation for evidence review.
  - Codified the invariant: Simulated earnings are **never** released without an explicit, valid review decision.
- **Elimination of Arbitrary 15-Minute Grace Period**:
  - **Permanently removed** the 15-minute slot reservation grace window.
  - Slot acceptance is binding upon confirmation, governed by configurable task-specific start deadlines (`start_deadline_hours`) with automated warning alerts and documented timeout logging.
- **Database Schema Harmonization (`DATABASE_ERD.md`)**:
  - Added `TaskSlot` and `WorkerParticipation` models to replace single-worker assignments.
  - Added `ProgressMilestone` and `SubmissionVersion` models.
  - Standardized double-entry ledger models under explicit DEMO naming (`DemoLedgerAccount`, `DemoLedgerTransaction`, `DemoLedgerEntry`).
- **Prominent DEMO Branding**:
  - Enforced prominent **DEMO** labeling on all wallet balances, faucet transactions, and UI indicators.

---

## [0.1.0] - 2026-11-03

### Initial Architecture, Product Specification & Development Foundation Release
- Initial baseline documentation release covering PRD, Business Rules, User Flows, Task Lifecycle, Edge Cases, Security Plan, Database ERD, API Specification, Permission Matrix, Design System, Sitemap, Financial Simulation, QA Plan, Deployment Plan, i18n, Admin Specification, and ADRs.
