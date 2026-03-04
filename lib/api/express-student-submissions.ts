/**
 * Express Student Submissions API
 * 
 * This module handles student submission operations with the Express.js backend.
 * Provides methods for:
 * - Getting module submissions
 * - Getting section submission
 * - Creating submissions
 * - Updating submissions
 */

import { expressClient } from './express-client';
import { toSnakeCase, toCamelCase } from '../utils/caseConversion';

// Type definitions
export interface StudentSubmission {
  id: string;
  studentId: string;
  moduleId: string;
  sectionId: string;
  sectionTitle?: string;
  sectionType?: string;
  submissionData: any;
  assessmentResults?: any;
  timeSpentSeconds: number;
  submissionStatus: 'draft' | 'submitted' | 'reviewed';
  createdAt?: string;
  updatedAt?: string;
}

export interface SubmissionCreateData {
  studentId: string;
  moduleId: string;
  sectionId: string;
  sectionTitle?: string;
  sectionType?: string;
  submissionData: any;
  assessmentResults?: any;
  timeSpentSeconds?: number;
  submissionStatus?: 'draft' | 'submitted' | 'reviewed';
}

export interface SubmissionUpdateData {
  submissionData?: any;
  assessmentResults?: any;
  timeSpentSeconds?: number;
  submissionStatus?: 'draft' | 'submitted' | 'reviewed';
}

export class ExpressStudentSubmissionsAPI {
  /**
   * Get all submissions for a module
   * 
   * @param studentId - Student user ID
   * @param moduleId - Module ID
   * @returns Array of submission records
   */
  static async getModuleSubmissions(
    studentId: string,
    moduleId: string
  ): Promise<StudentSubmission[]> {
    try {
      const response = await expressClient.get(
        `/api/submissions?studentId=${studentId}&moduleId=${moduleId}`
      );

      if (response.error) {
        console.error('Error fetching module submissions:', response.error);
        throw new Error(response.error.message || 'Failed to fetch module submissions');
      }

      // Convert snake_case to camelCase
      const submissionsArray = Array.isArray(response.data) ? response.data : [];
      return submissionsArray.map(toCamelCase);
    } catch (error) {
      console.error('getModuleSubmissions error:', error);
      
      // Return empty array on error
      return [];
    }
  }

  /**
   * Get submission for a specific section
   * 
   * @param studentId - Student user ID
   * @param moduleId - Module ID
   * @param sectionId - Section ID
   * @returns Submission record or null if not found
   */
  static async getSectionSubmission(
    studentId: string,
    moduleId: string,
    sectionId: string
  ): Promise<StudentSubmission | null> {
    try {
      const response = await expressClient.get(
        `/api/submissions/student/${studentId}/module/${moduleId}/section/${sectionId}`
      );

      if (response.error) {
        // Return null if not found (404)
        if (response.error.code === 'DB_NOT_FOUND') {
          return null;
        }
        
        console.error('Error fetching section submission:', response.error);
        throw new Error(response.error.message || 'Failed to fetch section submission');
      }

      // Convert snake_case to camelCase
      return response.data ? toCamelCase(response.data) : null;
    } catch (error) {
      console.error('getSectionSubmission error:', error);
      
      // Return null on error
      return null;
    }
  }

  /**
   * Create submission (save student answer)
   * 
   * @param submissionData - Submission data to save
   * @returns Created submission record
   */
  static async createSubmission(submissionData: SubmissionCreateData): Promise<StudentSubmission> {
    try {
      // Validate required fields
      if (!submissionData.studentId || !submissionData.moduleId || !submissionData.sectionId) {
        throw new Error('studentId, moduleId, and sectionId are required');
      }

      if (!submissionData.submissionData) {
        throw new Error('submissionData is required');
      }

      // Convert camelCase to snake_case for backend
      const snakeCaseData = toSnakeCase(submissionData);

      const response = await expressClient.post('/api/submissions', snakeCaseData);

      if (response.error) {
        console.error('Error creating submission:', response.error);
        throw new Error(response.error.message || 'Failed to create submission');
      }

      // Convert snake_case to camelCase
      return toCamelCase(response.data);
    } catch (error) {
      console.error('createSubmission error:', error);
      throw error;
    }
  }

  /**
   * Update submission
   * 
   * @param submissionId - Submission ID
   * @param updates - Fields to update
   * @returns Updated submission record
   */
  static async updateSubmission(
    submissionId: string,
    updates: SubmissionUpdateData
  ): Promise<StudentSubmission> {
    try {
      // Convert camelCase to snake_case for backend
      const snakeCaseUpdates = toSnakeCase(updates);

      const response = await expressClient.put(
        `/api/submissions/${submissionId}`,
        snakeCaseUpdates
      );

      if (response.error) {
        console.error('Error updating submission:', response.error);
        throw new Error(response.error.message || 'Failed to update submission');
      }

      // Convert snake_case to camelCase
      return toCamelCase(response.data);
    } catch (error) {
      console.error('updateSubmission error:', error);
      throw error;
    }
  }

  /**
   * Format time spent in seconds to human-readable format
   * 
   * @param seconds - Time in seconds
   * @returns Formatted string (e.g., "2m 30s", "1h 15m")
   */
  static formatTimeSpent(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
      if (remainingSeconds === 0) {
        return `${minutes}m`;
      }
      return `${minutes}m ${remainingSeconds}s`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Get submission status badge color
   * 
   * @param status - Submission status
   * @returns Tailwind color class
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get submission status display text
   * 
   * @param status - Submission status
   * @returns Display text
   */
  static getStatusText(status: string): string {
    switch (status) {
      case 'reviewed':
        return 'Reviewed';
      case 'submitted':
        return 'Submitted';
      case 'draft':
        return 'Draft';
      default:
        return 'Unknown';
    }
  }

  /**
   * Check if submission has been graded
   * 
   * @param submission - Submission record
   * @returns True if submission has assessment results
   */
  static isGraded(submission: StudentSubmission): boolean {
    return submission.assessmentResults !== null && 
           submission.assessmentResults !== undefined &&
           Object.keys(submission.assessmentResults).length > 0;
  }

  /**
   * Get score from assessment results
   * 
   * @param assessmentResults - Assessment results object
   * @returns Score value or null if not available
   */
  static getScore(assessmentResults: any): number | null {
    if (!assessmentResults) {
      return null;
    }

    // Check for common score field names
    if (typeof assessmentResults.score === 'number') {
      return assessmentResults.score;
    }
    if (typeof assessmentResults.teacherScore === 'number') {
      return assessmentResults.teacherScore;
    }
    if (typeof assessmentResults.teacher_score === 'number') {
      return assessmentResults.teacher_score;
    }
    if (typeof assessmentResults.finalScore === 'number') {
      return assessmentResults.finalScore;
    }
    if (typeof assessmentResults.final_score === 'number') {
      return assessmentResults.final_score;
    }

    return null;
  }

  /**
   * Format submission date to relative time
   * 
   * @param submissionDate - ISO timestamp string
   * @returns Relative time string (e.g., "2 hours ago")
   */
  static formatSubmissionDate(submissionDate: string): string {
    try {
      const date = new Date(submissionDate);
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
      console.error('Error formatting submission date:', error);
      return 'recently';
    }
  }
}
