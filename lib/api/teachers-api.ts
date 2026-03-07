import { expressClient } from './express-client';

export interface Teacher {
  id: string;
  email: string;
  role: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  full_name: string;
  phone_number?: string;
  department?: string;
  specialization?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTeacherData {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  department?: string;
  specialization?: string;
}

export interface UpdateTeacherData {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  department?: string;
  specialization?: string;
}

export class TeachersAPI {
  /**
   * Get all teachers
   */
  static async getTeachers(): Promise<{ success: boolean; data?: Teacher[]; error?: string }> {
    try {
      const response = await expressClient.get('/api/teachers');
      
      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get teachers error:', error);
      return { success: false, error: 'Failed to fetch teachers' };
    }
  }

  /**
   * Get teacher by ID
   */
  static async getTeacherById(id: string): Promise<{ success: boolean; data?: Teacher; error?: string }> {
    try {
      const response = await expressClient.get(`/api/teachers/${id}`);
      
      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get teacher error:', error);
      return { success: false, error: 'Failed to fetch teacher' };
    }
  }

  /**
   * Create a new teacher
   */
  static async createTeacher(data: CreateTeacherData): Promise<{ success: boolean; data?: Teacher; error?: string }> {
    try {
      const response = await expressClient.post('/api/teachers', data);
      
      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create teacher error:', error);
      return { success: false, error: 'Failed to create teacher' };
    }
  }

  /**
   * Update teacher
   */
  static async updateTeacher(id: string, data: UpdateTeacherData): Promise<{ success: boolean; data?: Teacher; error?: string }> {
    try {
      const response = await expressClient.put(`/api/teachers/${id}`, data);
      
      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update teacher error:', error);
      return { success: false, error: 'Failed to update teacher' };
    }
  }

  /**
   * Delete teacher
   */
  static async deleteTeacher(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await expressClient.delete(`/api/teachers/${id}`);
      
      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete teacher error:', error);
      return { success: false, error: 'Failed to delete teacher' };
    }
  }
}
