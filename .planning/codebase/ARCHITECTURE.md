# Architecture

**Analysis Date:** 2026-02-27

## Pattern Overview

**Overall:** Layered client-side SPA (Single Page Application) with optional backend integration layer

**Key Characteristics:**
- React 18 + TypeScript frontend with Vite build system
- Feature flag-driven database abstraction (IndexedDB vs Supabase)
- Modular component architecture with shadcn/ui component library
- Context-based state management (React Query, i18n)
- Client-side routing with React Router v6

## Layers

**Presentation Layer:**
- Purpose: React components rendering UI and handling user interactions
- Location: `src/components/` and `src/pages/`
- Contains: Page components, UI component wrappers (shadcn), feature components
- Depends on: Hooks, context providers, lib utilities
- Used by: React Router, App entry point

**State & Data Layer:**
- Purpose: Manage application data, cache, language state, and form state
- Location: `src/lib/` (db.ts, supabaseDb.ts, i18n.tsx), React Query, React Hook Form
- Contains: Database abstraction, data fetching, language translations, review generation logic
- Depends on: External APIs (Supabase), local storage
- Used by: Page components, feature components

**Abstraction/Integration Layer:**
- Purpose: Bridge between client code and external services
- Location: `src/integrations/supabase/`, `src/lib/`
- Contains: Supabase client initialization, type definitions, OpenRouter AI integration
- Depends on: Environment variables, external service APIs
- Used by: Data layer functions

**Routing & App Layer:**
- Purpose: Initialize app, set up providers, manage navigation
- Location: `src/App.tsx`, `src/main.tsx`
- Contains: React Router setup, provider wrappers (QueryClient, LanguageProvider, TooltipProvider)
- Depends on: All pages, all providers
- Used by: Browser entry point

## Data Flow

**Business Listing Flow:**

1. User visits home (`/`)
2. `Index` component (page) mounts → calls `useEffect`
3. `useEffect` calls `getAllBusinesses()` from `src/lib/db.ts`
4. Database abstraction checks `USE_SUPABASE` flag:
   - If true: calls `supabaseDb.getAllBusinesses()` → queries Supabase → returns `Business[]`
   - If false: calls Dexie `db.businesses.orderBy('created_at').reverse().toArray()` → returns local data
5. Results set to state → component re-renders with business list
6. User clicks business → navigates to `/review/:businessSlug`

**Review Generation Flow:**

1. User navigates to `/review/:businessSlug` → `ReviewPage` component mounts
2. `ReviewPage` loads business by slug using `getBusinessBySlug(slug)`
3. Database abstraction routes through feature flag (same as above)
4. On initial load: calls `generateReviewInstant()` with 5-star rating
5. `generateReviewInstant()` accesses `reviewTemplates[language][rating]`, randomly selects template, replaces `{business}` placeholder
6. User clicks star rating → `handleStarClick()` re-generates review using same instant method
7. User clicks "Regenerate" button → calls `generateReview()` (async):
   - If `VITE_OPENROUTER_API_KEY` configured: calls OpenRouter AI API
   - If API fails or not configured: falls back to template-based generation
8. User clicks "Copy" → `handleCopy()` uses clipboard API
9. User clicks "Open Google" → opens Google Maps or Google Reviews URL
10. User clicks "QR Code" → opens QR dialog

**QR Code Generation Flow:**

1. `QRCodeDialog` opens → `useEffect` triggers when `isOpen` or `size/format` changes
2. Calls `generateQR()` based on format:
   - PNG: `generateQRCodeDataURL()` → uses qrcode library → returns data URL
   - SVG: `generateQRCodeSVG()` → uses qrcode library → converts to data URL
3. `QRCodePreview` component displays generated image
4. User actions:
   - Download: `downloadQRCode()` → creates blob, triggers browser download
   - Share: `shareQRCode()` → uses Web Share API with fallback to download
   - Copy Link: `copyReviewLink()` → uses Clipboard API

**Business Creation Flow:**

1. User navigates to `/add-business`
2. `AddBusiness` component renders form
3. User submits → `handleSubmit()`:
   - Validates required fields (name, placeId)
   - Generates slug from business name using `generateSlug()`
   - Calls `addBusiness(data)` from db abstraction
4. Database abstraction checks `USE_SUPABASE`:
   - If true: checks for duplicate slug, inserts into Supabase, returns ID
   - If false: checks Dexie for duplicate, generates UUID, inserts locally, returns ID
5. On success: navigates to `/review/{slug}` → user sees new business review page

**Data Migration Flow (IndexedDB → Supabase):**

1. On app startup: `migration.ts` exports check if migration needed
2. If `VITE_USE_SUPABASE=true`:
   - Checks localStorage flag `reviewpasta_migrated_to_supabase`
   - If not migrated: `shouldRunMigration()` checks Dexie for existing data
   - If data exists: `migrateDataToSupabase()` reads all businesses from Dexie
   - For each business: checks if exists in Supabase (avoid duplicates), inserts if new
   - Sets migration flag in localStorage to skip future checks

**State Management:**

- **Global State:** Language (i18n context) managed via `src/lib/i18n.tsx`
  - Stored in localStorage with key `language`
  - Default: Romanian (ro)
  - Consumed by all components via `useLanguage()` hook
