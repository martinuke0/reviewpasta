# Codebase Concerns

**Analysis Date:** 2026-02-27

## Security Considerations

**Exposed Credentials in Version Control:**
- Issue: `.env` file contains real Supabase credentials and OpenRouter API keys committed to git
- Files: `/Users/user/Downloads/reviewpasta/reviewpasta/.env`
- Risk: High - These credentials are exposed in public repository history. Attackers can access backend Supabase database and use OpenRouter API to generate reviews at no cost
- Recommendation: Immediately rotate all credentials in `.env`. Add `.env` to `.gitignore`. Use separate secrets management for production (GitHub Secrets, environment variables in deployment platform)

**API Key Exposure in Client:**
- Issue: OpenRouter API key is exposed in browser environment variables (`VITE_OPENROUTER_API_KEY`)
- Files: `src/lib/reviewGenerator.ts` (line 3)
- Risk: Medium - API key is visible in browser DevTools/Network requests, allowing anyone to make requests using the app's quota
- Recommendation: Move API calls to backend serverless function. Use Supabase Edge Functions or a proxy endpoint with proper rate limiting

**Unvalidated User Input in Google Place ID:**
- Issue: `place_id` is stored directly without validation that it's a valid Google Place ID format
- Files: `src/pages/AddBusiness.tsx` (lines 44, 77), `src/lib/supabaseDb.ts`
- Risk: Low-Medium - Users could inject arbitrary strings. When used in URL construction, could cause issues with Google reviews link
- Recommendation: Add regex validation: `^ChIJ[a-zA-Z0-9_-]+$` for Google Place IDs before storing

**Business Slug Collision Risk:**
- Issue: Slug generation is deterministic from business name; no uniqueness enforcement before database insert
- Files: `src/pages/AddBusiness.tsx` (line 38), `src/lib/db.ts` (line 67)
- Risk: Medium - With race conditions, two users could create the same slug simultaneously and lose data in second insert
- Recommendation: Add database-level unique constraint on `slug` column. Implement optimistic locking or retry logic with exponential backoff

---

## Tech Debt

**Dual Storage Architecture (IndexedDB + Supabase):**
- Issue: Code maintains parallel paths for both IndexedDB and Supabase storage using feature flag
- Files: `src/lib/db.ts` (USE_SUPABASE flag), `src/lib/supabaseDb.ts`, `src/lib/migration.ts`
- Impact: Doubles maintenance burden. Both paths must be tested. Easy to introduce bugs by fixing one path and forgetting the other
- Fix approach: Remove IndexedDB path entirely. If IndexedDB support is still needed, use it only as offline cache layer with clear sync semantics (all writes go to Supabase)

**Incomplete Migration Handling:**
- Issue: Migration runs on app startup but never shows user progress or errors. Uses localStorage flag that can't be easily reset
- Files: `src/lib/migration.ts`, `src/App.tsx` (no visible migration logic)
- Impact: If migration fails silently, users' old reviews are lost. localStorage flag prevents retry without manual intervention
- Fix approach: Add UI feedback for migration. Expose `resetMigration()` in dev tools. Log detailed errors to Sentry/monitoring

**Missing Error Boundaries:**
- Issue: App has no React Error Boundary component. A component crash in production crashes entire app with no recovery
- Files: `src/App.tsx`
- Impact: Any exception in rendering brings down entire app. Users lose their data entry/context
- Fix approach: Wrap App/Routes with error boundary that catches and logs errors, shows fallback UI, optionally resets state

---

## Performance Bottlenecks

**Synchronous QR Code Generation on Dialog Open:**
- Issue: QR code regenerates every time dialog opens or size/format changes, even if already cached
- Files: `src/components/QRCodeDialog.tsx` (lines 39-43)
- Impact: Unnecessary recomputation. With large size (1024px), generation may cause UI jank on slower devices
- Improvement path: Cache generated QR codes by `(slug, size, format)`. Only regenerate when truly needed. Add loading skeleton

**All Businesses Fetched on Every App Load:**
- Issue: `getAllBusinesses()` fetches all records with no pagination or filtering
- Files: `src/pages/Index.tsx` (line 17), `src/lib/supabaseDb.ts` (line 30)
- Impact: With 1000+ businesses, page becomes slow. No limit on query results
- Improvement path: Add pagination (limit to 50 per page). Implement search/filtering. Add IndexedDB cache with invalidation strategy

**Template String Interpolation in Every Review Generation:**
- Issue: Each instant review generation calls regex replace on template string
- Files: `src/pages/ReviewPage.tsx` (line 45), `src/lib/reviewGenerator.ts` (line 108)
- Impact: Negligible for current scale, but pattern doesn't scale to batch operations
- Improvement path: Pre-compile templates or use template engine. Not critical priority

---

## Known Bugs & Fragile Areas

**AddBusiness Error Recovery is Broken:**
- Issue: When `addBusiness()` throws error, `setSaving(false)` is called inside catch block but only after error message check
- Files: `src/pages/AddBusiness.tsx` (lines 51-54)
- Symptom: If error is thrown but not matched, user can't retry because button stays disabled
- Workaround: Reload the page
- Fix: Move `setSaving(false)` to finally block

