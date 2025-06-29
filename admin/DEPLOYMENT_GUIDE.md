# Hermosa Water District - Deployment Guide

## 🎯 **New Hosting Architecture**

- **Frontend (React Native Web)**: Vercel (Free)
- **Backend (Laravel API)**: Railway ($5/month) or Render (Free tier)
- **Database**: Supabase (PostgreSQL) - Keep existing setup
- **Mobile App**: React Native - connects to Railway/Render API

---

## 🚀 **Part 1: Deploy Laravel Backend**

### **Option A: Railway ($5/month) - Recommended**

#### 1. **Prepare Laravel for Railway**
```bash
# Create railway.json (if needed)
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "php artisan serve --host=0.0.0.0 --port=$PORT"
  }
}
```

#### 2. **Deploy Steps**
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `hermosa-water-district` repository
5. Choose the `admin` folder as root directory
6. Railway will auto-detect Laravel and deploy

#### 3. **Environment Variables**
Add these in Railway dashboard:
```
APP_NAME=Hermosa Water District
APP_ENV=production
APP_KEY=base64:87ZG61ohphum1Y72rfhtdXAR3vT7FTNFik2sTdC39cE=
APP_DEBUG=false
APP_URL=https://your-app.railway.app

DB_CONNECTION=pgsql
DB_HOST=your-supabase-host.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=your-supabase-username
DB_PASSWORD=your-supabase-password

SESSION_DRIVER=database
CACHE_DRIVER=database
QUEUE_CONNECTION=database
```

---

### **Option B: Render (Free tier)**

#### 1. **Create render.yaml**
```yaml
services:
  - type: web
    name: hermosa-water-district
    env: php
    plan: free
    buildCommand: composer install --no-dev --optimize-autoloader && php artisan config:cache
    startCommand: php artisan serve --host=0.0.0.0 --port=$PORT
    envVars:
      - key: APP_ENV
        value: production
      - key: APP_KEY
        value: base64:87ZG61ohphum1Y72rfhtdXAR3vT7FTNFik2sTdC39cE=
```

#### 2. **Deploy Steps**
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub
3. Click "New Web Service"
4. Connect your GitHub repository
5. Use these settings:
   - **Root Directory**: `admin`
   - **Build Command**: `composer install --no-dev --optimize-autoloader`
   - **Start Command**: `php artisan serve --host=0.0.0.0 --port=$PORT`

---

## 🌐 **Part 2: Deploy Frontend (if needed)**

### **Option: Vercel (Free)**

If you have a separate React frontend:

1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Select your frontend repository
5. Vercel will auto-deploy

---

## 📱 **Part 3: Update React Native App**

Update your mobile app's API base URL:

```javascript
// In your React Native app config
const API_BASE_URL = 'https://your-app.railway.app'; // or .onrender.com
```

---

## ✅ **Advantages of This Setup**

### **Railway Benefits:**
- ✅ Automatic Laravel detection
- ✅ Built-in PostgreSQL support
- ✅ Easy environment variables
- ✅ Automatic deployments from GitHub
- ✅ $5/month for reliable hosting

### **Render Benefits:**
- ✅ Free tier available
- ✅ Good for testing/development
- ✅ Easy GitHub integration

### **Overall Benefits:**
- ✅ Much simpler than AWS
- ✅ No complex configurations
- ✅ Automatic deployments
- ✅ Keep existing Supabase database
- ✅ Works with React Native mobile app

---

## 🔧 **Next Steps**

1. **Choose hosting**: Railway (recommended) or Render
2. **Deploy backend**: Follow steps above
3. **Update mobile app**: Change API URL
4. **Test**: Verify all endpoints work
5. **Go live**: Your app is ready!

**This setup is much more reliable and easier to maintain than AWS Elastic Beanstalk!** 