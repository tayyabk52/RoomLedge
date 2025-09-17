# RoomLedger Deployment Guide

## Database Setup (REQUIRED FIRST)

Before deploying the application, you must run the following SQL scripts in your Supabase SQL Editor:

### 1. Run the Main Schema
Copy and paste the entire content of `../schema.sql` into Supabase SQL Editor and execute it.

### 2. Run the Authentication Functions
Copy and paste the entire content of `supabase-functions.sql` into Supabase SQL Editor and execute it.

This will:
- Create the database schema (tables, views, indexes)
- Set up automatic profile creation when users sign up
- Enable Row Level Security (RLS) for data protection
- Create necessary policies for secure data access

## Vercel Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial RoomLedger setup"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
   - `NEXT_PUBLIC_APP_URL` = Your Vercel deployment URL (e.g., https://your-app.vercel.app)

### 3. Deploy
Click "Deploy" and wait for the build to complete.

## Environment Variables

The application requires these environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Authentication Setup

### Supabase Auth Configuration
1. In your Supabase dashboard, go to Authentication > Settings
2. Configure the following:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: Add `https://your-app.vercel.app/auth/callback`
   - **Email Templates**: Customize as needed
   - **Email Confirmation**: Enable if desired

### Email Provider (Optional)
For production, configure a custom SMTP provider in Supabase:
1. Go to Settings > Auth
2. Configure SMTP settings with your email provider
3. This enables custom email templates and better deliverability

## Features Ready for Testing

✅ **Implemented and Working:**
- User registration with email/password
- Email verification (if enabled in Supabase)
- User login/logout
- Protected routes (dashboard requires authentication)
- Automatic profile creation
- Mobile-responsive design
- Professional landing page
- Dashboard with skeleton components

🚧 **Coming Next Phase:**
- Room creation and joining
- Bill management
- Settlement tracking
- Real data integration

## Post-Deployment Checklist

1. ✅ Database schema deployed
2. ✅ Environment variables configured
3. ✅ Application builds successfully
4. ✅ Authentication flow works
5. ✅ Protected routes work
6. ✅ User registration works
7. ✅ Profile creation works
8. ✅ Mobile responsiveness verified

## Troubleshooting

### Build Errors
- Ensure all environment variables are set
- Check that TypeScript types are correct
- Verify Supabase connection

### Authentication Issues
- Verify Supabase URL and keys are correct
- Check that database functions are installed
- Ensure RLS policies are active

### Database Connection
- Confirm database schema is deployed
- Check that profiles table exists
- Verify authentication trigger is working

## Next Steps

After successful deployment, you can:
1. Test user registration and login
2. Verify the dashboard loads correctly
3. Check that authentication redirects work
4. Begin implementing room and bill features

The application is now ready for production use with a solid authentication foundation!