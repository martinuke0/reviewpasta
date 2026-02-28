import * as d1Db from './d1Db';

export interface Business {
  id?: string;
  name: string;
  slug: string;
  place_id: string;
  location?: string;
  description?: string;
  created_at?: Date | string;
}

// Database functions - now directly calling D1 API
export async function getAllBusinesses(): Promise<Business[]> {
  return await d1Db.getAllBusinesses();
}

export async function getBusinessBySlug(slug: string): Promise<Business | undefined | null> {
  return await d1Db.getBusinessBySlug(slug);
}

export async function addBusiness(data: Omit<Business, 'id' | 'created_at'>): Promise<string> {
  return await d1Db.addBusiness(data);
}
