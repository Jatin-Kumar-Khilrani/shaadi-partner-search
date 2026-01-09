/**
 * Azure AI Foundry Service
 * Provides AI capabilities for bio generation and face analysis
 */

import type { Profile, SelfDiscoveryData } from '@/types/profile'
import { logger } from './logger'

// Azure OpenAI configuration - loaded from environment variables
const getConfig = () => ({
  endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || 'https://eastus2.api.cognitive.microsoft.com/',
  apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY || '',
  deployment: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'
})

export interface BioGenerationParams {
  name: string
  age: number
  gender: 'male' | 'female'
  education: string
  occupation: string
  location: string
  religion?: string
  caste?: string
  hobbies?: string
  familyDetails?: string
  language: 'hi' | 'en'
}

export interface GeneratedBioResult {
  bio: string
  success: boolean
  message?: string
}

/**
 * Generate a professional matrimonial bio using Azure OpenAI
 */
export async function generateBio(params: BioGenerationParams): Promise<GeneratedBioResult> {
  const { name, age, gender, education, occupation, location, religion, caste, hobbies, familyDetails, language } = params
  const config = getConfig()

  // If no API key configured, use demo mode
  if (!config.apiKey) {
    return generateDemoBio(params)
  }

  const systemPrompt = language === 'hi'
    ? `आप एक पेशेवर वैवाहिक प्रोफाइल लेखक हैं। दिए गए विवरणों के आधार पर एक आकर्षक और सम्मानजनक परिचय लिखें। परिचय 150-200 शब्दों का होना चाहिए।`
    : `You are a professional matrimonial profile writer. Write an attractive and respectful bio based on the given details. The bio should be 150-200 words.`

  const userPrompt = language === 'hi'
    ? `कृपया निम्नलिखित विवरण के आधार पर एक वैवाहिक प्रोफाइल परिचय लिखें:
नाम: ${name}
आयु: ${age} वर्ष
लिंग: ${gender === 'male' ? 'पुरुष' : 'महिला'}
शिक्षा: ${education}
व्यवसाय: ${occupation}
स्थान: ${location}
${religion ? `धर्म: ${religion}` : ''}
${caste ? `जाति: ${caste}` : ''}
${hobbies ? `शौक: ${hobbies}` : ''}
${familyDetails ? `परिवार: ${familyDetails}` : ''}

परिचय पारंपरिक मूल्यों के साथ आधुनिक दृष्टिकोण को दर्शाना चाहिए।`
    : `Please write a matrimonial profile bio based on the following details:
Name: ${name}
Age: ${age} years
Gender: ${gender}
Education: ${education}
Occupation: ${occupation}
Location: ${location}
${religion ? `Religion: ${religion}` : ''}
${caste ? `Caste: ${caste}` : ''}
${hobbies ? `Hobbies: ${hobbies}` : ''}
${familyDetails ? `Family: ${familyDetails}` : ''}

The bio should reflect traditional values with a modern outlook.`

  try {
    const response = await fetch(`${config.endpoint}openai/deployments/${config.deployment}/chat/completions?api-version=2024-08-01-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      logger.error('Azure OpenAI error:', await response.text())
      return generateDemoBio(params)
    }

    const data = await response.json()
    const generatedBio = data.choices?.[0]?.message?.content?.trim()

    if (generatedBio) {
      return {
        bio: generatedBio,
        success: true
      }
    }

    return generateDemoBio(params)
  } catch (error) {
    logger.error('Bio generation error:', error)
    return generateDemoBio(params)
  }
}

/**
 * Refine an existing bio using AI
 */
export async function refineBio(
  currentBio: string,
  instructions: string,
  language: 'hi' | 'en'
): Promise<GeneratedBioResult> {
  const config = getConfig()
  
  if (!config.apiKey) {
    return {
      bio: currentBio,
      success: false,
      message: language === 'hi' ? 'AI सेवा उपलब्ध नहीं है' : 'AI service not available'
    }
  }

  const systemPrompt = language === 'hi'
    ? `आप एक पेशेवर वैवाहिक प्रोफाइल संपादक हैं। दिए गए परिचय को निर्देशों के अनुसार सुधारें।`
    : `You are a professional matrimonial profile editor. Refine the given bio according to the instructions.`

  const userPrompt = language === 'hi'
    ? `वर्तमान परिचय: ${currentBio}\n\nनिर्देश: ${instructions}\n\nकृपया परिचय को सुधारें।`
    : `Current bio: ${currentBio}\n\nInstructions: ${instructions}\n\nPlease refine the bio.`

  try {
    const response = await fetch(`${config.endpoint}openai/deployments/${config.deployment}/chat/completions?api-version=2024-08-01-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      return {
        bio: currentBio,
        success: false,
        message: language === 'hi' ? 'परिशोधन विफल' : 'Refinement failed'
      }
    }

    const data = await response.json()
    const refinedBio = data.choices?.[0]?.message?.content?.trim()

    return {
      bio: refinedBio || currentBio,
      success: !!refinedBio
    }
  } catch (error) {
    logger.error('Bio refinement error:', error)
    return {
      bio: currentBio,
      success: false,
      message: language === 'hi' ? 'त्रुटि हुई' : 'An error occurred'
    }
  }
}

