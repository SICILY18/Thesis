<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 20px;
            line-height: 1.4;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #333;
            padding-bottom: 15px;
        }
        
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #333;
            font-weight: bold;
        }
        
        .header p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }
        
        .summary {
            margin-bottom: 25px;
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        }
        
        .summary-item {
            display: inline-block;
            margin-right: 30px;
            font-weight: bold;
        }
        
        .summary-item strong {
            color: #495057;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 11px;
        }
        
        th, td {
            border: 1px solid #dee2e6;
            padding: 8px;
            text-align: left;
        }
        
        th {
            background-color: #e9ecef;
            font-weight: bold;
            text-align: center;
            color: #495057;
        }
        
        .amount {
            text-align: right;
            font-family: 'Courier New', monospace;
        }
        
        .status {
            text-align: center;
            font-weight: bold;
        }
        
        .status.completed, .status.paid {
            color: #28a745;
        }
        
        .status.pending, .status.unpaid {
            color: #ffc107;
        }
        
        .status.failed {
            color: #dc3545;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
            padding-top: 15px;
        }
        
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
        }
        
        .print-button:hover {
            background-color: #0056b3;
        }
        
        @media print {
            .print-button {
                display: none;
            }
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">Print to PDF</button>
    
    <div class="header">
        <h1>{{ $title }}</h1>
        <p>Generated on: {{ $generated_at }}</p>
        <p>Hermosa Water District Management System</p>
    </div>

    <div class="summary">
        <div class="summary-item">
            <strong>Total Records:</strong> {{ number_format($total_records) }}
        </div>
        <div class="summary-item">
            <strong>Total Amount:</strong> ₱{{ number_format($total_amount, 2) }}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Payment Date</th>
                <th>Customer</th>
                <th>Account Number</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Account Type</th>
                <th>Bill Amount</th>
                <th>Due Date</th>
                <th>Validated At</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payments as $payment)
            <tr>
                <td>{{ isset($payment['payment_date']) ? \Carbon\Carbon::parse($payment['payment_date'])->format('Y-m-d') : 'N/A' }}</td>
                <td>{{ $payment['name'] ?? $payment['full_name'] ?? 'N/A' }}</td>
                <td>{{ $payment['account_number'] ?? 'N/A' }}</td>
                <td>{{ $payment['period'] ?? 'N/A' }}</td>
                <td class="amount">₱{{ number_format($payment['amount'] ?? 0, 2) }}</td>
                <td>{{ $payment['payment_method'] ?? 'N/A' }}</td>
                <td>{{ $payment['reference'] ?? 'N/A' }}</td>
                <td class="status {{ strtolower($payment['status'] ?? '') }}">
                    @if(($payment['status'] ?? '') === 'completed')
                        PAID
                    @elseif(($payment['status'] ?? '') === 'pending')
                        UNPAID
                    @else
                        {{ strtoupper($payment['status'] ?? 'N/A') }}
                    @endif
                </td>
                <td>{{ $payment['account_type'] ?? 'N/A' }}</td>
                <td class="amount">₱{{ number_format($payment['bill_amount'] ?? 0, 2) }}</td>
                <td>{{ isset($payment['due_date']) ? \Carbon\Carbon::parse($payment['due_date'])->format('Y-m-d') : 'N/A' }}</td>
                <td>{{ isset($payment['validated_at']) ? \Carbon\Carbon::parse($payment['validated_at'])->format('Y-m-d H:i') : '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>This report was generated automatically by the Hermosa Water District Management System.</p>
        <p>Report contains {{ number_format($total_records) }} payment records with a total amount of ₱{{ number_format($total_amount, 2) }}.</p>
        <p>To save as PDF, use your browser's "Print" function and select "Save as PDF" as the destination.</p>
    </div>
</body>
</html>
