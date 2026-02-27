-- Create businesses table matching Supabase schema
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  place_id TEXT,
  location TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes for efficient queries
CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_created_at ON businesses(created_at);
