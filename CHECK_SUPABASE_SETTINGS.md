# How to Check Supabase JWT Settings

## Step 1: Go to Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `jssqzkkunqfvsfizoxth`

## Step 2: Navigate to API Settings

1. In the left sidebar, click on **"Settings"** (gear icon)
2. Click on **"API"** in the settings menu

## Step 3: Check JWT Settings

You should see a section called **"JWT Settings"** or **"JWT Secret"**. Look for:

### What to Check:

1. **JWT Secret**:
   - Should show a long string (starts with something like `your-super-secret-jwt-token...`)
   - If it says "Not set" or is empty, that's a problem
   - **Note**: You can click "Reveal" or "Show" to see it, but don't share it publicly

2. **JWT Expiry**:
   - Default is usually `3600` seconds (1 hour)
   - Should be a reasonable number (not 0 or extremely high)

3. **JWT Audience** (if visible):
   - Usually `authenticated` or your project URL
   - Should match what's in your JWT token

## Step 4: Verify Project URL and Keys

While you're in the API settings, also verify:

1. **Project URL**:
   - Should be: `https://jssqzkkunqfvsfizoxth.supabase.co`
   - This should match your `NEXT_PUBLIC_SUPABASE_URL` environment variable

2. **anon/public key**:
   - This is the key you use in `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Should start with `eyJ...` (it's a JWT token itself)
   - **Important**: Make sure you're using the `anon` key, NOT the `service_role` key

3. **service_role key** (if visible):
   - This bypasses RLS - don't use it in client-side code
   - Only use for server-side operations that need to bypass security

## Step 5: Check Environment Variables

In your project, verify your `.env.local` file (or wherever you store env vars) has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jssqzkkunqfvsfizoxth.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (your anon key)
```

## What to Look For:

✅ **Good Signs:**
- JWT Secret is set and visible
- JWT Expiry is a reasonable number (3600 or similar)
- Project URL matches your environment variable
- You're using the `anon` key (not `service_role`)

❌ **Problem Signs:**
- JWT Secret is empty or "Not set"
- JWT Expiry is 0 or missing
- Project URL doesn't match
- You're using `service_role` key in client code

## If JWT Secret is Missing:

If the JWT secret is not set:

1. In Supabase Dashboard → Settings → API
2. Look for "Reset JWT Secret" or "Generate JWT Secret"
3. Click it to generate a new secret
4. **Important**: This will invalidate all existing sessions - users will need to log in again

## Quick Test:

You can also test if JWT is working by running this in Supabase SQL Editor:

```sql
-- This should return your user ID if JWT is working
SELECT auth.uid();
```

If this returns `NULL` even when you're logged in, the JWT isn't being processed correctly.
