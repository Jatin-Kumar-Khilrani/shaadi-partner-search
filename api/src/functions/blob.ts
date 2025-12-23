import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { getCorsHeaders } from '../lib/cosmos.js'
import { 
  generateUploadSasUrl, 
  generateReadSasUrl, 
  deleteBlob, 
  listProfileBlobs,
  getCdnUrl
} from '../lib/blob.js'

/**
 * Blob API - Upload SAS token generation and blob management
 * 
 * Endpoints:
 * - POST /api/blob/upload-url - Get a SAS URL for uploading a photo
 * - GET /api/blob/photos/{profileId} - List all photos for a profile
 * - DELETE /api/blob/{blobName} - Delete a blob
 */

/**
 * POST /api/blob/upload-url
 * Generate a SAS URL for uploading a photo
 * 
 * Request body:
 * {
 *   "profileId": "SP001",
 *   "fileName": "photo1.jpg",
 *   "contentType": "image/jpeg"
 * }
 * 
 * Response:
 * {
 *   "uploadUrl": "https://...blob.core.windows.net/photos/SP001/photo1.jpg?sv=...",
 *   "blobName": "SP001/photo1.jpg",
 *   "cdnUrl": "https://cdn.../photos/SP001/photo1.jpg"
 * }
 */
app.http('blobUploadUrl', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'blob/upload-url',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const origin = request.headers.get('origin') || undefined
    const corsHeaders = getCorsHeaders(origin)
    
    if (request.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders }
    }

    try {
      const body = await request.json() as { profileId: string; fileName: string; contentType?: string }
      
      if (!body.profileId || !body.fileName) {
        return {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'profileId and fileName are required' })
        }
      }

      // Sanitize inputs
      const profileId = body.profileId.replace(/[^a-zA-Z0-9-_]/g, '')
      const sanitizedFileName = body.fileName.replace(/[^a-zA-Z0-9-_.]/g, '')
      
      // Generate unique blob name: profileId/timestamp_filename
      const timestamp = Date.now()
      const blobName = `${profileId}/${timestamp}_${sanitizedFileName}`
      
      // Generate upload SAS URL (15 min expiry)
      const uploadUrl = await generateUploadSasUrl(blobName, 15)
      
      // Generate CDN URL for later access
      const cdnUrl = getCdnUrl(blobName)
      
      context.log(`Generated upload URL for: ${blobName}`)
      
      return {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadUrl,
          blobName,
          cdnUrl,
          expiresIn: '15 minutes'
        })
      }
    } catch (error) {
      context.error('Error generating upload URL:', error)
      return {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to generate upload URL' })
      }
    }
  }
})

/**
 * GET /api/blob/photos/{profileId}
 * List all photos for a profile with CDN URLs
 */
app.http('blobListPhotos', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'blob/photos/{profileId}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const origin = request.headers.get('origin') || undefined
    const corsHeaders = getCorsHeaders(origin)
    
    if (request.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders }
    }

    try {
      const profileId = request.params.profileId
      
      if (!profileId) {
        return {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'profileId is required' })
        }
      }

      const blobs = await listProfileBlobs(profileId)
      const photos = blobs.map(blobName => ({
        blobName,
        cdnUrl: getCdnUrl(blobName),
        // Generate read SAS URL for private blobs (24 hour expiry)
        sasUrl: generateReadSasUrl(blobName, 24)
      }))
      
      context.log(`Listed ${photos.length} photos for profile: ${profileId}`)
      
      return {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, photos })
      }
    } catch (error) {
      context.error('Error listing photos:', error)
      return {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to list photos' })
      }
    }
  }
})

/**
 * DELETE /api/blob/{*blobName}
 * Delete a blob by name
 */
app.http('blobDelete', {
  methods: ['DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'blob/{*blobName}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const origin = request.headers.get('origin') || undefined
    const corsHeaders = getCorsHeaders(origin)
    
    if (request.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders }
    }

    try {
      const blobName = request.params.blobName
      
      if (!blobName) {
        return {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'blobName is required' })
        }
      }

      const deleted = await deleteBlob(blobName)
      
      if (deleted) {
        context.log(`Deleted blob: ${blobName}`)
        return {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, blobName })
        }
      } else {
        return {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Blob not found or could not be deleted' })
        }
      }
    } catch (error) {
      context.error('Error deleting blob:', error)
      return {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to delete blob' })
      }
    }
  }
})
