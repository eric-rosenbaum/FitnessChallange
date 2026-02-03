-- Alternative approach: Try a different policy structure
-- Sometimes the issue is with how the policy is written

-- Drop existing policy
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;

-- Try a simpler policy first to test if auth.uid() works at all
CREATE POLICY "Authenticated users can create groups - test"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- If the above works, then the issue is with the created_by check
-- If it still fails, then auth.uid() itself isn't working

-- After testing, replace with the full policy:
-- DROP POLICY IF EXISTS "Authenticated users can create groups - test" ON groups;
-- CREATE POLICY "Authenticated users can create groups"
--   ON groups FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     auth.uid() IS NOT NULL 
--     AND created_by = auth.uid()
--   );
