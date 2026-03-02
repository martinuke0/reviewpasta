/**
 * ReviewPasta API - Pages Functions Handler
 * Handles all /api/* routes for business management and review generation
 */

interface Env {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
  ADMIN_PASSWORD?: string;
}

type Language = 'en' | 'ro';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Review templates ported from src/lib/reviewGenerator.ts
const reviewTemplates: Record<Language, Record<1 | 2 | 3 | 4 | 5, string[]>> = {
  en: {
    5: [
      "Great experience at {business}! Definitely recommend.",
      "{business} was excellent. Will come back.",
      "Really happy with {business}. Good quality and service.",
      "Highly recommend {business}. Very satisfied.",
      "{business} exceeded my expectations. Great place.",
      "Fantastic service at {business}. Worth every penny.",
      "Love {business}! Everything was perfect.",
      "{business} is the real deal. Won't disappoint.",
    ],
    4: [
      "Good experience at {business}. Would return.",
      "{business} is solid. No complaints.",
      "Happy with my visit to {business}.",
      "{business} was nice. Good service.",
      "Enjoyed {business}. Delivered what I expected.",
      "Pleasant experience at {business}. Recommended.",
      "{business} did a good job. Satisfied overall.",
    ],
    3: [
      "{business} was okay. Nothing special.",
      "Average experience at {business}.",
      "{business} is decent, could be better.",
      "It's alright at {business}. Nothing stands out.",
      "{business} met basic expectations.",
      "Mixed feelings about {business}.",
    ],
    2: [
      "Disappointed with {business}. Expected more.",
      "{business} was below expectations.",
      "Not impressed with {business}.",
      "{business} needs improvement in several areas.",
      "Had issues at {business}. Not great.",
    ],
    1: [
      "Poor experience at {business}.",
      "{business} was not good. Would not recommend.",
      "Disappointed with {business}. Won't return.",
      "Bad service at {business}. Not worth it.",
      "{business} fell well short. Avoid.",
    ],
  },
  ro: {
    5: [
      "Experiență grozavă la {business}! Recomand cu încredere.",
      "{business} a fost excelent. Cu siguranță mă voi întoarce.",
      "Foarte mulțumit de {business}. Calitate și servicii bune.",
      "Recomand cu căldură {business}. Foarte satisfăcut.",
      "{business} a depășit așteptările. Loc grozav.",
      "Servicii fantastice la {business}. Merită fiecare ban.",
      "Îmi place {business}! Totul a fost perfect.",
      "{business} este de încredere. Nu vei fi dezamăgit.",
    ],
    4: [
      "Experiență bună la {business}. M-aș întoarce.",
      "{business} este solid. Fără probleme.",
      "Mulțumit de vizita la {business}.",
      "{business} a fost plăcut. Servicii bune.",
      "M-am bucurat de {business}. A îndeplinit așteptările.",
      "Experiență plăcută la {business}. Recomand.",
      "{business} a făcut treabă bună. Mulțumit în general.",
    ],
    3: [
      "{business} a fost ok. Nimic special.",
      "Experiență medie la {business}.",
      "{business} este decent, ar putea fi mai bine.",
      "E în regulă la {business}. Nimic remarcabil.",
      "{business} a îndeplinit așteptările de bază.",
      "Sentimente mixte despre {business}.",
    ],
    2: [
      "Dezamăgit de {business}. Mă așteptam la mai mult.",
      "{business} a fost sub așteptări.",
      "Nu sunt impresionat de {business}.",
      "{business} necesită îmbunătățiri în mai multe zone.",
      "Am avut probleme la {business}. Nu prea bine.",
    ],
    1: [
      "Experiență slabă la {business}.",
      "{business} nu a fost bine. Nu recomand.",
      "Dezamăgit de {business}. Nu mă voi întoarce.",
      "Servicii proaste la {business}. Nu merită.",
      "{business} a fost mult sub așteptări. Evitați.",
    ],
  },
};

/**
 * Generate a review using templates
 */
