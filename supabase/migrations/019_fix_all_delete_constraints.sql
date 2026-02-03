-- Fix ALL foreign key constraints to allow user deletion
-- This version finds and updates all constraints dynamically

-- First, let's see what constraints exist
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop and recreate all foreign keys that reference profiles
  FOR r IN 
    SELECT 
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table,
      ccu.column_name AS foreign_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_name = 'profiles'
      AND tc.constraint_name LIKE '%_fkey'
  LOOP
    -- Drop the constraint
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
    
    -- Recreate with CASCADE
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) ON DELETE CASCADE',
      r.table_name,
      r.constraint_name,
      r.column_name,
      r.foreign_table,
      r.foreign_column
    );
    
    RAISE NOTICE 'Updated constraint % on table %', r.constraint_name, r.table_name;
  END LOOP;
END $$;

-- Also ensure profiles -> auth.users is CASCADE (should already be, but let's verify)
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_name = 'profiles'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND rc.delete_rule = 'CASCADE'
  ) INTO constraint_exists;
  
  IF NOT constraint_exists THEN
    -- Drop and recreate profiles -> auth.users with CASCADE
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    ALTER TABLE profiles 
      ADD CONSTRAINT profiles_id_fkey 
      FOREIGN KEY (id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE 'Updated profiles -> auth.users constraint to CASCADE';
  ELSE
    RAISE NOTICE 'profiles -> auth.users constraint already has CASCADE';
  END IF;
END $$;
