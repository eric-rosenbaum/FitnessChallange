-- Update the trigger to create profile with empty string instead of 'User'
-- This forces users to set their display name during onboarding
-- Note: display_name is NOT NULL, so we use empty string as placeholder

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger already exists, so this just updates the function
-- Users will be prompted to set their display name on the onboarding page
-- The app checks for empty string or 'User' to determine if onboarding is needed
