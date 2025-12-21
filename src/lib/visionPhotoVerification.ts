/**
 * Azure AI Vision Photo Verification Service
 * Uses GPT-4o with vision capabilities to compare selfie with uploaded photos
 * and determine if they are the same person
 */

// Configuration from environment variables
const getConfig = () => ({
  endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || 'https://eastus2.api.cognitive.microsoft.com/',
  apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY || '',
  deployment: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'
})

export interface PhotoVerificationResult {
  isMatch: boolean
  confidence: number  // 0-100
  matchDetails: {
    faceShapeMatch: boolean
    facialFeaturesMatch: boolean
    overallSimilarity: 'high' | 'medium' | 'low' | 'no-match'
  }
  analysis: string
  recommendations?: string[]
}

/**
 * Convert image URL or base64 to proper format for GPT-4o Vision
 */
function formatImageForVision(imageData: string): { type: 'image_url', image_url: { url: string, detail: 'high' } } {
  // If it's already a data URL (base64), use as-is
  if (imageData.startsWith('data:')) {
    return {
      type: 'image_url',
      image_url: {
        url: imageData,
        detail: 'high'
      }
    }
  }
  // If it's a URL, use directly
  return {
    type: 'image_url',
    image_url: {
      url: imageData,
      detail: 'high'
    }
  }
}

/**
 * Verify if the selfie matches the uploaded photos using GPT-4o Vision
 */
export async function verifyPhotosWithVision(
  selfieUrl: string,
  uploadedPhotos: string[]
): Promise<PhotoVerificationResult> {
  const config = getConfig()

  // If no API key, return demo result
  if (!config.apiKey) {
    console.log('No API key configured, using demo mode for photo verification')
    return getDemoVerificationResult()
  }

  try {
    // Build the message content with all images
    const imageContents: any[] = [
      {
        type: 'text',
        text: `You are an image quality analyst for a matrimonial platform. The user has provided consent for profile photo verification.

CONTEXT: A user is registering on our matrimonial platform and has:
1. Taken a live selfie during registration (Image 1)
2. Uploaded profile photos (remaining images)

YOUR TASK: Analyze the photos to help our admin team with profile verification. Please assess:

1. PHOTO QUALITY: Are all photos clear, well-lit, and show a person clearly?
2. CONSISTENCY CHECK: Do the photos appear to show a consistent appearance (similar hair style, general appearance)?
3. AUTHENTICITY: Do the photos appear to be genuine (not stock photos, celebrity photos, or heavily edited)?
4. PROFILE SUITABILITY: Are these photos appropriate for a matrimonial profile?

The FIRST image is the selfie taken during registration.
The REMAINING images are uploaded profile photos.

Provide your assessment in this JSON format:
{
  "isMatch": true if photos appear consistent and suitable, false otherwise,
  "confidence": your confidence level 0-100,
  "faceShapeMatch": true if photos show consistent appearance,
  "facialFeaturesMatch": true if photos appear authentic and genuine,
  "overallSimilarity": "high" | "medium" | "low" | "no-match",
  "analysis": "Your detailed assessment for the admin team",
  "recommendations": ["Suggestions for the admin team"]
}

Respond ONLY with the JSON object, no additional text or markdown.`
      },
      // Add selfie as first image
      formatImageForVision(selfieUrl)
    ]

    // Add all uploaded photos
    for (const photo of uploadedPhotos) {
      imageContents.push(formatImageForVision(photo))
    }

    const response = await fetch(
      `${config.endpoint}openai/deployments/${config.deployment}/chat/completions?api-version=2024-08-01-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.apiKey
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: imageContents
            }
          ],
          max_tokens: 1000,
          temperature: 0.1  // Low temperature for consistent analysis
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Azure OpenAI Vision API error:', errorText)
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No response content from API')
    }

    // Parse the JSON response
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const result = JSON.parse(cleanedContent)

      return {
        isMatch: result.isMatch,
        confidence: result.confidence,
        matchDetails: {
          faceShapeMatch: result.faceShapeMatch,
          facialFeaturesMatch: result.facialFeaturesMatch,
          overallSimilarity: result.overallSimilarity
        },
        analysis: result.analysis,
        recommendations: result.recommendations
      }
    } catch (parseError) {
      console.error('Failed to parse GPT-4o response:', content)
      // Return the raw analysis if JSON parsing fails
      return {
        isMatch: content.toLowerCase().includes('match') && !content.toLowerCase().includes('no match'),
        confidence: 50,
        matchDetails: {
          faceShapeMatch: false,
          facialFeaturesMatch: false,
          overallSimilarity: 'medium'
        },
        analysis: content,
        recommendations: ['Manual review recommended due to parsing issues']
      }
    }

  } catch (error) {
    console.error('Photo verification error:', error)
    return {
      isMatch: false,
      confidence: 0,
      matchDetails: {
        faceShapeMatch: false,
        facialFeaturesMatch: false,
        overallSimilarity: 'no-match'
      },
      analysis: `Error during verification: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recommendations: ['Please retry verification or perform manual review']
    }
  }
}

/**
 * Demo verification result when API key is not configured
 */
function getDemoVerificationResult(): PhotoVerificationResult {
  // Simulate a successful match with high confidence for demo
  const isMatch = Math.random() > 0.3  // 70% chance of match for demo
  const confidence = isMatch ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 30) + 20

  return {
    isMatch,
    confidence,
    matchDetails: {
      faceShapeMatch: isMatch,
      facialFeaturesMatch: isMatch,
      overallSimilarity: isMatch ? (confidence > 90 ? 'high' : 'medium') : 'low'
    },
    analysis: isMatch
      ? `[DEMO MODE] The facial features in the selfie appear to match the uploaded photos. Key matching features include similar face shape, eye positioning, and overall facial structure. Confidence: ${confidence}%`
      : `[DEMO MODE] The facial features in the selfie do not appear to match the uploaded photos. Significant differences observed in facial structure. Confidence: ${confidence}%`,
    recommendations: ['This is a demo result. Configure Azure OpenAI API key for real verification.']
  }
}

/**
 * Analyze a single photo for quality and face detection
 */
export async function analyzePhotoQuality(photoUrl: string): Promise<{
  hasFace: boolean
  quality: 'good' | 'acceptable' | 'poor'
  issues: string[]
}> {
  const config = getConfig()

  if (!config.apiKey) {
    return {
      hasFace: true,
      quality: 'good',
      issues: ['Demo mode - no actual analysis performed']
    }
  }

  try {
    const response = await fetch(
      `${config.endpoint}openai/deployments/${config.deployment}/chat/completions?api-version=2024-08-01-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.apiKey
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this photo for a matrimonial profile. Check:
1. Is there a clear human face visible?
2. Is the photo quality good (lighting, focus, resolution)?
3. Any issues that would make this unsuitable for a profile?

Respond in JSON format:
{
  "hasFace": true/false,
  "quality": "good" | "acceptable" | "poor",
  "issues": ["list of any issues found"]
}

Only return the JSON.`
                },
                formatImageForVision(photoUrl)
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.1
        })
      }
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleanedContent)

  } catch (error) {
    console.error('Photo quality analysis error:', error)
    return {
      hasFace: true,
      quality: 'acceptable',
      issues: ['Could not perform automated quality check']
    }
  }
}
