# EarnXpress — RESTful API Specification (OpenAPI 3.1 Architecture)

| Metadata | Details |
| :--- | :--- |
| **Document Version** | 1.1.0-AUDITED |
| **Project Code** | EX-API |
| **Document Status** | Approved for Development Foundation |
| **Classification** | Master API Specification |
| **Last Updated** | 2026-11-03 |
| **Base URL** | `https://api.earnxpress.com/api/v1` |

---

## 1. Technical Architecture & HTTP Engine Evaluation

### 1.1 NestJS HTTP Adapter Evaluation: Express vs. Fastify
- **Evaluation**: NestJS natively supports both `platform-express` and `platform-fastify`.
  - **Fastify**: High raw throughput, but exhibits ecosystem friction with complex multipart file streams, certain Passport.js cookie flows, and specific Swagger/OpenAPI decorators.
  - **Express**: Industry-standard, 100% compatible with the entire Node.js middleware ecosystem (Helmet, Cookie-Parser, Multer, Passport), and guaranteed zero-friction integration with mobile clients.
- **Architectural Decision**: **Adopt Express** as the default HTTP engine for NestJS in Phase 1. If high-throughput micro-benchmarks dictate, Fastify can be toggled without rewriting domain modules.

### 1.2 Global Response Envelopes
All responses follow strict standardized JSON envelopes:
```json
// Success Response (HTTP 200/201)
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "limit": 20, "totalCount": 150, "totalPages": 8 },
  "timestamp": "2026-11-03T20:15:00.000Z"
}

// Error Response (HTTP 4xx/5xx)
{
  "success": false,
  "error": {
    "code": "ERR_SLOT_UNAVAILABLE",
    "message": "All slots for this task have been claimed or closed.",
    "details": []
  },
  "timestamp": "2026-11-03T20:15:00.000Z"
}
```

---

## 2. Authentication & Account Security (`/api/v1/auth`)

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new Buyer or Worker account. |
| `POST` | `/auth/login` | Public | Authenticate user; returns JWT & sets secure refresh cookie. |
| `POST` | `/auth/refresh` | Public | Rotate refresh token; issues new short-lived access token. |
| `POST` | `/auth/logout` | Authenticated | Revoke refresh token and invalidate current session. |
| `POST` | `/auth/re-authenticate`| Authenticated | Re-verify credentials/TOTP before sensitive operations. |
| `POST` | `/auth/mfa/setup` | Authenticated | Generate TOTP secret and QR code URI. |
| `POST` | `/auth/mfa/verify` | Authenticated | Validate TOTP token and activate MFA. |

---

## 3. Open Marketplace Task Catalog (`/api/v1/tasks`)

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/tasks` | Public | Filterable task catalog (category, model, budget, slots, deadline). |
| `GET` | `/tasks/:id` | Public | Full task details, versioned instructions, and participation overview. |
| `GET` | `/tasks/:id/participation-stats`| Public | Aggregate dashboard stats (capacity, working, submitted, approved). |
| `POST` | `/tasks` | Buyer | Create new task draft or publish via 5-step wizard. |
| `POST` | `/tasks/:id/pause` | Task Buyer | Pause new slot reservations. Active workers continue. |
| `POST` | `/tasks/:id/resume`| Task Buyer | Reopen paused task to the open marketplace. |
| `POST` | `/tasks/:id/close-remaining-slots`| Task Buyer | Close unclaimed slots; refund unallocated demo escrow. |
| `POST` | `/tasks/:id/cancel` | Task Buyer | Cancel campaign. Evaluate verified milestones for compensation. |

#### Request DTO: `CreateTaskDto`
```typescript
interface CreateTaskDto {
  title: string;
  categoryId: string;
  subcategoryId: string;
  taskModel: 'MULTI_WORKER' | 'FIRST_APPROVED';
  totalSlots: number; // Configurable worker capacity (e.g. 1 to 500)
  unitBudgetCents: number; // Integer USD cents
  startDeadlineHours: number; // e.g. 6 hours to initiate activity
  completionDurationHours: number; // e.g. 24 hours total duration
  reviewSlaHours: number; // default 72
  maxRevisions: number; // default 2
  descriptionMarkdown: string;
  acceptanceCriteria: Array<{ key: string; description: string }>;
  deliverableRequirements: Array<{ type: 'TEXT' | 'URL' | 'FILE'; label: string }>;
  milestonePlan?: Array<{ order: number; title: string; description: string }>;
}
```

---

## 4. In-Platform Collaboration & Public Q&A (`/api/v1/tasks/:id/conversations`)

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/tasks/:id/qna` | Public | View public clarifying questions and Buyer responses. |
| `POST` | `/tasks/:id/qna` | Worker | Post public question requesting instruction clarification. |
| `POST` | `/tasks/:id/qna/:qId/reply`| Task Buyer | Answer public question regarding requirements. |
| `GET` | `/participations/:id/messages`| Participant | Private communication thread between Buyer and Worker. |
| `POST` | `/participations/:id/messages`| Participant | Send message or attachment regarding active work. |

