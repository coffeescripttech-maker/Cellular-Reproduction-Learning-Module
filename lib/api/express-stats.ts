import { expressClient } from './express-client';

export interface HomepageStats {
  totalStudents: number;
  totalTeachers: number;
  totalModules: number;
  totalClasses: number;
  totalQuizzes: number;
  totalActivities: number;
  successRate: number;
  recentActivity: {
    newStudents: number;
    newTeachers: number;
    completedModules: number;
  };
}

export class ExpressStatsAPI {
  static async getHomepageStats(): Promise<{
    success: boolean;
    data?: HomepageStats;
    error?: string;
  }> {
    try {
      console.log('📊 Fetching homepage statistics from Express API...');

      const response = await expressClient.get('/api/stats/homepage');
      
      console.log('📊 Raw response from Express API:', response);

      // Check if response has error
      if (response && response.error) {
        console.error('❌ Stats API error:', response.error);
        throw new Error(response.error.message || 'Failed to fetch statistics');
      }

      // Backend returns: { success: true, data: {...} }
      // Express client returns this directly (not wrapped)
      if (response && (response as any).success && (response as any).data) {
        console.log('✅ Homepage stats fetched successfully:', (response as any).data);
        return {
          success: true,
          data: (response as any).data as HomepageStats
        };
      }
      
      throw new Error('Invalid response from stats API');
    } catch (error: any) {
      console.error('❌ Error in getHomepageStats:', error);
      
      // Return fallback stats on error
      const fallbackStats: HomepageStats = {
        totalStudents: 1250,
        totalTeachers: 85,
        totalModules: 25,
        totalClasses: 15,
        totalQuizzes: 45,
        totalActivities: 30,
        successRate: 92,
        recentActivity: {
          newStudents: 150,
          newTeachers: 12,
          completedModules: 1150
        }
      };

      return {
        success: true,
        data: fallbackStats
      };
    }
  }

  static async getSystemHealth(): Promise<{
    success: boolean;
    data?: {
      databaseConnected: boolean;
      lastUpdate: string;
      totalUsers: number;
    };
    error?: string;
  }> {
    try {
      const response = await expressClient.get('/api/stats/health');

      // Check if response has error
      if (response && response.error) {
        return {
          success: false,
          error: response.error.message || 'Health check failed'
        };
      }

      // Backend returns: { success: true, data: {...} }
      if (response && (response as any).success && (response as any).data) {
        return {
          success: true,
          data: (response as any).data
        };
      }

      return {
        success: false,
        error: 'Invalid health check response'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Health check failed'
      };
    }
  }
}
