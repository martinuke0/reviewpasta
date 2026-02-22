# Queue-Based Pre-Computed Review System

## Overview
Implement a FIFO queue system that pre-generates AI reviews from OpenRouter, stores them in the database, and serves them instantly to users. When a review is consumed (popped from front), trigger background regeneration and push new review to back of queue.

## Current Architecture

### Database Setup
- **Frontend**: Dexie (IndexedDB) for local caching
- **Backend**: Supabase (PostgreSQL) for persistence
- **Current Tables**: `businesses` only
- **Review Generation**: On-demand via OpenRouter API (causes latency)

### Problem with Current System
1. **API Latency**: Every review request waits 1-2 seconds for OpenRouter
2. **Rate Limits**: Direct API calls can hit rate limits
3. **Cost**: No request batching or optimization
4. **User Experience**: Loading spinners on every page load

## Proposed Architecture

### Queue Strategy: Business-Specific Review Pool

**Key Insight**: Each business gets unique, contextual AI reviews based on their name and description. Reviews should feel human-written, not formulaic.

**Queue Organization**:
- One queue per `(business_id, language, rating)` combination
- Each business/language/rating gets 5-10 pre-generated unique reviews
- Reviews are contextual and don't always mention business name
- When queue drops below 3 reviews, trigger regeneration for that specific business

**Review Quality Principles**:
- ✅ Use business name and description for context
- ✅ Vary sentence structure and content
- ✅ Don't always mention business name (more natural)
- ✅ Unique reviews per business (not templates)
- ❌ No {business} placeholders - fully generated text

### Benefits
- **Instant serving**: No API wait time
- **Unique reviews**: Each business gets contextual, specific reviews
- **Human-like**: Varied language, natural flow
- **Rate limit friendly**: Batch generation in background
- **Graceful degradation**: Fallback to templates if queue empty

## Database Schema Changes

### New Table: `review_pool`

```sql
CREATE TABLE public.review_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('en', 'ro')),
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  review_text TEXT NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for efficient queue operations
CREATE INDEX idx_review_pool_queue
  ON public.review_pool(business_id, language, stars, is_used, created_at);

-- Index for finding unused reviews for a specific business/language/rating
CREATE INDEX idx_review_pool_available
  ON public.review_pool(business_id, language, stars, created_at)
  WHERE is_used = false;

-- Index for cleanup
CREATE INDEX idx_review_pool_used
  ON public.review_pool(used_at) WHERE is_used = true;
```

**Schema Design Decisions**:
- `business_id`: Foreign key to businesses - reviews are business-specific
- `review_text`: Fully generated review text (no placeholders)
- `is_used`: Soft delete - mark as used instead of deleting immediately
- `used_at`: Track when review was consumed (for analytics/cleanup)
- `business_id` + `language` + `stars`: Queue identifier
- ON DELETE CASCADE: Auto-cleanup reviews when business is deleted

### RLS Policies

**Security Model**:
- Frontend can **read** unused reviews (needed to serve them to users)
- Frontend can **mark reviews as used** (when consumed)
- Only backend (service role) can **create** new reviews
- Used reviews are **hidden** from public (analytics/privacy)

```sql
-- Public read access: Users can fetch unused reviews for their business
CREATE POLICY "Public can view unused reviews"
  ON public.review_pool FOR SELECT
  USING (is_used = false);

-- Public update access: Users can mark reviews as used when consuming
CREATE POLICY "Public can mark reviews as used"
  ON public.review_pool FOR UPDATE
  USING (is_used = false AND business_id IS NOT NULL)
  WITH CHECK (is_used = true AND used_at IS NOT NULL);

-- Service role only: Only backend can insert new reviews (secure)
CREATE POLICY "Service role can insert reviews"
  ON public.review_pool FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

**Why this is secure**:
- ✅ Public users can only READ unused reviews (no sensitive data)
- ✅ Users can only mark reviews as used (one-way transition)
- ✅ Only backend can CREATE reviews (prevents spam/abuse)
- ✅ Used reviews are hidden (privacy - tracks what was shown to whom)
- ✅ No deletion allowed (audit trail preserved)

### Cleanup Strategy

Run periodic cleanup (daily cron):
```sql
-- Delete used reviews older than 7 days
DELETE FROM public.review_pool
WHERE is_used = true
  AND used_at < now() - interval '7 days';
