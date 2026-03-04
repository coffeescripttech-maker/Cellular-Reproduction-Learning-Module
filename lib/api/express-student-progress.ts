/**
 * Express Student Progress API
 * 
 * This module handles student progress operations with the Express.js backend.
 * Provides methods for:
 * - Getting student progress
 * - Getting module progress
 * - Saving progress
 * - Updating progress percentage
 */

import { expressClient } from './express-client';
import { toSnakeCase, toCamelCase } from '../utils/caseConversion';

// Type definitions
export interface ModuleProgress {
  id: string;
  studentId: string;
  studentName?: string;
  moduleId: string;
  moduleTitle?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  progressPercentage: number;
  currentSectionId?: string;
  timeSpentMinutes: number;
  completedSections?: string[];
  assessmentScores?: Record<string, number>;
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgressCreateData {
  studentId: string;
  moduleId: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
  progressPercentage?: number;
  currentSectionId?: string;
  timeSpentMinutes?: number;
  completedSections?: string[];
  assessmentScores?: Record<string, number>;
}

export interface ProgressUpdateData {
  status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
  progressPercentage?: number;
  currentSectionId?: string;
  timeSpentMinutes?: number;
  completedSections?: string[];
  assessmentScores?: Record<string, number>;
}

export class ExpressStudentProgressAPI {
  /**
   * Get all progress records for a student
   * 
   * @param studentId - Student user ID
   * @param options - Query options (page, limit, status)
   * @returns Array of progress records
   */
  static async getStudentProgress(
    studentId: string,
    options?: { page?: number; limit?: number; status?: string }
  ): Promise<ModuleProgress[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (options?.page) {
        queryParams.append('page', options.page.toString());
      }
      if (options?.limit) {
        queryParams.append('limit', options.limit.toString());
      }
      if (options?.status) {
        queryParams.append('status', options.status);
      }

      const queryString = queryParams.toString();
      const endpoint = `/api/progress/student/${studentId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await expressClient.get(endpoint);

      if (response.error) {
        console.error('Error fetching student progress:', response.error);
        throw new Error(response.error.message || 'Failed to fetch student progress');
      }

      // Convert snake_case to camelCase
      const progressArray = Array.isArray(response.data) ? response.data : [];
      return progressArray.map(toCamelCase);
    } catch (error) {
      console.error('getStudentProgress error:', error);
      
      // Return empty array on error
      return [];
    }
  }

  /**
   * Get progress for a specific module
   * 
   * @param studentId - Student user ID
   * @param moduleId - Module ID
   * @returns Progress record or null if not found
   */
  static async getModuleProgress(
    studentId: string,
    moduleId: string
  ): Promise<ModuleProgress | null> {
    try {
      const response = await expressClient.get(
        `/api/progress/student/${studentId}/module/${moduleId}`
      );

      if (response.error) {
        // Return null if not found (404)
        if (response.error.code === 'DB_NOT_FOUND') {
          return null;
        }
        
        console.error('Error fetching module progress:', response.error);
        throw new Error(response.error.message || 'Failed to fetch module progress');
      }

      // Convert snake_case to camelCase
      return response.data ? toCamelCase(response.data) : null;
    } catch (error) {
      console.error('getModuleProgress error:', error);
      
      // Return null on error
      return null;
    }
  }

  /**
   * Save progress (create or update)
   * 
   * @param progressData - Progress data to save
   * @returns Saved progress record
   */
  static async saveProgress(progressData: ProgressCreateData): Promise<ModuleProgress> {
    try {
      console.log('🔵 saveProgress called with:', progressData);
      
      // Check if progress already exists
      const existingProgress = await this.getModuleProgress(
        progressData.studentId,
        progressData.moduleId
      );

      // Convert camelCase to snake_case for backend
      const snakeCaseData = toSnakeCase(progressData);
      
      console.log('🔄 Converted to snake_case:', snakeCaseData);

      let response;
      
      if (existingProgress) {
        console.log('📝 Updating existing progress');
        // Update existing progress
        response = await expressClient.put(
          `/api/progress/student/${progressData.studentId}/module/${progressData.moduleId}`,
          snakeCaseData
        );
      } else {
        console.log('✨ Creating new progress');
        // Create new progress
        response = await expressClient.post('/api/progress', snakeCaseData);
      }

      if (response.error) {
        console.error('❌ Error saving progress:', response.error);
        throw new Error(response.error.message || 'Failed to save progress');
      }

      console.log('✅ Progress saved successfully');
      
      // Convert snake_case to camelCase
      return toCamelCase(response.data);
    } catch (error) {
      console.error('❌ saveProgress error:', error);
      throw error;
    }
  }

  /**
   * Update progress percentage only
   * 
   * @param studentId - Student user ID
   * @param moduleId - Module ID
   * @param percentage - Progress percentage (0-100)
   * @returns Updated progress record
   */
  static async updateProgressPercentage(
    studentId: string,
    moduleId: string,
    percentage: number
  ): Promise<ModuleProgress> {
    try {
      // Validate percentage bounds
      const validPercentage = Math.max(0, Math.min(100, percentage));

      // Update progress with new percentage
      const response = await expressClient.put(
        `/api/progress/student/${studentId}/module/${moduleId}`,
        { progress_percentage: validPercentage }
      );

      if (response.error) {
        console.error('Error updating progress percentage:', response.error);
        throw new Error(response.error.message || 'Failed to update progress percentage');
      }

      // Convert snake_case to camelCase
      return toCamelCase(response.data);
    } catch (error) {
      console.error('updateProgressPercentage error:', error);
      throw error;
    }
  }

  /**
   * Delete progress record (reset module)
   * 
   * @param progressId - Progress record ID
   * @returns Success status
   */
  static async deleteProgress(progressId: string): Promise<boolean> {
    try {
      const response = await expressClient.delete(`/api/progress/${progressId}`);

      if (response.error) {
        console.error('Error deleting progress:', response.error);
        throw new Error(response.error.message || 'Failed to delete progress');
      }

      return true;
    } catch (error) {
      console.error('deleteProgress error:', error);
      return false;
    }
  }

  /**
   * Get progress statistics for a student
   * 
   * @param studentId - Student user ID
   * @returns Progress statistics
   */
  static async getStudentStats(studentId: string): Promise<any> {
    try {
      const response = await expressClient.get(`/api/progress/student/${studentId}/stats`);

      if (response.error) {
        console.error('Error fetching student stats:', response.error);
        throw new Error(response.error.message || 'Failed to fetch student stats');
      }

      // Convert snake_case to camelCase
      return toCamelCase(response.data);
    } catch (error) {
      console.error('getStudentStats error:', error);
      
      // Return default stats on error
      return {
        totalModules: 0,
        completedModules: 0,
        inProgressModules: 0,
        notStartedModules: 0,
        averageProgress: 0,
        totalTimeSpent: 0,
      };
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
   * Get status badge color
   * 
   * @param status - Progress status
   * @returns Tailwind color class
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get status display text
   * 
   * @param status - Progress status
   * @returns Display text
   */
  static getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'paused':
        return 'Paused';
      case 'not_started':
        return 'Not Started';
      default:
        return 'Unknown';
    }
  }
}
