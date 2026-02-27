# Requirements: ReviewPasta Cloudflare Migration

**Defined:** 2026-02-27
**Core Value:** Users can quickly generate authentic-sounding Google reviews without leaving the app

## v1 Requirements

Requirements for migrating ReviewPasta to Cloudflare stack. All existing features must continue working.

### Infrastructure

- [ ] **INFRA-01**: Frontend deployed to Cloudflare Pages with HTTPS
- [ ] **INFRA-02**: Auto-deploy configured (git push to main triggers CF Pages deployment)
- [ ] **INFRA-03**: D1 database created with businesses table schema
- [ ] **INFRA-04**: OpenRouter API key configured in Workers environment secrets
- [ ] **INFRA-05**: Wrangler configuration files created (wrangler.toml)
- [ ] **INFRA-06**: Build succeeds and produces deployable artifacts

### API - Business Operations

- [ ] **API-01**: GET /api/businesses returns all businesses ordered by created_at desc
- [ ] **API-02**: GET /api/businesses/:slug returns business by slug or 404
- [ ] **API-03**: POST /api/businesses creates new business with validation
- [ ] **API-04**: POST /api/businesses enforces unique slug constraint
- [ ] **API-05**: API handles CORS for cross-origin requests

### API - Review Generation

- [ ] **API-06**: POST /api/generate-review accepts businessName, location, stars, language
- [ ] **API-07**: POST /api/generate-review calls OpenRouter API with proper prompt
- [ ] **API-08**: POST /api/generate-review returns generated review text
- [ ] **API-09**: POST /api/generate-review handles API errors gracefully

### Frontend Integration

- [ ] **FE-01**: Frontend calls Workers API endpoints instead of Supabase
- [ ] **FE-02**: Supabase client library removed from package.json and imports
- [ ] **FE-03**: Environment variables updated (Workers API URL)
- [ ] **FE-04**: Error handling works for Workers API responses
- [ ] **FE-05**: IndexedDB/Dexie code removed (no longer needed with cloud DB)

### Feature Verification

- [ ] **FEAT-01**: User can add business (name, place_id, location, description)
- [ ] **FEAT-02**: User can view list of all businesses on homepage
- [ ] **FEAT-03**: User can navigate to review page for a business
- [ ] **FEAT-04**: User can select star rating (1-5)
- [ ] **FEAT-05**: User sees instant template-based review on rating selection
- [ ] **FEAT-06**: User can regenerate review using AI (OpenRouter)
- [ ] **FEAT-07**: User can edit generated review text
- [ ] **FEAT-08**: User can copy review to clipboard
- [ ] **FEAT-09**: User can open Google Reviews page for business
- [ ] **FEAT-10**: Multi-language support works (Romanian/English)
- [ ] **FEAT-11**: QR code generation works for business review links
- [ ] **FEAT-12**: SPA routing works (no 404s on page refresh)

## v2 Requirements

Deferred enhancements not needed for initial migration.

### Performance
- **PERF-01**: Implement caching for business listings
- **PERF-02**: Add edge caching for static assets
- **PERF-03**: Optimize D1 queries with indexes

### Features
- **NEW-01**: Admin dashboard for managing businesses
- **NEW-02**: Analytics tracking for review generation
- **NEW-03**: Export business data as CSV/JSON
- **NEW-04**: Bulk import businesses from CSV

## Out of Scope

| Feature | Reason |
|---------|--------|
| Data migration from Supabase | No existing production data to preserve |
| Custom domain configuration | Will configure manually via CF dashboard later |
| User authentication | App is public, no auth needed for MVP |
| Switching AI providers | OpenRouter working well, no need to change |
| Mobile native app | Web app sufficient for now |
| Real-time collaboration | Not needed for single-user workflow |
| Review history/versioning | Reviews are generated on-demand, not stored |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 - Foundation Setup | Pending |
| INFRA-02 | Phase 1 - Foundation Setup | Pending |
| INFRA-03 | Phase 1 - Foundation Setup | Pending |
| INFRA-04 | Phase 1 - Foundation Setup | Pending |
| INFRA-05 | Phase 1 - Foundation Setup | Pending |
| INFRA-06 | Phase 1 - Foundation Setup | Pending |
| API-01 | Phase 2 - Backend APIs | Pending |
| API-02 | Phase 2 - Backend APIs | Pending |
| API-03 | Phase 2 - Backend APIs | Pending |
| API-04 | Phase 2 - Backend APIs | Pending |
| API-05 | Phase 2 - Backend APIs | Pending |
| API-06 | Phase 2 - Backend APIs | Pending |
| API-07 | Phase 2 - Backend APIs | Pending |
| API-08 | Phase 2 - Backend APIs | Pending |
| API-09 | Phase 2 - Backend APIs | Pending |
| FE-01 | Phase 3 - Frontend Migration | Pending |
| FE-02 | Phase 3 - Frontend Migration | Pending |
| FE-03 | Phase 3 - Frontend Migration | Pending |
| FE-04 | Phase 3 - Frontend Migration | Pending |
| FE-05 | Phase 3 - Frontend Migration | Pending |
| FEAT-01 | Phase 4 - End-to-End Validation | Pending |
| FEAT-02 | Phase 4 - End-to-End Validation | Pending |
| FEAT-03 | Phase 4 - End-to-End Validation | Pending |
| FEAT-04 | Phase 4 - End-to-End Validation | Pending |
| FEAT-05 | Phase 4 - End-to-End Validation | Pending |
| FEAT-06 | Phase 4 - End-to-End Validation | Pending |
| FEAT-07 | Phase 4 - End-to-End Validation | Pending |
| FEAT-08 | Phase 4 - End-to-End Validation | Pending |
| FEAT-09 | Phase 4 - End-to-End Validation | Pending |
| FEAT-10 | Phase 4 - End-to-End Validation | Pending |
| FEAT-11 | Phase 4 - End-to-End Validation | Pending |
| FEAT-12 | Phase 4 - End-to-End Validation | Pending |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33/33 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-27 after roadmap creation*
