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
            Log::warning('HandleBillHandlerAuth: User not authenticated');
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated',
                    'debug' => 'No authenticated user found'
                ], 401);
            }
            return redirect('/');
        }

        $user = Auth::user();
        Log::info('HandleBillHandlerAuth: Checking auth for user', [
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email
        ]);
        
        // Extract username from email (remove @staff.com)
        $username = str_replace('@staff.com', '', $user->email);
        
        // Check staff_tb for role using username
        $staff = DB::table('staff_tb')
            ->where('username', $username)
            ->first();

        Log::info('HandleBillHandlerAuth: Staff lookup result', [
            'staff_found' => $staff ? true : false,
            'staff_role' => $staff ? $staff->role : null,
            'username_searched' => $username
        ]);

        if (!$staff) {
            Log::error('HandleBillHandlerAuth: Staff record not found', [
                'user_id' => $user->id,
                'username' => $username,
                'email' => $user->email
            ]);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff record not found',
                    'debug' => [
                        'user_id' => $user->id,
                        'username' => $username,
                        'email' => $user->email
                    ]
                ], 403);
            }
            return redirect('/');
        }

        if ($staff->role !== 'bill handler') {
            Log::warning('HandleBillHandlerAuth: Unauthorized role access attempt', [
                'staff_id' => $staff->id,
                'actual_role' => $staff->role,
                'required_role' => 'bill handler'
            ]);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Invalid role',
                    'debug' => [
                        'staff_id' => $staff->id,
                        'actual_role' => $staff->role,
                        'required_role' => 'bill handler'
                    ]
                ], 403);
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