# Render Deployment Guide - Hermosa Water District Backend

Complete step-by-step guide to deploy your Laravel backend to Render.

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ GitHub account with your backend repository
- ✅ Render account (free tier available)
- ✅ Supabase project with database credentials
- ✅ Laravel APP_KEY generated

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Supabase Database

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and enter project details
   - Select a region close to your users
   - Create the project (takes 2-3 minutes)

2. **Get Database Credentials:**
   - Go to Settings → Database
   - Note down these values:
     - Host: `db.supabase.co`
     - Database name: `postgres`
     - Port: `5432`
     - User: `postgres`
     - Password: [your database password]

3. **Get API Credentials:**
   - Go to Settings → API
   - Note down:
     - Project URL: `https://your-project-id.supabase.co`
     - Anon key (public)
     - Service role key (secret)

### Step 2: Generate Laravel APP_KEY

Run this command locally to generate your application key:

```bash
# Navigate to your admin folder
cd admin

# Generate APP_KEY
php artisan key:generate --show
```

Copy the output (should look like: `base64:XXXXXXXXXX`)

### Step 3: Deploy to Render

1. **Create Render Account:**
   - Go to [render.com](https://render.com)
   - Sign up with your GitHub account

2. **Create New Web Service:**
   - Click "New +" button
   - Select "Web Service"
   - Connect your GitHub account if prompted

3. **Select Repository:**
   - Find and select: `hermosa-water-district-backend`
   - Click "Connect"

### Step 4: Configure Build Settings

Fill in these settings exactly:

**Basic Settings:**
- **Name:** `hermosa-water-district-backend` (or your preferred name)
- **Environment:** `Docker` (PHP is not natively supported)
- **Region:** Choose closest to your location
- **Branch:** `master`
- **Root Directory:** Leave blank
- **Dockerfile Path:** `Dockerfile`

**Build & Deploy Settings:**
- **Build Command:** Leave blank (Docker handles this)
- **Start Command:** Leave blank (Docker handles this)
- **Dockerfile Path:** `Dockerfile`

*Note: The Dockerfile contains all build and start instructions*

**Instance Type:**
- Select "Starter" (free tier) for testing
- For production, consider "Starter+" or higher

### Step 5: Set Environment Variables

Click "Advanced" and add these environment variables:

#### Application Settings
```env
APP_NAME=Hermosa Water District
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_GENERATED_KEY_FROM_STEP_2
APP_URL=https://your-service-name.onrender.com
```

#### Database Settings (Supabase)
```env
DB_CONNECTION=pgsql
DB_HOST=db.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=YOUR_SUPABASE_DB_PASSWORD
DB_SSLMODE=require
```

#### Supabase API Settings
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

#### Session & Cache Settings
```env
SESSION_DRIVER=database
SESSION_LIFETIME=120
CACHE_DRIVER=database
QUEUE_CONNECTION=database
BROADCAST_DRIVER=log
FILESYSTEM_DISK=local
```

#### Logging Settings
```env
LOG_CHANNEL=stderr
LOG_LEVEL=error
LOG_DEPRECATIONS_CHANNEL=null
```

#### CORS & Frontend Settings
```env
FRONTEND_URL=https://your-frontend.vercel.app
```
*Note: You'll update this after deploying your frontend*

### Step 6: Deploy

1. **Review Settings:**
   - Double-check all environment variables
   - Ensure build/start commands are correct
   - Verify repository is connected

2. **Create Web Service:**
   - Click "Create Web Service"
   - Deployment will start automatically

3. **Monitor Deployment:**
   - Watch the build logs for any errors
   - First deployment takes 5-10 minutes
   - Subsequent deployments are faster

### Step 7: Verify Deployment

1. **Check Service Status:**
   - Wait for "Live" status in Render dashboard
   - Note your service URL: `https://your-service-name.onrender.com`

2. **Test API Endpoints:**
   - Visit: `https://your-service-name.onrender.com/api/check-auth`
   - Should return JSON response (not 404 error)

3. **Test Database Connection:**
   - Visit: `https://your-service-name.onrender.com/test-supabase`
   - Should show database connection status

## 🔧 Post-Deployment Configuration

### Update Frontend Environment Variables

Once your backend is deployed:

1. **Copy Your Backend URL:**
   ```
   https://your-service-name.onrender.com
   ```

2. **Update Frontend (Vercel) Environment Variables:**
   - Go to your Vercel project dashboard
   - Settings → Environment Variables
   - Update: `NEXT_PUBLIC_API_URL=https://your-service-name.onrender.com`

3. **Update Backend FRONTEND_URL:**
   - In Render dashboard, update environment variable:
   - `FRONTEND_URL=https://your-frontend.vercel.app`

### Database Migrations

Your Laravel app will automatically run migrations on startup. If you need to run them manually:

1. **Go to Render Dashboard:**
   - Select your service
   - Click "Shell" tab
   - Run: `php artisan migrate --force`

## 🔍 Troubleshooting

### Common Issues & Solutions

#### 1. Build Fails - Composer Issues
**Error:** `composer install` fails
**Solution:**
- Check if `composer.json` exists in repository
- Verify PHP version compatibility
- Check Render build logs for specific errors

#### 2. Database Connection Fails
**Error:** SQLSTATE connection errors
**Solution:**
- Verify Supabase credentials are correct
- Check if Supabase project is active (not paused)
- Ensure `DB_SSLMODE=require` is set

#### 3. 500 Internal Server Error
**Error:** White screen or 500 error
**Solution:**
- Check Render logs for PHP errors
- Verify `APP_KEY` is set correctly
- Ensure all required environment variables are set

#### 4. CORS Errors from Frontend
**Error:** Cross-origin request blocked
**Solution:**
- Verify `FRONTEND_URL` is set in backend
- Check `config/cors.php` configuration
- Ensure frontend URL is correct

#### 5. Migration Fails
**Error:** Migration errors on startup
**Solution:**
- Check database credentials
- Verify database exists and is accessible
- Run migrations manually via Render shell

### Checking Logs

**View Application Logs:**
1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab
4. Monitor for errors and issues

**Enable Debug Mode (temporarily):**
- Set `APP_DEBUG=true` in environment variables
- Redeploy to see detailed error messages
- **Important:** Set back to `false` for production

## 🔒 Security Best Practices

### Environment Variables Security
- ✅ Never commit `.env` files to Git
- ✅ Use strong, unique `APP_KEY`
- ✅ Rotate Supabase keys regularly
- ✅ Use different credentials for production/staging

### Database Security
- ✅ Enable Row Level Security (RLS) in Supabase
- ✅ Use service role key only for backend
- ✅ Monitor database access logs

### Application Security
- ✅ Keep Laravel updated
- ✅ Use HTTPS only (`APP_URL` should be https)
- ✅ Set `APP_DEBUG=false` in production
- ✅ Configure proper CORS settings

## 📈 Performance Optimization

### Render Performance Tips
- ✅ Use "Starter+" plan for better performance
- ✅ Enable Redis for caching (paid plans)
- ✅ Configure proper cache drivers
- ✅ Optimize Laravel configuration

### Laravel Optimization
```bash
# These commands are already in your build process:
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 🔄 Updating Your Application

### Deploy Updates
1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin master
   ```

2. **Automatic Deployment:**
   - Render automatically detects GitHub changes
   - Builds and deploys new version
   - Zero-downtime deployment

### Manual Deployment
- Go to Render dashboard
- Click "Manual Deploy" → "Deploy latest commit"

## 📞 Support & Resources

### Render Documentation
- [Render PHP Guide](https://render.com/docs/deploy-php)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Custom Domains](https://render.com/docs/custom-domains)

### Laravel Resources
- [Laravel Deployment](https://laravel.com/docs/deployment)
- [Laravel Configuration](https://laravel.com/docs/configuration)

### Getting Help
- Render Support: [render.com/support](https://render.com/support)
- Render Community: [Render Discord](https://discord.gg/render)

---

## ✅ Quick Checklist

Before deploying, ensure you have:

- [ ] Supabase project created with credentials
- [ ] Laravel APP_KEY generated
- [ ] GitHub repository with backend code
- [ ] Render account created
- [ ] All environment variables prepared
- [ ] Frontend repository ready for Vercel

After deployment:

- [ ] Backend service shows "Live" status
- [ ] API endpoints respond correctly
- [ ] Database connection works
- [ ] Frontend environment updated with backend URL
- [ ] CORS configuration updated
- [ ] Test full application flow

---

**🎉 Congratulations!** Your Laravel backend should now be running on Render!

Your backend API will be available at: `https://your-service-name.onrender.com` 