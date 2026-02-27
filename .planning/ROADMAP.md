# Roadmap: ReviewPasta Cloudflare Migration

**Created:** 2026-02-27
**Depth:** Quick (4 phases)
**Coverage:** 33/33 v1 requirements mapped

## Overview

Migrate ReviewPasta from Supabase backend to full Cloudflare stack (Pages + Workers + D1). Foundation setup enables backend API development, which enables frontend migration, which enables full feature verification.

## Phases

### Phase 1: Foundation Setup

**Goal:** Cloudflare infrastructure is configured and ready for development

**Dependencies:** None (starting phase)

**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06

**Success Criteria:**
1. Frontend successfully deploys to Cloudflare Pages with HTTPS URL
2. Git push to main branch automatically triggers new deployment
3. D1 database exists with businesses table schema (id, name, slug, place_id, location, description, created_at)
4. Build process completes without errors and produces deployable artifacts
5. OpenRouter API key stored securely in Workers environment

### Phase 2: Backend APIs

**Goal:** Workers API provides all business operations and review generation functionality

**Dependencies:** Phase 1 (requires D1 database and Workers configuration)

**Requirements:** API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09

**Success Criteria:**
1. GET /api/businesses returns all businesses ordered by created_at descending
2. GET /api/businesses/:slug returns specific business or 404 for invalid slug
3. POST /api/businesses creates new business with validation and enforces unique slugs
4. POST /api/generate-review calls OpenRouter API and returns generated review text
5. All API endpoints handle CORS and errors gracefully

### Phase 3: Frontend Migration

**Goal:** Frontend uses Workers API instead of Supabase for all operations

**Dependencies:** Phase 2 (requires functioning Workers API)

**Requirements:** FE-01, FE-02, FE-03, FE-04, FE-05

**Success Criteria:**
1. All API calls target Workers endpoints instead of Supabase
2. Supabase client library completely removed from codebase
3. Environment variables configured for Workers API URL
4. Frontend handles Workers API responses and errors correctly
5. IndexedDB/Dexie code removed (cloud database replaces local storage)

### Phase 4: End-to-End Validation

**Goal:** All ReviewPasta features work correctly on Cloudflare Pages

**Dependencies:** Phase 3 (requires migrated frontend)

**Requirements:** FEAT-01, FEAT-02, FEAT-03, FEAT-04, FEAT-05, FEAT-06, FEAT-07, FEAT-08, FEAT-09, FEAT-10, FEAT-11, FEAT-12

**Success Criteria:**
1. User can add new business and see it appear in business list immediately
2. User can select business, choose star rating, and see instant template-based review
3. User can regenerate review using AI and get different OpenRouter-generated text
4. User can edit review text, copy to clipboard, and open Google Reviews page
5. Multi-language support works (Romanian/English), QR codes generate correctly, and SPA routing works without 404s on refresh

## Progress

| Phase | Status | Requirements | Completion |
|-------|--------|--------------|------------|
| 1 - Foundation Setup | Pending | 6 | 0% |
| 2 - Backend APIs | Pending | 9 | 0% |
| 3 - Frontend Migration | Pending | 5 | 0% |
| 4 - End-to-End Validation | Pending | 12 | 0% |

**Overall:** 0/33 requirements complete (0%)

## Next Actions

1. Run `/gsd:plan-phase 1` to create execution plan for Foundation Setup
2. Execute Phase 1 plan to configure Cloudflare infrastructure
3. Verify Phase 1 success criteria before proceeding to Phase 2

---
*Roadmap created: 2026-02-27*
*Last updated: 2026-02-27*
