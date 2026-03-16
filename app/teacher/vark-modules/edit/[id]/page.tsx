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
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditVARKModulePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [module, setModule] = useState<VARKModule | null>(null);
  const [availableModules, setAvailableModules] = useState<VARKModule[]>([]);
  const [loading, setLoading] = useState(true);

  const moduleId = params.id as string;

  useEffect(() => {
    if (moduleId && user) {
      loadModule();
    }
  }, [moduleId, user]);

  const loadModule = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching module for editing:', moduleId);
      
      // Fetch all modules for prerequisite dropdown (fast query)
      const allModules = await VARKModulesAPI.getModules();
      setAvailableModules(allModules);
      console.log('📚 Loaded', allModules.length, 'modules for prerequisite selection');
      
      // Use fast loading for edit page - skip R2 content fetch initially
      // We'll load the full content when the user actually starts editing
      const moduleData = await expressVARKModulesAPI.getModuleById(moduleId, true); // skipContent = true
      
      if (!moduleData) {
        toast.error('Module not found');
        router.push('/teacher/vark-modules');
        return;
      }

      // Allow any teacher to edit any module (collaborative editing)
      console.log('✅ Module loaded for editing (fast mode):', moduleData.title);
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
      
      setModule(moduleData);
    } catch (error) {
      console.error('❌ Error loading module:', error);
      toast.error('Failed to load module');
      router.push('/teacher/vark-modules');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedModule: VARKModule) => {
    try {
      console.log('💾 Saving module updates...');
      console.log('📤 Sections being saved:', updatedModule.content_structure?.sections?.length || 0);
      console.log('📋 Section titles being saved:', updatedModule.content_structure?.sections?.map(s => s.title) || []);
      
      await VARKModulesAPI.updateModule(moduleId, updatedModule);
      toast.success('Module updated successfully!');
      
      // Small delay to ensure storage is fully updated
      console.log('⏳ Waiting for storage to sync...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload the module to get fresh data
      await loadModule();
    } catch (error) {
      console.error('❌ Error saving module:', error);
      toast.error('Failed to save module');
      throw error;
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
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading module...</p>
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
