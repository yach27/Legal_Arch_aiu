// types/dashboard.ts
export interface RecentFile {
  id: string | number;
  title: string;
  timestamp: string;
  date: string;
  size?: string;
  created_by?: string;
  downloaded_by?: string;
}

export interface DocumentCategory {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface MonthlyData {
  month: string;
  uploads: number;
}

export interface DashboardProps {
  stats: {
    totalDocuments: number;
  };
  recentFiles: RecentFile[];
  recentDownloads: RecentFile[];
  [key: string]: any;
}