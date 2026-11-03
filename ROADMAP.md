# EarnXpress — Phased Development Roadmap

| Metadata | Details |
| :--- | :--- |
| **Document Version** | 1.1.0-AUDITED |
| **Project Code** | EX-ROADMAP |
| **Document Status** | Approved for Execution |
| **Classification** | Master Development Roadmap |
| **Last Updated** | 2026-11-03 |

---

## 1. Roadmap Dependency Graph

```mermaid
graph TD
    P0[Phase 0: Master Requirements Audit & Finalized Specs] --> P1[Phase 1: Backend Monolith & Demo Ledger]
    P1 --> P2[Phase 2: Multi-Worker Task Engine & Concurrency Locks]
    P1 --> P3[Phase 3: Next.js Responsive Web Platform]
    P2 --> P3
    P3 --> P4[Phase 4: Staff Governance & Mock IDV]
    P3 --> P5[Phase 5: Bangla i18n Localization]
    P2 --> P6[Phase 6: Android Native Application]
    P4 --> P7[Phase 7: Production Hardening & Real Payments]
    P5 --> P7
    P6 --> P7
```

---

## 2. Phase Breakdown & Deliverables

### Phase 0: Master Requirements Audit & Foundation Specs `[CONFIRMED - 100% COMPLETE]`
- **Status**: **100% COMPLETE & AUDITED**
- **Deliverables**:
  - Author and audit all 18 domain specifications in `docs/` and 6 root governance files.
  - Establish Open Marketplace principles, multi-worker independent records, and 2 distinct task models.
  - Finalize double-entry demo ledger math in integer USD cents, 72h `REVIEW_OVERDUE` escalation, and Express NestJS engine.

---

### Phase 1: Backend Modular Monolith & Core Task Marketplace `[CONFIRMED - 100% COMPLETE]`
- **Dependencies**: Phase 0.
- **Status**: **100% COMPLETE & VERIFIED** (40/40 Unit Tests, 5/5 E2E Tests, `nest build` code 0).
- **Key Deliverables Achieved**:
  - NestJS 10 backend modular monolith using TypeScript and Express engine.
  - Complete PostgreSQL 16 Prisma schema (16 domain models) with migration script `0_init/migration.sql`.
  - Database-level check constraints (`chk_task_slots_valid`, `chk_demo_balance_non_negative`) and PostgreSQL trigger `trg_audit_logs_immutable`.
  - Auth & Security: Argon2id password hashing, short-lived JWT access tokens, HttpOnly refresh cookie rotation, TOTP MFA architecture, and `@RequireReAuth` guard.
  - Demo Financial Engine: Double-entry ledger executing strictly in integer USD cents (`BIGINT`), faucet endpoint (`POST /demo-finance/faucet`), escrow reservation, and slot payout disbursal.
  - Multi-Worker Open Marketplace Task Module: 5-step wizard creation, row-level locking concurrency (`SELECT ... FOR UPDATE`), participation tracking, deliverable submissions, and buyer evaluation (`APPROVE`, `REQUEST_REVISION`, `REJECT`).
  - Admin & Governance: Platform Owner privilege isolation, user sanctions, and immutable audit logging.
  - Full automated testing suite passing 100%.

---

### Phase 2: Responsive Next.js Web Platform `[CONFIRMED - 100% COMPLETE]`
- **Dependencies**: Phase 1.
- **Status**: **100% COMPLETE & VERIFIED** (20/20 Routes Prerendered & Compiled, `next build` exit code 0).
- **Key Deliverables Achieved**:
  - Next.js 14 App Router application built inside `frontend/` with TypeScript, Tailwind CSS, and Lucide icons.
  - Deep Navy (`#0A192F`) & Teal (`#0D9488`) design system with responsive layouts and dark/light themes.
  - Public Marketplace: Homepage, faceted task explorer (`/tasks`), and detailed task pages (`/tasks/[id]`) featuring the real-time **Task Participation Dashboard**.
  - Worker Portal: Worker dashboard, task execution workspace (`/worker/tasks/[id]`), verified milestone checklist (derived progress), and deliverable submission form with revision history.
  - Buyer Portal: Overview dashboard, 5-step Task Creation Wizard (`/buyer/tasks/new`) with live escrow calculation, and Submissions Review Queue (`/buyer/submissions`) with Approve/Revision/Reject actions.
  - Demo Wallet: Balance cards, instant `$1,000` test faucet claim button, and double-entry transaction history ledger.
  - Admin Portal: Staff governance console with user sanctions, 72h overdue review triage queue, and immutable audit explorer.
  - Centralized typed API client (`api.ts`) with seamless demo data fallback when running standalone.

