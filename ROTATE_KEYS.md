# Security: Rotate Exposed API Keys

Since `.env` was previously committed to git, your API keys are exposed in git history. Follow these steps to rotate them.

---

## ⚠️ Priority 1: Rotate OpenRouter API Key (HIGH RISK)

**Why:** This is a paid API key. Exposed keys can be abused, costing you money.

### Steps:

1. **Go to OpenRouter Dashboard:**
   https://openrouter.ai/keys

2. **Sign in** with your OpenRouter account

3. **Delete the old key:**
   - Find key: `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`
   - Click the trash/delete icon
   - Confirm deletion

4. **Create a new key:**
   - Click **Create Key**
   - Give it a name: "ReviewPasta Production"
   - Copy the new key (starts with `sk-or-v1-...`)

5. **Update locally (.env file):**
   ```env
   VITE_OPENROUTER_API_KEY="sk-or-v1-YOUR-NEW-KEY-HERE"
   ```

6. **Update in Vercel:**
   - Go to: https://vercel.com/dashboard
   - Select your ReviewPasta project
   - Settings → Environment Variables
   - Find `VITE_OPENROUTER_API_KEY`
   - Click Edit (pencil icon)
   - Paste new key
   - Click Save
   - **Important:** Redeploy to apply changes (Deployments → click ... → Redeploy)

---

## ⚠️ Priority 2: Rotate Supabase Publishable Key (MEDIUM RISK)

**Why:** While this key is meant to be public, it's best practice to rotate exposed keys. Your RLS policies protect your data, but rotation adds an extra security layer.

### Steps:

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/qlexfmopdsjykysgtwez/settings/api

2. **Find "Project API keys" section**

3. **Reset the anon/public key:**
   - Find row: `anon` `public`
   - Click **"Roll Key"** or **"Reset"** button
   - Confirm the reset
   - Copy the NEW `anon public` key

4. **Update locally (.env file):**
   ```env
   VITE_SUPABASE_PUBLISHABLE_KEY="YOUR-NEW-SUPABASE-KEY-HERE"
   ```

5. **Update in Vercel:**
   - Go to: https://vercel.com/dashboard
   - Select your ReviewPasta project
   - Settings → Environment Variables
   - Find `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Click Edit (pencil icon)
   - Paste new key
   - Click Save
   - **Important:** Redeploy to apply changes

---

## ✅ After Rotating Keys

### 1. Test Locally

```bash
# In your reviewpasta directory
npm run dev
```

Visit `http://localhost:5173` and test:
- Can you see businesses?
- Does review generation work? (uses OpenRouter)
- Can you sign in?
- Does the waitlist form work?

If everything works, your new keys are correct!

---

### 2. Test Production

After redeploying Vercel:
- Visit your live site
- Test the same features
- Check browser console for errors (F12 → Console)

---

## 🔒 Why Each Variable Needs Rotation (or Not)

### VITE_OPENROUTER_API_KEY
- **Type:** Private API key (paid service)
- **Exposure Risk:** HIGH
- **Impact if abused:** Unauthorized API calls charged to your account
- **Action:** MUST rotate immediately
- **This key powers:** AI review generation

### VITE_SUPABASE_PUBLISHABLE_KEY
- **Type:** Public key (meant for frontend)
- **Exposure Risk:** LOW (protected by RLS policies)
- **Impact if abused:** Minimal - RLS prevents unauthorized data access
- **Action:** SHOULD rotate (best practice)
- **This key powers:** Database access, authentication

### VITE_SUPABASE_URL
- **Type:** Public URL
- **Exposure Risk:** NONE
- **Impact if abused:** None - it's meant to be public
- **Action:** No rotation needed
- **This is:** Your Supabase project URL

---

## 🛡️ Security Best Practices Going Forward

### 1. Never Commit .env Files ✅ (Already fixed)
- `.env` is now in `.gitignore`
- Future commits won't include it

### 2. Use Environment Variables in Production ✅ (Already set up)
- Vercel uses environment variables (not .env file)
- Keys aren't in your deployed code

### 3. Rotate Keys Periodically
- Rotate sensitive keys every 90 days
- Rotate immediately if you suspect exposure
- Keep a secure note of when you last rotated

### 4. Use Different Keys for Dev/Production (Optional)
- Create separate OpenRouter keys for local development
- Use Supabase local development setup for local testing
- This prevents dev testing from affecting production quota

---

## 🔍 Check if Your Repo is Public

If your GitHub repo is **private**, the exposure is limited to people with access.
If it's **public**, anyone on the internet can see your git history.

### Check repo visibility:

1. Go to: https://github.com/YOUR-USERNAME/reviewpasta
2. Look for "Public" or "Private" badge at the top

### If it's public:

**Option 1: Make it private (easiest)**
- Go to repo Settings
- Scroll to "Danger Zone"
- Click "Change visibility" → "Make private"

**Option 2: Remove .env from git history (advanced)**

⚠️ **Warning:** This rewrites git history. Only do this if you know what you're doing.

```bash
# This removes .env from ALL commits
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all

# Force push to GitHub (WARNING: destructive)
git push origin --force --all
```

**Recommendation:** Just rotate the keys. It's simpler and safer than rewriting git history.

---

## ✅ Completion Checklist

After following this guide:

- [ ] OpenRouter key rotated (old key deleted, new key in .env and Vercel)
- [ ] Supabase key rotated (new key in .env and Vercel)
- [ ] Vercel redeployed with new environment variables
- [ ] Local testing passed (npm run dev)
- [ ] Production testing passed (live site works)
- [ ] Old keys deleted from their respective dashboards
- [ ] Confirmed .env is in .gitignore (git status should NOT show .env)

---

## 📞 Need Help?

**If you get errors after rotation:**

1. **"Invalid API key" error:**
   - Double-check you copied the full key (no extra spaces)
   - Make sure you saved in Vercel AND redeployed
   - Verify the key isn't expired or deleted

2. **"Failed to generate review":**
   - OpenRouter key issue
   - Check https://openrouter.ai/activity for failed requests
   - Verify key has credits/balance

3. **"Authentication error":**
   - Supabase key issue
   - Verify new key matches what's in Supabase Dashboard
   - Check Supabase logs: Dashboard → Logs

**Test individual keys:**

```bash
# Test OpenRouter key
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer YOUR-NEW-OPENROUTER-KEY"

# Test Supabase key
curl "https://qlexfmopdsjykysgtwez.supabase.co/rest/v1/businesses" \
  -H "apikey: YOUR-NEW-SUPABASE-KEY"
```

Both should return valid responses (not errors).
