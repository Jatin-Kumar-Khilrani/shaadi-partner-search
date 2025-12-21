/**
 * Blob Storage Service
 * Handles photo uploads to Azure Blob Storage via the API backend
 * 
 * Architecture:
 * 1. Frontend requests a SAS URL from the API
 * 2. Frontend uploads directly to Blob Storage using the SAS URL
 * 3. CDN URL is returned for fast image delivery
 * 
 * This approach:
 * - Offloads bandwidth from the API to Blob Storage
 * - Enables CDN caching for fast global image delivery
 * - Reduces costs (no base64 storage in Cosmos DB)
 * - Supports images up to 10MB (configurable)
 */

import { fetchRuntimeConfig, getRuntimeConfig } from './azureConfig'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface UploadUrlResponse {
  uploadUrl: string
  blobName: string
  cdnUrl: string
  expiresIn: string
}

interface PhotoInfo {
  blobName: string
  cdnUrl: string
  uploadedAt: string
  size: number
}

/**
 * Get the API base URL from runtime config
 */
async function getApiBaseUrl(): Promise<string> {
  let config = getRuntimeConfig()
  if (!config) {
    config = await fetchRuntimeConfig()
  }
  
  const baseUrl = config?.api?.baseUrl
  if (!baseUrl) {
    throw new Error('API base URL not configured. Cannot upload photos.')
  }
  
  return baseUrl
}

/**
 * Request a SAS URL for uploading a photo
 */
async function getUploadUrl(profileId: string, fileName: string, contentType: string): Promise<UploadUrlResponse> {
  const baseUrl = await getApiBaseUrl()
  
  const response = await fetch(`${baseUrl}/api/blob/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profileId,
      fileName,
      contentType,
    }),
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || 'Failed to get upload URL')
  }
  
  return response.json()
}

/**
 * Upload a file directly to Blob Storage using SAS URL
 */
async function uploadToBlob(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': file.type,
    },
    body: file,
  })
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
  }
}

/**
 * Upload a photo for a profile
 * Returns the CDN URL for the uploaded photo
 */
export async function uploadPhoto(profileId: string, file: File): Promise<{ cdnUrl: string; blobName: string }> {
  // Validate file
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(', ')}`)
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }
  
  // Get SAS URL from API
  const { uploadUrl, cdnUrl, blobName } = await getUploadUrl(profileId, file.name, file.type)
  
  // Upload directly to Blob Storage
  await uploadToBlob(uploadUrl, file)
  
  return { cdnUrl, blobName }
}

/**
 * Upload multiple photos for a profile
 */
export async function uploadPhotos(profileId: string, files: File[]): Promise<Array<{ cdnUrl: string; blobName: string }>> {
  const results: Array<{ cdnUrl: string; blobName: string }> = []
  
  for (const file of files) {
    const result = await uploadPhoto(profileId, file)
    results.push(result)
  }
  
  return results
}

/**
 * Convert a base64 data URL to a File object
 */
export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], fileName, { type: mime })
}

/**
 * Upload a base64 image (for compatibility with existing code)
 */
export async function uploadBase64Photo(profileId: string, base64Data: string, fileName: string = 'photo.jpg'): Promise<{ cdnUrl: string; blobName: string }> {
  const file = dataUrlToFile(base64Data, fileName)
  return uploadPhoto(profileId, file)
}

/**
 * List all photos for a profile
 */
export async function listPhotos(profileId: string): Promise<PhotoInfo[]> {
  const baseUrl = await getApiBaseUrl()
  
  const response = await fetch(`${baseUrl}/api/blob/photos/${profileId}`, {
    method: 'GET',
  })
  
  if (!response.ok) {
    if (response.status === 404) {
      return [] // No photos yet
    }
    throw new Error('Failed to list photos')
  }
  
  const data = await response.json()
  return data.photos || []
}

/**
 * Delete a photo
 */
export async function deletePhoto(blobName: string): Promise<void> {
  const baseUrl = await getApiBaseUrl()
  
  const response = await fetch(`${baseUrl}/api/blob/${encodeURIComponent(blobName)}`, {
    method: 'DELETE',
  })
  
  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to delete photo')
  }
}

/**
 * Check if blob storage is available (API is configured)
 */
export async function isBlobStorageAvailable(): Promise<boolean> {
  try {
    const baseUrl = await getApiBaseUrl()
    const response = await fetch(`${baseUrl}/api/health`)
    return response.ok
  } catch {
    return false
  }
}
