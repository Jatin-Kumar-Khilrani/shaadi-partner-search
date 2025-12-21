/**
 * DigiLocker API Integration Service
 * 
 * DigiLocker is a flagship initiative of Ministry of Electronics & IT (MeitY)
 * under Digital India Corporation (formerly CDAC).
 * 
 * API Documentation: https://partners.digilocker.gov.in/
 * Partner Portal: https://partners.digilocker.gov.in/
 * 
 * INTEGRATION STEPS:
 * ==================
 * 
 * 1. REGISTER AS PARTNER
 *    - Visit https://partners.digilocker.gov.in/
 *    - Create an account and apply for partnership
 *    - Choose "Requester" application type
 *    - Submit required documents (Company registration, PAN, etc.)
 *    - Wait for approval (typically 2-4 weeks)
 * 
 * 2. GET API CREDENTIALS
 *    After approval, you'll receive:
 *    - Client ID
 *    - Client Secret
 *    - Redirect URI (configure in partner portal)
 * 
 * 3. SANDBOX TESTING
 *    - Use sandbox environment first
 *    - Sandbox URL: https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize
 *    - Production URL: https://api.digitallocker.gov.in/public/oauth2/1/authorize
 * 
 * 4. API FLOW (OAuth 2.0)
 *    a. Redirect user to DigiLocker authorization URL
 *    b. User logs in with Aadhaar/Mobile/Username
 *    c. User grants consent to share documents
 *    d. DigiLocker redirects back with authorization code
 *    e. Exchange code for access token
 *    f. Use access token to fetch eAadhaar/documents
 * 
 * 5. DOCUMENTS AVAILABLE
 *    - AADHAAR (e-Aadhaar)
 *    - PAN Card
 *    - Driving License
 *    - Voter ID
 *    - Passport
 *    - Class 10/12 Marksheets
 *    - And 2000+ more documents
 */

