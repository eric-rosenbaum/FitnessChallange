# Debugging User Deletion Issues

## Step 1: Check What's Blocking Deletion

Run this query in Supabase SQL Editor to see all constraints:

```sql
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name,
  rc.delete_rule,
  CASE 
    WHEN rc.delete_rule = 'RESTRICT' THEN '❌ BLOCKS DELETION'
    WHEN rc.delete_rule = 'CASCADE' THEN '✅ Allows deletion'
    ELSE '⚠️ Unknown'
  END as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'profiles'
ORDER BY tc.table_name;
```

Look for any rows with `delete_rule = 'RESTRICT'` - these are blocking deletion.

## Step 2: Check What Data Exists for a User

Replace `'USER_ID_HERE'` with the actual user ID you're trying to delete:

```sql
-- Get the user ID first
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Then check what data exists for that user
SELECT 'groups' as table_name, COUNT(*) as count
FROM groups WHERE created_by = 'USER_ID_HERE'
UNION ALL
SELECT 'group_memberships', COUNT(*)
FROM group_memberships WHERE user_id = 'USER_ID_HERE'
UNION ALL
SELECT 'week_assignments (host)', COUNT(*)
FROM week_assignments WHERE host_user_id = 'USER_ID_HERE'
UNION ALL
SELECT 'week_assignments (assigned_by)', COUNT(*)
FROM week_assignments WHERE assigned_by = 'USER_ID_HERE'
UNION ALL
SELECT 'week_challenges', COUNT(*)
FROM week_challenges WHERE created_by = 'USER_ID_HERE'
UNION ALL
SELECT 'workout_logs', COUNT(*)
FROM workout_logs WHERE user_id = 'USER_ID_HERE';
```

## Step 3: Check Supabase Logs

1. Go to Supabase Dashboard → Logs → Postgres Logs
2. Try to delete a user again
3. Check the logs for the exact error message

## Step 4: Try Manual Deletion via SQL

If the dashboard won't work, try deleting via SQL:

```sql
-- Replace USER_ID_HERE with actual user ID
-- This will cascade delete everything
DELETE FROM auth.users WHERE id = 'USER_ID_HERE';
```

If this gives an error, the error message will tell you exactly what's blocking it.

## Common Issues

1. **Constraint names are different** - PostgreSQL auto-generates names, they might not match what we expect
2. **RLS is blocking** - Even though we disabled RLS, there might be policies still active
3. **Trigger blocking** - There might be a trigger preventing deletion
4. **Supabase dashboard limitation** - The dashboard might have its own restrictions

## Quick Fix: Delete Everything

If you just want to clean up test data:

```sql
-- Delete all data (nuclear option)
TRUNCATE TABLE workout_logs CASCADE;
TRUNCATE TABLE strength_exercises CASCADE;
TRUNCATE TABLE week_challenges CASCADE;
TRUNCATE TABLE week_assignments CASCADE;
TRUNCATE TABLE group_memberships CASCADE;
TRUNCATE TABLE groups CASCADE;
TRUNCATE TABLE profiles CASCADE;
-- Then delete users from Auth dashboard
```
