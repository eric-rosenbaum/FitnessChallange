-- When the group creator deletes their account, keep the group alive (SET NULL) instead of deleting it (CASCADE).
-- This allows other members to continue using the group, and new users can join with the same invite code.
ALTER TABLE groups
  DROP CONSTRAINT IF EXISTS groups_created_by_fkey;

ALTER TABLE groups
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE groups
  ADD CONSTRAINT groups_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES profiles(id)
  ON DELETE SET NULL;