---

### Phase 3: Android Native Mobile Application & Production Hardening `[CONFIRMED - NEXT PHASE]`
- **Key Deliverables**:
  - Initialize Next.js 15 (App Router) with Tailwind CSS, Shadcn UI / Radix primitives, and Lucide icons.
  - Implement Design System tokens (Deep Navy, Teal accent, Light and Dark themes, WCAG 2.1 AA compliance).
  - Build Public Marketplace: Landing page, faceted Task Explorer (`/tasks`), and Task Details with **Task Participation Dashboard**.
  - Build Buyer Workspace: 5-step Task Creation Wizard, Campaign Analytics, Submissions Queue, and Q&A management.
  - Build Worker Workspace: Execution Workspace, Milestone Progress Tracker, and Evidence Upload form.
  - Build Demo Wallet: Balance cards, \$1,000 faucet button, and transaction history with prominent DEMO badges.
  - Build Blind Two-Way Review System with 14-day reveal countdown.

---

### Phase 4: Staff Governance Console & Mock Identity Verification `[CONFIRMED]`
- **Dependencies**: Phase 3.
- **Key Deliverables**:
  - Implement Demonstration KYC interface with `MockVerificationProvider` (zero real biometrics).
  - Build Staff Governance Portal (`/admin`):
    - Platform Owner console: Staff role assignment and commission rate configuration.
    - Overdue Review Triage Queue: Adjudicate submissions unreviewed past 72h.
    - Dispute Arbitration Judicial Console: Evidence inspection and split settlement executor.
    - User Sanctions Engine: Warnings, slot restrictions, suspensions, and bans.
    - Immutable Audit Explorer with JSON diffs.

---

### Phase 5: Internationalization (Bangla `bn-BD` Rollout) `[CONFIRMED]`
- **Dependencies**: Phase 3.
- **Key Deliverables**:
  - Integrate `next-intl` localization middleware and locale switcher.
  - Complete full Bangla translation dictionary (`messages/bn/*.json`).
  - Configure PostgreSQL ICU collation for native Bangla alphabetical sorting.
  - Implement translation badge UI: `Translated from English (Show Original)`.

---

### Phase 6: Native Android Mobile Application `[DEFERRED]`
- **Dependencies**: Phase 2, Phase 3.
- **Key Deliverables**:
  - Initialize Kotlin Android project using Jetpack Compose and Material 3.
  - Consume existing OpenAPI 3.1 RESTful endpoints with Android Keystore token storage.
  - Integrate Firebase Cloud Messaging (FCM) for push notifications.
  - Mirror web deep-links (`earnxpress://tasks/{id}`).

---

### Phase 7: Production Hardening, Legal Approvals & Commercial Launch `[DEFERRED / LEGAL REVIEW]`
- **Dependencies**: Phase 4, Phase 5, Phase 6.
- **Key Deliverables**:
  - Platform Owner and Legal Counsel review of consecutive failure surcharge (`DEC-LEG-01`).
  - Contract and integrate commercial KYC vendor (Sumsub/Veriff) replacing mock provider (`DEC-DEF-02`).
  - Integrate live payment gateways (Stripe Connect / local processors) replacing simulated faucet (`DEC-DEF-03`).
  - Third-party penetration testing and OWASP ASVS Level 2 compliance certification.
