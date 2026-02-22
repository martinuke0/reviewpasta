import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type BusinessRow = Database['public']['Tables']['businesses']['Row'];
type BusinessInsert = Database['public']['Tables']['businesses']['Insert'];

export interface Business {
  id: string;
  name: string;
  slug: string;
  place_id: string;
  location?: string | null;
  description?: string | null;
  created_at: string;
}

// Convert Supabase row to Business interface
function convertToBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    place_id: row.place_id,
    location: row.location,
    description: row.description,
    created_at: row.created_at,
  };
}

export async function getAllBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching businesses:', error);
    throw new Error('Failed to fetch businesses');
  }

  return data.map(convertToBusiness);
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching business:', error);
    throw new Error('Failed to fetch business');
  }

  return data ? convertToBusiness(data) : null;
}

export async function addBusiness(
  data: Omit<Business, 'id' | 'created_at'>
): Promise<string> {
  // Check if slug already exists
  const existing = await getBusinessBySlug(data.slug);
  if (existing) {
    throw new Error('A business with this name already exists');
  }

  const insertData: BusinessInsert = {
    name: data.name,
    slug: data.slug,
    place_id: data.place_id,
    location: data.location || null,
    description: data.description || null,
  };

  const { data: inserted, error } = await supabase
    .from('businesses')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error adding business:', error);
    throw new Error('Failed to add business');
  }

  return inserted.id;
}
