/**
 * Express Students API
 * 
 * This module handles student management with the Express.js backend.
 */

import { expressClient } from './express-client';
import { toast } from 'sonner';

interface StudentData {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  gradeLevel?: string;
  learningStyle?: 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic';
  preferredModules?: string[];
  learningType?: string;
  onboardingCompleted?: boolean;
}

interface BulkImportStudent {
  name: string;
  username: string;
  password: string;
  preferred_modules: string[];
  type: string | null;
}

export class ExpressStudentAPI {
  /**
   * Parse full name from "Last, First Middle" format
   */
  static parseName(fullName: string): {
    firstName: string;
    middleName?: string;
    lastName: string;
  } {
    const parts = fullName.split(',').map((p) => p.trim());

    if (parts.length < 2) {
      const nameParts = fullName.trim().split(' ');
      return {
        firstName: nameParts[0] || '',
        lastName: nameParts[nameParts.length - 1] || '',
        middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : undefined,
      };
    }

    const lastName = parts[0];
    const remainingName = parts[1].trim().split(' ');

    const firstName = remainingName[0] || '';
    const middleName = remainingName.length > 1 ? remainingName.slice(1).join(' ') : undefined;

    return { firstName, middleName, lastName };
  }

  /**
   * Map VARK module names to learning style
   */
  static mapLearningStyle(
    preferredModules: string[]
  ): 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic' | undefined {
    if (!preferredModules || preferredModules.length === 0) {
      return undefined;
    }

    const moduleMap: Record<string, string> = {
      Visual: 'visual',
      Aural: 'auditory',
      'Read/Write': 'reading_writing',
      Kinesthetic: 'kinesthetic',
    };

    for (const module of preferredModules) {
      if (moduleMap[module]) {
        return moduleMap[module] as any;
      }
    }

    return 'reading_writing';
  }

  /**
   * Create a single student
   */
  static async createStudent(data: StudentData) {
    try {
      console.log('🔵 EXPRESS API: Creating student:', data.email);
      console.log('🔵 EXPRESS API: Password field:', data.password);
      console.log('🔵 EXPRESS API: Full data:', JSON.stringify(data, null, 2));

      const payload = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        fullName: data.fullName,
        gradeLevel: data.gradeLevel,
        learningStyle: data.learningStyle,
        preferredModules: data.preferredModules,
        learningType: data.learningType,
        onboardingCompleted: data.onboardingCompleted,
      };

      console.log('🔵 EXPRESS API: Payload to send:', JSON.stringify(payload, null, 2));

      const response = await expressClient.post('/api/students', payload);

      if (response.error) {
        throw new Error(response.error.message);
      }

      console.log('✅ Student created:', data.email);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating student:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create student',
      };
    }
  }

  /**
   * Bulk import students from JSON
   */
  static async bulkImportStudents(students: BulkImportStudent[]) {
    try {
      console.log(`📥 Starting bulk import of ${students.length} students...`);

      const response = await expressClient.post('/api/students/bulk-import', students);

      if (response.error) {
        throw new Error(response.error.message);
      }

      console.log('📊 Bulk import results:', response.data);
      return response.data;
    } catch (error) {
      console.error('Bulk import error:', error);
      return {
        success: 0,
        failed: students.length,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Failed to import students'],
      };
    }
  }

  /**
   * Get all students
   */
  static async getStudents() {
    try {
      const response = await expressClient.get('/api/students');

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching students:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch students',
      };
    }
  }

  /**
   * Get student by ID
   */
  static async getStudentById(id: string) {
    try {
      const response = await expressClient.get(`/api/students/${id}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching student:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch student',
      };
    }
  }

  /**
   * Update student
   */
  static async updateStudent(id: string, updates: Partial<StudentData>) {
    try {
      const response = await expressClient.put(`/api/students/${id}`, updates);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating student:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update student',
      };
    }
  }

  /**
   * Delete student
   */
  static async deleteStudent(id: string) {
    try {
      const response = await expressClient.delete(`/api/students/${id}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting student:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete student',
      };
    }
  }

  /**
   * Reset student password
   */
  static async resetStudentPassword(id: string, newPassword: string) {
    try {
      const response = await expressClient.post(`/api/students/${id}/reset-password`, {
        newPassword,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset password',
      };
    }
  }
}
