<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Supabase Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for Supabase integration.
    | Make sure to add your Supabase credentials to your .env file.
    |
    */

    'url' => env('SUPABASE_URL', ''),
    'anon_key' => env('SUPABASE_ANON_KEY', ''),
    'service_role_key' => env('SUPABASE_SERVICE_ROLE_KEY', ''),

    'api' => [
        'timeout' => env('SUPABASE_API_TIMEOUT', 30),
    ],
]; 