- **Server State:** React Query caching (implicit via QueryClient in App.tsx)
- **Local State:** Component state for UI interactions (form inputs, star rating, loading states)
- **Persistent Storage:**
  - IndexedDB: `ReviewPastaDB` database via Dexie (local fallback)
  - Supabase: `businesses` table (primary when enabled)
  - localStorage: migration flags, language preference

## Key Abstractions

**Database Abstraction (Feature Flag Pattern):**
- Purpose: Abstract data source behind consistent interface
- Location: `src/lib/db.ts` (main abstraction), `src/lib/supabaseDb.ts` (Supabase implementation)
- Examples: `getAllBusinesses()`, `getBusinessBySlug()`, `addBusiness()`
- Pattern: Runtime feature flag checks `USE_SUPABASE` env var, routes calls to correct implementation
- Enables: Zero-downtime migration from IndexedDB to Supabase

**Business Entity:**
- Purpose: Typed representation of a business
- Definition: `src/lib/db.ts` (Dexie version) and `src/lib/supabaseDb.ts` (Supabase version)
- Properties: `id`, `name`, `slug`, `place_id`, `location`, `description`, `created_at`
- Slug: Auto-generated from name (lowercase, alphanumeric + hyphens, sanitized)

**Review Generation (Template + AI Fallback):**
- Purpose: Generate authentic-sounding reviews for 1-5 star ratings
- Location: `src/lib/reviewGenerator.ts`
- Templates: Language-specific (en/ro) templates for each rating in `reviewTemplates` object
- AI Layer: OpenRouter API integration with prompt engineering
- Pattern: Try AI first if API key available, fall back to templates if API fails or no key

**i18n Context Provider:**
- Purpose: Manage language state and translations globally
- Location: `src/lib/i18n.tsx`
- Contains: `Translations` interface, `LanguageContext`, `useLanguage()` hook
- Usage: `const { t, language, setLanguage } = useLanguage()` in components

**QR Code Utilities:**
- Purpose: Generate, download, and share QR codes linking to review pages
- Location: `src/lib/qrcode.ts`
- Supports: PNG (data URL) and SVG formats, multiple sizes (256/512/1024px)
- Error Correction: High (30% damage tolerance)
- Sharing: Web Share API with fallback to download

## Entry Points

**Browser Entry:**
- Location: `index.html`
- Triggers: Page load
- Responsibilities: Define root DOM element, load main.tsx script

**Application Entry:**
- Location: `src/main.tsx`
- Triggers: Browser script load
- Responsibilities: Mount React app to DOM root element

**App Component:**
- Location: `src/App.tsx`
- Triggers: React mount after main.tsx
- Responsibilities:
  - Initialize QueryClient for server state
  - Wrap app with providers (QueryClientProvider, LanguageProvider, TooltipProvider, UI providers)
  - Set up React Router with route definitions
  - Define route structure

**Pages:**
- `src/pages/Index.tsx`: Home page, lists all businesses
- `src/pages/AddBusiness.tsx`: Form to add new business
- `src/pages/ReviewPage.tsx`: Generate and manage review for a business
- `src/pages/NotFound.tsx`: 404 fallback route

## Error Handling

**Strategy:** Try-catch blocks with user-friendly toast notifications, fallback mechanisms

**Patterns:**

- **Database Operations:** Wrapped in try-catch, errors caught and displayed via toast (e.g., `toast.error(t.errorSave)`)
- **API Calls:** OpenRouter AI requests fail gracefully, fall back to template generation
- **QR Generation:** Errors in generation prevent UI from breaking, user sees placeholder
- **File Operations:** Download/Share failures caught, user notified via toast
- **Validation:** Form validation before submission, error messages in toast

Example from `ReviewPage.tsx`:
```typescript
const generateReview = async (biz: Business, starCount: number) => {
  setGenerating(true);
  try {
    const generatedReview = await generateLocalReview(...);
    setReview(generatedReview);
  } catch (error) {
    toast.error(t.errorGenerate);
  } finally {
    setGenerating(false);
  }
};
```

## Cross-Cutting Concerns

**Logging:**
- Approach: Browser console logging (console.error, console.log, console.warn)
- Used for: API errors, migration progress, feature flag detection
- Not production-grade: No centralized logging service

**Validation:**
- Form validation: React Hook Form + Zod schemas
- Slug uniqueness: Database-level checks in both Dexie and Supabase implementations
- Required fields: Client-side checks before API calls

**Authentication:**
- Current: None (app is public)
- Supabase: Auth configured for future use (localStorage persistence, auto-refresh tokens)
- Seeded for future: Auth context ready in `src/integrations/supabase/client.ts`

**Internationalization:**
- Context-based: `src/lib/i18n.tsx`
- Languages: English (en) and Romanian (ro)
- Default: Romanian
- Storage: localStorage key `language`
- Scope: All strings in `Translations` interface (50+ keys)

**Performance:**
- React Query: Automatic caching of server state
- Lazy evaluation: Review generation templates only selected when needed
- Image optimization: QR codes generated on-demand, no pre-computation
- No: Bundle splitting, code splitting, lazy-loaded components

**Styling:**
- Framework: Tailwind CSS with shadcn/ui component library
- Utility-based: All styles use Tailwind classes
- Typography: @tailwindcss/typography plugin included
- Theming: next-themes for dark mode support (configured but minimal usage in current code)

---

*Architecture analysis: 2026-02-27*
