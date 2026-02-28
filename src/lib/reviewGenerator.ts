// Workers API-powered review generation with template fallback

export type Language = 'en' | 'ro';

// Short, natural, authentic templates in both English and Romanian
export const reviewTemplates: Record<Language, Record<1 | 2 | 3 | 4 | 5, string[]>> = {
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

async function generateAIReview(
  businessName: string,
  location: string | undefined,
  description: string | undefined,
  stars: number,
  language: Language
): Promise<string> {
  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  const response = await fetch(`${API_BASE_URL}/generate-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName,
      location,
      description,
      stars,
      language,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.review;
}

export async function generateReview(
  businessName: string,
  location: string | undefined,
  description: string | undefined,
  stars: number,
  language: Language = 'en'
): Promise<string> {
  // Try AI generation first, fall back to templates if it fails
  try {
    return await generateAIReview(businessName, location, description, stars, language);
  } catch (error) {
    console.warn('AI review generation failed, falling back to templates:', error);
    return generateTemplateReview(businessName, stars, language);
  }
}
