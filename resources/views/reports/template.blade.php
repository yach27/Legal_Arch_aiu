<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }} - {{ date('Y-m-d') }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.8;
            color: #1a1a1a;
            background: white;
            padding: 60px 40px;
            max-width: 1000px;
            margin: 0 auto;
        }

        .container {
            background: white;
        }

        .letterhead {
            text-align: center;
            border-bottom: 3px double #059669;
            padding-bottom: 25px;
            margin-bottom: 40px;
        }

        .company-name {
            font-size: 28px;
            font-weight: 700;
            color: #059669;
            letter-spacing: 1px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }

        .company-tagline {
            font-size: 12px;
            color: #6b7280;
            font-style: italic;
            margin-bottom: 15px;
        }

        .header {
            margin-bottom: 40px;
        }

        h1 {
            color: #1a1a1a;
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: 700;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 2px;
            border-bottom: 2px solid #059669;
            padding-bottom: 15px;
        }

        .meta-info {
            display: flex;
            justify-content: space-between;
            color: #4b5563;
            font-size: 11px;
            margin-bottom: 30px;
            padding: 15px 20px;
            background: #f9fafb;
            border-left: 4px solid #059669;
        }

        .meta-item {
            display: flex;
            flex-direction: column;
        }

        .meta-label {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 4px;
        }

        .meta-value {
            font-size: 12px;
            color: #1f2937;
        }

        h2 {
            color: #1a1a1a;
            margin-top: 50px;
            margin-bottom: 25px;
            font-size: 16px;
            font-weight: 700;
            padding: 12px 15px;
            background: #f9fafb;
            border-left: 5px solid #059669;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .section-intro {
            font-size: 13px;
            color: #4b5563;
            margin-bottom: 20px;
            font-style: italic;
            padding-left: 20px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 30px 0;
            padding: 20px;
            background: #fafafa;
            border: 1px solid #e5e7eb;
        }

        .stat-card {
            background: white;
            padding: 20px;
            border: 1px solid #d1d5db;
            text-align: center;
        }

        .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #059669;
            margin-bottom: 8px;
            font-family: Georgia, serif;
        }

        .stat-label {
            color: #4b5563;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border: 1px solid #d1d5db;
            font-size: 12px;
        }

        th {
            background: #1a1a1a;
            color: white;
            padding: 12px 14px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #059669;
        }

        td {
            padding: 10px 14px;
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
        }

        tr:last-child td {
            border-bottom: none;
        }

        tbody tr:nth-child(even) {
            background-color: #f9fafb;
        }

        .no-data {
            text-align: center;
            padding: 40px;
            color: #9ca3af;
            font-style: italic;
            background: #fafafa;
            border: 1px dashed #d1d5db;
        }

        .footer {
            margin-top: 80px;
            padding-top: 25px;
            border-top: 3px double #059669;
            text-align: center;
            color: #4b5563;
            font-size: 11px;
        }

        .footer-company {
            font-weight: 700;
            font-size: 14px;
            color: #1a1a1a;
            margin-bottom: 12px;
        }

        .footer-disclaimer {
            font-style: normal;
            margin: 10px 0;
            font-size: 12px;
            color: #374151;
            font-weight: 600;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .print-button {
            background: #059669;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            margin: 20px 0;
            display: inline-block;
            font-family: 'Segoe UI', sans-serif;
        }

        .print-button:hover {
            background: #047857;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }

        .page-break {
            page-break-before: always;
        }

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
        {{-- Letterhead --}}
        <div class="letterhead">
            <div class="company-name">Legal Document Management System</div>
            <div class="company-tagline">Secure. Organized. Compliant.</div>
        </div>

        {{-- Header --}}
        <div class="header">
            <h1>{{ $title }}</h1>
            <div class="meta-info">
                <div class="meta-item">
                    <span class="meta-label">Report ID</span>
                    <span class="meta-value">RPT-{{ date('Ymd') }}-{{ strtoupper(substr(md5($reportType . time()), 0, 6)) }}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Generated On</span>
                    <span class="meta-value">{{ $date }} at {{ $time }}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Report Type</span>
                    <span class="meta-value">{{ ucfirst($reportType) }}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Status</span>
                    <span class="meta-value">Official Document</span>
                </div>
            </div>
        </div>

        {{-- Print Button --}}
        <button class="print-button" onclick="window.print()">Print Report</button>

        {{-- Summary Statistics --}}
        <h2>Executive Summary</h2>
        <p class="section-intro">Overview of document management metrics for the reporting period.</p>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">{{ number_format($stats['totalDocuments']) }}</div>
                <div class="stat-label">Total Documents</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ number_format($stats['documentsThisMonth']) }}</div>
                <div class="stat-label">This Month</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ number_format($stats['documentsThisWeek']) }}</div>
                <div class="stat-label">This Week</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ number_format($stats['activeUsers']) }}</div>
                <div class="stat-label">Active Users</div>
            </div>
        </div>

        {{-- Documents by Folder --}}
        <h2>Document Distribution Analysis</h2>
        <p class="section-intro">Breakdown of documents organized by folder categories.</p>
        @if(count($documentsByCategory) > 0)
            <table>
                <thead>
                    <tr>
                        <th style="width: 50%;">Folder Name</th>
                        <th class="text-center" style="width: 20%;">Document Count</th>
                        <th class="text-center" style="width: 15%;">Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($documentsByCategory as $item)
                        <tr>
                            <td class="font-bold">{{ $item['category'] }}</td>
                            <td class="text-center">{{ number_format($item['count']) }}</td>
                            <td class="text-center">{{ $item['percentage'] }}%</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <div class="no-data">No folder data available for the reporting period.</div>
        @endif

        {{-- Footer --}}
        <div class="footer">
            <p class="footer-company">Legal Document Management System</p>
            <p class="footer-disclaimer">This is an official automated report generated from the system database.</p>
            <p class="footer-disclaimer">Confidential and proprietary information. Unauthorized access or distribution is prohibited.</p>
            <p>&copy; {{ date('Y') }} All rights reserved. Generated at {{ date('Y-m-d H:i:s') }}</p>
        </div>
    </div>
</body>
</html>
