// categoryService.ts - Category related business logic
import { mockData } from '../data/mockData';
import { Category } from '../types/types';

class CategoryService {
  private data = mockData;

  // Category related functions
  getAllCategories(): Category[] {
    return this.data.categories;
  }

  getCategoryById(categoryId: number): Category | undefined {
    return this.data.categories.find(cat => cat.category_id === categoryId);
  }
}

// Export singleton instance
export const categoryService = new CategoryService();
export default categoryService;