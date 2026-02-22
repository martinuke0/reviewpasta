-- Complete database setup for ReviewPasta
-- Creates profiles, businesses, and waitlist tables with RLS policies

-- ============================================
-- Step 1: Create profiles table FIRST
-- (needed for RLS policies that reference it)
-- ============================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Auto-create profile on signup
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (NEW.id, NEW.email, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Step 2: Create businesses table
-- ============================================

CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  place_id TEXT NOT NULL,
  location TEXT,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_businesses_slug ON public.businesses(slug);
CREATE INDEX idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX idx_businesses_created_at ON public.businesses(created_at);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Anyone can view businesses (public access)
CREATE POLICY "Anyone can view businesses"
  ON public.businesses FOR SELECT
  USING (true);

-- Authenticated users can insert businesses
CREATE POLICY "Authenticated users can insert"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admins or owners can update businesses
CREATE POLICY "Admins or owners can update"
  ON public.businesses FOR UPDATE
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- Step 3: Create waitlist table
-- ============================================

CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_description TEXT NOT NULL,
  business_url TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can submit to waitlist (no auth required)
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

-- Only admins can view waitlist (phone numbers are admin-only)
CREATE POLICY "Admins can view waitlist"
  ON public.waitlist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can update waitlist status
CREATE POLICY "Admins can update waitlist"
  ON public.waitlist FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- Step 4: Insert sample businesses (optional)
-- ============================================

INSERT INTO public.businesses (name, slug, place_id, location, description) VALUES
  ('The Rock Gym Copou', 'the-rock-gym-copou', 'ChIJy5STiSj7ykAR4jKYiteg_NQ', 'Iași, Romania', 'Indoor climbing gym and fitness center'),
  ('Scorpions Kick Boxing Iași', 'scorpions-kick-boxing-iasi', 'ChIJ96NAZC77ykARP_uaR7eKjRs', 'Iași, Romania', 'Martial arts and kickboxing training center');
