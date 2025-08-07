<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\SemaphoreService;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SMSConfigurationController extends Controller
{
    protected $smsService;

    public function __construct(SemaphoreService $smsService)
    {
        $this->middleware(['web', 'admin.auth']);
        $this->smsService = $smsService;
    }

    public function index()
    {
        try {
            // Get customers with unpaid bills due in the next 4 days
            $dueSoonCustomers = $this->getCustomersWithDueBills();

            return Inertia::render('SMSConfiguration', [
                'apiKey' => !empty(config('services.semaphore.api_key')),
                'dueSoonCustomers' => $dueSoonCustomers,
                'title' => 'SMS Configuration'
            ]);
        } catch (\Exception $e) {
            Log::error('SMS Configuration Error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            return Inertia::render('SMSConfiguration', [
                'apiKey' => !empty(config('services.semaphore.api_key')),
                'dueSoonCustomers' => [],
                'error' => 'Failed to load customers. Please try again later.',
                'title' => 'SMS Configuration'
            ]);
        }
    }

    public function getCustomersWithDueBills()
    {
        try {
            // Get customers with bills due in the next 4 days
            $startDate = now();
            $endDate = now()->addDays(4);
            
            Log::info('Searching for bills between:', [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d')
            ]);

            $query = DB::table('billing_cycles_tb')
                ->join('customers_tb', 'billing_cycles_tb.customer_id', '=', 'customers_tb.id')
                ->select(
                    'customers_tb.id',
                    'customers_tb.full_name as name',
                    'customers_tb.account_number',
                    'customers_tb.phone_number',
                    'billing_cycles_tb.amount_due as amount',
                    'billing_cycles_tb.billing_start_date',
                    'billing_cycles_tb.billing_end_date as due_date',
                    'billing_cycles_tb.bill_status as status',
                    DB::raw("CONCAT(TO_CHAR(billing_cycles_tb.billing_start_date, 'Month YYYY'), ' - ', TO_CHAR(billing_cycles_tb.billing_end_date, 'Month YYYY')) as billing_period")
                )
                ->where('billing_cycles_tb.bill_status', '=', 'unpaid')
                ->whereNotNull('customers_tb.phone_number')
                ->where('billing_cycles_tb.billing_end_date', '<=', $endDate)
                ->where('billing_cycles_tb.billing_end_date', '>=', $startDate)
                ->orderBy('customers_tb.account_number');

            // Log the raw SQL query
            $bindings = $query->getBindings();
            $sql = str_replace(['?'], array_map(function ($binding) {
                return is_string($binding) ? "'" . $binding . "'" : $binding;
            }, $bindings), $query->toSql());
            Log::info('Raw SQL Query:', ['sql' => $sql]);

            $results = $query->get();
            
            // Log the final results
            Log::info('Final Results:', [
                'count' => count($results),
                'records' => $results->map(function($record) {
                    return [
                        'account_number' => $record->account_number,
                        'billing_start_date' => $record->billing_start_date,
                        'due_date' => $record->due_date,
                        'status' => $record->status,
                        'has_phone' => !empty($record->phone_number),
                        'name' => $record->name,
                        'amount' => $record->amount
                    ];
                })
            ]);
            
            return $results;
        } catch (\Exception $e) {
            Log::error('Error in getCustomersWithDueBills: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            throw $e;
        }
    }

    public function sendBulkReminders(Request $request)
    {
        try {
            $request->validate([
                'customerIds' => 'required|array',
                'customerIds.*' => 'required|integer',
                'message' => 'required|string'
            ]);

            // Get customer billing information
            $customers = DB::table('customers_tb')
                ->join('billing_cycles_tb', 'customers_tb.id', '=', 'billing_cycles_tb.customer_id')
                ->whereIn('customers_tb.id', $request->customerIds)
                ->where('billing_cycles_tb.bill_status', '=', 'unpaid')
                ->select(
                    'customers_tb.phone_number',
                    'billing_cycles_tb.amount_due',
                    'billing_cycles_tb.billing_end_date',
                    DB::raw("CONCAT(
                        TO_CHAR(billing_cycles_tb.billing_start_date, 'Month YYYY'),
                        ' - ',
                        TO_CHAR(billing_cycles_tb.billing_end_date, 'Month YYYY')
                    ) as billing_period")
                )
                ->get();

            if ($customers->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'error' => 'No valid customers found with unpaid bills'
                ]);
            }

            $successCount = 0;
            $failedCount = 0;

            foreach ($customers as $customer) {
                // Format the message with customer's billing information
                $messageText = str_replace(
                    ['{billing_period}', '{amount}', '{due_date}'],
                    [
                        $customer->billing_period,
                        number_format($customer->amount_due, 2),
                        date('F j, Y', strtotime($customer->billing_end_date))
                    ],
                    $request->message
                );

                // Send SMS
                $result = $this->smsService->sendSMS(
                    $customer->phone_number,
                    $messageText
                );

                if ($result['success']) {
                    $successCount++;
                } else {
                    $failedCount++;
                    Log::error('Failed to send SMS to ' . $customer->phone_number, $result);
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Successfully sent {$successCount} messages. Failed to send {$failedCount} messages."
            ]);
        } catch (\Exception $e) {
            Log::error('Error in sendBulkReminders: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to send reminders. Please try again later.'
            ], 500);
        }
    }

    public function testSMS(Request $request)
    {
        $request->validate([
            'phoneNumber' => 'required|string|regex:/^09\d{9}$/',
            'message' => 'required|string|max:160',
        ]);

        $result = $this->smsService->sendSMS(
            $request->phoneNumber,
            $request->message
        );

        return response()->json($result);
    }

    public function getDefaultTemplate()
    {
        return response()->json([
            'template' => "Dear valued customer,\n\nThis is a reminder that your water bill for {billing_period} amounting to ₱{amount} is due on {due_date}. Please settle your bill to avoid any service interruption.\n\nThank you,\nHermosa Water District"
        ]);
    }

    public function getCustomersByEndDate(Request $request)
    {
        try {
            DB::enableQueryLog();
            
            // First, let's see all billing cycles in the table
            $allBillingCycles = DB::table('billing_cycles_tb')
                ->select([
                    'customer_id',
                    'billing_start_date',
                    'billing_end_date',
                    'bill_status',
                    'amount_due'
                ])
                ->get();
                
            Log::info('All billing cycles in the table:', ['billing_cycles' => $allBillingCycles]);
            
            $request->validate([
                'end_date' => 'required|date'
            ]);

            $selectedDate = Carbon::parse($request->end_date)->format('Y-m-d');
            
            Log::info('Selected date for comparison:', [
                'raw_input' => $request->end_date,
                'parsed_date' => $selectedDate,
                'carbon_instance' => Carbon::parse($request->end_date)->toDateTimeString()
            ]);

            // Get customers with unpaid bills for the selected date
            $customers = DB::table('billing_cycles_tb')
                ->join('customers_tb', 'billing_cycles_tb.customer_id', '=', 'customers_tb.id')
                ->select([
                    'customers_tb.id',
                    'customers_tb.full_name as name',
                    'customers_tb.account_number',
                    'customers_tb.phone_number',
                    'billing_cycles_tb.amount_due as amount',
                    'billing_cycles_tb.billing_start_date',
                    'billing_cycles_tb.billing_end_date as due_date',
                    'billing_cycles_tb.bill_status as status',
                    DB::raw("billing_cycles_tb.billing_end_date::date as formatted_end_date"),
                    DB::raw("CONCAT(billing_cycles_tb.billing_start_date::date, ' - ', billing_cycles_tb.billing_end_date::date) as billing_period")
                ])
                ->where('billing_cycles_tb.bill_status', '=', 'unpaid')
                ->whereRaw("billing_cycles_tb.billing_end_date::date = ?", [$selectedDate])
                ->whereNotNull('customers_tb.phone_number')
                ->orderBy('customers_tb.account_number', 'asc');

            // Log the SQL query
            Log::info('SQL Query:', [
                'query' => $customers->toSql(),
                'bindings' => $customers->getBindings()
            ]);

            $results = $customers->get();

            Log::info('Query results:', [
                'selected_date' => $selectedDate,
                'customer_count' => $results->count(),
                'customers' => $results
            ]);

            return response()->json([
                'selected_date' => $selectedDate,
                'customer_count' => $results->count(),
                'customers' => $results
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching customers by end date: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json([
                'error' => 'Failed to fetch customers. ' . $e->getMessage()
            ], 500);
        }
    }
} 