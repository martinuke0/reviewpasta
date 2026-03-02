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

/**
 * Verify admin password
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.success === true;
    }
    return false;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return false;
  }
}

/**
 * Update business
 */
export async function updateBusiness(
  slug: string,
  updates: Partial<Omit<Business, 'id' | 'slug' | 'created_at'>>,
  adminPassword: string
): Promise<Business> {
  const response = await fetch(`${API_BASE_URL}/businesses/${slug}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminPassword}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update business');
  }

  return response.json();
}

/**
 * Delete business
 */
export async function deleteBusiness(slug: string, adminPassword: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/businesses/${slug}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminPassword}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete business');
  }
}

/**
 * Get admin stats
 */
export async function getAdminStats(adminPassword: string): Promise<{
  total: number;
  thisMonth: number;
  recentBusinesses: Business[];
}> {
  const response = await fetch(`${API_BASE_URL}/stats`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminPassword}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  return response.json();
}
