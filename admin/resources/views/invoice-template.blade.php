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
        .reading-details {
            background-color: #f0f9ff;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .reading-row {
            display: table;
            width: 100%;
            margin-bottom: 10px;
        }
        .reading-label, .reading-value {
            display: table-cell;
            width: 50%;
        }
        .reading-label {
            font-weight: bold;
            color: #4b5563;
        }
        .conservation-tips {
            background-color: #ecfdf5;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .tip-item {
            margin-bottom: 8px;
            font-size: 12px;
            color: #065f46;
        }
        .payment-methods {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .method-item {
            margin-bottom: 8px;
            font-size: 12px;
        }
        .contact-info {
            background-color: #eff6ff;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            font-size: 12px;
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
            <div class="info-section">
                <div class="info-label">BILLING PERIOD</div>
                <div class="info-value">{{ $invoice->billing_start_date->format('F d, Y') }} - {{ $invoice->billing_end_date->format('F d, Y') }}</div>
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
            <div class="info-section">
                <div class="info-label">NUMBER OF DAYS</div>
                <div class="info-value">{{ $invoice->billing_days }} days</div>
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

    <div class="reading-details">
        <h3 style="margin-top: 0; margin-bottom: 15px; color: #1f2937;">METER READING DETAILS:</h3>
        <div class="reading-row">
            <div class="reading-label">Previous Reading Date:</div>
            <div class="reading-value">{{ $invoice->previous_reading_date->format('F d, Y') }}</div>
        </div>
        <div class="reading-row">
            <div class="reading-label">Previous Reading:</div>
            <div class="reading-value">{{ $invoice->previous_reading }} cubic meters</div>
        </div>
        <div class="reading-row">
            <div class="reading-label">Current Reading Date:</div>
            <div class="reading-value">{{ $invoice->current_reading_date->format('F d, Y') }}</div>
        </div>
        <div class="reading-row">
            <div class="reading-label">Current Reading:</div>
            <div class="reading-value">{{ $invoice->current_reading }} cubic meters</div>
        </div>
        <div class="reading-row">
            <div class="reading-label">Total Consumption:</div>
            <div class="reading-value">{{ $invoice->consumption }} cubic meters</div>
        </div>
    </div>

    <table class="details-table">
        <thead>
            <tr>
                <th>DESCRIPTION</th>
                <th>RATE</th>
                <th>CONSUMPTION</th>
                <th>AMOUNT</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Base Rate</td>
                <td>₱{{ number_format($invoice->base_rate, 2) }}</td>
                <td>-</td>
                <td>₱{{ number_format($invoice->base_rate, 2) }}</td>
            </tr>
            <tr>
                <td>Water Consumption</td>
                <td>₱{{ number_format($invoice->consumption_rate, 2) }}/m³</td>
                <td>{{ $invoice->consumption }} m³</td>
                <td>₱{{ number_format($invoice->consumption_charge, 2) }}</td>
            </tr>
            @if($invoice->environmental_fee > 0)
            <tr>
                <td>Environmental Fee</td>
                <td>-</td>
                <td>-</td>
                <td>₱{{ number_format($invoice->environmental_fee, 2) }}</td>
            </tr>
            @endif
            @if($invoice->maintenance_fee > 0)
            <tr>
                <td>Maintenance Fee</td>
                <td>-</td>
                <td>-</td>
                <td>₱{{ number_format($invoice->maintenance_fee, 2) }}</td>
            </tr>
            @endif
            @if($invoice->previous_balance > 0)
            <tr>
                <td>Previous Balance</td>
                <td>-</td>
                <td>-</td>
                <td>₱{{ number_format($invoice->previous_balance, 2) }}</td>
            </tr>
            @endif
            @if($invoice->late_payment_charge > 0)
            <tr>
                <td>Late Payment Charge</td>
                <td>-</td>
                <td>-</td>
                <td>₱{{ number_format($invoice->late_payment_charge, 2) }}</td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="amount-section">
        <div class="amount-row">
            <div class="amount-label">Subtotal:</div>
            <div class="amount-value">₱{{ number_format($invoice->subtotal, 2) }}</div>
        </div>
        @if($invoice->discount > 0)
        <div class="amount-row">
            <div class="amount-label">Discount:</div>
            <div class="amount-value">-₱{{ number_format($invoice->discount, 2) }}</div>
        </div>
        @endif
        <div class="amount-row total-amount">
            <div class="amount-label">TOTAL AMOUNT DUE:</div>
            <div class="amount-value">₱{{ number_format($invoice->total_amount, 2) }}</div>
        </div>
    </div>

    <div class="payment-info">
        <h4 style="margin-top: 0; color: #92400e;">PAYMENT INFORMATION</h4>
        <p style="margin-bottom: 5px;">Please pay on or before: <strong>{{ $invoice->due_date->format('F d, Y') }}</strong></p>
        <p style="margin-bottom: 5px;">A late payment charge of 2% will be added to unpaid balances after the due date.</p>
        @if($invoice->status === 'OVERDUE')
        <p style="color: #991b1b; font-weight: bold;">DISCONNECTION NOTICE: Service may be disconnected if payment is not received within 48 hours.</p>
        @endif
    </div>

    <div class="payment-methods">
        <h4 style="margin-top: 0; color: #1f2937;">PAYMENT METHODS</h4>
        <div class="method-item">• Cash payment at our office during business hours</div>
        <div class="method-item">• Online bank transfer</div>
        <div class="method-item">• Mobile payment apps (GCash, Maya)</div>
        <div class="method-item">• Authorized payment centers</div>
    </div>

    <div class="conservation-tips">
        <h4 style="margin-top: 0; color: #065f46;">WATER CONSERVATION TIPS</h4>
        <div class="tip-item">• Fix leaky faucets and pipes promptly</div>
        <div class="tip-item">• Use water-efficient fixtures and appliances</div>
        <div class="tip-item">• Water plants during early morning or late evening</div>
        <div class="tip-item">• Collect and use rainwater for gardening</div>
    </div>

    <div class="contact-info">
        <h4 style="margin-top: 0; color: #1e40af;">CONTACT INFORMATION</h4>
        <p><strong>Customer Service:</strong> (555) 123-4567</p>
        <p><strong>Emergency Hotline:</strong> (555) 987-6543</p>
        <p><strong>Email:</strong> support@waterutility.com</p>
        <p><strong>Office Hours:</strong> Monday to Friday, 8:00 AM - 5:00 PM</p>
        <p><strong>Website:</strong> www.waterutility.com</p>
    </div>

    <div class="footer">
        <p>This is a computer-generated document. No signature required.</p>
        <p>Please keep this invoice for your records.</p>
        <p>Thank you for your prompt payment!</p>
    </div>
</body>
</html> 