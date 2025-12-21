import { 
  BlobServiceClient, 
  ContainerClient, 
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
  SASProtocol
} from '@azure/storage-blob'

let containerClient: ContainerClient | null = null
let sharedKeyCredential: StorageSharedKeyCredential | null = null

const CONTAINER_NAME = 'photos'

/**
 * Get the blob container client for photo storage
 */
export function getBlobContainerClient(): ContainerClient {
  if (containerClient) return containerClient

  const connectionString = process.env.BLOB_CONNECTION_STRING
  const accountName = process.env.BLOB_ACCOUNT_NAME
  const accountKey = process.env.BLOB_ACCOUNT_KEY

  if (!connectionString && (!accountName || !accountKey)) {
    throw new Error('BLOB_CONNECTION_STRING or (BLOB_ACCOUNT_NAME and BLOB_ACCOUNT_KEY) are required')
  }

  if (connectionString) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME)
  } else {
    sharedKeyCredential = new StorageSharedKeyCredential(accountName!, accountKey!)
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential
    )
    containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME)
  }

  return containerClient
}

/**
 * Generate a SAS URL for uploading a blob (write-only, short-lived)
 * This allows the frontend to upload directly to blob storage
 */
export function generateUploadSasUrl(blobName: string, expiryMinutes: number = 15): string {
  const accountName = process.env.BLOB_ACCOUNT_NAME
  const accountKey = process.env.BLOB_ACCOUNT_KEY

  if (!accountName || !accountKey) {
    throw new Error('BLOB_ACCOUNT_NAME and BLOB_ACCOUNT_KEY are required for SAS generation')
  }

  if (!sharedKeyCredential) {
    sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
  }

  const startsOn = new Date()
  startsOn.setMinutes(startsOn.getMinutes() - 5) // Start 5 mins ago to handle clock skew
  
  const expiresOn = new Date()
  expiresOn.setMinutes(expiresOn.getMinutes() + expiryMinutes)

  const sasToken = generateBlobSASQueryParameters({
    containerName: CONTAINER_NAME,
    blobName,
    permissions: BlobSASPermissions.parse('cw'), // Create and Write only
    startsOn,
    expiresOn,
    protocol: SASProtocol.HttpsAndHttp // Allow both for localhost dev
  }, sharedKeyCredential).toString()

  return `https://${accountName}.blob.core.windows.net/${CONTAINER_NAME}/${blobName}?${sasToken}`
}

/**
 * Generate a SAS URL for reading a blob (read-only, longer-lived for CDN caching)
 */
export function generateReadSasUrl(blobName: string, expiryHours: number = 24): string {
  const accountName = process.env.BLOB_ACCOUNT_NAME
  const accountKey = process.env.BLOB_ACCOUNT_KEY

  if (!accountName || !accountKey) {
    throw new Error('BLOB_ACCOUNT_NAME and BLOB_ACCOUNT_KEY are required for SAS generation')
  }

  if (!sharedKeyCredential) {
    sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
  }

  const expiresOn = new Date()
  expiresOn.setHours(expiresOn.getHours() + expiryHours)

  const sasToken = generateBlobSASQueryParameters({
    containerName: CONTAINER_NAME,
    blobName,
    permissions: BlobSASPermissions.parse('r'), // Read only
    expiresOn,
    protocol: SASProtocol.HttpsAndHttp
  }, sharedKeyCredential).toString()

  return `https://${accountName}.blob.core.windows.net/${CONTAINER_NAME}/${blobName}?${sasToken}`
}

/**
 * Generate the public CDN URL for a blob (if CDN is configured)
 */
export function getCdnUrl(blobName: string): string {
  const cdnEndpoint = process.env.CDN_ENDPOINT
  const accountName = process.env.BLOB_ACCOUNT_NAME

  if (cdnEndpoint) {
    // CDN URL format: https://your-cdn.azureedge.net/photos/blob-name
    return `https://${cdnEndpoint}/${CONTAINER_NAME}/${blobName}`
  }

  // Fallback to direct blob URL (requires public access or SAS)
  return `https://${accountName}.blob.core.windows.net/${CONTAINER_NAME}/${blobName}`
}

/**
 * Delete a blob from storage
 */
export async function deleteBlob(blobName: string): Promise<boolean> {
  try {
    const container = getBlobContainerClient()
    const blobClient = container.getBlobClient(blobName)
    await blobClient.deleteIfExists()
    return true
  } catch (error) {
    console.error('Error deleting blob:', error)
    return false
  }
}

/**
 * Check if a blob exists
 */
export async function blobExists(blobName: string): Promise<boolean> {
  try {
    const container = getBlobContainerClient()
    const blobClient = container.getBlobClient(blobName)
    return await blobClient.exists()
  } catch (error) {
    console.error('Error checking blob existence:', error)
    return false
  }
}

/**
 * List all blobs for a profile (by prefix)
 */
export async function listProfileBlobs(profileId: string): Promise<string[]> {
  try {
    const container = getBlobContainerClient()
    const blobs: string[] = []
    
    for await (const blob of container.listBlobsFlat({ prefix: `${profileId}/` })) {
      blobs.push(blob.name)
    }
    
    return blobs
  } catch (error) {
    console.error('Error listing blobs:', error)
    return []
  }
}
