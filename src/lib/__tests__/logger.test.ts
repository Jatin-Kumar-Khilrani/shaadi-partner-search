import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('Logger', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('should be importable', async () => {
    const { logger } = await import('../logger')
    expect(logger).toBeDefined()
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
  })

  it('should export convenience functions', async () => {
    const { debug, info, warn, error } = await import('../logger')
    expect(typeof debug).toBe('function')
    expect(typeof info).toBe('function')
    expect(typeof warn).toBe('function')
    expect(typeof error).toBe('function')
  })

  it('should have isEnabled method', async () => {
    const { logger } = await import('../logger')
    expect(typeof logger.isEnabled).toBe('function')
    // In test/dev environment, should be enabled
    expect(typeof logger.isEnabled()).toBe('boolean')
  })

  it('should have getLevel method', async () => {
    const { logger } = await import('../logger')
    expect(typeof logger.getLevel).toBe('function')
    expect(['none', 'error', 'warn', 'info', 'debug']).toContain(logger.getLevel())
  })

  it('should expose global helpers on window', async () => {
    await import('../logger')
    // @ts-expect-error - testing global helpers
    expect(typeof window.enableDebug).toBe('function')
    // @ts-expect-error - testing global helpers
    expect(typeof window.disableDebug).toBe('function')
    // @ts-expect-error - testing global helpers
    expect(typeof window.setDebugLevel).toBe('function')
    // @ts-expect-error - testing global helpers
    expect(typeof window.debugStatus).toBe('function')
  })

  describe('logging methods', () => {
    it('should have group and groupEnd methods', async () => {
      const { logger } = await import('../logger')
      expect(typeof logger.group).toBe('function')
      expect(typeof logger.groupEnd).toBe('function')
    })

    it('should have table method', async () => {
      const { logger } = await import('../logger')
      expect(typeof logger.table).toBe('function')
    })

    it('should have time and timeEnd methods', async () => {
      const { logger } = await import('../logger')
      expect(typeof logger.time).toBe('function')
      expect(typeof logger.timeEnd).toBe('function')
    })
  })

  describe('global helper functions', () => {
    it('enableDebug should set debug mode', async () => {
      await import('../logger')
      // @ts-expect-error - testing global helpers
      window.enableDebug('debug')
      expect(localStorageMock.getItem('debug')).toBe('true')
      expect(localStorageMock.getItem('debugLevel')).toBe('debug')
    })

    it('disableDebug should clear debug mode', async () => {
      localStorageMock.setItem('debug', 'true')
      localStorageMock.setItem('debugLevel', 'debug')
      
      await import('../logger')
      // @ts-expect-error - testing global helpers
      window.disableDebug()
      
      expect(localStorageMock.getItem('debug')).toBeNull()
      expect(localStorageMock.getItem('debugLevel')).toBeNull()
    })

    it('setDebugLevel should update the level', async () => {
      await import('../logger')
      // @ts-expect-error - testing global helpers
      window.setDebugLevel('warn')
      expect(localStorageMock.getItem('debugLevel')).toBe('warn')
    })

    it('debugStatus should not throw', async () => {
      const { logger } = await import('../logger')
      // @ts-expect-error - testing global helpers
      expect(() => window.debugStatus()).not.toThrow()
      expect(logger).toBeDefined()
    })
  })

  describe('log level functionality', () => {
    it('should accept different log levels', async () => {
      await import('../logger')
      const validLevels = ['none', 'error', 'warn', 'info', 'debug']
      
      for (const level of validLevels) {
        // @ts-expect-error - testing global helpers
        expect(() => window.setDebugLevel(level)).not.toThrow()
      }
    })
  })
})
