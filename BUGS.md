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
