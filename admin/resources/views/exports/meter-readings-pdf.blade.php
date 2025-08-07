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
            padding: 8px;
            text-align: left;
            font-size: 9px;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
        }
        .amount {
            text-align: right;
        }
        .account-type {
            text-align: center;
        }
        .account-type.residential {
            color: #007bff;
        }
        .account-type.commercial {
            color: #28a745;
        }
        .account-type.government {
            color: #6f42c1;
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
        @if($account_type_filter && $account_type_filter !== 'All')
            <p>Filtered by Account Type: {{ $account_type_filter }}</p>
        @endif
    </div>

    <div class="summary">
        <div class="summary-item">
            <strong>Total Records:</strong> {{ number_format($total_records) }}
        </div>
        <div class="summary-item">
            <strong>Total Amount:</strong> ₱{{ number_format($total_amount, 2) }}
        </div>
        @if($account_type_filter && $account_type_filter !== 'All')
            <div class="summary-item">
                <strong>Account Type:</strong> {{ $account_type_filter }}
            </div>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                <th>Reading Date</th>
                <th>Customer Name</th>
                <th>Account Number</th>
                <th>Meter Number</th>
                <th>Reading Value</th>
                <th>Amount</th>
                <th>Account Type</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($readings as $reading)
            <tr>
                <td>{{ $reading->reading_date ? \Carbon\Carbon::parse($reading->reading_date)->format('Y-m-d') : 'N/A' }}</td>
                <td>{{ $reading->customer_name ?? 'N/A' }}</td>
                <td>{{ $reading->account_number ?? 'N/A' }}</td>
                <td>{{ $reading->meter_number ?? 'N/A' }}</td>
                <td class="amount">{{ $reading->reading_value ?? 'N/A' }}</td>
                <td class="amount">₱{{ number_format($reading->amount ?? 0, 2) }}</td>
                <td class="account-type {{ strtolower($reading->account_type ?? '') }}">
                    {{ $reading->account_type ?? 'N/A' }}
                </td>
                <td>{{ $reading->remarks ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>This report was generated automatically by the Hermosa Water District Management System.</p>
        <p>Report contains {{ number_format($total_records) }} meter reading records with a total amount of ₱{{ number_format($total_amount, 2) }}.</p>
    </div>
</body>
</html>
