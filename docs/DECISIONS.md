# EarnXpress — Architecture Decision Records (ADRs) & Governance Log

| Metadata | Details |
| :--- | :--- |
| **Document Version** | 1.1.0-AUDITED |
| **Project Code** | EX-ADR |
| **Document Status** | Approved for Development Foundation |
| **Classification** | Master Decision Log & ADR Catalog |
| **Last Updated** | 2026-11-03 |

---

## 1. Decision Classification Framework

All architectural, product, and financial decisions are categorized into four explicit governance states:

1. **`[CONFIRMED]`**: Formally established product and technical requirements approved for Phase 1 implementation.
2. **`[PROPOSED]`**: Architectural recommendations requiring formal Platform Owner review and sign-off.
3. **`[DEFERRED]`**: Valid requirements planned for subsequent phases post-MVP.
4. **`[LEGAL REVIEW REQUIRED]`**: Strategic policies requiring qualified legal review before commercial activation.

---

## 2. Architecture Decision Records (ADRs)

### ADR-001: Modular Monolith Architecture `[CONFIRMED]`
- **Context**: Rapid development, transactional integrity, multi-client support (Web + Android).
- **Decision**: Adopt a **Modular Monolith** using NestJS and Next.js backed by PostgreSQL 16.
- **Rationale**: Eliminates distributed transaction overhead while maintaining clean domain module encapsulation.

### ADR-002: NestJS HTTP Engine Selection: Express as Standard `[CONFIRMED]`
- **Context**: NestJS supports both Fastify and Express.
- **Decision**: Adopt **Express** as the default HTTP engine for NestJS in Phase 1.
- **Rationale**: Express is the battle-tested standard with 100% stable compatibility with all NestJS decorators, Swagger OpenAPI generator, Passport cookies, and multipart upload middleware. Fastify is retained as an optional upgrade path if micro-benchmarks require it.

### ADR-003: Double-Entry Demo Ledger in USD Integer Cents `[CONFIRMED]`
- **Context**: Financial precision, eliminating rounding drift, prominent DEMO branding.
- **Decision**: All balances and transactions operate in virtual USD integer cents (`BIGINT`) with double-entry balance sheets ($\sum \text{Debits} = \sum \text{Credits}$).
- **Rationale**: Completely eliminates IEEE 754 floating-point drift. Guarantees zero-sum ledger integrity.

### ADR-004: Slot Concurrency Protection via PostgreSQL Row Locks `[CONFIRMED]`
- **Context**: Eliminating capacity overflow and race conditions on high-demand tasks.
- **Decision**: Enforce atomic slot claims using `SELECT available_slots FROM tasks WHERE id = :id FOR UPDATE` backed by `CONSTRAINT chk_task_slots_valid CHECK (available_slots >= 0)`.
- **Rationale**: Native database row locks guarantee absolute ACID consistency without external lock dependencies.

### ADR-005: Open Marketplace & Multi-Worker Architecture `[CONFIRMED]`
- **Context**: EarnXpress is an open marketplace supporting multiple simultaneous workers per task.
- **Decision**: Every task supports multiple independent `WorkerParticipation` records. One worker's status, review, progress, or failure never affects another worker.
- **Rationale**: Direct alignment with the core product philosophy of high-capacity crowdsourced work.

### ADR-006: Elimination of 15-Minute Grace Period `[CONFIRMED]`
- **Context**: Arbitrary 15-minute reservation grace periods cause lock contention and complexity.
- **Decision**: Remove the 15-minute grace period. Slot acceptance is an atomic commitment, governed by configurable task-specific start deadlines (`start_deadline_hours`).
- **Rationale**: Streamlines the reservation lifecycle and prevents frivolous slot holding.

### ADR-007: Review SLA Overdue Policy: `REVIEW_OVERDUE` Escalation `[CONFIRMED]`
- **Context**: Unreviewed submissions past 72 hours should not blindly auto-approve without review.
- **Decision**: Replace naive auto-approval with transition to `REVIEW_OVERDUE`, a final 24-hour Buyer grace window, and escalation to Platform Moderation for evidence review.
- **Rationale**: Protects Workers from indefinite non-payment while protecting Buyers from paying for invalid deliverables. Never release funds without a valid settlement decision.