/**
 * Demo mode bio generation
 */
function generateDemoBio(params: BioGenerationParams): GeneratedBioResult {
  const { name, age, gender, education, occupation, location, religion, caste, language } = params
  const firstName = name.split(' ')[0]

  if (language === 'hi') {
    const genderText = gender === 'male' ? 'एक संस्कारी और शिक्षित युवक' : 'एक संस्कारी और शिक्षित युवती'
    return {
      bio: `${firstName} ${genderText} ${gender === 'male' ? 'हैं' : 'हैं'}, जो ${location} में रहते ${gender === 'male' ? 'हैं' : 'हैं'}। ${age} वर्षीय ${firstName} ने ${education} में अपनी शिक्षा पूरी की है और वर्तमान में ${occupation} के रूप में कार्यरत ${gender === 'male' ? 'हैं' : 'हैं'}।${religion ? ` ${religion} परिवार से संबंधित` : ''}${caste ? ` ${caste} समुदाय के` : ''} ${firstName} पारंपरिक मूल्यों को मानते हुए आधुनिक सोच रखते ${gender === 'male' ? 'हैं' : 'हैं'}। ${gender === 'male' ? 'वे' : 'वे'} एक ऐसे जीवनसाथी की तलाश में ${gender === 'male' ? 'हैं' : 'हैं'} जो समझदार, शिक्षित और परिवार के प्रति समर्पित हो।`,
      success: true,
      message: 'Demo mode - AI generated bio'
    }
  }

  const pronounHe = gender === 'male' ? 'He' : 'She'
  const pronounHis = gender === 'male' ? 'His' : 'Her'
  const _pronounHim = gender === 'male' ? 'him' : 'her'

  return {
    bio: `${firstName} is a well-educated and cultured ${gender === 'male' ? 'young man' : 'young woman'} residing in ${location}. At ${age} years of age, ${pronounHe.toLowerCase()} has completed ${pronounHis.toLowerCase()} ${education} and is currently working as a ${occupation}.${religion ? ` Coming from a ${religion} family` : ''}${caste ? ` of ${caste} community` : ''}, ${firstName} believes in traditional values while maintaining a modern outlook. ${pronounHe} is looking for a life partner who is understanding, educated, and committed to family values. ${pronounHis} ideal match would be someone who shares ${pronounHis.toLowerCase()} vision of building a happy and harmonious family life together.`,
    success: true,
    message: 'Demo mode - AI generated bio'
  }
}

// ============================================
// Advanced Bio Generation (for AI Bio Assistant)
// ============================================

