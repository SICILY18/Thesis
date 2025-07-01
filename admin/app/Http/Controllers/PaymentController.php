<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\Customer;
use App\Models\Bill;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Get all payments with optional filtering
     */
    public function index(Request $request)
    {
        $query = Payment::with(['user', 'customer'])
            ->orderBy('created_at', 'desc');

        if ($request->has('accountType') && $request->accountType !== 'All') {
            $query->whereHas('customer', function ($q) use ($request) {
                $q->where('customer_type', strtolower($request->accountType));
            });
        }

        $payments = $query->get();

        return response()->json($payments);
    }

    /**
     * Store a new payment
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'bill_id' => 'required|exists:bills,id',
            'amount' => 'required|numeric|min:0',
            'payment_type' => 'required|in:Full,Partial',
            'payment_method' => 'required|string',
            'proof_of_payment' => 'required|string',
        ]);

        $payment = Payment::create([
            'user_id' => auth()->id(),
            'customer_id' => $request->customer_id,
            'bill_id' => $request->bill_id,
            'amount' => $request->amount,
            'payment_type' => $request->payment_type,
            'payment_method' => $request->payment_method,
            'proof_of_payment' => $request->proof_of_payment,
            'status' => 'Pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment recorded successfully',
            'data' => $payment
        ]);
    }

    /**
     * Get payment details
     */
    public function show($id)
    {
        $payment = Payment::with(['user', 'customer', 'bill'])->findOrFail($id);
        return response()->json($payment);
    }

    /**
     * Update payment status
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Pending,Approved,Rejected'
        ]);

        $payment = Payment::findOrFail($id);
        $payment->status = $request->status;
        $payment->save();

        return response()->json([
            'success' => true,
            'message' => 'Payment status updated successfully',
            'data' => $payment
        ]);
    }
} 