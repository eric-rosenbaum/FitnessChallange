-- Check JWT configuration and see if auth.uid() is accessible
-- This will help diagnose why the JWT isn't being recognized

-- 1. Check current JWT settings
SHOW jwt.secret;
SHOW jwt.aud;

-- 2. Try to see if we can access JWT claims directly
-- This function will show what Postgres sees from the JWT
CREATE OR REPLACE FUNCTION public.debug_jwt()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  jwt_claims jsonb;
BEGIN
  -- Try to get JWT claims
  SELECT current_setting('request.jwt.claims', true)::jsonb INTO jwt_claims;
  
  RETURN jsonb_build_object(
    'jwt_claims', jwt_claims,
    'jwt_claims_raw', current_setting('request.jwt.claims', true),
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'current_user', current_user,
    'session_user', session_user
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.debug_jwt() TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_jwt() TO anon;

-- 3. Check if there are any other policies that might be blocking
-- Sometimes a SELECT policy can interfere with INSERT
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'groups'
ORDER BY cmd, policyname;

-- 4. Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'groups';
