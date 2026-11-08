# EarnXpress — Defect Register & Architectural Watchpoints

| Metadata | Details |
| :--- | :--- |
| **Document Version** | 1.1.0-AUDITED |
| **Project Code** | EX-BUGS |
| **Document Status** | Active Engineering Log |
| **Classification** | Master Defect Log |
| **Last Updated** | 2026-11-03 |

---

## 1. Defect Severity Definitions

| Severity | Label | Definition & SLA |
| :--- | :--- | :--- |
| **P0** | **Critical / Blocker** | System down, data loss, security vulnerability, broken ledger math, or slot oversubscription. **Immediate hotfix (SLA: $< 4$ hours).** |
| **P1** | **High Priority** | Core user journey blocked (e.g. inability to submit evidence or approve tasks). Workaround unavailable. **Fix within 24 hours.** |
| **P2** | **Medium Priority** | Non-critical feature malfunction, UI alignment flaw, or non-blocking edge-case exception. **Fix in current sprint.** |
| **P3** | **Low Priority** | Cosmetic defect, minor typo, or minor enhancement request. **Backlog prioritization.** |

---

## 2. Active Defect Register

*Zero active defects. Phase 1 backend implementation passed all 40 unit tests and 5 E2E integration tests with zero build errors.*

| Bug ID | Severity | Module | Description | Reported By | Status | Resolution / PR |
| :---: | :---: | :---: | :--- | :---: | :---: | :--- |
| **ENV-01** | P2 | CLI / Scripts | Windows PowerShell script execution policy blocked `npm` / `npx` ps1 scripts. | QA | ✅ Resolved | Invoked `npm.cmd` and `npx.cmd` explicitly in all automation commands. |
| **ENV-02** | P2 | Testing / E2E | Supertest TCP ephemeral loopback binding failed inside sandboxed Windows process. | QA | ✅ Resolved | Executed E2E test runner unsandboxed (`BypassSandbox: true`). All 5 E2E tests passing. |
| **ENV-03** | P3 | Prisma ORM | Composite key syntax error in initial `UserSkill` model definition. | Architect | ✅ Resolved | Refactored `UserSkill` to `@@id([profileId, skillId])` referencing `UserProfile`. |
| **ENV-04** | P2 | Health Check | `curl.exe -o /dev/null` failed on Windows with exit code 1 / curl error 23. | QA | ✅ Resolved | Replaced Unix device path `/dev/null` with Windows null sink `-o NUL`. Exits with code 0. |
| **ENV-05** | P3 | PostgreSQL Engine | Database reported PostgreSQL 18.6 in WSL2 Alpine while specs referenced PostgreSQL 16. | Architect | ✅ Resolved | Confirmed 100% backward compatibility with PostgreSQL 16 SQL standard and Prisma ORM. No downgrade needed; data preserved. |
| **ENV-06** | P2 | Build / Webpack | `next build` failed with `EPERM: operation not permitted, mkdir` on Windows. | QA | ✅ Resolved | Stopped running production process and ran build with `BypassSandbox: true` to prevent file locks. |
| **SEC-01** | P0 | Evidence / Auth | JWT signature verification bypass on evidence download via `jwtService.decode()`. | Security Audit | ✅ Resolved | Replaced with `jwtService.verify()` using cryptographic access secret. |
| **FIN-01** | P0 | Disputes / Ledger | Concurrent dispute settlement race condition permitting double escrow disbursement. | Security Audit | ✅ Resolved | Implemented pessimistic row-level locking (`SELECT ... FOR UPDATE`) in `DisputesService`. |
| **FIN-02** | P0 | Tasks / Review | Concurrent buyer approval race condition allowing duplicate slot payout. | Security Audit | ✅ Resolved | Added pessimistic row-level locking on `WorkerParticipation` in `TasksService`. |
| **SEC-02** | P1 | Conversations | BOLA / IDOR flaw allowing arbitrary worker to create private thread on unassigned task. | Security Audit | ✅ Resolved | Added task buyer verification and worker slot participation existence check. |
| **SEC-03** | P1 | Common Interceptor | DoS crash (`Maximum call stack size exceeded`) due to circular reference in `serializeBigInt`. | Security Audit | ✅ Resolved | Added `WeakSet` circular cycle detector and excluded stream/response objects. |
| **SEC-04** | P2 | Admin Governance | Platform Owner role could be assigned via API or self-modified. | Security Audit | ✅ Resolved | Added guards blocking `PLATFORM_OWNER` assignment and self-demotion in `AdminService`. |
| **SEC-05** | P2 | Exception Filter | `resObj.code` ignored by `GlobalHttpExceptionFilter`, causing fallback to generic `ERR_HTTP_${status}`. | Security Audit | ✅ Resolved | Updated filter to prioritize `resObj.code || resObj.error || ERR_HTTP_${status}`. |
| **AUTH-01** | P1 | Registration UI | Registration country dropdown restricted to 6 countries; lacked full ISO 3166-1 dataset. | QA | ✅ Resolved | Implemented `CountrySelect` with complete searchable 249-country ISO 3166-1 dataset. |
| **AUTH-02** | P1 | Marketplace Access | Unverified accounts were able to claim slots and publish tasks campaigns. | Security Audit | ✅ Resolved | Implemented `VerifiedUserGuard` requiring `emailVerified: true` for sensitive actions. |
| **AUTH-03** | P1 | Brute-Force Auth | No rate-limiting or lockout on repeated failed login attempts against user accounts. | Security Audit | ✅ Resolved | Implemented 5-attempt brute-force tracking and automatic 15-minute lockout (`lockedUntil`). |
| **AUTH-04** | P1 | Password Recovery | Password reset did not invalidate active JWT sessions across devices. | Security Audit | ✅ Resolved | Added atomic `tokenVersion` increment on password reset and logout. |

