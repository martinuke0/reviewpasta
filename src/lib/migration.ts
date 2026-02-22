import { db, Business as DexieBusiness } from './db';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type BusinessInsert = Database['public']['Tables']['businesses']['Insert'];

const MIGRATION_KEY = 'reviewpasta_migrated_to_supabase';

export async function shouldRunMigration(): Promise<boolean> {
  // Check if migration has already been completed
  const migrated = localStorage.getItem(MIGRATION_KEY);
  if (migrated === 'true') {
    return false;
  }

  // Check if there are any businesses in IndexedDB
  const count = await db.businesses.count();
  return count > 0;
}

export async function migrateDataToSupabase(): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let migratedCount = 0;

  try {
    console.log('Starting migration from IndexedDB to Supabase...');

    // Get all businesses from Dexie
    const dexieBusinesses = await db.businesses.toArray();

    if (dexieBusinesses.length === 0) {
      console.log('No businesses to migrate');
      localStorage.setItem(MIGRATION_KEY, 'true');
      return { success: true, migratedCount: 0, errors: [] };
    }

    console.log(`Found ${dexieBusinesses.length} businesses to migrate`);

    // Get existing businesses from Supabase to avoid duplicates
    const { data: existingBusinesses } = await supabase
      .from('businesses')
      .select('slug');

    const existingSlugs = new Set(
      existingBusinesses?.map((b) => b.slug) || []
    );

    // Migrate each business
    for (const business of dexieBusinesses) {
      try {
        // Skip if already exists in Supabase
        if (existingSlugs.has(business.slug)) {
          console.log(`Skipping ${business.name} - already exists in Supabase`);
          continue;
        }

        const insertData: BusinessInsert = {
          name: business.name,
          slug: business.slug,
          place_id: business.place_id,
          location: business.location || null,
          description: business.description || null,
          owner_id: null, // Legacy data has no owner
          created_at: business.created_at?.toISOString() || new Date().toISOString(),
        };

        const { error } = await supabase
          .from('businesses')
          .insert(insertData);

        if (error) {
          console.error(`Error migrating ${business.name}:`, error);
          errors.push(`${business.name}: ${error.message}`);
        } else {
          migratedCount++;
          console.log(`Migrated ${business.name} successfully`);
        }
      } catch (error) {
        console.error(`Exception migrating ${business.name}:`, error);
        errors.push(`${business.name}: ${(error as Error).message}`);
      }
    }

    // Mark migration as complete
    localStorage.setItem(MIGRATION_KEY, 'true');

    console.log(`Migration complete: ${migratedCount}/${dexieBusinesses.length} businesses migrated`);

    return {
      success: errors.length === 0,
      migratedCount,
      errors,
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      migratedCount,
      errors: [(error as Error).message],
    };
  }
}

export function resetMigration(): void {
  localStorage.removeItem(MIGRATION_KEY);
}
