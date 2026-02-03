# Debugging JWT/RLS Issue

## The Problem
Even with `WITH CHECK (true)` and `TO authenticated`, the INSERT is still being blocked. This means Postgres isn't recognizing the JWT token at all.

## Possible Causes

1. **Supabase JWT Secret Mismatch**: The JWT secret in your Supabase project might not match what Postgres expects
2. **JWT Audience Mismatch**: The JWT `aud` claim might not match Postgres configuration
3. **PostgREST Configuration**: PostgREST might not be forwarding the JWT correctly
4. **RLS Default Behavior**: When RLS is enabled and no policies match, it defaults to DENY

## Steps to Debug

### Step 1: Check Supabase Project Settings

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Check:
   - **JWT Secret**: This should match what Postgres expects
   - **JWT Expiry**: Should be reasonable (default is 3600 seconds)
   - **JWT Audience**: Usually `authenticated` or `https://your-project.supabase.co/auth/v1`

### Step 2: Test JWT Function

Run the diagnostic query from `012_check_jwt_config.sql`:

```sql
SELECT public.debug_jwt();
```

This will show what Postgres sees from the JWT. If `jwt_claims` is NULL, the JWT isn't being processed.

### Step 3: Check if Service Role Works

Temporarily test with the service role key (in a test environment only!):

1. Get your service role key from Supabase Dashboard → Settings → API
2. Make a test request with the service role key instead of anon key
3. If this works, the issue is with JWT processing for authenticated users

### Step 4: Verify PostgREST is Processing JWT

The JWT should be in the `Authorization` header (which we confirmed it is), but PostgREST needs to:
1. Extract the JWT from the header
2. Validate it against the JWT secret
3. Set `request.jwt.claims` in Postgres

If any of these steps fail, `auth.uid()` will return NULL.

## Quick Fix to Try

If the JWT isn't being recognized, try this workaround:

1. **Temporarily disable RLS** (for testing only):
```sql
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
```

2. Try creating a group - if this works, the issue is definitely with JWT/RLS

3. **Re-enable RLS**:
```sql
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
```

## Contact Supabase Support

If none of the above works, this might be a Supabase configuration issue. Contact Supabase support with:
- Your project reference: `jssqzkkunqfvsfizoxth`
- The error: `42501` (RLS policy violation)
- The fact that even `WITH CHECK (true)` fails
- The JWT token (you can decode it at jwt.io to verify it's valid)
