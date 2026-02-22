import Dexie, { Table } from 'dexie';
import * as supabaseDb from './supabaseDb';

// Feature flag to switch between IndexedDB and Supabase
const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true';

export interface Business {
  id?: string;
  name: string;
  slug: string;
  place_id: string;
  location?: string;
  description?: string;
  created_at?: Date | string;
}

export class ReviewPastaDatabase extends Dexie {
  businesses!: Table<Business>;

  constructor() {
    super('ReviewPastaDB');
    this.version(1).stores({
      businesses: '++id, slug, created_at',
    });
  }
}

export const db = new ReviewPastaDatabase();

// Helper functions with feature flag
export async function getAllBusinesses(): Promise<Business[]> {
  if (USE_SUPABASE) {
    return await supabaseDb.getAllBusinesses();
  }
  return await db.businesses.orderBy('created_at').reverse().toArray();
}

export async function getBusinessBySlug(slug: string): Promise<Business | undefined | null> {
  if (USE_SUPABASE) {
    return await supabaseDb.getBusinessBySlug(slug);
  }
  return await db.businesses.where('slug').equals(slug).first();
}

export async function addBusiness(data: Omit<Business, 'id' | 'created_at'>): Promise<string> {
  if (USE_SUPABASE) {
    return await supabaseDb.addBusiness(data);
  }

  // Check if slug already exists
  const existing = await getBusinessBySlug(data.slug);
  if (existing) {
    throw new Error('A business with this name already exists');
  }

  const id = crypto.randomUUID();
  const business: Business = {
    ...data,
    id,
    created_at: new Date(),
  };

  await db.businesses.add(business);
  return id;
}
