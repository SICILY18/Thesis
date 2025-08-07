<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class HandleAdminAuth
{
    public function handle(Request $request, Closure $next)
    {
        // Debug logging
        Log::info('HandleAdminAuth middleware triggered', [
            'url' => $request->url(),
            'method' => $request->method(),
            'session_id' => $request->session()->getId(),
            'auth_check' => Auth::guard('web')->check(),
            'auth_user' => Auth::guard('web')->user() ? Auth::guard('web')->user()->toArray() : null
        ]);

        // Check if user is authenticated
        if (!Auth::guard('web')->check()) {
            if ($request->is('admin-login') || $request->is('/')) {
                return $next($request);
            }
            
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            
            return redirect('/');
        }

        Log::info('User authenticated, proceeding', [
            'user_id' => Auth::guard('web')->user()->id,
            'url' => $request->url()
        ]);

        // Get the response
        $response = $next($request);

        // Add cache control headers to prevent caching of protected pages
        return $response->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
                       ->header('Pragma', 'no-cache')
                       ->header('Expires', 'Sat, 01 Jan 2000 00:00:00 GMT');
    }
} 