```

## Implementation Plan

### Phase 1: Database Setup

**File**: `supabase/migrations/YYYYMMDDHHMMSS_create_review_pool.sql`

1. Create `review_pool` table with indexes
2. Add RLS policies
3. Run migration on Supabase

### Phase 2: Queue Consumer (Frontend)

**File**: `src/lib/reviewQueue.ts` (new file)

```typescript
import { supabase } from '@/integrations/supabase/client';
import { reviewTemplates, type Language } from './reviewGenerator';

export interface QueuedReview {
  id: string;
  review_text: string;
}

/**
 * Pop a review from the queue (FIFO) and mark as used
 */
export async function popReview(
  businessId: string,
  language: Language,
  stars: number
): Promise<string | null> {
  try {
    // 1. Get oldest unused review for this business/language/rating
    const { data: reviews, error: fetchError } = await supabase
      .from('review_pool')
      .select('id, review_text')
      .eq('business_id', businessId)
      .eq('language', language)
      .eq('stars', stars)
      .eq('is_used', false)
      .order('created_at', { ascending: true })
      .limit(1);

    if (fetchError) throw fetchError;
    if (!reviews || reviews.length === 0) return null;

    const review = reviews[0];

    // 2. Mark as used (optimistic - don't wait for response)
    supabase
      .from('review_pool')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', review.id)
      .then(() => {
        // 3. Trigger regeneration if queue is low (non-blocking)
        checkAndTriggerRegeneration(businessId, language, stars);
      });

    return review.review_text;
  } catch (error) {
    console.error('Error popping review from queue:', error);
    return null;
  }
}

/**
 * Check queue size and trigger regeneration if below threshold
 */
async function checkAndTriggerRegeneration(
  businessId: string,
  language: Language,
  stars: number
) {
  try {
    const { count } = await supabase
      .from('review_pool')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('language', language)
      .eq('stars', stars)
      .eq('is_used', false);

    // Trigger regeneration if below threshold of 3
    if (count !== null && count < 3) {
      // Get business details for context
      const { data: business } = await supabase
        .from('businesses')
        .select('name, location, description')
        .eq('id', businessId)
        .single();

      if (business) {
        await triggerReviewGeneration(
          businessId,
          business.name,
          business.location,
          business.description,
          language,
          stars,
          5 // Generate 5 new reviews to refill
        );
      }
    }
  } catch (error) {
    console.warn('Error checking queue size:', error);
  }
}

/**
 * Trigger Supabase Edge Function to generate reviews
 */
async function triggerReviewGeneration(
  businessId: string,
  businessName: string,
  location: string | null,
  description: string | null,
  language: Language,
  stars: number,
  count: number
) {
  try {
    await supabase.functions.invoke('generate-review-batch', {
      body: {
        business_id: businessId,
        business_name: businessName,
        location,
        description,
        language,
        stars,
        count,
      },
    });
  } catch (error) {
    console.warn('Error triggering review generation:', error);
  }
}

/**
 * Get a review - try queue first, fallback to template
 */
