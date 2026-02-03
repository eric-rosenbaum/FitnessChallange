# Supabase Email/Password Authentication Setup

I've updated your app to use email/password authentication instead of magic links. Here's what you need to do in your Supabase dashboard:

## Steps to Configure in Supabase

### 1. Enable Email/Password Provider

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Email** in the list of providers
4. Make sure **Email** is **enabled**
5. Under **Email Auth**, ensure:
   - ✅ **Enable email confirmations** is checked (recommended for security)
   - ✅ **Enable email signup** is checked
   - ✅ **Enable email login** is checked

### 2. Configure Email Templates (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. You can customize:
   - **Confirm signup** - Email sent when users sign up (if email confirmation is enabled)
   - **Reset password** - Email sent when users request password reset
   - **Magic link** - You can ignore this one since we're not using magic links anymore

### 3. Configure Site URL and Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set your **Site URL** to: `http://localhost:3000` (for development) or your production URL
3. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/reset-password`
   - (Add your production URLs if deploying)

### 4. Email Confirmation Settings

**Option A: Require Email Confirmation (Recommended for Production)**
- Users must verify their email before they can sign in
- More secure, prevents fake accounts
- Users will receive a confirmation email after signup

**Option B: Disable Email Confirmation (Easier for Development)**
- Users can sign in immediately after signup
- Less secure, but faster for testing
- Set **Enable email confirmations** to OFF

### 5. Password Requirements

Supabase has default password requirements:
- Minimum 6 characters (this is enforced in the app)
- You can configure additional requirements in **Authentication** → **Policies** if needed

## What Changed in the Code

1. **Login Page** (`app/login/page.tsx`):
   - Now has email and password fields
   - Toggle between "Sign In" and "Sign Up"
   - Uses `signInWithPassword()` instead of `signInWithOtp()`

2. **Reset Password Page** (`app/reset-password/page.tsx`):
   - New page for password reset
   - Users can request a reset link
   - Users can set a new password after clicking the link

3. **Auth Callback** (`app/auth/callback/route.ts`):
   - Simplified (no more PKCE debugging)
   - Still handles email verification after signup

4. **Profile Page** (`app/profile/page.tsx`):
   - Removed note about password reset not being available
   - Password reset button now works

## Testing

1. **Sign Up**:
   - Go to `/login`
   - Click "Sign Up"
   - Enter email and password (min 6 characters)
   - If email confirmation is enabled, check your email and click the verification link
   - If disabled, you'll be signed in immediately

2. **Sign In**:
   - Go to `/login`
   - Enter your email and password
   - Click "Sign In"

3. **Reset Password**:
   - Go to `/reset-password` or click "Forgot your password?" on login page
   - Enter your email
   - Check your email for the reset link
   - Click the link and set a new password

## Notes

- The app still uses the same Supabase project and database
- Existing users who signed up with magic links will need to set a password (they can use "Forgot Password" to do this)
- All existing data (profiles, groups, logs) remains intact
- The auth callback route is still needed for email verification after signup

## Troubleshooting

**"Invalid login credentials"**:
- Make sure the user exists and password is correct
- If user signed up with magic link before, they need to reset their password first

**"Email not confirmed"**:
- Check if email confirmation is enabled in Supabase
- User needs to click the verification link in their email

**Password reset email not received**:
- Check spam folder
- Verify email templates are configured in Supabase
- Check Supabase logs for email delivery issues
