# EarnXpress — End-to-End User Flows

| Metadata | Details |
| :--- | :--- |
| **Document Version** | 1.1.0-AUDITED |
| **Project Code** | EX-FLOWS |
| **Document Status** | Approved for Development Foundation |
| **Classification** | Master User Journey Specification |
| **Last Updated** | 2026-11-03 |

---

## 1. Global User Journey: Open Marketplace Discovery to Settlement

```mermaid
journey
    title Open Marketplace Multi-Worker Journey
    section Task Launch
      Buyer configures 5-step wizard (Capacity N): 5: Buyer
      Buyer locks demo escrow + 2% fee: 5: Buyer
      Task opens on public marketplace: 5: Marketplace
    section Discovery & Clarification
      Worker searches & filters tasks: 5: Worker
      Worker posts public Q&A question: 4: Worker
      Buyer answers question publicly: 4: Buyer
      Worker accepts slot (Atomic binding): 5: Worker
    section Execution & Milestones
      Start deadline countdown begins: 4: Worker
      Worker submits verified milestone proof: 4: Worker
      Buyer verifies milestone (Progress updates %): 5: Buyer
      Worker submits final deliverable files: 5: Worker
    section Review & Settlement
      72-hour review window starts: 4: Buyer
      Buyer approves (or 72h overdue staff review): 5: Buyer, Moderator
      Worker receives demo payout (-4% fee): 5: Worker
      Blind two-way rating submitted: 5: Buyer, Worker
```

---

## 2. Open Marketplace Discovery & Clarification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Worker as Worker Client
    participant Web as Next.js Web App
    participant API as NestJS Tasks Module
    participant DB as PostgreSQL
    actor Buyer as Buyer Client

    Worker->>Web: Open /tasks (Filter: category, budget, capacity > 50, open slots)
    Web->>API: GET /api/v1/tasks?status=OPEN&minSlots=1
    API-->>Web: Paginated tasks with public participation statistics
    Worker->>Web: View Task Details Page (Inspects full instructions & criteria)
    Worker->>Web: Click "Ask Question in Public Q&A Thread"
    Web->>API: POST /api/v1/tasks/:id/qna (Content: "Are .csv files accepted?")
    API->>DB: INSERT INTO messages (isPublicQnA: true)
    API-->>Buyer: Notification: New Q&A question on your task
    Buyer->>Web: Reply: "Yes, .csv or .xlsx are both acceptable."
    Web->>API: POST /api/v1/tasks/:id/qna/:qId/reply
    API-->>Worker: Notification: Question answered. Task thread updated.
```

---

## 3. Buyer Task Creation Wizard Flow (Configurable Capacity)

```mermaid
flowchart TD
    Step1[Step 1: Category, Archetype & Model Selection] --> Step2[Step 2: Specifications, Instructions & Deliverable Types]
    Step2 --> Step3[Step 3: Worker Capacity, Unit Budget & Escrow Preview]
    Step3 --> Step4[Step 4: Acceptance Criteria, Milestones & SLAs]
    Step4 --> Step5[Step 5: Review, Policy Confirmation & Demo Escrow Lock]
    Step5 --> Published[Task OPEN on Marketplace with N Slots]
