#!/bin/bash

# Clear all caches first
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Optimize the application
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Build frontend assets
npm run build

echo "Application optimized for production!" 