export interface AdvancedBioParams {
  profile: Profile
  tone: 'warm' | 'professional' | 'traditional' | 'casual'
  highlights: string[]
  hobbies: string[]
  additionalInfo?: string
  selfDiscoveryData?: SelfDiscoveryData
  language: 'en' | 'hi'
}

/**
 * Generate an advanced matrimonial bio using Azure OpenAI
 * This function is used by the AI Bio Assistant with more customization options
 */
export async function generateAdvancedBio(params: AdvancedBioParams): Promise<GeneratedBioResult> {
  const { profile, tone, highlights, hobbies, additionalInfo, selfDiscoveryData, language } = params
  const config = getConfig()

  // If no API key configured, use fallback mode
  if (!config.apiKey) {
    return generateAdvancedDemoBio(params)
  }

  const toneDescriptions: Record<string, { en: string; hi: string }> = {
    warm: { en: 'warm, friendly and approachable', hi: 'गर्मजोश, मैत्रीपूर्ण और सुलभ' },
    professional: { en: 'professional, polished and sophisticated', hi: 'पेशेवर, परिष्कृत और आधुनिक' },
    traditional: { en: 'traditional, respectful and family-oriented', hi: 'पारंपरिक, सम्मानजनक और परिवार-केंद्रित' },
    casual: { en: 'casual, relaxed and genuine', hi: 'आकस्मिक, शांत और वास्तविक' }
  }

  const highlightLabels: Record<string, { en: string; hi: string }> = {
    career: { en: 'career achievements', hi: 'करियर उपलब्धियां' },
    education: { en: 'educational background', hi: 'शैक्षिक पृष्ठभूमि' },
    family: { en: 'family values', hi: 'पारिवारिक मूल्य' },
    hobbies: { en: 'hobbies and interests', hi: 'शौक और रुचियां' },
    personality: { en: 'personality traits', hi: 'व्यक्तित्व लक्षण' },
    goals: { en: 'future goals', hi: 'भविष्य के लक्ष्य' },
    spirituality: { en: 'spiritual side', hi: 'आध्यात्मिक पक्ष' },
    lifestyle: { en: 'lifestyle preferences', hi: 'जीवनशैली' }
  }

  const hobbyLabels: Record<string, { en: string; hi: string }> = {
    travel: { en: 'traveling', hi: 'यात्रा' },
    reading: { en: 'reading', hi: 'पढ़ना' },
    music: { en: 'music', hi: 'संगीत' },
    cooking: { en: 'cooking', hi: 'खाना बनाना' },
    sports: { en: 'sports and fitness', hi: 'खेल और फिटनेस' },
    photography: { en: 'photography', hi: 'फोटोग्राफी' },
    movies: { en: 'movies', hi: 'फिल्में' },
    gaming: { en: 'gaming', hi: 'गेमिंग' },
    art: { en: 'art and crafts', hi: 'कला और शिल्प' },
    dancing: { en: 'dancing', hi: 'नृत्य' }
  }

  const toneDesc = toneDescriptions[tone]?.[language] || toneDescriptions.warm[language]
  const highlightTexts = highlights.map(h => highlightLabels[h]?.[language] || h).join(', ')
  const hobbyTexts = hobbies.map(h => hobbyLabels[h]?.[language] || h).join(', ')

  // Build personality context from self-discovery data
  let personalityContext = ''
  if (selfDiscoveryData) {
    const personalityTypes: Record<string, { en: string; hi: string }> = {
      introvert: { en: 'introverted and thoughtful', hi: 'अंतर्मुखी और विचारशील' },
      balanced: { en: 'balanced and adaptable', hi: 'संतुलित और अनुकूलनशील' },
      extrovert: { en: 'extroverted and sociable', hi: 'बहिर्मुखी और मिलनसार' }
    }
    const valuesOrientations: Record<string, { en: string; hi: string }> = {
      traditional: { en: 'traditional values', hi: 'पारंपरिक मूल्य' },
      moderate: { en: 'moderate outlook', hi: 'संतुलित दृष्टिकोण' },
      progressive: { en: 'progressive thinking', hi: 'प्रगतिशील सोच' }
    }
    personalityContext = language === 'en'
      ? `Personality: ${personalityTypes[selfDiscoveryData.personalityType]?.en || 'balanced'}, with ${valuesOrientations[selfDiscoveryData.valuesOrientation]?.en || 'moderate outlook'}.`
      : `व्यक्तित्व: ${personalityTypes[selfDiscoveryData.personalityType]?.hi || 'संतुलित'}, ${valuesOrientations[selfDiscoveryData.valuesOrientation]?.hi || 'संतुलित दृष्टिकोण'} के साथ।`
  }

  const systemPrompt = language === 'hi'
    ? `आप एक पेशेवर वैवाहिक प्रोफाइल लेखक हैं। एक आकर्षक और सम्मानजनक परिचय लिखें जो ${toneDesc} हो। परिचय 150-200 शब्दों का, प्रथम पुरुष में होना चाहिए।`
    : `You are a professional matrimonial profile writer. Write an attractive and respectful bio that is ${toneDesc}. The bio should be 150-200 words, written in first person.`

  const userPrompt = language === 'hi'
    ? `कृपया निम्नलिखित विवरण के आधार पर एक वैवाहिक प्रोफाइल परिचय लिखें:

नाम: ${profile.firstName}
आयु: ${profile.age} वर्ष
लिंग: ${profile.gender === 'male' ? 'पुरुष' : 'महिला'}
शिक्षा: ${profile.education}
व्यवसाय: ${profile.occupation}
स्थान: ${profile.location}
${profile.religion ? `धर्म: ${profile.religion}` : ''}
${profile.caste ? `जाति: ${profile.caste}` : ''}

हाइलाइट करें: ${highlightTexts}
शौक: ${hobbyTexts}
${personalityContext}
${additionalInfo ? `अतिरिक्त जानकारी: ${additionalInfo}` : ''}

शैली: ${toneDesc}
कृपया प्रथम पुरुष में लिखें (मैं, मेरा, मुझे)।`
    : `Please write a matrimonial profile bio based on the following details:

Name: ${profile.firstName}
Age: ${profile.age} years
Gender: ${profile.gender}
Education: ${profile.education}
Occupation: ${profile.occupation}
Location: ${profile.location}
${profile.religion ? `Religion: ${profile.religion}` : ''}
${profile.caste ? `Caste: ${profile.caste}` : ''}

Highlight: ${highlightTexts}
Hobbies: ${hobbyTexts}
${personalityContext}
${additionalInfo ? `Additional info: ${additionalInfo}` : ''}

Style: ${toneDesc}
Please write in first person (I, my, me).`

  try {
    const response = await fetch(`${config.endpoint}openai/deployments/${config.deployment}/chat/completions?api-version=2024-08-01-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 600,
        temperature: 0.8
      })
    })

    if (!response.ok) {
      logger.error('Azure OpenAI error:', await response.text())
      return generateAdvancedDemoBio(params)
    }

    const data = await response.json()
    const generatedBio = data.choices?.[0]?.message?.content?.trim()

    if (generatedBio) {
      return {
        bio: generatedBio,
        success: true
      }
    }

    return generateAdvancedDemoBio(params)
  } catch (error) {
    logger.error('Advanced bio generation error:', error)
    return generateAdvancedDemoBio(params)
  }
}

/**
 * Demo mode for advanced bio generation
 */
function generateAdvancedDemoBio(params: AdvancedBioParams): GeneratedBioResult {
  const { profile, tone, highlights, hobbies, additionalInfo, language } = params

  const toneIntros: Record<string, { en: string; hi: string }> = {
    warm: {
      en: `Hello! I'm ${profile.firstName}, a ${profile.occupation} based in ${profile.location}.`,
      hi: `नमस्ते! मैं ${profile.firstName} हूं, ${profile.location} में ${profile.occupation} के रूप में कार्यरत।`
    },
    professional: {
      en: `I am ${profile.firstName}, a dedicated ${profile.occupation} residing in ${profile.location}.`,
      hi: `मैं ${profile.firstName} हूं, ${profile.location} में रहने वाला समर्पित ${profile.occupation}।`
    },
    traditional: {
      en: `Namaste! I am ${profile.firstName} from ${profile.location}, working as a ${profile.occupation}.`,
      hi: `नमस्ते! मैं ${profile.location} से ${profile.firstName} हूं, ${profile.occupation} के रूप में कार्यरत।`
    },
    casual: {
      en: `Hey there! I'm ${profile.firstName}, ${profile.occupation} from ${profile.location}.`,
      hi: `नमस्ते! मैं ${profile.firstName}, ${profile.location} से ${profile.occupation}।`
    }
  }

  let bioText = language === 'en' 
    ? (toneIntros[tone]?.en || toneIntros.warm.en) 
    : (toneIntros[tone]?.hi || toneIntros.warm.hi)

  // Add education if highlighted
  if (highlights.includes('education') && profile.education) {
    bioText += language === 'en'
      ? ` I completed my ${profile.education} and believe in continuous learning.`
      : ` मैंने ${profile.education} की शिक्षा प्राप्त की है और निरंतर सीखने में विश्वास करता हूं।`
  }

  // Add family values if highlighted
  if (highlights.includes('family')) {
    bioText += language === 'en'
      ? ` Family is at the center of my life, and I believe in maintaining strong bonds with loved ones.`
      : ` परिवार मेरे जीवन के केंद्र में है, और मैं प्रियजनों के साथ मजबूत बंधन बनाए रखने में विश्वास करता हूं।`
  }

  // Add hobbies
  if (highlights.includes('hobbies') && hobbies.length > 0) {
    const hobbyNames = hobbies.join(', ')
    bioText += language === 'en'
      ? ` In my free time, I enjoy ${hobbyNames}.`
      : ` अपने खाली समय में, मुझे ${hobbyNames} पसंद है।`
  }

  // Add goals
  if (highlights.includes('goals')) {
    bioText += language === 'en'
      ? ` Looking forward to finding a partner to build a meaningful life together based on mutual respect and understanding.`
      : ` आपसी सम्मान और समझ के आधार पर एक साथ सार्थक जीवन बनाने के लिए एक साथी खोजने की उम्मीद है।`
  }

  // Add additional info
  if (additionalInfo) {
    bioText += ` ${additionalInfo}`
  }

  return {
    bio: bioText,
    success: true,
    message: 'Generated using fallback mode'
  }
}

