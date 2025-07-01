<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Customer;
use App\Models\Staff;
use App\Services\BillingCycleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AccountController extends Controller
{
    protected $billingCycleService;

    public function __construct(BillingCycleService $billingCycleService)
    {
        $this->billingCycleService = $billingCycleService;
    }

    public function createStaffAccount(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:staff_tb',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,meter handler,bill handler',
            'address' => 'required|string|max:255',
            'contact_number' => 'required|string|max:20',
            'email' => 'required|email|max:255'
        ]);

        try {
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
                'success' => true,
                'message' => 'Staff account created successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create staff account: ' . $e->getMessage()
            ], 500);
        }
    }

    public function createCustomerAccount(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8',
                'customer_type' => 'required|in:residential,commercial,government',
                'account_number' => 'required|string|unique:customers',
                'address' => 'required|string',
                'contact_number' => 'required|string',
                'meter_number' => 'required|string|unique:customers'
            ]);

            DB::beginTransaction();

            // Create user record
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password)
            ]);

            // Create customer record
            $customer = Customer::create([
                'user_id' => $user->id,
                'customer_type' => $request->customer_type,
                'account_number' => $request->account_number,
                'address' => $request->address,
                'contact_number' => $request->contact_number,
                'meter_number' => $request->meter_number
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Customer account created successfully',
                'data' => [
                    'user' => $user,
                    'customer' => $customer
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Customer account creation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create customer account: ' . $e->getMessage()
            ], 500);
        }
    }

    public function listAccounts(Request $request)
    {
        try {
            $type = $request->query('type', 'all');
            $search = $request->query('search', '');
            $page = (int) $request->query('page', 1);
            $perPage = 10; // Fixed to 10 accounts per page

            Log::info('Fetching accounts', [
                'type' => $type, 
                'search' => $search,
                'page' => $page,
                'per_page' => $perPage,
                'authenticated' => auth()->check(),
                'user' => auth()->user() ? auth()->user()->toArray() : null
            ]);

            if ($type === 'customer') {
                // Query for customer accounts
                $query = DB::table('customers_tb');

                // Add search conditions if search term exists
                if ($search) {
                    $query->where(function($q) use ($search) {
                        $q->where('first_name', 'like', "%{$search}%")
                          ->orWhere('last_name', 'like', "%{$search}%")
                          ->orWhere('full_name', 'like', "%{$search}%")
                          ->orWhere('username', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%")
                          ->orWhere('account_number', 'like', "%{$search}%")
                          ->orWhere('meter_number', 'like', "%{$search}%");
                    });
                }

                // Get total count for pagination
                $totalCount = $query->count();
                
                // Apply pagination
                $offset = ($page - 1) * $perPage;
                $customerAccounts = $query->offset($offset)->limit($perPage)->get();

                Log::info('Customer accounts found', ['count' => $customerAccounts->count(), 'total' => $totalCount]);

                // Format the response
                $formattedAccounts = $customerAccounts->map(function($customer) {
                    return [
                        'id' => $customer->id,
                        'name' => $customer->full_name ?? $customer->name ?? '', // backward compatibility
                        'first_name' => $customer->first_name ?? '',
                        'last_name' => $customer->last_name ?? '',
                        'username' => $customer->username,
                        'email' => $customer->email,
                        'customer_type' => $customer->customer_type,
                        'contact_number' => $customer->phone_number ?? $customer->contact_number ?? '', // Fix: use phone_number
                        'address' => $customer->address,
                        'account_number' => $customer->account_number,
                        'meter_number' => $customer->meter_number,
                        'type' => 'customer'
                    ];
                });

                return response()->json([
                    'success' => true,
                    'data' => [
                        'data' => $formattedAccounts,
                        'total' => $totalCount,
                        'per_page' => $perPage,
                        'current_page' => $page,
                        'last_page' => ceil($totalCount / $perPage),
                        'from' => $offset + 1,
                        'to' => min($offset + $perPage, $totalCount)
                    ]
                ]);
            }

            // For 'all' type, fetch both staff and customer accounts
            if ($type === 'all') {
                // Query for all staff accounts
                $staffQuery = DB::table('staff_tb');
                if ($search) {
                    $staffQuery->where(function($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('username', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%");
                    });
                }
                $staffAccounts = $staffQuery->get();

                // Query for all customer accounts
                $customerQuery = DB::table('customers_tb');
                if ($search) {
                    $customerQuery->where(function($q) use ($search) {
                        $q->where('first_name', 'like', "%{$search}%")
                          ->orWhere('last_name', 'like', "%{$search}%")
                          ->orWhere('full_name', 'like', "%{$search}%")
                          ->orWhere('username', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%")
                          ->orWhere('account_number', 'like', "%{$search}%")
                          ->orWhere('meter_number', 'like', "%{$search}%");
                    });
                }
                $customerAccounts = $customerQuery->get();

                // Format staff accounts
                $formattedStaffAccounts = $staffAccounts->map(function($staff) {
                    return [
                        'id' => $staff->id,
                        'name' => $staff->name,
                        'username' => $staff->username,
                        'email' => $staff->email,
                        'role' => $staff->role,
                        'contact_number' => $staff->contact_number,
                        'address' => $staff->address,
                        'type' => 'staff'
                    ];
                });

                // Format customer accounts
                $formattedCustomerAccounts = $customerAccounts->map(function($customer) {
                    return [
                        'id' => $customer->id,
                        'name' => $customer->full_name ?? $customer->name ?? '', // backward compatibility
                        'first_name' => $customer->first_name ?? '',
                        'last_name' => $customer->last_name ?? '',
                        'username' => $customer->username,
                        'email' => $customer->email,
                        'customer_type' => $customer->customer_type,
                        'contact_number' => $customer->phone_number ?? $customer->contact_number ?? '', // Fix: use phone_number
                        'address' => $customer->address,
                        'account_number' => $customer->account_number,
                        'meter_number' => $customer->meter_number,
                        'type' => 'customer'
                    ];
                });

                // Merge both collections
                $allAccounts = $formattedStaffAccounts->concat($formattedCustomerAccounts);
                
                // Apply pagination to the merged collection
                $totalCount = $allAccounts->count();
                $offset = ($page - 1) * $perPage;
                $paginatedAccounts = $allAccounts->slice($offset, $perPage)->values();

                return response()->json([
                    'success' => true,
                    'data' => [
                        'data' => $paginatedAccounts,
                        'total' => $totalCount,
                        'per_page' => $perPage,
                        'current_page' => $page,
                        'last_page' => ceil($totalCount / $perPage),
                        'from' => $offset + 1,
                        'to' => min($offset + $perPage, $totalCount)
                    ]
                ]);
            }

            // Query for staff accounts only
            $query = DB::table('staff_tb');

            // Add search conditions if search term exists
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('username', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Filter by role if not 'all'
            if ($type !== 'all') {
                $query->where('role', $type);
            }

            // Get total count for pagination
            $totalCount = $query->count();
            
            // Apply pagination
            $offset = ($page - 1) * $perPage;
            $staffAccounts = $query->offset($offset)->limit($perPage)->get();

            Log::info('Staff accounts found', ['count' => $staffAccounts->count(), 'total' => $totalCount]);

            // Format the response
            $formattedAccounts = $staffAccounts->map(function($staff) {
                return [
                    'id' => $staff->id,
                    'name' => $staff->name,
                    'username' => $staff->username,
                    'email' => $staff->email,
                    'role' => $staff->role,
                    'contact_number' => $staff->contact_number,
                    'address' => $staff->address,
                    'type' => 'staff'
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $formattedAccounts,
                    'total' => $totalCount,
                    'per_page' => $perPage,
                    'current_page' => $page,
                    'last_page' => ceil($totalCount / $perPage),
                    'from' => $offset + 1,
                    'to' => min($offset + $perPage, $totalCount)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Account listing failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to list accounts: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteStaff($id)
    {
        try {
            $staff = DB::table('staff_tb')->where('id', $id)->first();
            
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff account not found'
                ], 404);
            }

            DB::table('staff_tb')->where('id', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Staff account deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Staff deletion failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete staff account: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateStaff(Request $request, $id)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'username' => 'required|string|max:255|unique:staff_tb,username,' . $id,
                'role' => 'required|in:admin,meter handler,bill handler',
                'address' => 'required|string|max:255',
                'contact_number' => 'required|string|max:20',
                'email' => 'required|email|max:255'
            ]);

            $staff = DB::table('staff_tb')->where('id', $id)->first();
            
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff account not found'
                ], 404);
            }

            DB::table('staff_tb')->where('id', $id)->update([
                'name' => $request->name,
                'username' => $request->username,
                'role' => $request->role,
                'address' => $request->address,
                'contact_number' => $request->contact_number,
                'email' => $request->email,
                'updated_at' => now()
            ]);

            // If password is provided, update it
            if ($request->filled('password')) {
                DB::table('staff_tb')->where('id', $id)->update([
                    'password' => Hash::make($request->password)
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Staff account updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Staff update failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update staff account: ' . $e->getMessage()
            ], 500);
        }
    }

    public function createCustomer(Request $request)
    {
        try {
            $validated = $request->validate([
                'first_name' => 'required|string|max:50',
                'last_name' => 'required|string|max:50',
                'username' => 'required|string|max:50|unique:customers_tb,username',
                'email' => 'required|email|max:100|unique:customers_tb,email',
                'password' => 'required|min:8|max:255',
                'customer_type' => 'required|in:residential,commercial,government|max:20',
                'account_number' => 'required|string|max:9|unique:customers_tb,account_number',
                'meter_number' => 'required|string|max:20|unique:customers_tb,meter_number',
                'contact_number' => 'required|string|max:15',
                'address' => 'required|string'
            ]);

            // Hash the password
            $validated['password'] = bcrypt($validated['password']);

            // Generate full_name from first_name and last_name
            $full_name = trim($validated['first_name'] . ' ' . $validated['last_name']);

            // Insert into customers_tb
            $customerId = DB::table('customers_tb')->insertGetId([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'full_name' => $full_name,
                'username' => $validated['username'],
                'password' => $validated['password'],
                'customer_type' => $validated['customer_type'],
                'address' => $validated['address'],
                'phone_number' => $validated['contact_number'],
                'email' => $validated['email'],
                'account_number' => $validated['account_number'],
                'meter_number' => $validated['meter_number'],
                'created_at' => now(),
                'updated_at' => now()
            ]);

            Log::info('New customer created', ['customer_id' => $customerId]);

            // Automatically sync billing cycle for the new customer
            try {
                $this->billingCycleService->syncBillingCycleForNewCustomer($customerId);
                Log::info('Billing cycle synced for new customer', ['customer_id' => $customerId]);
            } catch (\Exception $e) {
                Log::error('Failed to sync billing cycle for new customer ' . $customerId . ': ' . $e->getMessage());
                // Don't fail the customer creation if billing cycle sync fails
            }

            return response()->json([
                'success' => true,
                'message' => 'Customer created successfully',
                'data' => ['id' => $customerId]
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating customer: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create customer: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateCustomer(Request $request, $id)
    {
        try {
            $request->validate([
                'first_name' => 'required|string|max:50',
                'last_name' => 'required|string|max:50',
                'username' => 'required|string|max:255|unique:customers_tb,username,' . $id,
                'customer_type' => 'required|in:residential,commercial,government',
                'address' => 'required|string|max:255',
                'contact_number' => 'required|string|max:20',
                'email' => 'required|email|max:255|unique:customers_tb,email,' . $id,
                'account_number' => 'required|string|max:20|unique:customers_tb,account_number,' . $id,
                'meter_number' => 'required|string|max:20|unique:customers_tb,meter_number,' . $id
            ]);

            $customer = DB::table('customers_tb')->where('id', $id)->first();
            
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer account not found'
                ], 404);
            }

            // Generate full_name from first_name and last_name
            $full_name = trim($request->first_name . ' ' . $request->last_name);

            DB::table('customers_tb')->where('id', $id)->update([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'full_name' => $full_name,
                'username' => $request->username,
                'customer_type' => $request->customer_type,
                'address' => $request->address,
                'phone_number' => $request->contact_number, // Fix: use phone_number column
                'email' => $request->email,
                'account_number' => $request->account_number,
                'meter_number' => $request->meter_number,
                'updated_at' => now()
            ]);

            // If password is provided, update it
            if ($request->filled('password')) {
                DB::table('customers_tb')->where('id', $id)->update([
                    'password' => Hash::make($request->password)
                ]);
            }

            // Automatically update billing cycles for the customer
            try {
                $this->billingCycleService->updateBillingCyclesForCustomer($id);
                Log::info('Billing cycles updated for customer', ['customer_id' => $id]);
            } catch (\Exception $e) {
                Log::error('Failed to update billing cycles for customer ' . $id . ': ' . $e->getMessage());
                // Don't fail the customer update if billing cycle sync fails
            }

            return response()->json([
                'success' => true,
                'message' => 'Customer account updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Customer update failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update customer account: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteCustomer($id)
    {
        try {
            $customer = DB::table('customers_tb')->where('id', $id)->first();
            
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer account not found'
                ], 404);
            }

            // Automatically delete billing cycles for the customer
            try {
                $this->billingCycleService->deleteBillingCyclesForCustomer($id);
                Log::info('Billing cycles deleted for customer', ['customer_id' => $id]);
            } catch (\Exception $e) {
                Log::error('Failed to delete billing cycles for customer ' . $id . ': ' . $e->getMessage());
                // Don't fail the customer deletion if billing cycle deletion fails
            }

            DB::table('customers_tb')->where('id', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Customer account deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Customer deletion failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete customer account: ' . $e->getMessage()
            ], 500);
        }
    }
} 