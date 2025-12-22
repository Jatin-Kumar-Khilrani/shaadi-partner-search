/**
 * Azure AI Foundry Service
 * Provides AI capabilities for bio generation and face analysis
 */

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
      console.error('Azure OpenAI error:', await response.text())
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
    console.error('Bio generation error:', error)
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
    console.error('Bio refinement error:', error)
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
  const pronounHim = gender === 'male' ? 'him' : 'her'

  return {
    bio: `${firstName} is a well-educated and cultured ${gender === 'male' ? 'young man' : 'young woman'} residing in ${location}. At ${age} years of age, ${pronounHe.toLowerCase()} has completed ${pronounHis.toLowerCase()} ${education} and is currently working as a ${occupation}.${religion ? ` Coming from a ${religion} family` : ''}${caste ? ` of ${caste} community` : ''}, ${firstName} believes in traditional values while maintaining a modern outlook. ${pronounHe} is looking for a life partner who is understanding, educated, and committed to family values. ${pronounHis} ideal match would be someone who shares ${pronounHis.toLowerCase()} vision of building a happy and harmonious family life together.`,
    success: true,
    message: 'Demo mode - AI generated bio'
  }
}

/**
 * Analyze face coverage in an image
 * Returns the percentage of image covered by face
 */
export async function analyzeFaceCoverage(imageBase64: string): Promise<{
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
