# EarnXpress — Design System & Visual Architecture Specification

| Metadata | Details |
| :--- | :--- |
| **Document Version** | 1.1.0-AUDITED |
| **Project Code** | EX-DESIGN |
| **Document Status** | Approved for Development Foundation |
| **Classification** | Master Design System Specification |
| **Last Updated** | 2026-11-03 |
| **Brand Identity** | EarnXpress — Open International Task Marketplace |

---

## 1. Brand Personality & Core Tenets

**EarnXpress** embodies a visual direction that is **modern, minimal, elegant, trustworthy, and international**:
1. **Precision & High Data Density**: Clean layout, purposeful typography, and dense information architecture suitable for multi-worker campaigns.
2. **Prominent DEMO Branding**: Every monetary indicator must display a prominent **DEMO** badge to prevent any confusion with real-world financial assets.
3. **Subtle Authority**: Deep Navy canvas paired with an energetic, focused Teal accent.
4. **Universal Accessibility**: 100% WCAG 2.1 Level AA compliance (minimum contrast ratio $\ge 4.5:1$, visible focus rings, full keyboard accessibility).

---

## 2. Color Palette & Theme Tokens

| Design Token | Light Mode Value | Dark Mode Value | Semantic Role |
| :--- | :--- | :--- | :--- |
| `--background` | `#F8FAFC` (Slate 50) | `#0B1120` (Midnight Navy) | Root application canvas |
| `--surface` | `#FFFFFF` (Pure White) | `#131C31` (Deep Slate Navy) | Card & modal background |
| `--surface-raised`| `#F1F5F9` (Slate 100) | `#1E293B` (Slate 800) | Table headers, active rows |
| `--primary` | `#0F172A` (Slate 900) | `#38BDF8` (Sky 400) | Primary headers & buttons |
| `--accent` | `#0D9488` (Teal 600) | `#14B8A6` (Teal 500) | Interactive CTAs, active pills |
| `--accent-hover` | `#0F766E` (Teal 700) | `#2DD4BF` (Teal 400) | Hover state for accent buttons |
| `--text-primary` | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | Primary copy & titles |
| `--text-secondary`| `#475569` (Slate 600) | `#94A3B8` (Slate 400) | Meta labels, timestamps |
| `--border` | `#E2E8F0` (Slate 200) | `#1E293B` (Slate 800) | Dividers & card outlines |
| `--color-success` | `#16A34A` (Green 600) | `#22C55E` (Green 500) | Approved, verified, funds credited |
| `--color-warning` | `#D97706` (Amber 600) | `#F59E0B` (Amber 500) | Overdue review, revision requested |
| `--color-danger` | `#DC2626` (Red 600) | `#EF4444` (Red 500) | Rejected, disputed, cancelled |

---

## 3. Specialized Marketplace Components

### 3.1 Task Participation Dashboard
Rendered on every task details page to provide transparent capacity metrics:
```text
┌────────────────────────────────────────────────────────────────────────┐
│  CAPACITY & PARTICIPATION OVERVIEW                                      │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────────┤
│ Total Slots │ In Progress │ Submitted   │ Approved    │ Remaining Open │
│ 100         │ 35 Working  │ 8 Pending   │ 5 Settled   │ 50 Available   │
└─────────────┴─────────────┴─────────────┴─────────────┴────────────────┘
```
- **Public Aggregate View**: Anyone can view the overall counts.
- **Authorized Detail View**: Task Buyers and Staff can toggle an expandable list showing assigned workers, milestone completion, and submission status.

### 3.2 Milestone Progress Tracker (Verifiable Checkpoints)
- Replaces self-reported percentage sliders with discrete, verified milestone checkpoints:
```text
[✓ Step 1: Research Plan] ─── [✓ Step 2: Draft Document] ─── [○ Step 3: Final Edits]
Progress: 66% (2 of 3 Verified Milestones Completed)
```
- Progress percentages update **only** when a milestone evidence submission is confirmed by the Buyer or Staff.

### 3.3 Prominent DEMO Financial Badges
- Every balance card, unit price tag, and transaction row includes an unambiguous DEMO pill:
  `<span class="badge-demo">DEMO</span> $10.00 USD`
- Background: `#FEF3C7` (Amber 100), Text: `#92400E` (Amber 800), Border: `1px solid #FCD34D`.

### 3.4 In-Platform Public Q&A Thread
- Clean, threaded accordion on task details page where Workers can post questions and Buyers can post official clarifications.
- Answered questions receive a green "Buyer Answered" badge to help other prospective workers understand the requirements.

### 3.5 Task Management Action Bar (Buyer Console)
- Crisp action buttons for campaign control:
  - `btn-secondary`: **Pause Task** / **Resume Task**
  - `btn-warning`: **Close Remaining Slots** (with refund preview dialog)
  - `btn-danger`: **Cancel Task** (with milestone compensation review modal)
