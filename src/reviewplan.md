 Queue-Based Pre-Computed Review System

 Overview

 Implement a FIFO queue system that pre-generates AI reviews from OpenRouter, stores them in the database, and serves them
 instantly to users. When a review is consumed (popped from front), trigger background regeneration and push new review to back
 of queue.

 Current Architecture

 Database Setup

 - Frontend: Dexie (IndexedDB) for local caching
 - Backend: Supabase (PostgreSQL) for persistence
 - Current Tables: businesses only
 - Review Generation: On-demand via OpenRouter API (causes latency)

 Problem with Current System

 1. API Latency: Every review request waits 1-2 seconds for OpenRouter
 2. Rate Limits: Direct API calls can hit rate limits
 3. Cost: No request batching or optimization
 4. User Experience: Loading spinners on every page load

 Proposed Architecture

 Queue Strategy: Generic Review Pool

 Key Insight: Reviews are generic templates that get personalized with {business} placeholder. We don't need business-specific
 queues.

 Queue Organization:
 - One queue per (language, rating) combination
 - 10 combinations: 2 languages × 5 ratings = 10 queues
 - Each queue maintains 20-30 pre-generated reviews
 - When queue drops below 10 reviews, trigger regeneration

 Benefits

 - Instant serving: No API wait time
 - Better AI reviews: Can use better models since cost is spread over time
 - Rate limit friendly: Batch generation in background
 - Graceful degradation: Fallback to templates if queue empty

 Database Schema Changes

 New Table: review_pool

 CREATE TABLE public.review_pool (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   language TEXT NOT NULL CHECK (language IN ('en', 'ro')),
   stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
   review_template TEXT NOT NULL,
   is_used BOOLEAN DEFAULT FALSE,
   used_at TIMESTAMP WITH TIME ZONE,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
 );

 -- Indexes for efficient queue operations
 CREATE INDEX idx_review_pool_queue
   ON public.review_pool(language, stars, is_used, created_at);

 -- Index for cleanup
 CREATE INDEX idx_review_pool_used
   ON public.review_pool(used_at) WHERE is_used = true;

 Schema Design Decisions:
 - review_template: Contains {business} placeholder (e.g., "Great experience at {business}!")
 - is_used: Soft delete - mark as used instead of deleting immediately
 - used_at: Track when review was consumed (for analytics/cleanup)
 - language + stars: Queue identifier
 - No business_id - reviews are generic and reusable

 RLS Policies

 -- Anyone can view unused reviews
 CREATE POLICY "Anyone can view unused reviews"
   ON public.review_pool FOR SELECT
   USING (is_used = false);

 -- Service role can insert reviews (background job only)
 CREATE POLICY "Service role can insert reviews"
   ON public.review_pool FOR INSERT
   WITH CHECK (true);

 -- Anyone can mark reviews as used
 CREATE POLICY "Anyone can mark reviews as used"
   ON public.review_pool FOR UPDATE
   USING (is_used = false)
   WITH CHECK (is_used = true);

 Cleanup Strategy

 Run periodic cleanup (daily cron):
 -- Delete used reviews older than 7 days
 DELETE FROM public.review_pool
 WHERE is_used = true
   AND used_at < now() - interval '7 days';

 Implementation Plan

 Phase 1: Database Setup

 File: supabase/migrations/YYYYMMDDHHMMSS_create_review_pool.sql

 1. Create review_pool table with indexes
 2. Add RLS policies
 3. Run migration on Supabase

 Phase 2: Queue Consumer (Frontend)

 File: src/lib/reviewQueue.ts (new file)

 import { supabase } from '@/integrations/supabase/client';
 import { reviewTemplates, type Language } from './reviewGenerator';

 export interface QueuedReview {
   id: string;
   review_template: string;
 }

 /**
  * Pop a review from the queue (FIFO) and mark as used
  */
 export async function popReview(
   language: Language,
   stars: number
 ): Promise<string | null> {
   try {
     // 1. Get oldest unused review for this queue
     const { data: reviews, error: fetchError } = await supabase
       .from('review_pool')
       .select('id, review_template')
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
         checkAndTriggerRegeneration(language, stars);
       });

     return review.review_template;
   } catch (error) {
     console.error('Error popping review from queue:', error);
     return null;
   }
 }

 /**
  * Check queue size and trigger regeneration if below threshold
  */
 async function checkAndTriggerRegeneration(
   language: Language,
   stars: number
 ) {
   try {
     const { count } = await supabase
       .from('review_pool')
       .select('id', { count: 'exact', head: true })
       .eq('language', language)
       .eq('stars', stars)
       .eq('is_used', false);

     // Trigger regeneration if below threshold
     if (count !== null && count < 10) {
       await triggerReviewGeneration(language, stars, 20 - count);
     }
   } catch (error) {
     console.warn('Error checking queue size:', error);
   }
 }

 /**
  * Trigger Supabase Edge Function to generate reviews
  */
 async function triggerReviewGeneration(
   language: Language,
   stars: number,
   count: number
 ) {
   try {
     await supabase.functions.invoke('generate-review-batch', {
       body: { language, stars, count },
     });
   } catch (error) {
     console.warn('Error triggering review generation:', error);
   }
 }

 /**
  * Get a review - try queue first, fallback to template
  */
 export async function getReview(
   businessName: string,
   language: Language,
   stars: number
 ): Promise<string> {
   // Try to get from queue
   const queuedReview = await popReview(language, stars);

   if (queuedReview) {
     return queuedReview.replace(/{business}/g, businessName);
   }

   // Fallback: use template
   console.log('Queue empty, using template fallback');
   const rating = Math.max(1, Math.min(5, Math.round(stars))) as 1 | 2 | 3 | 4 | 5;
   const templates = reviewTemplates[language][rating];
   const template = templates[Math.floor(Math.random() * templates.length)];
   return template.replace(/{business}/g, businessName);
 }

 Key Features:
 - FIFO queue consumption (oldest first)
 - Optimistic updates (mark as used, don't wait)
 - Auto-triggers regeneration when queue < 10
 - Graceful fallback to templates if queue empty

 Phase 3: Queue Producer (Backend)

 File: supabase/functions/generate-review-batch/index.ts (new file)

 import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

 const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
 const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
 const MODEL = 'auto'; // Let OpenRouter choose best free model

 interface GenerateRequest {
   language: 'en' | 'ro';
   stars: number;
   count: number;
 }

 serve(async (req) => {
   try {
     const { language, stars, count }: GenerateRequest = await req.json();

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

     // Generate reviews in batch
     const reviews = await generateReviews(language, stars, count);

     // Insert into queue
     const { error } = await supabase.from('review_pool').insert(
       reviews.map((review_template) => ({
         language,
         stars,
         review_template,
         is_used: false,
       }))
     );

     if (error) throw error;

     return new Response(
       JSON.stringify({
         success: true,
         generated: reviews.length,
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

   const prompt = `Generate ${count} unique, short, natural Google review templates.
 Rating: ${stars} stars
 Language: ${languageName}
 Tone: ${toneMap[stars]}
 Style: Conversational, authentic, like a real person
 Length: 1-2 sentences maximum

 Important: Use {business} as placeholder for business name.
 Example: "Great experience at {business}! Highly recommend."

 Generate ONLY the review templates, one per line, no numbering, no quotes.`;

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
       temperature: 0.8,
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
     .filter((line: string) => line.length > 0 && line.includes('{business}'))
     .slice(0, count); // Ensure we don't exceed requested count

   return reviews;
 }

 Key Features:
 - Batch generation (up to 50 reviews per call)
 - Service role authentication (secure)
 - Validates queue parameters
 - Rate-limit friendly (batches requests)
 - Error handling with fallbacks

 Phase 4: Initial Queue Population

 File: supabase/functions/initialize-queue/index.ts (new file)

 One-time script to populate all 10 queues with initial reviews:

 import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

 serve(async (req) => {
   const supabase = createClient(
     Deno.env.get('SUPABASE_URL') ?? '',
     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
   );

   const languages = ['en', 'ro'];
   const ratings = [1, 2, 3, 4, 5];
   const reviewsPerQueue = 25;

   const results = [];

   for (const language of languages) {
     for (const stars of ratings) {
       try {
         // Call generate-review-batch function
         const { data, error } = await supabase.functions.invoke(
           'generate-review-batch',
           {
             body: { language, stars, count: reviewsPerQueue },
           }
         );

         if (error) throw error;

         results.push({ language, stars, status: 'success', data });
       } catch (error) {
         results.push({ language, stars, status: 'error', error: error.message });
       }
     }
   }

   return new Response(JSON.stringify({ results }), {
     headers: { 'Content-Type': 'application/json' },
   });
 });

 Usage:
 # Run once to populate all queues
 curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/initialize-queue \
   -H "Authorization: Bearer YOUR_ANON_KEY"

 Phase 5: Update Frontend to Use Queue

 File: src/pages/ReviewPage.tsx

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

     // Use queue-based instant generation
     const review = await getReview(data.name, language as Language, 5);
     setReview(review);
   };
   fetchBusiness();
 }, [businessSlug, language]);

 // Update star click handler
 const handleStarClick = async (rating: number) => {
   setStars(rating);
   if (business) {
     const review = await getReview(business.name, language as Language, rating);
     setReview(review);
   }
 };

 Changes:
 - Replace generateReviewInstant with getReview from queue
 - Still instant (queue lookup is ~50ms)
 - Auto-triggers regeneration in background
 - Graceful fallback to templates

 Phase 6: Monitoring & Maintenance

 Dashboard Query (for Supabase SQL Editor):
 -- Check queue health
 SELECT
   language,
   stars,
   COUNT(*) FILTER (WHERE is_used = false) as available,
   COUNT(*) FILTER (WHERE is_used = true) as used,
   COUNT(*) as total
 FROM review_pool
 GROUP BY language, stars
 ORDER BY language, stars;

 Expected Output:
 | language | stars | available | used | total |
 |----------|-------|-----------|------|-------|
 | en       | 1     | 18        | 7    | 25    |
 | en       | 2     | 22        | 3    | 25    |
 | en       | 3     | 20        | 5    | 25    |
 | en       | 4     | 15        | 10   | 25    |
 | en       | 5     | 12        | 13   | 25    |
 | ro       | 1     | 19        | 6    | 25    |
 | ro       | 2     | 23        | 2    | 25    |
 | ro       | 3     | 21        | 4    | 25    |
 | ro       | 4     | 16        | 9    | 25    |
 | ro       | 5     | 14        | 11   | 25    |

 Alerts:
 - If any queue drops below 5 reviews, manually trigger regeneration
 - Monitor used_at timestamps to detect usage patterns
 - Track generation failures in logs

 Critical Files to Create/Modify

 New Files

 1. supabase/migrations/YYYYMMDD_create_review_pool.sql
   - Create review_pool table
   - Add indexes and RLS policies
 2. supabase/functions/generate-review-batch/index.ts
   - Batch review generator (producer)
   - Called by frontend when queue is low
 3. supabase/functions/initialize-queue/index.ts
   - One-time queue initialization
   - Populates all 10 queues
 4. src/lib/reviewQueue.ts
   - Queue consumer logic
   - popReview(), getReview() functions
   - Auto-regeneration triggers

 Modified Files

 1. src/pages/ReviewPage.tsx
   - Replace instant template generation with queue consumption
   - Update imports and function calls
 2. .env / Supabase Environment Variables
   - Add OPENROUTER_API_KEY to Supabase secrets

 Implementation Workflow

 Step 1: Database Setup (5 min)

 # Create migration
 supabase migration new create_review_pool

 # Edit migration file with SQL from Phase 1
 # Push to Supabase
 supabase db push

 Step 2: Deploy Edge Functions (10 min)

 # Deploy batch generator
 supabase functions deploy generate-review-batch

 # Deploy initializer
 supabase functions deploy initialize-queue

 # Set OpenRouter API key
 supabase secrets set OPENROUTER_API_KEY=your_key_here

 Step 3: Initialize Queues (2 min)

 # Populate all 10 queues
 curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/initialize-queue \
   -H "Authorization: Bearer YOUR_ANON_KEY"

 # Verify in Supabase dashboard
 # Should see ~250 total reviews (25 per queue × 10 queues)

 Step 4: Update Frontend (10 min)

 - Create src/lib/reviewQueue.ts
 - Update ReviewPage.tsx to use queue
 - Test locally before deploying

 Step 5: Deploy & Monitor (ongoing)

 - Deploy frontend changes
 - Monitor queue health daily
 - Set up alerts for low queues

 Benefits of This Architecture

 Performance

 - Instant reviews: ~50ms queue lookup vs 1-2s API call
 - No loading spinners: Reviews appear immediately
 - Better UX: Seamless experience

 Cost Efficiency

 - Batch generation: More efficient API usage
 - Rate limit friendly: Spread requests over time
 - Better models: Can afford higher quality models with batching

 Reliability

 - Graceful degradation: Falls back to templates if queue empty
 - Auto-regeneration: Queue maintains itself
 - No single point of failure: Templates always work

 Scalability

 - Horizontal scaling: Add more queues for more languages
 - Easy monitoring: Simple SQL queries show queue health
 - Low maintenance: Self-healing system

 Verification Steps

 Test Queue Population

 -- Check all queues have reviews
 SELECT language, stars, COUNT(*)
 FROM review_pool
 WHERE is_used = false
 GROUP BY language, stars;

 Test Queue Consumption

 1. Visit review page for a business
 2. Verify: Review appears instantly (< 100ms)
 3. Change star rating 5 times rapidly
 4. Verify: All reviews appear instantly
 5. Check Supabase dashboard
 6. Verify: 5 reviews marked as is_used = true

 Test Auto-Regeneration

 1. Manually mark 16 reviews as used in one queue (leaving only 9)
 2. Pop one more review (drops to 8, below threshold of 10)
 3. Check Supabase logs
 4. Verify: generate-review-batch function was called
 5. Wait 30 seconds
 6. Check queue again
 7. Verify: Queue refilled to ~20 reviews

 Test Fallback

 1. Manually delete all reviews from a specific queue
 2. Visit review page and select that rating
 3. Verify: Still shows review (template fallback)
 4. Check console logs
 5. Verify: "Queue empty, using template fallback" message

 Future Enhancements

 Phase 2 Features

 1. Cron-based regeneration: Supabase cron job to maintain queues overnight
 2. Analytics: Track which reviews perform best (click-through rates)
 3. A/B testing: Multiple review styles, track user preferences
 4. Smart queues: Learn from usage patterns, pre-generate popular combinations
 5. Multi-model support: Use different AI models for different ratings
 6. Review variations: Generate multiple versions, rotate through them

 Advanced Features

 1. Business-specific queues: Pre-generate for high-traffic businesses
 2. User feedback: Let users rate reviews, improve AI prompts
 3. Dynamic templates: Learn from user edits to improve future generations
 4. Rate limiting: Prevent queue abuse with usage quotas
 5. Cache warming: Pre-populate queues during low-traffic hours