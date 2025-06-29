<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Supabase Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration options for Supabase integration
    | including database connection, authentication, and storage settings.
    |
    */

    'url' => env('SUPABASE_URL'),
    'anon_key' => env('SUPABASE_ANON_KEY'),
    'service_role_key' => env('SUPABASE_SERVICE_ROLE_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Database Configuration
    |--------------------------------------------------------------------------
    |
    | Supabase database connection details. These are used when connecting
    | directly to the PostgreSQL database that powers Supabase.
    |
    */
    'database' => [
        'host' => env('DB_HOST'),
        'port' => env('DB_PORT', 5432),
        'database' => env('DB_DATABASE', 'postgres'),
        'username' => env('DB_USERNAME', 'postgres'),
        'password' => env('DB_PASSWORD'),
        'ssl_mode' => env('DB_SSLMODE', 'require'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Supabase authentication including JWT settings
    | and session management options.
    |
    */
    'auth' => [
        'jwt_secret' => env('SUPABASE_JWT_SECRET'),
        'auto_confirm_users' => env('SUPABASE_AUTO_CONFIRM_USERS', false),
        'enable_signup' => env('SUPABASE_ENABLE_SIGNUP', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Storage Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Supabase storage bucket settings.
    |
    */
    'storage' => [
        'bucket' => env('SUPABASE_STORAGE_BUCKET', 'uploads'),
        'public_url' => env('SUPABASE_STORAGE_URL'),
    ],

    /*
    |--------------------------------------------------------------------------
    | API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Supabase API endpoints and timeouts.
    |
    */
    'api' => [
        'timeout' => env('SUPABASE_API_TIMEOUT', 30),
        'retry_attempts' => env('SUPABASE_RETRY_ATTEMPTS', 3),
    ],

    /*
    |--------------------------------------------------------------------------
    | Table Names
    |--------------------------------------------------------------------------
    |
    | Configure the table names used in your Supabase database.
    | This allows for easy customization if you have different naming conventions.
    |
    */
    'tables' => [
        'staff' => 'staff_tb',
        'customers' => 'customers_tb',
        'payments' => 'payments',
        'bills' => 'bills',
        'rates' => 'rates_tb',
        'announcements' => 'announcements_tb',
        'tickets' => 'tickets_tb',
    ],
]; 