/**
 * Custom CKEditor Upload Adapter for R2 Storage
 * 
 * This adapter replaces the Base64UploadAdapter to upload images to R2 storage
 * instead of embedding them as base64 strings, which improves performance.
 */

import { uploadFileToR2 } from './r2-storage';

export class R2UploadAdapter {
  private loader: any;
  private moduleId?: string;

  constructor(loader: any, moduleId?: string) {
    this.loader = loader;
    this.moduleId = moduleId;
  }

  // Starts the upload process
  upload(): Promise<{ default: string }> {
    return this.loader.file.then((file: File) => this.uploadFile(file));
  }

  // Aborts the upload process
  abort() {
    // Implementation for aborting upload if needed
  }

  private async uploadFile(file: File): Promise<{ default: string }> {
    try {
      console.log('📤 [R2 UPLOAD] Starting image upload to R2:', {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileType: file.type,
        moduleId: this.moduleId
      });

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`);
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 10MB`);
      }

      // Generate a unique filename with module context
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = this.moduleId 
        ? `module-${this.moduleId}-image-${timestamp}-${sanitizedName}`
        : `image-${timestamp}-${sanitizedName}`;

      // Upload to R2 in the 'module-images' folder
      const publicUrl = await uploadFileToR2(
        new File([file], uniqueFileName, { type: file.type }),
        'module-images'
      );

      console.log('✅ [R2 UPLOAD] Image uploaded successfully:', {
        originalName: file.name,
        uniqueName: uniqueFileName,
        publicUrl: publicUrl,
        uploadTime: `${Date.now() - timestamp}ms`
      });

      // Return the URL in the format CKEditor expects
      return {
        default: publicUrl
      };

    } catch (error) {
      console.error('❌ [R2 UPLOAD] Image upload failed:', error);
      
      // Fallback to base64 if R2 upload fails
      console.log('🔄 [R2 UPLOAD] Falling back to base64...');
      return this.fallbackToBase64(file);
    }
  }

  private async fallbackToBase64(file: File): Promise<{ default: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        console.log('⚠️ [R2 UPLOAD] Using base64 fallback for:', file.name);
        resolve({
          default: reader.result as string
        });
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file as base64'));
      };
      
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Plugin function to integrate R2UploadAdapter with CKEditor
 */
export function R2UploadAdapterPlugin(editor: any, moduleId?: string) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    return new R2UploadAdapter(loader, moduleId);
  };
}

/**
 * Enhanced utility function to convert existing base64 images to R2 URLs
 * This can be used to migrate existing content with comprehensive logging and progress tracking
 * 
 * OPTIMIZATION: Skips images that already have R2 URLs to avoid re-uploading
 */
