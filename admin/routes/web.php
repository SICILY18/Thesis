<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\TicketController;
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Public routes
Route::get('/', function () {
    return Inertia::render('AdminLogin');
});

// CSRF route for Sanctum
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json([
        'csrf_token' => csrf_token()
    ]);
});

Route::post('/api/admin-login', [AdminAuthController::class, 'login'])->middleware('web');

// Protected admin routes
Route::middleware(['web', 'admin.auth'])->prefix('admin')->group(function () {
    Route::post('/logout', [AdminAuthController::class, 'logout'])->name('admin.logout');
    
    Route::get('/dashboard', function () {
        return Inertia::render('AdminDashboard');
    })->name('admin.dashboard');

    // Tickets routes
    Route::get('/tickets', function () {
        return Inertia::render('Tickets');
    })->name('admin.tickets');
    
    Route::prefix('tickets')->group(function () {
        Route::get('/data', [TicketController::class, 'index']);
        Route::post('/{id}/remarks', [TicketController::class, 'addRemarks']);
        Route::put('/{id}', [TicketController::class, 'update']);
    });

    // Dispute routes
    Route::get('/dispute', function () {
        return Inertia::render('Dispute');
    })->name('admin.dispute');

    Route::get('/profile', function () {
        return Inertia::render('Profile', [
            'auth' => [
                'user' => request()->user(),
            ],
        ]);
    })->name('admin.profile');

    Route::get('/accounts', function () {
        return Inertia::render('Accounts');
    })->name('admin.accounts');

    Route::get('/announcement', function () {
        return Inertia::render('Announcement');
    })->name('admin.announcement');

    Route::get('/reports', function () {
        return Inertia::render('Reports');
    })->name('admin.reports');

    Route::get('/payment', function () {
        return Inertia::render('Payment');
    })->name('admin.payment');

    Route::get('/rate-management', function () {
        return Inertia::render('RateManagement');
    })->name('admin.rateManagement');
});

// Protected bill handler routes
Route::middleware(['web', 'admin.auth'])->prefix('bill-handler')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('BillHandlerDashboard');
    })->name('bill-handler.dashboard');

    Route::get('/profile', function () {
        return Inertia::render('Profile', [
            'auth' => [
                'user' => request()->user(),
            ],
        ]);
    })->name('bill-handler.profile');

    Route::get('/billing', function () {
        return Inertia::render('BillHandlerBilling');
    })->name('bill-handler.billing');

    Route::get('/customers', function () {
        return Inertia::render('BillHandlerCustomers');
    })->name('bill-handler.customers');
});

// Temporary test route without middleware
Route::get('/test', function () {
    return Inertia::render('AdminDashboard');
});

// Test announcement without middleware
Route::get('/test-announcement', function () {
    return Inertia::render('Announcement');
});

// Route to view recent logs
Route::get('/view-logs', function () {
    $logFile = storage_path('logs/laravel.log');
    if (file_exists($logFile)) {
        $logs = file_get_contents($logFile);
        $recentLogs = implode("\n", array_slice(explode("\n", $logs), -50));
        return response('<pre>' . htmlspecialchars($recentLogs) . '</pre>');
    }
    return 'No log file found';
});

// Test login route
Route::post('/test-login', function () {
    // Create a test user and log them in
    $user = \App\Models\User::firstOrCreate(
        ['email' => 'test@staff.com'],
        ['name' => 'Test User', 'password' => bcrypt('password')]
    );
    
    auth()->login($user);
    
    return response()->json([
        'success' => true,
        'user' => $user,
        'authenticated' => auth()->check()
    ]);
});

// Debug route to check authentication
Route::get('/debug-auth', function () {
    $staff = null;
    if (auth()->check()) {
        $user = auth()->user();
        $staff = DB::table('staff_tb')
            ->where('username', str_replace('@staff.com', '', $user->email))
            ->first();
    }
    
    return response()->json([
        'authenticated' => auth()->check(),
        'user' => auth()->user(),
        'staff' => $staff,
        'session_id' => session()->getId(),
        'session_data' => session()->all(),
        'guards' => [
            'web' => auth()->guard('web')->check(),
            'default' => auth()->check()
        ]
    ]);
});

