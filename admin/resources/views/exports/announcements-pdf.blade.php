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
        .body-text {
            max-width: 300px;
            word-wrap: break-word;
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
        @if($status_filter && $status_filter !== 'All')
            <p>Filtered by Status: {{ ucfirst($status_filter) }}</p>
        @endif
    </div>

    <div class="summary">
        <div class="summary-item">
            <strong>Total Records:</strong> {{ number_format($total_records) }}
        </div>
        @if($status_filter && $status_filter !== 'All')
            <div class="summary-item">
                <strong>Status Filter:</strong> {{ ucfirst($status_filter) }}
            </div>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                <th>Title</th>
                <th>Body</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Updated At</th>
            </tr>
        </thead>
        <tbody>
            @foreach($announcements as $announcement)
            <tr>
                <td>{{ $announcement->title ?? 'N/A' }}</td>
                <td class="body-text">{{ $announcement->body ?? 'N/A' }}</td>
                <td class="status {{ strtolower($announcement->status ?? '') }}">
                    {{ ucfirst($announcement->status ?? 'N/A') }}
                </td>
                <td>{{ $announcement->created_at ? \Carbon\Carbon::parse($announcement->created_at)->format('Y-m-d H:i') : 'N/A' }}</td>
                <td>{{ $announcement->updated_at ? \Carbon\Carbon::parse($announcement->updated_at)->format('Y-m-d H:i') : 'N/A' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>This report was generated automatically by the Hermosa Water District Management System.</p>
        <p>Report contains {{ number_format($total_records) }} announcement records.</p>
    </div>
</body>
</html>
