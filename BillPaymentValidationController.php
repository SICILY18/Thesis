<?php

namespace App\Http\Controllers;

use App\Models\BillPaymentValidation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BillPaymentValidationController extends Controller
{
    /**
     * Get all payment history with optional filtering
     */
    public function index(Request $request)
    {
        $query = BillPaymentValidation::query();

        // Apply filters
        if ($request->has('status')) {
            $query->where('payment_status', $request->status);
        }
        if ($request->has('period')) {
            $query->where('billing_period', $request->period);
        }
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('account_number', 'like', "%{$search}%")
                  ->orWhere('payment_reference', 'like', "%{$search}%");
            });
        }

        $payments = $query->orderBy('created_at', 'desc')->get();

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
        $stats = [
            'total_payments' => BillPaymentValidation::where('payment_status', 'completed')->sum('amount_paid'),
            'pending_count' => BillPaymentValidation::where('payment_status', 'pending_validation')->count(),
            'completed_count' => BillPaymentValidation::where('payment_status', 'completed')->count(),
            'rejected_count' => BillPaymentValidation::where('payment_status', 'rejected')->count()
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Validate a payment (approve/reject)
     */
    public function validatePayment(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:approve,reject',
            'admin_notes' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid input',
                'errors' => $validator->errors()
            ], 422);
        }

        $payment = BillPaymentValidation::find($id);
        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        $payment->payment_status = $request->action === 'approve' ? 'completed' : 'rejected';
        if ($request->has('admin_notes')) {
            $payment->admin_notes = $request->admin_notes;
        }
        $payment->save();

        return response()->json([
            'success' => true,
            'message' => ucfirst($request->action) . 'd payment successfully',
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
} 