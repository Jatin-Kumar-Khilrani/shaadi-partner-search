/**
 * Azure Face API Service
 * 
 * Uses Azure AI Vision Face API for face detection in selfies.
 * Ensures that:
 * - Exactly one human face is detected (not hands, objects, etc.)
 * - Face is centered in the frame
 * - Face covers sufficient area (80%+ recommended)
 */

// Azure Face API configuration
const AZURE_FACE_CONFIG = {
  // Azure Face API endpoint - Replace with your actual endpoint
  endpoint: 'https://shaadipartnerface.cognitiveservices.azure.com/',
  // API version
  apiVersion: '2024-02-01',
}

export interface FaceDetectionResult {
  success: boolean
  faceDetected: boolean
  faceCount: number
  coverage: number // 0-100
  isCentered: boolean
  isHumanFace: boolean
  errorMessage?: string
  faceRectangle?: {
    top: number
    left: number
    width: number
    height: number
  }
}

/**
 * Detect faces in an image using Azure Face API
 * @param imageData - Base64 encoded image data (data:image/jpeg;base64,...)
 * @returns FaceDetectionResult with detection details
 */
export async function detectFace(imageData: string): Promise<FaceDetectionResult> {
  try {
    // Extract base64 data from data URL
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const binaryData = atob(base64Data)
    const bytes = new Uint8Array(binaryData.length)
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i)
    }

    // Get API key from runtime config or environment
    const apiKey = await getFaceApiKey()
    
    if (!apiKey) {
      console.warn('Azure Face API key not available, using browser Face Detection API fallback')
      return await browserFaceDetection(imageData)
    }

    // Call Azure Face API
    const response = await fetch(
      `${AZURE_FACE_CONFIG.endpoint}face/v1.0/detect?returnFaceId=false&returnFaceLandmarks=true&returnFaceAttributes=headPose,occlusion,blur,exposure,noise&detectionModel=detection_03&recognitionModel=recognition_04`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': apiKey,
        },
        body: bytes.buffer,
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Azure Face API error:', errorText)
      // Fall back to browser detection
      return await browserFaceDetection(imageData)
    }

    const faces = await response.json()

    if (!faces || faces.length === 0) {
      return {
        success: true,
        faceDetected: false,
        faceCount: 0,
        coverage: 0,
        isCentered: false,
        isHumanFace: false,
        errorMessage: 'No face detected in the image',
      }
    }

    if (faces.length > 1) {
      return {
        success: true,
        faceDetected: true,
        faceCount: faces.length,
        coverage: 0,
        isCentered: false,
        isHumanFace: true,
        errorMessage: 'Multiple faces detected. Please ensure only your face is in the frame.',
      }
    }

    const face = faces[0]
    const faceRect = face.faceRectangle

    // Calculate image dimensions from base64
    const imgDimensions = await getImageDimensions(imageData)
    
    // Calculate face coverage percentage
    const faceArea = faceRect.width * faceRect.height
    const imageArea = imgDimensions.width * imgDimensions.height
    const coverage = Math.round((faceArea / imageArea) * 100)

    // Check if face is centered (within middle 60% of frame)
    const faceCenterX = faceRect.left + faceRect.width / 2
    const faceCenterY = faceRect.top + faceRect.height / 2
    const isCenteredX = faceCenterX > imgDimensions.width * 0.2 && faceCenterX < imgDimensions.width * 0.8
    const isCenteredY = faceCenterY > imgDimensions.height * 0.15 && faceCenterY < imgDimensions.height * 0.85
    const isCentered = isCenteredX && isCenteredY

    // Azure Face API only detects human faces, not hands/objects
    // So if we get a detection, it's a human face
    return {
      success: true,
      faceDetected: true,
      faceCount: 1,
      coverage,
      isCentered,
      isHumanFace: true,
      faceRectangle: faceRect,
    }
  } catch (error) {
    console.error('Face detection error:', error)
    // Fall back to browser detection
    return await browserFaceDetection(imageData)
  }
}

/**
 * Browser-based face detection fallback using Shape Detection API
 * This is a fallback when Azure Face API is not available
 */