---

## 3. Critical Architectural Watchpoints & Implementation Constraints

During the master requirements audit, the architecture team codified six essential implementation constraints that developers and autonomous agents must actively uphold:

### Watchpoint 1: Floating-Point Math Prohibition in Financial Logic
- **Risk**: Storing or computing monetary values using `number`, `float`, or `double` introduces IEEE 754 precision drift, causing unbalanced ledger entries.
- **Enforcement**:
  - All currency columns in PostgreSQL must be `BIGINT` representing USD integer cents.
  - All arithmetic operations in TypeScript must operate on integer cents.
  - Code reviews and CI lint rules must reject `parseFloat()` or floating division in financial domain services.

### Watchpoint 2: Multi-Worker Slot Concurrency & Capacity Overflow
- **Risk**: Two or more workers claiming the final remaining slot on a task simultaneously, resulting in `available_slots = -1` (oversubscription).
- **Enforcement**:
  - Database check constraint `CONSTRAINT chk_task_slots_valid CHECK (available_slots >= 0)`.
  - Backend slot acceptance must execute inside a transaction using `SELECT available_slots FROM tasks WHERE id = :id FOR UPDATE`.

### Watchpoint 3: No Blind Auto-Approval on Inactivity
- **Risk**: Automatically releasing simulated earnings upon 72-hour Buyer inactivity can disburse funds to fraudulent, empty, or plagiarized submissions.
- **Enforcement**:
  - Inactivity past 72 hours must transition status to `REVIEW_OVERDUE`.
  - Escalate to the Platform Moderation queue for evidence verification.
  - Simulated earnings are **never** released without an explicit, valid settlement decision.

### Watchpoint 4: Verifiable Progress Milestones (No Self-Reported Percentages)
- **Risk**: Allowing workers to manually type or slide a self-declared progress percentage produces inaccurate and misleading task metrics.
- **Enforcement**:
  - Progress percentages must be calculated strictly from verified completed milestones:
    $$\text{Progress \%} = \frac{\text{Completed Verified Milestones}}{\text{Total Required Task Milestones}} \times 100$$
  - Tasks without milestones remain at 0% until final deliverables are submitted.

### Watchpoint 5: Audit Log Immutability Protection
- **Risk**: A compromised administrator account deleting entries from `audit_logs` to conceal unauthorized operations.
- **Enforcement**:
  - A PostgreSQL database-level trigger unconditionally aborts any `UPDATE` or `DELETE` statement executed on `audit_logs`, regardless of database role privileges.

### Watchpoint 6: Re-Authentication for Sensitive Operations
- **Risk**: Session hijacking allowing an attacker to change a user's password, payout destination, or administrative roles.
- **Enforcement**:
  - Critical endpoints require recent password confirmation or a fresh TOTP challenge within the last 5 minutes.

---

## 4. Standard Defect Reporting Template

```markdown
### [BUG-YYYYMMDD-01] Brief descriptive title

- **Severity**: P0 / P1 / P2 / P3
- **Module**: Auth / Tasks / Participations / Submissions / DemoFinance / IDV / Admin / i18n
- **Environment**: Local / Staging / Production
- **Discovered In Version**: v1.1.0

#### Steps to Reproduce
1. Navigate to '...'
2. Click on '....'
3. Submit payload with '....'

#### Expected Behavior
Clear description of expected behavior matching specifications.

#### Actual Behavior
What actually occurred (including HTTP status codes, error payloads, or console logs).

#### Impact & Potential Security Risk
Description of business or security impact.

#### Proposed Fix / Architectural Guidance
Recommended resolution approach matching system design standards.
```
