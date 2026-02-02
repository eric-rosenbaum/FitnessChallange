-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to auto-promote admin when admin leaves
CREATE OR REPLACE FUNCTION public.handle_admin_removal()
RETURNS TRIGGER AS $$
DECLARE
  remaining_admins INTEGER;
  first_member_id UUID;
BEGIN
  -- Check if there are any remaining admins in the group
  SELECT COUNT(*) INTO remaining_admins
  FROM group_memberships
  WHERE group_id = OLD.group_id AND role = 'admin' AND user_id != OLD.user_id;
  
  -- If no admins remain and there are other members, promote the first one
  IF remaining_admins = 0 THEN
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
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-promote admin
CREATE TRIGGER on_member_removed
  AFTER DELETE ON group_memberships
  FOR EACH ROW
  WHEN (OLD.role = 'admin')
  EXECUTE FUNCTION public.handle_admin_removal();
