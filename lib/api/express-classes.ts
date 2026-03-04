/**
 * Express Classes API
 * 
 * This module handles class management with the Express.js backend.
 */

import { expressClient } from './express-client';

export class ExpressClassesAPI {
  /**
   * Get classes for a student
   */
  async getStudentClasses(studentId: string) {
    try {
      const response = await expressClient.get(`/api/classes/student/${studentId}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data || [];
    } catch (error) {
      console.error('Error fetching student classes:', error);
      return [];
    }
  }

  /**
   * Get classes by teacher
   */
  async getTeacherClasses(teacherId: string) {
    try {
      const response = await expressClient.get(`/api/classes/teacher/${teacherId}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Backend returns { success: true, data: classes[], pagination: {...} }
      return response.data || response || [];
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      return [];
    }
  }

  /**
   * Get class by ID
   */
  async getClassById(classId: string) {
    try {
      const response = await expressClient.get(`/api/classes/${classId}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching class:', error);
      return null;
    }
  }

  /**
   * Get students in a class
   */
  async getClassStudents(classId: string) {
    try {
      const response = await expressClient.get(`/api/classes/${classId}/students`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data || [];
    } catch (error) {
      console.error('Error fetching class students:', error);
      return [];
    }
  }

  /**
   * Create a new class
   */
  async createClass(classData: any) {
    try {
      const response = await expressClient.post('/api/classes', classData);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error creating class:', error);
      throw error;
    }
  }

  /**
   * Update class
   */
  async updateClass(classId: string, updates: any) {
    try {
      const response = await expressClient.put(`/api/classes/${classId}`, updates);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  }

  /**
   * Delete class
   */
  async deleteClass(classId: string) {
    try {
      const response = await expressClient.delete(`/api/classes/${classId}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return true;
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  }

  /**
   * Add student to class
   */
  async addStudentToClass(classId: string, studentId: string) {
    try {
      const response = await expressClient.post(`/api/classes/${classId}/students`, {
        studentId
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return true;
    } catch (error) {
      console.error('Error adding student to class:', error);
      throw error;
    }
  }

  /**
   * Remove student from class
   */
  async removeStudentFromClass(classId: string, studentId: string) {
    try {
      const response = await expressClient.delete(`/api/classes/${classId}/students/${studentId}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return true;
    } catch (error) {
      console.error('Error removing student from class:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const expressClassesAPI = new ExpressClassesAPI();
