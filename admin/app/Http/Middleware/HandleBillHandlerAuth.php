<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class HandleBillHandlerAuth
{
    public function handle(Request $request, Closure $next)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
            return redirect('/');
        }

        $user = Auth::user();
        
        // Check staff_tb for role
        $staff = DB::table('staff_tb')
            ->where('username', str_replace('@staff.com', '', $user->email))
            ->first();

        if (!$staff || $staff->role !== 'bill handler') {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            return redirect('/');
        }

        // Get the response
        $response = $next($request);

        // Add cache control headers to prevent caching of protected pages
        return $response->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
                       ->header('Pragma', 'no-cache')
                       ->header('Expires', 'Sat, 01 Jan 2000 00:00:00 GMT');
    }
} 