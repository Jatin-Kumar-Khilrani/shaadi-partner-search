/**
 * Azure AI Face Verification Utility
 * Uses Azure AI Foundry Face API to verify if selfie matches uploaded photos
 */

// Azure Face API endpoint - replace with your actual endpoint
const FACE_API_ENDPOINT = 'https://shaadipartnerface.cognitiveservices.azure.com'
const FACE_API_KEY = '' // In production, use Azure Key Vault

export interface FaceVerificationResult {
  isMatch: boolean
  confidence: number
  message: string
  details?: {
    faceDetectedInSelfie: boolean
    faceDetectedInPhoto: boolean
    similarityScore: number
  }
}

/**
 * Convert base64 image to Blob
 */
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,')
  const contentType = parts[0].split(':')[1]
  const raw = window.atob(parts[1])
  const rawLength = raw.length
  const uInt8Array = new Uint8Array(rawLength)
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i)
  }
  return new Blob([uInt8Array], { type: contentType })
}

/**
 * Detect face in an image and get face ID
 */
async function detectFace(imageBase64: string, apiKey: string): Promise<string | null> {
  try {
    const blob = base64ToBlob(imageBase64)
    
    const response = await fetch(`${FACE_API_ENDPOINT}/face/v1.0/detect?returnFaceId=true&recognitionModel=recognition_04&detectionModel=detection_03`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: blob
    })

    if (!response.ok) {
      console.error('Face detection failed:', await response.text())
      return null
    }

    const faces = await response.json()
    if (faces && faces.length > 0) {
      return faces[0].faceId
    }
    return null
  } catch (error) {
    console.error('Error detecting face:', error)
    return null
  }
}

/**
 * Verify if two faces match
 */
async function verifyFaces(faceId1: string, faceId2: string, apiKey: string): Promise<{ isIdentical: boolean; confidence: number } | null> {
  try {
    const response = await fetch(`${FACE_API_ENDPOINT}/face/v1.0/verify`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        faceId1,
        faceId2
      })
    })

    if (!response.ok) {
      console.error('Face verification failed:', await response.text())
      return null
    }

    const result = await response.json()
    return {
      isIdentical: result.isIdentical,
      confidence: result.confidence
    }
  } catch (error) {
    console.error('Error verifying faces:', error)
    return null
  }
}

/**
 * Main function to verify selfie against uploaded photos
 * @param selfieBase64 - Base64 encoded selfie image
 * @param photosBase64 - Array of base64 encoded profile photos
 * @param apiKey - Azure Face API key (optional, uses default if not provided)
 * @returns Verification result
 */
export async function verifyFaceIdentity(
  selfieBase64: string,
  photosBase64: string[],
  apiKey?: string
): Promise<FaceVerificationResult> {
  const key = apiKey || FACE_API_KEY

  if (!key) {
    // Demo mode - simulate verification
    return simulateVerification()
  }

  try {
    // Detect face in selfie
    const selfieFaceId = await detectFace(selfieBase64, key)
    if (!selfieFaceId) {
      return {
        isMatch: false,
        confidence: 0,
        message: 'No face detected in selfie',
        details: {
          faceDetectedInSelfie: false,
          faceDetectedInPhoto: false,
          similarityScore: 0
        }
      }
    }

    // Try to match with each photo
    let bestMatch = {
      isIdentical: false,
      confidence: 0
    }

    for (const photo of photosBase64) {
      const photoFaceId = await detectFace(photo, key)
      if (!photoFaceId) continue

      const result = await verifyFaces(selfieFaceId, photoFaceId, key)
      if (result && result.confidence > bestMatch.confidence) {
        bestMatch = result
      }
    }

    if (bestMatch.confidence === 0) {
      return {
        isMatch: false,
        confidence: 0,
        message: 'No face detected in any uploaded photos',
        details: {
          faceDetectedInSelfie: true,
          faceDetectedInPhoto: false,
          similarityScore: 0
        }
      }
    }

    const threshold = 0.6 // 60% confidence threshold
    return {
      isMatch: bestMatch.confidence >= threshold,
      confidence: Math.round(bestMatch.confidence * 100),
      message: bestMatch.confidence >= threshold
        ? `Face verified! ${Math.round(bestMatch.confidence * 100)}% match confidence.`
        : `Face mismatch. Only ${Math.round(bestMatch.confidence * 100)}% similarity detected.`,
      details: {
        faceDetectedInSelfie: true,
        faceDetectedInPhoto: true,
        similarityScore: bestMatch.confidence
      }
    }
  } catch (error) {
    console.error('Face verification error:', error)
    return {
      isMatch: false,
      confidence: 0,
      message: 'Face verification service unavailable'
    }
  }
}

/**
 * Simulate verification for demo purposes
 */
function simulateVerification(): FaceVerificationResult {
  // Simulate a verification delay
  const randomConfidence = 75 + Math.random() * 20 // 75-95%
  const isMatch = randomConfidence > 80

  return {
    isMatch,
    confidence: Math.round(randomConfidence),
    message: isMatch
      ? `✓ Face verified (Demo Mode) - ${Math.round(randomConfidence)}% match confidence`
      : `⚠ Face mismatch detected (Demo Mode) - Only ${Math.round(randomConfidence)}% similarity`,
    details: {
      faceDetectedInSelfie: true,
      faceDetectedInPhoto: true,
      similarityScore: randomConfidence / 100
    }
  }
}
