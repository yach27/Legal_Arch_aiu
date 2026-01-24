// userService.ts - User related business logic
import { mockData } from '../data/mockData';
import { User } from '../types/types';

class UserService {
  private data = mockData;

  // User related functions
  getAllUsers(): User[] {
    return this.data.users;
  }

  getUserById(userId: number): User | undefined {
    return this.data.users.find(user => user.user_id === userId);
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;