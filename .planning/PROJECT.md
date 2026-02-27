# ReviewPasta - Cloudflare Migration

## What This Is

A migration project to move ReviewPasta (a Google review generator app) from Supabase backend to full Cloudflare stack. Users can add businesses, select star ratings, generate AI-powered reviews, and copy them to post on Google. The app is a React SPA with multi-language support (Romanian default).

## Core Value

Users can quickly generate authentic-sounding Google reviews for their businesses without leaving the app, with instant template-based generation and optional AI enhancement.

## Requirements

### Validated

<!-- Existing functionality that's already working and must continue working -->

- ✓ Users can add businesses with name, Google Place ID, location, and description — existing
- ✓ Users can view list of all businesses — existing
- ✓ Users can navigate to review page for any business — existing
- ✓ Users can select star rating (1-5 stars) — existing
- ✓ Users can see instant review generated from templates — existing
- ✓ Users can regenerate review with AI (OpenRouter GPT-4o-mini) — existing
- ✓ Users can edit the generated review text — existing
- ✓ Users can copy review to clipboard — existing
- ✓ Users can open Google Reviews page for that business — existing
- ✓ Multi-language support (Romanian, English) — existing
- ✓ QR code generation for business review links — existing
- ✓ App works as SPA with client-side routing — existing

### Active

<!-- Current scope for this migration project -->

- [ ] Frontend deployed to Cloudflare Pages with HTTPS
- [ ] Auto-deploy configured (git push to main → CF Pages deployment)
- [ ] D1 database created with businesses table schema
- [ ] Cloudflare Workers API: GET /api/businesses (list all)
- [ ] Cloudflare Workers API: GET /api/businesses/:slug (get by slug)
- [ ] Cloudflare Workers API: POST /api/businesses (add new business)
- [ ] Cloudflare Workers API: POST /api/generate-review (AI review generation)
- [ ] Frontend calls Workers API instead of Supabase
- [ ] Supabase client library removed from codebase
- [ ] OpenRouter API key configured in Workers secrets
- [ ] Build succeeds and app loads on CF Pages URL
- [ ] All features work end-to-end on CF Pages

### Out of Scope

- Custom domain configuration — will configure manually via CF dashboard later
- Data migration from Supabase — no existing production data to preserve
- User authentication — app is public, no auth needed
- Switching AI providers — keeping OpenRouter
- Mobile native app — web-only for now
- Real-time features — not needed for this use case

## Context

**Existing Implementation:**
- Vite + React + TypeScript + Tailwind CSS stack
- Currently deployed elsewhere (likely Vercel based on existing dist build)
- Has feature flag system: VITE_USE_SUPABASE toggles between Supabase and IndexedDB (Dexie)
- Uses OpenRouter API (GPT-4o-mini model) for AI review generation
- Has template-based instant review generation as fast fallback
- Romanian set as default language via recent commit

**Current Supabase Usage:**
- Database: Single `businesses` table (id, name, slug, place_id, location, description, created_at)
- Edge Function: `generate-review` calls OpenRouter API with business context + star rating
- No auth, storage, or real-time features being used

**Migration Rationale:**
- User has Cloudflare subscription and wants to consolidate infrastructure
- All-in on CF ecosystem for simplified operations
- D1 + Workers provides similar capabilities to Supabase for this use case

## Constraints

- **Tech Stack**: Must use Cloudflare Pages (frontend), Workers (API), D1 (database) — architectural decision
- **API Provider**: Keep OpenRouter for AI generation — existing integration, no need to change
- **No Breaking Changes**: All existing features must continue working after migration — user expectation
- **Deployment**: Must support auto-deploy on git push — user requirement for CI/CD

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cloudflare D1 over IndexedDB | Cloud-synced database accessible from any device vs local-only storage | — Pending |
| Keep OpenRouter integration | Already integrated, working well, no reason to switch | — Pending |
| Remove Supabase entirely | No features beyond database + edge function being used, cleaner to remove fully | — Pending |
| Single Workers script | All API routes in one Worker for simplicity (businesses + generate-review) | — Pending |

---
*Last updated: 2026-02-27 after initialization*
