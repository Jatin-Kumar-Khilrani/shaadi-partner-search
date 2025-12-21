/**
 * Azure Services Configuration
 * 
 * This module provides configuration and clients for Azure services.
 * All secrets are fetched from Azure Key Vault - no local env files needed.
 * 
 * Services:
 * - Azure Cosmos DB: Document database for profile and user data
 * - Azure Key Vault: Secure secrets management
 * - Azure Blob Storage: File/image storage
 */

// Azure service endpoints - these are public URLs, not secrets
export const AZURE_CONFIG = {
  cosmosDb: {
    endpoint: 'https://shaadipartnerdb.documents.azure.com:443/',
    databaseId: 'shaadi-partner-db',
    containerId: 'profiles',
  },
  keyVault: {
    vaultUrl: 'https://shaadipartnerkv.vault.azure.net/',
  },
  blobStorage: {
    accountUrl: 'https://shaadipartnerstorage.blob.core.windows.net/',
    containerName: 'profile-images',
  },
} as const

// Cache for Azure clients and secrets
let cosmosClient: import('@azure/cosmos').CosmosClient | null = null
let cosmosContainer: import('@azure/cosmos').Container | null = null
let blobContainerClient: import('@azure/storage-blob').ContainerClient | null = null
let isInitialized = false
let initializationError: Error | null = null

/**
 * Initialize Azure services with DefaultAzureCredential
 * Uses Azure CLI credentials locally, Managed Identity in production
 */
export async function initializeAzureServices(): Promise<boolean> {
  if (isInitialized) return true
  if (initializationError) throw initializationError

  try {
    // Dynamic imports to avoid bundling issues in browser
    const { DefaultAzureCredential } = await import('@azure/identity')
    const { CosmosClient } = await import('@azure/cosmos')
    const { BlobServiceClient } = await import('@azure/storage-blob')
    const { SecretClient } = await import('@azure/keyvault-secrets')

    const credential = new DefaultAzureCredential()

    // Get Cosmos DB key from Key Vault
    const secretClient = new SecretClient(AZURE_CONFIG.keyVault.vaultUrl, credential)
    const cosmosKeySecret = await secretClient.getSecret('cosmos-db-key')
    const cosmosKey = cosmosKeySecret.value

    if (!cosmosKey) {
      throw new Error('Failed to retrieve Cosmos DB key from Key Vault')
    }

    // Initialize Cosmos DB client
    cosmosClient = new CosmosClient({
      endpoint: AZURE_CONFIG.cosmosDb.endpoint,
      key: cosmosKey,
    })

    const database = cosmosClient.database(AZURE_CONFIG.cosmosDb.databaseId)
    cosmosContainer = database.container(AZURE_CONFIG.cosmosDb.containerId)

    // Initialize Blob Storage client
    const blobServiceClient = new BlobServiceClient(
      AZURE_CONFIG.blobStorage.accountUrl,
      credential
    )
    blobContainerClient = blobServiceClient.getContainerClient(
      AZURE_CONFIG.blobStorage.containerName
    )

    isInitialized = true
    console.log('✅ Azure services initialized successfully')
    return true
  } catch (error) {
    initializationError = error as Error
    // This is expected in browser environments - DefaultAzureCredential is for server-side
    // The app works fine with localStorage fallback for demo/development
    if (import.meta.env.DEV) {
      console.info('ℹ️ Running in browser mode with localStorage (Azure SDK requires server-side for full functionality)')
    }
    return false
  }
}

/**
 * Get the Cosmos DB container for data operations
 */
export function getCosmosContainer(): import('@azure/cosmos').Container | null {
  return cosmosContainer
}

/**
 * Get the Blob container client for file operations
 */
export function getBlobContainerClient(): import('@azure/storage-blob').ContainerClient | null {
  return blobContainerClient
}

/**
 * Check if Azure services are available
 */
export function isAzureAvailable(): boolean {
  return isInitialized && cosmosContainer !== null
}

/**
 * Storage operations using Cosmos DB
 */
export const azureStorage = {
  async get<T>(key: string): Promise<T | null> {
    if (!cosmosContainer) return null
    try {
      const { resource } = await cosmosContainer.item(key, key).read<T & { id: string }>()
      return resource ? (resource as T) : null
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 404) return null
      console.error(`Azure get error for key "${key}":`, error)
      return null
    }
  },

  async set<T>(key: string, value: T): Promise<boolean> {
    if (!cosmosContainer) return false
    try {
      await cosmosContainer.items.upsert({ id: key, ...value, _key: key })
      return true
    } catch (error) {
      console.error(`Azure set error for key "${key}":`, error)
      return false
    }
  },

  async delete(key: string): Promise<boolean> {
    if (!cosmosContainer) return false
    try {
      await cosmosContainer.item(key, key).delete()
      return true
    } catch (error) {
      console.error(`Azure delete error for key "${key}":`, error)
      return false
    }
  },
}

/**
 * Blob storage operations for images
 */
export const azureBlobStorage = {
  async uploadImage(fileName: string, data: Blob): Promise<string | null> {
    if (!blobContainerClient) return null
    try {
      const blockBlobClient = blobContainerClient.getBlockBlobClient(fileName)
      const arrayBuffer = await data.arrayBuffer()
      await blockBlobClient.uploadData(arrayBuffer, {
        blobHTTPHeaders: { blobContentType: data.type },
      })
      return blockBlobClient.url
    } catch (error) {
      console.error(`Azure blob upload error:`, error)
      return null
    }
  },

  async deleteImage(fileName: string): Promise<boolean> {
    if (!blobContainerClient) return false
    try {
      const blockBlobClient = blobContainerClient.getBlockBlobClient(fileName)
      await blockBlobClient.delete()
      return true
    } catch (error) {
      console.error(`Azure blob delete error:`, error)
      return false
    }
  },

  getImageUrl(fileName: string): string {
    return `${AZURE_CONFIG.blobStorage.accountUrl}${AZURE_CONFIG.blobStorage.containerName}/${fileName}`
  },
}

export default AZURE_CONFIG
