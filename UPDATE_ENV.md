# Update Environment Variables - NEW Supabase Project

After creating your new Supabase project, follow these steps:

## Step 1: Get Credentials from Supabase

1. In Supabase Dashboard, go to **Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long token starting with `eyJhbGc...`)

## Step 2: Update Local .env File

Open your `.env` file and update these lines:

**BEFORE:**
```env
VITE_SUPABASE_URL="https://qlexfmopdsjykysgtwez.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZXhmbW9wZHNqeWt5c2d0d2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MzE3OTYsImV4cCI6MjA4NzAwNzc5Nn0._F_1p5j672gdk0282GYM27wUt7e-vQ2YpDBsqcD0pb8"
```

**AFTER:**
```env
VITE_SUPABASE_URL="https://YOUR-NEW-PROJECT-ID.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR-NEW-ANON-PUBLIC-KEY-HERE"
```

**Complete .env file should look like:**
```env
VITE_SUPABASE_PROJECT_ID="your-new-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-new-anon-public-key"
VITE_SUPABASE_URL="https://your-new-project-id.supabase.co"

# Feature Flags
VITE_USE_SUPABASE=true

# OpenRouter API Configuration
# Get your free API key at: https://openrouter.ai/keys
VITE_OPENROUTER_API_KEY="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"
```

## Step 3: Apply Database Migration

Now you need to create the tables in your NEW database:

1. In Supabase Dashboard, click **SQL Editor**
2. Click **New Query**
3. Open the file `supabase/migrations/20260222000000_add_auth_and_ownership.sql`
4. Copy ALL 102 lines
5. Paste into SQL Editor
6. Click **Run** (or Cmd+Enter)

You should see: "Success. No rows returned"

## Step 4: Create Your Admin Account

1. In Supabase, go to **Authentication** → **Users**
2. Click **Add user**
3. Enter your email
4. Click **Create user**

Then in SQL Editor, run:
```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'your-email@example.com';
```

## Step 5: Configure Auth URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:5173`
3. Add **Redirect URLs**:
   - `http://localhost:5173/**`
   - `https://*.vercel.app/**`
4. Click **Save**

## Step 6: Test Locally

```bash
npm run dev
```

Visit `http://localhost:5173` and test:
- Can you see businesses?
- Does review generation work?
- Can you click "Request Access"?

## Step 7: Update Vercel Environment Variables

When you deploy to Vercel, use your NEW credentials:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update these variables with your NEW values:
   - `VITE_SUPABASE_URL` → New URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` → New anon public key
3. Add if not exists:
   - `VITE_USE_SUPABASE` → `true`
   - `VITE_OPENROUTER_API_KEY` → (keep existing or rotate)

Then redeploy!

---

## ✅ Checklist

- [ ] New Supabase project created
- [ ] Got Project URL and anon public key
- [ ] Updated local `.env` file
- [ ] Ran database migration SQL
- [ ] Created admin user
- [ ] Configured auth URLs
- [ ] Tested locally (npm run dev)
- [ ] Updated Vercel environment variables
- [ ] Deployed to Vercel
- [ ] Tested production site

---

## 🔐 Security Benefits of New Project

✅ **Fresh start:** No exposed keys in git history
✅ **Clean database:** No legacy data
✅ **Proper RLS:** Automatic RLS enabled from start
✅ **No key rotation needed:** Brand new keys that have never been exposed
