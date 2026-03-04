/**
 * Express Files API
 * 
 * This module handles file uploads and management with the Express.js backend.
 */

import { expressClient } from './express-client';

export class ExpressFilesAPI {
  /**
   * Upload a file
   */
  static async uploadFile(file: File, metadata?: Record<string, any>) {
    try {
      console.log('Uploading file via Express API:', file.name);

      const response = await expressClient.uploadFile('/api/files/upload', file, metadata);

      if (response.error) {
        throw new Error(response.error.message);
      }

      console.log('✅ File uploaded:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file',
      };
    }
  }

  /**
   * Get file by ID
   */
  static async getFile(fileId: string) {
    try {
      const response = await expressClient.get(`/api/files/${fileId}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch file',
      };
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(fileId: string) {
    try {
      const response = await expressClient.delete(`/api/files/${fileId}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file',
      };
    }
  }

  /**
   * Upload profile photo
   */
  static async uploadProfilePhoto(file: File, userId: string) {
    try {
      const response = await expressClient.uploadFile('/api/files/upload', file, {
        type: 'profile_photo',
        userId,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload profile photo',
      };
    }
  }

  /**
   * Upload module image
   */
  static async uploadModuleImage(file: File, moduleId: string) {
    try {
      const response = await expressClient.uploadFile('/api/files/upload', file, {
        type: 'module_image',
        moduleId,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error uploading module image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload module image',
      };
    }
  }
}