export async function getReview(
  businessId: string,
  businessName: string,
  language: Language,
  stars: number
): Promise<string> {
  // Try to get from queue
  const queuedReview = await popReview(businessId, language, stars);

  if (queuedReview) {
    return queuedReview; // No placeholder replacement - fully generated text
  }

  // Fallback: use template with business name
  console.log('Queue empty, using template fallback');
  const rating = Math.max(1, Math.min(5, Math.round(stars))) as 1 | 2 | 3 | 4 | 5;
  const templates = reviewTemplates[language][rating];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace(/{business}/g, businessName);
}
```

**Key Features**:
- Business-specific queue consumption
- FIFO (oldest first)
- Optimistic updates (mark as used, don't wait)
- Auto-triggers regeneration when queue < 3
- Passes business context for regeneration
- Graceful fallback to templates if queue empty

### Phase 3: Queue Producer (Backend)

**File**: `supabase/functions/generate-review-batch/index.ts` (new file)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'auto'; // Let OpenRouter choose best free model

interface GenerateRequest {
  business_id: string;
  business_name: string;
  location: string | null;
  description: string | null;
  language: 'en' | 'ro';
  stars: number;
  count: number;
}

serve(async (req) => {
  try {
    const {
      business_id,
      business_name,
      location,
      description,
      language,
      stars,
      count
    }: GenerateRequest = await req.json();

    // Validate input
    if (!['en', 'ro'].includes(language) || stars < 1 || stars > 5 || count > 50) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate business-specific reviews
    const reviews = await generateReviews(
      business_name,
      location,
      description,
      language,
      stars,
      count
    );

    // Insert into queue
    const { error } = await supabase.from('review_pool').insert(
      reviews.map((review_text) => ({
        business_id,
        language,
        stars,
        review_text,
        is_used: false,
      }))
    );

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        generated: reviews.length,
        business_id,
        business_name,
        language,
        stars
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-review-batch:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function generateReviews(
  businessName: string,
  location: string | null,
  description: string | null,
  language: string,
  stars: number,
  count: number
): Promise<string[]> {
  const toneMap: Record<number, string> = {
    5: 'positive and satisfied',
    4: 'positive',
    3: 'neutral with mixed feelings',
    2: 'disappointed but constructive',
    1: 'disappointed and critical',
  };

  const languageName = language === 'ro' ? 'Romanian' : 'English';

  // Build business context
  let businessContext = businessName;
  if (description) businessContext += ` (${description})`;
  if (location) businessContext += ` in ${location}`;

  const prompt = `Generate ${count} unique, short, natural Google reviews for ${businessContext}.

Rating: ${stars} stars
Language: ${languageName}
Tone: ${toneMap[stars]}
Style: Conversational, authentic, like a real person would write

IMPORTANT RULES:
- Write in ${languageName} ONLY
- Length: 1-2 sentences maximum
- Vary your sentence structure and content
- You MAY mention the business name, but you don't have to in every review
- Make each review unique and contextual to this specific business
- Sound natural and human, not formulaic or repetitive

Examples of good variation:
- "Great experience! Definitely recommend."
- "Really happy with ${businessName}. Good quality and service."
- "${businessName} was excellent. Will come back for sure."
- "Highly recommend. Very satisfied with everything."

Generate ${count} unique reviews, one per line, no numbering, no quotes.`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://reviewpasta.app',
      'X-Title': 'ReviewPasta Queue Generator',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9, // Higher temp for more variety
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim();

  if (!content) throw new Error('No reviews generated');

  // Split by newline and clean up
  const reviews = content
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0 && line.length < 500) // Reasonable length
    .slice(0, count); // Ensure we don't exceed requested count

  return reviews;
}
```

**Key Features**:
- Business-specific review generation
- Uses business name, location, description for context
- Varies review style - doesn't always mention business name
- Higher temperature (0.9) for variety
- Batch generation (up to 50 reviews per call)
- Service role authentication (secure)
- Error handling with fallbacks

### Phase 4: Initial Queue Population

**File**: `supabase/functions/initialize-queue-for-business/index.ts` (new file)

Function to populate reviews for a specific business (called when new business is added):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface InitRequest {
  business_id: string;
}

