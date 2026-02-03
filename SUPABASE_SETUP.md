# Supabase Setup Instructions

This guide will walk you through setting up Supabase for the Fitness Challenge Tracker app.

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Fitness Challenge (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine for MVP
5. Click "Create new project"
6. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll need:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")
3. Copy both values - you'll need them in the next step

## Step 3: Set Up Environment Variables

1. In your project root, create a file named `.env.local`:
   ```bash
   touch .env.local
   ```

2. Add the following to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. Replace `your_project_url_here` and `your_anon_key_here` with the values from Step 2

**Important**: Never commit `.env.local` to git (it's already in `.gitignore`)

## Step 4: Run Database Migrations

You have two options:

### Option A: Using Supabase Dashboard (Recommended for first time)

1. In Supabase dashboard, go to **SQL Editor**
2. Open each migration file in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_views.sql`
   - `supabase/migrations/003_rls_policies.sql`
   - `supabase/migrations/004_triggers.sql`
   - `supabase/migrations/005_fix_rls_recursion.sql` (IMPORTANT: Run this to fix infinite recursion error)
   - `supabase/migrations/016_disable_rls.sql` (OPTIONAL: Disables RLS for personal use - only if you want to skip security)
3. Copy the contents of each file
4. Paste into SQL Editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. Repeat for all files in order

**Important**: 
- If you see an "infinite recursion" error when updating your profile, you need to run migration `005_fix_rls_recursion.sql` to fix the RLS policies.
- If you're having JWT/RLS issues and just want to get the app working for personal use, run `016_disable_rls.sql` to disable all security (⚠️ only for personal/testing use!).

### Option B: Using Supabase CLI (Advanced)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find project-ref in Settings → General → Reference ID)

3. Run migrations:
   ```bash
   supabase db push
   ```

## Step 5: Verify Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see these tables:
   - `profiles`
   - `groups`
   - `group_memberships`
   - `week_assignments`
   - `week_challenges`
   - `strength_exercises`
   - `workout_logs`

3. Go to **Database** → **Views** and verify these views exist:
   - `v_active_week`
   - `v_week_exercises`
   - `v_user_week_progress`
   - `v_leaderboard_active_week`
   - `v_activity_feed_active_week`

## Step 6: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. Under **Email Auth**, configure:
   - **Enable Email provider**: ON
   - **Confirm email**: OFF (for MVP - users can sign in immediately)
   - **Secure email change**: OFF (for MVP)

4. Go to **Authentication** → **URL Configuration**
5. Add your site URL:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`

**Note**: Magic links expire after 1 hour by default. If a user's link expires, they'll see an error message and can request a new link from the login page.

## Step 7: Test the Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. You should be redirected to `/login`
4. Enter your email and click "Send Magic Link"
5. Check your email and click the magic link
6. You should be redirected back to the app

## Step 8: Create Your First Group

1. After logging in, you'll be redirected to onboarding (if no display name)
2. Set your display name
3. You'll see an empty state - click "Create Group" or navigate to `/create-group`
4. Create a group with a name and invite code
5. You're now ready to use the app!

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env.local` file has the correct values
- Make sure there are no extra spaces or quotes
- Restart your dev server after changing `.env.local`

### "relation does not exist" error
- Make sure you ran all 4 migration files in order
- Check the SQL Editor for any error messages
- Verify tables exist in Table Editor

### "RLS policy violation" error
- Check that RLS policies were created (migration 003)
- Verify you're logged in (check auth state)
- Check that you're a member of the group you're trying to access

### Magic link expired or not working
- **Link expired**: Magic links expire after 1 hour by default. Request a new link from the login page.
- Check your email spam folder
- Verify redirect URL is set correctly in Supabase
- Check browser console for errors
- **To extend expiration time**: In Supabase dashboard, go to **Authentication** → **Email Templates** → **Magic Link** and adjust the expiration time (requires custom SMTP setup for production)

### Profile not created automatically
- Check that trigger was created (migration 004)
- Manually create profile in Table Editor if needed:
  ```sql
  INSERT INTO profiles (id, display_name)
  VALUES ('your-user-id', 'Your Name');
  ```

## Next Steps

Once everything is working:
1. Test creating a group
2. Test joining a group with invite code
3. Test assigning a weekly host
4. Test creating a challenge
5. Test logging workouts
6. Verify leaderboard and activity feed work

## Production Deployment

When deploying to production:
1. Update **Site URL** in Supabase to your production domain
2. Add production redirect URL to **Redirect URLs**
3. Update `.env.local` → `.env.production` with production values
4. Consider enabling email confirmation for production
5. Set up proper CORS settings if needed

## Security Notes

- The `anon` key is safe to use in client-side code (it's public)
- RLS policies enforce security at the database level
- Never expose your `service_role` key in client code
- All user data is scoped to groups via RLS policies
