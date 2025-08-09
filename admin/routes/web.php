<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\MeterReadingController;
use App\Http\Controllers\CustomerController;
use Illuminate\Support\Facades\Auth;
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
    // Check if there's a force_login parameter to bypass auth check
    if (request()->has('force_login')) {
        Auth::logout();
        session()->invalidate();
        session()->regenerateToken();
        return Inertia::render('AdminLogin');
    }
    
    // Only redirect if user is actually authenticated AND has valid session
    if (Auth::check() && Auth::user()) {
        return redirect('/admin/dashboard');
    }
    return Inertia::render('AdminLogin');
});

// Add a logout route that can be accessed directly to clear sessions
Route::get('/logout', function () {
    Auth::logout();
    session()->invalidate();
    session()->regenerateToken();
    
    // Force redirect to our admin login page
    return Inertia::render('AdminLogin');
});

// Simple session clear route
Route::get('/clear-session', function () {
    Auth::logout();
    session()->flush();
    session()->invalidate();
    session()->regenerateToken();
    
    return response()->json([
        'message' => 'Session cleared successfully',
        'redirect' => '/'
    ]);
});

// Authentication check route
Route::get('/check-auth', function () {
    return response()->json([
        'authenticated' => auth()->check(),
        'user' => auth()->user()
    ]);
});

Route::post('/admin-login', [AdminAuthController::class, 'login']);

Route::post('/admin-logout', [AdminAuthController::class, 'logout']);

// CSRF route for Sanctum
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['csrf_token' => csrf_token()]);
});

