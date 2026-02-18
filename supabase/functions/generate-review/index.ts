import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessName, location, stars } = await req.json();

    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const starText = stars === 5 ? "amazing" : stars === 4 ? "great" : stars === 3 ? "decent" : stars === 2 ? "mediocre" : "poor";

    const prompt = `Write a short, natural-sounding Google review (2-3 sentences) for "${businessName}"${location ? ` in ${location}` : ''}. The reviewer had a ${starText} experience (${stars}/5 stars). Make it sound like a real person wrote it — casual, specific, and unique. Do not use quotation marks around the review. Do not include the star rating in the text.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You write short, authentic Google reviews. Be casual and natural.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 150,
        temperature: 0.9,
      }),
    });

    const data = await response.json();
    const review = data.choices?.[0]?.message?.content?.trim();

    if (!review) {
      throw new Error('No review generated');
    }

    return new Response(JSON.stringify({ review }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
