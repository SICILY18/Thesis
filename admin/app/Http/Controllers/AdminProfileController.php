<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class AdminProfileController extends Controller
{
    /**
     * Decode binary profile picture data from Supabase
     */
    private function decodeProfilePicture($data)
    {
        if (!$data) {
            return null;
        }

        // If it's already a string, return it
        if (is_string($data)) {
            return $data;
        }

        // If it's a resource, try to read it
        if (is_resource($data)) {
            $contents = stream_get_contents($data);
            if ($contents !== false) {
                return $contents;
            }
        }

        // If it's an object with buffer data (from Supabase)
        if (is_object($data) && isset($data->data) && is_array($data->data)) {
            return implode('', array_map('chr', $data->data));
        }

        // If it's a string representation of buffer data
        if (is_string($data) && strpos($data, '{"type":"Buffer"') === 0) {
            $decoded = json_decode($data, true);
            if (isset($decoded['data']) && is_array($decoded['data'])) {
                return implode('', array_map('chr', $decoded['data']));
            }
        }

        return null;
    }

    private function getProfilePictureUrl($path)
    {
        if (!$path) {
            return null;
        }

        // If it's already a full URL, return it
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        // If it's a path, convert it to a full URL
        return url('storage/' . $path);
    }

    public function show()
    {
        try {
            $authUser = Auth::user();
            if (!$authUser) {
                \Log::warning('Profile show: No authenticated user');
                return response()->json(['success' => false, 'message' => 'Not authenticated'], 401);
            }

            \Log::info('Profile show: Fetching profile for user', [
                'user_id' => $authUser->id,
                'user_name' => $authUser->name,
                'user_email' => $authUser->email
            ]);

            // Find staff record by matching user name or email
            $staff = DB::table('staff_tb')
                ->where('name', $authUser->name)
                ->orWhere('email', str_replace('@staff.com', '', $authUser->email))
                ->first();

            if (!$staff) {
                // Fallback: try to find by email without @staff.com suffix
                $username = str_replace('@staff.com', '', $authUser->email);
                $staff = DB::table('staff_tb')
                    ->where('username', $username)
                    ->first();
            }

            if (!$staff) {
                \Log::warning('Profile show: Staff record not found', [
                    'user_id' => $authUser->id,
                    'user_name' => $authUser->name,
                    'user_email' => $authUser->email
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Staff record not found'
                ], 404);
            }

            // Build profile picture URL if exists
            $profilePictureUrl = null;
            if (isset($staff->profile_picture) && $staff->profile_picture) {
                try {
                    // If it's already a path (from new upload format)
                    if (is_string($staff->profile_picture) && !str_contains($staff->profile_picture, '{')) {
                        $profilePictureUrl = $this->getProfilePictureUrl($staff->profile_picture);
                    } else {
                        // Try to decode old format
                        $decodedPicture = $this->decodeProfilePicture($staff->profile_picture);
                        if ($decodedPicture) {
                            $profilePictureUrl = $this->getProfilePictureUrl($decodedPicture);
                        }
                    }

                    // Verify file exists
                    $filePath = str_replace(url('storage/'), '', $profilePictureUrl);
                    $fullPath = storage_path('app/public/' . $filePath);
                    if (!file_exists($fullPath)) {
                        \Log::warning('Profile picture file not found', [
                            'staff_id' => $staff->id,
                            'file_path' => $filePath,
                            'full_path' => $fullPath
                        ]);
                        $profilePictureUrl = null;
                    }
                } catch (\Exception $e) {
                    \Log::warning('Profile show: Failed to decode profile picture', [
                        'error' => $e->getMessage(),
                        'staff_id' => $staff->id,
                        'profile_picture_raw' => $staff->profile_picture,
                        'profile_picture_type' => gettype($staff->profile_picture)
                    ]);
                    $profilePictureUrl = null;
                }
            }

            \Log::info('Profile show: Returning profile data', [
                'staff_id' => $staff->id,
                'profile_picture_url' => $profilePictureUrl,
                'profile_picture_raw' => $staff->profile_picture
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'admin_id' => $staff->id,
                    'name' => $staff->name,
                    'address' => $staff->address ?? '',
                    'contact' => $staff->contact_number ?? '',
                    'email' => $staff->email ?? '',
                    'role' => $staff->role,
                    'profile_picture' => $profilePictureUrl
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Profile show error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'user_name' => Auth::user() ? Auth::user()->name : null,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to load profile',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function update(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'address' => 'nullable|string|max:255',
                'contact' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'profile_picture' => 'nullable|image|mimes:jpeg,png,gif|max:2048'
            ]);

            $authUser = Auth::user();
            if (!$authUser) {
                return response()->json(['success' => false, 'message' => 'Not authenticated'], 401);
            }

            // Find staff record
            $staff = DB::table('staff_tb')
                ->where('name', $authUser->name)
                ->orWhere('email', str_replace('@staff.com', '', $authUser->email))
                ->first();

            if (!$staff) {
                // Fallback: try to find by email without @staff.com suffix
                $username = str_replace('@staff.com', '', $authUser->email);
                $staff = DB::table('staff_tb')
                    ->where('username', $username)
                    ->first();
            }

            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff record not found'
                ], 404);
            }

            $updateData = [
                'name' => $request->name,
                'address' => $request->address,
                'contact_number' => $request->contact,
                'email' => $request->email,
                'updated_at' => now()
            ];

            // Handle profile picture upload
            if ($request->hasFile('profile_picture')) {
                try {
                    $file = $request->file('profile_picture');
                    
                    // Ensure the storage directory exists
                    $storage_path = storage_path('app/public/profile-pictures');
                    if (!file_exists($storage_path)) {
                        mkdir($storage_path, 0755, true);
                    }

                    // Delete old profile picture if exists
                    if (isset($staff->profile_picture) && $staff->profile_picture) {
                        $oldPicture = $this->decodeProfilePicture($staff->profile_picture);
                        if ($oldPicture) {
                            $old_path = storage_path('app/public/' . $oldPicture);
                            if (file_exists($old_path)) {
                                @unlink($old_path);
                            }
                        }
                    }

                    // Generate unique filename
                    $filename = 'profile_' . $staff->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                    
                    // Store new profile picture
                    $path = $file->storeAs('profile-pictures', $filename, 'public');
                    if (!$path) {
                        throw new \Exception('Failed to store profile picture');
                    }
                    $updateData['profile_picture'] = $path;
                    
                } catch (\Exception $e) {
                    \Log::error('Profile picture upload failed: ' . $e->getMessage(), [
                        'staff_id' => $staff->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload profile picture: ' . $e->getMessage()
                    ], 500);
                }
            }

            // Update the database
            $updated = DB::table('staff_tb')
                ->where('id', $staff->id)
                ->update($updateData);

            if (!$updated && !empty($updateData)) {
                throw new \Exception('Failed to update database record');
            }

            // Update Auth user name to match new username
            try {
                $authUser->update(['name' => $request->name]);
            } catch (\Exception $e) {
                \Log::warning('Failed to update auth user name: ' . $e->getMessage());
            }

            // Get updated staff record
            $updatedStaff = DB::table('staff_tb')
                ->where('id', $staff->id)
                ->first();
            
            // Build profile picture URL
            $profilePictureUrl = null;
            if (isset($updateData['profile_picture'])) {
                $profilePictureUrl = $this->getProfilePictureUrl($updateData['profile_picture']);
            } elseif (isset($updatedStaff->profile_picture) && $updatedStaff->profile_picture) {
                $decodedPicture = $this->decodeProfilePicture($updatedStaff->profile_picture);
                if ($decodedPicture) {
                    $profilePictureUrl = $this->getProfilePictureUrl($decodedPicture);
                }
            }
            
            // Log the profile picture value for debugging
            \Log::info('Profile picture after update', [
                'staff_id' => $staff->id,
                'profile_picture_raw' => $updatedStaff->profile_picture ?? 'null',
                'profile_picture_decoded' => $profilePictureUrl ?? 'null',
                'profile_picture_type' => isset($updatedStaff->profile_picture) ? gettype($updatedStaff->profile_picture) : 'null',
                'update_data_picture' => $updateData['profile_picture'] ?? 'not set'
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'profile_picture' => $profilePictureUrl,
                'data' => [
                    'admin_id' => $updatedStaff->id,
                    'name' => $updatedStaff->name,
                    'address' => $updatedStaff->address,
                    'contact_number' => $updatedStaff->contact_number,
                    'email' => $updatedStaff->email,
                    'role' => $updatedStaff->role
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Profile update failed: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'request_data' => $request->except(['profile_picture'])
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile: ' . $e->getMessage()
            ], 500);
        }
    }
}