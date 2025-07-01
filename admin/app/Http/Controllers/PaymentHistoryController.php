<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\BillPaymentValidation;
use Illuminate\Support\Facades\DB;

class PaymentHistoryController extends Controller
{
    /**
     * Get payment history with optional filters
     */
    public function index(Request $request)
    {
        $query = BillPaymentValidation::leftJoin('customers_tb', 'payment_history_tb.account_number', '=', 'customers_tb.account_number')
            ->select('payment_history_tb.*', 'customers_tb.customer_type');

        // Apply filters
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
                  ->orWhere('payment_history_tb.account_number', 'like', "%$search%");
            });
        }

        $payments = $query->orderBy('payment_history_tb.created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }

    /**
     * Get payment history for a specific customer
     */
    public function getCustomerHistory($accountNumber)
    {
        $payments = BillPaymentValidation::leftJoin('customers_tb', 'payment_history_tb.account_number', '=', 'customers_tb.account_number')
            ->select('payment_history_tb.*', 'customers_tb.customer_type')
            ->where('payment_history_tb.account_number', $accountNumber)
            ->orderBy('payment_history_tb.created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }

    /**
     * Get payment statistics
     */
    public function getStats()
    {
        try {
            // Calculate total amount from completed payments  
            $totalAmount = BillPaymentValidation::where('payment_status', 'completed')
                ->sum('amount_paid');

            // Count processing payments as pending
            $pendingCount = BillPaymentValidation::where('payment_status', 'processing')
                ->count();

            // Count partial payments (where amount_paid < bill_amount)
            $partialCount = BillPaymentValidation::whereColumn('amount_paid', '<', 'bill_amount')
                ->where('payment_status', '!=', 'rejected')
                ->count();

            $stats = [
                'total_amount' => (float) $totalAmount,
                'pending_count' => $pendingCount,
                'partial_count' => $partialCount
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 