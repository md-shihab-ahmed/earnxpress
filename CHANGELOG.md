# EarnXpress — Changelog

All notable changes to the **EarnXpress** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.0] - 2026-11-04

### Authentication, Registration & International Country Support

#### Added
- **Complete ISO 3166-1 International Country Support**:
  - Full 249-country dataset in `backend/src/common/constants/countries.constant.ts` and `frontend/src/lib/constants/countries.ts` with ISO alpha-2 codes, full English country names, and international dialing codes.
  - Searchable `CountrySelect` combobox component on registration with real-time filtering, flag/code display, and keyboard navigation.
  - Strict backend validation constraint (`IsIso3166CountryCodeConstraint`) rejecting any non-standard country code.
- **Strict Password Security Policy & Common Password Blacklist**:
  - 8 to 64 character length policy with uppercase (A-Z), lowercase (a-z), numeric (0-9), and symbol (@, #, $, !, %, &, *, etc.) requirements.
  - Common dictionary blacklist (`COMMON_PASSWORDS_BLACKLIST`) disallowing commonly leaked or guessed passwords (e.g. `Password123!`, `Admin12345!`).
  - Username/email similarity detection preventing local-part inclusion in passwords.
  - Frontend `PasswordStrengthMeter` component with real-time score bar and visual requirement checklists.
  - Confirm Password matching enforced on both frontend and backend.
  - Password hashing via Argon2id with secure 12-round bcrypt fallback.
- **Email Verification & Rate Limiting**:
  - Single-use 32-byte cryptographic random verification tokens (24-hour TTL).
  - Storage of SHA-256 token hash only (`EmailVerificationToken`), never plaintext tokens.
  - Single-use token consumption (`usedAt` timestamp) preventing replay attacks.
  - 60-second rate-limiting cooldown between resend verification requests (`HTTP 429 ERR_RATE_LIMIT_EXCEEDED`).
  - `VerifiedUserGuard` blocking unverified accounts from task creation, slot claims, deliverable submissions, and withdrawals (`ERR_EMAIL_UNVERIFIED`).
  - `EmailDeliveryService` with configurable SMTP support and transparent `PENDING_DELIVERY_UNCONFIGURED` reporting without false claims.
  - Dedicated `/verify-email` page supporting token auto-consumption from URL or manual entry.
- **Brute-Force Lockout & Password Recovery**:
  - 5-attempt failed login tracking with automatic 15-minute account lockout (`lockedUntil`).
  - Generic authentication error messages preventing user enumeration.
  - Forgot Password and Password Reset workflows (`POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`).
  - Password reset automatically clears failed login counters, lifts account lockouts, and increments `tokenVersion` (revoking all active refresh tokens/sessions).
  - Secure `/reset-password` page with password complexity checklist and show/hide controls.
  - Secure `/logout` endpoint incrementing `tokenVersion` and clearing HTTP-only auth cookies.
- **Extensible International KYC Architecture (`IdvModule`)**:
  - `IKycProvider` contract supporting country-specific ID types and future biometric liveness/face-match sessions.
  - `MockKycProvider` providing country-specific configurations (Bangladesh: Smart NID, Legacy NID, Passport, BRTA Driving License; US: Driver's License, Passport, State ID; UK: Passport, DVLA Licence, BRP; Germany: Personalausweis, Reisepass; India: Masked Aadhaar, PAN; Nigeria: NIN; Philippines: PhilID).
  - Deduplicated identity verification hashing (`identityDedupHash`) preventing duplicate identities across accounts without storing raw unmasked IDs.
  - Endpoints: `GET /api/v1/idv/supported-documents`, `POST /api/v1/idv/liveness-session`, `POST /api/v1/idv/submit-mock`, `GET /api/v1/idv/status`.
- **Automated Verification**:
  - Automated test suite `backend/test-auth-country-security.js` with 27 out of 27 passing tests (100% pass rate).
  - 65 out of 65 backend unit tests passing across 9 test suites.

---

## [1.4.1] - 2026-11-04

### Targeted Security & Financial Integrity Hardening

#### Security & Concurrency Fixes
- **Evidence Download Authentication Fix (`EvidenceController`)**: Replaced unverified `jwtService.decode` with cryptographic `jwtService.verify`, eliminating authentication bypass vulnerability on private evidence streaming.
- **Pessimistic Row Locking for Dispute Settlements (`DisputesService`)**: Added PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) on `Dispute` and `WorkerParticipation` within resolution transactions, preventing race conditions, duplicate settlements, and double escrow releases.
- **Pessimistic Row Locking for Buyer Approvals (`TasksService`)**: Added row-level lock on `WorkerParticipation` during submission approval, preventing concurrent duplicate slot payouts.
- **BOLA / IDOR Verification on Private Threads (`ConversationsService`)**: Enforced validation that specified `buyerId` owns the task and `workerId` has an active slot participation before opening private 1-on-1 conversations.
- **Circular Reference Cycle Protection (`TransformResponseInterceptor`)**: Integrated `WeakSet` traversal tracking in `serializeBigInt`, preventing process crash on stream/response objects.
- **Platform Owner Exclusivity (`AdminService`)**: Blocked assignment of `PLATFORM_OWNER` via staff API and prevented self-role modification.
- **Duplicate Transaction Defense (`DemoFinanceService`)**: Added transaction existence verification in `disburseSlotPayout` and `settleDisputeSplit`.

---

## [1.4.0] - 2026-11-04

### Phase 2: Dispute Resolution & Evidence Management

#### Added
- **Secure Evidence Management Module (`EvidenceModule`)**:
  - `POST /api/v1/evidence/upload`: Multer multipart form upload with binary magic-byte inspection verifying claimed MIME against payloads (`image/png`, `image/jpeg`, `image/webp`, `image/gif`, `application/pdf`, `video/mp4`, `video/webm`, `video/quicktime`, `application/zip`, `text/plain`, `text/csv`).
  - File size bounds: 25MB for documents/images, 50MB for video evidence.
  - Built-in malware scanning interface (`IMalwareScanner`, `DefaultMalwareScanner`) blocking dangerous executable signatures (PE `MZ`, ELF, Java class bytecode).
  - SHA-256 cryptographic hashing on all stored evidence files with private storage under `backend/uploads/evidence/`.
  - HMAC-SHA256 time-limited signed download URLs (`GET /api/v1/evidence/:id/download?token=...`) with participation authorization checks.
- **In-Platform Communication & Collaboration (`ConversationsModule`)**:
  - Public Task Q&A threads (`isPublicQnA = true`) on marketplace tasks: `GET /api/v1/conversations/task/:taskId/qna` and `POST /api/v1/conversations/task/:taskId/qna`.
  - Private 1-on-1 Buyer-Worker slot threads: `GET /api/v1/conversations/slot/:taskId/worker/:workerId/buyer/:buyerId`.
  - Real database-backed `TaskQnA` component embedded in task details (`/tasks/[id]`), replacing static placeholders.
- **Dispute Resolution & Arbitration System (`DisputesModule`)**:
  - Formal dispute filing on participation slots (`POST /api/v1/disputes`) with reason codes: `UNJUSTIFIED_REJECTION`, `BUYER_UNRESPONSIVE_SLA`, `NON_COMPLIANT_DELIVERABLE`, `COMMUNICATION_BREAKDOWN`, `EVIDENCE_OF_FRAUD`, `OTHER`.
  - Transitions slot status to `DISPUTED` with attached evidence files.
  - Comprehensive Arbitration Dossier (`GET /api/v1/disputes/:id`): task instructions, worker submission versions, deliverable URLs, uploaded evidence with signed download links, and audit history.
  - Four distinct arbitration verdicts: `SETTLE_WORKER`, `REFUND_BUYER`, `SPLIT_SETTLEMENT`, and `DISMISS`.
  - `DemoFinanceService.settleDisputeSplit(...)`: atomic double-entry ledger transactions enforcing that worker net payout + buyer refund + platform revenue strictly equals the total reserved slot escrow.
- **Frontend Components & Console**:
  - `EvidenceUploader`: Drag-and-drop file upload with progress bar, clean scan indicator, and signed URL generation.
  - `DisputeModal`: Formal dispute dialog with reason code selector, statement input, and embedded evidence uploader.
  - Admin "Dispute Arbitration Console" tab in `/admin` with one-click dossier inspection and interactive verdict ruling tools.
- **Testing & Quality Assurance**:
  - Unit test suites for `EvidenceService` and `DisputesService` (9 passed, 65 total tests passing).
  - 12-stage Phase 2 E2E test suite (`backend/test-phase2-e2e.js`) validating evidence upload, signed URL streaming, task Q&A, slot claim, deliverable submission, buyer rejection, dispute filing, dossier review, and split settlement ledger invariants.

---

## [1.3.0] - 2026-11-03

### Phase 2: Complete Next.js Website & Multi-Portal Experience

#### Added
- **Complete Next.js 14 App Router Website (`frontend/`)**:
  - Full TypeScript, Tailwind CSS, and Lucide icons architecture with Deep Navy (`#0A192F`) and Teal (`#0D9488`) design tokens and Dark/Light mode support.
  - 20 complete production routes compiled and prerendered (`next build` exit code 0).
- **Public Marketplace**:
  - Homepage with high-converting hero, 4 core pillars, live marketplace metrics, 2-model explainer, and featured task previews.
  - Faceted Marketplace Catalog (`/tasks`) with live keyword search, model filters (`MULTI_WORKER` vs `FIRST_APPROVED`), and capacity progress cards.
  - Detailed Task Pages (`/tasks/[id]`) rendering markdown instructions, objective acceptance criteria, publisher reputation card, in-platform Q&A thread, and interactive slot claim button.
  - Live **Task Participation Dashboard** (`ParticipationDashboard`) visualizing total slots, remaining available slots, working, submitted, approved, and review overdue metrics.
- **Worker Portal & Task Execution Workspace**:
  - Worker Overview (`/worker`) with active slots, earnings, and progress tracking.
  - Task Execution Workspace (`/worker/tasks/[id]`) with interactive **MilestoneTracker** deriving progress percentages strictly from verified checkpoints.
  - Deliverable Submission form with storage URL attachments, work notes, and acceptance criteria attestations.
  - Revision history and feedback review display.
- **Buyer Portal & Control Center**:
  - Buyer Overview (`/buyer`) with active campaign management, total slots funded, and status controls.
  - Five-Step Task Creation Wizard (`/buyer/tasks/new`): Step 1 Basics & Model, Step 2 Capacity & Deadlines, Step 3 Budget & Live Escrow Calculation, Step 4 Instructions & Criteria (minimum 2 required), Step 5 Review & Publish.
  - Submissions Review Queue (`/buyer/submissions`) with Approve (escrow release), Request Revision (with maxRevisions guard), Reject, and 1-5 Star Ratings.
- **Demo Wallet & Ledger**:
  - Multi-portal Demo Wallet (`/worker/wallet`, `/buyer/wallet`) with balance cards, instant `$1,000` test faucet claim button, and double-entry transaction history ledger.
  - Prominent DEMO labeling on all balances and transactions.
- **Staff Governance & Administration**:
  - Staff Admin Dashboard (`/admin`) with platform volume stats, user management & sanctions engine (warn, restrict slots, suspend, ban), 72h overdue review triage queue, and immutable audit log explorer.
- **Authentication & Shared Navigation**:
  - Responsive header with instant 1-click role switcher (`Worker`, `Buyer`, `Admin`), demo wallet balance pill, and theme toggle.
  - Sign in (`/login`) with 1-click demo profiles, registration (`/register`) with role toggle, password reset (`/forgot-password`), about, help, terms, privacy, and contact pages.

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
