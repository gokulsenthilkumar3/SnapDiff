# SnapDiff

> **Catch visual bugs before your users do.** Automated screenshot diffing for every Vercel deploy and GitHub PR.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Problem
Silent visual regressions ship to production daily. Existing tools (Percy, Chromatic) cost $400+/mo for teams.

## Solution
SnapDiff is an affordable, zero-config visual regression CI step for Next.js and React apps.

## Key Features
- 📸 Playwright-powered headless screenshot capture
- 🔍 Pixel-accurate diff engine with threshold control
- 💬 GitHub PR comment with diff preview
- ✅ One-click approve/reject baseline workflow
- 📱 Multi-viewport testing (desktop · tablet · mobile)

## Tech Stack
`Next.js` · `TypeScript` · `Playwright` · `Supabase` · `BullMQ` · `Redis`

## Docs
See [PRD.md](PRD.md) for full product requirements and architecture.

## License
MIT
