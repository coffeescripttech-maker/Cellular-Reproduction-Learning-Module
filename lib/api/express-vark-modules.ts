/**
 * Express VARK Modules API
 * 
 * This module handles VARK module management with the Express.js backend.
 */

import { expressClient } from './express-client';
import { uploadJSONToR2, fetchJSONFromR2 } from '../r2-storage';
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
   * Fetch module content with optimized streaming approach for large files
   */
  private async fetchModuleContentOptimized(moduleId: string, url: string): Promise<any> {
    try {
      console.log('📥 [OPTIMIZED] Fetching large module content for module:', moduleId);
      console.log('📊 [OPTIMIZED] Content URL:', url);
      
      const startTime = Date.now();
      
      // Step 1: Check if content is cached in browser
      const cacheKey = `module_content_${moduleId}`;
      const cachedContent = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
      
      if (cachedContent && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        const maxCacheAge = 5 * 60 * 1000; // 5 minutes
        
        if (cacheAge < maxCacheAge) {
          console.log('✅ [OPTIMIZED] Using cached content (age:', Math.round(cacheAge / 1000), 'seconds)');
          return JSON.parse(cachedContent);
        } else {
          console.log('⚠️ [OPTIMIZED] Cache expired, fetching fresh content');
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(`${cacheKey}_timestamp`);
        }
      }
      
      // Step 2: Try backend redirect with streaming (primary method)
      console.log('🔀 [OPTIMIZED] Attempting optimized fetch...');
      try {
        const response = await expressClient.get(`/api/modules/${moduleId}/content-optimized`);
        
        if (!response.error) {
          const content = response.data || response;
          
          // Cache the content
          try {
            localStorage.setItem(cacheKey, JSON.stringify(content));
            localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
            console.log('💾 [OPTIMIZED] Content cached for future use');
          } catch (cacheError) {
            console.warn('⚠️ [OPTIMIZED] Failed to cache content (too large for localStorage)');
          }
          
          const fetchTime = Date.now() - startTime;
          console.log(`✅ [OPTIMIZED] Optimized fetch completed in ${fetchTime}ms`);
          return content;
        }
      } catch (optimizedError: any) {
        console.warn('⚠️ [OPTIMIZED] Optimized fetch failed:', optimizedError.message);
      }
      
      // Step 3: Fallback to original hybrid method
      console.log('🔄 [OPTIMIZED] Falling back to original method...');
      return await this.fetchModuleContentOriginal(moduleId, url);
      
    } catch (error) {
      console.error('❌ [OPTIMIZED] All optimized fetch methods failed:', error);
      return null;
    }
  }

  /**
   * Stream large content with progress updates
   */
  private async streamLargeContent(response: Response): Promise<any> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength) : 0;
    let loaded = 0;
    const chunks: Uint8Array[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        if (total > 0) {
          const progress = Math.round((loaded / total) * 100);
          console.log(`🌊 [STREAMING] Progress: ${progress}% (${Math.round(loaded / 1024 / 1024 * 100) / 100}MB / ${Math.round(total / 1024 / 1024 * 100) / 100}MB)`);
        }
      }
      
      // Combine chunks and parse JSON
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      const text = new TextDecoder().decode(combined);
      return JSON.parse(text);
      
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Original fetch method (fallback for optimized fetch)
   */
  private async fetchModuleContentOriginal(moduleId: string, url: string): Promise<any> {
    try {
      console.log('📥 [HYBRID] Fetching module content for module:', moduleId);
      
      // Step 1: Try backend redirect to R2 (follows redirect automatically)
      console.log('🔀 [HYBRID] Attempting redirect method (primary)...');
      try {
        const redirectResponse = await expressClient.get(`/api/modules/${moduleId}/content`);
        
        if (!redirectResponse.error) {
          console.log('✅ [HYBRID] Content fetched via redirect (fast path)');
          return redirectResponse.data || redirectResponse;
        }
      } catch (redirectError: any) {
        // Check if it's a DNS error
        const isDNSError = redirectError.message?.includes('ERR_NAME_NOT_RESOLVED') ||
                          redirectError.message?.includes('ENOTFOUND') ||
                          redirectError.message?.includes('DNS');
        
        if (isDNSError) {
          console.warn('⚠️ [HYBRID] DNS error detected, switching to proxy fallback');
        } else {
          console.warn('⚠️ [HYBRID] Redirect failed:', redirectError.message);
        }
      }
      
      // Step 2: Fallback to backend proxy (works when DNS fails)
      console.log('🔄 [HYBRID] Using proxy fallback method...');
      const proxyResponse = await expressClient.get(`/api/modules/${moduleId}/content-proxy`);
      
      if (proxyResponse.error) {
        throw new Error(`Proxy fallback failed: ${proxyResponse.error.message}`);
      }
      
      console.log('✅ [HYBRID] Content fetched via proxy fallback (slower but reliable)');
      return proxyResponse.data || proxyResponse;
      
    } catch (error) {
      console.error('❌ [HYBRID] All fetch methods failed:', error);
      // Return null instead of throwing to allow fallback to database content
      return null;
    }
  }

  /**
   * Get module by ID (optimized for editing - skips R2 content fetch)
   * @param id Module ID
   * @param skipContent Whether to skip fetching full content from R2 (default: false)
   * @param useProgressive Whether to use progressive loading for large modules (default: false)
   */
  async getModuleById(id: string, skipContent: boolean = false, useProgressive: boolean = false) {
    try {
      console.log(`📥 [GET MODULE] Fetching module ${id}, skipContent: ${skipContent}, useProgressive: ${useProgressive}`);
      const startTime = Date.now();
      
      const response = await expressClient.get(`/api/modules/${id}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Convert camelCase to snake_case for frontend compatibility
      let module = convertModuleToSnakeCase(response.data);

      const dbFetchTime = Date.now() - startTime;
      console.log(`✅ [GET MODULE] Database fetch completed in ${dbFetchTime}ms`);

      // If skipContent is true, return module without R2 content fetch
      if (skipContent) {
        console.log('⚡ [GET MODULE] Skipping R2 content fetch for faster loading');
        return module;
      }

      // If module has json_content_url, fetch and merge the full content
      if (module.json_content_url) {
        console.log('📥 [GET MODULE] Module has json_content_url, fetching content...');
        const contentStartTime = Date.now();
        
        let fullContent;
        
        if (useProgressive) {
          console.log('� [GET MODULE] Using progressive loading...');
          fullContent = await this.fetchModuleContentProgressive(id);
        } else {
          console.log('📥 [GET MODULE] Using optimized content fetch...');
          fullContent = await this.fetchModuleContentOptimized(id, module.json_content_url);
        }
        
        const contentFetchTime = Date.now() - contentStartTime;
        console.log(`📊 [GET MODULE] Content fetch took ${contentFetchTime}ms`);
        
        // Only merge if fetch was successful
        if (fullContent) {
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
          
          const totalTime = Date.now() - startTime;
          console.log(`✅ [GET MODULE] Full module content merged in ${totalTime}ms total`);
          console.log('📊 Content structure sections:', module.content_structure?.sections?.length || 0);
        } else {
          console.warn('⚠️ [GET MODULE] Failed to fetch module content from storage, using database content');
        }
      }

      const totalTime = Date.now() - startTime;
      console.log(`🎯 [GET MODULE] Module fetch completed in ${totalTime}ms`);
      return module;
    } catch (error) {
      console.error('❌ [GET MODULE] Error fetching module:', error);
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
      
      let createData: any = { ...data };
      
      if (hasLargeContent && typeof window !== 'undefined') {
        console.log('📤 Module has large content, uploading to R2 storage first...');
        
        // Generate temporary ID for storage (browser-safe)
        const tempId = self.crypto.randomUUID();
        
        // Upload full module JSON to R2 Storage
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
          
          // Upload to R2 Storage
          const publicUrl = await uploadJSONToR2(
            fullModuleData,
            filename,
            'vark-modules'
          );
          
          console.log('✅ Module JSON uploaded to R2:', publicUrl);
          
          // NOW strip out large content fields to avoid 413 error
          // Only send metadata to backend
          if (createData.content_structure) delete createData.content_structure;
          if (createData.assessment_questions) delete createData.assessment_questions;
          if (createData.multimedia_content) delete createData.multimedia_content;
          if (createData.interactive_elements) delete createData.interactive_elements;
          
          // Set the json_content_url so backend knows where to fetch full content
          createData.json_content_url = publicUrl;
          createData.jsonContentUrl = publicUrl;
          
          // Add content summary for quick reference
          createData.content_summary = {
            sections_count: data.content_structure?.sections?.length || 0,
            assessment_count: data.assessment_questions?.length || 0,
            has_multimedia: Object.values(data.multimedia_content || {}).some(
              v => v && (Array.isArray(v) ? v.length > 0 : true)
            )
          };
          createData.contentSummary = createData.content_summary;
          
          console.log('📊 Sending lightweight metadata to backend (large content in R2)');
        } catch (uploadError) {
          console.error('❌ Failed to upload module JSON to R2:', uploadError);
          throw new Error(`Failed to upload module content: ${uploadError}`);
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
      const updateData: any = { ...data };
      if (updateData.id) delete updateData.id;
      if (updateData.created_by) delete updateData.created_by;
      if (updateData.createdBy) delete updateData.createdBy;
      if (updateData.creator_name) delete updateData.creator_name;
      if (updateData.creatorName) delete updateData.creatorName;
      if (updateData.created_at) delete updateData.created_at;
      if (updateData.createdAt) delete updateData.createdAt;
      if (updateData.updated_at) delete updateData.updated_at;
      if (updateData.updatedAt) delete updateData.updatedAt;
      if (updateData.category_name) delete updateData.category_name;
      if (updateData.categoryName) delete updateData.categoryName;

      // Check if module has large content that should be stored in file storage
      const hasLargeContent = updateData.content_structure?.sections && 
                              updateData.content_structure.sections.length > 0;
      
      if (hasLargeContent) {
        console.log('📤 Module has large content, processing and uploading to R2 storage...');
        
        // 🔄 AUTOMATIC BASE64 TO R2 CONVERSION
        console.log('🔄 [AUTO CONVERSION] Checking for base64 images to convert...');
        
        // 🛡️ EXTEND JWT TOKEN FOR LONG OPERATIONS
        console.log('🛡️ [AUTH PROTECTION] Ensuring token validity for long conversion...');
        try {
          // Check if we have a valid token and refresh if needed
          const authResponse = await expressClient.get('/api/auth/me');
          if (authResponse.error) {
            console.warn('⚠️ [AUTH PROTECTION] Token validation failed, attempting refresh...');
            // The expressClient will automatically handle token refresh
          } else {
            console.log('✅ [AUTH PROTECTION] Token is valid for conversion process');
          }
        } catch (authError) {
          console.warn('⚠️ [AUTH PROTECTION] Auth check failed:', authError);
          // Continue with conversion - expressClient will handle auth errors
        }
        
        let conversions = 0;
        
        // Convert base64 images in content structure sections
        if (updateData.content_structure?.sections) {
          const totalSections = updateData.content_structure.sections.length;
          
          for (let i = 0; i < totalSections; i++) {
            const section = updateData.content_structure.sections[i];
            
            // 🛡️ PERIODIC TOKEN VALIDATION (every 10 sections or 5 minutes)
            if (i > 0 && (i % 10 === 0 || (Date.now() - (this as any).lastTokenCheck || 0) > 5 * 60 * 1000)) {
              console.log(`🛡️ [AUTH PROTECTION] Validating token at section ${i + 1}/${totalSections}...`);
              try {
                const authCheck = await expressClient.get('/api/auth/me');
                if (authCheck.error) {
                  console.warn('⚠️ [AUTH PROTECTION] Token refresh triggered during conversion');
                }
                (this as any).lastTokenCheck = Date.now();
              } catch (authError) {
                console.warn('⚠️ [AUTH PROTECTION] Token validation warning:', authError);
                // Continue - expressClient handles auth automatically
              }
            }
            
            // Convert text content
            if (section.content_data?.text) {
              const { convertBase64ImagesToR2 } = await import('@/lib/ckeditor-r2-upload-adapter');
              const result = await convertBase64ImagesToR2(section.content_data.text, id);
              if (result.convertedContent !== section.content_data.text) {
                section.content_data.text = result.convertedContent;
                conversions++;
                console.log(`✅ [AUTO CONVERSION] Converted base64 images in section ${i + 1}`);
              }
            }

            // Convert read-aloud content
            if (section.content_data?.read_aloud_data?.content) {
              const { convertBase64ImagesToR2 } = await import('@/lib/ckeditor-r2-upload-adapter');
              const result = await convertBase64ImagesToR2(section.content_data.read_aloud_data.content, id);
              if (result.convertedContent !== section.content_data.read_aloud_data.content) {
                section.content_data.read_aloud_data.content = result.convertedContent;
                conversions++;
                console.log(`✅ [AUTO CONVERSION] Converted base64 images in read-aloud section ${i + 1}`);
              }
            }

            // Convert activity instructions
            if (section.content_data?.activity_data?.detailed_instructions) {
              const { convertBase64ImagesToR2 } = await import('@/lib/ckeditor-r2-upload-adapter');
              const result = await convertBase64ImagesToR2(section.content_data.activity_data.detailed_instructions, id);
              if (result.convertedContent !== section.content_data.activity_data.detailed_instructions) {
                section.content_data.activity_data.detailed_instructions = result.convertedContent;
                conversions++;
                console.log(`✅ [AUTO CONVERSION] Converted base64 images in activity instructions ${i + 1}`);
              }
            }
          }
        }
        
        if (conversions > 0) {
          console.log(`🎉 [AUTO CONVERSION] Successfully converted ${conversions} base64 images to R2 URLs`);
        } else {
          console.log('ℹ️ [AUTO CONVERSION] No base64 images found to convert');
        }
        
        // Upload full module JSON to R2 Storage
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
          
          // Upload to R2 Storage (upsert to allow updates)
          const publicUrl = await uploadJSONToR2(
            fullModuleData,
            filename,
            'vark-modules'
          );
          
          console.log('✅ Module JSON uploaded to R2:', publicUrl);
          
          // NOW strip out large content fields to avoid 413 error
          // Only send metadata to backend
          if (updateData.content_structure) delete updateData.content_structure;
          if (updateData.assessment_questions) delete updateData.assessment_questions;
          if (updateData.multimedia_content) delete updateData.multimedia_content;
          if (updateData.interactive_elements) delete updateData.interactive_elements;
          
          // Set the json_content_url so backend knows where to fetch full content
          updateData.json_content_url = publicUrl;
          updateData.jsonContentUrl = publicUrl;
          
          // Update content summary
          updateData.content_summary = {
            sections_count: data.content_structure?.sections?.length || 0,
            assessment_count: data.assessment_questions?.length || 0,
            has_multimedia: Object.values(data.multimedia_content || {}).some(
              v => v && (Array.isArray(v) ? v.length > 0 : true)
            )
          };
          updateData.contentSummary = updateData.content_summary;
          
          console.log('📊 Sending lightweight metadata to backend (large content in R2)');
        } catch (uploadError) {
          console.error('❌ Failed to upload module JSON to R2:', uploadError);
          throw new Error(`Failed to upload module content: ${uploadError}`);
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

  /**
   * Convert base64 images to R2 URLs in module content with comprehensive progress tracking
   * This helps optimize existing modules with base64 images
   */
  async convertBase64ImagesToR2(
    moduleId: string, 
    onProgress?: (progress: ModuleConversionProgress) => void
  ): Promise<ModuleConversionResult> {
    const startTime = Date.now();
    
    try {
      console.log('🚀 [MODULE CONVERSION] Starting base64 to R2 conversion for module:', moduleId);
      
      // Report initial progress
      onProgress?.({
        stage: 'loading',
        stageProgress: 0,
        overallProgress: 0,
        message: 'Loading module content...',
        moduleId
      });
      
      // Get the module with full content
      const module = await this.getModuleById(moduleId, false, false);
      if (!module) {
        throw new Error('Module not found');
      }

      console.log('📋 [MODULE CONVERSION] Module loaded:', {
        title: module.title,
        sectionsCount: module.content_structure?.sections?.length || 0,
        hasContent: !!module.content_structure
      });

      onProgress?.({
        stage: 'analyzing',
        stageProgress: 100,
        overallProgress: 10,
        message: 'Analyzing content for base64 images...',
        moduleId
      });

      let totalConversions = 0;
      let totalErrors = 0;
      let totalSkipped = 0;
      let hasChanges = false;
      const sectionResults: Array<{
        sectionIndex: number;
        sectionTitle: string;
        contentType: string;
        conversions: number;
        errors: number;
        skipped: number;
      }> = [];

      const sections = module.content_structure?.sections || [];
      const totalSections = sections.length;
      
      if (totalSections === 0) {
        console.log('ℹ️ [MODULE CONVERSION] No sections found in module');
        return {
          success: true,
          moduleId,
          totalSections: 0,
          processedSections: 0,
          totalConversions: 0,
          totalErrors: 0,
          sectionResults: [],
          duration: Date.now() - startTime
        };
      }

      console.log(`📊 [MODULE CONVERSION] Found ${totalSections} sections to process`);

      // 🛡️ INITIAL TOKEN VALIDATION FOR LONG CONVERSION
      console.log('🛡️ [AUTH PROTECTION] Validating token before starting conversion...');
      try {
        const authResponse = await expressClient.get('/api/auth/me');
        if (authResponse.error) {
          console.warn('⚠️ [AUTH PROTECTION] Token validation failed, attempting refresh...');
        } else {
          console.log('✅ [AUTH PROTECTION] Token is valid for conversion process');
        }
      } catch (authError) {
        console.warn('⚠️ [AUTH PROTECTION] Auth check failed:', authError);
      }

      // Process each section
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionIndex = i + 1;
        
        // 🛡️ PERIODIC TOKEN VALIDATION (every 10 sections or 5 minutes)
        if (i > 0 && (i % 10 === 0 || (Date.now() - (this as any).lastConversionTokenCheck || 0) > 5 * 60 * 1000)) {
          console.log(`🛡️ [AUTH PROTECTION] Validating token at section ${sectionIndex}/${totalSections}...`);
          try {
            const authCheck = await expressClient.get('/api/auth/me');
            if (authCheck.error) {
              console.warn('⚠️ [AUTH PROTECTION] Token refresh triggered during conversion');
            }
            (this as any).lastConversionTokenCheck = Date.now();
          } catch (authError) {
            console.warn('⚠️ [AUTH PROTECTION] Token validation warning:', authError);
          }
        }
        
        console.log(`\n📄 [MODULE CONVERSION] Processing section ${sectionIndex}/${totalSections}:`, {
          sectionId: section.id,
          title: section.title || 'Untitled',
          contentType: section.content_type
        });

        onProgress?.({
          stage: 'converting',
          stageProgress: Math.round((i / totalSections) * 100),
          overallProgress: 20 + Math.round((i / totalSections) * 70),
          message: `Converting section ${sectionIndex}/${totalSections}: ${section.title || 'Untitled'}`,
          moduleId,
          currentSection: sectionIndex,
          totalSections
        });

        let sectionConversions = 0;
        let sectionErrors = 0;
        let sectionSkipped = 0;

        // Convert text content
        if (section.content_data?.text) {
          console.log(`📝 [MODULE CONVERSION] Converting text content in section ${sectionIndex}`);
          
          const { convertBase64ImagesToR2 } = await import('@/lib/ckeditor-r2-upload-adapter');
          const result = await convertBase64ImagesToR2(
            section.content_data.text, 
            moduleId,
            (progress) => {
              onProgress?.({
                stage: 'converting',
                stageProgress: Math.round((i / totalSections) * 100),
                overallProgress: 20 + Math.round((i / totalSections) * 70),
                message: `Section ${sectionIndex}: Converting image ${progress.currentImage}/${progress.totalImages}`,
                moduleId,
                currentSection: sectionIndex,
                totalSections,
                imageProgress: progress
              });
            }
          );
          
          if (result.convertedContent !== section.content_data.text) {
            section.content_data.text = result.convertedContent;
            hasChanges = true;
          }
          
          sectionConversions += result.successfulConversions;
          sectionErrors += result.failedConversions;
          sectionSkipped += result.skippedImages;
          
          console.log(`✅ [MODULE CONVERSION] Text content processed: ${result.successfulConversions} conversions, ${result.failedConversions} errors, ${result.skippedImages} skipped`);
        }

        // Convert read-aloud content
        if (section.content_data?.read_aloud_data?.content) {
          console.log(`🔊 [MODULE CONVERSION] Converting read-aloud content in section ${sectionIndex}`);
          
          const { convertBase64ImagesToR2 } = await import('@/lib/ckeditor-r2-upload-adapter');
          const result = await convertBase64ImagesToR2(
            section.content_data.read_aloud_data.content, 
            moduleId,
            (progress) => {
              onProgress?.({
                stage: 'converting',
                stageProgress: Math.round((i / totalSections) * 100),
                overallProgress: 20 + Math.round((i / totalSections) * 70),
                message: `Section ${sectionIndex}: Converting read-aloud image ${progress.currentImage}/${progress.totalImages}`,
                moduleId,
                currentSection: sectionIndex,
                totalSections,
                imageProgress: progress
              });
            }
          );
          
          if (result.convertedContent !== section.content_data.read_aloud_data.content) {
            section.content_data.read_aloud_data.content = result.convertedContent;
            hasChanges = true;
          }
          
          sectionConversions += result.successfulConversions;
          sectionErrors += result.failedConversions;
          sectionSkipped += result.skippedImages;
          
          console.log(`✅ [MODULE CONVERSION] Read-aloud content processed: ${result.successfulConversions} conversions, ${result.failedConversions} errors, ${result.skippedImages} skipped`);
        }

        // Convert activity instructions
        if (section.content_data?.activity_data?.detailed_instructions) {
          console.log(`🧪 [MODULE CONVERSION] Converting activity instructions in section ${sectionIndex}`);
          
          const { convertBase64ImagesToR2 } = await import('@/lib/ckeditor-r2-upload-adapter');
          const result = await convertBase64ImagesToR2(
            section.content_data.activity_data.detailed_instructions, 
            moduleId,
            (progress) => {
              onProgress?.({
                stage: 'converting',
                stageProgress: Math.round((i / totalSections) * 100),
                overallProgress: 20 + Math.round((i / totalSections) * 70),
                message: `Section ${sectionIndex}: Converting activity image ${progress.currentImage}/${progress.totalImages}`,
                moduleId,
                currentSection: sectionIndex,
                totalSections,
                imageProgress: progress
              });
            }
          );
          
          if (result.convertedContent !== section.content_data.activity_data.detailed_instructions) {
            section.content_data.activity_data.detailed_instructions = result.convertedContent;
            hasChanges = true;
          }
          
          sectionConversions += result.successfulConversions;
          sectionErrors += result.failedConversions;
          sectionSkipped += result.skippedImages;
          
          console.log(`✅ [MODULE CONVERSION] Activity instructions processed: ${result.successfulConversions} conversions, ${result.failedConversions} errors, ${result.skippedImages} skipped`);
        }

        totalConversions += sectionConversions;
        totalErrors += sectionErrors;
        totalSkipped += sectionSkipped;

        sectionResults.push({
          sectionIndex,
          sectionTitle: section.title || 'Untitled',
          contentType: section.content_type || 'unknown',
          conversions: sectionConversions,
          errors: sectionErrors,
          skipped: sectionSkipped
        });

        console.log(`📊 [MODULE CONVERSION] Section ${sectionIndex} completed:`, {
          conversions: sectionConversions,
          errors: sectionErrors,
          skipped: sectionSkipped,
          hasChanges: sectionConversions > 0
        });
      }

      // Save the module if there were changes
      if (hasChanges) {
        console.log(`💾 [MODULE CONVERSION] Saving module with ${totalConversions} converted images`);
        
        onProgress?.({
          stage: 'saving',
          stageProgress: 0,
          overallProgress: 90,
          message: 'Saving updated module...',
          moduleId
        });
        
        // Calculate size before saving (estimate)
        const beforeSize = JSON.stringify(module).length;
        
        await this.updateModule(moduleId, module);
        
        // Calculate size after saving (estimate)
        const afterSize = JSON.stringify(module).length;
        const sizeSavedBytes = beforeSize - afterSize;
        const sizeSavedMB = sizeSavedBytes / (1024 * 1024);
        const percentageReduced = ((sizeSavedBytes / beforeSize) * 100).toFixed(1);
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🎉 [MODULE CONVERSION] MIGRATION COMPLETE!`);
        console.log(`${'='.repeat(80)}`);
        console.log(`\n📊 CONVERSION SUMMARY:`);
        console.log(`   ✅ Total Sections Processed: ${totalSections}`);
        console.log(`   ✅ Images Converted to R2: ${totalConversions}`);
        console.log(`   ⏭️  Images Already Optimized: ${totalSkipped}`);
        console.log(`   ❌ Conversion Errors: ${totalErrors}`);
        console.log(`\n💾 FILE SIZE REDUCTION:`);
        console.log(`   📉 Size Before: ${(beforeSize / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`   📈 Size After: ${(afterSize / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`   💰 Size Saved: ${sizeSavedMB.toFixed(2)} MB (${percentageReduced}% reduction)`);
        console.log(`\n🚀 PERFORMANCE BENEFITS:`);
        console.log(`   ⚡ Faster loading times (images load from R2 CDN)`);
        console.log(`   📦 Smaller JSON payload (${percentageReduced}% smaller)`);
        console.log(`   🌐 Better bandwidth usage`);
        console.log(`   💻 Reduced memory consumption`);
        console.log(`\n✨ WHAT HAPPENED:`);
        console.log(`   1. Base64 images were converted to R2 URLs`);
        console.log(`   2. Module JSON was uploaded to R2 storage`);
        console.log(`   3. Database now stores only the R2 URL (json_content_url)`);
        console.log(`   4. Images are served from R2 CDN (fast & efficient)`);
        console.log(`\n📝 NEXT STEPS:`);
        console.log(`   • Module is now optimized and ready to use`);
        console.log(`   • Students will experience faster loading`);
        console.log(`   • You can edit the module normally`);
        console.log(`   • Re-running conversion will skip already optimized images`);
        console.log(`\n${'='.repeat(80)}\n`);
        
        onProgress?.({
          stage: 'saving',
          stageProgress: 100,
          overallProgress: 95,
          message: `Module saved! Reduced size by ${sizeSavedMB.toFixed(2)}MB (${percentageReduced}%)`,
          moduleId
        });
      } else {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`✅ [MODULE CONVERSION] NO CHANGES NEEDED`);
        console.log(`${'='.repeat(80)}`);
        console.log(`\n📊 ANALYSIS SUMMARY:`);
        console.log(`   ✅ Total Sections Analyzed: ${totalSections}`);
        console.log(`   ⏭️  Images Already Optimized: ${totalSkipped}`);
        console.log(`   ℹ️  Base64 Images Found: 0`);
        console.log(`\n🎉 GOOD NEWS:`);
        console.log(`   • This module is already fully optimized!`);
        console.log(`   • All images are stored in R2 storage`);
        console.log(`   • No conversion needed`);
        console.log(`\n${'='.repeat(80)}\n`);
      }

      const duration = Date.now() - startTime;
      
      console.log(`🎉 [MODULE CONVERSION] Conversion completed for module ${moduleId}:`, {
        totalSections,
        processedSections: sections.length,
        totalConversions,
        totalErrors,
        totalSkipped,
        successRate: totalConversions > 0 ? `${((totalConversions / (totalConversions + totalErrors)) * 100).toFixed(1)}%` : 'N/A',
        duration: `${(duration / 1000).toFixed(1)}s`,
        hasChanges
      });

      onProgress?.({
        stage: 'completed',
        stageProgress: 100,
        overallProgress: 100,
        message: `Conversion completed: ${totalConversions} images converted, ${totalSkipped} skipped, ${totalErrors} errors`,
        moduleId
      });

      return {
        success: totalErrors === 0,
        moduleId,
        totalSections,
        processedSections: sections.length,
        totalConversions,
        totalErrors,
        totalSkipped,
        sectionResults,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [MODULE CONVERSION] Conversion failed:', error);
      
      onProgress?.({
        stage: 'error',
        stageProgress: 0,
        overallProgress: 0,
        message: `Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        moduleId
      });
      
      return { 
        success: false, 
        moduleId,
        totalSections: 0,
        processedSections: 0,
        totalConversions: 0, 
        totalErrors: 1,
        sectionResults: [],
        duration,
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  async fetchModuleContentProgressive(moduleId: string): Promise<any> {
    try {
      console.log('🔄 [PROGRESSIVE] Starting progressive content loading for module:', moduleId);
      const startTime = Date.now();
      
      // Step 1: Load metadata first (instant)
      console.log('📋 [PROGRESSIVE] Loading metadata...');
      const metadataResponse = await expressClient.get(`/api/modules/${moduleId}/content-progressive?part=metadata`);
      
      if (metadataResponse.error) {
        console.warn('⚠️ [PROGRESSIVE] Metadata fetch failed, falling back to optimized loading:', metadataResponse.error.message);
        // Fallback to optimized loading if progressive endpoints don't exist
        return await this.fetchModuleContentOptimized(moduleId, '');
      }
      
      console.log('🔍 [PROGRESSIVE] Raw metadata response:', metadataResponse);
      
      // Backend returns { data: metadata }, so we need to access .data.data
      const metadata = metadataResponse.data?.data || metadataResponse.data;
      if (!metadata) {
        console.warn('⚠️ [PROGRESSIVE] No metadata received, falling back to optimized loading');
        return await this.fetchModuleContentOptimized(moduleId, '');
      }
      
      console.log('🔍 [PROGRESSIVE] Metadata received:', {
        has_progressive_content: metadata.has_progressive_content,
        total_sections: metadata.content_structure?.total_sections,
        title: metadata.title
      });
      
      const metadataTime = Date.now() - startTime;
      console.log(`✅ [PROGRESSIVE] Metadata loaded in ${metadataTime}ms`);
      
      // If no progressive content available, return metadata as-is
      if (!metadata.has_progressive_content) {
        console.log('📝 [PROGRESSIVE] No progressive content available, falling back to optimized loading');
        // For large modules, we still need to load the full content, just not progressively
        return await this.fetchModuleContentOptimized(moduleId, '');
      }
      
      // Step 2: Load sections progressively
      const totalSections = metadata.content_structure?.total_sections || 0;
      console.log(`📊 [PROGRESSIVE] Module has ${totalSections} sections to load`);
      
      // For very large modules (>100 sections), fall back to optimized loading
      if (totalSections > 100) {
        console.log('⚠️ [PROGRESSIVE] Module too large for progressive loading, using optimized loading');
        return await this.fetchModuleContentOptimized(moduleId, '');
      }
      
      if (totalSections === 0) {
        // No sections to load, just get assessments
        console.log('📝 [PROGRESSIVE] Loading assessments only...');
        const assessmentsResponse = await expressClient.get(`/api/modules/${moduleId}/content-progressive?part=assessments`);
        
        if (!assessmentsResponse.error) {
          // Backend returns { data: assessmentData }, so access .data.data or .data
          const assessmentData = assessmentsResponse.data?.data || assessmentsResponse.data;
          metadata.assessment_questions = assessmentData?.assessment_questions || [];
        }
        
        return metadata;
      }
      
      // Step 3: Load sections in batches for better performance
      const batchSize = 3; // Load 3 sections at a time
      const sections = [];
      let multimediaContent = {};
      let interactiveElements = {};
      
      console.log(`🔄 [PROGRESSIVE] Loading ${totalSections} sections in batches of ${batchSize}...`);
      
      for (let i = 0; i < totalSections; i += batchSize) {
        const batchPromises = [];
        const batchEnd = Math.min(i + batchSize, totalSections);
        
        console.log(`📦 [PROGRESSIVE] Loading sections ${i} to ${batchEnd - 1}...`);
        
        for (let j = i; j < batchEnd; j++) {
          batchPromises.push(
            Promise.race([
              expressClient.get(`/api/modules/${moduleId}/content-progressive?part=section-${j}`),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Section request timeout')), 30000)
              )
            ])
          );
        }
        
        const batchResults = await Promise.all(batchPromises);
        
        let failedCount = 0;
        batchResults.forEach((result, index) => {
          if (!result.error && result.data) {
            // Backend returns { data: sectionData }, so access .data.data or .data
            const sectionData = result.data?.data || result.data;
            if (sectionData && sectionData.section) {
              sections[i + index] = sectionData.section;
              
              // Merge multimedia and interactive content
              if (sectionData.multimedia_content) {
                multimediaContent = { ...multimediaContent, ...sectionData.multimedia_content };
              }
              if (sectionData.interactive_elements) {
                interactiveElements = { ...interactiveElements, ...sectionData.interactive_elements };
              }
            } else {
              console.warn(`⚠️ [PROGRESSIVE] Invalid section data for section ${i + index}`);
              sections[i + index] = null;
            }
          } else {
            failedCount++;
            console.warn(`⚠️ [PROGRESSIVE] Failed to load section ${i + index}:`, result.error?.message);
            sections[i + index] = null; // Placeholder for failed section
          }
        });
        
        // If too many sections fail, fall back to optimized loading
        if (failedCount >= batchSize && i === 0) {
          console.warn('⚠️ [PROGRESSIVE] Too many section failures, falling back to optimized loading');
          return await this.fetchModuleContentOptimized(moduleId, '');
        }
        
        const batchTime = Date.now() - startTime;
        console.log(`✅ [PROGRESSIVE] Batch ${Math.floor(i / batchSize) + 1} loaded in ${batchTime}ms`);
      }
      
      // Step 4: Load assessments
      console.log('📝 [PROGRESSIVE] Loading assessments...');
      const assessmentsResponse = await expressClient.get(`/api/modules/${moduleId}/content-progressive?part=assessments`);
      
      let assessmentQuestions = [];
      if (!assessmentsResponse.error) {
        // Backend returns { data: assessmentData }, so access .data.data or .data
        const assessmentData = assessmentsResponse.data?.data || assessmentsResponse.data;
        assessmentQuestions = assessmentData?.assessment_questions || [];
      }
      
      // Step 5: Combine everything
      const completeModule = {
        ...metadata,
        content_structure: {
          ...metadata.content_structure,
          sections: sections.filter(section => section !== null) // Remove failed sections
        },
        assessment_questions: assessmentQuestions,
        multimedia_content: multimediaContent,
        interactive_elements: interactiveElements
      };
      
      const totalTime = Date.now() - startTime;
      console.log(`🎉 [PROGRESSIVE] Complete module loaded in ${totalTime}ms`);
      console.log(`📊 [PROGRESSIVE] Loaded ${sections.length} sections, ${assessmentQuestions.length} assessments`);
      
      // Cache the complete module
      const cacheKey = `module_content_${moduleId}`;
      try {
        localStorage.setItem(cacheKey, JSON.stringify(completeModule));
        localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
        console.log('💾 [PROGRESSIVE] Complete module cached');
      } catch (cacheError) {
        console.warn('⚠️ [PROGRESSIVE] Failed to cache complete module:', cacheError.message);
      }
      
      return completeModule;
      
    } catch (error) {
      console.error('❌ [PROGRESSIVE] Progressive loading failed:', error);
      console.log('🔄 [PROGRESSIVE] Falling back to optimized loading...');
      
      // Fallback to optimized loading if progressive loading fails completely
      try {
        return await this.fetchModuleContentOptimized(moduleId, '');
      } catch (fallbackError) {
        console.error('❌ [PROGRESSIVE] Fallback also failed:', fallbackError);
        throw error; // Throw original error
      }
    }
  }
}

// Export singleton instance
export const expressVARKModulesAPI = new ExpressVARKModulesAPI();

// Types for module conversion progress tracking
export interface ModuleConversionProgress {
  stage: 'loading' | 'analyzing' | 'converting' | 'saving' | 'completed' | 'error';
  stageProgress: number; // 0-100
  overallProgress: number; // 0-100
  message: string;
  moduleId: string;
  currentSection?: number;
  totalSections?: number;
  imageProgress?: {
    currentImage: number;
    totalImages: number;
    percentage: number;
    status: 'converting' | 'completed' | 'failed';
    currentImageType?: string;
    currentImageSize?: number;
    successfulConversions?: number;
    failedConversions?: number;
  };
}

export interface ModuleConversionResult {
  success: boolean;
  moduleId: string;
  totalSections: number;
  processedSections: number;
  totalConversions: number;
  totalErrors: number;
  totalSkipped: number;
  sectionResults: Array<{
    sectionIndex: number;
    sectionTitle: string;
    contentType: string;
    conversions: number;
    errors: number;
    skipped: number;
  }>;
  duration: number;
  error?: string;
}

