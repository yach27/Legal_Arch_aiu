// analyticsService.ts - Performance analytics and metrics
import { Document } from '../types/types';
import { realDocumentService } from './realDocumentService';
import { folderService } from './folderService';
import { categoryService } from './categoryService';

class AnalyticsService {
  // Performance analytics
  async getPerformanceMetrics(): Promise<{
    totalDocuments: number;
    totalFolders: number;
    documentsPerStatus: Record<Document['status'], number>;
    documentsPerCategory: Record<string, number>;
    recentActivity: Document[];
    storageUsed: string;
  }> {
    const documentsPerCategory: Record<string, number> = {};

    const allDocuments = await realDocumentService.getAllDocuments();
    allDocuments.forEach(doc => {
      const category = categoryService.getCategoryById(doc.category_id);
      const categoryName = category?.category_name || 'Uncategorized';
      documentsPerCategory[categoryName] = (documentsPerCategory[categoryName] || 0) + 1;
    });

    const documentCounts = await realDocumentService.getDocumentCounts();

    // Get recent documents (last 10, sorted by date)
    const recentActivity = allDocuments
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 10);

    return {
      totalDocuments: documentCounts.total_documents,
      totalFolders: await folderService.getTotalFoldersCount(),
      documentsPerStatus: documentCounts.documents_by_status as Record<Document['status'], number>,
      documentsPerCategory,
      recentActivity,
      storageUsed: '245 MB' // Mock value - would be calculated from actual file sizes
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;