**Silent Failure in Review Generation:**
- Issue: `generateReview()` falls back to templates if API fails, but doesn't distinguish between rate limit vs. network error
- Files: `src/lib/reviewGenerator.ts` (lines 197-203)
- Risk: High - User gets template review thinking it's AI-generated. No indication that AI call failed
- Fix: Show user which mode is active (template vs. AI). Log failure reason

**QR Code Memory Leak in Dialog:**
- Issue: When format changes from PNG to SVG, SVG blob is created with `URL.createObjectURL()` but never revoked
- Files: `src/components/QRCodeDialog.tsx` (line 55)
- Impact: Low - Dialog is typically closed shortly after, but repeated opens/closes leak memory
- Fix: Store SVG blob URLs in state and call `URL.revokeObjectURL()` on cleanup/unmount

**Supabase Client Initialization Unguarded:**
- Issue: Supabase client initializes even if env vars are missing/invalid
- Files: `src/integrations/supabase/client.ts` (lines 5-6, 11)
- Risk: Medium - Will throw cryptic error at runtime instead of startup
- Fix: Add validation in client initialization: `if (!SUPABASE_URL) throw new Error('...')`

---

## Missing Critical Features

**No Offline Support:**
- Issue: App requires internet connection. IndexedDB exists but is being phased out
- Impact: Customers can't fill out review forms without connectivity
- Blocks: Full field usability in poor networks

**No Input Validation on Critical Fields:**
- Issue: Business name, description not validated for length or content
- Files: `src/pages/AddBusiness.tsx` form inputs
- Impact: Could store spam/malicious content
- Recommendation: Add validation: business name 1-100 chars, description 0-500 chars, place_id matches format

**No Rate Limiting on Database Writes:**
- Issue: Any user can create unlimited businesses without throttling
- Files: `src/lib/supabaseDb.ts`, `src/lib/db.ts`
- Impact: Medium - Could be abused to flood database with spam
- Fix: Add RLS (Row Level Security) policy requiring authentication. Implement rate limiting middleware

**No Analytics or Monitoring:**
- Issue: No error tracking, no usage metrics, no warning for failures
- Impact: Can't see when users experience issues
- Recommendation: Add Sentry for error tracking. Add basic analytics (page views, errors) to Supabase or Mixpanel

---

## Test Coverage Gaps

**No Tests for Database Layer:**
- Files: `src/lib/db.ts`, `src/lib/supabaseDb.ts`
- What's not tested: Error paths, duplicate slug detection, migration logic
- Risk: High - Core functionality has zero test coverage
- Priority: High

**No Tests for Review Generation:**
- Files: `src/lib/reviewGenerator.ts`
- What's not tested: AI API failure fallback, template selection randomness, language switching
- Risk: Medium - Can't verify fallback behavior works
- Priority: High

**No Tests for QR Code Generation:**
- Files: `src/lib/qrcode.ts`
- What's not tested: SVG blob handling, URL revocation, download/share fallbacks
- Risk: Medium - The memory leak goes undetected
- Priority: Medium

**No Integration Tests:**
- Testing framework is configured but no integration tests exist
- Files: `src/test/setup.ts`, `src/test/example.test.ts` (placeholder)
- Risk: Medium - UI state flows untested
- Priority: Medium

---

## Scaling Limits

**Current Capacity:**
- Supabase free tier: 500K rows storage, 2GB data (sufficient for ~100K businesses)
- OpenRouter free tier: Limited requests, will hit quota quickly with user base growth

**Where It Breaks:**
- With 10,000+ active businesses, loading all on homepage becomes slow
- First 100 concurrent users generating reviews exhausts OpenRouter free quota

**Scaling Path:**
- Implement pagination/search (already mentioned above)
- Switch to paid OpenRouter plan or self-hosted LLM API
- Add caching layer (Redis) for popular businesses
- Implement Supabase pagination with cursor-based navigation

---

## Dependencies at Risk

**Supabase Types Generation:**
- Risk: Auto-generated types file can become out of sync with schema if not regenerated
- Files: `src/integrations/supabase/types.ts` (marked as auto-generated on line 1)
- Impact: TypeScript catches errors, but easy to forget to regenerate after schema changes
- Recommendation: Add git hook to prevent committing schema changes without regenerating types

**Dexie (IndexedDB) Deprecation Path Unclear:**
- Risk: If fully removing IndexedDB support, lots of dead code will exist until cleanup
- Files: `node_modules/dexie` dependency, `src/lib/db.ts` (both paths implemented)
- Recommendation: Create explicit deprecation timeline. Plan removal in next major version

---

## Environmental Configuration Issues

**Missing Environment Validation:**
- Issue: App doesn't validate required env vars at startup
- Files: `src/integrations/supabase/client.ts`, `src/lib/reviewGenerator.ts`
- Risk: Medium - Error occurs at first usage instead of startup
- Fix: Add validation function called in App.tsx before rendering

**No Build-Time Env Var Checking:**
- Issue: Vite embeds env vars at build time but no validation that they're set
- Files: `vite.config.ts` (not shown but implied)
- Risk: Could build with missing credentials
- Fix: Add pre-build validation script

---

*Concerns audit: 2026-02-27*
