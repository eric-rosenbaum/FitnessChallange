-- Ensure a group always has an admin. When admin leaves, promote next member. When last member leaves, delete group.

-- When a new member joins, if the group has no admins (e.g. data inconsistency), make them admin
CREATE OR REPLACE FUNCTION public.handle_member_insert()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM group_memberships
  WHERE group_id = NEW.group_id AND role = 'admin';

  IF admin_count = 0 THEN
    NEW.role := 'admin';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_member_inserted ON group_memberships;

CREATE TRIGGER on_member_inserted
  BEFORE INSERT ON group_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_member_insert();

CREATE OR REPLACE FUNCTION public.handle_member_removal()
RETURNS TRIGGER AS $$
DECLARE
  remaining_count INTEGER;
  remaining_admins INTEGER;
  first_member_id UUID;
BEGIN
  -- Count remaining members (OLD row already deleted)
  SELECT COUNT(*) INTO remaining_count
  FROM group_memberships
  WHERE group_id = OLD.group_id;

  IF remaining_count = 0 THEN
    -- Last member left; delete the orphaned group
    DELETE FROM groups WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;

  -- If the deleted member was admin, ensure someone else becomes admin
  IF OLD.role = 'admin' THEN
    SELECT COUNT(*) INTO remaining_admins
    FROM group_memberships
    WHERE group_id = OLD.group_id AND role = 'admin';

    IF remaining_admins = 0 THEN
      -- No admins left; promote the first remaining member (oldest by created_at)
      SELECT user_id INTO first_member_id
      FROM group_memberships
      WHERE group_id = OLD.group_id
      ORDER BY created_at ASC
      LIMIT 1;

      IF first_member_id IS NOT NULL THEN
        UPDATE group_memberships
        SET role = 'admin'
        WHERE group_id = OLD.group_id AND user_id = first_member_id;
      END IF;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Replace the old trigger with the unified one (runs for every member deletion)
DROP TRIGGER IF EXISTS on_member_removed ON group_memberships;

CREATE TRIGGER on_member_removed
  AFTER DELETE ON group_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_member_removal();

-- When role is updated to 'member', ensure we don't leave the group with 0 admins.
-- If demoting the last admin, promote the oldest other member first.
CREATE OR REPLACE FUNCTION public.handle_role_update()
RETURNS TRIGGER AS $$
DECLARE
  remaining_admins INTEGER;
  first_member_id UUID;
BEGIN
  IF NEW.role = 'member' AND OLD.role = 'admin' THEN
    SELECT COUNT(*) INTO remaining_admins
    FROM group_memberships
    WHERE group_id = NEW.group_id AND role = 'admin' AND user_id != NEW.user_id;

    IF remaining_admins = 0 THEN
      -- Demoting last admin; promote another member
      SELECT user_id INTO first_member_id
      FROM group_memberships
      WHERE group_id = NEW.group_id AND user_id != NEW.user_id
      ORDER BY created_at ASC
      LIMIT 1;

      IF first_member_id IS NOT NULL THEN
        UPDATE group_memberships
        SET role = 'admin'
        WHERE group_id = NEW.group_id AND user_id = first_member_id;
      ELSE
        -- Only one member; keep them as admin (reject the demotion)
        NEW.role := 'admin';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_member_role_updated ON group_memberships;

CREATE TRIGGER on_member_role_updated
  BEFORE UPDATE OF role ON group_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_role_update();
