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
        
        .body-text {
            max-width: 300px;
            word-wrap: break-word;
        }
        
        .status {
            text-align: center;
            font-weight: bold;
        }
        
        .status.active {
            color: #28a745;
        }
        
        .status.inactive {
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
        @if($status_filter && $status_filter !== 'All')
            <p>Filtered by Status: {{ ucfirst($status_filter) }}</p>
        @endif
        <p>Hermosa Water District Management System</p>
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
        <p>To save as PDF, use your browser's "Print" function and select "Save as PDF" as the destination.</p>
    </div>
</body>
</html>
