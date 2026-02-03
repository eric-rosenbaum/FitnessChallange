# Troubleshooting: Not Receiving Signup Emails

If you're not receiving emails when signing up, here are the steps to diagnose and fix the issue:

## Step 1: Check Supabase Email Settings

1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Check these settings:
   - ✅ **Enable email signup** should be ON
   - ✅ **Enable email confirmations** - This determines if emails are sent

## Step 2: Check Email Confirmation Setting

**If "Enable email confirmations" is OFF:**
- Supabase will NOT send confirmation emails
- Users can sign in immediately after signup
- This is fine for development/testing
- The app will automatically sign you in after signup

**If "Enable email confirmations" is ON:**
- Supabase SHOULD send confirmation emails
- Users must verify email before signing in
- If emails aren't arriving, continue troubleshooting below

## Step 3: Check Supabase Logs

1. Go to **Logs** → **Auth Logs** in your Supabase dashboard
2. Look for entries when you tried to sign up
3. Check for any errors related to email sending

## Step 4: Check Your Email

1. **Check spam/junk folder** - Supabase emails often go to spam
2. **Check all email folders** - Some email clients filter aggressively
3. **Wait a few minutes** - Emails can be delayed
4. **Check the email address** - Make sure you entered it correctly

## Step 5: Supabase Email Service Limitations

Supabase's default email service has limitations:
- **Free tier**: Limited email sending, may not work reliably
- **Development**: Emails might not be sent at all
- **Production**: Should work but may have delays

## Step 6: Solutions

### Option A: Disable Email Confirmation (Easiest for Development)

1. Go to **Authentication** → **Providers** → **Email**
2. Turn OFF **Enable email confirmations**
3. Users can now sign in immediately after signup
4. No emails will be sent, but signup will work

### Option B: Set Up Custom SMTP (For Production)

1. Go to **Authentication** → **Email Templates** → **SMTP Settings**
2. Configure your own SMTP server (Gmail, SendGrid, etc.)
3. This ensures reliable email delivery
4. See Supabase docs for SMTP configuration

### Option C: Check Supabase Project Status

1. Go to **Settings** → **General**
2. Check if your project is active and not paused
3. Free tier projects can be paused after inactivity

## Step 7: Test Without Email Confirmation

If you just want to test the app:

1. **Disable email confirmation** in Supabase
2. Sign up with email/password
3. You'll be automatically signed in
4. No email needed!

## Step 8: Verify Email Templates

1. Go to **Authentication** → **Email Templates**
2. Check that **Confirm signup** template exists
3. Make sure it's not empty or misconfigured

## Common Issues

**"I signed up but no email arrived"**
- Check spam folder first
- Verify email confirmation is enabled in Supabase
- Check Supabase auth logs for errors
- Try disabling email confirmation for testing

**"Email confirmation is disabled but I still can't sign in"**
- Check browser console for errors
- Verify the signup was successful (check Supabase auth users)
- Try signing in manually with the email/password you used

**"I want emails to work in production"**
- Set up custom SMTP (Option B above)
- This is the most reliable solution
- Free tier email service is not guaranteed

## Quick Fix for Development

**Recommended for now**: Disable email confirmation
1. Supabase dashboard → Authentication → Providers → Email
2. Turn OFF "Enable email confirmations"
3. Sign up will work immediately, no email needed
4. You can enable it later when you set up SMTP for production
