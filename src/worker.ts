/**
 * ReviewPasta API Worker
 * Handles all API routes for business management and review generation
 */

export interface Env {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
  ADMIN_PASSWORD?: string;
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
 * Generate URL-safe slug from business name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
    const totalResult = await env.DB.prepare('SELECT COUNT(*) as count FROM businesses').first();
    const total = totalResult?.count || 0;

    // This month count
    const thisMonthResult = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM businesses
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `).first();
    const thisMonth = thisMonthResult?.count || 0;

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
        return handleListBusinesses(env);
      }

      // POST /api/businesses - Create new business
      if (pathname === '/api/businesses' && request.method === 'POST') {
        return handleCreateBusiness(env, request);
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

    // Non-API routes return 404
    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders
    });
  },
};