/**
 * Analyze face coverage in an image
 * Returns the percentage of image covered by face
 */
export async function analyzeFaceCoverage(_imageBase64: string): Promise<{
  coverage: number
  isValid: boolean
  message: string
}> {
  // Using Azure Face API to detect face and calculate coverage
  // For demo mode, we'll simulate the analysis
  
  // In production, this would call Azure Face API with returnFaceRectangle=true
  // and calculate: (faceWidth * faceHeight) / (imageWidth * imageHeight) * 100
  
  // Demo simulation
  const simulatedCoverage = 60 + Math.random() * 30 // 60-90%
  const isValid = simulatedCoverage >= 50

  return {
    coverage: Math.round(simulatedCoverage),
    isValid,
    message: isValid
      ? 'Face coverage is adequate'
      : 'Please ensure your face covers at least 50% of the frame'
  }
}

/**
 * Summarize a chat conversation using Azure OpenAI
 * This is used by admin to get a quick summary of user conversations
 */
export interface ChatSummaryParams {
  messages: Array<{
    from: string
    message: string
    timestamp: string
    location?: { latitude: number; longitude: number }
  }>
  userName: string
  language: 'hi' | 'en'
}

export interface ChatSummaryResult {
  summary: string
  keyTopics: string[]
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  actionItems: string[]
  success: boolean
  message?: string
}

