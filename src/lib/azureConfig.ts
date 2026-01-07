/**
 * Azure Services Configuration
 * 
 * This module provides configuration and clients for Azure services.
 * 
 * Architecture:
 * - Browser: Calls Azure Function API backend (secure, recommended)
 * - The API backend holds the Cosmos DB key securely
 * - Fallback: localStorage for offline/demo mode
 * 
 * Services:
 * - Azure Function API: Secure backend for Cosmos DB operations
 * - Azure Blob Storage: File/image storage (via SAS tokens from API)
 */

import { logger } from './logger'

// Runtime config cache
let runtimeConfig: { 
  api?: { 
    baseUrl?: string
  }
  azure?: { 
    cosmosDb?: { key?: string }
  }
} | null = null

// API and connection state
let apiBaseUrl: string | null = null
let isInitialized = false
let useApiMode = false

/**
 * Fetch runtime configuration from public/runtime.config.json
 */
export async function fetchRuntimeConfig(): Promise<typeof runtimeConfig> {
  if (runtimeConfig !== null) return runtimeConfig
  
  try {
    // Try different paths for GitHub Pages vs local dev
    const paths = [
      './runtime.config.json',
      '/runtime.config.json',
      '/shaadi-partner-search/runtime.config.json'
    ]
    
    for (const path of paths) {
      try {
        const response = await fetch(path)
        if (response.ok) {
          runtimeConfig = await response.json()
          logger.info('Runtime config loaded from:', path)
          return runtimeConfig
        }
      } catch {
        // Try next path
      }
    }
    
    runtimeConfig = {}
    return runtimeConfig
  } catch (error) {
    logger.warn('Could not load runtime.config.json:', error)
    runtimeConfig = {}
    return runtimeConfig
  }
}

/**
 * Get cached runtime config (synchronous, may return null if not yet fetched)
 */
export function getRuntimeConfig(): typeof runtimeConfig {
  return runtimeConfig
}

/**
 * Initialize Azure services
 * 
 * Tries in order:
 * 1. API mode: Use Azure Function backend (if configured in runtime.config.json)
 * 2. Direct mode: Use Cosmos DB key directly (if configured)
 * 3. Fallback: localStorage only (offline/demo mode)
 */
