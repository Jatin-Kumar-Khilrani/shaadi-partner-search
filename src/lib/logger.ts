/**
 * Configurable Logger with Debug Levels
 * 
 * Enable debug mode in production:
 * 1. URL param: Add ?debug=true to URL
 * 2. localStorage: localStorage.setItem('debug', 'true')
 * 3. Console command: window.enableDebug() or window.disableDebug()
 * 
 * Debug levels:
 * - 'none': No logs (production default)
 * - 'error': Only errors
 * - 'warn': Errors + warnings
 * - 'info': Errors + warnings + info
 * - 'debug': All logs including debug
 * 
 * Set level: localStorage.setItem('debugLevel', 'debug')
 */

type LogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug'

const LOG_LEVELS: Record<LogLevel, number> = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
}

class Logger {
  private static instance: Logger
  private debugEnabled: boolean = false
  private level: LogLevel = 'none'

  private constructor() {
    this.init()
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private init(): void {
    // Check URL params
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const debugParam = urlParams.get('debug')
      
      if (debugParam === 'true') {
        this.debugEnabled = true
        this.level = 'debug'
        console.info('🔧 Debug mode enabled via URL param')
      }
      
      // Check localStorage
      try {
        const storedDebug = localStorage.getItem('debug')
        const storedLevel = localStorage.getItem('debugLevel') as LogLevel | null
        
        if (storedDebug === 'true') {
          this.debugEnabled = true
          this.level = storedLevel || 'debug'
        }
      } catch {
        // localStorage not available
      }

      // Development mode - always enable
      if (import.meta.env.DEV) {
        this.debugEnabled = true
        this.level = 'debug'
      }

      // Expose global helpers
      this.exposeGlobalHelpers()
    }
  }

  private exposeGlobalHelpers(): void {
    if (typeof window !== 'undefined') {
      // @ts-expect-error - Adding global helpers for runtime debugging
      window.enableDebug = (level: LogLevel = 'debug') => {
        localStorage.setItem('debug', 'true')
        localStorage.setItem('debugLevel', level)
        this.debugEnabled = true
        this.level = level
        console.info(`🔧 Debug mode enabled (level: ${level}). Refresh to apply everywhere.`)
      }

      // @ts-expect-error - Adding global helpers for runtime debugging
      window.disableDebug = () => {
        localStorage.removeItem('debug')
        localStorage.removeItem('debugLevel')
        this.debugEnabled = false
        this.level = 'none'
        console.info('🔧 Debug mode disabled. Refresh to apply everywhere.')
      }

      // @ts-expect-error - Adding global helpers for runtime debugging
      window.setDebugLevel = (level: LogLevel) => {
        localStorage.setItem('debugLevel', level)
        this.level = level
        console.info(`🔧 Debug level set to: ${level}`)
      }

      // @ts-expect-error - Adding global helpers for runtime debugging
      window.debugStatus = () => {
        console.info(`🔧 Debug: ${this.debugEnabled ? 'ON' : 'OFF'}, Level: ${this.level}`)
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.debugEnabled) return false
    return LOG_LEVELS[level] <= LOG_LEVELS[this.level]
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log('🐛', ...args)
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info('ℹ️', ...args)
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn('⚠️', ...args)
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error('❌', ...args)
    }
  }

  // Group logs for better organization
  group(label: string): void {
    if (this.debugEnabled) {
      console.group(label)
    }
  }

  groupEnd(): void {
    if (this.debugEnabled) {
      console.groupEnd()
    }
  }

  // Table for structured data
  table(data: unknown): void {
    if (this.shouldLog('debug')) {
      console.table(data)
    }
  }

  // Time tracking
  time(label: string): void {
    if (this.shouldLog('debug')) {
      console.time(label)
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog('debug')) {
      console.timeEnd(label)
    }
  }

  // Check if debug is enabled (useful for conditional logic)
  isEnabled(): boolean {
    return this.debugEnabled
  }

  getLevel(): LogLevel {
    return this.level
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Export convenience functions for direct import
export const debug = (...args: unknown[]) => logger.debug(...args)
export const info = (...args: unknown[]) => logger.info(...args)
export const warn = (...args: unknown[]) => logger.warn(...args)
export const error = (...args: unknown[]) => logger.error(...args)

export default logger
