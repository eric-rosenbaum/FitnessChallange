# How to Delete Users in Supabase

## The Problem

Supabase won't let you delete users because of foreign key constraints with `ON DELETE RESTRICT`. These prevent deletion if the user has:
- Created a group
- Been assigned as a weekly host
- Assigned a weekly host
- Created a challenge

## Solution

Run the migration `017_fix_delete_constraints.sql` in Supabase SQL Editor. This changes the constraints from `RESTRICT` to `CASCADE`, so when you delete a user, all their related data is automatically deleted.

## Steps to Delete Users

### Option 1: After Running the Migration (Recommended)

1. Run `supabase/migrations/017_fix_delete_constraints.sql` in Supabase SQL Editor
2. Go to Supabase Dashboard → Authentication → Users
3. Select the users you want to delete
4. Click "Delete" - it should work now!

### Option 2: Manual Deletion (Before Migration)

If you need to delete users before running the migration, you need to manually delete related data first:

1. **Delete the user's data** (run in SQL Editor):
```sql
-- Replace 'USER_ID_HERE' with the actual user ID
DELETE FROM workout_logs WHERE user_id = 'USER_ID_HERE';
DELETE FROM group_memberships WHERE user_id = 'USER_ID_HERE';
DELETE FROM week_challenges WHERE created_by = 'USER_ID_HERE';
DELETE FROM week_assignments WHERE host_user_id = 'USER_ID_HERE' OR assigned_by = 'USER_ID_HERE';
DELETE FROM groups WHERE created_by = 'USER_ID_HERE';
DELETE FROM profiles WHERE id = 'USER_ID_HERE';
```

2. **Then delete from Auth** (in Supabase Dashboard → Authentication → Users)

### Option 3: Delete Everything (Nuclear Option)

If you want to delete all test data and start fresh:

```sql
-- WARNING: This deletes ALL data!
DELETE FROM workout_logs;
DELETE FROM strength_exercises;
DELETE FROM week_challenges;
DELETE FROM week_assignments;
DELETE FROM group_memberships;
DELETE FROM groups;
DELETE FROM profiles;
-- Then delete users from Auth dashboard
```

## After Running Migration

Once you run `017_fix_delete_constraints.sql`, deleting users from the Auth dashboard will automatically:
1. Delete the user from `auth.users`
2. Cascade delete their profile (because `profiles.id` references `auth.users.id` with CASCADE)
3. Cascade delete all related data (groups they created, memberships, assignments, challenges, logs)

This makes user deletion much easier!
