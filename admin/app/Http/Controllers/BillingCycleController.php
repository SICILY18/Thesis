<?php

namespace App\Http\Controllers;

use App\Services\BillingCycleService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BillingCycleController extends Controller
{
    protected $billingCycleService;

    public function __construct(BillingCycleService $billingCycleService)
    {
        $this->billingCycleService = $billingCycleService;
    }

    /**
     * Display a listing of billing cycles with filtering.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            \Log::info('Fetching billing cycles with filters:', $request->all());
            
            $filters = [
                'account_type' => $request->get('account_type'),
                'billing_period' => $request->get('billing_period'),
                'search' => $request->get('search'),
                'status' => $request->get('status'),
                'bill_status' => $request->get('bill_status'),
                'limit' => $request->get('limit', 10),
                'offset' => $request->get('offset', 0)
            ];

            $result = $this->billingCycleService->getBillingCyclesWithFilters($filters);
            
            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch billing cycles',
                    'data' => []
                ], 500);
            }

            return response()->json($result['data']);

        } catch (\Exception $e) {
            \Log::error('Error in BillingCycleController@index:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching billing cycles',
                'data' => []
            ], 500);
        }
    }

    /**
     * Create billing cycles for all customers automatically
     */
    public function createBillingCyclesForAllCustomers(): JsonResponse
    {
        try {
            $result = $this->billingCycleService->createBillingCyclesForAllCustomers();
            
            if ($result['success']) {
                return response()->json($result);
            } else {
                return response()->json($result, 500);
            }
        } catch (\Exception $e) {
            Log::error('Error creating billing cycles for all customers: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating billing cycles: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sync billing cycle for a specific customer
     */
    public function syncBillingCycleForCustomer($customerId): JsonResponse
    {
        try {
            $result = $this->billingCycleService->syncBillingCycleForNewCustomer($customerId);
            
            if ($result['action'] === 'created' || $result['action'] === 'updated') {
                return response()->json([
                    'success' => true,
                    'message' => 'Billing cycle ' . $result['action'] . ' successfully',
                    'cycle_id' => $result['cycle_id']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Error syncing billing cycle for customer ' . $customerId . ': ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error syncing billing cycle: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified billing cycle.
     */
    public function show($id): JsonResponse
    {
        try {
            $billingCycle = DB::table('billing_cycles_tb')
                ->join('customers_tb', 'billing_cycles_tb.customer_id', '=', 'customers_tb.id')
                ->select([
                    'billing_cycles_tb.id',
                    'billing_cycles_tb.billing_start_date',
                    'billing_cycles_tb.billing_end_date',
                    'billing_cycles_tb.status',
                    'billing_cycles_tb.bill_status',
                    'billing_cycles_tb.amount_due',
                    'billing_cycles_tb.created_at',
                    'billing_cycles_tb.updated_at',
                    'customers_tb.full_name as customer_name',
                    'customers_tb.account_number',
                    'customers_tb.customer_type as account_type',
                    'customers_tb.email',
                    'customers_tb.phone_number'
                ])
                ->where('billing_cycles_tb.id', $id)
                ->first();

            if (!$billingCycle) {
                return response()->json(['message' => 'Billing cycle not found'], 404);
            }

            return response()->json($billingCycle);
        } catch (\Exception $e) {
            Log::error('Error fetching billing cycle: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching billing cycle'], 500);
        }
    }

    /**
     * Update the specified billing cycle.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'billing_start_date' => 'sometimes|date',
                'billing_end_date' => 'sometimes|date',
                'status' => 'sometimes|string|in:paid,unpaid',
                'amount_due' => 'sometimes|numeric|min:0'
            ]);

            $supabase = app(\App\Services\SupabaseService::class);
            
            $result = $supabase->update(
                'billing_cycles_tb',
                $validated,
                ['id' => "eq.{$id}"]
            );

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Billing cycle updated successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Billing cycle not found or no changes made'
                ], 404);
            }
        } catch (\Exception $e) {
            Log::error('Error updating billing cycle: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating billing cycle: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified billing cycle.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $supabase = app(\App\Services\SupabaseService::class);
            
            $result = $supabase->delete(
                'billing_cycles_tb',
                ['id' => "eq.{$id}"]
            );

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Billing cycle deleted successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Billing cycle not found'
                ], 404);
            }
        } catch (\Exception $e) {
            Log::error('Error deleting billing cycle: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting billing cycle: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available billing periods
     */
    public function getBillingPeriods(): JsonResponse
    {
        try {
            $periods = DB::table('billing_cycles_tb')
                ->selectRaw("DATE_FORMAT(billing_start_date, '%Y-%m') as period")
                ->distinct()
                ->orderBy('period', 'desc')
                ->pluck('period');

            return response()->json($periods);
        } catch (\Exception $e) {
            Log::error('Error fetching billing periods: ' . $e->getMessage());
            return response()->json([]);
        }
    }

    /**
     * Get billing cycle statistics
     */
    public function getStatistics(Request $request): JsonResponse
    {
        try {
            $filters = [
                'account_type' => $request->get('account_type'),
                'billing_period' => $request->get('billing_period'),
                'status' => $request->get('status')
            ];

            $query = DB::table('billing_cycles_tb')
                ->join('customers_tb', 'billing_cycles_tb.customer_id', '=', 'customers_tb.id');

            // Apply filters
            if (!empty($filters['account_type']) && $filters['account_type'] !== 'All') {
                $query->where('customers_tb.customer_type', $filters['account_type']);
            }
            
            if (!empty($filters['billing_period'])) {
                $query->whereRaw("DATE_FORMAT(billing_cycles_tb.billing_start_date, '%Y-%m') = ?", [$filters['billing_period']]);
            }
            
            if (!empty($filters['status']) && $filters['status'] !== 'All') {
                $query->where('billing_cycles_tb.status', $filters['status']);
            }

            $statistics = [
                'total_cycles' => $query->count(),
                'total_amount_due' => $query->sum('billing_cycles_tb.amount_due'),
                'active_cycles' => $query->where('billing_cycles_tb.status', 'active')->count(),
                'inactive_cycles' => $query->where('billing_cycles_tb.status', 'inactive')->count()
            ];

            return response()->json($statistics);
        } catch (\Exception $e) {
            Log::error('Error fetching billing cycle statistics: ' . $e->getMessage());
            return response()->json([
                'total_cycles' => 0,
                'total_amount_due' => 0,
                'active_cycles' => 0,
                'inactive_cycles' => 0
            ]);
        }
    }

    /**
     * Get the total number of active billing cycles
     */
    public function getActiveCount()
    {
        try {
            $supabase = app(\App\Services\SupabaseService::class);
            
            $result = $supabase->query(
                'billing_cycles_tb',
                'id',
                ['status' => 'eq.active']
            );

            if ($result['success']) {
                $count = count($result['data']);
                return response()->json(['active_count' => $count]);
            } else {
                Log::error('Error fetching active billing cycles count: ' . ($result['message'] ?? 'Unknown error'));
                return response()->json(['active_count' => 0]);
            }
        } catch (\Exception $e) {
            Log::error('Error in getActiveCount: ' . $e->getMessage());
            return response()->json(['active_count' => 0]);
        }
    }
} 