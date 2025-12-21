/**
 * Azure Functions Entry Point
 * This file imports all function modules so they get registered with the Azure Functions runtime.
 */

// Import all function modules
import './functions/kv.js'
import './functions/blob.js'

// Export for potential programmatic use
export {}
