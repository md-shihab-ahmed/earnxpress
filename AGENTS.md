# EarnXpress — Autonomous AI Agent Operating Guidelines

| Metadata | Details |
| :--- | :--- |
| **Document Version** | 1.1.0-AUDITED |
| **Project Code** | EX-AGENTS |
| **Document Status** | Active Operational Standard |
| **Classification** | Master Agent Operating Directives |
| **Target Audience** | Autonomous Coding Agents, Copilots & Pair Programmers |
| **Last Updated** | 2026-11-03 |

---

## 1. Primary Directives & Autonomous Mission

You are an autonomous AI coding agent operating on the **EarnXpress** codebase.
Your objective is to implement software components with high precision, maintaining architectural integrity, strict security hygiene, and adherence to established business rules.

Before writing code or modifying existing files, you must understand the architecture documented in [`README.md`](README.md) and [`docs/`](docs/).

---

## 2. Inviolable Engineering Invariants

When contributing to EarnXpress, you **MUST NOT** violate any of the following engineering laws:

### 2.1 The Open Marketplace & Multi-Worker Invariant
- **Law**: A Task must support multiple simultaneous Workers when its model allows.
- **Rule**: Never bind a single Worker ID directly on the `Task` entity as the sole participation relationship. Tasks link to multiple independent `WorkerParticipation` records.
- **Rule**: One Worker's delay, rejection, or dispute must **never** affect other participating Workers.
- **Rule**: One Worker's completion does **not** finish the task (except when winning a `FIRST_APPROVED` bounty).

### 2.2 The Financial Invariant (Zero Floating-Point Drift & DEMO Branding)
- **Law**: Never use `number`, `float`, `double`, or `parseFloat` to store or calculate monetary amounts.
- **Rule**: All currency values must be stored as 64-bit integers (`BIGINT` in PostgreSQL / `bigint` in TypeScript) representing USD cents (\$1.00 = 100 cents).
- **Rule**: Every ledger transaction must be double-entry with strictly balanced debits and credits ($\sum \text{Debits} = \sum \text{Credits}$).
- **Rule**: Never integrate real payment gateways (Stripe, PayPal, bKash) or cryptocurrency in the MVP. All operations use the simulated demo ledger.
- **Rule**: Every monetary display and transaction must prominently feature the **DEMO** label.

### 2.3 The Concurrency Invariant (Zero Capacity Overflow)
- **Law**: A task with $N$ slots must never allocate $N+1$ slots under any level of parallel load.
- **Rule**: Slot reservations must execute inside a PostgreSQL transaction using `SELECT available_slots FROM tasks WHERE id = :id FOR UPDATE`.
- **Rule**: Always maintain the database check constraint `CONSTRAINT chk_task_slots_valid CHECK (available_slots >= 0)`.

### 2.4 The Review Overdue & Settlement Invariant (No Blind Auto-Payouts)
- **Law**: Buyer inactivity must never automatically release simulated earnings without review.
- **Rule**: Submissions unreviewed at 72 hours must transition to `REVIEW_OVERDUE` and escalate to Platform Moderation for evidence review.
- **Rule**: Never release simulated earnings without an explicit, valid settlement decision.

### 2.5 The Progress Milestone Invariant (No Self-Reported Stats)
- **Law**: Never calculate or display progress percentages derived solely from self-reported sliders.
- **Rule**: Progress percentages must be calculated strictly from completed, verified deliverable milestone checkpoints:
  $$\text{Progress \%} = \frac{\text{Completed Verified Milestones}}{\text{Total Required Task Milestones}} \times 100$$

### 2.6 The Start Deadline Invariant (No Arbitrary 15m Grace Windows)
- **Law**: Do not implement arbitrary 15-minute grace windows.
- **Rule**: Slot acceptance is binding upon confirmation, governed by configurable task-specific start deadlines (`start_deadline_hours`) with automated warning alerts and documented timeout logging.

### 2.7 The Identity Verification Invariant (Zero Real Biometrics)
- **Law**: Do not collect, store, or process real government identity documents, passports, or live biometric face vectors in the MVP.
- **Rule**: Implement the `IdentityVerificationProvider` interface using `MockVerificationProvider`. Store only synthetic test records.

### 2.8 The Security & Governance Invariant (Root Owner Authority)
- **Law**: The Platform Owner is the absolute root application authority. Ordinary administrators must never possess the capability to promote users, demote the Owner, or delete audit history.
- **Rule**: Protect `audit_logs` with PostgreSQL database triggers preventing all `UPDATE` and `DELETE` commands.
- **Rule**: Enforce Object-Level Authorization (BOLA/IDOR prevention) on every endpoint. Always verify resource ownership.
- **Rule**: Enforce re-authentication for sensitive operations (password change, payout destination edit, role mutation).
- **Rule**: Zero hardcoded secrets, passwords, or tokens. Validate all environment variables at startup using a strict Zod schema.

### 2.9 The Internationalization Invariant (Zero Hardcoded Copy)
- **Law**: Do not hardcode English copy into frontend components or backend error responses.
- **Rule**: All UI strings must use `next-intl` translation keys loaded from `/messages/`.
- **Rule**: Backend controllers must return canonical error codes (e.g. `ERR_SLOT_UNAVAILABLE`).
- **Rule**: User-authored task instructions must be stored in their original language; automated translations must be accompanied by a clear translation badge.

---

## 3. Code Quality & Technical Standards

### 3.1 Backend (NestJS Express Adapter & Prisma)
- Strict TypeScript (`"strict": true`, `"noImplicitAny": true`).
- Use Express as the standard HTTP engine for NestJS.
- Use class-validator DTOs on every mutating endpoint with `whitelist: true` and `forbidNonWhitelisted: true`.
- Keep controllers thin; encapsulate business rules inside domain services.

### 3.2 Frontend (Next.js 15 App Router & Tailwind CSS)
- Follow the design system specified in [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).
- Use Radix UI / Shadcn primitives for accessible, keyboard-navigable components.
- Render the Task Participation Dashboard on all task details pages.
- Avoid cluttered cards or gratuitous animations. Maintain a clean, professional financial aesthetic.

---

## 4. Defect & Status Logging Discipline

- When discovering or resolving a defect, update [`BUGS.md`](BUGS.md) according to the standard template.
- When completing milestones or updating specifications, update [`PROJECT_STATUS.md`](PROJECT_STATUS.md) and [`CHANGELOG.md`](CHANGELOG.md).
- Always verify your work against the test scenarios in [`docs/QA_TEST_PLAN.md`](docs/QA_TEST_PLAN.md).
