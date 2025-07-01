<?php

namespace App\Http\Controllers;

use App\Models\MeterReading;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class MeterReadingController extends Controller
{
    /**
     * Display a listing of meter readings with all data from Supabase.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DB::table('meter_readings')
                ->join('customers_tb', 'meter_readings.meter_number', '=', 'customers_tb.meter_number')
                ->select([
                    'meter_readings.id',
                    'meter_readings.meter_number',
                    'meter_readings.reading_value',
                    'meter_readings.amount',
                    'meter_readings.remarks',
                    'meter_readings.reading_date',
                    'meter_readings.created_at',
                    'meter_readings.staff_id',
                    'customers_tb.id as customer_id',
                    'customers_tb.full_name as customer_name',
                    'customers_tb.account_number',
                    'customers_tb.customer_type'
                ]);

            // Filter by account type if provided
            if ($request->has('accountType') && $request->accountType !== 'All') {
                $query->where('customers_tb.customer_type', strtolower($request->accountType));
            }

            // Check if pagination is requested
            if ($request->has('per_page') && $request->per_page > 0) {
                // Return paginated data
                $perPage = $request->get('per_page', 10);
                $meterReadings = $query->orderBy('meter_readings.created_at', 'desc')->paginate($perPage);
                
                return response()->json([
                    'success' => true,
                    'data' => $meterReadings
                ]);
            } else {
                // Return all data without pagination
                $meterReadings = $query->orderBy('meter_readings.created_at', 'desc')->get();
                
                return response()->json([
                    'success' => true,
                    'data' => $meterReadings
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Meter readings error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch meter readings',
                'data' => []
            ]);
        }
    }

    /**
     * Store a newly created meter reading.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers_tb,id',
            'meter_number' => 'required|string|max:50',
            'reading_date' => 'required|date',
            'previous_reading' => 'required|integer|min:0',
            'current_reading' => 'required|integer|min:0',
            'rate_id' => 'nullable|exists:rates_tb,id',
            'remarks' => 'nullable|string',
        ]);

        // Calculate consumption
        $consumption = max(0, $validated['current_reading'] - $validated['previous_reading']);
        
        // Calculate amount (you might want to get rate from rates table)
        $amount = $consumption * 25; // Default rate, should be fetched from rates table

        $meterReading = MeterReading::create([
            'customer_id' => $validated['customer_id'],
            'meter_number' => $validated['meter_number'],
            'reading_date' => $validated['reading_date'],
            'previous_reading' => $validated['previous_reading'],
            'current_reading' => $validated['current_reading'],
            'consumption' => $consumption,
            'rate_id' => $validated['rate_id'],
            'amount' => $amount,
            'status' => 'Recorded',
            'remarks' => $validated['remarks'],
        ]);

        $meterReading->load('customer');

        return response()->json($meterReading, 201);
    }

    /**
     * Display the specified meter reading.
     */
    public function show(MeterReading $meterReading): JsonResponse
    {
        $meterReading->load('customer');
        
        // Add customer data for frontend compatibility
        if ($meterReading->customer) {
            $meterReading->customer_name = $meterReading->customer->name;
            $meterReading->account_number = $meterReading->customer->account_number;
            $meterReading->account_type = $meterReading->customer->account_type;
        }

        return response()->json($meterReading);
    }

    /**
     * Update the specified meter reading.
     */
    public function update(Request $request, MeterReading $meterReading): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:Recorded,Invoiced,Corrected',
            'remarks' => 'sometimes|string',
            'current_reading' => 'sometimes|integer|min:0',
        ]);

        // Recalculate consumption if current_reading is updated
        if (isset($validated['current_reading'])) {
            $validated['consumption'] = max(0, $validated['current_reading'] - $meterReading->previous_reading);
            $validated['amount'] = $validated['consumption'] * 25; // Update with proper rate
        }

        $meterReading->update($validated);
        $meterReading->load('customer');

        return response()->json($meterReading);
    }

    /**
     * Remove the specified meter reading.
     */
    public function destroy(MeterReading $meterReading): JsonResponse
    {
        $meterReading->delete();

        return response()->json(['message' => 'Meter reading deleted successfully']);
    }

    /**
     * Get meter reading with customer information for invoice generation.
     */
    public function getWithCustomer($id): JsonResponse
    {
        try {
            // Get the meter reading
            $meterReading = DB::table('meter_readings')->where('id', $id)->first();
            if (!$meterReading) {
                return response()->json(['success' => false, 'message' => 'Meter reading not found'], 404);
            }
            // Use LIKE to match meter_number in customers_tb for robustness
            $customer = DB::table('customers_tb')
                ->where('meter_number', 'LIKE', '%' . $meterReading->meter_number . '%')
                ->first();
            if (!$customer) {
                return response()->json(['success' => false, 'message' => 'Customer not found for this meter number'], 404);
            }
            // Combine data
            $result = [
                'meter_reading' => $meterReading,
                'customer' => [
                    'full_name' => $customer->full_name,
                    'address' => $customer->address,
                    'account_number' => $customer->account_number,
                    'contact_number' => $customer->contact_number,
                    'customer_type' => $customer->customer_type,
                ]
            ];
            return response()->json(['success' => true, 'data' => $result]);
        } catch (\Exception $e) {
            \Log::error('Get meter reading with customer error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to fetch meter reading with customer']);
        }
    }
} 