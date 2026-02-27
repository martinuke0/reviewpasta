/**
 * ReviewPasta API Worker
 * Handles all API routes for business management and review generation
 */

export interface Env {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
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
 */
async function handleListBusinesses(env: Env): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, name, slug, place_id, location, description, created_at FROM businesses ORDER BY created_at DESC'
    ).all();

    return jsonResponse(results);
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
 * Handle POST /api/businesses - Create new business
 */
async function handleCreateBusiness(env: Env, request: Request): Promise<Response> {
  try {
    const body = await request.json() as {
      name: string;
      slug: string;
      place_id?: string;
      location?: string;
      description?: string;
    };

    // Validate required fields
    if (!body.name || !body.slug) {
      return errorResponse('Missing required fields: name, slug', 400);
    }

    // Generate unique ID
    const id = crypto.randomUUID();

    // Insert business
    await env.DB.prepare(
      'INSERT INTO businesses (id, name, slug, place_id, location, description) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      body.name,
      body.slug,
      body.place_id || null,
      body.location || null,
      body.description || null
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
 * Main Worker fetch handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // Route API requests
    if (pathname.startsWith('/api/')) {
      // GET /api/businesses - List all businesses
      if (pathname === '/api/businesses' && request.method === 'GET') {
        return handleListBusinesses(env);
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

    // Non-API routes return 404
    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders
    });
  },
};
