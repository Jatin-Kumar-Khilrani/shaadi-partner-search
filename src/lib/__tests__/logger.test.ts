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
})
