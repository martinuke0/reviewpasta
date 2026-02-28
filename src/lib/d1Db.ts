import type { Business } from './db';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function getAllBusinesses(): Promise<Business[]> {
  const response = await fetch(`${API_BASE_URL}/businesses`);
  if (!response.ok) {
    console.error('Error fetching businesses:', await response.text());
    throw new Error('Failed to fetch businesses');
  }
  return await response.json();
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const response = await fetch(`${API_BASE_URL}/businesses/${slug}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    console.error('Error fetching business:', await response.text());
    throw new Error('Failed to fetch business');
  }
  return await response.json();
}

export async function addBusiness(
  data: Omit<Business, 'id' | 'created_at'>
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/businesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (response.status === 409) {
    throw new Error('A business with this name already exists');
  }
  if (!response.ok) {
    console.error('Error adding business:', await response.text());
    throw new Error('Failed to add business');
  }

  const business = await response.json();
  return business.id;
}