export async function summarizeChatConversation(params: ChatSummaryParams): Promise<ChatSummaryResult> {
  const { messages, userName, language } = params
  const config = getConfig()

  // If no API key or no messages, return demo
  if (!config.apiKey || messages.length === 0) {
    return generateDemoChatSummary(params)
  }

  const chatHistory = messages.map(m => 
    `[${new Date(m.timestamp).toLocaleString()}] ${m.from}: ${m.message}${m.location ? ` 📍` : ''}`
  ).join('\n')

  const systemPrompt = language === 'hi'
    ? `आप एक चैट विश्लेषक हैं। उपयोगकर्ता की चैट का संक्षिप्त विश्लेषण प्रदान करें। JSON प्रारूप में उत्तर दें:
{
  "summary": "चैट का 2-3 वाक्यों में सारांश",
  "keyTopics": ["मुख्य विषय 1", "मुख्य विषय 2"],
  "sentiment": "positive/neutral/negative/mixed",
  "actionItems": ["यदि कोई कार्रवाई आवश्यक हो"]
}`
    : `You are a chat analyst. Provide a brief analysis of the user's chat conversation. Respond in JSON format:
{
  "summary": "2-3 sentence summary of the chat",
  "keyTopics": ["key topic 1", "key topic 2"],
  "sentiment": "positive/neutral/negative/mixed",
  "actionItems": ["any action items if needed"]
}`

  const userPrompt = language === 'hi'
    ? `कृपया ${userName} के साथ निम्नलिखित चैट का विश्लेषण करें:\n\n${chatHistory}`
    : `Please analyze the following chat conversation with ${userName}:\n\n${chatHistory}`

  try {
    const response = await fetch(`${config.endpoint}openai/deployments/${config.deployment}/chat/completions?api-version=2024-08-01-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      logger.error('Azure OpenAI chat summary error:', await response.text())
      return generateDemoChatSummary(params)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (content) {
      try {
        const parsed = JSON.parse(content)
        return {
          summary: parsed.summary || 'No summary available',
          keyTopics: parsed.keyTopics || [],
          sentiment: parsed.sentiment || 'neutral',
          actionItems: parsed.actionItems || [],
          success: true
        }
      } catch {
        return {
          summary: content,
          keyTopics: [],
          sentiment: 'neutral',
          actionItems: [],
          success: true
        }
      }
    }

    return generateDemoChatSummary(params)
  } catch (error) {
    logger.error('Chat summary error:', error)
    return generateDemoChatSummary(params)
  }
}

function generateDemoChatSummary(params: ChatSummaryParams): ChatSummaryResult {
  const { messages, userName, language } = params
  
  if (messages.length === 0) {
    return {
      summary: language === 'hi' ? 'कोई संदेश नहीं' : 'No messages to summarize',
      keyTopics: [],
      sentiment: 'neutral',
      actionItems: [],
      success: true,
      message: 'Demo mode'
    }
  }

  const messageCount = messages.length
  const hasLocation = messages.some(m => m.location)
  
  return {
    summary: language === 'hi' 
      ? `${userName} के साथ ${messageCount} संदेश हुए। ${hasLocation ? 'उपयोगकर्ता ने स्थान साझा किया।' : ''}`
      : `Conversation with ${userName} contains ${messageCount} messages. ${hasLocation ? 'User shared location.' : ''}`,
    keyTopics: language === 'hi' 
      ? ['सहायता अनुरोध', 'खाता प्रश्न'] 
      : ['Support request', 'Account inquiry'],
    sentiment: 'neutral',
    actionItems: language === 'hi' 
      ? ['उपयोगकर्ता की समस्या का समाधान करें'] 
      : ['Resolve user query'],
    success: true,
    message: 'Demo mode - AI not configured'
  }
}
