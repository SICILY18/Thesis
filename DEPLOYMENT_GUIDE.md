# Hermosa Water District - Deployment Guide

This guide will help you deploy the Hermosa Water District management system with separate repositories for frontend (Vercel) and backend (Render).

## Architecture Overview

```
┌─────────────────┐    API calls    ┌──────────────────┐    SQL queries    ┌─────────────────┐
│   Frontend      │◄──────────────► │    Backend       │◄─────────────────►│   Supabase      │
│   (Next.js)     │                 │   (Laravel)      │                   │  (PostgreSQL)   │
│   Vercel        │                 │   Render         │                   │   Database      │
└─────────────────┘                 └──────────────────┘                   └─────────────────┘
```

## Prerequisites

- GitHub account
- Vercel account
- Render account
- Supabase account
- Domain name (optional)

## Step 1: Set up Supabase Database

1. **Create a new Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Choose a region close to your users
   - Note down your project credentials:
     - Project URL
     - Anon key
     - Service role key
     - Database password

2. **Run database migrations:**
   - Copy your existing database schema to Supabase
   - Or use the SQL editor to create tables manually
   - Ensure all tables from your Laravel migrations exist

3. **Configure Row Level Security (optional):**
   - Set up RLS policies if needed for additional security

## Step 2: Prepare Repositories

### Create Frontend Repository

1. **Create a new GitHub repository:**
   ```bash
   # Create frontend repository
   mkdir hermosa-water-district-frontend
   cd hermosa-water-district-frontend
   git init
   ```

2. **Copy frontend files:**
   - Copy all files from the `frontend/` directory
   - Ensure `package.json`, `next.config.js`, and all source files are included

3. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial frontend setup"
   git remote add origin https://github.com/YOUR-USERNAME/hermosa-water-district-frontend.git
   git push -u origin main
   ```

### Create Backend Repository

1. **Create a new GitHub repository:**
   ```bash
   # Create backend repository
   mkdir hermosa-water-district-backend
   cd hermosa-water-district-backend
   git init
   ```

2. **Copy backend files:**
   - Copy all files from the `admin/` directory
   - Ensure `composer.json`, `render.yaml`, and all Laravel files are included

3. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial backend setup"
   git remote add origin https://github.com/YOUR-USERNAME/hermosa-water-district-backend.git
   git push -u origin main
   ```

## Step 3: Deploy Backend to Render

1. **Connect GitHub to Render:**
   - Go to [render.com](https://render.com)
   - Create a new Web Service
   - Connect your backend GitHub repository

2. **Configure Build Settings:**
   - **Environment:** PHP
   - **Build Command:**
     ```bash
     composer install --no-dev --optimize-autoloader && php artisan config:cache && php artisan route:cache && php artisan view:cache && npm install && npm run build
     ```
   - **Start Command:**
     ```bash
     php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT
     ```

3. **Set Environment Variables:**
   ```env
   APP_NAME=Hermosa Water District
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=base64:YOUR_GENERATED_KEY_HERE
   APP_URL=https://your-backend-name.onrender.com
   
   # Database (Supabase)
   DB_CONNECTION=pgsql
   DB_HOST=db.supabase.co
   DB_PORT=5432
   DB_DATABASE=postgres
   DB_USERNAME=postgres
   DB_PASSWORD=your_supabase_db_password
   DB_SSLMODE=require
   
   # Supabase
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_JWT_SECRET=your_jwt_secret
   
   # Frontend URL (will be updated after frontend deployment)
   FRONTEND_URL=https://your-frontend.vercel.app
   
   # Session
   SESSION_DRIVER=database
   SESSION_LIFETIME=120
   CACHE_DRIVER=database
   QUEUE_CONNECTION=database
   
   # Logging
   LOG_CHANNEL=stderr
   LOG_LEVEL=error
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for the build and deployment to complete
   - Note your backend URL (e.g., `https://your-backend-name.onrender.com`)

## Step 4: Deploy Frontend to Vercel

1. **Connect GitHub to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your frontend GitHub repository

2. **Configure Project Settings:**
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

3. **Set Environment Variables:**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-name.onrender.com
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for the build and deployment to complete
   - Note your frontend URL (e.g., `https://your-frontend.vercel.app`)

## Step 5: Update Backend CORS Configuration

1. **Update Backend Environment:**
   - Go back to your Render dashboard
   - Update the `FRONTEND_URL` environment variable with your actual Vercel URL
   - Redeploy if necessary

## Step 6: Test the Deployment

1. **Test Frontend:**
   - Visit your frontend URL
   - Ensure the login page loads correctly
   - Check browser console for any errors

2. **Test API Connection:**
   - Try logging in with test credentials
   - Check if API calls to the backend work
   - Verify dashboard data loads correctly

3. **Test Database Connection:**
   - Ensure data is being read from/written to Supabase
   - Check Supabase dashboard for activity

## Step 7: Set up Custom Domains (Optional)

### Frontend Domain
1. **Add Custom Domain in Vercel:**
   - Go to your project settings in Vercel
   - Add your custom domain
   - Configure DNS records as instructed

### Backend Domain
1. **Add Custom Domain in Render:**
   - Go to your service settings in Render
   - Add your custom domain
   - Configure DNS records as instructed

2. **Update Environment Variables:**
   - Update `APP_URL` in backend
   - Update `NEXT_PUBLIC_API_URL` in frontend

## Step 8: Monitor and Maintain

### Monitoring
- **Render:** Monitor backend performance and logs
- **Vercel:** Monitor frontend performance and analytics
- **Supabase:** Monitor database performance and usage

### Updates
- **Code Updates:** Push to GitHub, automatic deployments will trigger
- **Environment Variables:** Can be updated in respective dashboards
- **Database Migrations:** Run via Render's shell or deploy hooks

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Check `FRONTEND_URL` in backend environment
   - Verify CORS configuration in `config/cors.php`

2. **Database Connection Issues:**
   - Verify Supabase credentials
   - Check SSL/TLS settings
   - Ensure database is not paused

3. **Build Failures:**
   - Check build logs in Render/Vercel
   - Verify all dependencies are listed in `composer.json`/`package.json`
   - Ensure PHP/Node versions are compatible

4. **Session Issues:**
   - Verify session configuration in Laravel
   - Check cookie settings and HTTPS requirements

### Logs and Debugging
- **Render Logs:** Available in service dashboard
- **Vercel Logs:** Available in function logs section
- **Supabase Logs:** Available in project dashboard

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to Git
   - Use different keys for production and development
   - Regularly rotate API keys and secrets

2. **Database Security:**
   - Enable Row Level Security (RLS) in Supabase
   - Use service role key only for backend operations
   - Monitor database access logs

3. **API Security:**
   - Implement rate limiting
   - Use HTTPS only
   - Validate all input data

## Support

For issues with deployment or configuration:
1. Check the logs first
2. Verify environment variables
3. Test locally with production configuration
4. Contact support if needed

---

**Important Notes:**
- Replace all placeholder values (YOUR-USERNAME, your-project-id, etc.) with actual values
- Keep your API keys and secrets secure
- Test thoroughly before going live
- Set up monitoring and backups for production use 