# External Integrations

**Analysis Date:** 2026-02-27

## APIs & External Services

**AI Review Generation:**
- OpenRouter AI - Generates natural language reviews based on business details and ratings
  - SDK/Client: Native `fetch` API with Bearer token authentication
  - Endpoint: `https://openrouter.ai/api/v1/chat/completions`
  - Auth: `VITE_OPENROUTER_API_KEY` environment variable
  - Fallback: Template-based review generation with 80+ pre-written templates in English and Romanian
  - Model: Auto-selected free model
  - Features: Supports 1-5 star ratings with tone variations (positive, neutral, disappointed, critical)

**Google Services:**
- Google Places API (implicit integration)
  - Usage: Business identification via Google Place ID (`place_id` field stored in database)
  - Purpose: Linking reviews to specific businesses
  - Implementation: Client provides Place ID manually during business registration

## Data Storage

**Databases:**

Primary (Feature-flagged):
- Supabase PostgreSQL
  - Connection: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
  - Client: `@supabase/supabase-js` v2.97.0
  - Authentication: Supabase auth with localStorage session persistence
  - Tables: `businesses` (id, name, slug, place_id, location, description, created_at)
  - Location: `src/integrations/supabase/` with auto-generated TypeScript types

Fallback/Local:
- Dexie (IndexedDB wrapper)
  - Database: `ReviewPastaDB` in browser IndexedDB
  - Schema: `businesses` table with indexes on (id, slug, created_at)
  - Purpose: Offline storage when Supabase is unavailable
  - Location: `src/lib/db.ts`
  - Feature toggle: `VITE_USE_SUPABASE=true` enables Supabase, `false` uses IndexedDB only

**File Storage:**
- Local filesystem only - No cloud file storage
- QR codes generated client-side as data URLs (PNG/SVG)
- Downloads trigger browser download via data URL, not server uploads

**Caching:**
- TanStack React Query - Server state synchronization and caching
- Configuration: `src/App.tsx` initializes QueryClient with default settings

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: JWT-based authentication through Supabase client
  - Session: Stored in browser localStorage
  - Auto-refresh: `autoRefreshToken: true` configured in client
  - Persistence: `persistSession: true` maintains login across tabs
  - Location: `src/integrations/supabase/client.ts`

## Monitoring & Observability

**Error Tracking:**
- Not detected - No dedicated error tracking service (Sentry, etc.)
- Console errors logged via `console.error()` and `console.warn()`

**Logs:**
- Browser console only
- No centralized logging or analytics

## CI/CD & Deployment

**Hosting:**
- Vercel (configured via `vercel.json`)
- SPA routing configured for all paths to route to `index.html`
- Supports client-side routing with React Router

**CI Pipeline:**
- Not detected - No GitHub Actions or other CI configuration found
- Manual deployment likely

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key for client access
- `VITE_USE_SUPABASE` - Feature flag (true/false) to enable Supabase backend
- `VITE_OPENROUTER_API_KEY` - OpenRouter API key for AI review generation (optional, falls back to templates)

**Optional env vars:**
- `VITE_SUPABASE_PROJECT_ID` - Referenced in config but not actively used in current code

**Secrets location:**
- `.env` file in project root (not committed to git)
- Example template: `.env.example`

## Webhooks & Callbacks

**Incoming:**
- Not detected

**Outgoing:**
- OpenRouter API calls are direct HTTP requests, not webhook-based
- No outbound webhooks to external services

## Data Flow

**Review Generation Flow:**
1. User selects business and rating (1-5 stars)
2. App checks if `VITE_OPENROUTER_API_KEY` is configured
3. If key exists: Calls OpenRouter API with prompt containing business info, rating, language
4. If no key or API fails: Falls back to randomly selected template from `reviewTemplates` object
5. Generated review displayed to user for copy-paste workflow

**Business Storage Flow:**
1. User enters business details on `/add-business` page
2. Validates required fields (name, Google Place ID)
3. If `VITE_USE_SUPABASE=true`: Inserts to Supabase `businesses` table via `supabase.from('businesses').insert()`
4. If `false`: Stores in local IndexedDB via Dexie
5. Returns business ID for review page URL generation

**QR Code Generation Flow:**
1. User requests QR code on review page
2. Client-side generation: `QRCode.toDataURL()` or `QRCode.toString()` creates data URL/SVG
3. Share options:
   - Download: Browser download via data URL
   - Share: Web Share API if available, fallback to download
   - Copy Link: Clipboard API copies review page URL

---

*Integration audit: 2026-02-27*
