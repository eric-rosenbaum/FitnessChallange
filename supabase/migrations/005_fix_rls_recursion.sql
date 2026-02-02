-- Fix infinite recursion in group_memberships RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Members can view memberships in their groups" ON group_memberships;
DROP POLICY IF EXISTS "Group members can add members" ON group_memberships;
DROP POLICY IF EXISTS "Admins can update roles, members can leave" ON group_memberships;
DROP POLICY IF EXISTS "Members can leave, admins can remove members" ON group_memberships;

-- Create a security definer function to check membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_group_member(check_user_id UUID, check_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM group_memberships 
    WHERE user_id = check_user_id AND group_id = check_group_id
  );
$$;

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_group_admin(check_user_id UUID, check_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM group_memberships 
    WHERE user_id = check_user_id 
      AND group_id = check_group_id 
      AND role = 'admin'
  );
$$;

-- Recreate policies using the security definer functions (no recursion)
CREATE POLICY "Members can view memberships in their groups"
  ON group_memberships FOR SELECT
  USING (
    user_id = auth.uid() OR -- Can always see own membership
    public.is_group_member(auth.uid(), group_id) -- Can see memberships in groups they belong to
  );

-- Group members can add members (for invite flow)
CREATE POLICY "Group members can add members"
  ON group_memberships FOR INSERT
  WITH CHECK (
    public.is_group_member(auth.uid(), group_id) -- Must be a member of the group
  );

-- Only admins can update roles, but members can leave
CREATE POLICY "Admins can update roles, members can leave"
  ON group_memberships FOR UPDATE
  USING (
    user_id = auth.uid() OR -- Can update own membership
    public.is_group_admin(auth.uid(), group_id) -- Or is admin of the group
  );

-- Members can delete their own membership, admins can remove others
CREATE POLICY "Members can leave, admins can remove members"
  ON group_memberships FOR DELETE
  USING (
    user_id = auth.uid() OR -- Can delete own membership
    public.is_group_admin(auth.uid(), group_id) -- Or is admin of the group
  );
