<?php

namespace App\Http\Controllers;

use App\Models\MeterReading;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\SupabaseService;

class MeterReadingController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    /**
     * Display a listing of meter readings with all data from Supabase.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $accountNumber = $request->query('account_number');
            $meterNumber = $request->query('meter_number'); // <-- add this
            $accountType = $request->query('accountType');
            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 10);
            
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
                    'customers_tb.full_name as customer_name',
                    'customers_tb.account_number',
                    'customers_tb.customer_type as account_type'
                ]);

            // If account number is provided, filter by it
            if ($accountNumber) {
                $query->where('customers_tb.account_number', $accountNumber);
            }
            // If meter number is provided, filter by it
            if ($meterNumber) {
                $query->where('meter_readings.meter_number', $meterNumber);
            }
            // If account type is provided and not 'All', filter by it
            if ($accountType && $accountType !== 'All') {
                $query->where('customers_tb.customer_type', $accountType);
            }

            // Order by reading date descending
            $query->orderBy('meter_readings.reading_date', 'desc');

            // Paginate the results
            $readings = $query->paginate($perPage, ['*'], 'page', $page);

            Log::info('Fetched meter readings', [
                'total' => $readings->total(),
                'per_page' => $readings->perPage(),
                'current_page' => $readings->currentPage(),
                'last_page' => $readings->lastPage()
            ]);
                
                return response()->json([
                    'success' => true,
                'data' => $readings
                ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch meter readings: ' . $e->getMessage(), [
                'account_number' => $request->query('account_number'),
                'meter_number' => $request->query('meter_number'),
                'account_type' => $request->query('accountType'),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch meter readings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created meter reading.
     */
    public function store(Request $request)
    {
        try {
        $validated = $request->validate([
                'meter_number' => 'required|string',
                'reading_value' => 'required|numeric|min:0',
                'amount' => 'required|numeric|min:0',
            'remarks' => 'nullable|string',
                'staff_id' => 'required|exists:staff_tb,id',
                'reading_date' => 'required|date'
            ]);

            $meterReading = DB::table('meter_readings')->insert([
            'meter_number' => $validated['meter_number'],
                'reading_value' => $validated['reading_value'],
                'amount' => $validated['amount'],
                'remarks' => $validated['remarks'],
                'staff_id' => $validated['staff_id'],
            'reading_date' => $validated['reading_date'],
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'message' => 'Meter reading created successfully',
                'data' => $meterReading
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to create meter reading: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create meter reading',
                'error' => $e->getMessage()
            ], 500);
        }
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
    public function update(Request $request, $id): JsonResponse
    {
        try {
            Log::info('Starting meter reading update', [
                'id' => $id,
                'request_data' => $request->all()
            ]);

            // First check if the reading exists
            $reading = DB::table('meter_readings')->where('id', $id)->first();
            
            if (!$reading) {
                Log::warning('Meter reading not found', ['id' => $id]);
                return response()->json([
                    'message' => 'Meter reading not found'
                ], 404);
            }

            Log::info('Found existing meter reading', [
                'reading' => $reading
            ]);

            try {
                // Only validate the fields we actually want to update
                $updateData = $request->validate([
                    'reading_value' => 'required|numeric|min:0',
                    'amount' => 'required|numeric|min:0',
                    'remarks' => 'nullable|string'
                ]);

                Log::info('Validation passed', [
                    'validated_data' => $updateData
                ]);

                // Update only the necessary fields
                $updated = DB::table('meter_readings')
                    ->where('id', $id)
                    ->update($updateData);

                if (!$updated) {
                    throw new \Exception('Failed to update meter reading in database');
                }

                // Get the updated reading
                $updatedReading = DB::table('meter_readings')
                    ->where('id', $id)
                    ->first();

                Log::info('Meter reading updated successfully', [
                    'id' => $id,
                    'updated_data' => $updatedReading
                ]);

                return response()->json([
                    'message' => 'Meter reading updated successfully',
                    'data' => $updatedReading
                ]);

            } catch (\Illuminate\Validation\ValidationException $e) {
                Log::error('Validation failed', [
                    'errors' => $e->errors(),
                    'request_data' => $request->all()
                ]);
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Failed to update meter reading', [
                'id' => $id,
                'request_data' => $request->all(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to update meter reading: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
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

    /**
     * Get meter readings by account number
     */
    public function getMeterReadings(Request $request): JsonResponse
    {
        try {
            $accountNumber = $request->query('account_number');
            
            if (!$accountNumber) {
                return response()->json([
                    'success' => false,
                    'message' => 'Account number is required'
                ], 400);
            }

            \Log::info('Fetching meter readings - Input', [
                'raw_account_number' => $accountNumber
            ]);

            // Get meter readings with customer information in one query
            $readings = DB::table('meter_readings as mr')
                ->join('customers_tb as c', 'mr.meter_number', '=', 'c.meter_number')
                ->where('c.account_number', $accountNumber)
                ->orWhere('c.account_number', str_replace('-', '', $accountNumber))
                ->select([
                    'mr.id',
                    'mr.meter_number',
                    'mr.reading_value',
                    'mr.amount',
                    'mr.remarks',
                    'mr.staff_id',
                    'mr.reading_date',
                    'mr.created_at',
                    'c.full_name as customer_name',
                    'c.account_number',
                    'c.customer_type',
                    'c.id as customer_id'
                ])
                ->orderBy('mr.id', 'desc')
                ->get();

            \Log::info('Meter readings query result', [
                'readings_found' => $readings->count(),
                'first_reading' => $readings->first(),
                'sql' => DB::table('meter_readings as mr')
                    ->join('customers_tb as c', 'mr.meter_number', '=', 'c.meter_number')
                    ->where('c.account_number', $accountNumber)
                    ->orWhere('c.account_number', str_replace('-', '', $accountNumber))
                    ->select('*')
                    ->orderBy('mr.id', 'desc')
                    ->toSql()
            ]);

            return response()->json([
                'success' => true,
                'data' => $readings
            ]);

        } catch (\Exception $e) {
            \Log::error('Get meter readings error', [
                'exception' => $e->getMessage(),
                'account_number' => $accountNumber,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch meter readings: ' . $e->getMessage()
            ], 500);
        }
    }
} 