serve(async (req) => {
  try {
    const { business_id }: InitRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get business details
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, location, description')
      .eq('id', business_id)
      .single();

    if (businessError || !business) {
      throw new Error('Business not found');
    }

    const languages = ['en', 'ro'];
    const ratings = [1, 2, 3, 4, 5];
    const reviewsPerQueue = 5; // Start with 5 reviews per rating/language

    const results = [];

    for (const language of languages) {
      for (const stars of ratings) {
        try {
          // Call generate-review-batch function
          const { data, error } = await supabase.functions.invoke(
            'generate-review-batch',
            {
              body: {
                business_id: business.id,
                business_name: business.name,
                location: business.location,
                description: business.description,
                language,
                stars,
                count: reviewsPerQueue,
              },
            }
          );

          if (error) throw error;

          results.push({
            business_id,
            language,
            stars,
            status: 'success',
            data,
          });
        } catch (error) {
          results.push({
            business_id,
            language,
            stars,
            status: 'error',
            error: error.message,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        business_id,
        business_name: business.name,
        results,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in initialize-queue-for-business:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

**Usage**:
```bash
# Populate reviews for a specific business after it's added
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/initialize-queue-for-business \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"business_id": "uuid-here"}'
```

**Alternative: Auto-initialize on business creation**:
Optionally create a database trigger that calls this function automatically when a new business is added.

### Phase 5: Update Frontend to Use Queue

**File**: `src/pages/ReviewPage.tsx`

```typescript
import { getReview } from '@/lib/reviewQueue';

// Update useEffect for instant load
useEffect(() => {
  const fetchBusiness = async () => {
    const data = await getBusinessBySlug(businessSlug!);
    if (!data) {
      setLoading(false);
      return;
    }
    setBusiness(data);
    setLoading(false);

    // Use queue-based instant generation (business-specific)
    if (data.id) {
      const review = await getReview(data.id, data.name, language as Language, 5);
      setReview(review);
    }
  };
  fetchBusiness();
}, [businessSlug, language]);

// Update star click handler
const handleStarClick = async (rating: number) => {
  setStars(rating);
  if (business && business.id) {
    const review = await getReview(business.id, business.name, language as Language, rating);
    setReview(review);
  }
};
```

**Changes**:
- Replace `generateReviewInstant` with `getReview` from queue
- Pass `business.id` for business-specific reviews
- Still instant (queue lookup is ~50ms)
- Auto-triggers regeneration in background
- Graceful fallback to templates

**Also update `AddBusiness.tsx`**: After adding a new business, optionally trigger initial queue population:

```typescript
// In AddBusiness.tsx after successful business creation
const business_id = newBusiness.id;

// Trigger background queue initialization (non-blocking)
supabase.functions
  .invoke('initialize-queue-for-business', {
    body: { business_id },
  })
  .catch((error) => console.warn('Queue init failed:', error));
```

### Phase 6: Monitoring & Maintenance

**Dashboard Queries** (for Supabase SQL Editor):

**1. Queue Health by Business**:
```sql
-- Check queue health for each business
SELECT
  b.name as business_name,
  rp.language,
  rp.stars,
  COUNT(*) FILTER (WHERE rp.is_used = false) as available,
  COUNT(*) FILTER (WHERE rp.is_used = true) as used,
  COUNT(*) as total
FROM review_pool rp
JOIN businesses b ON b.id = rp.business_id
GROUP BY b.name, rp.language, rp.stars
ORDER BY b.name, rp.language, rp.stars;
```

**2. Global Queue Overview**:
```sql
-- Overall queue statistics
SELECT
  language,
  stars,
  COUNT(*) FILTER (WHERE is_used = false) as available,
  COUNT(*) FILTER (WHERE is_used = true) as used,
  AVG(CASE WHEN is_used = false THEN 1 ELSE 0 END) * 100 as availability_pct
FROM review_pool
GROUP BY language, stars
ORDER BY language, stars;
```

**3. Businesses Needing Queue Refills**:
```sql
-- Find businesses with low queue counts (< 3 available)
SELECT
  b.id,
  b.name,
  rp.language,
  rp.stars,
  COUNT(*) as available
FROM businesses b
JOIN review_pool rp ON rp.business_id = b.id
WHERE rp.is_used = false
GROUP BY b.id, b.name, rp.language, rp.stars
HAVING COUNT(*) < 3
ORDER BY COUNT(*) ASC, b.name;
```

**4. Usage Analytics**:
```sql
-- Review consumption patterns (last 7 days)
SELECT
  DATE(used_at) as date,
  COUNT(*) as reviews_used,
  COUNT(DISTINCT business_id) as businesses_served
FROM review_pool
WHERE is_used = true
  AND used_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(used_at)
ORDER BY date DESC;
```

**Expected Scenarios**:
- ✅ Healthy: Each business has 3-10 available reviews per language/rating
- ⚠️ Warning: Any business has < 3 available (auto-regeneration triggered)
- ❌ Critical: Business has 0 available reviews (falls back to templates)

**Alerts**:
- Monitor businesses with < 3 reviews (should auto-refill)
- Track used_at timestamps to detect usage spikes
- Watch for businesses consistently hitting 0 (might need higher thresholds)

## Critical Files to Create/Modify

### New Files
1. **`supabase/migrations/YYYYMMDD_create_review_pool.sql`**
   - Create `review_pool` table with `business_id` foreign key
   - Add indexes (business_id, language, stars, is_used)
   - Add RLS policies (public read/update, service role insert)

2. **`supabase/functions/generate-review-batch/index.ts`**
   - Batch review generator (producer) for specific business
   - Generates contextual, unique reviews
   - Called by frontend when business queue is low

3. **`supabase/functions/initialize-queue-for-business/index.ts`**
   - Queue initialization for new business
   - Populates all 10 queues (2 languages × 5 ratings) with 5 reviews each
   - Called after business creation

4. **`src/lib/reviewQueue.ts`**
   - Queue consumer logic
   - `popReview()`, `getReview()` functions
   - Business-specific queue lookups
   - Auto-regeneration triggers

### Modified Files
1. **`src/pages/ReviewPage.tsx`**
   - Replace instant template generation with queue consumption
   - Pass `business.id` to `getReview()`
   - Update imports and function calls

2. **`src/pages/AddBusiness.tsx`** (optional)
   - Add queue initialization after business creation
   - Non-blocking background call

3. **`.env` / Supabase Environment Variables**
   - Add `OPENROUTER_API_KEY` to Supabase secrets

## Implementation Workflow

### Step 1: Database Setup (5 min)
```bash
# Create migration
supabase migration new create_review_pool

# Edit migration file with SQL from Phase 1
# Push to Supabase
supabase db push
```

### Step 2: Deploy Edge Functions (10 min)
```bash
# Deploy batch generator
supabase functions deploy generate-review-batch

# Deploy business queue initializer
supabase functions deploy initialize-queue-for-business

# Set OpenRouter API key
supabase secrets set OPENROUTER_API_KEY=your_key_here
```

### Step 3: Initialize Queues for Existing Businesses (5-10 min)
```bash
# Get all business IDs
# Then for each business, call:
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/initialize-queue-for-business \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"business_id": "uuid-here"}'

# Verify in Supabase dashboard
# Each business should have ~50 reviews (2 languages × 5 ratings × 5 reviews)
```

### Step 4: Update Frontend (10 min)
- Create `src/lib/reviewQueue.ts`
- Update `ReviewPage.tsx` to use queue (pass business.id)
- Optionally update `AddBusiness.tsx` to trigger queue init
- Test locally before deploying

### Step 5: Deploy & Monitor (ongoing)
- Deploy frontend changes
- Monitor queue health per business
- Watch for businesses needing refills
- Set up alerts for businesses with < 3 reviews

## Benefits of This Architecture

### Performance
- **Instant reviews**: ~50ms queue lookup vs 1-2s API call
- **No loading spinners**: Reviews appear immediately on first visit
- **Better UX**: Seamless, fast experience

### Review Quality
- **Business-specific**: Each business gets unique, contextual reviews
- **AI-powered**: Better quality than generic templates
- **Natural variation**: Reviews don't always mention business name
- **Contextual**: Uses business description and location for relevance

### Cost Efficiency
- **Batch generation**: More efficient API usage
- **Rate limit friendly**: Spread requests over time
- **Better models**: Can afford higher quality models with batching
- **On-demand refill**: Only generates when needed

### Reliability
- **Graceful degradation**: Falls back to templates if queue empty
- **Auto-regeneration**: Queues maintain themselves
- **No single point of failure**: Templates always work
- **Business isolation**: One business's empty queue doesn't affect others

### Scalability
- **Per-business queues**: Each business gets dedicated reviews
- **Easy monitoring**: SQL queries show health per business
- **Low maintenance**: Self-healing system
- **Flexible thresholds**: Adjust queue size per business needs

## Verification Steps

### Test Queue Population for Business
```sql
-- Check a specific business has reviews in all queues
SELECT
  b.name,
  rp.language,
  rp.stars,
  COUNT(*) as total_reviews,
  COUNT(*) FILTER (WHERE rp.is_used = false) as available
FROM businesses b
JOIN review_pool rp ON rp.business_id = b.id
WHERE b.slug = 'your-business-slug'
GROUP BY b.name, rp.language, rp.stars
ORDER BY rp.language, rp.stars;

-- Should show 10 rows (2 languages × 5 ratings), each with 5 available reviews
```

### Test Queue Consumption
1. Visit review page for a specific business
2. **Verify**: Review appears instantly (< 100ms)
3. **Verify**: Review is unique and contextual (not generic template)
4. **Verify**: Review may or may not mention business name (natural variation)
5. Change star rating 5 times rapidly
6. **Verify**: All reviews appear instantly and are unique
7. Check Supabase dashboard
8. **Verify**: 5 reviews marked as `is_used = true` for that business

### Test Auto-Regeneration
1. Find a business's queue for a specific language/rating
2. Manually mark reviews as used until only 2 remain (below threshold of 3)
3. Visit review page and pop one more review (drops to 1)
4. **Verify**: Auto-regeneration triggered in background
5. Wait 30-60 seconds (AI generation time)
6. Check queue again
7. **Verify**: Queue refilled to ~5-6 reviews

### Test Fallback
1. Manually delete all reviews for a specific business/language/rating
2. Visit review page and select that rating
3. **Verify**: Still shows review (template fallback with business name)
4. Check console logs
5. **Verify**: "Queue empty, using template fallback" message

### Test Business-Specific Content
1. Create two businesses with different descriptions
2. Initialize queues for both
3. Compare their 5-star reviews in the database
4. **Verify**: Reviews are contextually different (not identical)
5. **Verify**: Some reviews mention business name, some don't
6. **Verify**: Reviews reflect business type/description

## Future Enhancements

### Phase 2 Features
1. **Cron-based regeneration**: Supabase cron job to maintain queues overnight
2. **Analytics**: Track which reviews perform best (click-through rates)
3. **A/B testing**: Multiple review styles, track user preferences
4. **Smart queues**: Learn from usage patterns, pre-generate popular combinations
5. **Multi-model support**: Use different AI models for different ratings
6. **Review variations**: Generate multiple versions, rotate through them

### Advanced Features
1. **Business-specific queues**: Pre-generate for high-traffic businesses
2. **User feedback**: Let users rate reviews, improve AI prompts
3. **Dynamic templates**: Learn from user edits to improve future generations
4. **Rate limiting**: Prevent queue abuse with usage quotas
5. **Cache warming**: Pre-populate queues during low-traffic hours
