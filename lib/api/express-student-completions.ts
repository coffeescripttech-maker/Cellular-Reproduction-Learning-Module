/**
 * Express Student Completions API
 * 
 * This module handles student module completion operations with the Express.js backend.
 * Provides methods for:
 * - Getting student completions
 * - Getting module completion
 * - Creating completion records
 * - Getting completion statistics
 */

import { expressClient } from './express-client';
import { toSnakeCase, toCamelCase } from '../utils/caseConversion';

// Type definitions
export interface ModuleCompletion {
  id: string;
  studentId: string;
  moduleId: string;
  completionDate: string;
  finalScore: number;
  timeSpentMinutes: number;
  preTestScore?: number;
  postTestScore?: number;
  sectionsCompleted?: number;
  perfectSections: number;
  badgeEarned?: string | null;
  moduleTitle?: string;
  difficultyLevel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompletionCreateData {
  studentId: string;
  moduleId: string;
  finalScore: number;
  timeSpentMinutes?: number;
  preTestScore?: number;
  postTestScore?: number;
  sectionsCompleted?: number;
  perfectSections?: number;
  badgeEarned?: string | null;
}

export interface CompletionStats {
  totalCompletions: number;
  averageScore: number;
  totalTimeSpent: number;
  perfectSections: number;
}

export class ExpressStudentCompletionsAPI {
  /**
   * Get all completions for a student
   * 
   * @param studentId - Student user ID
   * @returns Array of completion records, sorted by completion date descending
   */
  static async getStudentCompletions(studentId: string): Promise<ModuleCompletion[]> {
    try {
      const response = await expressClient.get(`/api/completions/student/${studentId}`);

      if (response.error) {
        console.error('Error fetching student completions:', response.error);
        throw new Error(response.error.message || 'Failed to fetch student completions');
      }

      // Convert snake_case to camelCase
      const completionsArray = Array.isArray(response.data) ? response.data : [];
      return completionsArray.map(toCamelCase);
    } catch (error) {
      console.error('getStudentCompletions error:', error);
      
      // Return empty array on error
      return [];
    }
  }

  /**
   * Get completion for a specific module
   * 
   * @param studentId - Student user ID
   * @param moduleId - Module ID
   * @returns Completion record or null if not found
   */
  static async getModuleCompletion(
    studentId: string,
    moduleId: string
  ): Promise<ModuleCompletion | null> {
    try {
      const response = await expressClient.get(
        `/api/completions/student/${studentId}/module/${moduleId}`
      );

      if (response.error) {
        // Return null if not found (404)
        if (response.error.code === 'DB_NOT_FOUND') {
          return null;
        }
        
        console.error('Error fetching module completion:', response.error);
        throw new Error(response.error.message || 'Failed to fetch module completion');
      }

      // Convert snake_case to camelCase
      return response.data ? toCamelCase(response.data) : null;
    } catch (error) {
      console.error('getModuleCompletion error:', error);
      
      // Return null on error
      return null;
    }
  }

  /**
   * Create completion record
   * 
   * @param completionData - Completion data to save
   * @returns Created completion record
   */
  static async createCompletion(completionData: CompletionCreateData): Promise<ModuleCompletion> {
    try {
      // Validate final score is between 0 and 100
      if (completionData.finalScore < 0 || completionData.finalScore > 100) {
        throw new Error('Final score must be between 0 and 100');
      }

      // Convert camelCase to snake_case for backend
      const snakeCaseData = toSnakeCase(completionData);

      const response = await expressClient.post('/api/completions', snakeCaseData);

      if (response.error) {
        console.error('Error creating completion:', response.error);
        throw new Error(response.error.message || 'Failed to create completion');
      }

      // Convert snake_case to camelCase
      return toCamelCase(response.data);
    } catch (error) {
      console.error('createCompletion error:', error);
      throw error;
    }
  }

  /**
   * Get completion statistics for a student
   * 
   * @param studentId - Student user ID
   * @returns Completion statistics
   */
  static async getCompletionStats(studentId: string): Promise<CompletionStats> {
    try {
      const response = await expressClient.get(`/api/completions/student/${studentId}/stats`);

      if (response.error) {
        console.error('Error fetching completion stats:', response.error);
        throw new Error(response.error.message || 'Failed to fetch completion stats');
      }

      // Convert snake_case to camelCase
      const stats = response.data ? toCamelCase(response.data) : {};
      
      return {
        totalCompletions: stats.totalCompletions || 0,
        averageScore: stats.averageScore || 0,
        totalTimeSpent: stats.totalTimeSpent || 0,
        perfectSections: stats.perfectSections || 0,
      };
    } catch (error) {
      console.error('getCompletionStats error:', error);
      
      // Return default stats on error
      return {
        totalCompletions: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        perfectSections: 0,
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
   * Format score as percentage
   * 
   * @param score - Score value (0-100)
   * @returns Formatted percentage string
   */
  static formatScore(score: number): string {
    return `${Math.round(score)}%`;
  }

  /**
   * Get score badge color based on score value
   * 
   * @param score - Score value (0-100)
   * @returns Tailwind color class
   */
  static getScoreBadgeColor(score: number): string {
    if (score >= 90) {
      return 'bg-green-100 text-green-800';
    } else if (score >= 75) {
      return 'bg-blue-100 text-blue-800';
    } else if (score >= 60) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  }

  /**
   * Get score grade letter
   * 
   * @param score - Score value (0-100)
   * @returns Grade letter (A, B, C, D, F)
   */
  static getScoreGrade(score: number): string {
    if (score >= 90) {
      return 'A';
    } else if (score >= 80) {
      return 'B';
    } else if (score >= 70) {
      return 'C';
    } else if (score >= 60) {
      return 'D';
    } else {
      return 'F';
    }
  }

  /**
   * Format completion date to relative time
   * 
   * @param completionDate - ISO timestamp string
   * @returns Relative time string (e.g., "2 days ago")
   */
  static formatCompletionDate(completionDate: string): string {
    try {
      const date = new Date(completionDate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting completion date:', error);
      return 'Recently';
    }
  }

  /**
   * Check if completion is recent (within last 7 days)
   * 
   * @param completionDate - ISO timestamp string
   * @returns True if completion is recent
   */
  static isRecentCompletion(completionDate: string): boolean {
    try {
      const date = new Date(completionDate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    } catch (error) {
      console.error('Error checking recent completion:', error);
      return false;
    }
  }

  /**
   * Calculate improvement from pre-test to post-test
   * 
   * @param preTestScore - Pre-test score
   * @param postTestScore - Post-test score
   * @returns Improvement percentage
   */
  static calculateImprovement(preTestScore?: number, postTestScore?: number): number | null {
    if (preTestScore === undefined || postTestScore === undefined) {
      return null;
    }
    return postTestScore - preTestScore;
  }
}
