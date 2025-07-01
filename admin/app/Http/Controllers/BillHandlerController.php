<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class BillHandlerController extends Controller
{
    public function BillHandlerDashboard()
    {
        try {
            $user = Auth::user();
            
            // Debug log
            Log::info('Auth user:', ['user' => $user]);

            $staff = DB::table('staff_tb')
                ->where('username', $user->name)
                ->first();

            // Debug log
            Log::info('Staff data:', ['staff' => $staff]);

            if (!$staff) {
                Log::error('Staff not found for user: ' . $user->name);
                return response()->json([
                    'success' => false,
                    'message' => 'Staff record not found'
                ], 404);
            }

            if ($staff->role !== 'bill handler') {
                Log::error('Unauthorized role access attempt: ' . $staff->role);
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            // Return only staff information
            return response()->json([
                'success' => true,
                'data' => [
                    'staff' => [
                        'name' => $staff->name,
                        'email' => $staff->email,
                        'role' => $staff->role
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Bill handler dashboard error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getCustomers()
    {
        try {
            $customers = DB::table('customers_tb')
                ->select('id', 'name', 'account_number', 'customer_type', 'email', 'contact_number')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $customers
            ]);

        } catch (\Exception $e) {
            Log::error('Get customers error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching customers'
            ], 500);
        }
    }

    public function getProfile()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                Log::error('User not authenticated in getProfile');
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            Log::info('Getting profile for user:', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email
            ]);

            // Try to find staff by username first (most likely match)
            $staff = DB::table('staff_tb')
                ->where('username', $user->name)
                ->first();

            Log::info('Staff lookup by username result:', [
                'searching_for' => $user->name,
                'found' => $staff ? true : false,
                'staff_data' => $staff
            ]);

            // If not found by username, try by email
            if (!$staff) {
                $staff = DB::table('staff_tb')
                    ->where('email', $user->email)
                    ->first();
                
                Log::info('Staff lookup by email result:', [
                    'searching_for' => $user->email,
                    'found' => $staff ? true : false,
                    'staff_data' => $staff
                ]);
            }

            // If still not found, try by name (full name)
            if (!$staff) {
                $staff = DB::table('staff_tb')
                    ->where('name', $user->name)
                    ->first();
                
                Log::info('Staff lookup by name result:', [
                    'searching_for' => $user->name,
                    'found' => $staff ? true : false,
                    'staff_data' => $staff
                ]);
            }

            if (!$staff) {
                Log::error('Staff record not found for user: ' . $user->name . ' (email: ' . $user->email . ')');
                return response()->json([
                    'success' => false,
                    'message' => 'Staff record not found'
                ], 404);
            }

            Log::info('Staff record found successfully:', [
                'staff_id' => $staff->id,
                'staff_name' => $staff->name,
                'staff_role' => $staff->role
            ]);

            // Handle profile picture - if it exists, make sure it's a URL
            $profilePicture = null;
            if ($staff->profile_picture) {
                if (str_starts_with($staff->profile_picture, 'http')) {
                    // If it's already a URL, use it as is
                    $profilePicture = $staff->profile_picture;
                } else {
                    // If it's a path, convert it to a URL
                    $profilePicture = url('storage/' . ltrim($staff->profile_picture, '/'));
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'staff_id' => $staff->id,
                    'name' => $staff->name,
                    'address' => $staff->address ?? '',
                    'contact' => $staff->contact_number ?? '',
                    'email' => $staff->email ?? '',
                    'role' => $staff->role,
                    'profile_picture' => $profilePicture
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get profile error: ' . $e->getMessage());
            Log::error('Get profile error trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching profile: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Try to find staff by username first (most likely match)
            $staff = DB::table('staff_tb')
                ->where('username', $user->name)
                ->first();

            // If not found by username, try by email
            if (!$staff) {
                $staff = DB::table('staff_tb')
                    ->where('email', $user->email)
                    ->first();
            }

            // If still not found, try by name (full name)
            if (!$staff) {
                $staff = DB::table('staff_tb')
                    ->where('name', $user->name)
                    ->first();
            }

            if (!$staff) {
                Log::error('Staff record not found for user: ' . $user->name . ' (email: ' . $user->email . ')');
                return response()->json([
                    'success' => false,
                    'message' => 'Staff record not found'
                ], 404);
            }

            // Validate request
            $request->validate([
                'name' => 'required|string|max:255',
                'address' => 'nullable|string|max:500',
                'contact' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
            ]);

            $updateData = [
                'name' => $request->name,
                'address' => $request->address,
                'contact_number' => $request->contact,
                'email' => $request->email,
            ];

            // Handle profile picture upload
            if ($request->hasFile('profile_picture')) {
                $file = $request->file('profile_picture');
                
                // Validate file
                $request->validate([
                    'profile_picture' => 'image|mimes:jpeg,png,jpg,gif|max:2048'
                ]);

                // Store the file
                $fileName = time() . '_' . $file->getClientOriginalName();
                $file->storeAs('public/profile_pictures', $fileName);
                
                $updateData['profile_picture'] = '/storage/profile_pictures/' . $fileName;
            }

            // Update staff record
            DB::table('staff_tb')
                ->where('id', $staff->id)
                ->update($updateData);

            // Get updated staff data
            $updatedStaff = DB::table('staff_tb')
                ->where('id', $staff->id)
                ->first();

            // Handle profile picture - if it exists, make sure it's a URL
            $profilePicture = null;
            if ($updatedStaff->profile_picture) {
                if (str_starts_with($updatedStaff->profile_picture, 'http')) {
                    // If it's already a URL, use it as is
                    $profilePicture = $updatedStaff->profile_picture;
                } else {
                    // If it's a path, convert it to a URL
                    $profilePicture = url('storage/' . ltrim($updatedStaff->profile_picture, '/'));
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'staff_id' => $updatedStaff->id,
                    'name' => $updatedStaff->name,
                    'address' => $updatedStaff->address ?? '',
                    'contact' => $updatedStaff->contact_number ?? '',
                    'email' => $updatedStaff->email ?? '',
                    'role' => $updatedStaff->role,
                    'profile_picture' => $profilePicture
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Update profile error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating profile: ' . $e->getMessage()
            ], 500);
        }
    }
} 