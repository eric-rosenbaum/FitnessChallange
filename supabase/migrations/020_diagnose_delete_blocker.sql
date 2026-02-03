-- Diagnose what's blocking user deletion
-- Run this to see exactly what constraints or data are preventing deletion

-- 1. Check all foreign key constraints that reference profiles
SELECT 
  'Foreign Key Constraints' as check_type,
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule,
  CASE 
    WHEN rc.delete_rule = 'RESTRICT' THEN '❌ BLOCKS DELETION'
    WHEN rc.delete_rule = 'CASCADE' THEN '✅ Allows deletion'
    ELSE '⚠️ Unknown'
  END as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
  AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'profiles'
ORDER BY tc.table_name, tc.constraint_name;

-- 2. Check if there are any triggers that might block deletion
SELECT 
  'Triggers' as check_type,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND (action_statement LIKE '%DELETE%' OR action_statement LIKE '%RESTRICT%')
ORDER BY event_object_table;

-- 3. Check for any data that references a specific user (replace USER_ID with actual user ID)
-- First, let's see what users exist
SELECT 
  'Users in auth.users' as check_type,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 4. For a specific user, check what data references them
-- Replace 'USER_ID_HERE' with the actual user ID you're trying to delete
-- Uncomment and run this with a specific user ID:
/*
SELECT 
  'Data referencing user' as check_type,
  'groups' as table_name,
  COUNT(*) as count
FROM groups 
WHERE created_by = 'USER_ID_HERE'

UNION ALL

SELECT 
  'Data referencing user',
  'group_memberships',
  COUNT(*)
FROM group_memberships 
WHERE user_id = 'USER_ID_HERE'

UNION ALL

SELECT 
  'Data referencing user',
  'week_assignments (host)',
  COUNT(*)
FROM week_assignments 
WHERE host_user_id = 'USER_ID_HERE'

UNION ALL

SELECT 
  'Data referencing user',
  'week_assignments (assigned_by)',
  COUNT(*)
FROM week_assignments 
WHERE assigned_by = 'USER_ID_HERE'

UNION ALL

SELECT 
  'Data referencing user',
  'week_challenges',
  COUNT(*)
FROM week_challenges 
WHERE created_by = 'USER_ID_HERE'

UNION ALL

SELECT 
  'Data referencing user',
  'workout_logs',
  COUNT(*)
FROM workout_logs 
WHERE user_id = 'USER_ID_HERE';
*/
