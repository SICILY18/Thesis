<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BillPaymentValidation;

class BillPaymentValidationController extends Controller
{
    public function index(Request $request)
    {
        $query = BillPaymentValidation::query();

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

        $bills = $query->orderBy('created_at', 'desc')->get();
        
        // Add customer_type field for filtering if not exists
        $bills = $bills->map(function ($bill) {
            if (!isset($bill->customer_type)) {
                // Default customer type based on account number pattern
                if (str_contains($bill->account_number, 'ADMIN')) {
                    $bill->customer_type = 'admin';
                } else {
                    $bill->customer_type = 'residential';
                }
            }
            return $bill;
        });

        // Apply account_type filter after data processing
        if ($request->has('account_type') && $request->account_type !== 'All') {
            $bills = $bills->filter(function ($bill) use ($request) {
                return strtolower($bill->customer_type) === strtolower($request->account_type);
            })->values();
        }

        return response()->json($bills);
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
    public function getStats()
    {
        $totalPayments = BillPaymentValidation::sum('amount_paid');
        $pendingCount = BillPaymentValidation::where('payment_status', 'pending_validation')->count();
        $partialCount = BillPaymentValidation::where('payment_status', 'processing')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_amount' => $totalPayments,
                'pending_count' => $pendingCount,
                'partial_count' => $partialCount
            ]
        ]);
    }
} 