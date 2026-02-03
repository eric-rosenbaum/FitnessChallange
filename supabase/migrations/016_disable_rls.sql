-- DISABLE RLS ON ALL TABLES
-- ⚠️ WARNING: This removes all security. Only use for personal/testing purposes!

-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE week_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE week_challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE strength_exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'groups',
    'group_memberships',
    'week_assignments',
    'week_challenges',
    'strength_exercises',
    'workout_logs'
  )
ORDER BY tablename;

-- All tables should show rls_enabled = false