### ADR-008: Two Marketplace Task Models (`MULTI_WORKER` & `FIRST_APPROVED`) `[CONFIRMED]`
- **Context**: Clear operational models to prevent user confusion.
- **Decision**: Implement two explicit task models: `MULTI_WORKER` (independent payouts) and `FIRST_APPROVED` (competitive bounty race with graceful closure of non-winners).
- **Rationale**: Covers the full spectrum of high-volume micro-tasks and urgent problem bounties.

### ADR-009: Pluggable Identity Adapter with Mock Provider for MVP `[CONFIRMED]`
- **Context**: MVP must not collect real IDs or biometric data.
- **Decision**: Implement the `IdentityVerificationProvider` interface using `MockVerificationProvider` for MVP and test suites.
- **Rationale**: Satisfies strict privacy boundaries while ensuring zero architectural rework when real KYC vendors are connected later.

### ADR-010: Database Trigger-Enforced Immutable Audit Logging `[CONFIRMED]`
- **Context**: Audit logs must be tamper-evident and resilient against administrator compromise.
- **Decision**: Deploy PostgreSQL database triggers on `audit_logs` that unconditionally abort any `UPDATE` or `DELETE` queries.
- **Rationale**: Enforces data integrity at the database storage engine layer.

### ADR-011: Optionality of Redis and MinIO in Initial Release `[CONFIRMED]`
- **Context**: Minimizing unnecessary infrastructure complexity.
- **Decision**: Redis and MinIO are marked as optional. MVP crons can run via in-process NestJS scheduler querying PostgreSQL timestamps; files can be stored via local disk or cloud S3 pre-signed URLs.
- **Rationale**: Prevents developer friction and simplifies local container startup.

---

## 3. Inventory of Proposed Decisions Requiring Platform Owner Approval

| Decision Code | Topic | Proposed Recommendation | Status |
| :--- | :--- | :--- | :---: |
| **`DEC-PROP-01`** | **Platform Commission Schedule** | 2.0% Buyer surcharge on task creation; 4.0% Worker deduction on gross payout. | **`[PROPOSED]`** |
| **`DEC-PROP-02`** | **3-Failure Consecutive Penalty Surcharge** | One-time extra 2.0% commission on next successful task after 3 verified failures. Strictly capped; zero compounding. | **`[PROPOSED]`** |
| **`DEC-PROP-03`** | **Default SLA Configurations** | Default start deadline: 6 hours; default review SLA: 72 hours; default revision SLA: 48 hours. | **`[PROPOSED]`** |

---

## 4. Inventory of Deferred Decisions (Post-MVP Milestones)

| Decision Code | Feature / Capability | Target Milestone | Status |
| :--- | :--- | :---: | :---: |
| **`DEC-DEF-01`** | **Native Android Application** | Phase 6 (Post-Web launch) | **`[DEFERRED]`** |
| **`DEC-DEF-02`** | **Production KYC/AML Vendor Integration** | Phase 7 (Sumsub / Veriff) | **`[DEFERRED]`** |
| **`DEC-DEF-03`** | **Real Fiat Payment Gateways** | Phase 7 (Stripe Connect / local gateways) | **`[DEFERRED]`** |
| **`DEC-DEF-04`** | **Team Collaboration Task Archetype** | Phase 7+ (Complex sub-task boards) | **`[DEFERRED]`** |

---

## 5. Inventory of Decisions Requiring Qualified Legal Review

| Decision Code | Topic | Compliance Mandate | Status |
| :--- | :--- | :--- | :---: |
| **`DEC-LEG-01`** | **Failure Surcharge Legality** | Legal counsel verification that the +2% surcharge complies with independent contractor protection laws and wage deduction guidelines in target jurisdictions (US, EU, UK). | **`[LEGAL REVIEW REQUIRED]`** |
| **`DEC-LEG-02`** | **Cross-Border Tax Compliance** | Analysis of international marketplace reporting obligations (IRS Form 1099-K / 1099-NEC in the US, DAC7 in the European Union). | **`[LEGAL REVIEW REQUIRED]`** |
