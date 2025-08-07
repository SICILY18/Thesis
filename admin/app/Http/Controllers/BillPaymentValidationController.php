<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BillPaymentValidation;
use Illuminate\Support\Facades\DB;

class BillPaymentValidationController extends Controller
{
    public function index(Request $request)
    {
        \Log::info('BillPaymentValidationController@index called');
        try {
            $query = DB::table('payment_history_tb')->select('*');

            // Optional filters
            if ($request->has('status') && $request->status !== 'All') {
                $query->where('payment_status', $request->status);
            }
            if ($request->has('period') && $request->period !== '') {
                $query->where('billing_period', $request->period);
            }
            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('full_name', 'like', "%$search%")
                      ->orWhere('account_number', 'like', "%$search%");
                });
            }

            // Sort by payment_date in descending order by default
            $sortField = $request->input('sort', 'payment_date');
            $sortOrder = $request->input('order', 'desc');
            $query->orderBy($sortField, $sortOrder);

            // Get pagination parameters
            $perPage = (int) $request->input('per_page', 10);
            $page = (int) $request->input('page', 1);

            // Ensure valid pagination values
            $perPage = max(1, min($perPage, 100)); // Limit per_page between 1 and 100
            $page = max(1, $page); // Ensure page is at least 1

            // Get total count for pagination
            $total = (clone $query)->count();

            // Apply pagination
            $payments = $query->skip(($page - 1) * $perPage)
                             ->take($perPage)
                             ->get();

            \Log::info('Payments fetched with pagination:', [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'count' => $payments->count()
            ]);

            // Format the response
            $formattedPayments = $payments->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'account_number' => $payment->account_number,
                    'name' => $payment->full_name,
                    'amount' => $payment->amount_paid,
                    'bill_amount' => $payment->bill_amount,
                    'payment_date' => $payment->payment_date,
                    'due_date' => $payment->due_date,
                    'status' => $payment->payment_status,
                    'payment_method' => $payment->payment_method,
                    'reference' => $payment->payment_reference,
                    'period' => $payment->billing_period,
                    'account_type' => $payment->bill_type,
                    'validated_at' => $payment->validated_at ?? null
                ];
            });

            // Return paginated response
            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $formattedPayments,
                    'current_page' => $page,
                    'last_page' => max(1, (int) ceil($total / $perPage)),
                    'per_page' => $perPage,
                    'total' => $total,
                    'from' => $total > 0 ? (($page - 1) * $perPage) + 1 : 0,
                    'to' => min($page * $perPage, $total)
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching payments: ' . $e->getMessage());
            \Log::error('Error stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch payments',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function validatePayment(Request $request, $id)
    {
        $request->validate([
            'action' => 'required|in:approve,reject',
            'admin_notes' => 'nullable|string|max:500'
        ]);

        try {
            $payment = BillPaymentValidation::findOrFail($id);
            
            $payment->payment_status = $request->action === 'approve' ? 'completed' : 'rejected';
            if ($request->admin_notes) {
                $payment->admin_notes = $request->admin_notes;
            }
            $payment->save();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => ucfirst($request->action) . 'd payment successfully',
                    'data' => $payment
                ]);
            }

            return redirect()->back()->with('success', ucfirst($request->action) . 'd payment successfully');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to ' . $request->action . ' payment: ' . $e->getMessage()
                ], 500);
            }

            return redirect()->back()->withErrors(['error' => 'Failed to ' . $request->action . ' payment: ' . $e->getMessage()]);
        }
    }

    /**
     * Update payment status (alternative method for compatibility)
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending_validation,processing,completed,rejected',
            'admin_notes' => 'nullable|string|max:500'
        ]);

        $payment = BillPaymentValidation::findOrFail($id);
        
        $payment->payment_status = $request->status;
        if ($request->admin_notes) {
            $payment->admin_notes = $request->admin_notes;
        }
        $payment->save();

        return response()->json([
            'success' => true,
            'message' => 'Payment status updated successfully',
            'data' => $payment
        ]);
    }

    /**
     * Get payment history for a specific customer by account number
     */
    public function getByCustomer($accountNumber)
    {
        $payments = BillPaymentValidation::where('account_number', $accountNumber)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }

    /**
     * Get payment statistics for dashboard
     */
    public function getStats(Request $request)
    {
        // Determine date range based on period
        $period = $request->input('period', null);
        $query = BillPaymentValidation::query();

        if ($period === 'today') {
            $query->whereDate('payment_date', now()->toDateString());
        } elseif ($period === 'week') {
            $query->whereBetween('payment_date', [now()->startOfWeek(), now()->endOfWeek()]);
        } elseif ($period === 'month') {
            $query->whereMonth('payment_date', now()->month)
                  ->whereYear('payment_date', now()->year);
        }
        // Now use $query for all your sums and counts below
        $totalAmount = (clone $query)->sum('amount_paid');
        $totalCount = (clone $query)->count();

        $completedAmount = (clone $query)->where('payment_status', 'completed')->sum('amount_paid');
        $completedCount = (clone $query)->where('payment_status', 'completed')->count();

        $pendingAmount = (clone $query)->where('payment_status', 'pending_validation')->sum('amount_paid');
        $pendingCount = (clone $query)->where('payment_status', 'pending_validation')->count();

        // Calculate percentages based on amounts
        $completedPercentage = $totalAmount > 0 ? round(($completedAmount / $totalAmount) * 100) : 0;
        $pendingPercentage = $totalAmount > 0 ? round(($pendingAmount / $totalAmount) * 100) : 0;

        // Today's collections (completed payments today)
        $today = now()->toDateString();
        $todayCollections = (clone $query)->where('payment_status', 'completed')
            ->whereDate('payment_date', $today)
            ->sum('amount_paid');

        // This week's collections (completed payments this week)
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();
        $weeklyCollections = (clone $query)->where('payment_status', 'completed')
            ->whereBetween('payment_date', [$startOfWeek, $endOfWeek])
            ->sum('amount_paid');

        // Pending validations count
        $pendingValidations = $pendingCount;

        // Success rate (completed / total)
        $successRate = $totalCount > 0 ? $completedCount / $totalCount : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'total_amount' => $completedAmount, // Keep this as completed only for total display
                'formatted_total' => '₱' . number_format($completedAmount, 2),
                'payment_status' => [
                    'completed' => [
                        'amount' => $completedAmount,
                        'formatted_amount' => '₱' . number_format($completedAmount, 2),
                        'percentage' => $completedPercentage
                    ],
                    'pending' => [
                        'amount' => $pendingAmount,
                        'formatted_amount' => '₱' . number_format($pendingAmount, 2),
                        'percentage' => $pendingPercentage
                    ]
                ],
                'today_collections' => $todayCollections,
                'weekly_collections' => $weeklyCollections,
                'pending_validations' => $pendingValidations,
                'success_rate' => $successRate
            ]
        ]);
    }

    /**
     * Get total amount of all payments
     */
    public function getTotalPayments()
    {
        $totalAmount = BillPaymentValidation::where('payment_status', 'completed')
            ->sum('amount_paid');
        return response()->json(['total_amount' => $totalAmount]);
    }

    /**
     * Get monthly payment totals for the last 6 months
     */
    public function getMonthlyTotals()
    {
        try {
        // Get the current date and 6 months ago date
        $endDate = now();
        $startDate = now()->subMonths(5)->startOfMonth();

            $monthlyTotals = DB::table('payment_history_tb')
            ->selectRaw('
                EXTRACT(MONTH FROM payment_date) as month,
                EXTRACT(YEAR FROM payment_date) as year,
                    COALESCE(SUM(CASE WHEN payment_status = \'completed\' THEN amount_paid ELSE 0 END), 0) as total
            ')
            ->whereNotNull('payment_date')
            ->whereBetween('payment_date', [$startDate, $endDate])
                ->groupBy(DB::raw('EXTRACT(YEAR FROM payment_date), EXTRACT(MONTH FROM payment_date)'))
                ->orderBy(DB::raw('EXTRACT(YEAR FROM payment_date)'), 'asc')
                ->orderBy(DB::raw('EXTRACT(MONTH FROM payment_date)'), 'asc')
            ->get();

        // Create an array of all months in the range
        $allMonths = [];
        $currentDate = clone $startDate;
        
        while ($currentDate <= $endDate) {
            $allMonths[$currentDate->format('Y-n')] = [
                'month' => $currentDate->format('M'),
                'year' => $currentDate->year,
                'total' => 0
            ];
            $currentDate->addMonth();
        }

        // Fill in the actual totals
        foreach ($monthlyTotals as $total) {
            $key = $total->year . '-' . $total->month;
            if (isset($allMonths[$key])) {
                $allMonths[$key]['total'] = round(floatval($total->total), 2);
            }
        }

        // Format the response
        $formattedData = array_values($allMonths);

        // Add month-year labels for better display
        $formattedData = array_map(function($item) {
            return [
                'month' => $item['month'],
                'label' => $item['month'] . ' ' . $item['year'],
                'total' => $item['total']
            ];
        }, $formattedData);

        return response()->json($formattedData);
        } catch (\Exception $e) {
            \Log::error('Error in getMonthlyTotals: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch monthly totals',
                'message' => $e->getMessage()
            ], 500);
        }
    }
} 