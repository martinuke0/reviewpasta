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
  owner_id?: string | null;
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

export async function addBusiness(data: Omit<Business, 'id' | 'created_at' | 'owner_id'>): Promise<string> {
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

export async function updateBusinessDescription(businessId: string, description: string): Promise<void> {
  if (USE_SUPABASE) {
    return await supabaseDb.updateBusinessDescription(businessId, description);
  }
  throw new Error('Update not supported in IndexedDB mode');
}

export async function canEditBusiness(businessId: string, userId?: string): Promise<boolean> {
  if (USE_SUPABASE) {
    return await supabaseDb.canEditBusiness(businessId, userId);
  }
  return false; // No auth in IndexedDB mode
}

export async function initTestData(): Promise<void> {
  const count = await db.businesses.count();

  if (count === 0) {
    const testBusinesses: Omit<Business, 'id' | 'created_at'>[] = [
      {
        name: 'The Rock Gym Copou',
        slug: 'the-rock-gym-copou',
        place_id: 'ChIJy5STiSj7ykAR4jKYiteg_NQ',
        location: 'Iași, Romania',
        description: 'Indoor climbing gym and fitness center',
      },
      {
        name: 'Scorpions Kick Boxing Iași',
        slug: 'scorpions-kick-boxing-iasi',
        place_id: 'ChIJ96NAZC77ykARP_uaR7eKjRs',
        location: 'Iași, Romania',
        description: 'Martial arts and kickboxing training center',
      },
    ];

    for (const business of testBusinesses) {
      await addBusiness(business);
    }
  }
}
