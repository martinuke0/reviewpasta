# Complete Deployment Guide - Supabase + Vercel

Follow this guide step-by-step to deploy your ReviewPasta app with authentication.

---

## 🗄️ PART 1: Setup Supabase Database

### Step 1.1: Access Your Supabase Dashboard

Your project already exists! Try accessing it:

**Direct Link:** https://supabase.com/dashboard/project/qlexfmopdsjykysgtwez

**OR**

1. Go to: https://supabase.com/dashboard
2. Sign in with your email
3. Look for project "reviewpasta" or similar

**Can't log in?** Try these emails:
- The email you used for Lovable
- Any email associated with this codebase
- Check your inbox for "Welcome to Supabase" emails

---

### Step 1.2: Apply Database Migration

Once you're in the Supabase Dashboard:

1. Click **SQL Editor** in the left sidebar (database icon)
2. Click **New Query** button (top right)
3. Open the file `supabase/migrations/20260222000000_add_auth_and_ownership.sql` on your computer
4. Copy ALL the contents (all 102 lines)
5. Paste into the SQL Editor
6. Click **Run** button (or press Cmd+Enter on Mac, Ctrl+Enter on Windows)
7. Wait for "Success. No rows returned" message

**✅ Verify it worked:**
Run this query:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'waitlist');
```

You should see:
```
profiles
waitlist
```

---

### Step 1.3: Create Your Admin Account

1. In Supabase Dashboard, click **Authentication** → **Users** (left sidebar)
2. Click green **Add user** button (top right)
3. Select **Create new user**
4. Enter YOUR email address (the one you'll use to manage the app)
5. Leave password empty (we'll use magic links)
6. Click **Create user**

Now make yourself an admin:

7. Go back to **SQL Editor**
8. Run this query (replace with YOUR email):

```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'your-email@example.com';
```

**✅ Verify you're admin:**
```sql
SELECT email, is_admin
FROM public.profiles
WHERE is_admin = true;
```

You should see your email with `is_admin: true`

---

### Step 1.4: Configure Authentication URLs

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `http://localhost:5173` (for now, we'll update after Vercel)
3. Add **Redirect URLs** (click Add URL for each):
   - `http://localhost:5173/**`
   - `https://*.vercel.app/**`
4. Click **Save**

5. Go to **Authentication** → **Providers**
6. Make sure **Email** provider is enabled (toggle should be green/on)

---

## 🚀 PART 2: Deploy to Vercel

### Step 2.1: Commit Your Code

In your terminal (in the reviewpasta directory):

```bash
# Check what files will be committed
git status

# Add all the new files
git add .

# Commit with a message
git commit -m "Add authentication, waitlist, and business editing features"

# Push to GitHub
git push origin main
```

**Note:** If you get an error about tracked files, that's okay. Just proceed to next step.

---

### Step 2.2: Create Vercel Account & Project

1. Go to: https://vercel.com
2. Click **Sign Up** (or **Log In** if you have an account)
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub

Once logged in:

5. Click **Add New...** → **Project**
6. Find **reviewpasta** in the list
7. Click **Import**

---

### Step 2.3: Configure Build Settings

Vercel should auto-detect everything, but verify:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

