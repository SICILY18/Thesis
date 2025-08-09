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
        
        .account-type {
            text-align: center;
            font-weight: bold;
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
        @if($account_type_filter && $account_type_filter !== 'All')
            <p>Filtered by Account Type: {{ $account_type_filter }}</p>
        @endif
        <p>Hermosa Water District Management System</p>
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
        <p>To save as PDF, use your browser's "Print" function and select "Save as PDF" as the destination.</p>
    </div>
</body>
</html>
