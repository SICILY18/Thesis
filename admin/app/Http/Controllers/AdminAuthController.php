<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AdminAuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            Log::info('Login attempt', [
                'username' => $request->username,
                'session_id' => $request->session()->getId(),
                'request_headers' => $request->headers->all()
            ]);

            $request->validate([
                'username' => 'required|string',
                'password' => 'required|string'
            ]);

            // Find staff member
            $staff = DB::table('staff_tb')
                ->where('username', $request->username)
                ->first();

            Log::info('Staff lookup', [
                'username' => $request->username,
                'staff_found' => $staff ? true : false,
                'staff_role' => $staff ? $staff->role : null
            ]);

            if (!$staff) {
                Log::warning('Staff not found', ['username' => $request->username]);
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);
            }

            if (!Hash::check($request->password, $staff->password)) {
                Log::warning('Invalid password', ['username' => $request->username]);
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Check if user has allowed role
            if (!in_array($staff->role, ['admin', 'bill handler'])) {
                Log::warning('Unauthorized role', [
                    'username' => $request->username,
                    'role' => $staff->role
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access this system'
                ], 403);
            }

            // Create or update user in users table
            $user = User::updateOrCreate(
                ['email' => $request->username . '@staff.com'],
                [
                    'name' => $staff->name ?? $request->username,
                    'password' => $staff->password // Use the already hashed password
                ]
            );

            Log::info('User created/found', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'staff_role' => $staff->role
            ]);

            // Log the user in using web guard
            Auth::guard('web')->login($user, true); // Remember user

            // Regenerate the session
            $request->session()->regenerate();

            // Generate a new CSRF token
            $token = $request->session()->token();
            
            // Set the XSRF-TOKEN cookie
            $cookie = cookie('XSRF-TOKEN', $token, 60 * 24, null, null, false, true);

            Log::info('Login successful', [
                'user_id' => $user->id,
                'session_id' => $request->session()->getId(),
                'auth_check' => Auth::guard('web')->check(),
                'csrf_token_set' => !empty($token)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Login successful!',
                'user' => [
                    'id' => $user->id,
                    'name' => $staff->name,
                    'username' => $staff->username,
                    'role' => $staff->role,
                    'email' => $staff->email
                ]
            ])->withCookie($cookie);

        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during login.'
            ], 500);
        }
    }

    public function checkAuth()
    {
        if (Auth::guard('web')->check()) {
            $user = Auth::guard('web')->user();
            return response()->json([
                'authenticated' => true,
                'user' => $user
            ]);
        }
        return response()->json(['authenticated' => false], 401);
    }

    public function logout(Request $request)
    {
        try {
            // Get session ID before logout
            $sessionId = $request->session()->getId();
            
            // Logout the user
            Auth::guard('web')->logout();
            
            // Clear session data
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            // Clear all cookies
            $cookies = $request->cookies;
            $clearCookies = [];
            foreach ($cookies->keys() as $cookieName) {
                $clearCookies[] = cookie($cookieName, '', -1);
            }
            
            $response = response()->json([
                'success' => true,
                'message' => 'Logged out successfully'
            ]);
            
            // Attach all cookie clearing to response
            foreach ($clearCookies as $cookie) {
                $response->withCookie($cookie);
            }
            
            return $response;
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed'
            ], 500);
        }
    }

    public function createStaff(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:staff_tb',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,bill handler,meter handler',
            'address' => 'required|string|max:255',
            'contact_number' => 'required|string|max:20',
            'email' => 'required|email|max:255'
        ]);

        $staff = DB::table('staff_tb')->insert([
            'name' => $request->name,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'address' => $request->address,
            'contact_number' => $request->contact_number,
            'email' => $request->email,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'message' => 'Staff account created successfully',
            'staff' => $staff
        ], 201);
    }
}

