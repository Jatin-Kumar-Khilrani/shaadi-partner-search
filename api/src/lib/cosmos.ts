import { CosmosClient, Container } from '@azure/cosmos'

let container: Container | null = null

export function getCosmosContainer(): Container {
  if (container) return container

  const endpoint = process.env.COSMOS_ENDPOINT
  const key = process.env.COSMOS_KEY
  const databaseId = process.env.COSMOS_DATABASE || 'shaadi-partner-db'
  const containerId = process.env.COSMOS_CONTAINER || 'profiles'

  if (!endpoint || !key) {
    throw new Error('COSMOS_ENDPOINT and COSMOS_KEY environment variables are required')
  }

  const client = new CosmosClient({ endpoint, key })
  const database = client.database(databaseId)
  container = database.container(containerId)

  return container
}

export function getCorsHeaders(): Record<string, string> {
  const allowedOrigins = process.env.ALLOWED_ORIGINS || '*'
  
  return {
    'Access-Control-Allow-Origin': allowedOrigins.split(',')[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  }
}
