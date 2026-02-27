# Technology Stack

**Analysis Date:** 2026-02-27

## Languages

**Primary:**
- TypeScript 5.8.3 - Full codebase implementation and configuration
- JSX/TSX - React component templates integrated with TypeScript

**Secondary:**
- JavaScript - Configuration files and build setup

## Runtime

**Environment:**
- Node.js (ES2020 target, bundler module resolution)

**Package Manager:**
- npm (with package-lock.json for version pinning)

## Frameworks

**Core UI:**
- React 18.3.1 - Component framework
- React Router DOM 6.30.1 - Client-side routing

**UI Components:**
- Radix UI (22 component libraries) - Accessible component primitives
  - Includes: accordion, alert-dialog, checkbox, dialog, dropdown-menu, popover, select, tabs, tooltip, and more
- shadcn/ui - Pre-built React components built on Radix UI
- Tailwind CSS 3.4.17 - Utility-first CSS framework
- Tailwind Merge 2.6.0 - Utility class composition
- Tailwind CSS Animate 1.0.7 - Animation utilities

**Form & Validation:**
- React Hook Form 7.61.1 - Form state management
- @hookform/resolvers 3.10.0 - Form validation adapters
- Zod 3.25.76 - Schema validation library

**Data & State:**
- TanStack React Query 5.83.0 - Server state and caching
- Dexie 4.3.0 - IndexedDB wrapper (local database layer)

**Utilities:**
- React Day Picker 8.10.1 - Calendar component
- Date-fns 3.6.0 - Date manipulation
- Embla Carousel React 8.6.0 - Carousel component
- Input OTP 1.4.2 - OTP input field
- Lucide React 0.462.0 - SVG icon library
- Next-themes 0.3.0 - Dark mode management
- Class Variance Authority 0.7.1 - Component variant management
- clsx 2.1.1 - Conditional className utility
- cmdk 1.1.1 - Command menu component
- QRCode 1.5.4 - QR code generation
- Recharts 2.15.4 - Data visualization charts
- Sonner 1.7.4 - Toast notifications
- Vaul 0.9.9 - Drawer component

**Build & Dev:**
- Vite 5.4.19 - Build tool and dev server
- @vitejs/plugin-react-swc 3.11.0 - SWC-based React plugin for faster builds

**Testing:**
- Vitest 3.2.4 - Unit test framework
- @testing-library/react 16.0.0 - React component testing utilities
- @testing-library/jest-dom 6.6.0 - DOM matchers
- jsdom 20.0.3 - DOM implementation for Node.js

**Linting & Quality:**
- ESLint 9.32.0 - Code linting
- @eslint/js 9.32.0 - ESLint config
- typescript-eslint 8.38.0 - TypeScript support for ESLint
- eslint-plugin-react-hooks 5.2.0 - React hooks rules
- eslint-plugin-react-refresh 0.4.20 - React Fast Refresh validation

**CSS Processing:**
- PostCSS 8.5.6 - CSS transformation
- Autoprefixer 10.4.21 - Vendor prefixing

**Development Tools:**
- Globals 15.15.0 - Global variable definitions
- @types/node 22.16.5 - Node.js type definitions
- @types/react 18.3.23 - React type definitions
- @types/react-dom 18.3.7 - React DOM type definitions
- @types/qrcode 1.5.6 - QRCode library types

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.97.0 - Supabase PostgreSQL client (backend database and auth)
- supabase 2.76.12 - Alternative Supabase client
- React 18.3.1 - UI framework foundation

**Infrastructure:**
- Zod 3.25.76 - Type-safe schema validation throughout app
- React Hook Form 7.61.1 - Form handling and validation
- Date-fns 3.6.0 - Date utilities for business records

## Configuration

**Environment:**
- Vite environment variables using `import.meta.env.*` prefix
- Feature flag: `VITE_USE_SUPABASE` - Toggle between IndexedDB and Supabase backends
- Supabase credentials: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- API integration: `VITE_OPENROUTER_API_KEY` - OpenRouter AI service for review generation

**Build:**
- `vite.config.ts` - Vite build configuration with React SWC plugin
- `tsconfig.json` - TypeScript compiler options (ES2020 target, strict: false)
- `tsconfig.app.json` - App-specific TypeScript configuration
- `tsconfig.node.json` - Node.js tooling TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS theming with custom color system
- `postcss.config.js` - PostCSS with Tailwind and Autoprefixer
- `eslint.config.js` - ESLint configuration with React/TypeScript rules
- `vitest.config.ts` - Test configuration with jsdom environment
- `components.json` - shadcn/ui component configuration
- `vercel.json` - Vercel deployment configuration for SPA routing

## Platform Requirements

**Development:**
- Node.js 18+ (ES2020 features required)
- npm 9+ for dependency management
- Modern browser (Chrome, Firefox, Safari, Edge)

**Production:**
- Deployment on Vercel (optimized with SPA routing configuration)
- Or any static host (Vite builds to `/dist` directory)
- Client-side rendering only (no server-side rendering)

---

*Stack analysis: 2026-02-27*
