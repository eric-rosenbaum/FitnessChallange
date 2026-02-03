-- Fix RLS policy for creating groups
-- The policy needs to verify that created_by matches auth.uid()

-- Drop the old policy
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;

-- Create new policy that verifies created_by matches auth.uid()
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = auth.uid()
  );

-- Verify the policy was created (this will show an error if it already exists, which is fine)
-- You can run this query separately to check: SELECT * FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Authenticated users can create groups';
