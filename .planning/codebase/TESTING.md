# Testing Patterns

**Analysis Date:** 2026-02-27

## Test Framework

**Runner:**
- Vitest 3.2.4
- Config: `vitest.config.ts`
- Environment: jsdom (for DOM and browser API testing)

**Assertion Library:**
- Vitest built-in assertions via `expect()`

**Run Commands:**
```bash
npm test                # Run all tests once
npm run test:watch     # Watch mode for development
```

**Coverage:**
- Not currently configured or enforced
- No coverage thresholds defined

## Test File Organization

**Location:**
- Co-located with source code
- Pattern: `src/**/*.{test,spec}.{ts,tsx}`
- Dedicated test directory: `src/test/`

**Naming:**
- Test files: `.test.ts` or `.test.tsx` suffix (not `.spec.*`)
- Example: `src/test/example.test.ts`

**Structure:**
```
src/
├── test/
│   ├── setup.ts          # Global test setup
│   └── example.test.ts   # Example test file
├── lib/
│   ├── qrcode.ts
│   └── utils.ts
├── components/
│   └── QRCodePreview.tsx
└── pages/
    └── ReviewPage.tsx
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from "vitest";

describe("example", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});
```

**Patterns:**
- `describe()` blocks for test suites (feature or function groups)
- `it()` blocks for individual test cases with descriptive strings
- Arrow functions for test bodies
- `expect()` assertions for verifying behavior

**Setup and Teardown:**
- Global setup file: `src/test/setup.ts`
- setupFiles configured in `vitest.config.ts`
- Test isolation via jsdom per test

**Example from `src/test/setup.ts`:**
```typescript
import "@testing-library/jest-dom";

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
```

## Mocking

**Framework:** Vitest built-in mocking via `vi`

**Patterns:**
```typescript
// Mock browser APIs
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({ /* mock implementation */ })
});

// Vitest mocks (available via import { vi } from 'vitest')
// vi.mock() - Mock modules
// vi.spyOn() - Spy on methods
```

**What to Mock:**
- Browser APIs that jsdom doesn't fully support (e.g., `window.matchMedia`)
- External API calls (e.g., OpenRouter, Supabase)
- Clipboard API for copy operations
- Web Share API for share functionality

**What NOT to Mock:**
- React components (test real behavior)
- Core DOM manipulation (test against real DOM)
- React Router navigation (test integration with routing)
- Custom hooks (test through components)

## Fixtures and Factories

**Test Data:**
- Not yet established in codebase
- Recommended pattern:
```typescript
// src/test/fixtures/business.ts
export const mockBusiness = {
  id: "test-id",
  name: "Test Business",
  slug: "test-business",
  place_id: "ChIJ...",
  location: "Test Location",
  description: "A test business"
};
```

**Location:**
- Should be in `src/test/fixtures/` directory (not yet present)
- Imported and reused across test files

## Coverage

**Requirements:** Not enforced

**View Coverage:**
```bash
# Coverage command would be: npm test -- --coverage
# (Not currently configured in package.json scripts)
```

**Gaps (Current):**
- Only 1 test file exists (`example.test.ts` - placeholder)
- No test coverage for core features:
  - QR code generation (`qrcode.ts`)
  - Review generation (`reviewGenerator.ts`)
  - Database operations (`db.ts`, `supabaseDb.ts`)
  - Components (all `.tsx` files)
  - Hooks (`use-mobile.tsx`, `use-toast.ts`)
  - i18n functionality (`i18n.tsx`)

## Test Types

**Unit Tests:**
- Scope: Individual functions and utilities
- Approach: Test pure functions with multiple input combinations
- Focus areas (recommended):
  - `generateSlug()` in `AddBusiness.tsx` - slug generation logic
  - `generateQRCodeDataURL()` in `qrcode.ts` - QR code generation
  - `generateTemplateReview()` in `reviewGenerator.ts` - template selection and substitution
  - `cn()` utility in `lib/utils.ts` - CSS class merging

**Integration Tests:**
- Scope: Component + hook + data flow combinations
- Approach: Render components and test user interactions
- Focus areas (recommended):
  - `ReviewPage` component with `generateReview()` flow
  - `AddBusiness` form submission and navigation
  - `QRCodeDialog` with QR generation and sharing
  - Language switching via `LanguageProvider`

**E2E Tests:**
- Framework: Not currently used
- Recommendation: Consider Playwright or Cypress for:
  - Full user journeys (add business → view review → generate QR)
  - Browser APIs (copy to clipboard, Web Share)
  - Route navigation

## Common Patterns

**Async Testing:**
```typescript
// Recommended: Use async/await syntax
it("should generate a QR code", async () => {
  const dataUrl = await generateQRCodeDataURL("test-slug", 512);
  expect(dataUrl).toContain("data:image/png");
});

// Or: Use vi.waitFor for component state updates
import { waitFor } from "@testing-library/react";
it("should update state when loading completes", async () => {
  await waitFor(() => {
    expect(screen.getByText("Success")).toBeInTheDocument();
  });
});
```

**Error Testing:**
```typescript
// Testing error scenarios
it("should throw on invalid input", async () => {
  await expect(generateQRCodeDataURL("", 512)).rejects.toThrow("Failed to generate QR code");
});

// Testing error handling in components
it("should show error toast on failure", async () => {
  // Mock the API to fail
  // Verify toast.error was called
});
```

**Component Testing with Testing Library:**
```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

it("should copy review to clipboard", async () => {
  const user = userEvent.setup();
  render(<ReviewPage />);
  const copyButton = screen.getByRole("button", { name: /copy/i });
  await user.click(copyButton);
  expect(screen.getByText("Copied!")).toBeInTheDocument();
});
```

## Testing Libraries

**Available:**
- `@testing-library/react` 16.0.0 - React component testing utilities
- `@testing-library/jest-dom` 6.6.0 - DOM matchers
- `jsdom` 20.0.3 - DOM implementation for Node.js

**Not Currently Installed:**
- `@testing-library/user-event` - Recommended for user interaction testing
- `vitest-canvas-mock` - For canvas testing (if QR code tests need rendering verification)

## Configuration Details

**vitest.config.ts:**
```typescript
{
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,                          // Use global describe/it/expect
    setupFiles: ["./src/test/setup.ts"],   // Global setup
    include: ["src/**/*.{test,spec}.{ts,tsx}"]
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }
  }
}
```

## Recommended Next Steps

1. **Create test fixtures:** Add `src/test/fixtures/` with mock data objects
2. **Test utility functions:** Start with pure functions in `lib/utils.ts` and `lib/qrcode.ts`
3. **Mock external APIs:** Create mock factories for Supabase and OpenRouter responses
4. **Test components:** Use React Testing Library to test user interactions
5. **Add coverage reporting:** Configure vitest coverage and set thresholds
6. **Consider E2E tests:** Evaluate Playwright for critical user flows

---

*Testing analysis: 2026-02-27*
