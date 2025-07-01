<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminProfileController;
use App\Http\Controllers\AccountController;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\BillHandlerController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\RateController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PaymentHistoryController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\BillPaymentValidationController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MeterReadingController;
use App\Http\Controllers\BillingCycleController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Public routes
Route::post('/admin-login', [AdminAuthController::class, 'login']);
Route::post('/admin-logout', [AdminAuthController::class, 'logout'])->middleware(['web']);
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});
Route::get('/check-auth', [AdminAuthController::class, 'checkAuth'])->middleware(['web']);
Route::post('/create-staff', [AdminAuthController::class, 'createStaff']);

// Debug route for tickets
Route::get('/debug-tickets', function () {
    try {
        $supabase = app(App\Services\SupabaseService::class);
        $result = $supabase->query('tickets_tb', '*', [
            'order' => 'created_at.desc'
        ]);
        
        return response()->json([
            'success' => true,
            'supabase_response' => $result,
            'config' => [
                'url_set' => !empty(config('supabase.url')),
                'service_key_set' => !empty(config('supabase.service_role_key')),
                'anon_key_set' => !empty(config('supabase.anon_key'))
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
    }
});

// Temporary public routes (for testing)
Route::get('/meter-readings', [MeterReadingController::class, 'index']);

    // Bill Handler Routes
    Route::middleware(['web', 'bill.handler'])->group(function () {
        Route::get('/bill-handler-dashboard', [BillHandlerController::class, 'BillHandlerDashboard']);
    Route::get('/bill-handler/profile', [BillHandlerController::class, 'getProfile']);
    Route::post('/bill-handler/profile/update', [BillHandlerController::class, 'updateProfile']);
        
        // Debug route for profile issues
        Route::get('/debug-profile', function() {
            try {
                $user = auth()->user();
                $debug = [
                    'authenticated' => auth()->check(),
                    'user' => $user ? [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email
                    ] : null,
                    'session_id' => session()->getId(),
                    'session_data' => session()->all()
                ];
                
                if ($user) {
                    $staff = DB::table('staff_tb')
                        ->where('username', $user->name)
                        ->first();
                    
                    $debug['staff_query'] = [
                        'searching_for_username' => $user->name,
                        'staff_found' => $staff ? true : false,
                        'staff_data' => $staff
                    ];
                    
                    // Also try searching by email
                    $staffByEmail = DB::table('staff_tb')
                        ->where('email', $user->email)
                        ->first();
                    
                    $debug['staff_by_email'] = [
                        'searching_for_email' => $user->email,
                        'staff_found' => $staffByEmail ? true : false,
                        'staff_data' => $staffByEmail
                    ];
                }
                
                return response()->json($debug);
            } catch (Exception $e) {
                return response()->json([
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        });
        
        // Simple database test route
        Route::get('/test-db', function() {
            try {
                // Test basic database connection
                $test = DB::select('SELECT 1 as test');
                
                // Test staff_tb table access
                $staffCount = DB::table('staff_tb')->count();
                $sampleStaff = DB::table('staff_tb')->first();
                
                return response()->json([
                    'success' => true,
                    'database_connected' => true,
                    'staff_table_accessible' => true,
                    'staff_count' => $staffCount,
                    'sample_staff' => $sampleStaff
                ]);
            } catch (Exception $e) {
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        });
});

// Protected routes
Route::middleware(['web', 'admin.auth'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Admin Profile Routes
    Route::get('/admin/profile', [AdminProfileController::class, 'show'])->middleware('web');
    Route::post('/admin/profile/update', [AdminProfileController::class, 'update'])->middleware('web');

    // Account Management Routes  
    Route::prefix('accounts')->group(function () {
        Route::get('/', [AccountController::class, 'listAccounts']);
        Route::post('/staff', [AccountController::class, 'createStaffAccount']);
        Route::put('/staff/{id}', [AccountController::class, 'updateStaff']);
        Route::delete('/staff/{id}', [AccountController::class, 'deleteStaff']);
        Route::post('/customer', [AccountController::class, 'createCustomer']);
        Route::put('/customer/{id}', [AccountController::class, 'updateCustomer']);
        Route::delete('/customer/{id}', [AccountController::class, 'deleteCustomer']);
    });

    // Rate Management Routes
    Route::get('/rates', [RateController::class, 'index']);
    Route::post('/rates', [RateController::class, 'store']);
    Route::put('/rates/{id}', [RateController::class, 'update']);
    Route::delete('/rates/{id}', [RateController::class, 'destroy']);

    // Announcement Routes
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::post('/announcements', [AnnouncementController::class, 'store']);
    Route::put('/announcements/{id}', [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);
    Route::get('/announcements/history', [AnnouncementController::class, 'history']);

    // Payment Routes
    Route::prefix('payments')->group(function () {
        Route::get('/', [PaymentController::class, 'index']);
        Route::post('/', [PaymentController::class, 'store']);
        Route::post('/{id}/approve', [PaymentController::class, 'approve']);
    });

    // Payment History Routes
    Route::prefix('payment-history')->group(function () {
        Route::get('/', [PaymentHistoryController::class, 'index']);
        Route::get('/stats', [PaymentHistoryController::class, 'getStats']);
        Route::get('/{accountNumber}', [PaymentHistoryController::class, 'getCustomerHistory']);
    });

    // Ticket Routes
    Route::prefix('tickets')->group(function () {
        Route::get('/', [TicketController::class, 'index']);
        Route::patch('/{id}', [TicketController::class, 'update']);
    });

    // Invoice Routes
    Route::prefix('invoices')->group(function () {
        Route::get('/', [InvoiceController::class, 'index']);
        Route::post('/', [InvoiceController::class, 'store']);
        Route::post('/bulk-generate', [InvoiceController::class, 'bulkGenerate']);
        Route::post('/generate', [InvoiceController::class, 'generateFromReading'])->withoutMiddleware(['verify_csrf_token']);
        Route::get('/{invoice}', [InvoiceController::class, 'show']);
        Route::put('/{invoice}', [InvoiceController::class, 'update']);
        Route::delete('/{invoice}', [InvoiceController::class, 'destroy']);
        Route::get('/{invoiceId}/download', [InvoiceController::class, 'downloadPdf']);
    });

    // Get customers for invoice generation
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/{accountNumber}', [CustomerController::class, 'getByAccountNumber']);

    // Meter Reading Routes
    Route::prefix('meter-readings')->group(function () {
        Route::get('/', [MeterReadingController::class, 'index']);
        Route::post('/', [MeterReadingController::class, 'store']);
        Route::get('/{id}/with-customer', [MeterReadingController::class, 'getWithCustomer']);
        Route::get('/{meterReading}', [MeterReadingController::class, 'show']);
        Route::put('/{meterReading}', [MeterReadingController::class, 'update']);
        Route::delete('/{meterReading}', [MeterReadingController::class, 'destroy']);
    });

    // Billing Cycle Routes
    Route::prefix('billing-cycles')->group(function () {
        Route::get('/', [BillingCycleController::class, 'index']);
        Route::post('/generate', [BillingCycleController::class, 'generateFromCustomers']);
        Route::post('/create-for-all-customers', [BillingCycleController::class, 'createBillingCyclesForAllCustomers']);
        Route::post('/sync-customer/{customerId}', [BillingCycleController::class, 'syncBillingCycleForCustomer']);
        Route::get('/periods', [BillingCycleController::class, 'getBillingPeriods']);
        Route::get('/statistics', [BillingCycleController::class, 'getStatistics']);
        Route::get('/{billingCycle}', [BillingCycleController::class, 'show']);
        Route::put('/{billingCycle}', [BillingCycleController::class, 'update']);
        Route::delete('/{billingCycle}', [BillingCycleController::class, 'destroy']);
    });

    // Simple test route for meter readings
    Route::get('/test-meter-readings', function() {
        try {
            $readings = \DB::table('meter_readings')->get();
            return response()->json([
                'success' => true,
                'count' => $readings->count(),
                'data' => $readings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    });

    // Debug route to test the join between meter_readings and customers_tb
    Route::get('/debug/meter-customer-join/{id}', function($id) {
        try {
            // First, get the meter reading
            $meterReading = \DB::table('meter_readings')->where('id', $id)->first();
            
            if (!$meterReading) {
                return response()->json([
                    'success' => false,
                    'error' => 'Meter reading not found',
                    'id' => $id
                ]);
            }

            // Check if customer exists with the same meter_number
            $customer = \DB::table('customers_tb')->where('meter_number', $meterReading->meter_number)->first();
            
            // Try the join
            $joinResult = \DB::table('meter_readings')
                ->join('customers_tb', 'meter_readings.meter_number', '=', 'customers_tb.meter_number')
                ->where('meter_readings.id', $id)
                ->select(
                    'meter_readings.*',
                    'customers_tb.full_name',
                    'customers_tb.address',
                    'customers_tb.account_number'
                )
                ->first();

            return response()->json([
                'success' => true,
                'meter_reading' => $meterReading,
                'customer' => $customer,
                'join_result' => $joinResult,
                'meter_number_from_reading' => $meterReading->meter_number ?? null
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    });

    // Bill Payment Validation Routes
    Route::prefix('bill-payment-validation')->group(function () {
        Route::get('/', [BillPaymentValidationController::class, 'index']);
        Route::post('/{id}/validate', [BillPaymentValidationController::class, 'validatePayment'])
            ->middleware(['web', \App\Http\Middleware\VerifyCsrfToken::class]);
        Route::put('/{id}/status', [BillPaymentValidationController::class, 'updateStatus']);
        Route::get('/customer/{accountNumber}', [BillPaymentValidationController::class, 'getByCustomer']);
        Route::get('/stats', [BillPaymentValidationController::class, 'getStats']);
    });
});

// Temporary debug routes
Route::get('/debug/check-admin', function() {
    $admins = DB::table('admin')->get();
    return response()->json([
        'admins' => $admins,
        'count' => $admins->count()
    ]);
});

Route::get('/debug/check-staff', function() {
    $staff = DB::table('staff_tb')->get();
    return response()->json([
        'staff' => $staff,
        'count' => $staff->count()
    ]);
});

Route::get('/debug/check-meter-readings', function() {
    try {
        $readings = DB::table('meter_readings')->get();
        return response()->json([
            'status' => 'success',
            'readings' => $readings,
            'count' => $readings->count(),
            'connection' => DB::connection()->getName()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'connection' => DB::connection()->getName()
        ]);
    }
});

// Additional API routes for BillHandlerBilling (no middleware for easy access)
Route::get('/bills', [BillPaymentValidationController::class, 'index']); // Use same as bill-payment-validation
Route::get('/billing-cycles', [BillingCycleController::class, 'index']);
Route::get('/rates', [RateController::class, 'index']);
Route::get('/billing-history', [PaymentHistoryController::class, 'index']); // Use payment history data






