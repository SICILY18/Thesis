<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Water Bill Invoice #{{ $invoice->invoice_id }}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.4;
        }
        .invoice-header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        .company-address {
            font-size: 12px;
            color: #666;
            margin-bottom: 15px;
        }
        .invoice-title {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin: 0;
        }
        .invoice-info {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }
        .invoice-info-left, .invoice-info-right {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        .info-section {
            margin-bottom: 20px;
        }
        .info-label {
            font-weight: bold;
            color: #4b5563;
            font-size: 12px;
        }
        .info-value {
            font-size: 14px;
            margin-bottom: 8px;
        }
        .customer-details {
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .details-table th,
        .details-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        .details-table th {
            background-color: #f3f4f6;
            font-weight: bold;
            color: #374151;
            font-size: 12px;
        }
        .details-table td {
            font-size: 14px;
        }
        .amount-section {
            background-color: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .amount-row {
            display: table;
            width: 100%;
            margin-bottom: 10px;
        }
        .amount-label, .amount-value {
            display: table-cell;
        }
        .amount-label {
            font-weight: bold;
            color: #4b5563;
        }
        .amount-value {
            text-align: right;
            font-weight: bold;
        }
        .total-amount {
            font-size: 18px;
            color: #1f2937;
            border-top: 2px solid #2563eb;
            padding-top: 10px;
            margin-top: 10px;
        }
        .payment-info {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            margin-bottom: 30px;
        }
        .footer {
            text-align: center;
            font-size: 10px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-pending {
            background-color: #fef3c7;
            color: #92400e;
        }
        .status-sent {
            background-color: #dbeafe;
            color: #1e40af;
        }
        .status-paid {
            background-color: #d1fae5;
            color: #065f46;
        }
        .status-overdue {
            background-color: #fee2e2;
            color: #991b1b;
        }
    </style>
</head>
<body>
    <div class="invoice-header">
        <div class="company-name">Water Utility Management System</div>
        <div class="company-address">
            123 Main Street, City, State 12345<br>
            Phone: (555) 123-4567 | Email: billing@waterutility.com
        </div>
        <h1 class="invoice-title">WATER BILL INVOICE</h1>
    </div>

    <div class="invoice-info">
        <div class="invoice-info-left">
            <div class="info-section">
                <div class="info-label">INVOICE NUMBER</div>
                <div class="info-value">#{{ $invoice->invoice_id }}</div>
            </div>
            <div class="info-section">
                <div class="info-label">INVOICE DATE</div>
                <div class="info-value">{{ $invoice->invoice_date->format('F d, Y') }}</div>
            </div>
            <div class="info-section">
                <div class="info-label">DUE DATE</div>
                <div class="info-value">{{ $invoice->due_date->format('F d, Y') }}</div>
            </div>
        </div>
        <div class="invoice-info-right">
            <div class="info-section">
                <div class="info-label">METER NUMBER</div>
                <div class="info-value">{{ $invoice->meter_number }}</div>
            </div>
            <div class="info-section">
                <div class="info-label">READING ID</div>
                <div class="info-value">#{{ $invoice->reading_id }}</div>
            </div>
            <div class="info-section">
                <div class="info-label">STATUS</div>
                <div class="info-value">
                    <span class="status-badge status-{{ strtolower($invoice->status) }}">
                        {{ $invoice->status }}
                    </span>
                </div>
            </div>
        </div>
    </div>

    <div class="customer-details">
        <h3 style="margin-top: 0; margin-bottom: 15px; color: #1f2937;">BILL TO:</h3>
        <div style="display: table; width: 100%;">
            <div style="display: table-cell; width: 50%;">
                <div class="info-label">CUSTOMER NAME</div>
                <div class="info-value">{{ $customer->full_name ?? 'N/A' }}</div>
                <div class="info-label">ACCOUNT NUMBER</div>
                <div class="info-value">{{ $customer->account_number ?? 'N/A' }}</div>
                <div class="info-label">ACCOUNT TYPE</div>
                <div class="info-value">{{ ucfirst($customer->customer_type ?? 'N/A') }}</div>
            </div>
            <div style="display: table-cell; width: 50%;">
                <div class="info-label">ADDRESS</div>
                <div class="info-value">{{ $customer->address ?? 'N/A' }}</div>
                <div class="info-label">CONTACT</div>
                <div class="info-value">{{ $customer->contact_number ?? 'N/A' }}</div>
                <div class="info-label">EMAIL</div>
                <div class="info-value">{{ $customer->email ?? 'N/A' }}</div>
            </div>
        </div>
    </div>

    <table class="details-table">
        <thead>
            <tr>
                <th>DESCRIPTION</th>
                <th>METER READING</th>
                <th>RATE</th>
                <th>AMOUNT</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Water Consumption</td>
                <td>{{ $invoice->reading_value }} cubic meters</td>
                <td>Per cubic meter</td>
                <td>₱{{ number_format($invoice->amount, 2) }}</td>
            </tr>
            @if($invoice->notes)
            <tr>
                <td colspan="4">
                    <div class="info-label">NOTES</div>
                    <div style="font-style: italic; color: #6b7280;">{{ $invoice->notes }}</div>
                </td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="amount-section">
        <div class="amount-row">
            <div class="amount-label">Subtotal:</div>
            <div class="amount-value">₱{{ number_format($invoice->amount, 2) }}</div>
        </div>
        <div class="amount-row">
            <div class="amount-label">Service Charge:</div>
            <div class="amount-value">₱0.00</div>
        </div>
        <div class="amount-row">
            <div class="amount-label">Tax:</div>
            <div class="amount-value">₱0.00</div>
        </div>
        <div class="amount-row total-amount">
            <div class="amount-label">TOTAL AMOUNT DUE:</div>
            <div class="amount-value">₱{{ number_format($invoice->amount, 2) }}</div>
        </div>
    </div>

    <div class="payment-info">
        <h4 style="margin-top: 0; color: #92400e;">PAYMENT INSTRUCTIONS</h4>
        <p style="margin: 0; font-size: 12px;">
            Please pay your bill on or before the due date to avoid late charges. 
            Payment can be made at our office, online through our website, or at any authorized payment center.
            @if($invoice->sent_via)
            <br><strong>Sent via:</strong> {{ $invoice->sent_via }}
            @endif
        </p>
    </div>

    <div class="footer">
        <p>Thank you for using our water utility services!</p>
        <p>This is a computer-generated invoice. No signature required.</p>
        <p>Generated on {{ now()->format('F d, Y \a\t g:i A') }}</p>
    </div>
</body>
</html> 