export async function initializeAzureServices(): Promise<boolean> {
  if (isInitialized) return true

  try {
    const config = await fetchRuntimeConfig()
    
    // Check for API backend URL
    if (config?.api?.baseUrl) {
      apiBaseUrl = config.api.baseUrl
      
      // Test API connectivity
      try {
        const healthResponse = await fetch(`${apiBaseUrl}/api/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })
        
        if (healthResponse.ok) {
          useApiMode = true
          isInitialized = true
          logger.info('Azure API backend connected:', apiBaseUrl)
          return true
        }
      } catch (error) {
        logger.warn('API backend not reachable, falling back to localStorage:', error)
      }
    }
    
    // Check for direct Cosmos DB key (not recommended for production)
    if (config?.azure?.cosmosDb?.key && config.azure.cosmosDb.key.trim() !== '') {
      logger.info('Direct Cosmos DB key found - attempting connection...')
      
      try {
        const { CosmosClient } = await import('@azure/cosmos')
        
        const endpoint = 'https://shaadipartnerdb.documents.azure.com:443/'
        const databaseId = 'shaadi-partner-db'
        const containerId = 'profiles'
        
        const client = new CosmosClient({
          endpoint,
          key: config.azure.cosmosDb.key,
        })
        
        const database = client.database(databaseId)
        const container = database.container(containerId)
        
        // Store container reference for direct mode
        ;(globalThis as unknown as { _cosmosContainer: typeof container })._cosmosContainer = container
        
        isInitialized = true
        logger.info('Azure Cosmos DB connected (direct mode)')
        return true
      } catch (error) {
        logger.warn('Direct Cosmos DB connection failed:', error)
      }
    }
    
    // Fallback to localStorage
    logger.info('Running in localStorage mode (offline/demo)')
    isInitialized = true
    return false
    
  } catch (error) {
    logger.warn('Azure initialization failed:', error)
    isInitialized = true // Mark as initialized to prevent retry loops
    return false
  }
}

/**
 * Check if Azure services are available
 */
export function isAzureAvailable(): boolean {
  return isInitialized && (useApiMode || (globalThis as unknown as { _cosmosContainer?: unknown })._cosmosContainer !== undefined)
}

/**
 * Retry configuration for Azure operations
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Execute an operation with exponential backoff retry
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  shouldRetry: (error: unknown) => boolean = () => true
): Promise<T> {
  let lastError: unknown
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry if it's a client error (4xx) or if shouldRetry returns false
      if (!shouldRetry(error)) {
        throw error
      }
      
      if (attempt < RETRY_CONFIG.maxRetries) {
        // Calculate exponential backoff with jitter
        const delay = Math.min(
          RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt) + Math.random() * 100,
          RETRY_CONFIG.maxDelayMs
        )
        logger.warn(`${operationName} failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}), retrying in ${Math.round(delay)}ms...`, error)
        await sleep(delay)
      }
    }
  }
  
  // All retries exhausted
  throw lastError
}

/**
 * Check if an error is retryable (server errors, network errors, timeouts)
 */
function isRetryableError(error: unknown): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  
  // HTTP errors - only retry server errors (5xx)
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return true
    }
    if (message.includes('timeout') || message.includes('network') || message.includes('econnreset')) {
      return true
    }
    // Don't retry client errors (4xx)
    if (message.includes('400') || message.includes('401') || message.includes('403')) {
      return false
    }
  }
  
  return true // Default to retrying unknown errors
}

/**
 * Storage operations using API backend or direct Cosmos DB
 */
export const azureStorage = {
  async get<T>(key: string): Promise<T | null> {
    if (!isInitialized) await initializeAzureServices()
    
    // API mode with retry
    if (useApiMode && apiBaseUrl) {
      try {
        return await withRetry(
          async () => {
            const response = await fetch(`${apiBaseUrl}/api/kv/${encodeURIComponent(key)}`, {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            })
            
            if (response.status === 404) return null
            if (!response.ok) throw new Error(`API error: ${response.status}`)
            
            const data = await response.json()
            return data as T
          },
          `KV get "${key}"`,
          isRetryableError
        )
      } catch (error) {
        logger.error(`API get error for key "${key}" after retries:`, error)
        return null
      }
    }
    
    // Direct Cosmos DB mode with retry
    const container = (globalThis as unknown as { _cosmosContainer?: import('@azure/cosmos').Container })._cosmosContainer
    if (container) {
      try {
        return await withRetry(
          async () => {
            const { resource } = await container.item(key, key).read<T & { id: string }>()
            return resource ? (resource as T) : null
          },
          `Cosmos get "${key}"`,
          (error) => {
            // Don't retry 404s
            if ((error as { code?: number }).code === 404) return false
            return isRetryableError(error)
          }
        )
      } catch (error: unknown) {
        if ((error as { code?: number }).code === 404) return null
        logger.error(`Cosmos get error for key "${key}" after retries:`, error)
        return null
      }
    }
    
    return null
  },

  async set<T>(key: string, value: T): Promise<boolean> {
    if (!isInitialized) await initializeAzureServices()
    
    // API mode with retry
    if (useApiMode && apiBaseUrl) {
      try {
        return await withRetry(
          async () => {
            const response = await fetch(`${apiBaseUrl}/api/kv/${encodeURIComponent(key)}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(value)
            })
            
            if (!response.ok) throw new Error(`API error: ${response.status}`)
            return true
          },
          `KV set "${key}"`,
          isRetryableError
        )
      } catch (error) {
        logger.error(`API set error for key "${key}" after retries:`, error)
        return false
      }
    }
    
    // Direct Cosmos DB mode with retry
    const container = (globalThis as unknown as { _cosmosContainer?: import('@azure/cosmos').Container })._cosmosContainer
    if (container) {
      try {
        return await withRetry(
          async () => {
            await container.items.upsert({ id: key, key: key, ...value as object })
            return true
          },
          `Cosmos set "${key}"`,
          isRetryableError
        )
      } catch (error) {
        logger.error(`Cosmos set error for key "${key}" after retries:`, error)
        return false
      }
    }
    
    return false
  },

  async delete(key: string): Promise<boolean> {
    if (!isInitialized) await initializeAzureServices()
    
    // API mode with retry
    if (useApiMode && apiBaseUrl) {
      try {
        return await withRetry(
          async () => {
            const response = await fetch(`${apiBaseUrl}/api/kv/${encodeURIComponent(key)}`, {
              method: 'DELETE',
              headers: { 'Accept': 'application/json' }
            })
            
            if (response.status === 404) return true // Already deleted
            if (!response.ok) throw new Error(`API error: ${response.status}`)
            return true
          },
          `KV delete "${key}"`,
          isRetryableError
        )
      } catch (error) {
        logger.error(`API delete error for key "${key}" after retries:`, error)
        return false
      }
    }
    
    // Direct Cosmos DB mode with retry
    const container = (globalThis as unknown as { _cosmosContainer?: import('@azure/cosmos').Container })._cosmosContainer
    if (container) {
      try {
        return await withRetry(
          async () => {
            await container.item(key, key).delete()
            return true
          },
          `Cosmos delete "${key}"`,
          (error) => {
            // Don't retry 404s (item already deleted)
            if ((error as { code?: number }).code === 404) return false
            return isRetryableError(error)
          }
        )
      } catch (error: unknown) {
        if ((error as { code?: number }).code === 404) return true
        logger.error(`Cosmos delete error for key "${key}" after retries:`, error)
        return false
      }
    }
    
    return false
  },
}

/**
 * Blob storage operations for images
 * Note: For production, implement SAS token generation via API
 */
export const azureBlobStorage = {
  async uploadImage(_fileName: string, _data: Blob): Promise<string | null> {
    // TODO: Implement via API with SAS tokens
    logger.warn('Blob upload not implemented in API mode')
    return null
  },

  async deleteImage(_fileName: string): Promise<boolean> {
    // TODO: Implement via API with SAS tokens
    logger.warn('Blob delete not implemented in API mode')
    return false
  },

  getImageUrl(fileName: string): string {
    return `https://shaadipartnerstorage.blob.core.windows.net/profile-images/${fileName}`
  },
}

// Legacy exports for compatibility
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

export function getCosmosContainer(): import('@azure/cosmos').Container | null {
  return (globalThis as unknown as { _cosmosContainer?: import('@azure/cosmos').Container })._cosmosContainer || null
}

export function getBlobContainerClient(): import('@azure/storage-blob').ContainerClient | null {
  return null // Blob operations should go through API
}

export default AZURE_CONFIG
