import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { getCosmosContainer, getCorsHeaders } from '../lib/cosmos.js'

/**
 * KV API - Single handler for all CRUD operations on /api/kv/{key}
 */
app.http('kv', {
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'kv/{key}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const corsHeaders = getCorsHeaders()
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders }
    }

    const key = request.params.key
    if (!key) {
      return { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Key parameter is required' })
      }
    }

    try {
      const container = getCosmosContainer()

      // GET - Retrieve a value
      if (request.method === 'GET') {
        try {
          const { resource } = await container.item(key, key).read()
          
          if (!resource) {
            return {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Key not found' })
            }
          }

          context.log(`Retrieved key: ${key}`)
          return {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify(resource)
          }
        } catch (error: unknown) {
          if ((error as { code?: number }).code === 404) {
            return {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Key not found' })
            }
          }
          throw error
        }
      }

      // PUT/POST - Set a value
      if (request.method === 'PUT' || request.method === 'POST') {
        const body = await request.json() as Record<string, unknown>
        
        // Upsert the document with the key as both id and partition key
        const document = {
          id: key,
          key: key,
          ...body,
          updatedAt: new Date().toISOString()
        }
        
        await container.items.upsert(document)
        
        context.log(`Set key: ${key}`)
        return {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, key })
        }
      }

      // DELETE - Delete a value
      if (request.method === 'DELETE') {
        try {
          await container.item(key, key).delete()
          context.log(`Deleted key: ${key}`)
          return {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, key })
          }
        } catch (error: unknown) {
          if ((error as { code?: number }).code === 404) {
            return {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Key not found' })
            }
          }
          throw error
        }
      }

      return {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      }
    } catch (error) {
      context.error('Error in KV operation:', error)
      return {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' })
      }
    }
  }
})

/**
 * GET /api/health - Health check endpoint
 */
app.http('health', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const corsHeaders = getCorsHeaders()
    
    if (request.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders }
    }
    
    try {
      // Try to connect to Cosmos DB
      const container = getCosmosContainer()
      await container.database.client.getDatabaseAccount()
      
      return {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'healthy',
          timestamp: new Date().toISOString(),
          cosmosDb: 'connected'
        })
      }
    } catch (error) {
      return {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Cosmos DB connection failed'
        })
      }
    }
  }
})
