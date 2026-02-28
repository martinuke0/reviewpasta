# Phase 2: Backend APIs - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Build REST API endpoints in Cloudflare Workers for business management (CRUD operations) and AI-powered review generation via OpenRouter. This phase delivers the Workers API that the frontend will consume in Phase 3. Frontend integration is out of scope here.

</domain>

<decisions>
## Implementation Decisions

### HTTP Status Codes
- **Minimal set: 200/400/500**
- 200 for all successful operations (GET, POST)
- 400 for client errors (validation failures, invalid input)
- 500 for server errors (database failures, OpenRouter issues)

### Business List Pagination
- **Add pagination support to GET /api/businesses**
- Use query parameters for pagination controls
- Enables scalability as business count grows

### Claude's Discretion
- Success response format (bare data vs envelope wrapper)
- Error response structure (simple string vs detailed object)
- Validation rules for business creation (what fields are required/optional)
- Error message wording and specificity
- Review generation implementation (prompting strategy, retry logic, failure handling)
- Business slug handling (auto-generation, collision strategy, validation format)
- CORS configuration details

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard REST API approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-backend-apis*
*Context gathered: 2026-02-28*
