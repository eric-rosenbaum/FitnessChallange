-- Allow users to delete their own account.
-- Deletes from auth.users; CASCADE removes profiles and all related data.
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM auth.users WHERE id = auth.uid();
$$;

-- Grant execute to authenticated users (they can only delete themselves via auth.uid())
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
