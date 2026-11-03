# EarnXpress — Edge Cases & Race Condition Resolution

| Metadata | Details |
| :--- | :--- |
| **Document Version** | 1.1.0-AUDITED |
| **Project Code** | EX-EDGES |
| **Document Status** | Approved for Development Foundation |
| **Classification** | Master Edge-Case Specification |
| **Last Updated** | 2026-11-03 |

---

## 1. Concurrency & High-Contention Race Conditions

### 1.1 Simultaneous Slot Acceptance ("The Stampede")
- **Scenario**: A task with 1 remaining slot is accepted simultaneously by 50 workers within a 10ms window.
- **Risk**: Capacity overflow or negative available slots (`available_slots < 0`).
- **Engineered Resolution**:
  - PostgreSQL transaction executes `SELECT available_slots FROM tasks WHERE id = :id FOR UPDATE`.
  - The first worker acquires the row lock, decrements `available_slots` to 0, inserts a `WorkerParticipation` record, and commits.
  - The remaining 49 transactions wake up, see `available_slots == 0`, immediately rollback, and return `HTTP 409 Conflict: All slots for this task have been claimed or closed`.
  - Enforced by database constraint: `CONSTRAINT chk_task_slots_valid CHECK (available_slots >= 0)`.

### 1.2 `FIRST_APPROVED` Bounty Model Concurrent Submissions
- **Scenario**: In a `FIRST_APPROVED` bounty task, Worker A and Worker B submit deliverables 1 minute apart. Buyer opens both tabs and clicks "Approve" on Worker A in Tab 1, and "Approve" on Worker B in Tab 2.
- **Risk**: Double disbursement of the prize bounty.
- **Engineered Resolution**:
  - The `Task` entity contains `winning_participation_id` and an atomic boolean lock:
    ```sql
    UPDATE "Task"
    SET "winningParticipationId" = :participationId,
        "status" = 'CLOSED'
    WHERE "id" = :taskId AND "winningParticipationId" IS NULL;
    ```
  - The first transaction succeeds and sets the winning ID.
  - The second transaction updates 0 rows, rolls back immediately, and returns `HTTP 409 Conflict: Winning submission already approved`.
  - All remaining active participations (`IN_PROGRESS` or `SUBMITTED`) transition to `FIRST_APPROVED_CLOSED` via background event handler.

---

## 2. Inactivity, Overdue SLA & Timeout Edge Cases

### 2.1 Buyer Inactivity at 72-Hour Mark (`REVIEW_OVERDUE`)
- **Scenario**: Worker submits deliverable evidence. Buyer's account goes inactive or intentionally ignores the review.
- **Risk**: Worker funds stranded in escrow indefinitely, OR funds released automatically to an incomplete or fraudulent submission.
- **Engineered Resolution**:
  - At Hour 72, background worker transitions status to `REVIEW_OVERDUE`.
  - **Inactivity does NOT equal automatic approval**. Funds are never released without a valid settlement decision.
  - High-urgency alert sent to Buyer with final 24-hour response window.
  - Flagged to Moderator Overdue Queue. At Hour 96, an authorized Moderator audits the evidence against the objective criteria checklist and issues a binding decision (`APPROVED_BY_STAFF` or `REJECTED_BY_STAFF`).

### 2.2 Worker Start Deadline Expiration
- **Scenario**: A Worker accepts a slot on a high-demand task but disappears without initiating work, holding the slot hostage from other workers.
- **Risk**: Slots locked by non-serious or bot users.
- **Engineered Resolution**:
  - Buyer configures `start_deadline_hours` (e.g. 6 hours).
  - At $75\%$ duration (Hour 4.5), system sends an automated high-priority reminder alert.
  - If the Worker fails to initiate activity (submit milestone or confirm start) before deadline:
    - Status transitions to `TIMEOUT_START_EXPIRED`.
    - Slot atomically returns to task pool (`available_slots = available_slots + 1`).
    - Event logged with reason; user is notified (no silent drops).

---

## 3. Task Management Control Edge Cases

### 3.1 Pausing a Task While Workers are Actively Working
- **Scenario**: Buyer clicks "Pause Task" while 20 workers are in `IN_PROGRESS` status and 30 slots remain open.
- **Engineered Resolution**:
  - Task status updates to `PAUSED`.
  - Unclaimed slots (30) are hidden from the open marketplace search.
  - The 20 active workers continue their work, milestone submissions, and review cycles completely uninterrupted.
  - Buyer can resume task at any time, returning open slots to `OPEN`.

### 3.2 Closing Remaining Slots While Workers are in Progress
- **Scenario**: Buyer publishes 100 slots (\$10 each). 40 workers accept slots. Buyer realizes only 40 are needed and clicks "Close Remaining Slots".
- **Engineered Resolution**:
  - System updates task status to `CLOSED` for future claims.
  - Available capacity for the 60 unclaimed slots is terminated.
  - Unused demo escrow ($60 \times \$10.20 = \text{DEMO } \$612.00$) is immediately refunded to Buyer's `DEMO_BUYER_AVAILABLE`.
  - The 40 active workers continue through submission, review, and settlement.

### 3.3 Cancelling a Task with Partial Deliverables
- **Scenario**: Buyer cancels a campaign where Worker A has verified Milestones 1 & 2 completed, and Worker B has completed 0 milestones.
- **Engineered Resolution**:
  - **Evidence-Based Compensation**: Worker A receives partial demo compensation proportional to verified completed milestones.
  - **No Compensation on Self-Reported Stats**: Compensation is never calculated from self-declared progress percentages.
  - Worker B receives zero payout and incurs zero rating penalty.
  - Remaining unallocated escrow is refunded to Buyer.

---

## 4. Financial & Arithmetic Precision Edge Cases

### 4.1 Fractional Cent Rounding Invariants
- **Scenario**: A task budget is \$1.25 (125 cents). Buyer fee is 2% (2.5 cents). Worker fee is 4% (5.0 cents).
- **Engineered Resolution**:
  - All financial math uses integer cents (`BIGINT`).
  - Standard half-up rounding: $\text{round}(125 \times 0.02) = 3\text{ cents}$; $\text{round}(125 \times 0.04) = 5\text{ cents}$.
  - Double-entry balance check: Total Escrow ($128\text{ cents}$) = Worker Net ($120\text{ cents}$) + Worker Fee ($5\text{ cents}$) + Buyer Fee ($3\text{ cents}$). Invariant balance holds to the exact cent.

### 4.2 Odd-Cent Dispute Split
- **Scenario**: A \$1.01 (101 cents) task is in dispute. Moderator orders a 50/50 split.
- **Engineered Resolution**:
  - $\lfloor 101 \times 0.5 \rfloor = 50\text{ cents}$ to Worker.
  - $\lfloor 101 \times 0.5 \rfloor = 50\text{ cents}$ to Buyer.
  - The remaining 1 cent is credited to the Worker if evidence supported partial fulfillment, maintaining an exact zero-sum ledger balance.
