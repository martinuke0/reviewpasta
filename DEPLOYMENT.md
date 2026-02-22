# Deployment Guide for Business Description Editing with Auth

This guide covers deploying the new authentication and business editing features to production.

## Prerequisites

- Supabase project created (already exists: qlexfmopdsjykysgtwez)
- Vercel account connected to GitHub repo
- Admin email for first admin user

## Step 1: Apply Database Migration

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref qlexfmopdsjykysgtwez

# Push migration
supabase db push
```

### Option B: Manual SQL Execution

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qlexfmopdsjykysgtwez
2. Navigate to SQL Editor
3. Copy the entire contents of `supabase/migrations/20260222000000_add_auth_and_ownership.sql`
4. Paste and run in SQL Editor
5. Verify tables created: `profiles`, `waitlist`, and `businesses.owner_id` column

## Step 2: Configure Supabase Authentication

1. Go to Authentication → Providers in Supabase Dashboard
2. Enable "Email" provider (if not already enabled)
3. **Important:** Enable "Secure email change"
4. Set "Site URL": `https://your-production-domain.vercel.app`
5. Add redirect URLs:
   - `https://your-production-domain.vercel.app/`
   - `http://localhost:5173/` (for local development)

## Step 3: Create First Admin User

The first admin user must be created manually before anyone can approve waitlist requests.

### Method 1: Via Supabase Dashboard (Recommended)

1. Go to Authentication → Users in Supabase Dashboard
2. Click "Invite user" or "Create user"
3. Enter your email address
4. Click "Create user"
5. Go to SQL Editor and run:

```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'your-admin-email@example.com';
```

6. Verify with:

```sql
SELECT * FROM public.profiles WHERE is_admin = true;
```

### Method 2: Using Magic Link

1. Deploy the app first (see Step 4)
2. Visit `/signup` and submit the waitlist form
3. Go to Supabase SQL Editor and run:

```sql
-- Find your waitlist entry
SELECT * FROM public.waitlist WHERE email = 'your-email@example.com';

-- Create user account via SQL (this bypasses waitlist)
-- Note: You'll need to use Supabase dashboard to invite the user instead
```

**Recommendation:** Use Method 1 for simplicity.

## Step 4: Configure Environment Variables

### Local Development (.env)

```env
VITE_SUPABASE_URL=https://qlexfmopdsjykysgtwez.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-key-here
VITE_USE_SUPABASE=true
```

### Vercel Production

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these are already set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Add new variable:
   - `VITE_USE_SUPABASE` = `true`

## Step 5: Deploy to Vercel

```bash
# Commit all changes
git add .
git commit -m "Implement business editing with role-based auth and waitlist"

# Push to GitHub (Vercel auto-deploys)
git push origin main
```

Wait for Vercel deployment to complete (~2-3 minutes).

## Step 6: Test the Deployment

### 6.1 Test Waitlist Signup

1. Visit `https://your-app.vercel.app/signup`
2. Fill out the waitlist form
3. Verify entry appears in Supabase `waitlist` table

### 6.2 Test Admin Login

1. Log in with your admin account (created in Step 3)
2. Visit `https://your-app.vercel.app/admin/waitlist`
3. Verify you can see waitlist entries

### 6.3 Test Magic Link Generation

1. In admin dashboard, click "Send Magic Link" for a waitlist entry
2. Link should be copied to clipboard
3. Open the link in a new browser (or incognito window)
4. Verify you're automatically logged in
5. Check that user appears in `profiles` table

### 6.4 Test Business Editing

1. Log in as admin or business owner
2. Navigate to a business review page
3. Verify pencil icon appears next to business name
4. Click edit button → Update description → Save
5. Verify description updates successfully

### 6.5 Test Authorization

1. Log out and visit a business review page
2. Verify edit button does NOT appear
3. Try accessing `/admin/waitlist` without auth
4. Verify redirect to `/signup`

## Step 7: Data Migration (First Deployment Only)

If you have existing businesses in IndexedDB (from before this update):

1. Visit the app in production
2. Migration will run automatically on first load
3. Check browser console for migration status
4. Verify businesses appear in Supabase `businesses` table
5. Legacy businesses will have `owner_id = NULL` (admins can edit these)

To manually trigger migration again (if needed):

```javascript
// In browser console:
localStorage.removeItem('reviewpasta_migrated_to_supabase');
// Then refresh the page
```

## Troubleshooting

### "Magic link copied" but link doesn't work

**Issue:** Admin.generateLink() requires service role key

**Solution:** The plan uses `admin.generateLink()` which requires proper permissions. If this doesn't work:

1. Go to Supabase Dashboard → Settings → API
2. Verify you're using the correct publishable key
3. Alternative: Use magic link email flow (update admin dashboard to trigger email instead of copying link)

### Edit button not appearing

**Checks:**
- Verify `VITE_USE_SUPABASE=true` is set
- Check browser console for RLS policy errors
- Verify user is logged in (check `auth.users` table)
- Verify business has `id` field populated
- Check if `canEditBusiness()` returns true

### Migration not running

**Checks:**
- Open browser console and look for migration logs
- Check localStorage for `reviewpasta_migrated_to_supabase` key
- Verify Dexie database has businesses (open DevTools → Application → IndexedDB)
- Check Supabase logs for insert errors

### Waitlist form submission fails

**Checks:**
- Verify RLS policies allow anonymous inserts on `waitlist` table
- Check browser console for Supabase errors
- Verify all required fields are filled
- Check for unique constraint violations (duplicate email)

## Security Checklist

- [ ] RLS policies enabled on all tables (`profiles`, `businesses`, `waitlist`)
- [ ] Admin created and verified in `profiles` table
- [ ] Supabase anon key is used (not service role key) in production
- [ ] Auth redirect URLs configured correctly
- [ ] Environment variables set in Vercel
- [ ] Test non-admin users cannot access admin routes
- [ ] Test non-owners cannot edit other businesses

## Post-Deployment Tasks

1. **Create Admin Documentation:** Write internal guide for admin team on how to approve users
2. **Monitor Waitlist:** Set up email notifications for new waitlist entries (Supabase webhooks or cron)
3. **Backup Plan:** Keep IndexedDB code for 2-4 weeks in case rollback needed
4. **User Communication:** Notify existing users about new login system (if applicable)

## Rollback Plan (Emergency)

If critical issues arise:

1. Set `VITE_USE_SUPABASE=false` in Vercel environment variables
2. Redeploy (this reverts to IndexedDB mode)
3. Users can still use the app without auth
4. Investigate issues and re-enable when fixed

## Future Enhancements

After successful deployment, consider:

- Email notifications for waitlist approvals
- Automatic magic link sending (via Supabase triggers)
- OAuth login (Google, GitHub)
- Business ownership transfer
- Edit history/audit log
- Two-factor authentication for admins

## Support

For issues or questions:
- Check Supabase logs: https://supabase.com/dashboard/project/qlexfmopdsjykysgtwez/logs
- Review browser console errors
- Check RLS policies in Supabase Dashboard → Authentication → Policies
