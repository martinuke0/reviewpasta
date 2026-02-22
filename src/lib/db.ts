import Dexie, { Table } from 'dexie';

export interface Business {
  id?: string;
  name: string;
  slug: string;
  place_id: string;
  location?: string;
  description?: string;
  created_at?: Date;
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

// Helper functions
export async function getAllBusinesses(): Promise<Business[]> {
  return await db.businesses.orderBy('created_at').reverse().toArray();
}

export async function getBusinessBySlug(slug: string): Promise<Business | undefined> {
  return await db.businesses.where('slug').equals(slug).first();
}

export async function addBusiness(data: Omit<Business, 'id' | 'created_at'>): Promise<string> {
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
