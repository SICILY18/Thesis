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
        .status {
            text-align: center;
        }
        .status.active {
            color: #28a745;
            font-weight: bold;
        }
        .status.inactive {
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
        @if($account_type_filter && $account_type_filter !== 'all')
            <p>Filtered by Account Type: {{ ucfirst($account_type_filter) }}</p>
        @endif
    </div>

    <div class="summary">
        <div class="summary-item">
            <strong>Total Records:</strong> {{ number_format($total_records) }}
        </div>
        @if($account_type_filter && $account_type_filter !== 'all')
            <div class="summary-item">
                <strong>Account Type:</strong> {{ ucfirst($account_type_filter) }}
            </div>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                <th>Full Name</th>
                <th>Account Number</th>
                <th>Account Type</th>
                <th>Address</th>
                <th>Contact Number</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created At</th>
            </tr>
        </thead>
        <tbody>
            @foreach($accounts as $account)
            <tr>
                <td>{{ $account->full_name ?? 'N/A' }}</td>
                <td>{{ $account->account_number ?? 'N/A' }}</td>
                <td class="account-type {{ strtolower($account->account_type ?? '') }}">
                    {{ $account->account_type ?? 'N/A' }}
                </td>
                <td>{{ $account->address ?? 'N/A' }}</td>
                <td>{{ $account->contact_number ?? 'N/A' }}</td>
                <td>{{ $account->email ?? 'N/A' }}</td>
                <td class="status {{ strtolower($account->status ?? '') }}">
                    {{ ucfirst($account->status ?? 'N/A') }}
                </td>
                <td>{{ $account->created_at ? \Carbon\Carbon::parse($account->created_at)->format('Y-m-d H:i') : 'N/A' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>This report was generated automatically by the Hermosa Water District Management System.</p>
        <p>Report contains {{ number_format($total_records) }} account records.</p>
    </div>
</body>
</html>
