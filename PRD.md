# PRD — SnapDiff

## Overview
SnapDiff is a visual regression testing SaaS that automatically captures, compares, and diffs UI screenshots across Vercel preview deployments and production. It integrates with GitHub Actions and Vercel webhooks for zero-config setup.

---

## Problem Statement
Frontend teams ship visual bugs constantly — broken layouts, shifted elements, wrong colors — that unit tests and linters never catch. Existing tools like Percy.io are expensive ($599+/mo for teams). There is no affordable, developer-friendly alternative.

---

## Goals
- Auto-capture screenshots on every Vercel preview deploy
- Pixel-level diff against the last approved baseline
- GitHub PR comment with visual diff report
- One-click approve/reject baseline update
- Zero manual configuration for Next.js and React apps

---

## Non-Goals
- Not a full E2E testing platform
- No video recording
- No mobile device emulation (v1)

---

## Target Users
- Frontend developers using Vercel + GitHub
- QA engineers on React/Next.js projects
- SDET teams running automated regression suites

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| Screenshot Engine | Playwright (headless Chromium) |
| Frontend Dashboard | Next.js 14, TypeScript, Tailwind |
| Backend | Node.js + Express |
| Storage | Supabase Storage (PNG snapshots) |
| Database | Supabase PostgreSQL |
| CI Integration | GitHub Actions, Vercel webhook |
| Diff Algorithm | pixelmatch (pixel-level diff) |
| Notifications | GitHub PR comments, Slack webhook |
| Deployment | Vercel (dashboard), Render (worker) |

---

## Database Schema
```
projects (id, name, github_repo, vercel_project_id, owner_id)
baselines (id, project_id, url, screenshot_url, approved_at)
snapshots (id, project_id, deployment_url, screenshot_url, diff_url, diff_percent, status, created_at)
runs (id, project_id, commit_sha, deployment_url, status, created_at)
```

---

## Core Features

### v1.0 (MVP)
- [ ] GitHub App installation + Vercel webhook setup
- [ ] Auto-screenshot on preview deployment
- [ ] Pixel diff against baseline
- [ ] GitHub PR comment with diff image
- [ ] Approve baseline button in dashboard

### v1.1
- [ ] Multi-page crawl (auto-discover routes)
- [ ] Viewport configuration (desktop, tablet, mobile)
- [ ] Slack and email notifications

### v2.0
- [ ] Team workspaces
- [ ] Diff threshold configuration per project
- [ ] Historical diff timeline view
- [ ] Self-host Docker option

---

## Business Model
| Plan | Price | Limits |
|------|-------|--------|
| Free | $0 | 1 project, 100 snapshots/mo |
| Pro | $18/mo | 5 projects, 2,000 snapshots/mo |
| Team | $49/mo | Unlimited projects, 10,000 snapshots/mo |

**Competitive edge:** Percy starts at $599/mo. SnapDiff targets indie devs and small teams at 97% lower cost.

---

## Success Metrics
- 200 GitHub App installs in first 2 months
- 10% free → paid conversion
- < 60s from deployment to diff report
- NPS > 50

---

## Risks
| Risk | Mitigation |
|------|------------|
| Playwright infra cost | Run workers on Render spot instances |
| High storage costs | Auto-delete snapshots older than 30 days on free plan |
| GitHub App trust | Open-source the GitHub App code |
