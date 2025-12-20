# Azure & GitHub Setup Script for Shaadi Partner Search
# Run this script to set up Azure services
# Both local and production use the same Azure services (no .env files needed)

param(
    [string]$ResourceGroup = "shaadi-partner-rg2",
    [string]$Location = "westus2"
)

Write-Host "🚀 Azure Services for Shaadi Partner Search" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Check if logged in to Azure
$azAccount = az account show 2>$null | ConvertFrom-Json
if (-not $azAccount) {
    Write-Host "⚠️ Not logged in to Azure. Please login..." -ForegroundColor Yellow
    az login
    $azAccount = az account show | ConvertFrom-Json
}

Write-Host "✅ Logged in as: $($azAccount.user.name)" -ForegroundColor Green
Write-Host "   Subscription: $($azAccount.name)" -ForegroundColor Gray

# List existing resources
Write-Host "`n📦 Azure Resources in $ResourceGroup :" -ForegroundColor Cyan
az resource list --resource-group $ResourceGroup --output table

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Azure Service URLs (hardcoded in src/lib/azureConfig.ts):" -ForegroundColor Cyan
Write-Host ""
Write-Host "Cosmos DB:     https://shaadipartnerdb.documents.azure.com:443/"
Write-Host "Key Vault:     https://shaadipartnerkv.vault.azure.net/"
Write-Host "Blob Storage:  https://shaadipartnerstorage.blob.core.windows.net/"
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📝 How it works:" -ForegroundColor Cyan
Write-Host "1. Azure credentials are obtained via 'az login' (local) or Managed Identity (production)"
Write-Host "2. Cosmos DB key is fetched from Key Vault at runtime"
Write-Host "3. No .env files needed - both local and production use same Azure services"
Write-Host "4. localStorage serves as fast cache, Azure Cosmos DB is source of truth"
Write-Host ""
Write-Host "🚀 To run locally:" -ForegroundColor Cyan
Write-Host "   az login"
Write-Host "   npm run dev"
Write-Host ""
