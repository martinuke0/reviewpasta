# Codebase Structure

**Analysis Date:** 2026-02-27

## Directory Layout

```
reviewpasta/
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # TypeScript configuration (base)
├── tsconfig.app.json           # TypeScript config for app
├── tsconfig.node.json          # TypeScript config for build tools
├── package.json                # Dependencies and scripts
├── public/                      # Static assets
│   ├── favicon.svg
│   ├── robots.txt
│   └── placeholder.svg
├── src/                         # Application source code
│   ├── main.tsx                # React app entry point
│   ├── App.tsx                 # Root app component with routing
│   ├── App.css                 # App-level styles
│   ├── index.css               # Global styles (Tailwind imports)
│   ├── vite-env.d.ts           # Vite type definitions
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui component library (50+ files)
│   │   ├── QRCodeDialog.tsx    # QR code modal dialog
│   │   ├── QRCodePreview.tsx   # QR code image preview
│   │   ├── LanguageSwitcher.tsx # Language toggle button
│   │   └── NavLink.tsx         # Navigation link wrapper
│   ├── pages/                  # Page components (route targets)
│   │   ├── Index.tsx           # Home page (listing)
│   │   ├── ReviewPage.tsx      # Review generation page
│   │   ├── AddBusiness.tsx     # Business creation form
│   │   └── NotFound.tsx        # 404 page
│   ├── lib/                    # Utility functions and business logic
│   │   ├── db.ts              # Database abstraction layer
│   │   ├── supabaseDb.ts      # Supabase implementation
│   │   ├── i18n.tsx           # Internationalization context
│   │   ├── reviewGenerator.ts # Review AI + template logic
│   │   ├── qrcode.ts          # QR code generation utilities
│   │   ├── migration.ts       # IndexedDB → Supabase migration
│   │   ├── utils.ts           # Utility helpers (cn())
│   │   └── (generated files)   # Generated types (not modified)
│   ├── contexts/              # Context providers (currently empty)
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-mobile.tsx     # Responsive design hook
│   │   └── use-toast.ts       # Toast/notification hook
│   ├── integrations/          # External service integrations
│   │   └── supabase/
│   │       ├── client.ts      # Supabase client initialization
│   │       └── types.ts       # Generated Supabase types
│   └── test/                  # Test files
│       └── example.test.ts    # Example test (Vitest)
├── supabase/                  # Supabase project config
│   ├── functions/             # Edge functions (optional)
│   └── migrations/            # SQL migrations
├── dist/                      # Build output (generated)
├── node_modules/              # Dependencies (generated)
├── .planning/                 # GSD planning documentation
│   └── codebase/              # Codebase analysis docs
├── .git/                      # Git repository
├── .eslintrc.cjs              # ESLint configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
└── vitest.config.ts           # Vitest test configuration
```

## Directory Purposes

**public/:**
- Purpose: Static assets served directly by web server
- Contains: Favicon, robot exclusion rules, placeholder graphics
- Key files: `favicon.svg` (app icon)

**src/components/:**
- Purpose: All React components
- Contains: UI component library (shadcn/ui) + custom feature components
- Key files:
  - `ui/`: 50+ generated shadcn components (Button, Card, Dialog, Input, etc.)
  - `LanguageSwitcher.tsx`: Language toggle in fixed position
  - `QRCodeDialog.tsx`: Modal for QR code options and generation
  - `QRCodePreview.tsx`: Image display for QR codes
- Pattern: Compound components (Dialog + Preview), controlled by parent page

**src/pages/:**
- Purpose: Page-level components that map to routes
- Contains: Full-page components handling a specific URL path
- Key files:
  - `Index.tsx`: Business listing, entry point after login
  - `ReviewPage.tsx`: Core feature - review generation interface
  - `AddBusiness.tsx`: Form for new business entry
  - `NotFound.tsx`: 404 error page
- Pattern: Each page is a route target, manages its own state and data fetching

