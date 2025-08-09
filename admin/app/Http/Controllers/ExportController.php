<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use App\Services\SupabaseService;

class ExportController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function exportPaymentReportsExcel(Request $request)
    {
        try {
            // Get all payment reports data using SupabaseService
            $payments = $this->supabase->query('bill_payment_validation', '*', [
                'order' => 'payment_date.desc'
            ]);

            // Create CSV content
            $csvContent = "Payment Date,Customer,Account Number,Period,Amount,Payment Method,Reference,Status,Account Type,Bill Amount,Due Date,Validated At\n";

            foreach ($payments as $payment) {
                $csvContent .= sprintf(
                    "%s,%s,%s,%s,%.2f,%s,%s,%s,%s,%.2f,%s,%s\n",
                    isset($payment['payment_date']) ? Carbon::parse($payment['payment_date'])->format('Y-m-d') : 'N/A',
                    $payment['name'] ?? $payment['full_name'] ?? 'N/A',
                    $payment['account_number'] ?? 'N/A',
                    $payment['period'] ?? 'N/A',
                    $payment['amount'] ?? 0,
                    $payment['payment_method'] ?? 'N/A',
                    $payment['reference'] ?? 'N/A',
                    $payment['status'] ?? 'N/A',
                    $payment['account_type'] ?? 'N/A',
                    $payment['bill_amount'] ?? 0,
                    isset($payment['due_date']) ? Carbon::parse($payment['due_date'])->format('Y-m-d') : 'N/A',
                    isset($payment['validated_at']) ? Carbon::parse($payment['validated_at'])->format('Y-m-d H:i:s') : 'N/A'
                );
            }

            $filename = 'payment_reports_' . date('Y-m-d_H-i-s') . '.csv';

            return response($csvContent)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error exporting payment reports: ' . $e->getMessage()
            ], 500);
        }
    }

    public function exportPaymentReportsPdf(Request $request)
    {
        try {
            // Get all payment reports data using SupabaseService
            $payments = $this->supabase->query('bill_payment_validation', '*', [
                'order' => 'payment_date.desc'
            ]);

            $data = [
                'payments' => $payments,
                'title' => 'Payment Reports',
                'generated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'total_records' => count($payments),
                'total_amount' => array_sum(array_column($payments, 'amount'))
            ];

            $pdf = Pdf::loadView('exports.payment-reports-pdf', $data);
            $pdf->setPaper('a4', 'landscape');

            $filename = 'payment_reports_' . date('Y-m-d_H-i-s') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error exporting payment reports PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    public function exportMeterReadingsExcel(Request $request)
    {
        try {
            $accountType = $request->get('accountType');

            // Get meter readings using SupabaseService
            $filters = ['order' => 'reading_date.desc'];
            if ($accountType && $accountType !== 'All') {
                $filters['account_type'] = 'eq.' . $accountType;
            }

            $readings = $this->supabase->query('meter_readings', '*', $filters);

            // Create CSV content
            $csvContent = "Reading Date,Customer Name,Account Number,Meter Number,Reading Value,Amount,Account Type,Remarks\n";
            
            foreach ($readings as $reading) {
                $csvContent .= sprintf(
                    "%s,%s,%s,%s,%s,%.2f,%s,%s\n",
                    isset($reading['reading_date']) ? Carbon::parse($reading['reading_date'])->format('Y-m-d') : 'N/A',
                    $reading['customer_name'] ?? 'N/A',
                    $reading['account_number'] ?? 'N/A',
                    $reading['meter_number'] ?? 'N/A',
                    $reading['reading_value'] ?? 'N/A',
                    $reading['amount'] ?? 0,
                    $reading['account_type'] ?? 'N/A',
                    $reading['remarks'] ?? 'N/A'
                );
            }

            $filename = 'meter_readings_' . date('Y-m-d_H-i-s') . '.csv';

            return response($csvContent)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error exporting meter readings: ' . $e->getMessage()
            ], 500);
        }
    }

    public function exportMeterReadingsPdf(Request $request)
    {
        try {
            $accountType = $request->get('accountType');
            
            $query = DB::table('meter_readings as mr')
                ->leftJoin('customers_tb as c', 'mr.account_number', '=', 'c.account_number')
                ->select([
                    'mr.id',
                    'mr.reading_date',
                    'mr.account_number',
                    'mr.meter_number',
                    'mr.reading_value',
                    'mr.amount',
                    'mr.remarks',
                    'c.full_name as customer_name',
                    'c.account_type'
                ]);

            if ($accountType && $accountType !== 'All') {
                $query->where('c.account_type', $accountType);
            }

            $readings = $query->orderBy('mr.reading_date', 'desc')->get();

            $data = [
                'readings' => $readings,
                'title' => 'Meter Readings Report',
                'account_type_filter' => $accountType,
                'generated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'total_records' => $readings->count(),
                'total_amount' => $readings->sum('amount')
            ];

            $pdf = Pdf::loadView('exports.meter-readings-pdf', $data);
            $pdf->setPaper('a4', 'landscape');

            $filename = 'meter_readings_' . date('Y-m-d_H-i-s') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error exporting meter readings PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    public function exportAnnouncementsExcel(Request $request)
    {
        try {
            $status = $request->get('status');

            $query = DB::table('announcements_tb')
                ->select([
                    'id',
                    'title',
                    'body',
                    'status',
                    'created_at',
                    'updated_at'
                ]);

            if ($status && $status !== 'All') {
                $query->where('status', $status);
            }

            $announcements = $query->orderBy('created_at', 'desc')->get();

            // Create CSV content
            $csvContent = "Title,Body,Status,Created At,Updated At\n";

            foreach ($announcements as $announcement) {
                $csvContent .= sprintf(
                    "%s,%s,%s,%s,%s\n",
                    '"' . str_replace('"', '""', $announcement->title ?? 'N/A') . '"',
                    '"' . str_replace('"', '""', $announcement->body ?? 'N/A') . '"',
                    $announcement->status ?? 'N/A',
                    $announcement->created_at ? Carbon::parse($announcement->created_at)->format('Y-m-d H:i:s') : 'N/A',
                    $announcement->updated_at ? Carbon::parse($announcement->updated_at)->format('Y-m-d H:i:s') : 'N/A'
                );
            }

            $filename = 'announcements_' . date('Y-m-d_H-i-s') . '.csv';

            return response($csvContent)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error exporting announcements: ' . $e->getMessage()
            ], 500);
        }
    }

    public function exportAnnouncementsPdf(Request $request)
    {
        try {
            $status = $request->get('status');

            $query = DB::table('announcements_tb')
                ->select([
                    'id',
                    'title',
                    'body',
                    'status',
                    'created_at',
                    'updated_at'
                ]);

            if ($status && $status !== 'All') {
                $query->where('status', $status);
            }

            $announcements = $query->orderBy('created_at', 'desc')->get();

            $data = [
                'announcements' => $announcements,
                'title' => 'Announcements Report',
                'status_filter' => $status,
                'generated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'total_records' => $announcements->count()
            ];

            $pdf = Pdf::loadView('exports.announcements-pdf', $data);
            $pdf->setPaper('a4', 'portrait');

            $filename = 'announcements_' . date('Y-m-d_H-i-s') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error exporting announcements PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    public function exportAccountsExcel(Request $request)
    {
        try {
            $accountType = $request->get('type');

            $query = DB::table('customers_tb')
                ->select([
                    'id',
                    'full_name',
                    'account_number',
                    'account_type',
                    'address',
                    'contact_number',
                    'email',
                    'status',
                    'created_at'
                ]);

            if ($accountType && $accountType !== 'all') {
                $query->where('account_type', ucfirst($accountType));
            }

            $accounts = $query->orderBy('created_at', 'desc')->get();

            // Create CSV content
            $csvContent = "Full Name,Account Number,Account Type,Address,Contact Number,Email,Status,Created At\n";

            foreach ($accounts as $account) {
                $csvContent .= sprintf(
                    "%s,%s,%s,%s,%s,%s,%s,%s\n",
                    '"' . str_replace('"', '""', $account->full_name ?? 'N/A') . '"',
                    $account->account_number ?? 'N/A',
                    $account->account_type ?? 'N/A',
                    '"' . str_replace('"', '""', $account->address ?? 'N/A') . '"',
                    $account->contact_number ?? 'N/A',
                    $account->email ?? 'N/A',
                    $account->status ?? 'N/A',
                    $account->created_at ? Carbon::parse($account->created_at)->format('Y-m-d H:i:s') : 'N/A'
                );
            }

            $filename = 'accounts_' . date('Y-m-d_H-i-s') . '.csv';

            return response($csvContent)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error exporting accounts: ' . $e->getMessage()
            ], 500);
        }
    }

    public function exportAccountsPdf(Request $request)
    {
        try {
            $accountType = $request->get('type');

            $query = DB::table('customers_tb')
                ->select([
                    'id',
                    'full_name',
                    'account_number',
                    'account_type',
                    'address',
                    'contact_number',
                    'email',
                    'status',
                    'created_at'
                ]);

            if ($accountType && $accountType !== 'all') {
                $query->where('account_type', ucfirst($accountType));
            }

            $accounts = $query->orderBy('created_at', 'desc')->get();

            $data = [
                'accounts' => $accounts,
                'title' => 'Accounts Report',
                'account_type_filter' => $accountType,
                'generated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'total_records' => $accounts->count()
            ];

            $pdf = Pdf::loadView('exports.accounts-pdf', $data);
            $pdf->setPaper('a4', 'landscape');

            $filename = 'accounts_' . date('Y-m-d_H-i-s') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error exporting accounts PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    public function printPaymentReports(Request $request)
    {
        try {
            // Get all payment reports data using SupabaseService
            $payments = $this->supabase->query('bill_payment_validation', '*', [
                'order' => 'payment_date.desc'
            ]);

            $data = [
                'payments' => $payments,
                'title' => 'Payment Reports',
                'generated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'total_records' => count($payments),
                'total_amount' => array_sum(array_column($payments, 'amount'))
            ];

            return view('exports.payment-reports-print', $data);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating payment reports print view: ' . $e->getMessage()
            ], 500);
        }
    }

    public function printMeterReadings(Request $request)
    {
        try {
            $accountType = $request->get('accountType');
            
            $query = DB::table('meter_readings as mr')
                ->leftJoin('customers_tb as c', 'mr.account_number', '=', 'c.account_number')
                ->select([
                    'mr.id',
                    'mr.reading_date',
                    'mr.account_number',
                    'mr.meter_number',
                    'mr.reading_value',
                    'mr.amount',
                    'mr.remarks',
                    'c.full_name as customer_name',
                    'c.account_type'
                ]);

            if ($accountType && $accountType !== 'All') {
                $query->where('c.account_type', $accountType);
            }

            $readings = $query->orderBy('mr.reading_date', 'desc')->get();

            $data = [
                'readings' => $readings,
                'title' => 'Meter Readings Report',
                'account_type_filter' => $accountType,
                'generated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'total_records' => $readings->count(),
                'total_amount' => $readings->sum('amount')
            ];

            return view('exports.meter-readings-print', $data);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating meter readings print view: ' . $e->getMessage()
            ], 500);
        }
    }

    public function printAnnouncements(Request $request)
    {
        try {
            $status = $request->get('status');

            $query = DB::table('announcements_tb')
                ->select([
                    'id',
                    'title',
                    'body',
                    'status',
                    'created_at',
                    'updated_at'
                ]);

            if ($status && $status !== 'All') {
                $query->where('status', $status);
            }

            $announcements = $query->orderBy('created_at', 'desc')->get();

            $data = [
                'announcements' => $announcements,
                'title' => 'Announcements Report',
                'status_filter' => $status,
                'generated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'total_records' => $announcements->count()
            ];

            return view('exports.announcements-print', $data);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating announcements print view: ' . $e->getMessage()
            ], 500);
        }
    }

    public function printAccounts(Request $request)
    {
        try {
            $accountType = $request->get('type');

            $query = DB::table('customers_tb')
                ->select([
                    'id',
                    'full_name',
                    'account_number',
                    'account_type',
                    'address',
                    'contact_number',
                    'email',
                    'status',
                    'created_at'
                ]);

            if ($accountType && $accountType !== 'all') {
                $query->where('account_type', ucfirst($accountType));
            }

            $accounts = $query->orderBy('created_at', 'desc')->get();

            $data = [
                'accounts' => $accounts,
                'title' => 'Accounts Report',
                'account_type_filter' => $accountType,
                'generated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'total_records' => $accounts->count()
            ];

            return view('exports.accounts-print', $data);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating accounts print view: ' . $e->getMessage()
            ], 500);
        }
    }
}
