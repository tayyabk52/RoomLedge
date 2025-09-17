# RoomLedger Troubleshooting Guide

## Profile Fetching Issues

### Problem: "Cannot coerce the result to a single JSON object" Error

**Symptoms:**
- Login works but profile fetching fails
- Error in console: `Cannot coerce the result to a single JSON object`
- User can sign in but dashboard doesn't load properly

**Root Causes:**
1. Duplicate profiles in the database
2. Database trigger not working properly
3. RLS policies blocking profile access

**Solutions:**

### Step 1: Check Database State
Run this query in Supabase SQL Editor to check for issues:

```sql
-- Check for duplicate profiles
SELECT id, full_name, created_at, COUNT(*) as count
FROM profiles
GROUP BY id, full_name, created_at
HAVING COUNT(*) > 1;

-- Check profiles without corresponding auth users
SELECT p.id, p.full_name
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- Check auth users without profiles
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

### Step 2: Clean Up Database (if needed)
If you find issues, run the cleanup script:

```sql
-- Run the entire content of database-cleanup.sql in Supabase SQL Editor
```

### Step 3: Verify Database Functions
Make sure the profile creation trigger is working:

```sql
-- Check if the function exists
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- Check if the trigger exists
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created';
```

If missing, re-run the `supabase-functions.sql` script.

### Step 4: Test Profile Creation
Create a test user to verify the trigger works:

```sql
-- This should automatically create a profile
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"full_name": "Test User"}'::jsonb
);
```

## Authentication Flow Issues

### Problem: Users Can't Sign Up

**Check:**
1. Email confirmation settings in Supabase
2. SMTP configuration (for production)
3. Site URL configuration in Supabase Auth settings

**Solution:**
1. Go to Supabase Dashboard > Authentication > Settings
2. Set Site URL to your domain (e.g., `https://your-app.vercel.app`)
3. Add redirect URLs if needed
4. For development, you can disable email confirmation temporarily

### Problem: Users Can't Access Dashboard

**Check:**
1. RLS policies are enabled and correct
2. User has a valid session
3. Profile exists for the user

**Solution:**
1. Check browser dev tools for console errors
2. Verify session exists: `supabase.auth.getSession()`
3. Check if profile exists in database

## Deployment Issues

### Problem: Build Fails on Vercel

**Common Causes:**
1. Missing environment variables
2. TypeScript errors
3. Import/export issues

**Solution:**
1. Add all required environment variables in Vercel dashboard
2. Check build logs for specific errors
3. Test build locally first: `npm run build`

### Problem: Database Connection Issues on Vercel

**Check:**
1. Environment variables are set correctly
2. Supabase URL and keys are valid
3. Database is accessible from Vercel IPs

## Performance Issues

### Problem: Slow Profile Loading

**Solution:**
The app now includes automatic retry logic and profile creation fallback. If profiles are still slow to load:

1. Check database performance in Supabase dashboard
2. Verify indexes are created (they should be from schema.sql)
3. Check network connectivity

## Development Issues

### Problem: Hot Reload Issues

**Solution:**
1. Restart the development server: `npm run dev`
2. Clear Next.js cache: `rm -rf .next`
3. Clear browser cache and cookies

### Problem: TypeScript Errors

**Solution:**
1. Update TypeScript: `npm update typescript`
2. Check for type mismatches
3. Ensure all imports are correct

## Getting Help

If you're still experiencing issues:

1. Check the browser console for detailed error messages
2. Check Supabase logs in the dashboard
3. Enable debug logging by adding `console.log` statements
4. Check the network tab for failed API requests

### Debug Mode

To enable more detailed logging, temporarily add this to your `.env.local`:

```
NEXT_PUBLIC_DEBUG=true
```

Then add debug logs in the auth service and useAuth hook to trace the issue.

## Quick Fixes

### Reset User State
If a user is stuck in a bad state:

```sql
-- Delete user's profile (will be recreated)
DELETE FROM profiles WHERE id = 'user-id-here';

-- Or reset user's session (they'll need to log in again)
DELETE FROM auth.sessions WHERE user_id = 'user-id-here';
```

### Verify Environment
Make sure these are set in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```