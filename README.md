# 💑 Shaadi Partner Search

A modern matrimonial profile search application built with React, TypeScript, and Vite. Features bilingual support (Hindi/English), profile management, matching, chat, and wedding services directory.

## 🚀 Features

- **Profile Search & Matching** - Advanced filters for finding compatible partners
- **Bilingual Support** - Full Hindi and English language support
- **Trust Verification** - Multi-level profile verification system
- **Chat & Messaging** - Real-time communication between matched profiles
- **Wedding Services Directory** - Find verified wedding vendors
- **Admin Panel** - Profile verification and management tools

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4, Radix UI Components
- **Storage**: Azure Cosmos DB (with localStorage cache)
- **Secrets**: Azure Key Vault
- **Files**: Azure Blob Storage
- **Icons**: Phosphor Icons, Lucide React
- **Forms**: React Hook Form, Zod validation

## 🏗️ Architecture

Both local development and production use the **same Azure services**. No `.env` files needed.

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (React App)                      │
├─────────────────────────────────────────────────────────────┤
│  useKV Hook (localStorage cache + Azure Cosmos DB sync)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Azure Services                            │
├──────────────────┬──────────────────┬───────────────────────┤
│   Cosmos DB      │    Key Vault     │    Blob Storage       │
│   (Profiles)     │   (Secrets)      │   (Images)            │
└──────────────────┴──────────────────┴───────────────────────┘
```

**How it works:**
1. App starts with localStorage data (fast initial load)
2. Azure SDK authenticates via `az login` (local) or Managed Identity (production)
3. Cosmos DB key is fetched from Key Vault
4. Data syncs between localStorage (cache) and Cosmos DB (source of truth)

## 📦 Getting Started

### Prerequisites

- Node.js 20+ 
- Azure CLI (`az`)
- Azure subscription with services configured

### Installation

```bash
# Clone the repository
git clone https://github.com/Jatin-Kumar-Khilrani/shaadi-partner-search.git
cd shaadi-partner-search

# Install dependencies
npm install

# Login to Azure (required for both local and production)
az login

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

## ☁️ Azure Services

| Service | Name | Purpose |
|---------|------|---------|
| **Resource Group** | shaadi-partner-rg2 | Container for all resources |
| **Cosmos DB** | shaadipartnerdb | Document database for profiles, users, chats |
| **Key Vault** | shaadipartnerkv | Secure storage for Cosmos DB key |
| **Blob Storage** | shaadipartnerstorage | Profile images and files |

### Service URLs (hardcoded in code)

- Cosmos DB: `https://shaadipartnerdb.documents.azure.com:443/`
- Key Vault: `https://shaadipartnerkv.vault.azure.net/`
- Blob Storage: `https://shaadipartnerstorage.blob.core.windows.net/`

## 🌐 Deployment

### GitHub Pages

Automatic deployment on push to `main`:

1. Push to the `main` branch
2. GitHub Actions builds and deploys
3. Access at: `https://jatin-kumar-khilrani.github.io/shaadi-partner-search/`

### Local Development

```bash
az login                    # Authenticate with Azure
npm run dev                 # Start dev server at http://localhost:5173
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components (shadcn/ui)
│   └── ...             # Feature components
├── hooks/
│   └── useKV.ts        # Azure-backed key-value storage hook
├── lib/
│   ├── azureConfig.ts  # Azure SDK integration
│   └── sampleData.ts   # Sample/demo data
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

## 🔐 Security

- No secrets in code or environment files
- Cosmos DB key stored in Azure Key Vault
- Authentication via Azure Identity (DefaultAzureCredential)
- RBAC for Key Vault access

## 📄 License

MIT License
