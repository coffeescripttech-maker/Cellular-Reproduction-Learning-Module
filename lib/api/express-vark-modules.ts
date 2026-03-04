/**
 * Express VARK Modules API
 * 
 * This module handles VARK module management with the Express.js backend.
 */

import { expressClient } from './express-client';
import { supabase } from '@/lib/supabase';
import {
  VARKModule,
  CreateVARKModuleData,
  UpdateVARKModuleData,
  VARKModuleFilters,
} from '@/types/vark-module';

/**
 * Convert camelCase module fields to snake_case for frontend compatibility
 */
function convertModuleToSnakeCase(module: any) {
  if (!module) return null;
  
  return {
    ...module,
    content_structure: module.contentStructure || module.content_structure,
    difficulty_level: module.difficultyLevel || module.difficulty_level,
    estimated_duration_minutes: module.estimatedDurationMinutes || module.estimated_duration_minutes,
    learning_objectives: module.learningObjectives || module.learning_objectives,
    multimedia_content: module.multimediaContent || module.multimedia_content,
    interactive_elements: module.interactiveElements || module.interactive_elements,
    assessment_questions: module.assessmentQuestions || module.assessment_questions,
    module_metadata: module.moduleMetadata || module.module_metadata,
    json_backup_url: module.jsonBackupUrl || module.json_backup_url,
    json_content_url: module.jsonContentUrl || module.json_content_url,
    content_summary: module.contentSummary || module.content_summary,
    target_class_id: module.targetClassId || module.target_class_id,
    target_learning_styles: module.targetLearningStyles || module.target_learning_styles,
    prerequisite_module_id: module.prerequisiteModuleId || module.prerequisite_module_id,
    is_published: module.isPublished !== undefined ? module.isPublished : module.is_published,
    created_by: module.createdBy || module.created_by,
    creator_name: module.creatorName || module.creator_name,
    category_id: module.categoryId || module.category_id,
    category_name: module.categoryName || module.category_name,
    created_at: module.createdAt || module.created_at,
    updated_at: module.updatedAt || module.updated_at
  };
}

