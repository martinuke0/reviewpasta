/**
 * ReviewPasta API - Pages Functions Handler
 * Handles all /api/* routes for business management and review generation
 */

interface Env {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
}

type Language = 'en' | 'ro';

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
    console.error('Error creating business:', error);

    // Handle unique constraint violation (duplicate slug)
    if (error.message?.includes('UNIQUE constraint failed')) {
      return errorResponse('Business with this slug already exists', 409);
    }

    return errorResponse('Failed to create business', 500);
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

  // GET /api/businesses - List all businesses
  if (pathname === '/api/businesses' && request.method === 'GET') {
    return handleListBusinesses(env, request);
  }

  // POST /api/businesses - Create new business
  if (pathname === '/api/businesses' && request.method === 'POST') {
    return handleCreateBusiness(env, request);
  }

  // GET /api/businesses/:slug - Get business by slug
  const slug = extractSlug(pathname);
  if (slug && request.method === 'GET') {
    return handleGetBusiness(env, slug);
  }

  // No matching route
  return errorResponse('Not Found', 404);
}