---

## 5. Worker Participation, Milestones & Submissions (`/api/v1/participations`)

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/tasks/:id/accept-slot` | Worker | Atomically claim slot; start deadline timer initiates. |
| `POST` | `/participations/:id/milestones/:mId/verify`| Task Buyer | Verify milestone proof; updates progress percentage. |
| `POST` | `/participations/:id/submit` | Assigned Worker| Submit deliverable evidence (creates `SubmissionVersion`). |
| `POST` | `/participations/:id/approve` | Task Buyer | Approve submission; disburse net demo earnings (-4%). |
| `POST` | `/participations/:id/revise` | Task Buyer | Request deliverable revision (cites specific criteria key). |
| `POST` | `/participations/:id/reject` | Task Buyer | Reject submission with mandatory objective grounds. |
| `POST` | `/participations/:id/appeal` | Assigned Worker| Appeal rejection; escalates case to `DISPUTED`. |

#### Request DTO: `SubmitDeliverablesDto`
```typescript
interface SubmitDeliverablesDto {
  textNotes?: string;
  deliverableUrls?: string[];
  fileAttachmentKeys?: string[];
  criteriaAttestations: Array<{ key: string; confirmed: boolean }>;
}
```

---

## 6. Simulated Financial Engine (`/api/v1/demo-finance`)

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/demo-finance/wallets` | Authenticated | Inspect Available, Escrow Reserved, and Pending Demo Balances. |
| `POST` | `/demo-finance/faucet` | Buyer / Dev | Claim \$1,000.00 virtual Demo Balance to test task funding. |
| `GET` | `/demo-finance/transactions` | Authenticated | Paginated double-entry Demo Transaction history. |
| `GET` | `/demo-finance/fx-snapshots` | Public | Indicative local currency conversion rates (BDT, EUR, GBP, INR). |

---

## 7. Administrative Governance & Moderation (`/api/v1/admin`)

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/review-overdue` | Moderator / Owner | Queue of submissions pending $> 72$ hours without Buyer action. |
| `POST` | `/admin/participations/:id/adjudicate-overdue`| Moderator / Owner | Inspect evidence and execute binding staff approval/rejection. |
| `POST` | `/admin/disputes/:id/resolve`| Moderator / Owner | Arbitrate disputed slot (Full Worker, Full Buyer, or Split). |
| `PATCH`| `/admin/users/:id/sanction` | Moderator / Owner | Issue warning, slot restriction, suspension, or ban. |
| `POST` | `/admin/users/:id/role` | **Platform Owner Only** | Grant or revoke administrative staff privileges. |
| `GET` | `/admin/audit-logs` | Staff (Read-Only) | Filter immutable append-only audit trail. |
