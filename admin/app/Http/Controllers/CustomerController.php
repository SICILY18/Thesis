<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    /**
     * Get all customers for API
     */
    public function index()
    {
        try {
            $customers = DB::table('customers_tb')
                ->select('id', 'full_name', 'account_number', 'customer_type', 'address', 'phone_number', 'email', 'meter_number', 'created_at')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $customers
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching customers: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:50',
            'last_name' => 'required|string|max:50',
            'username' => 'required|string|max:255|unique:customers_tb',
            'password' => 'required|string|min:8',
            'customer_type' => 'required|in:residential,commercial,government',
            'address' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'email' => 'required|email|max:255|unique:customers_tb',
            'account_number' => 'required|string|max:20|unique:customers_tb',
            'meter_number' => 'required|string|size:9|unique:customers_tb',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Generate full_name from first_name and last_name
            $full_name = trim($request->first_name . ' ' . $request->last_name);

            DB::table('customers_tb')->insert([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'full_name' => $full_name,
                'username' => $request->username,
                'password' => Hash::make($request->password),
                'customer_type' => $request->customer_type,
                'address' => $request->address,
                'phone_number' => $request->phone_number,
                'email' => $request->email,
                'account_number' => $request->account_number,
                'meter_number' => $request->meter_number,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Customer account created successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating customer account: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customer details by account number
     */
    public function getByAccountNumber($accountNumber)
    {
        try {
            // Remove any hyphens from the account number for comparison
            $cleanAccountNumber = str_replace('-', '', $accountNumber);
            
            $customer = DB::table('customers_tb')
                ->select('id', 'full_name', 'account_number', 'customer_type', 'address', 'phone_number', 'email', 'meter_number')
                ->whereRaw('REPLACE(account_number, \'-\', \'\') = ?', [$cleanAccountNumber])
                ->first();

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $customer
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching customer details: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customer details by meter number
     */
    public function getByMeterNumber($meterNumber)
    {
        try {
            $customer = DB::table('customers_tb')
                ->select('id', 'full_name', 'account_number', 'customer_type', 'address', 'phone_number', 'email', 'meter_number')
                ->where('meter_number', $meterNumber)
                ->first();

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $customer
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching customer by meter number: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get total count of customers
     */
    public function count()
    {
        $total = DB::table('customers_tb')->count();
        return response()->json(['total' => $total]);
    }

    /**
     * Get count of active customers (those with recent activity)
     */
    public function activeCount()
    {
        $activeCount = DB::table('customers_tb')
            ->join('payment_history_tb', 'customers_tb.account_number', '=', 'payment_history_tb.account_number')
            ->whereMonth('payment_history_tb.payment_date', now()->month)
            ->whereYear('payment_history_tb.payment_date', now()->year)
            ->distinct('customers_tb.account_number')
            ->count('customers_tb.account_number');

        return response()->json(['active_count' => $activeCount]);
    }
} 