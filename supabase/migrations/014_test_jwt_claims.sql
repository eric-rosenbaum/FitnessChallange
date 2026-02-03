-- Alternative approach: Use SECURITY DEFINER function to check JWT
-- This function runs with elevated privileges and can access JWT claims

CREATE OR REPLACE FUNCTION public.check_user_can_create_group(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_claims jsonb;
  jwt_user_id TEXT;
BEGIN
  -- Try to get JWT claims from request context
  BEGIN
    jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
    jwt_user_id := jwt_claims->>'sub';
    
    -- If we got a user ID from JWT, check if it matches
    IF jwt_user_id IS NOT NULL THEN
      RETURN jwt_user_id = check_user_id::TEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If JWT claims aren't available, try auth.uid()
    NULL;
  END;
  
  -- Fallback to auth.uid()
  RETURN auth.uid() = check_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_can_create_group(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_can_create_group(UUID) TO anon;

-- Update the policy to use this function
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;

CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (
    public.check_user_can_create_group(created_by)
  );
