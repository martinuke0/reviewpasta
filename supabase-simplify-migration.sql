-- Simplify ReviewPasta - Remove All Authentication & Complexity
-- Run this SQL in your Supabase SQL Editor

-- Drop all RLS policies
DROP POLICY IF EXISTS "Anyone can view businesses" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.businesses;
DROP POLICY IF EXISTS "Admins or owners can update" ON public.businesses;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can view waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can update waitlist" ON public.waitlist;

-- Drop the admin check function
DROP FUNCTION IF EXISTS public.is_admin();

-- Drop the auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop unnecessary tables
DROP TABLE IF EXISTS public.waitlist;
DROP TABLE IF EXISTS public.profiles;

-- Remove owner_id from businesses
ALTER TABLE public.businesses DROP COLUMN IF EXISTS owner_id;

-- Disable RLS on businesses - make it fully public
ALTER TABLE public.businesses DISABLE ROW LEVEL SECURITY;

-- Make businesses fully public (no restrictions)
GRANT ALL ON public.businesses TO anon;
GRANT ALL ON public.businesses TO authenticated;
