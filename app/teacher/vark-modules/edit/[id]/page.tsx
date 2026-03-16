'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { VARKModulesAPI } from '@/lib/api/unified-api';
import { expressVARKModulesAPI } from '@/lib/api/express-vark-modules';
import VARKModuleBuilder from '@/components/vark-modules/vark-module-builder';
import { type VARKModule } from '@/types/vark-module';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Loader2, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function EditVARKModulePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [module, setModule] = useState<VARKModule | null>(null);
  const [availableModules, setAvailableModules] = useState<VARKModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const [loadingStages, setLoadingStages] = useState<Array<{
    name: string;
    completed: boolean;
    current: boolean;
    duration?: string;
  }>>([]);

  const moduleId = params.id as string;

  useEffect(() => {
    if (moduleId && user) {
      loadModule();
    }
  }, [moduleId, user]);

  const loadModule = async () => {
    try {
      setLoading(true);
      setLoadingProgress(0);
      
      // Initialize loading stages
      const stages = [
        { name: 'Initializing module editor', completed: false, current: true },
        { name: 'Loading prerequisite modules', completed: false, current: false },
        { name: 'Fetching module metadata', completed: false, current: false },
        { name: 'Loading content from storage', completed: false, current: false },
        { name: 'Preparing editor interface', completed: false, current: false }
      ];
      setLoadingStages(stages);
      setLoadingStage('Initializing module editor...');
      
      console.log('📥 Fetching module for editing:', moduleId);
      
      // Stage 1: Initialize (10%)
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoadingProgress(10);
      stages[0].completed = true;
      stages[0].current = false;
      stages[1].current = true;
      setLoadingStages([...stages]);
      setLoadingStage('Loading prerequisite modules...');
      
      // Stage 2: Fetch prerequisite modules (30%)
      const startTime = Date.now();
      const allModules = await VARKModulesAPI.getModules();
      const prerequisiteTime = Date.now() - startTime;
      setAvailableModules(allModules);
      console.log('📚 Loaded', allModules.length, 'modules for prerequisite selection');
      
      setLoadingProgress(30);
      stages[1].completed = true;
      stages[1].current = false;
      stages[1].duration = `${prerequisiteTime}ms`;
      stages[2].current = true;
      setLoadingStages([...stages]);
      setLoadingStage('Fetching module metadata...');
      
      // Stage 3: Fetch module metadata (50%)
      await new Promise(resolve => setTimeout(resolve, 300));
      setLoadingProgress(50);
      stages[2].completed = true;
      stages[2].current = false;
      stages[3].current = true;
      setLoadingStages([...stages]);
      setLoadingStage('Loading full content structure from storage...');
      
      // Stage 4: Load full content (80%)
      console.log('📥 Loading full module content for editing...');
      const contentStartTime = Date.now();
      
      // Update progress more frequently for large files
      const progressInterval = setInterval(() => {
        if (loadingProgress < 75) {
          setLoadingProgress(prev => Math.min(prev + 2, 75));
        }
      }, 200);
      
      // Use progressive loading for better performance on large modules
      console.log('🔄 Attempting progressive loading for better performance...');
      const moduleData = await expressVARKModulesAPI.getModuleById(moduleId, false, true); // skipContent = false, useProgressive = true
      clearInterval(progressInterval);
      
      const contentTime = Date.now() - contentStartTime;
      
      if (!moduleData) {
        toast.error('Module not found');
        router.push('/teacher/vark-modules');
        return;
      }

      setLoadingProgress(80);
      stages[3].completed = true;
      stages[3].current = false;
      stages[3].duration = `${contentTime}ms`;
      stages[4].current = true;
      setLoadingStages([...stages]);
      setLoadingStage('Preparing editor interface...');

      // Allow any teacher to edit any module (collaborative editing)
      console.log('✅ Module loaded for editing (full content):', moduleData.title);
      console.log('👤 Current user:', user?.id);
      console.log('👤 Module creator:', moduleData.created_by);
      console.log('📋 Module fields check:');
      console.log('  - Title:', moduleData.title);
      console.log('  - Description:', moduleData.description?.substring(0, 100) + '...');
      console.log('  - Learning Objectives:', moduleData.learning_objectives?.length || 0);
      console.log('  - Content Structure sections:', moduleData.content_structure?.sections?.length || 0);
      console.log('  - Assessment Questions:', moduleData.assessment_questions?.length || 0);
      console.log('  - Difficulty Level:', moduleData.difficulty_level);
      console.log('  - Duration:', moduleData.estimated_duration_minutes, 'minutes');
      console.log('  - Has JSON Content URL:', !!moduleData.json_content_url);
      
      // Verify content structure is loaded
      if (moduleData.content_structure?.sections?.length > 0) {
        console.log('✅ Content structure loaded successfully');
        console.log('📄 Section titles:', moduleData.content_structure.sections.map(s => s.title));
      } else {
        console.warn('⚠️ Content structure is empty or not loaded');
        if (moduleData.json_content_url) {
          console.log('🔄 Module has R2 content URL, content should have been fetched');
        } else {
          console.log('📝 Module has no R2 content URL, using database content');
        }
      }
      
      // Stage 5: Finalize (100%)
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoadingProgress(100);
      stages[4].completed = true;
      stages[4].current = false;
      setLoadingStages([...stages]);
      setLoadingStage('Ready!');
      
      setModule(moduleData);
    } catch (error) {
      console.error('❌ Error loading module:', error);
      toast.error('Failed to load module');
      router.push('/teacher/vark-modules');
    } finally {
      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoading(false);
    }
  };

  const handleSave = async (updatedModule: VARKModule) => {
    try {
      setSaving(true);
      setSaveProgress(0);
      
      console.log('💾 Saving module updates...');
      console.log('📤 Sections being saved:', updatedModule.content_structure?.sections?.length || 0);
      console.log('📋 Section titles being saved:', updatedModule.content_structure?.sections?.map(s => s.title) || []);
      
      // Progress: Uploading to storage (50%)
      setSaveProgress(25);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Progress: Updating database (75%)
      setSaveProgress(50);
      await VARKModulesAPI.updateModule(moduleId, updatedModule);
      setSaveProgress(75);
      
      toast.success('Module updated successfully!');
      
      // Small delay to ensure storage is fully updated
      console.log('⏳ Waiting for storage to sync...');
      setSaveProgress(90);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the module state with the saved data instead of reloading
      setSaveProgress(100);
      setModule(updatedModule);
    } catch (error) {
      console.error('❌ Error saving module:', error);
      toast.error('Failed to save module');
      throw error;
    } finally {
      setSaving(false);
      setSaveProgress(0);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
      window.close(); // Close the tab
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="w-[500px] max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Loading Module Editor</h3>
                </div>
                <p className="text-sm text-gray-500">
                  Preparing your module for editing...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{loadingStage}</span>
                  <span className="text-blue-600 font-medium">{loadingProgress}%</span>
                </div>
                <Progress value={loadingProgress} className="h-2" />
              </div>

              {/* Loading Stages */}
              <div className="space-y-3">
                {loadingStages.map((stage, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {stage.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : stage.current ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${
                        stage.completed 
                          ? 'text-green-600 font-medium' 
                          : stage.current 
                            ? 'text-blue-600 font-medium' 
                            : 'text-gray-400'
                      }`}>
                        {stage.name}
                      </p>
                      {stage.duration && (
                        <p className="text-xs text-gray-500">
                          Completed in {stage.duration}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-blue-700">
                  <strong>💡 Tip:</strong> Large modules with rich content may take 5-10 seconds to load completely.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!module) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Module</h1>
                <p className="text-sm text-gray-500 mt-1">{module.title}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Builder */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VARKModuleBuilder
          key={module.updated_at} // Force re-render when module updates
          initialData={module}
          onSave={handleSave}
          onCancel={handleCancel}
          availableModules={availableModules}
        />
      </div>
    </div>
  );
}
