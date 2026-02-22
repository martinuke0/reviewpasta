# Quick Deployment Guide (No CLI Required)

Follow these steps to deploy the authentication and business editing features.

## Step 1: Apply Database Migration

1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/qlexfmopdsjykysgtwez
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the ENTIRE contents of `supabase/migrations/20260222000000_add_auth_and_ownership.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Wait for "Success. No rows returned" message

**Verify tables were created:**
Run this query in SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'waitlist');
```

You should see both `profiles` and `waitlist` tables listed.

## Step 2: Create Your First Admin User

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **Add user** (green button top right)
3. Choose **Create new user**
4. Enter your email address (the one you'll use to log in)
5. The system will auto-generate a password (you don't need it - we'll use magic links)
6. Click **Create user**

Now make yourself an admin:

7. Go back to **SQL Editor**
8. Run this query (replace with your email):

```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'your-email@example.com';
```

9. Verify you're an admin:

```sql
SELECT email, is_admin FROM public.profiles WHERE is_admin = true;
```

## Step 3: Configure Supabase Authentication

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://reviewpasta.vercel.app` (or your Vercel domain)
3. Add **Redirect URLs**:
   - `https://reviewpasta.vercel.app/**` (with wildcard)
   - `http://localhost:5173/**` (for local development)
4. Click **Save**

5. Go to **Authentication** → **Providers**
6. Make sure **Email** is enabled (toggle should be on)

## Step 4: Add Environment Variable to Vercel

1. Go to Vercel Dashboard: https://vercel.com
2. Select your ReviewPasta project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Name:** `VITE_USE_SUPABASE`
   - **Value:** `true`
   - **Environment:** Select all (Production, Preview, Development)
6. Click **Save**

## Step 5: Deploy to Production

```bash
# In your terminal (in the reviewpasta directory)
git add .
git commit -m "Add authentication and business editing features"
git push origin main
```

Vercel will automatically deploy (takes 2-3 minutes). Watch the deployment at: https://vercel.com

## Step 6: Test Everything

### Test 1: Waitlist Signup
1. Visit your production site: `https://reviewpasta.vercel.app`
2. Click **Request Access** (top right)
3. Fill out the waitlist form with test data
4. Submit and verify success message

### Test 2: Admin Login
1. Go back to Supabase Dashboard → **Authentication** → **Users**
2. Find your user, click the three dots → **Send magic link**
3. Check your email inbox
4. Click the magic link
5. You should be logged in automatically

### Test 3: Admin Dashboard
1. While logged in, visit: `https://reviewpasta.vercel.app/admin/waitlist`
2. You should see your test waitlist entry
3. Click **Send Magic Link** to test the copy-to-clipboard feature

### Test 4: Edit Business Description
1. Visit any business review page (e.g., one of the existing businesses)
2. You should see a **pencil icon** next to the business name
3. Click it → Edit the description → Save
4. Verify the description updates successfully

## Step 7: Approve Your First Real User

When someone submits a waitlist request:

1. Log in to your app as admin
2. Go to `/admin/waitlist`
3. Find the pending request
4. Click **Send Magic Link** → Link copies to clipboard
5. Email that link to the user using Gmail/Outlook/etc:
   ```
   Hi [Name],

   Your request to add [Business Name] to ReviewPasta has been approved!

   Click this link to access your account:
   [PASTE MAGIC LINK HERE]

   This link will log you in automatically.

   Thanks!
   ```
6. When they click the link, they're logged in and can add their business

## Troubleshooting

### "Migration failed" or SQL errors
- Make sure you copied the ENTIRE SQL file
- Check if tables already exist (run `SELECT * FROM profiles` - if it works, tables exist)
- Drop tables if needed and re-run:
  ```sql
  DROP TABLE IF EXISTS public.waitlist;
  DROP TABLE IF EXISTS public.profiles CASCADE;
  -- Then re-run the full migration
  ```

### "Edit button not showing"
- Verify `VITE_USE_SUPABASE=true` is set in Vercel
- Redeploy after adding the environment variable
- Check browser console for errors
- Make sure you're logged in

### "Cannot access admin dashboard"
- Verify you set `is_admin = true` in the profiles table
- Log out and log back in
- Check SQL: `SELECT * FROM profiles WHERE email = 'your-email'`

### "Magic link doesn't work"
- Check redirect URLs are configured correctly
- Make sure you're using the production domain
- Try the magic link in an incognito/private window

## Local Development

To test locally:

1. Create `.env` file:
```env
VITE_SUPABASE_URL=https://qlexfmopdsjykysgtwez.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...your-key-here
VITE_USE_SUPABASE=true
```

2. Run dev server:
```bash
npm run dev
```

3. Visit `http://localhost:5173`

## Next Steps

✅ **You're all set!** The authentication and business editing features are now live.

**Optional improvements:**
- Set up email notifications for new waitlist entries
- Create more admin users
- Customize the waitlist form
- Add business categories or tags
- Implement search functionality for businesses

## Need Help?

Check the logs:
- **Supabase logs:** https://supabase.com/dashboard/project/qlexfmopdsjykysgtwez/logs
- **Vercel logs:** https://vercel.com → Your Project → Deployments → Click deployment → View Function Logs
- **Browser console:** Right-click → Inspect → Console tab

Common SQL queries:
```sql
-- See all users
SELECT * FROM auth.users;

-- See all profiles
SELECT * FROM public.profiles;

-- See waitlist
SELECT * FROM public.waitlist;

-- See businesses
SELECT id, name, slug, owner_id FROM public.businesses;

-- Make someone an admin
UPDATE public.profiles SET is_admin = true WHERE email = 'email@example.com';
```