export async function convertBase64ImagesToR2(
  htmlContent: string, 
  moduleId?: string,
  onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
  const startTime = Date.now();
  const base64ImageRegex = /<img[^>]+src="data:image\/([^;]+);base64,([^"]+)"[^>]*>/g;
  
  // Find all base64 images first
  const matches = Array.from(htmlContent.matchAll(base64ImageRegex));
  const totalImages = matches.length;
  
  console.log(`🚀 [BASE64 CONVERSION] Starting conversion for ${totalImages} base64 images in module: ${moduleId || 'unknown'}`);
  
  // Check for existing R2 images (these are already optimized)
  const r2ImageRegex = /<img[^>]+src="https?:\/\/[^"]*r2\.dev[^"]*"[^>]*>/gi;
  const existingR2Images = Array.from(htmlContent.matchAll(r2ImageRegex));
  
  if (existingR2Images.length > 0) {
    console.log(`✅ [BASE64 CONVERSION] Found ${existingR2Images.length} existing R2 images (already optimized, will skip)`);
  }
  
  if (totalImages === 0) {
    console.log('ℹ️ [BASE64 CONVERSION] No base64 images found to convert');
    return {
      success: true,
      convertedContent: htmlContent,
      totalImages: 0,
      successfulConversions: 0,
      failedConversions: 0,
      skippedImages: existingR2Images.length,
      conversions: [],
      skipped: existingR2Images.map((match, index) => ({
        index: index + 1,
        reason: 'Already uploaded to R2',
        imageUrl: match[0].match(/src="([^"]+)"/)?.[1] || 'unknown'
      })),
      errors: [],
      duration: Date.now() - startTime
    };
  }

  let convertedContent = htmlContent;
  const conversions: Array<{ 
    index: number;
    original: string; 
    converted: string; 
    imageType: string;
    originalSize: number;
    newUrl: string;
    uploadTime: number;
  }> = [];
  const skipped: Array<{
    index: number;
    reason: string;
    imageUrl: string;
  }> = [];
  const errors: Array<{ 
    index: number;
    error: string; 
    imageType?: string;
    originalSize?: number;
  }> = [];

  // Process each image with detailed logging
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const [fullMatch, imageType, base64Data] = match;
    const imageIndex = i + 1;
    
    try {
      const imageStartTime = Date.now();
      const originalSize = Math.round((base64Data.length * 3) / 4); // Approximate original file size
      
      console.log(`📤 [BASE64 CONVERSION] Processing image ${imageIndex}/${totalImages}:`, {
        imageType,
        originalSize: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
        base64Length: base64Data.length,
        moduleId
      });

      // Report progress
      onProgress?.({
        currentImage: imageIndex,
        totalImages,
        percentage: Math.round((imageIndex / totalImages) * 100),
        status: 'converting',
        currentImageType: imageType,
        currentImageSize: originalSize
      });

      // Convert base64 to blob with validation
      let binaryString: string;
      try {
        binaryString = atob(base64Data);
      } catch (decodeError) {
        throw new Error(`Invalid base64 data: ${decodeError}`);
      }
      
      const bytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) {
        bytes[j] = binaryString.charCodeAt(j);
      }
      
      const blob = new Blob([bytes], { type: `image/${imageType}` });
      
      // Validate blob size
      if (blob.size === 0) {
        throw new Error('Generated blob is empty');
      }
      
      if (blob.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error(`Image too large: ${(blob.size / 1024 / 1024).toFixed(2)}MB (max 10MB)`);
      }
      
      const timestamp = Date.now();
      const fileName = moduleId 
        ? `module-${moduleId}-converted-${timestamp}-${imageIndex}.${imageType}`
        : `converted-${timestamp}-${imageIndex}.${imageType}`;
      
      const file = new File([blob], fileName, { type: `image/${imageType}` });
      
      console.log(`⬆️ [BASE64 CONVERSION] Uploading image ${imageIndex} to R2:`, {
        fileName,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        mimeType: file.type
      });
      
      // Upload to R2 with retry logic
      let publicUrl: string;
      let uploadAttempts = 0;
      const maxRetries = 3;
      
      while (uploadAttempts < maxRetries) {
        try {
          uploadAttempts++;
          console.log(`🔄 [BASE64 CONVERSION] Upload attempt ${uploadAttempts}/${maxRetries} for image ${imageIndex}`);
          
          publicUrl = await uploadFileToR2(file, 'module-images');
          break; // Success, exit retry loop
          
        } catch (uploadError) {
          console.warn(`⚠️ [BASE64 CONVERSION] Upload attempt ${uploadAttempts} failed for image ${imageIndex}:`, uploadError);
          
          if (uploadAttempts >= maxRetries) {
            throw new Error(`Upload failed after ${maxRetries} attempts: ${uploadError}`);
          }
          
          // Wait before retry (exponential backoff)
          const waitTime = Math.pow(2, uploadAttempts) * 1000; // 2s, 4s, 8s
          console.log(`⏳ [BASE64 CONVERSION] Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      // Replace the base64 src with the R2 URL
      const newImgTag = fullMatch.replace(
        `src="data:image/${imageType};base64,${base64Data}"`,
        `src="${publicUrl!}"`
      );
      
      convertedContent = convertedContent.replace(fullMatch, newImgTag);
      
      const uploadTime = Date.now() - imageStartTime;
      conversions.push({ 
        index: imageIndex,
        original: fullMatch, 
        converted: newImgTag,
        imageType,
        originalSize,
        newUrl: publicUrl!,
        uploadTime
      });
      
      console.log(`✅ [BASE64 CONVERSION] Image ${imageIndex}/${totalImages} converted successfully:`, {
        originalSize: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
        newUrl: publicUrl!,
        uploadTime: `${uploadTime}ms`,
        compressionRatio: `${((fullMatch.length - newImgTag.length) / fullMatch.length * 100).toFixed(1)}%`
      });
      
      // Report progress
      onProgress?.({
        currentImage: imageIndex,
        totalImages,
        percentage: Math.round((imageIndex / totalImages) * 100),
        status: 'completed',
        currentImageType: imageType,
        currentImageSize: originalSize,
        successfulConversions: conversions.length,
        failedConversions: errors.length
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [BASE64 CONVERSION] Failed to convert image ${imageIndex}/${totalImages}:`, {
        error: errorMessage,
        imageType,
        moduleId
      });
      
      errors.push({
        index: imageIndex,
        error: errorMessage,
        imageType,
        originalSize: Math.round((base64Data.length * 3) / 4)
      });
      
      // Report progress
      onProgress?.({
        currentImage: imageIndex,
        totalImages,
        percentage: Math.round((imageIndex / totalImages) * 100),
        status: 'failed',
        currentImageType: imageType,
        successfulConversions: conversions.length,
        failedConversions: errors.length
      });
      
      // Keep the original base64 image if conversion fails
    }
    
    // Small delay between conversions to avoid overwhelming the server
    if (i < matches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const duration = Date.now() - startTime;
  const successfulConversions = conversions.length;
  const failedConversions = errors.length;
  const skippedImages = skipped.length;
  
  console.log(`🎉 [BASE64 CONVERSION] Conversion completed for module ${moduleId}:`, {
    totalImages,
    successfulConversions,
    failedConversions,
    skippedImages,
    successRate: totalImages > 0 ? `${((successfulConversions / totalImages) * 100).toFixed(1)}%` : '0%',
    duration: `${(duration / 1000).toFixed(1)}s`,
    averageTimePerImage: totalImages > 0 ? `${Math.round(duration / totalImages)}ms` : '0ms'
  });

  if (successfulConversions > 0) {
    const totalSizeSaved = conversions.reduce((acc, conv) => 
      acc + (conv.original.length - conv.converted.length), 0
    );
    console.log(`💾 [BASE64 CONVERSION] Content size reduced by ${(totalSizeSaved / 1024 / 1024).toFixed(2)}MB`);
  }

  if (skippedImages > 0) {
    console.log(`⏭️ [BASE64 CONVERSION] ${skippedImages} images skipped (already optimized)`);
  }

  if (failedConversions > 0) {
    console.warn(`⚠️ [BASE64 CONVERSION] ${failedConversions} images failed to convert and remain as base64`);
    errors.forEach(error => {
      console.warn(`   - Image ${error.index}: ${error.error}`);
    });
  }

  return {
    success: failedConversions === 0,
    convertedContent,
    totalImages,
    successfulConversions,
    failedConversions,
    skippedImages,
    conversions,
    skipped,
    errors,
    duration
  };
}

// Types for better type safety
export interface ConversionProgress {
  currentImage: number;
  totalImages: number;
  percentage: number;
  status: 'converting' | 'completed' | 'failed';
  currentImageType?: string;
  currentImageSize?: number;
  successfulConversions?: number;
  failedConversions?: number;
}

export interface ConversionResult {
  success: boolean;
  convertedContent: string;
  totalImages: number;
  successfulConversions: number;
  failedConversions: number;
  skippedImages: number;
  conversions: Array<{
    index: number;
    original: string;
    converted: string;
    imageType: string;
    originalSize: number;
    newUrl: string;
    uploadTime: number;
  }>;
  skipped: Array<{
    index: number;
    reason: string;
    imageUrl: string;
  }>;
  errors: Array<{
    index: number;
    error: string;
    imageType?: string;
    originalSize?: number;
  }>;
  duration: number;
}