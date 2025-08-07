<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 18px;
            color: #333;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .summary {
            margin-bottom: 20px;
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
        }
        .summary-item {
            display: inline-block;
            margin-right: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
            font-size: 8px;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
        }
        .amount {
            text-align: right;
        }
        .status {
            text-align: center;
        }
        .status.paid {
            color: #28a745;
            font-weight: bold;
        }
        .status.unpaid {
            color: #dc3545;
            font-weight: bold;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 8px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <p>Generated on: {{ $generated_at }}</p>
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
                <td>{{ $payment->payment_date ? \Carbon\Carbon::parse($payment->payment_date)->format('Y-m-d') : 'N/A' }}</td>
                <td>{{ $payment->customer_name ?? 'N/A' }}</td>
                <td>{{ $payment->account_number ?? 'N/A' }}</td>
                <td>{{ $payment->period ?? 'N/A' }}</td>
                <td class="amount">₱{{ number_format($payment->amount ?? 0, 2) }}</td>
                <td>{{ $payment->payment_method ?? 'N/A' }}</td>
                <td>{{ $payment->reference ?? 'N/A' }}</td>
                <td class="status {{ strtolower($payment->status) === 'completed' ? 'paid' : 'unpaid' }}">
                    {{ $payment->status === 'completed' ? 'PAID' : ($payment->status === 'pending' ? 'UNPAID' : strtoupper($payment->status ?? 'N/A')) }}
                </td>
                <td>{{ $payment->account_type ?? 'N/A' }}</td>
                <td class="amount">₱{{ number_format($payment->bill_amount ?? 0, 2) }}</td>
                <td>{{ $payment->due_date ? \Carbon\Carbon::parse($payment->due_date)->format('Y-m-d') : 'N/A' }}</td>
                <td>{{ $payment->validated_at ? \Carbon\Carbon::parse($payment->validated_at)->format('Y-m-d H:i') : 'N/A' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>This report was generated automatically by the Hermosa Water District Management System.</p>
        <p>Report contains {{ number_format($total_records) }} payment records with a total amount of ₱{{ number_format($total_amount, 2) }}.</p>
    </div>
</body>
</html>