**src/lib/:**
- Purpose: Shared utilities, business logic, data access layer
- Contains: Database abstraction, API integrations, type definitions
- Key files:
  - `db.ts`: Feature-flagged database abstraction (IndexedDB vs Supabase)
  - `supabaseDb.ts`: Supabase-specific implementation
  - `i18n.tsx`: Context provider for language and translations
  - `reviewGenerator.ts`: Review generation logic (templates + AI)
  - `qrcode.ts`: QR code utilities (PNG, SVG, download, share)
  - `migration.ts`: Data migration from Dexie to Supabase
- Pattern: No side effects, pure functions + context providers

**src/components/ui/:**
- Purpose: Re-usable UI component library
- Contains: Generated shadcn/ui component wrappers
- Pattern: Each component wraps a Radix UI primitive with Tailwind styling
- Modified: Minimal - use as-is for consistency
- Example: `Button.tsx` wraps Radix button primitive

**src/hooks/:**
- Purpose: Custom React hooks for shared logic
- Contains: Responsive design detection, toast notifications
- Pattern: Extract complex hook logic into reusable functions
- Minimal: Only 2 hooks currently

**src/integrations/supabase/:**
- Purpose: External service integration
- Contains: Supabase client initialization and type definitions
- Key files:
  - `client.ts`: Creates and exports Supabase client instance
  - `types.ts`: Generated TypeScript types for database schema
- Generated: `types.ts` auto-generated by Supabase CLI
- Not modified: These are generated; regenerate with `supabase gen types`

**src/contexts/:**
- Purpose: Reserved for context providers
- Currently: Empty - language provider in `lib/i18n.tsx` instead
- Future: Could move auth context here if added

## Key File Locations

**Entry Points:**
- `index.html`: HTML document, loads src/main.tsx
- `src/main.tsx`: React mount point, renders App to #root
- `src/App.tsx`: Root component with router and providers

**Configuration:**
- `vite.config.ts`: Build tool config (dev server, build output, aliases)
- `tsconfig.json`: TypeScript configuration with @ path alias to src/
- `tailwind.config.js`: Tailwind CSS configuration
- `postcss.config.js`: PostCSS/Tailwind build config
- `.eslintrc.cjs`: ESLint rules

**Core Logic:**
- `src/lib/db.ts`: Data layer - primary abstraction for all business data
- `src/lib/reviewGenerator.ts`: Review generation logic (AI + templates)
- `src/lib/i18n.tsx`: Language management and translations
- `src/lib/qrcode.ts`: QR code generation and export utilities

**Business Logic:**
- `src/pages/ReviewPage.tsx`: Review generation UI (1000+ LOC)
- `src/pages/AddBusiness.tsx`: Business creation form

**Testing:**
- `src/test/`: Test files directory
- `vitest.config.ts`: Vitest test runner configuration

## Naming Conventions

**Files:**
- **Component files:** PascalCase.tsx (e.g., `QRCodeDialog.tsx`, `LanguageSwitcher.tsx`)
- **Utility/logic files:** camelCase.ts (e.g., `reviewGenerator.ts`, `qrcode.ts`)
- **UI components:** PascalCase.tsx (e.g., `Button.tsx`, `Card.tsx`)
- **Test files:** `*.test.ts` or `*.spec.ts` format (e.g., `example.test.ts`)

**Directories:**
- **Feature directories:** lowercase (e.g., `components/`, `pages/`, `lib/`)
- **UI component directory:** `ui/` (shadcn convention)
- **Integration directories:** lowercase (e.g., `integrations/supabase/`)

**React Components:**
- **Pages:** Descriptive action or entity (e.g., `ReviewPage`, `AddBusiness`, `Index`)
- **Feature components:** Describes feature or dialog (e.g., `QRCodeDialog`, `LanguageSwitcher`)
- **UI components:** Semantic name or element name (e.g., `Button`, `Card`, `Dialog`)

