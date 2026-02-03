-- Test what auth.uid() returns for the current user
-- This will help us debug why the RLS policy is failing

-- First, let's check if we can see what auth.uid() returns
-- Note: This needs to be run in the context of an authenticated request
-- You can test this by making a request to a view or function

-- Create a test function to see what auth.uid() returns
CREATE OR REPLACE FUNCTION public.test_auth_uid()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_jwt', auth.jwt(),
    'auth_role', auth.role()
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.test_auth_uid() TO authenticated;

-- Also, let's verify the groups table structure
-- Check if created_by column type matches auth.uid() type
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'groups'
  AND column_name = 'created_by';
