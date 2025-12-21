import { useState, useEffect, useCallback, useRef } from 'react'
import { initializeAzureServices, isAzureAvailable, azureStorage } from '@/lib/azureConfig'

/**
 * Custom useKV hook for persistent key-value storage
 * Uses Azure Cosmos DB when available, localStorage as fallback
 * Both local and production point to the same Azure account
 */

const STORAGE_PREFIX = 'shaadi_partner_'
const CACHE_TTL_MS = 30000 // 30 seconds cache TTL - refresh from Azure if older

// Event emitter for cross-component state sync
const kvEventEmitter = new EventTarget()

// Track last Azure fetch time per key
const lastAzureFetchTime: Record<string, number> = {}

function emitKVChange(key: string) {
  kvEventEmitter.dispatchEvent(new CustomEvent('kv-change', { detail: { key } }))
}

// Force refresh event emitter
function emitForceRefresh(key: string) {
  kvEventEmitter.dispatchEvent(new CustomEvent('kv-force-refresh', { detail: { key } }))
}

// Export function to force refresh a key from Azure
export function forceRefreshFromAzure(key: string) {
  lastAzureFetchTime[key] = 0 // Reset cache time
  emitForceRefresh(key)
}

// Initialize Azure on module load
let azureInitPromise: Promise<boolean> | null = null

function ensureAzureInitialized(): Promise<boolean> {
  if (!azureInitPromise) {
    azureInitPromise = initializeAzureServices()
  }
  return azureInitPromise
}

// Start initialization early
ensureAzureInitialized()

export function useKV<T>(key: string, defaultValue: T): [T | undefined, (newValue: T | ((oldValue?: T) => T)) => void, () => Promise<void>] {
  const storageKey = `${STORAGE_PREFIX}${key}`
  const isLoadingFromAzure = useRef(false)
  
  // Initialize state from localStorage (immediate) or Azure (async)
  const [value, setValue] = useState<T | undefined>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        return JSON.parse(stored) as T
      }
      return defaultValue
    } catch (error) {
      console.warn(`Failed to parse stored value for key "${key}":`, error)
      return defaultValue
    }
  })

  // Function to load from Azure
  const loadFromAzure = useCallback(async (force: boolean = false) => {
    if (isLoadingFromAzure.current && !force) return
    
    // Check cache TTL - skip if recently fetched (unless forced)
    const now = Date.now()
    const lastFetch = lastAzureFetchTime[key] || 0
    if (!force && now - lastFetch < CACHE_TTL_MS) {
      return
    }
    
    isLoadingFromAzure.current = true

    try {
      await ensureAzureInitialized()
      
      if (isAzureAvailable()) {
        const azureValue = await azureStorage.get<{ data: T, updatedAt?: string }>(key)
        if (azureValue && azureValue.data !== undefined) {
          setValue(azureValue.data)
          // Sync to localStorage for faster subsequent loads
          localStorage.setItem(storageKey, JSON.stringify(azureValue.data))
          lastAzureFetchTime[key] = Date.now()
        }
      }
    } catch (error) {
      console.warn(`Failed to load from Azure for key "${key}":`, error)
    } finally {
      isLoadingFromAzure.current = false
    }
  }, [key, storageKey])

  // Load from Azure on mount
  useEffect(() => {
    loadFromAzure()
  }, [loadFromAzure])

  // Listen for force refresh events
  useEffect(() => {
    const handleForceRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ key: string }>
      if (customEvent.detail.key === key || customEvent.detail.key === '*') {
        loadFromAzure(true)
      }
    }

    kvEventEmitter.addEventListener('kv-force-refresh', handleForceRefresh)
    return () => kvEventEmitter.removeEventListener('kv-force-refresh', handleForceRefresh)
  }, [key, loadFromAzure])

  // Listen for changes from other components
  useEffect(() => {
    const handleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ key: string }>
      if (customEvent.detail.key === key) {
        try {
          const stored = localStorage.getItem(storageKey)
          if (stored) {
            setValue(JSON.parse(stored) as T)
          }
        } catch (error) {
          console.warn(`Failed to sync value for key "${key}":`, error)
        }
      }
    }

    kvEventEmitter.addEventListener('kv-change', handleChange)
    return () => kvEventEmitter.removeEventListener('kv-change', handleChange)
  }, [key, storageKey])

  // Listen for storage events from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        try {
          setValue(JSON.parse(event.newValue) as T)
        } catch (error) {
          console.warn(`Failed to parse storage event for key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, storageKey])

  // Update function that persists to both localStorage and Azure
  const updateValue = useCallback((newValue: T | ((oldValue?: T) => T)) => {
    setValue((currentValue) => {
      const resolvedValue = typeof newValue === 'function' 
        ? (newValue as (oldValue?: T) => T)(currentValue)
        : newValue
      
      // Always save to localStorage (immediate, synchronous)
      try {
        localStorage.setItem(storageKey, JSON.stringify(resolvedValue))
        emitKVChange(key)
      } catch (error) {
        console.error(`Failed to persist to localStorage for key "${key}":`, error)
      }
      
      // Also save to Azure (async, in background)
      ensureAzureInitialized().then(() => {
        if (isAzureAvailable()) {
          azureStorage.set(key, { data: resolvedValue, updatedAt: new Date().toISOString() })
            .catch(error => console.warn(`Failed to persist to Azure for key "${key}":`, error))
        }
      })
      
      return resolvedValue
    })
  }, [key, storageKey])

  // Return refresh function as third element
  const refresh = useCallback(async () => {
    await loadFromAzure(true)
  }, [loadFromAzure])

  return [value, updateValue, refresh]
}

export default useKV
