<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class ReportExport implements WithMultipleSheets
{
    protected $stats;
    protected $documentsByCategory;
    protected $recentActivity;
    protected $reportType;

    public function __construct($stats, $documentsByCategory, $recentActivity, $reportType = 'general')
    {
        $this->stats = $stats;
        $this->documentsByCategory = $documentsByCategory;
        $this->recentActivity = $recentActivity;
        $this->reportType = $reportType;
    }

    public function sheets(): array
    {
        return [
            new SummarySheet($this->stats, $this->reportType),
            new DocumentsByCategorySheet($this->documentsByCategory),
            new RecentActivitySheet($this->recentActivity),
        ];
    }
}

class SummarySheet implements FromCollection, WithHeadings, WithStyles, WithTitle
{
    protected $stats;
    protected $reportType;

    public function __construct($stats, $reportType)
    {
        $this->stats = $stats;
        $this->reportType = $reportType;
    }

    public function collection()
    {
        return collect([
            [
                'Total Documents',
                $this->stats['totalDocuments']
            ],
            [
                'Documents This Month',
                $this->stats['documentsThisMonth']
            ],
            [
                'Documents This Week',
                $this->stats['documentsThisWeek']
            ],
            [
                'Active Users',
                $this->stats['activeUsers']
            ],
        ]);
    }

    public function headings(): array
    {
        return [
            'Metric',
            'Value'
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '059669'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                ],
            ],
            'A' => [
                'font' => ['bold' => true],
            ],
        ];
    }

    public function title(): string
    {
        return ucfirst($this->reportType) . ' Summary';
    }
}

class DocumentsByCategorySheet implements FromCollection, WithHeadings, WithStyles, WithTitle
{
    protected $documentsByCategory;

    public function __construct($documentsByCategory)
    {
        $this->documentsByCategory = $documentsByCategory;
    }

    public function collection()
    {
        return collect($this->documentsByCategory)->map(function ($item) {
            return [
                'folder' => $item['category'],
                'count' => $item['count'],
                'percentage' => $item['percentage'] . '%',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Folder',
            'Count',
            'Percentage'
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '059669'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Documents by Folder';
    }
}

class RecentActivitySheet implements FromCollection, WithHeadings, WithStyles, WithTitle
{
    protected $recentActivity;

    public function __construct($recentActivity)
    {
        $this->recentActivity = $recentActivity;
    }

    public function collection()
    {
        return collect($this->recentActivity)->map(function ($activity) {
            return [
                'action' => $activity['action'],
                'document' => $activity['document'],
                'user' => $activity['user'],
                'time' => $activity['time'],
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Action',
            'Document',
            'User',
            'Time'
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '059669'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Recent Activity';
    }
}