Click **Environment Variables** dropdown (DON'T deploy yet!)

---

### Step 2.4: Add Environment Variables

Add these 4 environment variables:

1. **Name:** `VITE_SUPABASE_URL`
   **Value:** `https://qlexfmopdsjykysgtwez.supabase.co`

2. **Name:** `VITE_SUPABASE_PUBLISHABLE_KEY`
   **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZXhmbW9wZHNqeWt5c2d0d2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MzE3OTYsImV4cCI6MjA4NzAwNzc5Nn0._F_1p5j672gdk0282GYM27wUt7e-vQ2YpDBsqcD0pb8`

3. **Name:** `VITE_OPENROUTER_API_KEY`
   **Value:** `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`

4. **Name:** `VITE_USE_SUPABASE`
   **Value:** `true`

For each variable, make sure to select all environments: **Production, Preview, Development**

---

### Step 2.5: Deploy!

1. Click **Deploy** button
2. Wait 2-3 minutes for deployment
3. You'll see a success screen with your URL like: `https://reviewpasta-xyz123.vercel.app`
4. Click **Visit** to see your live site!

---

### Step 2.6: Update Supabase URLs

Now that you have your Vercel URL:

1. Go back to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Update **Site URL** to: `https://reviewpasta-xyz123.vercel.app` (your actual URL)
3. Make sure redirect URLs include:
   - `https://reviewpasta-xyz123.vercel.app/**`
   - `https://*.vercel.app/**`
4. Click **Save**

---

## ✅ PART 3: Test Everything

### Test 1: Visit Your Site

Go to your Vercel URL: `https://reviewpasta-xyz123.vercel.app`

You should see:
- The ReviewPasta homepage
- "Request Access" button in top right

---

### Test 2: Test Waitlist Signup

1. Click **Request Access**
2. Fill out the form with test data:
   - Email: `test@example.com`
   - Phone: `555-123-4567`
   - Name: `Test User`
   - Business Name: `Test Business`
   - Business URL: `https://test.com`
   - Business Description: `A test business`
3. Click **Submit Request**
4. You should see a success message!

**Verify in Supabase:**
- Go to Supabase Dashboard → **Table Editor** → **waitlist**
- You should see your test entry

---

### Test 3: Login as Admin

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Find YOUR user (not the test user)
3. Click the three dots → **Send magic link**
4. Check your email inbox
5. Click the magic link
6. You should be redirected to your site and logged in!
7. You'll see your email in the top right instead of "Request Access"

---

### Test 4: Access Admin Dashboard

1. While logged in, go to: `https://your-site.vercel.app/admin/waitlist`
2. You should see the waitlist dashboard
3. You'll see your test entry from Test 2
4. Try clicking **Send Magic Link** - it should copy to clipboard

---

### Test 5: Edit a Business

1. Go to the homepage
2. Click on one of the existing businesses (e.g., "The Rock Gym Copou")
3. You should see a **pencil icon** next to the business name
4. Click the pencil → Edit description → Save
5. Success toast should appear!

---

### Test 6: Test as Non-Admin User

1. Open an incognito/private browser window
2. Go to your site
3. Click **Request Access** and submit another test entry
4. Go back to admin dashboard in your normal browser
5. Find the new entry
6. Click **Send Magic Link** → Link copied to clipboard
7. Paste the link in the incognito window
8. The user should be logged in!
9. Navigate to a business review page
10. The **pencil icon should NOT appear** (because they don't own any businesses)

---

## 🎉 SUCCESS CHECKLIST

After completing all steps, you should have:

- ✅ Supabase database with `profiles`, `waitlist`, and updated `businesses` tables
- ✅ Admin account created and verified
- ✅ App deployed to Vercel with a live URL
- ✅ Environment variables configured
- ✅ Authentication working (magic links)
- ✅ Waitlist form accepting submissions
- ✅ Admin dashboard accessible
- ✅ Business editing working for admins

---

## 🐛 Troubleshooting

### "Can't access Supabase Dashboard"

**Solution:**
- Try all your email addresses
- Check spam folder for "Supabase" emails
- Create a new Supabase project if needed:
  1. Go to https://supabase.com → New Project
  2. Create project (takes 2 min)
  3. Get new credentials from Settings → API
  4. Update `.env` file and Vercel environment variables
  5. Re-run migration SQL

### "Vercel deployment failed"

**Common fixes:**
- Make sure you pushed code to GitHub first
- Check Vercel build logs for specific errors
- Verify environment variables are set correctly
- Try deploying again (sometimes first deploy has issues)

### "Magic link doesn't work"

**Check:**
- Redirect URLs in Supabase include your Vercel domain
- You're using the exact URL from the magic link (don't modify it)
- Try in incognito/private browser
- Check Supabase logs: Dashboard → Logs

### "Edit button not showing"

**Check:**
- `VITE_USE_SUPABASE=true` is set in Vercel
- You're logged in (email shows in top right)
- You're an admin (check SQL: `SELECT * FROM profiles WHERE email = 'your-email'`)
- Business has an `id` field
- Check browser console for errors (F12)

### "Migration SQL failed"

**Solutions:**
- Copy the ENTIRE SQL file (all 102 lines)
- Check if tables already exist: `SELECT * FROM profiles` (if it works, tables exist)
- Drop and recreate:
  ```sql
  DROP TABLE IF EXISTS waitlist;
  DROP TABLE IF EXISTS profiles CASCADE;
  -- Then re-run full migration
  ```

---

## 📚 Useful SQL Queries

```sql
-- See all users
SELECT * FROM auth.users;

-- See all profiles with admin status
SELECT email, is_admin FROM public.profiles;

-- See waitlist entries
SELECT email, name, business_name, status FROM public.waitlist;

-- See businesses with owners
SELECT id, name, slug, owner_id FROM public.businesses;

-- Make someone an admin
UPDATE public.profiles SET is_admin = true WHERE email = 'email@example.com';

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

---

## 🔗 Important Links

- **Your Vercel Dashboard:** https://vercel.com/dashboard
- **Your Supabase Dashboard:** https://supabase.com/dashboard/project/qlexfmopdsjykysgtwez
- **Your Live Site:** (You'll get this after Vercel deployment)

---

## 📞 Next Steps After Deployment

1. **Test with a real user:**
   - Have someone submit a waitlist request
   - Approve them via admin dashboard
   - Send them the magic link via email
   - Verify they can log in

2. **Customize:**
   - Update business descriptions
   - Add your own businesses
   - Customize the waitlist form

3. **Monitor:**
   - Check waitlist regularly for new requests
   - Review Supabase logs for errors
   - Monitor Vercel analytics for traffic

4. **Optional improvements:**
   - Set up email notifications for waitlist entries
   - Add more admin users
   - Customize styling/branding

---

**You're all set!** 🎊

If you run into any issues, check the Troubleshooting section or review the logs in Supabase/Vercel dashboards.