async function browserFaceDetection(imageData: string): Promise<FaceDetectionResult> {
  return new Promise((resolve) => {
    // Check if browser supports FaceDetector
    if (!('FaceDetector' in window)) {
      resolve({
        success: false,
        faceDetected: false,
        faceCount: 0,
        coverage: 0,
        isCentered: false,
        isHumanFace: false,
        errorMessage: 'Face detection not available. Please use Chrome/Edge browser or ensure your face is clearly visible.',
      })
      return
    }

    const img = new Image()
    img.onload = async () => {
      try {
        // @ts-ignore - FaceDetector is a newer API
        const faceDetector = new window.FaceDetector({ fastMode: false, maxDetectedFaces: 5 })
        const faces = await faceDetector.detect(img)

        if (faces.length === 0) {
          resolve({
            success: true,
            faceDetected: false,
            faceCount: 0,
            coverage: 0,
            isCentered: false,
            isHumanFace: false,
            errorMessage: 'No face detected. Please ensure your face is clearly visible.',
          })
          return
        }

        if (faces.length > 1) {
          resolve({
            success: true,
            faceDetected: true,
            faceCount: faces.length,
            coverage: 0,
            isCentered: false,
            isHumanFace: true,
            errorMessage: 'Multiple faces detected. Please ensure only your face is in the frame.',
          })
          return
        }

        const face = faces[0].boundingBox
        const faceArea = face.width * face.height
        const imageArea = img.width * img.height
        const coverage = Math.round((faceArea / imageArea) * 100)

        const faceCenterX = face.x + face.width / 2
        const faceCenterY = face.y + face.height / 2
        const isCenteredX = faceCenterX > img.width * 0.2 && faceCenterX < img.width * 0.8
        const isCenteredY = faceCenterY > img.height * 0.15 && faceCenterY < img.height * 0.85
        const isCentered = isCenteredX && isCenteredY

        resolve({
          success: true,
          faceDetected: true,
          faceCount: 1,
          coverage,
          isCentered,
          isHumanFace: true, // Browser FaceDetector also detects human faces
          faceRectangle: {
            top: face.y,
            left: face.x,
            width: face.width,
            height: face.height,
          },
        })
      } catch (error) {
        console.error('Browser face detection error:', error)
        resolve({
          success: false,
          faceDetected: false,
          faceCount: 0,
          coverage: 0,
          isCentered: false,
          isHumanFace: false,
          errorMessage: 'Face detection failed. Please ensure your face is clearly visible.',
        })
      }
    }
    
    img.onerror = () => {
      resolve({
        success: false,
        faceDetected: false,
        faceCount: 0,
        coverage: 0,
        isCentered: false,
        isHumanFace: false,
        errorMessage: 'Failed to process image',
      })
    }
    
    img.src = imageData
  })
}

/**
 * Get image dimensions from base64 data
 */
async function getImageDimensions(imageData: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = () => {
      resolve({ width: 640, height: 480 }) // Default fallback
    }
    img.src = imageData
  })
}

/**
 * Get Azure Face API key from runtime config or Key Vault
 * In production, this should be fetched from Key Vault
 * For now, we check runtime config
 */
async function getFaceApiKey(): Promise<string | null> {
  try {
    // Try to get from runtime config
    const response = await fetch('/runtime.config.json')
    if (response.ok) {
      const config = await response.json()
      if (config.azureFaceApiKey) {
        return config.azureFaceApiKey
      }
    }
  } catch {
    // Config not available
  }
  
  // For demo/development, return null to use browser fallback
  return null
}

/**
 * Validate selfie for registration
 * Comprehensive check for face detection, coverage, and centering
 */
export async function validateSelfie(imageData: string, language: 'hi' | 'en'): Promise<{
  valid: boolean
  coverage: number
  message: string
}> {
  const result = await detectFace(imageData)

  if (!result.success) {
    return {
      valid: false,
      coverage: 0,
      message: result.errorMessage || (language === 'hi' 
        ? 'चेहरा पहचान विफल। कृपया पुनः प्रयास करें।'
        : 'Face detection failed. Please try again.'),
    }
  }

  if (!result.faceDetected) {
    return {
      valid: false,
      coverage: 0,
      message: language === 'hi' 
        ? 'कोई चेहरा नहीं पाया गया। कृपया अपना चेहरा कैमरे के सामने रखें।'
        : 'No face detected. Please position your face in front of the camera.',
    }
  }

  if (result.faceCount > 1) {
    return {
      valid: false,
      coverage: 0,
      message: language === 'hi' 
        ? 'एक से अधिक चेहरे पाए गए। कृपया केवल अपना चेहरा फ्रेम में रखें।'
        : 'Multiple faces detected. Please ensure only your face is in the frame.',
    }
  }

  if (!result.isCentered) {
    return {
      valid: false,
      coverage: result.coverage,
      message: language === 'hi' 
        ? 'कृपया अपना चेहरा फ्रेम के केंद्र में रखें।'
        : 'Please center your face in the frame.',
    }
  }

  if (result.coverage < 80) {
    return {
      valid: false,
      coverage: result.coverage,
      message: language === 'hi' 
        ? `चेहरा ${result.coverage}% है। कृपया कैमरे के करीब आएं (80% आवश्यक है)।`
        : `Face covers ${result.coverage}% of frame. Please move closer to camera (80% required).`,
    }
  }

  return {
    valid: true,
    coverage: result.coverage,
    message: language === 'hi' 
      ? `चेहरा सत्यापित! ${result.coverage}% कवरेज ✓`
      : `Face verified! ${result.coverage}% coverage ✓`,
  }
}