// DigiLocker API Configuration
// In production, these should come from environment variables or Azure Key Vault
export const DIGILOCKER_CONFIG = {
  // Sandbox environment (for testing)
  sandbox: {
    authUrl: 'https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize',
    tokenUrl: 'https://digilocker.meripehchaan.gov.in/public/oauth2/1/token',
    apiBaseUrl: 'https://digilocker.meripehchaan.gov.in/public/oauth2/1',
  },
  // Production environment
  production: {
    authUrl: 'https://api.digitallocker.gov.in/public/oauth2/1/authorize',
    tokenUrl: 'https://api.digitallocker.gov.in/public/oauth2/1/token',
    apiBaseUrl: 'https://api.digitallocker.gov.in/public/oauth2/1',
  },
  // Your registered credentials (get from DigiLocker Partner Portal)
  clientId: 'YOUR_CLIENT_ID', // Replace after registration
  clientSecret: 'YOUR_CLIENT_SECRET', // Replace after registration
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/digilocker-callback` : 'http://localhost:5173/digilocker-callback',
  // Scope for required documents
  scope: 'openid profile aadhaar', // Request Aadhaar access
  responseType: 'code',
  codeChallenge: '', // For PKCE flow
  codeChallengeMethod: 'S256',
}

export interface DigiLockerUser {
  digilockerID: string
  name: string
  dob: string
  gender: 'M' | 'F' | 'T'
  mobile?: string
  email?: string
  eaadhaar?: {
    uid: string // Last 4 digits of Aadhaar
    name: string
    dob: string
    gender: string
    address?: string
    photo?: string // Base64 encoded photo
  }
}

export interface DigiLockerDocument {
  uri: string
  name: string
  type: string
  size: number
  date: string
  issuer: string
  description: string
}

/**
 * Generate PKCE code verifier and challenge
 * Required for secure OAuth flow
 */
function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  const codeVerifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  // Generate code challenge (SHA-256 hash of verifier)
  return { codeVerifier, codeChallenge: codeVerifier } // Simplified for demo
}

/**
 * Generate state parameter for CSRF protection
 */
function generateState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Initiate DigiLocker OAuth flow
 * This redirects user to DigiLocker login page
 */
export function initiateDigiLockerAuth(): void {
  const { codeVerifier, codeChallenge } = generatePKCE()
  const state = generateState()
  
  // Store verifier and state in session storage for later verification
  sessionStorage.setItem('digilocker_code_verifier', codeVerifier)
  sessionStorage.setItem('digilocker_state', state)
  
  const config = DIGILOCKER_CONFIG
  const isProduction = window.location.hostname !== 'localhost'
  const urls = isProduction ? config.production : config.sandbox
  
  // Build authorization URL
  const params = new URLSearchParams({
    response_type: config.responseType,
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state: state,
    scope: config.scope,
    code_challenge: codeChallenge,
    code_challenge_method: config.codeChallengeMethod,
  })
  
  const authUrl = `${urls.authUrl}?${params.toString()}`
  
  // Open DigiLocker in popup window
  const width = 600
  const height = 700
  const left = (window.screen.width - width) / 2
  const top = (window.screen.height - height) / 2
  
  window.open(
    authUrl,
    'DigiLocker Login',
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
  )
}

/**
 * Handle OAuth callback
 * Called when DigiLocker redirects back with authorization code
 */
export async function handleDigiLockerCallback(
  code: string, 
  state: string
): Promise<{ success: boolean; user?: DigiLockerUser; error?: string }> {
  // Verify state to prevent CSRF
  const savedState = sessionStorage.getItem('digilocker_state')
  if (state !== savedState) {
    return { success: false, error: 'Invalid state parameter - possible CSRF attack' }
  }
  
  const codeVerifier = sessionStorage.getItem('digilocker_code_verifier')
  if (!codeVerifier) {
    return { success: false, error: 'Code verifier not found' }
  }
  
  try {
    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(code, codeVerifier)
    
    if (!tokenResponse.access_token) {
      return { success: false, error: 'Failed to get access token' }
    }
    
    // Fetch user profile and eAadhaar
    const user = await fetchUserProfile(tokenResponse.access_token)
    
    // Clean up session storage
    sessionStorage.removeItem('digilocker_code_verifier')
    sessionStorage.removeItem('digilocker_state')
    
    return { success: true, user }
  } catch (error) {
    console.error('DigiLocker callback error:', error)
    return { success: false, error: 'Failed to complete DigiLocker verification' }
  }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(
  code: string, 
  codeVerifier: string
): Promise<{ access_token: string; token_type: string; expires_in: number }> {
  const config = DIGILOCKER_CONFIG
  const isProduction = window.location.hostname !== 'localhost'
  const urls = isProduction ? config.production : config.sandbox
  
  const response = await fetch(urls.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code_verifier: codeVerifier,
    }),
  })
  
  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`)
  }
  
  return response.json()
}

/**
 * Fetch user profile from DigiLocker
 */