function generateTemplateReview(
  businessName: string,
  stars: number,
  language: Language
): string {
  const rating = Math.max(1, Math.min(5, Math.round(stars))) as 1 | 2 | 3 | 4 | 5;
  const templates = reviewTemplates[language][rating];
  const template = templates[Math.floor(Math.random() * templates.length)];

  const review = template.replace(/{business}/g, businessName);
  return review.trim();
}

/**
 * Generate a review using OpenRouter AI
 */
async function generateAIReview(
  businessName: string,
  location: string | undefined,
  description: string | undefined,
  stars: number,
  language: Language,
  apiKey: string,
  requestUrl: string
): Promise<string> {
  const rating = Math.max(1, Math.min(5, Math.round(stars)));

  // Build context about the business
  let businessContext = businessName;
  if (description) {
    businessContext += ` (${description})`;
  }
  if (location) {
    businessContext += ` in ${location}`;
  }

  // Toned-down, more natural tone descriptions
  const toneMap: Record<number, string> = {
    5: 'positive and satisfied',
    4: 'positive',
    3: 'neutral with mixed feelings',
    2: 'disappointed but constructive',
    1: 'disappointed and critical',
  };

  const languageName = language === 'ro' ? 'Romanian' : 'English';

  const prompt = `Write a short, natural Google review for ${businessContext}.
Rating: ${stars} stars
Language: ${languageName}
Tone: ${toneMap[rating]}
Style: Conversational, authentic, like a real person
Length: 1-2 sentences, keep it brief

Write ONLY the review text in ${languageName}, no quotes, no formatting.`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': requestUrl,
      'X-Title': 'ReviewPasta',
    },
    body: JSON.stringify({
      model: 'auto',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json() as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const review = data.choices?.[0]?.message?.content?.trim();

  if (!review) {
    throw new Error('No review generated');
  }

  return review;
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handle CORS preflight requests
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create error response
 */
function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

/**
 * Extract slug from URL path
 * /api/businesses/:slug -> slug
 */
function extractSlug(pathname: string): string | null {
  const match = pathname.match(/^\/api\/businesses\/([^/]+)$/);
  return match ? match[1] : null;
}

/**
 * Handle GET /api/businesses - List all businesses
 * Supports optional pagination via query parameters:
 * - page: Page number (default: 1, min: 1)
 * - limit: Items per page (default: 20, max: 100)
 *
 * Without pagination params: returns array of businesses (backward compatible)
 * With pagination params: returns { data: [...], pagination: { page, limit, total, totalPages } }
 */
async function handleListBusinesses(env: Env, request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');

    // Check if pagination params are provided
    const hasPaginationParams = pageParam !== null || limitParam !== null;

    if (!hasPaginationParams) {
      // Backward compatibility: no pagination params, return all results
      const { results } = await env.DB.prepare(
        'SELECT id, name, slug, place_id, location, description, created_at FROM businesses ORDER BY created_at DESC'
      ).all();

      return jsonResponse(results);
    }

    // Parse and validate pagination parameters
    let page = parseInt(pageParam || '1', 10);
    let limit = parseInt(limitParam || '20', 10);

    // Handle edge cases
    if (isNaN(page) || page < 1) {
      page = 1;
    }

    if (isNaN(limit) || limit < 1) {
      limit = 20;
    }

    // Cap limit at 100
    if (limit > 100) {
      limit = 100;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM businesses'
    ).first<{ count: number }>();

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Get paginated results
    const { results } = await env.DB.prepare(
      'SELECT id, name, slug, place_id, location, description, created_at FROM businesses ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset).all();

    // Return paginated response with metadata
    return jsonResponse({
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error listing businesses:', error);
    return errorResponse('Failed to fetch businesses', 500);
  }
}

/**
 * Handle GET /api/businesses/:slug - Get single business by slug
 */
async function handleGetBusiness(env: Env, slug: string): Promise<Response> {
  try {
    const business = await env.DB.prepare(
      'SELECT id, name, slug, place_id, location, description, created_at FROM businesses WHERE slug = ?'
    ).bind(slug).first();

    if (!business) {
      return errorResponse('Business not found', 404);
    }

    return jsonResponse(business);
  } catch (error) {
    console.error('Error fetching business:', error);
    return errorResponse('Failed to fetch business', 500);
  }
}

/**
 * Generate slug from name
 * Converts name to lowercase, replaces spaces/special chars with hyphens
 * Example: "Bob's Pizza!" -> "bobs-pizza"
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Verify admin authorization header
 */
function verifyAdminAuth(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!env.ADMIN_PASSWORD) {
    return false;
  }
  return authHeader === `Bearer ${env.ADMIN_PASSWORD}`;
}

/**
 * Handle POST /api/generate-review - Generate review for a business
 */
async function handleGenerateReview(env: Env, request: Request): Promise<Response> {
  try {
    const body = await request.json() as {
      businessName?: string;
      location?: string;
      description?: string;
      stars?: number;
      language?: string;
    };

    // Validate required fields
    if (!body.businessName || typeof body.businessName !== 'string') {
      return errorResponse('businessName is required and must be a string', 400);
    }

    if (body.stars === undefined || body.stars === null) {
      return errorResponse('stars is required', 400);
    }

    const stars = Number(body.stars);
    if (isNaN(stars) || stars < 1 || stars > 5) {
      return errorResponse('stars must be a number between 1 and 5', 400);
    }

    // Validate and normalize language
    let language: Language = 'en';
    if (body.language) {
      const lang = body.language.toLowerCase();
      if (lang === 'ro') {
        language = 'ro';
      } else if (lang !== 'en') {
        // Default to English for invalid languages
        language = 'en';
      }
    }

    const businessName = body.businessName.trim();

    // Check if API key exists and is valid
    const hasValidApiKey = env.OPENROUTER_API_KEY &&
                          env.OPENROUTER_API_KEY !== 'your-api-key-here';

    let review: string;

    if (hasValidApiKey) {
      // Try AI generation with fallback to templates
      try {
        review = await generateAIReview(
          businessName,
          body.location,
          body.description,
          stars,
          language,
          env.OPENROUTER_API_KEY,
          request.url
        );
      } catch (error) {
        console.warn('AI review generation failed, falling back to templates:', error);
        review = generateTemplateReview(businessName, stars, language);
      }
    } else {
      // No valid API key, use templates
      review = generateTemplateReview(businessName, stars, language);
    }

    return jsonResponse({ review });
  } catch (error) {
    console.error('Error generating review:', error);
    return errorResponse('Failed to generate review', 500);
  }
}

/**
 * Handle POST /api/businesses - Create new business
 */
async function handleCreateBusiness(env: Env, request: Request): Promise<Response> {
  try {
    const body = await request.json() as {
      name?: string;
      slug?: string;
      place_id?: string;
      location?: string;
      description?: string;
    };

    // Validate name (required)
    if (!body.name || typeof body.name !== 'string') {
      return errorResponse('Name is required and must be a string', 400);
    }

    const name = body.name.trim();
    if (name.length === 0) {
      return errorResponse('Name cannot be empty', 400);
    }
    if (name.length > 100) {
      return errorResponse('Name must be 100 characters or less', 400);
    }

    // Validate or generate slug
    let slug = body.slug?.trim() || '';
    const slugWasProvided = !!body.slug;

    if (!slug) {
      // Auto-generate slug from name if not provided
      slug = generateSlug(name);
      if (!slug) {
        return errorResponse('Could not generate valid slug from name', 400);
      }
    } else {
      // Validate manually provided slug
      if (slug.length > 50) {
        return errorResponse('Slug must be 50 characters or less', 400);
      }
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return errorResponse('Slug must contain only lowercase letters, numbers, and hyphens', 400);
      }
    }

    // Validate place_id (optional)
    if (body.place_id !== undefined && body.place_id !== null) {
      if (typeof body.place_id !== 'string' || body.place_id.trim().length === 0) {
        return errorResponse('Place ID must be a non-empty string if provided', 400);
      }
    }

    // Validate location (optional)
    if (body.location !== undefined && body.location !== null) {
      if (typeof body.location !== 'string') {
        return errorResponse('Location must be a string if provided', 400);
      }
      if (body.location.length > 200) {
        return errorResponse('Location must be 200 characters or less', 400);
      }
    }

    // Validate description (optional)
    if (body.description !== undefined && body.description !== null) {
      if (typeof body.description !== 'string') {
        return errorResponse('Description must be a string if provided', 400);
      }
      if (body.description.length > 500) {
        return errorResponse('Description must be 500 characters or less', 400);
      }
    }

    // Try to insert with retry on auto-generated slug conflict
    let attemptCount = 0;
    const maxAttempts = 2;

    while (attemptCount < maxAttempts) {
      try {
        // Generate unique ID
        const id = crypto.randomUUID();

        // Insert business
        await env.DB.prepare(
          'INSERT INTO businesses (id, name, slug, place_id, location, description) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
          id,
          name,
          slug,
          body.place_id?.trim() || null,
          body.location?.trim() || null,
          body.description?.trim() || null
        ).run();

        // Fetch and return created business
        const business = await env.DB.prepare(
          'SELECT id, name, slug, place_id, location, description, created_at FROM businesses WHERE id = ?'
        ).bind(id).first();

        return jsonResponse(business, 201);
      } catch (error: any) {
        // Handle unique constraint violation (duplicate slug)
        if (error.message?.includes('UNIQUE constraint failed')) {
          attemptCount++;

          // If slug was manually provided, don't retry - return 409
          if (slugWasProvided) {
            return errorResponse('A business with this slug already exists. Please choose a different slug.', 409);
          }

          // If auto-generated and first attempt, retry with random suffix
          if (attemptCount < maxAttempts) {
            // Generate random 4-character suffix
            const randomSuffix = Math.random().toString(36).substring(2, 6);
            slug = `${slug}-${randomSuffix}`;
            continue;
          }

          // Max attempts reached
          return errorResponse('Unable to generate unique slug. Please try again or provide a custom slug.', 409);
        }

        // Other errors, re-throw
        throw error;
      }
    }

    // Should not reach here, but handle edge case
    return errorResponse('Failed to create business', 500);
  } catch (error: any) {
    console.error('Error creating business:', error);
    return errorResponse('Failed to create business', 500);
  }
}

/**
 * Handle POST /api/auth/verify - Verify admin password
 */
async function handleVerifyAuth(env: Env, request: Request): Promise<Response> {
  try {
    const body = await request.json() as { password: string };

    if (!env.ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD not configured in environment');
      return errorResponse('Admin auth not configured', 500);
    }

    // Trim whitespace from both passwords for comparison
    const providedPassword = (body.password || '').trim();
    const expectedPassword = env.ADMIN_PASSWORD.trim();

    console.log('Auth attempt:', {
      providedLength: providedPassword.length,
      expectedLength: expectedPassword.length,
      match: providedPassword === expectedPassword
    });

    if (providedPassword === expectedPassword) {
      return jsonResponse({ success: true });
    }

    return errorResponse('Invalid password', 401);
  } catch (error) {
    console.error('Error verifying auth:', error);
    return errorResponse('Failed to verify auth', 500);
  }
}

/**
 * Handle PUT /api/businesses/:slug - Update business
 */
async function handleUpdateBusiness(env: Env, request: Request, slug: string): Promise<Response> {
  // Check admin authorization
  if (!verifyAdminAuth(request, env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json() as {
      name?: string;
      place_id?: string;
      location?: string;
      description?: string;
    };

    // If name changed, regenerate slug
    let newSlug = slug;
    if (body.name) {
      newSlug = generateSlug(body.name);
    }

    // Build dynamic SQL UPDATE query
    const updates: string[] = [];
    const bindings: any[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      bindings.push(body.name);
      updates.push('slug = ?');
      bindings.push(newSlug);
    }
    if (body.place_id !== undefined) {
      updates.push('place_id = ?');
      bindings.push(body.place_id);
    }
    if (body.location !== undefined) {
      updates.push('location = ?');
      bindings.push(body.location);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      bindings.push(body.description);
    }

    if (updates.length === 0) {
      return errorResponse('No fields to update', 400);
    }

    // Add slug to bindings for WHERE clause
    bindings.push(slug);

    const sql = `
      UPDATE businesses
      SET ${updates.join(', ')}
      WHERE slug = ?
      RETURNING id, name, slug, place_id, location, description, created_at
    `;

    const result = await env.DB.prepare(sql).bind(...bindings).first();

    if (!result) {
      return errorResponse('Business not found', 404);
    }

    return jsonResponse(result);
  } catch (error) {
    console.error('Error updating business:', error);
    return errorResponse('Failed to update business', 500);
  }
}

/**
 * Handle DELETE /api/businesses/:slug - Delete business
 */
async function handleDeleteBusiness(env: Env, request: Request, slug: string): Promise<Response> {
  // Check admin authorization
  if (!verifyAdminAuth(request, env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const result = await env.DB.prepare('DELETE FROM businesses WHERE slug = ?')
      .bind(slug)
      .run();

    if (result.meta.changes === 0) {
      return errorResponse('Business not found', 404);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Error deleting business:', error);
    return errorResponse('Failed to delete business', 500);
  }
}

/**
 * Handle GET /api/stats - Get admin statistics
 */
async function handleGetStats(env: Env, request: Request): Promise<Response> {
  // Check admin authorization
  if (!verifyAdminAuth(request, env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    // Total count
    const totalResult = await env.DB.prepare('SELECT COUNT(*) as count FROM businesses').first() as any;
    const total = (totalResult?.count as number) || 0;

    // This month count
    const thisMonthResult = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM businesses
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `).first() as any;
    const thisMonth = (thisMonthResult?.count as number) || 0;

    // Recent 5 businesses
    const recentResult = await env.DB.prepare(`
      SELECT id, name, slug, place_id, location, description, created_at
      FROM businesses
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    return jsonResponse({
      total,
      thisMonth,
      recentBusinesses: recentResult.results || []
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return errorResponse('Failed to fetch stats', 500);
  }
}

/**
 * Pages Function handler - exports onRequest for all HTTP methods
 */
export async function onRequest(context: EventContext<Env, string, unknown>): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const { pathname } = url;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleOptions();
  }

  // POST /api/auth/verify - Verify admin password
  if (pathname === '/api/auth/verify' && request.method === 'POST') {
    return handleVerifyAuth(env, request);
  }

  // GET /api/stats - Get admin statistics
  if (pathname === '/api/stats' && request.method === 'GET') {
    return handleGetStats(env, request);
  }

  // GET /api/businesses - List all businesses
  if (pathname === '/api/businesses' && request.method === 'GET') {
    return handleListBusinesses(env, request);
  }

  // POST /api/businesses - Create new business
  if (pathname === '/api/businesses' && request.method === 'POST') {
    return handleCreateBusiness(env, request);
  }

  // POST /api/generate-review - Generate review
  if (pathname === '/api/generate-review' && request.method === 'POST') {
    return handleGenerateReview(env, request);
  }

  // Business-specific routes with slug
  const slug = extractSlug(pathname);
  if (slug) {
    // GET /api/businesses/:slug - Get business by slug
    if (request.method === 'GET') {
      return handleGetBusiness(env, slug);
    }

    // PUT /api/businesses/:slug - Update business
    if (request.method === 'PUT') {
      return handleUpdateBusiness(env, request, slug);
    }

    // DELETE /api/businesses/:slug - Delete business
    if (request.method === 'DELETE') {
      return handleDeleteBusiness(env, request, slug);
    }
  }

  // No matching route
  return errorResponse('Not Found', 404);
}
