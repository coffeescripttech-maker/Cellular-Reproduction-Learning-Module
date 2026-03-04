/**
 * Express Teacher Dashboard API
 * 
 * Handles teacher dashboard data with Express.js backend
 */

import { expressClient } from './express-client';

export interface TeacherDashboardStats {
  totalStudents: number;
  publishedModules: number;
  totalModules: number;
  completedModules: number;
}

export interface LearningStyleDistribution {
  visual: number;
  auditory: number;
  reading_writing: number;
  kinesthetic: number;
}

export interface LearningTypeDistribution {
  unimodal: number;
  bimodal: number;
  trimodal: number;
  multimodal: number;
  not_set: number;
}

export interface RecentCompletion {
  id: string;
  moduleTitle: string;
  studentName: string;
  completionDate: string;
  finalScore: number;
  timeSpentMinutes: number;
  perfectSections: number;
}

export class ExpressTeacherDashboardAPI {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(teacherId: string): Promise<TeacherDashboardStats> {
    try {
      const response = await expressClient.get(`/api/teachers/${teacherId}/stats`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Backend returns data directly, not wrapped in 'data' property
      return response.data || response;
    } catch (error) {
      console.error('Error fetching teacher dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get learning style distribution (VARK)
   */
  static async getLearningStyleDistribution(teacherId: string): Promise<LearningStyleDistribution> {
    try {
      const response = await expressClient.get(`/api/teachers/${teacherId}/learning-style-distribution`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Backend returns data directly, not wrapped in 'data' property
      return response.data || response;
    } catch (error) {
      console.error('Error fetching learning style distribution:', error);
      throw error;
    }
  }

  /**
   * Get learning type distribution (Modality)
   */
  static async getLearningTypeDistribution(teacherId: string): Promise<LearningTypeDistribution> {
    try {
      const response = await expressClient.get(`/api/teachers/${teacherId}/learning-type-distribution`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Backend returns data directly, not wrapped in 'data' property
      return response.data || response;
    } catch (error) {
      console.error('Error fetching learning type distribution:', error);
      throw error;
    }
  }

  /**
   * Get recent module completions
   */
  static async getRecentCompletions(teacherId: string): Promise<RecentCompletion[]> {
    try {
      const response = await expressClient.get(`/api/teachers/${teacherId}/recent-completions`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Backend returns data directly, not wrapped in 'data' property
      return response.data || response;
    } catch (error) {
      console.error('Error fetching recent completions:', error);
      throw error;
    }
  }

  /**
   * Get student list for teacher
   */
  static async getStudentList(teacherId: string): Promise<any[]> {
    try {
      const response = await expressClient.get(`/api/teachers/${teacherId}/students`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Backend returns data directly, not wrapped in 'data' property
      return response.data || response;
    } catch (error) {
      console.error('Error fetching student list:', error);
      throw error;
    }
  }
}
