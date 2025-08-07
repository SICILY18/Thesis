<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use App\Models\BillPaymentValidation;
use App\Services\SupabaseService;

class BillingCycleService
{
    protected $cachePrefix = 'billing_cycles_';
    protected $cacheDuration = 3600; // 1 hour

    /**
     * Create billing cycles for all customers
     */
    public function createBillingCyclesForAllCustomers()
    {
        try {
            $customers = DB::table('customers_tb')->get();
            $createdCount = 0;
            $updatedCount = 0;
            $errors = [];

            foreach ($customers as $customer) {
                $result = $this->createOrUpdateBillingCycle($customer);
                
                if ($result['action'] === 'created') {
                    $createdCount++;
                } elseif ($result['action'] === 'updated') {
                    $updatedCount++;
                } else {
                    $errors[] = "Customer {$customer->id}: " . $result['message'];
                }
            }

            return [
                'success' => true,
                'message' => "Billing cycles processed successfully",
                'created_count' => $createdCount,
                'updated_count' => $updatedCount,
                'errors' => $errors
            ];

        } catch (\Exception $e) {
            \Log::error('Error creating billing cycles for all customers: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error creating billing cycles: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Create or update billing cycle for a specific customer
     */
    public function createOrUpdateBillingCycle($customer)
    {
        try {
            $supabase = app(SupabaseService::class);
            
            $billingStartDate = Carbon::parse($customer->created_at);
            $billingEndDate = $billingStartDate->copy()->addMonth();

            // Get latest meter reading for amount
            $latestReading = $supabase->query(
                'meter_readings',
                '*',
                [
                    'conditions' => [
                        'meter_number' => "eq.{$customer->meter_number}"
                    ],
                    'order' => 'reading_date.desc',
                    'limit' => 1
                ]
            );

            $amountDue = 0.00;
            if ($latestReading['success'] && !empty($latestReading['data'])) {
                $amountDue = $latestReading['data'][0]['amount'] ?? 0.00;
            }

            // Check for existing cycle
            $existingCycle = $supabase->query(
                'billing_cycles_tb',
                '*',
                [
                    'conditions' => [
                        'customer_id' => "eq.{$customer->id}"
                    ],
                    'limit' => 1
                ]
            );

            if ($existingCycle['success'] && !empty($existingCycle['data'])) {
                // Update existing cycle
                $updateResult = $supabase->update('billing_cycles_tb', [
                    'billing_start_date' => $billingStartDate->format('Y-m-d H:i:s'),
                    'billing_end_date' => $billingEndDate->format('Y-m-d H:i:s'),
                    'status' => 'active',
                    'bill_status' => 'unpaid',
                    'amount_due' => $amountDue
                ], [
                    'id' => "eq.{$existingCycle['data'][0]['id']}"
                ]);

                return [
                    'action' => 'updated',
                    'cycle_id' => $existingCycle['data'][0]['id']
                ];
            } else {
                // Create new cycle
                $insertResult = $supabase->insert('billing_cycles_tb', [
                    'customer_id' => $customer->id,
                    'billing_start_date' => $billingStartDate->format('Y-m-d H:i:s'),
                    'billing_end_date' => $billingEndDate->format('Y-m-d H:i:s'),
                    'status' => 'active',
                    'bill_status' => 'unpaid',
                    'amount_due' => $amountDue
                ]);

                if ($insertResult['success'] && !empty($insertResult['data'])) {
                    return [
                        'action' => 'created',
                        'cycle_id' => $insertResult['data'][0]['id']
                    ];
                }
            }

            throw new \Exception('Failed to create/update billing cycle');
            
        } catch (\Exception $e) {
            \Log::error('Error creating/updating billing cycle: ' . $e->getMessage());
            return ['action' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Sync billing cycles when a new customer is created
     */
    public function syncBillingCycleForNewCustomer($customerId)
    {
        try {
            $customer = DB::table('customers_tb')->where('id', $customerId)->first();
            
            if (!$customer) {
                throw new \Exception('Customer not found');
            }
            
            return $this->createOrUpdateBillingCycle($customer);
            
        } catch (\Exception $e) {
            \Log::error('Error syncing billing cycle for new customer ' . $customerId . ': ' . $e->getMessage());
            return ['action' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Update billing cycles when customer is updated
     */
    public function updateBillingCyclesForCustomer($customerId)
    {
        try {
            $customer = DB::table('customers_tb')->where('id', $customerId)->first();
            
            if (!$customer) {
                throw new \Exception('Customer not found');
            }
            
            // Update all billing cycles for this customer
            $updatedCount = DB::table('billing_cycles_tb')
                ->where('customer_id', $customerId)
                ->update([
                    'status' => 'active'
                ]);
            
            return [
                'action' => 'updated',
                'updated_count' => $updatedCount
            ];
            
        } catch (\Exception $e) {
            \Log::error('Error updating billing cycles for customer ' . $customerId . ': ' . $e->getMessage());
            return ['action' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Delete billing cycles when customer is deleted
     */
    public function deleteBillingCyclesForCustomer($customerId)
    {
        try {
            $deletedCount = DB::table('billing_cycles_tb')
                ->where('customer_id', $customerId)
                ->delete();
            
            return [
                'action' => 'deleted',
                'deleted_count' => $deletedCount
            ];
            
        } catch (\Exception $e) {
            \Log::error('Error deleting billing cycles for customer ' . $customerId . ': ' . $e->getMessage());
            return ['action' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Get billing cycles with customer information
     */
    public function getBillingCyclesWithFilters($filters = [])
    {
        try {
            $limit = $filters['limit'] ?? 10;
            $offset = $filters['offset'] ?? 0;
            
            // Generate cache key including pagination params
            $cacheKey = $this->cachePrefix . md5(json_encode($filters));
            
            // Try to get from cache first
            if (Cache::has($cacheKey)) {
                return [
                    'success' => true,
                    'data' => Cache::get($cacheKey)
                ];
            }

            \Log::info('Cache miss - fetching from database with filters:', $filters);
            
            // Use Laravel DB instead of Supabase for complex joins
            $query = DB::table('billing_cycles_tb')
                ->join('customers_tb', 'billing_cycles_tb.customer_id', '=', 'customers_tb.id')
                ->select([
                    'billing_cycles_tb.id',
                    'billing_cycles_tb.billing_start_date',
                    'billing_cycles_tb.billing_end_date',
                    'billing_cycles_tb.status',
                    'billing_cycles_tb.bill_status',
                    'billing_cycles_tb.amount_due',
                    'customers_tb.full_name as customer',
                    'customers_tb.account_number',
                    'customers_tb.customer_type as account_type'
                ]);

            // Apply filters
            if (!empty($filters['account_type']) && $filters['account_type'] !== 'All') {
                $query->where('customers_tb.customer_type', $filters['account_type']);
            }
            
            if (!empty($filters['billing_period'])) {
                $billingPeriod = $filters['billing_period'];
                if (preg_match('/^\d{4}-\d{2}$/', $billingPeriod)) {
                    $startDate = $billingPeriod . '-01';
                    $endDate = date('Y-m-t', strtotime($startDate));
                    $query->where('billing_cycles_tb.billing_start_date', '>=', $startDate)
                          ->where('billing_cycles_tb.billing_end_date', '<=', $endDate);
                }
            }

            if (!empty($filters['status']) && $filters['status'] !== 'All') {
                $query->where('billing_cycles_tb.status', $filters['status']);
            }

            if (!empty($filters['bill_status']) && $filters['bill_status'] !== 'All') {
                $query->where('billing_cycles_tb.bill_status', $filters['bill_status']);
            }

            if (!empty($filters['search'])) {
                $searchTerm = $filters['search'];
                $query->where(function($q) use ($searchTerm) {
                    $q->where('customers_tb.full_name', 'like', "%{$searchTerm}%")
                      ->orWhere('customers_tb.account_number', 'like', "%{$searchTerm}%");
                });
            }

            // Get total count
            $totalCount = (clone $query)->count();

            // Apply pagination and ordering
            $data = $query->orderBy('billing_cycles_tb.billing_start_date', 'desc')
                         ->skip($offset)
                         ->take($limit)
                         ->get();

            $result = [
                'data' => $data,
                'total' => $totalCount,
                'page' => floor($offset / $limit) + 1,
                'total_pages' => ceil($totalCount / $limit)
            ];

            // Cache the results
            Cache::put($cacheKey, $result, now()->addMinutes(5));

            return [
                'success' => true,
                'data' => $result
            ];

        } catch (\Exception $e) {
            \Log::error('Error fetching billing cycles: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => []
            ];
        }
    }

    /**
     * Get monthly payment totals with caching
     */
    public function getMonthlyPaymentTotals()
    {
        $cacheKey = $this->cachePrefix . 'monthly_totals';
        
        return Cache::remember($cacheKey, $this->cacheDuration, function () {
            try {
                $result = DB::table('billing_cycles_tb')
                    ->select(
                        DB::raw('DATE_FORMAT(billing_start_date, "%Y-%m") as month'),
                        DB::raw('SUM(amount_due) as total_amount'),
                        DB::raw('COUNT(*) as total_bills')
                    )
                    ->groupBy('month')
                    ->orderBy('month', 'desc')
                    ->limit(12)
            ->get();

                return [
                    'success' => true,
                    'data' => $result
                ];
            } catch (\Exception $e) {
                \Log::error('Error getting monthly payment totals: ' . $e->getMessage());
            return [
                    'success' => false,
                    'message' => $e->getMessage(),
                    'data' => []
            ];
            }
        });
    }

    /**
     * Get total payments amount
     */
    public function getTotalPayments()
    {
        $total = BillPaymentValidation::where('payment_status', 'completed')
            ->sum('amount_paid');

        return [
            'total' => $total,
            'formatted_total' => '₱' . number_format($total, 2)
        ];
    }

    /**
     * Get current month's payment statistics
     */
    public function getCurrentMonthStats()
    {
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        $stats = BillPaymentValidation::whereBetween('payment_date', [$startOfMonth, $endOfMonth])
            ->selectRaw('
                COUNT(*) as total_transactions,
                COUNT(DISTINCT account_number) as unique_customers,
                SUM(CASE WHEN payment_status = \'completed\' THEN amount_paid ELSE 0 END) as total_amount,
                COUNT(CASE WHEN payment_status = \'completed\' THEN 1 END) as completed_count,
                COUNT(CASE WHEN payment_status = \'pending_validation\' THEN 1 END) as pending_count,
                COUNT(CASE WHEN payment_status = \'processing\' THEN 1 END) as processing_count
            ')
            ->first();

        return [
            'total_transactions' => $stats->total_transactions,
            'unique_customers' => $stats->unique_customers,
            'total_amount' => $stats->total_amount,
            'formatted_amount' => '₱' . number_format($stats->total_amount, 2),
            'completed_count' => $stats->completed_count,
            'pending_count' => $stats->pending_count,
            'processing_count' => $stats->processing_count
        ];
    }

    /**
     * Get payment method distribution
     */
    public function getPaymentMethodStats()
    {
        return BillPaymentValidation::where('payment_status', 'completed')
            ->selectRaw('
                payment_method,
                COUNT(*) as count,
                SUM(amount_paid) as total_amount
            ')
            ->whereNotNull('payment_method')
            ->groupBy('payment_method')
            ->get()
            ->map(function($row) {
                return [
                    'method' => $row->payment_method,
                    'count' => $row->count,
                    'total' => $row->total_amount,
                    'formatted_total' => '₱' . number_format($row->total_amount, 2)
                ];
            });
    }

    /**
     * Clear cache when data is modified
     */
    protected function clearCache()
    {
        $keys = Cache::get($this->cachePrefix . 'keys', []);
        foreach ($keys as $key) {
            Cache::forget($key);
        }
        Cache::forget($this->cachePrefix . 'keys');
    }

    /**
     * Add key to cache registry
     */
    protected function registerCacheKey($key)
    {
        $keys = Cache::get($this->cachePrefix . 'keys', []);
        $keys[] = $key;
        Cache::put($this->cachePrefix . 'keys', array_unique($keys), $this->cacheDuration);
    }
} 