/**
 * Cloudflare R2 Storage Utility
 * 
 * Handles file uploads to Cloudflare R2 using presigned URLs
 */

export interface R2UploadOptions {
  fileName: string;
  fileType: string;
  folder?: string;
}

export interface R2UploadResult {
  presignedUrl: string;
  key: string;
  publicUrl: string;
}

/**
 * Get a presigned URL for uploading to R2
 */
export async function getR2PresignedUrl(
  options: R2UploadOptions
): Promise<R2UploadResult> {
  const response = await fetch('/api/r2/presigned-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get presigned URL');
  }

  return response.json();
}

/**
 * Upload a file to R2 using a presigned URL
 */
export async function uploadToR2(
  file: Blob,
  presignedUrl: string,
  contentType: string
): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
}

/**
 * Upload a JSON object to R2
 */
export async function uploadJSONToR2(
  data: any,
  fileName: string,
  folder?: string
): Promise<string> {
  // Get presigned URL
  const { presignedUrl, publicUrl } = await getR2PresignedUrl({
    fileName,
    fileType: 'application/json',
    folder,
  });

  // Create JSON blob
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });

  // Upload to R2
  await uploadToR2(blob, presignedUrl, 'application/json');

  return publicUrl;
}

/**
 * Upload a file to R2 (generic)
 */
export async function uploadFileToR2(
  file: File,
  folder?: string
): Promise<string> {
  // Get presigned URL
  const { presignedUrl, publicUrl } = await getR2PresignedUrl({
    fileName: file.name,
    fileType: file.type,
    folder,
  });

  // Upload to R2
  await uploadToR2(file, presignedUrl, file.type);

  return publicUrl;
}

/**
 * Fetch JSON content from R2
 */
export async function fetchJSONFromR2<T = any>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch JSON: ${response.statusText}`);
  }

  return response.json();
}
