# Coding Conventions

**Analysis Date:** 2026-02-27

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `QRCodePreview.tsx`, `ReviewPage.tsx`, `AddBusiness.tsx`)
- Hooks: kebab-case with `.tsx` extension (e.g., `use-mobile.tsx`, `use-toast.ts`)
- Utilities and libraries: camelCase (e.g., `qrcode.ts`, `reviewGenerator.ts`, `utils.ts`)
- Type/interface files: camelCase (e.g., `types.ts`)

**Functions:**
- Exported utility functions: camelCase, descriptive action verbs (e.g., `generateQRCodeDataURL`, `downloadQRCode`, `copyReviewLink`, `addBusiness`, `getBusinessBySlug`)
- React component functions: PascalCase (e.g., `QRCodePreview`, `ReviewPage`)
- Event handlers: camelCase starting with `handle` (e.g., `handleSubmit`, `handleCopy`, `handleOpenGoogle`, `handleStarClick`)
- Custom hooks: camelCase starting with `use` (e.g., `useLanguage`, `useIsMobile`)

**Variables:**
- State variables: camelCase (e.g., `qrDataUrl`, `businessName`, `loading`, `generating`, `copied`)
- Constants: UPPER_SNAKE_CASE for feature flags and API configuration (e.g., `OPENROUTER_API_KEY`, `USE_SUPABASE`, `SUPABASE_URL`)
- Type/interface names: PascalCase (e.g., `Business`, `QRCodeDialogProps`, `Language`, `Translations`)

**Types:**
- Interfaces: PascalCase (e.g., `QRCodePreviewProps`, `NavLinkCompatProps`, `QRCodeDialogProps`, `LanguageContextType`)
- Type aliases: PascalCase (e.g., `Language`, `QRSize`, `QRFormat`)
- Generic type parameters: Single uppercase letter (e.g., `React.FC<{ children: React.ReactNode }>`)

## Code Style

**Formatting:**
- No Prettier configuration detected; formatting appears to be manual or enforced by IDE
- Indentation: 2 spaces (observed in source files)
- Line length: No strict limit observed, lines vary from 80-100 characters

**Linting:**
- Tool: ESLint with TypeScript support (`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`)
- Config: `eslint.config.js` (flat config format)
- Key rules:
  - React Hooks rules enabled (`react-hooks.configs.recommended.rules`)
  - `react-refresh/only-export-components`: Warns if non-component exports are used with refresh
  - `@typescript-eslint/no-unused-vars`: Disabled (off)
- TypeScript Compiler options:
  - `noImplicitAny`: false (allows implicit any)
  - `noUnusedParameters`: false (unused params allowed)
  - `strictNullChecks`: false (no strict null checking)
  - `noUnusedLocals`: false (unused locals allowed)

## Import Organization

**Order:**
1. React and third-party library imports (`import React`, `import { useState }`)
2. UI component imports from `@/components/ui/`
3. Utility and library imports from `@/lib/`
4. Hook imports from `@/hooks/` or `@/lib/`
5. Integration imports from `@/integrations/`
6. Page/component imports from `@/pages/` or `@/components/`

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Used consistently in all imports (e.g., `@/lib/db`, `@/components/ui/button`, `@/lib/i18n`)

**Example pattern from `ReviewPage.tsx`:**
```typescript
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Star, Copy, Check, ExternalLink, RefreshCw, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getBusinessBySlug, Business } from "@/lib/db";
import { generateReview as generateLocalReview, reviewTemplates, type Language } from "@/lib/reviewGenerator";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { QRCodeDialog } from "@/components/QRCodeDialog";
import { toast } from "sonner";
```

## Error Handling

**Patterns:**
- Try-catch with console.error logging and graceful fallbacks
- Throw custom Error messages with descriptive text (e.g., `throw new Error('Failed to generate QR code')`)
- Async operations wrap errors in try-catch-finally blocks to ensure cleanup
- API failures return data from fallback (e.g., templates) rather than throwing

