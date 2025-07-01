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
                ->select('id', 'full_name', 'account_number', 'customer_type', 'address', 'contact_number', 'email', 'meter_number', 'created_at')
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
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:customers_tb',
            'password' => 'required|string|min:8',
            'customer_type' => 'required|in:residential,commercial,government',
            'address' => 'required|string|max:255',
            'contact_number' => 'required|string|max:20',
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
            DB::table('customers_tb')->insert([
                'name' => $request->name,
                'username' => $request->username,
                'password' => Hash::make($request->password),
                'customer_type' => $request->customer_type,
                'address' => $request->address,
                'contact_number' => $request->contact_number,
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
            $customer = DB::table('customers_tb')
                ->select('id', 'full_name', 'account_number', 'customer_type', 'address', 'contact_number', 'email', 'meter_number')
                ->where('account_number', $accountNumber)
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
} 