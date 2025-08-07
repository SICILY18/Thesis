<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;

class EnsureCsrfToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Check if XSRF-TOKEN cookie exists
        if (!$request->cookies->has('XSRF-TOKEN')) {
            // Generate a new CSRF token
            $token = csrf_token();
            
            // Set the XSRF-TOKEN cookie
            Cookie::queue('XSRF-TOKEN', $token, 60 * 24 * 3, null, null, config('session.secure'), true);
        }

        return $next($request);
    }
} 