// Protected admin routes
Route::middleware(['web', 'admin.auth'])->prefix('admin')->group(function () {
    Route::post('/logout', [AdminAuthController::class, 'logout'])->name('admin.logout');
    
    Route::get('/dashboard', function () {
        return Inertia::render('AdminDashboard', ['title' => 'Dashboard']);
    })->name('admin.dashboard');

    // Tickets routes
    Route::get('/tickets', function () {
        return Inertia::render('Tickets', ['title' => 'Tickets']);
    })->name('admin.tickets');
    
    Route::prefix('tickets')->group(function () {
        Route::get('/data', [TicketController::class, 'index']);
        Route::post('/{id}/remarks', [TicketController::class, 'addRemarks']);
        Route::put('/{ticketId}', [TicketController::class, 'update']);
        
        // Temporary test route without authentication
        Route::put('/test/{ticketId}', [TicketController::class, 'update'])->withoutMiddleware(['admin.auth']);
    });

    // Dispute routes
    Route::get('/dispute', function () {
        return Inertia::render('Dispute', ['title' => 'Dispute']);
    })->name('admin.dispute');

    // Meter Readings routes
    Route::middleware(['web'])->group(function () {
        Route::prefix('meter-readings')->group(function () {
            Route::get('/', [MeterReadingController::class, 'index']);
            Route::post('/', [MeterReadingController::class, 'store']);
            Route::get('/{id}', [MeterReadingController::class, 'show']);
            Route::put('/{id}', [MeterReadingController::class, 'update']);
            Route::delete('/{id}', [MeterReadingController::class, 'destroy']);
        });
    });

    // Profile routes
    Route::get('/profile', function () {
        return Inertia::render('Profile', [
            'auth' => [
                'user' => request()->user(),
            ],
            'title' => 'Profile'
        ]);
    })->name('admin.profile');

    Route::get('/profile/data', function () {
        $user = request()->user();
        $staff = DB::table('staff_tb')
            ->where('username', explode('@', $user->email)[0])
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'admin_id' => $staff->id ?? '',
                'name' => $staff->name ?? $user->name,
                'email' => $user->email,
                'role' => $staff->role ?? '',
                'address' => $staff->address ?? '',
                'contact' => $staff->contact_number ?? '',
                'profile_picture' => null
            ]
        ]);
    });

    Route::post('/profile/update', function () {
        $user = request()->user();
        $validated = request()->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'address' => 'nullable|string|max:255',
            'contact' => 'nullable|string|max:20'
        ]);

        // Update user table
        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        // Update staff_tb
        DB::table('staff_tb')
            ->where('username', explode('@', $user->email)[0])
            ->update([
                'name' => $validated['name'],
                'address' => $validated['address'],
                'contact_number' => $validated['contact']
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully'
        ]);
    });

    Route::get('/accounts', function () {
        return Inertia::render('Accounts', ['title' => 'Accounts']);
    })->name('admin.accounts');

    Route::get('/announcement', function () {
        return Inertia::render('Announcement', ['title' => 'Announcement']);
    })->name('admin.announcement');

    Route::get('/reports', function () {
        return Inertia::render('Reports', ['title' => 'Reports']);
    })->name('admin.reports');

    Route::get('/payment', function () {
        return Inertia::render('Payment', ['title' => 'Payment']);
    })->name('admin.payment');

    Route::get('/rate-management', function () {
        return Inertia::render('RateManagement', ['title' => 'Rate Management']);
    })->name('admin.rateManagement');

    // SMS Configuration Routes
    Route::get('/sms-configuration', [App\Http\Controllers\SMSConfigurationController::class, 'index'])
        ->name('admin.smsConfiguration');
    Route::prefix('sms-configuration')->group(function () {
        Route::post('/test-sms', [App\Http\Controllers\SMSConfigurationController::class, 'testSMS']);
        Route::post('/send-bulk-reminders', [App\Http\Controllers\SMSConfigurationController::class, 'sendBulkReminders']);
        Route::get('/default-template', [App\Http\Controllers\SMSConfigurationController::class, 'getDefaultTemplate']);
        Route::get('/customers-by-end-date', [App\Http\Controllers\SMSConfigurationController::class, 'getCustomersByEndDate']);
    });

    // Add this route in the admin.auth middleware group
    Route::get('/test-sms-config', function () {
        $smsService = app(App\Services\SemaphoreService::class);
        $config = [
            'api_key_configured' => !empty(config('services.semaphore.api_key')),
            'sender_name' => config('services.semaphore.sender_name'),
        ];
        
        return response()->json([
            'config' => $config,
            'env' => [
                'app_env' => config('app.env'),
                'app_debug' => config('app.debug'),
            ]
        ]);
    });

    // Bill Payment Validation routes
    Route::prefix('bill-payment-validation')->group(function () {
        Route::get('/', [App\Http\Controllers\BillPaymentValidationController::class, 'index']);
        Route::get('/total', [App\Http\Controllers\BillPaymentValidationController::class, 'getTotalPayments']);
        Route::get('/monthly-totals', [App\Http\Controllers\BillPaymentValidationController::class, 'getMonthlyTotals']);
        Route::post('/{id}/validate', [App\Http\Controllers\BillPaymentValidationController::class, 'validatePayment']);
        Route::put('/{id}/status', [App\Http\Controllers\BillPaymentValidationController::class, 'updateStatus']);
        Route::get('/stats', [App\Http\Controllers\BillPaymentValidationController::class, 'getStats']);
        Route::get('/{accountNumber}', [App\Http\Controllers\BillPaymentValidationController::class, 'getByCustomer']);
    });

    // Customer routes
    Route::prefix('customers')->group(function () {
        Route::get('/', [CustomerController::class, 'index']);
        Route::get('/count', [CustomerController::class, 'count']);
        Route::get('/active-count', [CustomerController::class, 'activeCount']);
        Route::post('/', [CustomerController::class, 'store']);
        Route::get('/{id}', [CustomerController::class, 'show']);
        Route::put('/{id}', [CustomerController::class, 'update']);
        Route::delete('/{id}', [CustomerController::class, 'destroy']);
    });

    Route::get('/billing-cycles', function () {
        return Inertia::render('BillingCycles', ['title' => 'Billing Cycles']);
    })->name('admin.billing-cycles');

    Route::get('/test-billing-cycles', function () {
        $supabase = app(\App\Services\SupabaseService::class);
        try {
            $select = 'id,customer,account_number,current_reading,previous_reading,amount_due,due_date,status,account_type,billing_period,cycle_date,meter_reading_date,consumption,rate,total_amount,bill_generated,payment_status,remarks,created_at,updated_at';
            $result = $supabase->query('billing_cycles_tb', $select, []);
            return response()->json([
                'success' => true,
                'config' => [
                    'url_set' => !empty(config('supabase.url')),
                    'service_key_set' => !empty(config('supabase.service_role_key')),
                    'anon_key_set' => !empty(config('supabase.anon_key'))
                ],
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    });

    // Add this debug route after the existing admin routes
    Route::get('/debug-tickets', function () {
        try {
            $supabase = app(\App\Services\SupabaseService::class);
            $result = $supabase->query('tickets_tb', 'ticket_id,ticket_reference,subject,status', [
                'order' => 'ticket_id.desc',
                'limit' => 20
            ]);
            
            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'tickets' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['error']
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    });

    // Export routes
    Route::prefix('exports')->group(function () {
        Route::get('/payment-reports/excel', [App\Http\Controllers\ExportController::class, 'exportPaymentReportsExcel'])->name('admin.exports.payment-reports.excel');
        Route::get('/payment-reports/pdf', [App\Http\Controllers\ExportController::class, 'exportPaymentReportsPdf'])->name('admin.exports.payment-reports.pdf');
        Route::get('/meter-readings/excel', [App\Http\Controllers\ExportController::class, 'exportMeterReadingsExcel'])->name('admin.exports.meter-readings.excel');
        Route::get('/meter-readings/pdf', [App\Http\Controllers\ExportController::class, 'exportMeterReadingsPdf'])->name('admin.exports.meter-readings.pdf');
        Route::get('/announcements/excel', [App\Http\Controllers\ExportController::class, 'exportAnnouncementsExcel'])->name('admin.exports.announcements.excel');
        Route::get('/announcements/pdf', [App\Http\Controllers\ExportController::class, 'exportAnnouncementsPdf'])->name('admin.exports.announcements.pdf');
        Route::get('/accounts/excel', [App\Http\Controllers\ExportController::class, 'exportAccountsExcel'])->name('admin.exports.accounts.excel');
        Route::get('/accounts/pdf', [App\Http\Controllers\ExportController::class, 'exportAccountsPdf'])->name('admin.exports.accounts.pdf');
    });

    // Printable report routes
    Route::prefix('reports')->group(function () {
        Route::get('/payment-reports/print', [App\Http\Controllers\ExportController::class, 'printPaymentReports'])->name('admin.reports.payment-reports.print');
        Route::get('/meter-readings/print', [App\Http\Controllers\ExportController::class, 'printMeterReadings'])->name('admin.reports.meter-readings.print');
        Route::get('/announcements/print', [App\Http\Controllers\ExportController::class, 'printAnnouncements'])->name('admin.reports.announcements.print');
        Route::get('/accounts/print', [App\Http\Controllers\ExportController::class, 'printAccounts'])->name('admin.reports.accounts.print');
    });
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

    Route::get('/profile/data', function () {
        $user = request()->user();
        return response()->json([
            'success' => true,
            'data' => [
                'admin_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'address' => $user->address,
                'contact' => $user->contact,
                'profile_picture' => $user->profile_picture
            ]
        ]);
    });

    Route::post('/profile/update', function () {
        $user = request()->user();
        $validated = request()->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'address' => 'nullable|string|max:255',
            'contact' => 'nullable|string|max:255',
            'profile_picture' => 'nullable|image|max:2048'
        ]);

        if (request()->hasFile('profile_picture')) {
            $path = request()->file('profile_picture')->store('profile-pictures', 'public');
            $validated['profile_picture'] = $path;
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully'
        ]);
    });

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

// Add this route for fetching customer by meter_number
Route::get('/api/customers/by-meter/{meterNumber}', [App\Http\Controllers\CustomerController::class, 'getByMeterNumber']);


// Debug route to check CSRF token status
Route::get('/debug-csrf', function () {
    return response()->json([
        'csrf_token' => csrf_token(),
        'session_id' => session()->getId(),
        'session_status' => session()->status(),
        'token_in_session' => session()->token(),
        'token_in_header' => request()->header('X-CSRF-TOKEN'),
        'token_in_meta' => request()->header('X-Meta-CSRF-Token'),
        'cookies' => request()->cookies->all(),
    ]);
})->middleware(['web']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/billing-cycles', function () {
        return Inertia::render('BillingCycles');
    })->name('billing-cycles');
});



require __DIR__.'/auth.php';
