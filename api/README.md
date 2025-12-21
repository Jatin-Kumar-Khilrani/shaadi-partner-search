# ShaadiPartnerSearch API

Azure Function backend for the ShaadiPartnerSearch matrimonial application.

## Architecture

This API provides secure access to Azure Cosmos DB from the browser frontend. The Cosmos DB key is stored securely in Azure (as an App Setting or in Key Vault), never exposed to the browser.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kv/{key}` | Get a value by key |
| PUT | `/api/kv/{key}` | Set/update a value by key |
| DELETE | `/api/kv/{key}` | Delete a value by key |
| GET | `/api/health` | Health check endpoint |

## Local Development

### Prerequisites

- Node.js 18+
- Azure Functions Core Tools v4
- Azure CLI (for authentication)

### Setup

1. Install dependencies:
   ```bash
   cd api
   npm install
   ```

2. Create `local.settings.json` with your Cosmos DB key:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "COSMOS_ENDPOINT": "https://shaadipartnerdb.documents.azure.com:443/",
       "COSMOS_DATABASE": "shaadi-partner-db",
       "COSMOS_CONTAINER": "profiles",
       "COSMOS_KEY": "<your-cosmos-db-key>",
       "ALLOWED_ORIGINS": "http://localhost:5173,http://localhost:4173"
     }
   }
   ```

3. Build and start:
   ```bash
   npm run build
   npm start
   ```

The API will be available at `http://localhost:7071/api/`

## Deployment to Azure

### Create Azure Function App

```bash
# Create resource group (if not exists)
az group create --name shaadi-partner-rg2 --location centralindia

# Create storage account for Functions
az storage account create \
  --name shaadipartnerfuncstorage \
  --resource-group shaadi-partner-rg2 \
  --location centralindia \
  --sku Standard_LRS

# Create Function App
az functionapp create \
  --name shaadi-partner-api \
  --resource-group shaadi-partner-rg2 \
  --storage-account shaadipartnerfuncstorage \
  --consumption-plan-location centralindia \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4
```

### Configure App Settings

```bash
# Set Cosmos DB configuration
az functionapp config appsettings set \
  --name shaadi-partner-api \
  --resource-group shaadi-partner-rg2 \
  --settings \
    COSMOS_ENDPOINT="https://shaadipartnerdb.documents.azure.com:443/" \
    COSMOS_DATABASE="shaadi-partner-db" \
    COSMOS_CONTAINER="profiles" \
    COSMOS_KEY="<your-cosmos-db-key>" \
    ALLOWED_ORIGINS="https://jatin-kumar-khilrani.github.io"
```

### Deploy

```bash
# Build
npm run build

# Deploy using Azure Functions Core Tools
func azure functionapp publish shaadi-partner-api
```

### Configure CORS in Azure Portal

1. Go to Azure Portal → Function App → CORS
2. Add allowed origins:
   - `https://jatin-kumar-khilrani.github.io`
   - `http://localhost:5173` (for development)

## Frontend Configuration

After deploying the API, update the frontend's `runtime.config.json`:

```json
{
  "api": {
    "baseUrl": "https://shaadi-partner-api.azurewebsites.net"
  }
}
```

## Security Notes

- The Cosmos DB key is stored as an Azure App Setting (encrypted at rest)
- For enhanced security, use Azure Key Vault references
- CORS is configured to only allow specific origins
- Consider adding Azure AD authentication for production