// Test database connectivity and tables
Route::get('/debug-db', function () {
    try {
        $connection = DB::connection()->getPdo();
        
        // Test different tables
        $tables = [];
        $tableTests = [
            'announcements_tb',
            'staff_tb', 
            'customers_tb',
            'users',
            'admin'
        ];
        
        foreach ($tableTests as $table) {
            try {
                $count = DB::table($table)->count();
                $tables[$table] = ['exists' => true, 'count' => $count];
            } catch (\Exception $e) {
                $tables[$table] = ['exists' => false, 'error' => $e->getMessage()];
            }
        }
        
        return response()->json([
            'database_connected' => true,
            'pdo' => get_class($connection),
            'tables' => $tables
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'database_connected' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

// Simple public test for meter readings (no auth required)
Route::get('/public-test-meter', function () {
    try {
        // Test basic database connection
        $dbTest = DB::select('SELECT 1 as test');
        
        // Test if meter_readings table exists
        $tableExists = DB::select("SELECT table_name FROM information_schema.tables WHERE table_name = 'meter_readings'");
        
        // Try to count records
        $count = DB::table('meter_readings')->count();
        
        // Get first record if any
        $firstRecord = DB::table('meter_readings')->first();
        
        return response()->json([
            'success' => true,
            'database_connection' => !empty($dbTest),
            'table_exists' => !empty($tableExists),
            'record_count' => $count,
            'first_record' => $firstRecord,
            'message' => 'Database tests completed'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => $e->getFile()
        ], 500);
    }
});

// Test meter readings API directly
Route::get('/test-meter-readings', function () {
    try {
        $meterReadings = DB::table('meter_readings')
            ->select([
                'id',
                'meter_number',
                'reading_value',
                'amount',
                'remarks',
                'reading_date',
                'created_at',
                'staff_id'
            ])
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $meterReadings,
            'count' => $meterReadings->count(),
            'message' => 'Simple meter readings query successful'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => $e->getFile()
        ], 500);
    }
});

// Test announcements API directly
Route::get('/test-announcements', function () {
    try {
        $announcements = DB::table('announcements_tb')
            ->select([
                'id',
                'title',
                'body',
                'status',
                'staff_id',
                'posted_by',
                'published_at',
                'expired_at',
                'created_at',
                'updated_at'
            ])
            ->where('status', 'active')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'count' => $announcements->count(),
            'data' => $announcements
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

// Test accounts API directly
Route::get('/test-accounts', function () {
    try {
        $staffAccounts = DB::table('staff_tb')->get();
        $customerAccounts = DB::table('customers_tb')->get();
        
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

        $formattedCustomerAccounts = $customerAccounts->map(function($customer) {
            return [
                'id' => $customer->id,
                'name' => $customer->name,
                'username' => $customer->username ?? null,
                'email' => $customer->email,
                'customer_type' => $customer->customer_type,
                'contact_number' => $customer->contact_number,
                'address' => $customer->address,
                'account_number' => $customer->account_number,
                'meter_number' => $customer->meter_number,
                'type' => 'customer'
            ];
        });

        $allAccounts = $formattedStaffAccounts->concat($formattedCustomerAccounts);

        return response()->json([
            'success' => true,
            'staff_count' => $staffAccounts->count(),
            'customer_count' => $customerAccounts->count(),
            'total_count' => $allAccounts->count(),
            'data' => $allAccounts
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

// Test customer creation
Route::post('/test-create-customer', function () {
    try {
        $testData = [
            'name' => 'Test Customer',
            'email' => 'test@example.com',
            'password' => 'test123!',
            'customer_type' => 'residential',
            'account_number' => '99-999999',
            'meter_number' => '999999999',
            'contact_number' => '09123456789',
            'address' => 'Test Address 123'
        ];

        $username = explode('@', $testData['email'])[0];
        $username = substr($username, 0, 50);

        $customer = DB::table('customers_tb')->insertGetId([
            'name' => $testData['name'],
            'username' => $username,
            'password' => bcrypt($testData['password']),
            'customer_type' => $testData['customer_type'],
            'address' => $testData['address'],
            'contact_number' => $testData['contact_number'],
            'email' => $testData['email'],
            'account_number' => $testData['account_number'],
            'meter_number' => $testData['meter_number'],
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Test customer created successfully',
            'customer_id' => $customer,
            'data' => $testData
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

Route::middleware(['auth'])->group(function () {
    // Tickets
    Route::get('/api/tickets', [TicketController::class, 'index']);
    Route::post('/api/tickets/{id}/remarks', [TicketController::class, 'addRemarks']);
    Route::put('/api/tickets/{id}', [TicketController::class, 'update']);
});

require __DIR__.'/auth.php';