**Functions & Variables:**
- **Functions:** camelCase, verb-first (e.g., `generateReview`, `copyReviewLink`, `addBusiness`)
- **Async functions:** Promise-returning (e.g., `getAllBusinesses()`, `getBusinessBySlug()`)
- **Handlers:** `handle` prefix (e.g., `handleSubmit`, `handleCopy`, `handleStarClick`)
- **State setters:** `set` prefix for useState (e.g., `setStars`, `setReview`, `setLoading`)
- **Getters:** `get` prefix (e.g., `getAllBusinesses`, `getBusinessBySlug`)

**Types & Interfaces:**
- **Interfaces:** PascalCase (e.g., `Business`, `Translations`, `QRCodeDialogProps`)
- **Type unions:** PascalCase (e.g., `Language`, `QRSize`, `QRFormat`)

## Where to Add New Code

**New Feature:**
- Primary code: `src/lib/` for business logic, `src/components/` for UI
- Tests: `src/test/` directory
- State: Add to `src/lib/i18n.tsx` if global, use hooks/useState if local
- Example: New review filter feature
  - Logic: `src/lib/reviewFilters.ts`
  - UI: `src/components/ReviewFilter.tsx`
  - Test: `src/test/reviewFilters.test.ts`

**New Component/Module:**
- Implementation: `src/components/` for UI, `src/lib/` for logic
- Co-locate: Keep related logic and UI close
- Pattern: Component imports utility functions from `src/lib/`
- Example: New report generator
  - Logic: `src/lib/reportGenerator.ts`
  - UI: `src/components/ReportDialog.tsx`

**Utilities:**
- Shared helpers: `src/lib/utils.ts` (currently has `cn()` function)
- Domain-specific: New file in `src/lib/` (e.g., `src/lib/validators.ts` for form validation)

**New Page/Route:**
- Location: `src/pages/NewPage.tsx`
- Register route: Add to `src/App.tsx` Routes
- Pattern: Export default component, import in App.tsx
- Data fetching: Use `useEffect` + async function pattern (see `ReviewPage.tsx`)

**Custom Hooks:**
- Location: `src/hooks/` with `use-` prefix (e.g., `use-form.tsx`)
- Pattern: Extract complex component logic into hooks
- Current: Only `use-mobile.tsx` and `use-toast.ts`

**External Integrations:**
- Location: `src/integrations/{service}/`
- Pattern: Client initialization + wrapper functions
- Example: `src/integrations/supabase/client.ts` and `src/integrations/openrouter/client.ts`

**Global Context/State:**
- Location: `src/lib/` for providers (e.g., `src/lib/i18n.tsx`)
- Provider wrapper: Add to `src/App.tsx` provider stack
- Pattern: Context + hook (e.g., `LanguageProvider` + `useLanguage()`)

## Special Directories

**dist/:**
- Purpose: Build output directory
- Generated: Yes (created by `npm run build`)
- Committed: No (in .gitignore)
- Rebuilt: On every `npm run build` command

**node_modules/:**
- Purpose: Package dependencies
- Generated: Yes (installed by `npm install`)
- Committed: No (in .gitignore)
- Manage: Via package.json and package-lock.json

**supabase/:**
- Purpose: Supabase project configuration
- Structure:
  - `migrations/`: SQL schema migrations
  - `functions/`: Edge functions (serverless)
- Committed: Yes (version control database schema)

**.planning/codebase/:**
- Purpose: GSD-generated codebase analysis documents
- Committed: Yes (guides for future development)
- Contents:
  - ARCHITECTURE.md: Architecture and data flow
  - STRUCTURE.md: File organization (this file)
  - CONVENTIONS.md: Code style and patterns
  - STACK.md: Technology dependencies
  - INTEGRATIONS.md: External service integrations
  - TESTING.md: Test patterns (if exists)
  - CONCERNS.md: Technical debt and issues (if exists)

**src/test/:**
- Purpose: Test files directory
- Pattern: Co-located tests (same name as source with .test suffix)
- Config: Configured via vitest.config.ts
- Coverage: Currently minimal (only example test)

---

*Structure analysis: 2026-02-27*
