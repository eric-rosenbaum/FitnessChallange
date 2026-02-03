-- Verification query to check if the group INSERT policy is correct
-- Run this in Supabase SQL Editor to verify the policy exists and is correct

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
WHERE tablename = 'groups' 
  AND policyname = 'Authenticated users can create groups';

-- Expected result should show:
-- cmd = 'INSERT'
-- with_check should contain: auth.uid() IS NOT NULL AND created_by = auth.uid()
