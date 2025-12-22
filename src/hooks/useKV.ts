import { useState, useEffect, useCallback, useRef } from 'react'
import { initializeAzureServices, isAzureAvailable, azureStorage } from '@/lib/azureConfig'

/**
 * Custom useKV hook for persistent key-value storage
 * Uses Azure Cosmos DB when available, localStorage as fallback
 * Both local and production point to the same Azure account
 */

const STORAGE_PREFIX = 'shaadi_partner_'

// Event emitter for cross-component state sync
const kvEventEmitter = new EventTarget()

function emitKVChange(key: string) {
  kvEventEmitter.dispatchEvent(new CustomEvent('kv-change', { detail: { key } }))
}

// Force refresh event emitter
function emitForceRefresh(key: string) {
  kvEventEmitter.dispatchEvent(new CustomEvent('kv-force-refresh', { detail: { key } }))
}

// Export function to force refresh a key from Azure
export function forceRefreshFromAzure(key: string) {
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

// Track which keys have been loaded from Azure (global to prevent race conditions)
const loadedFromAzure = new Set<string>()

export function useKV<T>(key: string, defaultValue: T): [T | undefined, (newValue: T | ((oldValue?: T) => T)) => void, () => Promise<void>, boolean] {
  const storageKey = `${STORAGE_PREFIX}${key}`
  const isLoadingFromAzure = useRef(false)
  const [hasLoadedFromAzure, setHasLoadedFromAzure] = useState(() => loadedFromAzure.has(key))
  
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
  const loadFromAzure = useCallback(async (forceRefresh = false) => {
    // Skip if already loading
    if (isLoadingFromAzure.current && !forceRefresh) {
      console.log(`[useKV] Already loading "${key}" from Azure, skipping...`)
      return
    }
    
    console.log(`[useKV] Loading "${key}" from Azure...`)
    isLoadingFromAzure.current = true

    try {
      await ensureAzureInitialized()
      
      if (isAzureAvailable()) {
        console.log(`[useKV] Azure available, fetching "${key}"...`)
        const azureValue = await azureStorage.get<{ data: T, updatedAt?: string }>(key)
        console.log(`[useKV] Azure response for "${key}":`, azureValue)
        if (azureValue && azureValue.data !== undefined) {
          console.log(`[useKV] Setting "${key}" data, count:`, Array.isArray(azureValue.data) ? azureValue.data.length : 'N/A')
          setValue(azureValue.data)
          // Sync to localStorage for faster subsequent loads
          localStorage.setItem(storageKey, JSON.stringify(azureValue.data))
        } else {
          console.log(`[useKV] No data found in Azure for "${key}"`)
        }
        // Mark as loaded from Azure
        loadedFromAzure.add(key)
        setHasLoadedFromAzure(true)
      } else {
        console.log(`[useKV] Azure not available for "${key}"`)
        // Still mark as "loaded" so we don't block operations
        loadedFromAzure.add(key)
        setHasLoadedFromAzure(true)
      }
    } catch (error) {
      console.warn(`Failed to load from Azure for key "${key}":`, error)
      // Still mark as loaded to not block operations
      loadedFromAzure.add(key)
      setHasLoadedFromAzure(true)
    } finally {
      isLoadingFromAzure.current = false
    }
  }, [key, storageKey])

  // Load from Azure on mount (initial load only)
  useEffect(() => {
    loadFromAzure()
  }, [loadFromAzure])

  // Listen for force refresh events
  useEffect(() => {
    const handleForceRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ key: string }>
      if (customEvent.detail.key === key || customEvent.detail.key === '*') {
        loadFromAzure()
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
        console.log(`[useKV] Saved "${key}" to localStorage, count:`, Array.isArray(resolvedValue) ? resolvedValue.length : 'N/A')
      } catch (error) {
        console.error(`Failed to persist to localStorage for key "${key}":`, error)
      }
      
      // Also save to Azure (async, in background)
      ensureAzureInitialized().then(() => {
        if (isAzureAvailable()) {
          console.log(`[useKV] Saving "${key}" to Azure...`)
          azureStorage.set(key, { data: resolvedValue, updatedAt: new Date().toISOString() })
            .then(() => console.log(`[useKV] ✅ Successfully saved "${key}" to Azure`))
            .catch(error => console.warn(`[useKV] ❌ Failed to persist to Azure for key "${key}":`, error))
        } else {
          console.log(`[useKV] Azure not available, skipping Azure save for "${key}"`)
        }
      })
      
      return resolvedValue
    })
  }, [key, storageKey])

  // Return refresh function as third element, and loaded status as fourth
  const refresh = useCallback(async () => {
    await loadFromAzure(true)
  }, [loadFromAzure])

  return [value, updateValue, refresh, hasLoadedFromAzure]
}

export default useKV
