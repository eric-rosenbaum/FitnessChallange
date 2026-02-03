-- Diagnose why auth.uid() is returning NULL
-- This will help us understand what's happening

-- 1. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'groups';

-- 2. List all policies on groups table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'groups';

-- 3. Check if there are any conflicting policies
-- Sometimes multiple policies can conflict

-- 4. Verify the JWT configuration
-- Check if auth.uid() function exists and works
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'uid'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth');

-- 5. Test: Temporarily allow all authenticated users (for testing only!)
-- This will help us confirm if the issue is with auth.uid() or something else
DROP POLICY IF EXISTS "Authenticated users can create groups - test" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;

-- Create a policy that allows ANY authenticated user (no auth.uid() check)
CREATE POLICY "Test: Allow all authenticated inserts"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- After testing, if this works, the issue is specifically with auth.uid()
-- If this still fails, there's a deeper configuration issue