async function fetchUserProfile(accessToken: string): Promise<DigiLockerUser> {
  const config = DIGILOCKER_CONFIG
  const isProduction = window.location.hostname !== 'localhost'
  const urls = isProduction ? config.production : config.sandbox
  
  // Fetch user info
  const userResponse = await fetch(`${urls.apiBaseUrl}/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })
  
  if (!userResponse.ok) {
    throw new Error('Failed to fetch user profile')
  }
  
  const userData = await userResponse.json()
  
  // Fetch eAadhaar if available
  let eaadhaar
  try {
    const aadhaarResponse = await fetch(`${urls.apiBaseUrl}/eaadhaar`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    if (aadhaarResponse.ok) {
      eaadhaar = await aadhaarResponse.json()
    }
  } catch {
    console.log('eAadhaar not available or not consented')
  }
  
  return {
    digilockerID: userData.digilockerid,
    name: userData.name,
    dob: userData.dob,
    gender: userData.gender,
    mobile: userData.mobile,
    email: userData.email,
    eaadhaar,
  }
}

/**
 * DEMO MODE: Simulate DigiLocker verification
 * This is used when actual DigiLocker API is not configured
 * 
 * In production, replace this with actual OAuth flow
 */
export function simulateDigiLockerVerification(
  onSuccess: (user: DigiLockerUser) => void,
  onError: (error: string) => void,
  language: 'hi' | 'en'
): void {
  // Show a simulated DigiLocker popup
  const popup = window.open('', 'DigiLocker Demo', 'width=500,height=600')
  
  if (!popup) {
    onError(language === 'hi' ? 'पॉपअप ब्लॉक किया गया' : 'Popup blocked')
    return
  }
  
  // Create demo UI in popup
  popup.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>DigiLocker - Demo Mode</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Segoe UI', system-ui, sans-serif; 
          background: linear-gradient(135deg, #1a5276 0%, #2e86de 100%);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
        }
        .header {
          background: white;
          width: 100%;
          max-width: 400px;
          padding: 20px;
          border-radius: 12px 12px 0 0;
          text-align: center;
        }
        .logo { font-size: 24px; font-weight: bold; color: #1a5276; }
        .subtitle { color: #666; font-size: 12px; margin-top: 5px; }
        .content {
          background: #f8f9fa;
          width: 100%;
          max-width: 400px;
          padding: 30px;
          border-radius: 0 0 12px 12px;
        }
        .demo-badge {
          background: #fff3cd;
          border: 1px solid #ffc107;
          color: #856404;
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
          margin-bottom: 20px;
          text-align: center;
        }
        .form-group { margin-bottom: 20px; }
        label { display: block; font-weight: 600; color: #333; margin-bottom: 8px; }
        input, select {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }
        input:focus, select:focus { 
          outline: none; 
          border-color: #2e86de; 
          box-shadow: 0 0 0 3px rgba(46,134,222,0.1);
        }
        button {
          width: 100%;
          padding: 14px;
          background: #2e86de;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        button:hover { background: #1a5276; }
        .footer {
          margin-top: 20px;
          text-align: center;
          color: rgba(255,255,255,0.8);
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🔐 DigiLocker</div>
        <div class="subtitle">Digital India | Ministry of Electronics & IT</div>
      </div>
      <div class="content">
        <div class="demo-badge">
          ⚠️ DEMO MODE - In production, this will be official DigiLocker
        </div>
        <form id="demoForm">
          <div class="form-group">
            <label>Full Name (as per Aadhaar)</label>
            <input type="text" id="name" required placeholder="Enter your name" />
          </div>
          <div class="form-group">
            <label>Date of Birth</label>
            <input type="date" id="dob" required max="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label>Gender</label>
            <select id="gender" required>
              <option value="">Select Gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="T">Other</option>
            </select>
          </div>
          <button type="submit">Grant Access & Verify</button>
        </form>
      </div>
      <div class="footer">
        <p>This simulates DigiLocker OAuth flow</p>
        <p>Real integration requires partner registration at partners.digilocker.gov.in</p>
      </div>
      <script>
        document.getElementById('demoForm').addEventListener('submit', function(e) {
          e.preventDefault();
          const userData = {
            name: document.getElementById('name').value,
            dob: document.getElementById('dob').value,
            gender: document.getElementById('gender').value,
            digilockerID: 'DL' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            aadhaarLastFour: Math.floor(1000 + Math.random() * 9000).toString()
          };
          window.opener.postMessage({ type: 'DIGILOCKER_SUCCESS', data: userData }, '*');
          window.close();
        });
      </script>
    </body>
    </html>
  `)
  
  // Listen for response from popup
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'DIGILOCKER_SUCCESS') {
      window.removeEventListener('message', handleMessage)
      
      const data = event.data.data
      const user: DigiLockerUser = {
        digilockerID: data.digilockerID,
        name: data.name,
        dob: data.dob,
        gender: data.gender,
        eaadhaar: {
          uid: data.aadhaarLastFour,
          name: data.name,
          dob: data.dob,
          gender: data.gender === 'M' ? 'Male' : data.gender === 'F' ? 'Female' : 'Other',
        }
      }
      
      onSuccess(user)
    }
  }
  
  window.addEventListener('message', handleMessage)
  
  // Handle popup close without completion
  const checkClosed = setInterval(() => {
    if (popup.closed) {
      clearInterval(checkClosed)
      window.removeEventListener('message', handleMessage)
    }
  }, 500)
}

/**
 * Check if DigiLocker is properly configured for production
 */
export function isDigiLockerConfigured(): boolean {
  return DIGILOCKER_CONFIG.clientId !== 'YOUR_CLIENT_ID' && 
         DIGILOCKER_CONFIG.clientSecret !== 'YOUR_CLIENT_SECRET'
}
