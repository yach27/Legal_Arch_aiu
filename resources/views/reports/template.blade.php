<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }} - {{ date('Y-m-d') }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #f9fafb;
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header {
            border-bottom: 4px solid #059669;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        h1 {
            color: #059669;
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .meta-info {
            color: #6b7280;
            font-size: 14px;
        }

        h2 {
            color: #047857;
            margin-top: 40px;
            margin-bottom: 20px;
            font-size: 24px;
            font-weight: 600;
            padding-bottom: 10px;
            border-bottom: 2px solid #d1fae5;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }

        .stat-card {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            padding: 24px;
            border-radius: 10px;
            border-left: 5px solid #059669;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .stat-value {
            font-size: 36px;
            font-weight: 700;
            color: #059669;
            margin-bottom: 8px;
        }

        .stat-label {
            color: #047857;
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        th {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: white;
            padding: 16px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 14px 16px;
            border-bottom: 1px solid #e5e7eb;
        }

        tr:last-child td {
            border-bottom: none;
        }

        tbody tr:hover {
            background-color: #f0fdf4;
            transition: background-color 0.2s ease;
        }

        .no-data {
            text-align: center;
            padding: 40px;
            color: #9ca3af;
            font-style: italic;
        }

        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }

        .print-button {
            background: #059669;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin: 20px 0;
            display: inline-block;
        }

        .print-button:hover {
            background: #047857;
        }

        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .trend-positive { color: #059669; font-weight: 600; }
        .trend-negative { color: #dc2626; font-weight: 600; }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
                padding: 20px;
            }
            .print-button {
                display: none;
            }
        }

        @media (max-width: 768px) {
            body {
                padding: 20px;
            }
            .container {
                padding: 20px;
            }
            .stats-grid {
                grid-template-columns: 1fr;
            }
            table {
                font-size: 12px;
            }
            th, td {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        {{-- Header --}}
        <div class="header">
            <h1>{{ $title }}</h1>
            <div class="meta-info">
                <strong>Generated on:</strong> {{ $date }} at {{ $time }}<br>
                <strong>Report Type:</strong> {{ ucfirst($reportType) }}
            </div>
        </div>

        {{-- Print Button --}}
        <button class="print-button" onclick="window.print()">🖨️ Print Report</button>

        {{-- Summary Statistics --}}
        <h2>📊 Summary Statistics</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">{{ $stats['totalDocuments'] }}</div>
                <div class="stat-label">Total Documents</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ $stats['documentsThisMonth'] }}</div>
                <div class="stat-label">This Month</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ $stats['documentsThisWeek'] }}</div>
                <div class="stat-label">This Week</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ $stats['activeUsers'] }}</div>
                <div class="stat-label">Active Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ $stats['growthRate'] }}</div>
                <div class="stat-label">Growth Rate</div>
            </div>
        </div>

        {{-- Documents by Category --}}
        <h2>📁 Documents by Category</h2>
        @if(count($documentsByCategory) > 0)
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th class="text-center">Count</th>
                        <th class="text-center">Percentage</th>
                        <th class="text-center">Trend</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($documentsByCategory as $item)
                        <tr>
                            <td class="font-bold">{{ $item['category'] }}</td>
                            <td class="text-center">{{ $item['count'] }}</td>
                            <td class="text-center">{{ $item['percentage'] }}%</td>
                            <td class="text-center {{ str_starts_with($item['trend'], '+') ? 'trend-positive' : 'trend-negative' }}">
                                {{ $item['trend'] }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <div class="no-data">No category data available</div>
        @endif

        {{-- Recent Activity --}}
        <h2>🕒 Recent Activity</h2>
        @if(count($recentActivity) > 0)
            <table>
                <thead>
                    <tr>
                        <th>Action</th>
                        <th>Document</th>
                        <th>User</th>
                        <th>Date & Time</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($recentActivity as $activity)
                        <tr>
                            <td class="font-bold">{{ $activity['action'] }}</td>
                            <td>{{ $activity['document'] }}</td>
                            <td>{{ $activity['user'] }}</td>
                            <td>{{ $activity['time'] }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <div class="no-data">No recent activity found</div>
        @endif

        {{-- Footer --}}
        <div class="footer">
            <p><strong>Legal Document Management System</strong></p>
            <p>This is an automated report generated from the system database.</p>
            <p>&copy; {{ date('Y') }} All rights reserved.</p>
        </div>
    </div>
</body>
</html>
