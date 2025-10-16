// data/mockData.ts
import { RecentFile, DocumentCategory, MonthlyData } from '../types/dashboard';

export const recentFiles: RecentFile[] = [
  {
    id: '1',
    title: 'Section 1.10.33 of "de Finibus Bonorum et Malorum me Erta',
    timestamp: '11:35pm',
    date: '02/08/2025'
  },
  {
    id: '2',
    title: 'Section 1.10.33 of "de Finibus Bonorum et Malorum',
    timestamp: '11:35pm',
    date: '02/08/2025'
  }
];

export const recentDownloads: RecentFile[] = [
  {
    id: '1',
    title: 'Section 1.10.33 of "de Finibus Bonorum et Malorum me Erta Delos',
    timestamp: '11:35pm',
    date: '02/08/2025'
  },
  {
    id: '2',
    title: 'Section 1.10.33 of "de Finibus Bonorum et Malorum',
    timestamp: '11:35pm',
    date: '02/08/2025'
  }
];

export const documentCategories: DocumentCategory[] = [
  { name: 'MOA', count: 156, percentage: 25.5, color: '#4ade80' },
  { name: 'Reports', count: 89, percentage: 18.2, color: '#22c55e' },
  { name: 'Contracts', count: 145, percentage: 21.8, color: '#16a34a' },
  { name: 'Proposals', count: 67, percentage: 12.3, color: '#15803d' },
  { name: 'Others', count: 95, percentage: 22.2, color: '#166534' }
];

export const monthlyUploadData: MonthlyData[] = [
  { month: 'Jan', uploads: 52 },
  { month: 'Feb', uploads: 48 },
  { month: 'Mar', uploads: 61 },
  { month: 'Apr', uploads: 58 },
  { month: 'May', uploads: 65 },
  { month: 'Jun', uploads: 72 },
  { month: 'Jul', uploads: 78 },
  { month: 'Aug', uploads: 69 },
  { month: 'Sep', uploads: 85 },
  { month: 'Oct', uploads: 79 },
  { month: 'Nov', uploads: 71 },
  { month: 'Dec', uploads: 68 }
];