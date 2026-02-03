-- Fix the JWT/RLS issue
-- The problem is that auth.uid() returns NULL even with a valid JWT
-- This is likely because PostgREST needs the JWT to be in a specific format

-- Re-enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Drop any test policies
DROP POLICY IF EXISTS "Test: Allow all authenticated inserts" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups - test" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;

-- The issue might be that we need to use the JWT claims directly
-- instead of relying on auth.uid() which might not be set correctly
-- Let's try using request.jwt.claims directly

CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check if JWT exists and has a sub claim
    (current_setting('request.jwt.claims', true)::jsonb->>'sub') IS NOT NULL
    AND
    -- Verify created_by matches the JWT sub claim
    created_by::text = (current_setting('request.jwt.claims', true)::jsonb->>'sub')
  );

-- Alternative: If the above doesn't work, try this simpler version
-- that just checks if the user is authenticated (no created_by check)
-- DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
-- CREATE POLICY "Authenticated users can create groups"
--   ON groups FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     (current_setting('request.jwt.claims', true)::jsonb->>'sub') IS NOT NULL
--   );