export class ExpressVARKModulesAPI {
  /**
   * Get all modules with optional filters
   */
  async getModules(filters?: VARKModuleFilters): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.grade_level) {
        queryParams.append('gradeLevel', filters.grade_level);
      }
      if (filters?.learning_style) {
        queryParams.append('learningStyle', filters.learning_style);
      }
      if (filters?.subject) {
        queryParams.append('category', filters.subject);
      }

      const endpoint = `/api/modules${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await expressClient.get(endpoint);

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Convert camelCase to snake_case for frontend compatibility
      const modules = response.data || [];
      return modules.map(convertModuleToSnakeCase);
    } catch (error) {
      console.error('Error fetching modules:', error);
      throw error;
    }
  }

  /**
   * Fetch module content from external URL
   */
  private async fetchModuleContent(url: string): Promise<any> {
    try {
      console.log('📥 Fetching module content from:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.statusText}`);
      }
      
      const content = await response.json();
      console.log('✅ Module content fetched successfully');
      return content;
    } catch (error) {
      console.error('❌ Error fetching module content:', error);
      throw error;
    }
  }

  /**
   * Get module by ID
   * If module has json_content_url, fetches and merges full content from storage
   */
  async getModuleById(id: string) {
    try {
      const response = await expressClient.get(`/api/modules/${id}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Convert camelCase to snake_case for frontend compatibility
      let module = convertModuleToSnakeCase(response.data);

      // If module has json_content_url, fetch and merge the full content
      if (module.json_content_url) {
        try {
          console.log('📥 Module has json_content_url, fetching full content...');
          const fullContent = await this.fetchModuleContent(module.json_content_url);
          
          // Merge full content with database metadata
          // Database fields take precedence for metadata
          module = {
            ...fullContent,
            // Preserve database-only fields (source of truth)
            id: module.id,
            created_by: module.created_by,
            creator_name: module.creator_name,
            created_at: module.created_at,
            updated_at: module.updated_at,
            is_published: module.is_published,
            json_content_url: module.json_content_url,
            json_backup_url: module.json_backup_url,
            category_id: module.category_id,
            category_name: module.category_name
          };
          
          console.log('✅ Full module content merged from storage');
          console.log('📊 Content structure sections:', module.content_structure?.sections?.length || 0);
        } catch (error) {
          console.warn('⚠️ Failed to fetch module content from storage:', error);
          console.log('📋 Using database content as fallback');
          // Continue with database content if fetch fails
        }
      }

      return module;
    } catch (error) {
      console.error('Error fetching module:', error);
      throw error;
    }
  }

  /**
   * Create a new module
   */
  async createModule(data: CreateVARKModuleData) {
    try {
      console.log('📝 Creating new VARK module...');
      
      // Check if module has large content that should be stored in file storage
      const hasLargeContent = data.content_structure?.sections && 
                              data.content_structure.sections.length > 0;
      
      let createData = { ...data };
      
      if (hasLargeContent && typeof window !== 'undefined') {
        console.log('📤 Module has content sections, will upload to Supabase storage after creation...');
        
        // Generate temporary ID for storage (browser-safe)
        const tempId = self.crypto.randomUUID();
        
        // Upload full module JSON to Supabase Storage
        const fullModuleData = {
          id: tempId,
          ...data
        };
        
        try {
          // Create JSON blob
          const jsonString = JSON.stringify(fullModuleData, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          
          const sizeInMB = blob.size / (1024 * 1024);
          console.log(`📊 Module JSON size: ${sizeInMB.toFixed(2)} MB`);
          
          // Use consistent filename for easy retrieval
          const filename = `module-${tempId}.json`;
          const filepath = `vark-modules/${filename}`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('module-content')
            .upload(filepath, blob, {
              contentType: 'application/json',
              upsert: false // New file, don't overwrite
            });
          
          if (uploadError) {
            console.error('❌ Failed to upload module JSON:', uploadError);
            throw new Error(`Storage upload failed: ${uploadError.message}`);
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('module-content')
            .getPublicUrl(filepath);
          
          console.log('✅ Module JSON uploaded to Supabase:', urlData.publicUrl);
          
          // Update the json_content_url in the create data
          createData.json_content_url = urlData.publicUrl;
          createData.jsonContentUrl = urlData.publicUrl;
          
          // Update content summary
          createData.content_summary = {
            sections_count: data.content_structure?.sections?.length || 0,
            assessment_count: data.assessment_questions?.length || 0,
            has_multimedia: Object.values(data.multimedia_content || {}).some(
              v => v && (Array.isArray(v) ? v.length > 0 : true)
            )
          };
          createData.contentSummary = createData.content_summary;
          
          console.log('📊 Content summary created:', createData.content_summary);
        } catch (uploadError) {
          console.warn('⚠️ Failed to upload module JSON to storage:', uploadError);
          console.log('📋 Continuing with database-only creation...');
          // Continue with creation even if file upload fails
        }
      }

      const response = await expressClient.post('/api/modules', createData);

      if (response.error) {
        throw new Error(response.error.message);
      }

      console.log('✅ Module created successfully with json_content_url:', response.data.jsonContentUrl || response.data.json_content_url);

      return convertModuleToSnakeCase(response.data);
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  }

  /**
   * Update module
   */
  async updateModule(id: string, data: UpdateVARKModuleData) {
    try {
      console.log('📝 Updating VARK module:', id);
      
      // Strip out read-only fields that shouldn't be updated
      const updateData = { ...data };
      delete updateData.id;
      delete updateData.created_by;
      delete updateData.createdBy;
      delete updateData.creator_name;
      delete updateData.creatorName;
      delete updateData.created_at;
      delete updateData.createdAt;
      delete updateData.updated_at;
      delete updateData.updatedAt;
      delete updateData.category_name;
      delete updateData.categoryName;

      // Check if module has large content that should be stored in file storage
      const hasLargeContent = updateData.content_structure?.sections && 
                              updateData.content_structure.sections.length > 0;
      
      if (hasLargeContent) {
        console.log('📤 Module has content sections, uploading to Supabase storage...');
        
        // Upload full module JSON to Supabase Storage
        const fullModuleData = {
          id,
          ...updateData
        };
        
        try {
          // Create JSON blob
          const jsonString = JSON.stringify(fullModuleData, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          
          const sizeInMB = blob.size / (1024 * 1024);
          console.log(`📊 Module JSON size: ${sizeInMB.toFixed(2)} MB`);
          
          // Use consistent filename for easy retrieval
          const filename = `module-${id}.json`;
          const filepath = `vark-modules/${filename}`;
          
          // Upload to Supabase Storage (upsert to allow updates)
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('module-content')
            .upload(filepath, blob, {
              contentType: 'application/json',
              upsert: true // Allow overwriting on updates
            });
          
          if (uploadError) {
            console.error('❌ Failed to upload module JSON:', uploadError);
            throw new Error(`Storage upload failed: ${uploadError.message}`);
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('module-content')
            .getPublicUrl(filepath);
          
          console.log('✅ Module JSON uploaded to Supabase:', urlData.publicUrl);
          
          // Update the json_content_url in the update data
          updateData.json_content_url = urlData.publicUrl;
          updateData.jsonContentUrl = urlData.publicUrl;
          
          // Update content summary
          updateData.content_summary = {
            sections_count: updateData.content_structure?.sections?.length || 0,
            assessment_count: updateData.assessment_questions?.length || 0,
            has_multimedia: Object.values(updateData.multimedia_content || {}).some(
              v => v && (Array.isArray(v) ? v.length > 0 : true)
            )
          };
          updateData.contentSummary = updateData.content_summary;
          
          console.log('📊 Content summary updated:', updateData.content_summary);
        } catch (uploadError) {
          console.warn('⚠️ Failed to upload module JSON to storage:', uploadError);
          console.log('📋 Continuing with database-only update...');
          // Continue with update even if file upload fails
        }
      }

      const response = await expressClient.put(`/api/modules/${id}`, updateData);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return convertModuleToSnakeCase(response.data);
    } catch (error) {
      console.error('Error updating module:', error);
      throw error;
    }
  }

  /**
   * Delete module
   */
  async deleteModule(id: string) {
    try {
      const response = await expressClient.delete(`/api/modules/${id}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting module:', error);
      throw error;
    }
  }

  /**
   * Toggle module publish status
   */
  async toggleModulePublish(id: string, isPublished: boolean): Promise<void> {
    try {
      const response = await expressClient.put(`/api/modules/${id}`, {
        isPublished: isPublished
      });

      if (response.error) {
        throw new Error(response.error.message);
      }
    } catch (error) {
      console.error('Error toggling module publish status:', error);
      throw error;
    }
  }

  /**
   * Import module from JSON
   */
  async importModule(moduleData: any) {
    try {
      const response = await expressClient.post('/api/modules/import', moduleData);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error importing module:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import module',
      };
    }
  }

  /**
   * Get module sections
   */
  async getModuleSections(moduleId: string) {
    try {
      const response = await expressClient.get(`/api/modules/${moduleId}/sections`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching module sections:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch module sections',
      };
    }
  }

  /**
   * Create module section
   */
  async createModuleSection(moduleId: string, sectionData: any) {
    try {
      const response = await expressClient.post(`/api/modules/${moduleId}/sections`, sectionData);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating module section:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create module section',
      };
    }
  }

  /**
   * Get student progress for a module
   */
  async getModuleProgress(studentId: string, moduleId: string) {
    try {
      const response = await expressClient.get(`/api/progress/student/${studentId}/module/${moduleId}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching module progress:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch module progress',
      };
    }
  }

  /**
   * Update student progress for a module
   */
  async updateModuleProgress(progressData: any) {
    try {
      const response = await expressClient.post('/api/progress', progressData);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating module progress:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update module progress',
      };
    }
  }

  /**
   * Get student stats (completions and badges)
   */
  async getStudentStats(studentId: string) {
    try {
      const response = await expressClient.get(`/api/students/${studentId}/stats`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching student stats:', error);
      // Return empty stats if endpoint doesn't exist yet
      return {
        completions: [],
        badges: [],
        totalModulesCompleted: 0,
        totalBadgesEarned: 0,
        averageScore: 0,
        totalTimeSpent: 0
      };
    }
  }

  /**
   * Get student module completion
   */
  async getStudentModuleCompletion(studentId: string, moduleId: string) {
    try {
      const response = await expressClient.get(`/api/students/${studentId}/modules/${moduleId}/completion`);

      // If 404, return null (module not completed yet)
      if (response.error && response.error.code === 'NOT_FOUND') {
        return null;
      }

      if (response.error) {
        console.error('Error fetching module completion:', response.error);
        return null;
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching module completion:', error);
      return null;
    }
  }

  /**
   * Save student submission
   */
  async saveSubmission(submissionData: any) {
    try {
      const response = await expressClient.post('/api/submissions', submissionData);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error saving submission:', error);
      throw error;
    }
  }

  /**
   * Complete module
   */
  async completeModule(completionData: any) {
    try {
      const response = await expressClient.post('/api/completions', completionData);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error completing module:', error);
      throw error;
    }
  }

  /**
   * Award badge to student
   */
  async awardBadge(badgeData: any) {
    try {
      const response = await expressClient.post('/api/badges', badgeData);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  }

  /**
   * Get student progress for all modules
   */
  async getStudentProgress(studentId: string) {
    try {
      const response = await expressClient.get(`/api/completions/student/${studentId}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data || [];
    } catch (error) {
      console.error('Error fetching student progress:', error);
      return [];
    }
  }

  /**
   * Get student submissions for a module
   */
  async getStudentSubmissions(studentId: string, moduleId: string) {
    try {
      const response = await expressClient.get(`/api/submissions?studentId=${studentId}&moduleId=${moduleId}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data || [];
    } catch (error) {
      console.error('Error fetching student submissions:', error);
      return [];
    }
  }

  /**
   * Get module submission statistics
   */
  async getModuleSubmissionStats(moduleId: string) {
    try {
      const response = await expressClient.get(`/api/modules/${moduleId}/submission-stats`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data || {
        totalStudents: 0,
        submittedCount: 0,
        averageScore: 0,
        completionRate: 0
      };
    } catch (error) {
      console.error('Error fetching module submission stats:', error);
      return {
        totalStudents: 0,
        submittedCount: 0,
        averageScore: 0,
        completionRate: 0
      };
    }
  }

  /**
   * Get all completions for a module
   */
  async getModuleCompletions(moduleId: string) {
    try {
      const response = await expressClient.get(`/api/modules/${moduleId}/completions`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data || [];
    } catch (error) {
      console.error('Error fetching module completions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const expressVARKModulesAPI = new ExpressVARKModulesAPI();

