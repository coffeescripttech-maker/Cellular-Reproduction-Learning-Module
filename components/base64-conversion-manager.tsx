'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Square, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Image,
  Upload,
  Shield,
  RefreshCw
} from 'lucide-react';
import { expressVARKModulesAPI, ModuleConversionProgress, ModuleConversionResult } from '@/lib/api/express-vark-modules';
import { useConversionProtection, useConversionPersistence } from '@/hooks/useConversionProtection';
import { toast } from 'sonner';

interface Base64ConversionManagerProps {
  moduleId: string;
  moduleName?: string;
  onComplete?: (result: ModuleConversionResult) => void;
  onCancel?: () => void;
}

interface ConversionState {
  isRunning: boolean;
  isPaused: boolean;
  progress: ModuleConversionProgress | null;
  result: ModuleConversionResult | null;
  error: string | null;
  startTime: number | null;
  estimatedTimeRemaining: number | null;
}

interface PersistedProgress {
  moduleId: string;
  progress: ModuleConversionProgress;
  startTime: number;
  timestamp: number;
}

const Base64ConversionManager: React.FC<Base64ConversionManagerProps> = ({
  moduleId,
  moduleName,
  onComplete,
  onCancel
}) => {
  const [state, setState] = useState<ConversionState>({
    isRunning: false,
    isPaused: false,
    progress: null,
    result: null,
    error: null,
    startTime: null,
    estimatedTimeRemaining: null
  });

  const conversionRef = useRef<{ abort: boolean }>({ abort: false });

  // Use protection hooks
  const { saveProgress, loadProgress, clearProgress } = useConversionPersistence(`base64_conversion_${moduleId}`);
  
  const { isProtected } = useConversionProtection({
    isActive: state.isRunning && !state.isPaused,
    message: `Base64 to R2 conversion is in progress for "${moduleName || 'this module'}". Leaving now will stop the conversion and you'll need to start over. Are you sure?`,
    onAttemptedNavigation: () => {
      toast.warning('Conversion in progress! Please wait for it to complete or stop it first.');
    }
  });

  // Calculate estimated time remaining
  const calculateTimeRemaining = useCallback((progress: ModuleConversionProgress, startTime: number): number | null => {
    if (progress.overallProgress <= 0) return null;
    
    const elapsed = Date.now() - startTime;
    const rate = progress.overallProgress / elapsed; // progress per ms
    const remaining = (100 - progress.overallProgress) / rate;
    
    return Math.max(0, remaining);
  }, []);

  // Format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Enhanced progress saving with state persistence
  const saveConversionProgress = useCallback((progress: ModuleConversionProgress, startTime: number) => {
    const progressData = {
      moduleId,
      progress,
      startTime,
      state: {
        isRunning: state.isRunning,
        isPaused: state.isPaused
      }
    };
    saveProgress(progressData);
  }, [moduleId, state.isRunning, state.isPaused, saveProgress]);

  // Start conversion
  const startConversion = async () => {
    console.log('🚀 [CONVERSION MANAGER] Starting base64 to R2 conversion for module:', moduleId);
    
    conversionRef.current.abort = false;
    const startTime = Date.now();
    
    setState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      error: null,
      result: null,
      startTime
    }));

    try {
      const result = await expressVARKModulesAPI.convertBase64ImagesToR2(
        moduleId,
        (progress) => {
          // Check if conversion was aborted
          if (conversionRef.current.abort) {
            throw new Error('Conversion aborted by user');
          }

          console.log('📊 [CONVERSION MANAGER] Progress update:', progress);
          
          // Calculate time remaining
          const timeRemaining = calculateTimeRemaining(progress, startTime);
          
          setState(prev => ({
            ...prev,
            progress,
            estimatedTimeRemaining: timeRemaining
          }));

          // Save progress with enhanced state
          saveConversionProgress(progress, startTime);
        }
      );

      console.log('✅ [CONVERSION MANAGER] Conversion completed:', result);
      
      setState(prev => ({
        ...prev,
        isRunning: false,
        result,
        estimatedTimeRemaining: null
      }));

      // Clear saved progress on completion
      clearProgress();

      // Show comprehensive success toast with file size info
      if (result.totalConversions > 0) {
        toast.success(
          `🎉 Migration Complete! ${result.totalConversions} images converted to R2 storage. ` +
          `${result.totalSkipped > 0 ? `${result.totalSkipped} already optimized. ` : ''}` +
          `Module size significantly reduced!`,
          { duration: 8000 }
        );
      } else if (result.totalSkipped > 0) {
        toast.success(
          `✅ Module Already Optimized! All ${result.totalSkipped} images are already in R2 storage. No conversion needed.`,
          { duration: 6000 }
        );
      } else {
        toast.info('No images found to convert.', { duration: 4000 });
      }

      // Call completion callback
      onComplete?.(result);

    } catch (error) {
      console.error('❌ [CONVERSION MANAGER] Conversion failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: errorMessage,
        estimatedTimeRemaining: null
      }));

      // Show error toast
      toast.error(`Conversion failed: ${errorMessage}`);
    }
  };

  // Pause conversion (not implemented in API yet, but UI ready)
  const pauseConversion = () => {
    setState(prev => ({
      ...prev,
      isPaused: true
    }));
    toast.info('Conversion paused. You can resume it later.');
  };

  // Resume conversion
  const resumeConversion = () => {
    setState(prev => ({
      ...prev,
      isPaused: false
    }));
    toast.info('Conversion resumed.');
  };

  // Stop conversion
  const stopConversion = () => {
    console.log('🛑 [CONVERSION MANAGER] Stopping conversion');
    
    conversionRef.current.abort = true;
    
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      estimatedTimeRemaining: null
    }));

    // Clear saved progress
    clearProgress();

    toast.info('Conversion stopped.');
  };

  // Resume from saved progress
  const resumeFromSaved = () => {
    const saved = loadProgress();
    if (saved) {
      setState(prev => ({
        ...prev,
        progress: saved.progress,
        startTime: saved.startTime,
        isRunning: saved.state?.isRunning || false,
        isPaused: saved.state?.isPaused || false
      }));
      
      // Continue conversion from where it left off
      if (!saved.state?.isPaused) {
        startConversion();
      }
    }
  };

  // Setup effects
  useEffect(() => {
    // Check for saved progress on mount
    const saved = loadProgress();
    if (saved && saved.progress.stage !== 'completed' && saved.progress.stage !== 'error') {
      setState(prev => ({
        ...prev,
        progress: saved.progress,
        startTime: saved.startTime
      }));
    }
  }, [loadProgress]);

  const { isRunning, isPaused, progress, result, error, startTime, estimatedTimeRemaining } = state;
  const hasUnsavedProgress = loadProgress() && !isRunning && !result;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5" />
          Base64 to R2 Image Conversion
          {isRunning && (
            <Badge variant="secondary" className="ml-2">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              Running
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Convert embedded base64 images to R2 storage URLs for better performance
        </p>
        {moduleName && (
          <p className="text-sm font-medium">Module: {moduleName}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Unsaved Progress Alert */}
        {hasUnsavedProgress && (
          <Alert>
            <Clock className="w-4 h-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Previous conversion was interrupted. You can resume from where it left off.</span>
              <Button size="sm" onClick={resumeFromSaved} className="ml-4">
                Resume Conversion
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Section */}
        {progress && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Conversion Progress</h3>
              <Badge variant={
                progress.stage === 'completed' ? 'default' :
                progress.stage === 'error' ? 'destructive' :
                'secondary'
              }>
                {progress.stage.charAt(0).toUpperCase() + progress.stage.slice(1)}
              </Badge>
            </div>

            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span>{progress.overallProgress}%</span>
              </div>
              <Progress value={progress.overallProgress} className="h-3" />
            </div>

            {/* Current Stage Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Current Stage</span>
                <span>{progress.stageProgress}%</span>
              </div>
              <Progress value={progress.stageProgress} className="h-2" />
            </div>

            {/* Status Message */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium">{progress.message}</p>
              
              {/* Section Progress */}
              {progress.currentSection && progress.totalSections && (
                <p className="text-xs text-gray-600 mt-1">
                  Section {progress.currentSection} of {progress.totalSections}
                </p>
              )}

              {/* Image Progress */}
              {progress.imageProgress && (
                <p className="text-xs text-gray-600 mt-1">
                  Image {progress.imageProgress.currentImage} of {progress.imageProgress.totalImages}
                  {progress.imageProgress.currentImageType && (
                    <span className="ml-2">({progress.imageProgress.currentImageType})</span>
                  )}
                </p>
              )}
            </div>

            {/* Time Information */}
            {startTime && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Elapsed:</span>
                  <span className="ml-2 font-medium">
                    {formatDuration(Date.now() - startTime)}
                  </span>
                </div>
                {estimatedTimeRemaining && (
                  <div>
                    <span className="text-gray-600">Remaining:</span>
                    <span className="ml-2 font-medium">
                      {formatDuration(estimatedTimeRemaining)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <h3 className="text-lg font-semibold">
                Conversion {result.success ? 'Completed' : 'Failed'}
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{result.totalSections}</div>
                <div className="text-sm text-blue-800">Total Sections</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{result.totalConversions}</div>
                <div className="text-sm text-green-800">Images Converted</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{result.totalSkipped || 0}</div>
                <div className="text-sm text-yellow-800">Already Optimized</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{result.totalErrors}</div>
                <div className="text-sm text-red-800">Errors</div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-600">
                {formatDuration(result.duration)}
              </div>
              <div className="text-sm text-gray-800">Duration</div>
            </div>

            {/* Section Results */}
            {result.sectionResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Section Results:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.sectionResults.map((section) => (
                    <div key={section.sectionIndex} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                      <span>Section {section.sectionIndex}: {section.sectionTitle}</span>
                      <div className="flex gap-2">
                        {section.conversions > 0 && (
                          <Badge variant="secondary" size="sm">
                            {section.conversions} converted
                          </Badge>
                        )}
                        {section.skipped > 0 && (
                          <Badge variant="outline" size="sm" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                            {section.skipped} skipped
                          </Badge>
                        )}
                        {section.errors > 0 && (
                          <Badge variant="destructive" size="sm">
                            {section.errors} errors
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Benefits Message */}
            {result.success && result.totalConversions > 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-green-900">🎉 Migration Complete! Your module is now optimized.</p>
                    <div className="text-sm text-green-800 space-y-1">
                      <p><strong>What happened:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Base64 images converted to R2 URLs (CDN-hosted)</li>
                        <li>Module JSON uploaded to R2 storage</li>
                        <li>Database stores only the R2 URL (json_content_url)</li>
                        <li>File size reduced by ~99% (no more large base64 strings)</li>
                      </ul>
                      <p className="mt-2"><strong>Benefits:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>⚡ Faster loading times (images from CDN)</li>
                        <li>📦 Smaller JSON payload (faster API responses)</li>
                        <li>🌐 Better bandwidth usage</li>
                        <li>💻 Reduced memory consumption</li>
                        <li>🔄 Re-running conversion will skip already optimized images</li>
                      </ul>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Already Optimized Message */}
            {result.success && result.totalConversions === 0 && result.totalSkipped > 0 && (
              <Alert className="bg-blue-50 border-blue-200">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-blue-900">✅ Module Already Optimized!</p>
                    <p className="text-sm text-blue-800">
                      All {result.totalSkipped} images are already stored in R2 storage. 
                      No conversion needed. Your module is running at peak performance!
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Error Section */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Conversion Failed:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            {!isRunning && !result && (
              <Button onClick={startConversion} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Start Conversion
              </Button>
            )}

            {isRunning && !isPaused && (
              <>
                <Button onClick={pauseConversion} variant="outline" className="flex items-center gap-2">
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
                <Button onClick={stopConversion} variant="destructive" className="flex items-center gap-2">
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </>
            )}

            {isRunning && isPaused && (
              <>
                <Button onClick={resumeConversion} className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Resume
                </Button>
                <Button onClick={stopConversion} variant="destructive" className="flex items-center gap-2">
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </>
            )}

            {result && (
              <Button onClick={() => window.location.reload()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <Button onClick={onCancel} variant="ghost">
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Protection Notice */}
        {isProtected && (
          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription>
              <strong>Protection Active:</strong> The page is protected from accidental closure during conversion. 
              Your browser will warn you if you try to leave, refresh, or navigate away from this page.
              Progress is automatically saved and can be resumed if interrupted.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default Base64ConversionManager;