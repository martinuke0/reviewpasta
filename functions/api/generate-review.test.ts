/**
 * Tests for POST /api/generate-review endpoint
 * TDD RED phase - Tests written first to define expected behavior
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import type { EventContext } from '@cloudflare/workers-types';

// Import the handler module
import { onRequest } from './[[path]]';

interface Env {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
}

describe('POST /api/generate-review', () => {
  const mockEnv: Env = {
    DB: {} as D1Database,
    OPENROUTER_API_KEY: 'test-api-key-12345',
  };

  const createRequest = (body: unknown, method = 'POST') => {
    return new Request('http://localhost:8787/api/generate-review', {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  const createContext = (request: Request, env: Env = mockEnv): EventContext<Env, string, unknown> => ({
    request,
    env,
    waitUntil: () => {},
    passThroughOnException: () => {},
    next: async () => new Response(),
    params: {},
    data: {},
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Validation', () => {
    test('returns 400 when businessName is missing', async () => {
      const request = createRequest({ stars: 5 });
      const context = createContext(request);

      const response = await onRequest(context);
      const data = await response.json() as { error?: string };

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error).toContain('businessName');
    });

    test('returns 400 when stars is missing', async () => {
      const request = createRequest({ businessName: 'Test Business' });
      const context = createContext(request);

      const response = await onRequest(context);
      const data = await response.json() as { error?: string };

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error).toContain('stars');
    });

    test('returns 400 when stars is 0', async () => {
      const request = createRequest({
        businessName: 'Test Business',
        stars: 0,
      });
      const context = createContext(request);

      const response = await onRequest(context);
      const data = await response.json() as { error?: string };

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error?.toLowerCase()).toMatch(/stars|rating/);
    });

    test('returns 400 when stars is greater than 5', async () => {
      const request = createRequest({
        businessName: 'Test Business',
        stars: 6,
      });
      const context = createContext(request);

      const response = await onRequest(context);
      const data = await response.json() as { error?: string };

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error?.toLowerCase()).toMatch(/stars|rating/);
    });
  });

  describe('Template fallback', () => {
    test('returns template review when no API key configured', async () => {
      const noKeyEnv: Env = {
        DB: {} as D1Database,
        OPENROUTER_API_KEY: undefined as unknown as string,
      };
      const request = createRequest({
        businessName: 'Pizza Palace',
        stars: 5,
        language: 'en',
      });
      const context = createContext(request, noKeyEnv);

      const response = await onRequest(context);
      const data = await response.json() as { review?: string };

      expect(response.status).toBe(200);
      expect(data.review).toBeDefined();
      expect(typeof data.review).toBe('string');
      expect(data.review!.length).toBeGreaterThan(0);
      expect(data.review).toContain('Pizza Palace');
    });

    test('returns template review when API key is placeholder', async () => {
      const placeholderEnv: Env = {
        DB: {} as D1Database,
        OPENROUTER_API_KEY: 'your-api-key-here',
      };
      const request = createRequest({
        businessName: 'Coffee Shop',
        stars: 4,
        language: 'en',
      });
      const context = createContext(request, placeholderEnv);

      const response = await onRequest(context);
      const data = await response.json() as { review?: string };

      expect(response.status).toBe(200);
      expect(data.review).toBeDefined();
      expect(data.review).toContain('Coffee Shop');
    });

    test('generates Romanian template when language is ro', async () => {
      const noKeyEnv: Env = {
        DB: {} as D1Database,
        OPENROUTER_API_KEY: undefined as unknown as string,
      };
      const request = createRequest({
        businessName: 'Pizzerie',
        stars: 5,
        language: 'ro',
      });
      const context = createContext(request, noKeyEnv);

      const response = await onRequest(context);
      const data = await response.json() as { review?: string };

      expect(response.status).toBe(200);
      expect(data.review).toBeDefined();
      expect(data.review).toContain('Pizzerie');
      // Romanian templates have specific words
      expect(data.review?.toLowerCase()).toMatch(/experiență|recomand|mulțumit/);
    });

    test('defaults to English when language is invalid', async () => {
      const noKeyEnv: Env = {
        DB: {} as D1Database,
        OPENROUTER_API_KEY: undefined as unknown as string,
      };
      const request = createRequest({
        businessName: 'Test Business',
        stars: 3,
        language: 'fr', // Invalid language
      });
      const context = createContext(request, noKeyEnv);

      const response = await onRequest(context);
      const data = await response.json() as { review?: string };

      expect(response.status).toBe(200);
      expect(data.review).toBeDefined();
      // Should use English template
      expect(data.review?.toLowerCase()).not.toMatch(/experiență|recomand/);
    });
  });

  describe('OpenRouter integration', () => {
    test('calls OpenRouter API when key is configured', async () => {
      // Mock global fetch for this test
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [
              {
                message: {
                  content: 'Great place! Really enjoyed my visit to Test Business.',
                },
              },
            ],
          }),
        } as Response)
      );
      global.fetch = mockFetch;

      const request = createRequest({
        businessName: 'Test Business',
        location: 'New York',
        description: 'Italian restaurant',
        stars: 5,
        language: 'en',
      });
      const context = createContext(request);

      const response = await onRequest(context);
      const data = await response.json() as { review?: string };

      expect(response.status).toBe(200);
      expect(data.review).toBeDefined();
      expect(data.review).toBe('Great place! Really enjoyed my visit to Test Business.');

      // Verify OpenRouter was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('openrouter'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          }),
        })
      );

      // Verify API key was used
      const fetchCall = mockFetch.mock.calls[0];
      const callHeaders = fetchCall[1]?.headers as Record<string, string>;
      expect(callHeaders['Authorization']).toBe('Bearer test-api-key-12345');
    });

    test('falls back to template when OpenRouter API fails', async () => {
      // Mock API failure
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        } as Response)
      );
      global.fetch = mockFetch;

      const request = createRequest({
        businessName: 'Test Business',
        stars: 4,
        language: 'en',
      });
      const context = createContext(request);

      const response = await onRequest(context);
      const data = await response.json() as { review?: string };

      // Should still return 200 with template fallback
      expect(response.status).toBe(200);
      expect(data.review).toBeDefined();
      expect(data.review).toContain('Test Business');
    });

    test('falls back to template when OpenRouter returns invalid response', async () => {
      // Mock invalid response
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [],
          }),
        } as Response)
      );
      global.fetch = mockFetch;

      const request = createRequest({
        businessName: 'Test Business',
        stars: 5,
        language: 'en',
      });
      const context = createContext(request);

      const response = await onRequest(context);
      const data = await response.json() as { review?: string };

      expect(response.status).toBe(200);
      expect(data.review).toBeDefined();
      expect(data.review).toContain('Test Business');
    });
  });

  describe('CORS', () => {
    test('handles OPTIONS preflight request', async () => {
      const request = new Request('http://localhost:8787/api/generate-review', {
        method: 'OPTIONS',
      });
      const context = createContext(request);

      const response = await onRequest(context);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    test('includes CORS headers in response', async () => {
      const noKeyEnv: Env = {
        DB: {} as D1Database,
        OPENROUTER_API_KEY: undefined as unknown as string,
      };
      const request = createRequest({
        businessName: 'Test Business',
        stars: 5,
      });
      const context = createContext(request, noKeyEnv);

      const response = await onRequest(context);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });
});