**Example from `reviewGenerator.ts`:**
```typescript
try {
  const dataUrl = await QRCode.toDataURL(url, { /* options */ });
  return dataUrl;
} catch (error) {
  console.error('Error generating QR code:', error);
  throw new Error('Failed to generate QR code');
}
```

**Error UI display:**
- User-facing errors via `toast.error(t.errorKey)` using i18n translations
- Non-blocking errors logged to console with context

## Logging

**Framework:** `console` (no third-party logging library)

**Patterns:**
- `console.error()` for caught exceptions with context (e.g., `console.error('Error generating QR code:', error)`)
- `console.warn()` for degradation scenarios (e.g., `console.warn('AI review generation failed, falling back to templates:', error)`)
- Errors logged in catch blocks with descriptive prefix describing the operation
- Web Share API AbortError explicitly handled to avoid spurious logs (see `shareQRCode` in `qrcode.ts`)

**Example from `qrcode.ts`:**
```typescript
catch (error) {
  if ((error as Error).name !== 'AbortError') {
    console.error('Error sharing QR code:', error);
    downloadQRCode(dataUrl, businessName, 'png');
  }
}
```

## Comments

**When to Comment:**
- JSDoc comments on public functions explaining parameters and return values
- Inline comments for non-obvious logic or business rules
- Feature flags and configuration options documented with comments

**JSDoc/TSDoc:**
- Used for utility functions with parameters and return types
- Format: Standard JSDoc with `@param`, `@returns`, and description
- Example from `qrcode.ts`:
```typescript
/**
 * Generates a QR code as a PNG data URL
 * @param slug - Business slug for the review page URL
 * @param size - Size in pixels (256, 512, or 1024)
 * @returns Promise resolving to data URL string
 */
export async function generateQRCodeDataURL(slug: string, size: number): Promise<string>
```

## Function Design

**Size:** Functions are generally compact (5-30 lines for most handlers)

**Parameters:**
- Destructuring used for component props with TypeScript interfaces
- Named parameters for complex functions
- Default parameters for optional behaviors (e.g., `loading = false`)

**Return Values:**
- Explicit return types in function signatures
- Promise returns for async operations with clear type annotations
- Component functions return JSX elements implicitly

**Example from `AddBusiness.tsx`:**
```typescript
const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
```

## Module Design

**Exports:**
- Named exports for most functions and components (e.g., `export function generateQRCodeDataURL()`, `export const QRCodePreview = ({ ... })`)
- Default exports for page components and main App (e.g., `export default App`)
- Type exports via `export type` (e.g., `export type Language = 'en' | 'ro'`)
- Mixed approach: named exports for utilities, default for pages

**Barrel Files:**
- Not extensively used; components typically import directly
- Example in `index` files: Uses path aliases instead of barrel re-exports

**Example from `qrcode.ts`:**
```typescript
export async function generateQRCodeDataURL(slug: string, size: number): Promise<string>
export async function generateQRCodeSVG(slug: string, size: number): Promise<string>
export function downloadQRCode(dataUrl: string, businessName: string, format: 'png' | 'svg'): void
export async function shareQRCode(dataUrl: string, businessName: string): Promise<void>
export async function copyReviewLink(slug: string): Promise<void>
```

## React Patterns

**Hooks:**
- `useState` for local component state
- `useEffect` for side effects with proper cleanup
- `useParams` for route parameters
- `useNavigate` for programmatic navigation
- Custom hooks (e.g., `useLanguage`, `useIsMobile`) follow React hooks conventions

**Context API:**
- Used for language/localization (`LanguageContext` in `i18n.tsx`)
- Consumers wrapped in `useContext` hooks with error boundary checking

**Component Props:**
- Props interfaces define shape (e.g., `QRCodeDialogProps`, `QRCodePreviewProps`)
- Props destructured directly in function signature
- Default props applied inline (e.g., `loading = false`)

---

*Convention analysis: 2026-02-27*
