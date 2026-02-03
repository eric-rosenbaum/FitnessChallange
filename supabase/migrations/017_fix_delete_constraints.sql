-- Fix foreign key constraints to allow user deletion
-- Change RESTRICT to CASCADE so related data is deleted when user is deleted

-- Drop existing foreign key constraints
ALTER TABLE groups 
  DROP CONSTRAINT IF EXISTS groups_created_by_fkey;

ALTER TABLE week_assignments 
  DROP CONSTRAINT IF EXISTS week_assignments_host_user_id_fkey,
  DROP CONSTRAINT IF EXISTS week_assignments_assigned_by_fkey;

ALTER TABLE week_challenges 
  DROP CONSTRAINT IF EXISTS week_challenges_created_by_fkey;

-- Recreate with CASCADE instead of RESTRICT
ALTER TABLE groups
  ADD CONSTRAINT groups_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE week_assignments
  ADD CONSTRAINT week_assignments_host_user_id_fkey 
  FOREIGN KEY (host_user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT week_assignments_assigned_by_fkey 
  FOREIGN KEY (assigned_by) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE week_challenges
  ADD CONSTRAINT week_challenges_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- Note: profiles table already has ON DELETE CASCADE from auth.users
-- So deleting from auth.users will cascade to profiles, which will cascade to all related data
