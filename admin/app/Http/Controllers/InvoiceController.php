<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with(['customer']);

        // Filter by account type (via customer relationship)
        if ($request->filled('account_type') && $request->account_type !== 'All') {
            $query->whereHas('customer', function ($q) use ($request) {
                $q->where('account_type', $request->account_type);
            });
        }

        // Filter by status
        if ($request->filled('status') && $request->status !== 'All') {
            $query->where('status', $request->status);
        }

        // Filter by invoice date (using month format)
        if ($request->filled('period')) {
            $period = $request->period; // Expected format: YYYY-MM
            $query->whereYear('invoice_date', substr($period, 0, 4))
                  ->whereMonth('invoice_date', substr($period, 5, 2));
        }

        // Search by customer name, account number, or meter number
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('meter_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($customerQuery) use ($search) {
                      $customerQuery->where('name', 'like', "%{$search}%")
                                   ->orWhere('account_number', 'like', "%{$search}%");
                  });
            });
        }

        $invoices = $query->orderBy('invoice_date', 'desc')->get();

        // Add customer data to each invoice for frontend
        $invoices->each(function ($invoice) {
            if ($invoice->customer) {
                $invoice->customer_name = $invoice->customer->name;
                $invoice->account_number = $invoice->customer->account_number;
                $invoice->account_type = $invoice->customer->account_type;
            }
        });

        return response()->json($invoices);
    }

    /**
     * Store a newly created invoice.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers_tb,id',
            'reading_id' => 'required|exists:meter_readings,id',
            'due_date' => 'required|date',
            'reading_value' => 'required|integer|min:0',
            'meter_number' => 'required|string|max:50',
            'amount' => 'required|numeric|min:0',
            'sent_via' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
        ]);

        // Create invoice
        $invoice = Invoice::create([
            'customer_id' => $validated['customer_id'],
            'reading_id' => $validated['reading_id'],
            'invoice_date' => now(),
            'due_date' => $validated['due_date'],
            'reading_value' => $validated['reading_value'],
            'meter_number' => $validated['meter_number'],
            'amount' => $validated['amount'],
            'status' => 'Pending',
            'sent_via' => $validated['sent_via'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Load customer relationship for response
        $invoice->load('customer');

        return response()->json($invoice, 201);
    }

    /**
     * Generate bulk invoices for multiple customers.
     */
    public function bulkGenerate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'invoices' => 'required|array',
            'invoices.*.customer_id' => 'required|exists:customers_tb,id',
            'invoices.*.reading_id' => 'required|exists:meter_readings,id',
            'invoices.*.due_date' => 'required|date',
            'invoices.*.reading_value' => 'required|integer|min:0',
            'invoices.*.meter_number' => 'required|string|max:50',
            'invoices.*.amount' => 'required|numeric|min:0',
            'invoices.*.sent_via' => 'nullable|string|max:20',
            'invoices.*.notes' => 'nullable|string',
        ]);

        $createdInvoices = [];

        foreach ($validated['invoices'] as $invoiceData) {
            $invoice = Invoice::create([
                'customer_id' => $invoiceData['customer_id'],
                'reading_id' => $invoiceData['reading_id'],
                'invoice_date' => now(),
                'due_date' => $invoiceData['due_date'],
                'reading_value' => $invoiceData['reading_value'],
                'meter_number' => $invoiceData['meter_number'],
                'amount' => $invoiceData['amount'],
                'status' => 'Pending',
                'sent_via' => $invoiceData['sent_via'] ?? null,
                'notes' => $invoiceData['notes'] ?? null,
            ]);

            $invoice->load('customer');
            $createdInvoices[] = $invoice;
        }

        return response()->json([
            'message' => 'Invoices generated successfully',
            'count' => count($createdInvoices),
            'invoices' => $createdInvoices
        ]);
    }

    /**
     * Display the specified invoice.
     */
    public function show(Invoice $invoice): JsonResponse
    {
        $invoice->load('customer');
        
        // Add customer data for frontend compatibility
        if ($invoice->customer) {
            $invoice->customer_name = $invoice->customer->name;
            $invoice->account_number = $invoice->customer->account_number;
            $invoice->account_type = $invoice->customer->account_type;
        }

        return response()->json($invoice);
    }

    /**
     * Update the specified invoice.
     */
    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:Pending,Sent,Paid,Overdue,Cancelled',
            'notes' => 'sometimes|string',
            'due_date' => 'sometimes|date',
            'sent_via' => 'sometimes|string|max:20',
            'pdf_url' => 'sometimes|url',
            'amount' => 'sometimes|numeric|min:0',
        ]);

        $invoice->update($validated);
        $invoice->load('customer');

        return response()->json($invoice);
    }

    /**
     * Remove the specified invoice.
     */
    public function destroy(Invoice $invoice): JsonResponse
    {
        $invoice->delete();

        return response()->json(['message' => 'Invoice deleted successfully']);
    }

    /**
     * Generate invoice from meter reading
     */
    public function generateFromReading(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'meter_reading_id' => 'required|integer',
                'customer_id' => 'nullable|integer',
                'meter_number' => 'required|string',
                'reading_value' => 'required|numeric',
                'amount' => 'required|numeric|min:0',
                'staff_id' => 'required|integer',
                'reading_date' => 'required|date'
            ]);

            // Check if customer exists in database
            $customer = null;
            if ($validated['customer_id']) {
                $customer = \DB::table('customers_tb')->where('id', $validated['customer_id'])->first();
            }
            
            // If no customer found by ID, try to find by meter number
            if (!$customer) {
                $customer = \DB::table('customers_tb')->where('meter_number', $validated['meter_number'])->first();
            }

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found for this meter reading'
                ], 404);
            }

            // Calculate due date (30 days from reading date)
            $readingDate = new \DateTime($validated['reading_date']);
            $dueDate = $readingDate->modify('+30 days');

            // Create invoice record first
            $invoice = Invoice::create([
                'customer_id' => $customer->id,
                'reading_id' => $validated['meter_reading_id'],
                'invoice_date' => now(),
                'due_date' => $dueDate,
                'reading_value' => $validated['reading_value'],
                'meter_number' => $validated['meter_number'],
                'amount' => $validated['amount'],
                'status' => 'Pending',
                'notes' => "Auto-generated from meter reading #{$validated['meter_reading_id']} by staff #{$validated['staff_id']}"
            ]);

            // Load customer relationship for PDF generation
            $invoice->load('customer');

            // Generate PDF
            $pdf = Pdf::loadView('invoice-template', [
                'invoice' => $invoice,
                'customer' => $customer
            ]);

            // Create directory if it doesn't exist
            $invoiceDir = 'invoices/' . date('Y/m');
            if (!Storage::disk('public')->exists($invoiceDir)) {
                Storage::disk('public')->makeDirectory($invoiceDir);
            }

            // Generate filename
            $filename = "invoice_{$invoice->invoice_id}_{$customer->account_number}_" . date('Y-m-d') . ".pdf";
            $filepath = $invoiceDir . '/' . $filename;

            // Save PDF to storage
            $pdfContent = $pdf->output();
            Storage::disk('public')->put($filepath, $pdfContent);

            // Update invoice with PDF URL
            $pdfUrl = Storage::disk('public')->url($filepath);
            $invoice->update(['pdf_url' => $pdfUrl]);

            // Update invoice status to 'Sent' since PDF was generated successfully
            $invoice->update(['status' => 'Sent']);

            return response()->json([
                'success' => true,
                'message' => 'Invoice PDF generated successfully',
                'invoice' => $invoice,
                'pdf_url' => $pdfUrl,
                'pdf_filename' => $filename
            ]);

        } catch (\Exception $e) {
            \Log::error('Error generating invoice from reading: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Error generating invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download invoice PDF
     */
    public function downloadPdf($invoiceId): mixed
    {
        try {
            $invoice = Invoice::findOrFail($invoiceId);
            
            if (!$invoice->pdf_url) {
                return response()->json([
                    'success' => false,
                    'message' => 'PDF not found for this invoice'
                ], 404);
            }

            // Extract file path from URL
            $urlPath = parse_url($invoice->pdf_url, PHP_URL_PATH);
            $filePath = str_replace('/storage/', '', $urlPath);
            
            if (!Storage::disk('public')->exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'PDF file not found in storage'
                ], 404);
            }

            // Get file content and return as download
            $fileContent = Storage::disk('public')->get($filePath);
            $filename = basename($filePath);

            return response($fileContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');

        } catch (\Exception $e) {
            \Log::error('Error downloading invoice PDF: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error downloading PDF: ' . $e->getMessage()
            ], 500);
        }
    }
} 