```

### Step 1: Category & Task Model Selection
- **Inputs**: Primary Category, Subcategory, Task Model (`MULTI_WORKER` or `FIRST_APPROVED`).

### Step 2: Task Instructions & Details
- **Inputs**: Task Title, Markdown Description, Required Skills, Deliverable Formats (Text, URL, File).

### Step 3: Capacity, Budget & Escrow Calculation
- **Inputs**: Configurable Worker Capacity ($N$, e.g., 50 slots), Unit Demo Budget per Slot ($B$, e.g., \$10.00).
- **Automated Breakdown**:
  - Gross Budget: $50 \times \$10.00 = \text{DEMO } \$500.00$
  - Buyer Platform Fee (2%): $\text{DEMO } \$10.00$
  - Total Demo Escrow Required: $\text{DEMO } \$510.00$
  - Insufficient Balance $\implies$ One-click **"Claim \$1,000 Demo Faucet Credit"** button.

### Step 4: Acceptance Criteria, Milestones & SLAs
- **Inputs**:
  - Minimum 2 discrete testable acceptance criteria items.
  - Optional Milestone Checkpoints (e.g. Milestone 1: Draft outline $\to 33\%$; Milestone 2: Final draft $\to 100\%$).
  - Start Deadline Hours (e.g. 6 hours to initiate activity).
  - Execution Duration Hours (e.g. 24 hours).
  - Maximum Allowed Revisions (default: 2).

### Step 5: Review & Atomic Demo Escrow Lock
- Displays comprehensive summary. Buyer confirms terms.
- System executes double-entry lock:
  - Debits `DEMO_BUYER_AVAILABLE` \$510.00.
  - Credits `DEMO_BUYER_ESCROW_RESERVED` \$510.00.
  - Task transitions to `OPEN` with 50 available slots.

---

## 4. Slot Acceptance, Milestones & Evidence Submission Flow

```mermaid
sequenceDiagram
    autonumber
    actor Worker as Worker Client
    participant Web as Next.js Web App
    participant API as NestJS Module
    participant DB as PostgreSQL
    participant Storage as Object Storage (S3/R2)

    Worker->>Web: Click "Accept Task Slot"
    Web->>API: POST /api/v1/tasks/:id/accept-slot
    API->>DB: Atomic row-level lock: Check available_slots > 0 & decrement
    API->>DB: INSERT INTO worker_participations (status: IN_PROGRESS)
    API-->>Web: Slot accepted. Start deadline timer begins (e.g. 6h).
    Worker->>Web: Upload Milestone 1 proof
    Web->>API: POST /api/v1/participations/:id/milestones/1/submit
    API-->>Web: Milestone submitted. Buyer notified.
    Note over Worker, Storage: Worker completes full deliverables
    Worker->>Web: Request pre-signed S3 upload URL
    Web->>API: POST /api/v1/storage/presigned-upload
    API-->>Web: Return pre-signed PUT URL (15m expiry)
    Web->>Storage: Direct client-to-storage file upload
    Worker->>Web: Click "Submit Deliverables" (Checklist attestations + S3 keys)
    Web->>API: POST /api/v1/participations/:id/submit
    API->>DB: Status transitions to SUBMITTED. 72h review timer starts.
    API-->>Web: Submission confirmed.
```

---

## 5. Review, `REVIEW_OVERDUE` & Escalation Flow

### 5.1 Buyer Approves Submission (Standard Path)
1. Buyer opens Task Participation Dashboard $\to$ Submissions Queue.
2. Selects Worker Submission. Reviews files, notes, and criteria attestations.
3. Clicks **"Approve Submission"**.
4. System executes atomic settlement:
   - Worker Net Demo Payout (96%): Credited to Worker's `DEMO_WORKER_AVAILABLE`.
   - Worker Commission (4%): Credited to `DEMO_SYSTEM_REVENUE`.
   - Buyer Surcharge (2%): Settled from `DEMO_BUYER_ESCROW_RESERVED` to `DEMO_SYSTEM_REVENUE`.
5. Slot status updates to `APPROVED`.
6. Buyer and Worker prompted for **Blind Two-Way Review**.

### 5.2 72-Hour Buyer Inactivity & Moderator Adjudication
1. Submission reaches Hour 72 without Buyer action.
2. Status updates to `REVIEW_OVERDUE`.
3. Automated critical notification sent to Buyer with final 24-hour response window.
4. Submission appears in the **Moderator Overdue Triage Console**.
5. At Hour 96: If Buyer remains inactive, an authorized Moderator audits the evidence against the objective criteria checklist.
   - **Criteria Met**: Moderator executes `APPROVED_BY_STAFF`. Funds released to Worker. Buyer assessed inactivity penalty.
   - **Criteria Unmet**: Moderator executes `REJECTED_BY_STAFF`. Escrow refunded to Buyer.
   - **Guaranteed Invariant**: Simulated earnings are never released without an explicit, valid settlement decision.
