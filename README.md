# raw-frontend

A clean, TypeScript-first Next.js frontend for high-volume media workflows and fast previews — designed to pair with a Python backend for processing and APIs. This README is written to highlight the project for recruiters and for technical interview walkthroughs.

---

![License](https://img.shields.io/badge/license-MIT-blue)
![Languages](https://img.shields.io/badge/TypeScript-%E2%89%A087%25-brightgreen)

## TL;DR
A modern, responsive Next.js frontend (TypeScript) focused on fast media upload, previewing, and a component-driven developer experience. Built with performance and accessibility in mind, this repo showcases frontend engineering skills suitable for a frontend or full-stack position.

## What this is
A Next.js + TypeScript frontend that provides an efficient UI for uploading, previewing, and interacting with large media files (for example RAW images or videos). It offloads CPU-heavy work (conversions, ML inference, long-running jobs) to a companion Python backend via REST or WebSockets.

### Stack
- **Language(s):** TypeScript (primary), Python (optional backend), CSS
- **Framework / runtime:** Next.js (App Router) + Node.js
- **Notable libraries:** Next.js, React, (Tailwind CSS / CSS Modules), (SWR / React Query) — replace with concrete libs used in the repo

## Recruiter snapshot (what to mention in interviews or your CV)
- Role: Frontend Engineer (TypeScript / React / Next.js)
- Scope: Implemented component architecture, accessibility improvements, performance optimizations, and API integration with a Python backend.
- Impact examples to quantify in an interview: reduced initial load time, improved Lighthouse score, or increased upload throughput (replace with your data).

---

## Key features to demo
- Responsive UI with accessible components (ARIA, keyboard navigation)
- File upload flow with progress and preview (client-side optimizations like thumbnails and lazy loading)
- Typed API client (centralized error handling and retries)
- Component-driven architecture and scoped styles
- Test coverage for critical UI and upload flow (unit + integration)

---

## Project structure (high-level)
```
app/             Next.js App Router pages and route handlers
src/
  components/    Reusable UI components (buttons, inputs, modals)
  features/      Feature modules (upload, preview, editor)
  lib/           API clients, utilities, hooks
  styles/        Global styles and design tokens
public/          Static assets and images
backend/         (optional) Python API for processing and jobs
tests/           Unit and integration tests
```
How it fits together: Next.js handles page rendering and client routing. UI components live in `src/components`. Upload flow is implemented in `src/features/upload` and talks to the backend via typed client code in `src/lib/api`. Heavy processing is delegated to the Python backend.

---

## Quickstart — shortest path from clone to running
These commands match this repository's default Next.js project layout.

Prerequisites
- Node.js 18+ recommended
- npm, yarn, or pnpm
- (Optional) Python 3.10+ if running a local backend

Commands
```bash
# clone and enter repo
git clone https://github.com/ei-akuloff/raw-frontend.git
cd raw-frontend

# install dependencies
npm install

# run dev server
npm run dev
# open http://localhost:3000

# build for production
npm run build
npm start

# run tests (if present)
npm test
```

Backend (optional)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# run local API (example for FastAPI)
uvicorn app.main:app --reload
```

Environment variables (examples)
- NEXT_PUBLIC_API_URL — URL of the backend API (e.g. http://localhost:8000)
- AUTH_CLIENT_ID / AUTH_CLIENT_SECRET — OAuth credentials, if used

---

## How to present this project to recruiters / interviewers
1. Start with the problem it solves: fast, collaborative previewing and handling of large media files.
2. Show the component architecture: open `src/components/UploadManager` (or equivalent) and explain props, local state, and tests.
3. Walk through the upload flow and how errors/retries are handled in `src/lib/api`.
4. Run a demo: start dev server, show upload, preview generation, and a network trace for performance notes.

---

## Tests & CI
- Unit tests: Jest + React Testing Library (or repository-specific stack)
- E2E: (Cypress / Playwright) — add commands here if present
- CI: Add badges and CI configuration details if available in `.github/workflows`.

---

## Contributing
1. Fork the repository
2. Create a branch: `git checkout -b feat/your-feature`
3. Add tests and documentation for changes
4. Open a PR describing the change and rationale

---

## License
This project uses the LICENSE in the repository (MIT suggested). Make sure the LICENSE file matches.

---

## Contact
Maintainer: ei-akuloff — https://github.com/ei-akuloff

If you want this README customized with exact dependencies, badges, screenshots, or a short architecture SVG, reply and I will update it and commit again.