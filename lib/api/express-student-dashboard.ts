/**
 * Express Student Dashboard API
 * 
 * This module handles student dashboard operations with the Express.js backend.
 * Provides methods for:
 * - Dashboard statistics
 * - Recent activities
 * - Recommended modules
 */

import { expressClient } from './express-client';

// Type definitions
export interface DashboardStats {
  modulesCompleted: number;
  modulesInProgress: number;
  averageScore: number;
  totalTimeSpent: number;
  perfectSections: number;
  totalModulesAvailable: number;
}

export interface RecentActivity {
  id: string;
  type: 'module_completion' | 'module_progress';
  title: string;
  status: 'completed' | 'in_progress';
  timestamp: string;
  score?: number;
  progress?: number;
}

export interface RecommendedModule {
  id: string;
  categoryId?: string;
  categoryName?: string;
  title: string;
  description?: string;
  learningObjectives?: string[];
  contentStructure?: any;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  estimatedDurationMinutes?: number;
  prerequisites?: string[];
  multimediaContent?: any;
  interactiveElements?: any;
  assessmentQuestions?: any[];
  moduleMetadata?: any;
  jsonBackupUrl?: string;
  jsonContentUrl?: string;
  contentSummary?: any;
  targetClassId?: string;
  targetLearningStyles?: string[];
  prerequisiteModuleId?: string;
  isPublished: boolean;
  createdBy?: string;
  creatorName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgressData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export class ExpressStudentDashboardAPI {
  /**
   * Get dashboard statistics for a student
   * 
   * @param userId - Student user ID
   * @returns Dashboard statistics including completed modules, in-progress, average score, etc.
   */
  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      const response = await expressClient.get(`/api/students/${userId}/dashboard-stats`);

      if (response.error) {
        console.error('Error fetching dashboard stats:', response.error);
        throw new Error(response.error.message || 'Failed to fetch dashboard statistics');
      }

      // Return the data with default values if fields are missing
      const data = response.data || {};
      return {
        modulesCompleted: data.modulesCompleted || 0,
        modulesInProgress: data.modulesInProgress || 0,
        averageScore: data.averageScore || 0,
        totalTimeSpent: data.totalTimeSpent || 0,
        perfectSections: data.perfectSections || 0,
        totalModulesAvailable: data.totalModulesAvailable || 0,
      };
    } catch (error) {
      console.error('getDashboardStats error:', error);
      
      // Return default values on error
      return {
        modulesCompleted: 0,
        modulesInProgress: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        perfectSections: 0,
        totalModulesAvailable: 0,
      };
    }
  }

  /**
   * Get recent activities for a student
   * 
   * @param userId - Student user ID
   * @returns Array of recent activities (max 5), sorted by timestamp descending
   */
  static async getRecentActivities(userId: string): Promise<RecentActivity[]> {
    try {
      const response = await expressClient.get(`/api/students/${userId}/recent-activities`);

      if (response.error) {
        console.error('Error fetching recent activities:', response.error);
        throw new Error(response.error.message || 'Failed to fetch recent activities');
      }

      // Return the data array or empty array if not found
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('getRecentActivities error:', error);
      
      // Return empty array on error
      return [];
    }
  }

  /**
   * Get progress data for charts/visualizations
   * 
   * @param userId - Student user ID
   * @returns Progress data formatted for chart libraries
   */
  static async getProgressData(userId: string): Promise<ProgressData> {
    try {
      // Get dashboard stats to build progress data
      const stats = await this.getDashboardStats(userId);

      // Build chart data from stats
      const progressData: ProgressData = {
        labels: ['Completed', 'In Progress', 'Not Started'],
        datasets: [
          {
            label: 'Module Progress',
            data: [
              stats.modulesCompleted,
              stats.modulesInProgress,
              Math.max(0, stats.totalModulesAvailable - stats.modulesCompleted - stats.modulesInProgress),
            ],
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)',  // green for completed
              'rgba(59, 130, 246, 0.8)',  // blue for in progress
              'rgba(156, 163, 175, 0.8)', // gray for not started
            ],
            borderColor: [
              'rgba(34, 197, 94, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(156, 163, 175, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };

      return progressData;
    } catch (error) {
      console.error('getProgressData error:', error);
      
      // Return empty chart data on error
      return {
        labels: ['Completed', 'In Progress', 'Not Started'],
        datasets: [
          {
            label: 'Module Progress',
            data: [0, 0, 0],
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(156, 163, 175, 0.8)',
            ],
            borderColor: [
              'rgba(34, 197, 94, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(156, 163, 175, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };
    }
  }

  /**
   * Get recommended modules for a student based on learning style
   * 
   * @param userId - Student user ID
   * @returns Array of recommended modules (max 10)
   */
  static async getRecommendedModules(userId: string): Promise<RecommendedModule[]> {
    try {
      const response = await expressClient.get(`/api/students/${userId}/recommended-modules`);

      if (response.error) {
        console.error('Error fetching recommended modules:', response.error);
        throw new Error(response.error.message || 'Failed to fetch recommended modules');
      }

      // Return the data array or empty array if not found
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('getRecommendedModules error:', error);
      
      // Return empty array on error
      return [];
    }
  }

  /**
   * Format time spent in minutes to human-readable format
   * 
   * @param minutes - Time in minutes
   * @returns Formatted string (e.g., "2h 30m", "45m")
   */
  static formatTimeSpent(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Format relative timestamp (e.g., "2 hours ago", "3 days ago")
   * 
   * @param timestamp - ISO timestamp string
   * @returns Relative time string
   */
  static formatRelativeTime(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSeconds < 60) {
        return 'just now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return 'recently';
    }
  }

  /**
   * Get activity icon based on activity type
   * 
   * @param type - Activity type
   * @returns Icon name or emoji
   */
  static getActivityIcon(type: 'module_completion' | 'module_progress'): string {
    switch (type) {
      case 'module_completion':
        return '✅';
      case 'module_progress':
        return '📚';
      default:
        return '📝';
    }
  }

  /**
   * Get difficulty badge color
   * 
   * @param difficulty - Module difficulty level
   * @returns Tailwind color class
   */
  static getDifficultyColor(difficulty?: string): string {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
