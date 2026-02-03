-- Fix the incomplete group INSERT policy
-- The policy appears to be truncated, so we'll drop and recreate it properly

-- Drop the existing policy
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;

-- Recreate with the complete condition
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  );

-- Verify it was created correctly
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'groups' 
  AND policyname = 'Authenticated users can create groups';
