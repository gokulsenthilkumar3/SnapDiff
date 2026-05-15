# SnapDiff — Product Requirements Document (PRD)

## 1. Overview

**Product Name:** SnapDiff  
**Tagline:** Catch visual bugs before your users do.  
**Type:** SaaS Visual Regression Testing Platform  
**Stack:** Next.js · TypeScript · Playwright · Supabase · GitHub Actions  
**Target Users:** Frontend developers, QA engineers, design teams using Vercel or Netlify  

---

## 2. Problem Statement

Every frontend deploy risks silent visual regressions — a padding shift, a broken layout, a missing component. Manual QA is slow and inconsistent. Existing tools like Percy.io and Chromatic are expensive ($400+/mo for teams). SnapDiff delivers automated screenshot diffing as a first-class CI step at a fraction of the cost.

---

## 3. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Adoption | Active projects | 100 in 3 months |
| Accuracy | False positive rate | < 2% |
| Speed | Screenshot capture time | < 30s per page |
| Revenue | MRR | $2,000 in 6 months |

---

## 4. Features

### 4.1 Core (MVP)
- [ ] GitHub App integration (auto-trigger on PR)
- [ ] Playwright headless screenshot capture
- [ ] Pixel-diff engine with threshold configuration
- [ ] Baseline management (approve/reject diffs)
- [ ] PR comment with diff preview image
- [ ] Supabase Storage for snapshot archive
- [ ] Dashboard: project list, build history, diff viewer

### 4.2 Growth (Post-MVP)
- [ ] Vercel webhook integration (auto-trigger on preview deploy)
- [ ] Multi-viewport testing (mobile · tablet · desktop)
- [ ] Ignore regions (mask dynamic content like dates, ads)
- [ ] Slack / email notifications on regression detected
- [ ] Component-level screenshot support (Storybook integration)
- [ ] Team roles and multi-project management

---

## 5. Architecture

```
  GitHub PR / Vercel Deploy Webhook
           │
           ▼
┌───────────────────────────────┐
│     Webhook Receiver (Node.js)   │
│     — validates GitHub signature │
│     — queues screenshot job      │
└───────────┬──────────────────┘
           │ BullMQ Job Queue
           ▼
┌───────────────────────────────┐
│    Screenshot Worker             │
│    — Playwright headless Chrome  │
│    — captures N pages/routes     │
│    — uploads PNGs to Supabase    │
└───────────┬──────────────────┘
           │
           ▼
┌───────────────────────────────┐
│    Diff Engine                   │
│    — pixelmatch / sharp lib      │
│    — generates diff PNG overlay  │
│    — computes diff % score       │
└───────────┬──────────────────┘
           │
    ┌─────┴─────┐
    │           │
    ▼           ▼
Supabase     GitHub PR
Storage      Comment API
(snapshots)  (posts diff image)
    │
    ▼
Next.js Dashboard
— build history
— diff viewer (approve/reject)
— baseline management
```

---

## 6. Database Schema

```sql
projects (
  id uuid PK,
  user_id uuid FK,
  name varchar(255),
  repo_url varchar(500),
  base_url varchar(500),       -- production URL
  routes text[],               -- ["/", "/about", "/dashboard"]
  diff_threshold float,        -- 0.01 = 1% pixel change = regression
  created_at timestamptz
)

builds (
  id uuid PK,
  project_id uuid FK,
  trigger varchar(50),         -- pr | manual | webhook
  pr_number integer,
  branch varchar(255),
  status varchar(20),          -- pending | running | passed | failed
  created_at timestamptz
)

snapshots (
  id uuid PK,
  build_id uuid FK,
  route varchar(500),
  viewport varchar(50),        -- desktop | tablet | mobile
  screenshot_url text,         -- Supabase Storage URL
  baseline_url text,
  diff_url text,
  diff_percent float,
  status varchar(20),          -- approved | rejected | pending
  created_at timestamptz
)
```

---

## 7. Config File (snapdiff.config.json)

```json
{
  "projectId": "your-project-uuid",
  "baseUrl": "https://yourapp.vercel.app",
  "routes": ["/", "/login", "/dashboard", "/settings"],
  "viewports": ["desktop", "mobile"],
  "threshold": 0.01,
  "ignoreRegions": [
    { "route": "/dashboard", "selector": ".live-clock" }
  ]
}
```

---

## 8. GitHub Actions Integration

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression
on: [pull_request]
jobs:
  snapdiff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run SnapDiff
        uses: gokulsenthilkumar3/snapdiff-action@v1
        with:
          project-id: ${{ secrets.SNAPDIFF_PROJECT_ID }}
          api-key: ${{ secrets.SNAPDIFF_API_KEY }}
          preview-url: ${{ steps.vercel.outputs.preview-url }}
```

---

## 9. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Node.js + Express webhook receiver |
| Screenshot Engine | Playwright (headless Chromium) |
| Diff Engine | pixelmatch + sharp |
| Queue | BullMQ + Redis |
| Storage | Supabase Storage |
| Database | Supabase PostgreSQL |
| Deployment | Vercel (frontend) · Render (worker + API) |

---

## 10. Monetization

| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 1 project, 500 screenshots/mo |
| Starter | $18/mo | 5 projects, 5,000 screenshots/mo |
| Pro | $49/mo | 20 projects, unlimited screenshots |
| Enterprise | Custom | On-prem worker, SSO, SLA |

---

## 11. Milestones

| Week | Deliverable |
|------|-------------|
| 1–2 | Playwright worker + screenshot capture |
| 3–4 | Diff engine + Supabase Storage integration |
| 5–6 | GitHub App + PR comment poster |
| 7–8 | Next.js dashboard (build history + diff viewer) |
| 9–10 | Vercel webhook + multi-viewport support |
| 11–12 | Pricing, billing (Stripe), Product Hunt launch |
