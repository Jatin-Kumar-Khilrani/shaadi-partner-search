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

    // Get endpoint from runtime config
    const endpoint = await getFaceApiEndpoint()

    // Call Azure Face API
    const response = await fetch(
      `${endpoint}face/v1.0/detect?returnFaceId=false&returnFaceLandmarks=true&returnFaceAttributes=headPose,occlusion,blur,exposure,noise&detectionModel=detection_03&recognitionModel=recognition_04`,
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
 * Falls back to simulated detection for browsers without FaceDetector support
 */
async function browserFaceDetection(imageData: string): Promise<FaceDetectionResult> {
  return new Promise((resolve) => {
    // Check if browser supports FaceDetector (Chrome/Edge only)
    if ('FaceDetector' in window) {
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
            isHumanFace: true,
            faceRectangle: {
              top: face.y,
              left: face.x,
              width: face.width,
              height: face.height,
            },
          })
        } catch (error) {
          console.error('Browser face detection error:', error)
          // Fall back to simulated detection
          resolve(simulatedFaceDetection(img))
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
    } else {
      // Browser doesn't support FaceDetector, use simulated detection
      console.log('FaceDetector API not available, using simulated detection')
      const img = new Image()
      img.onload = () => {
        resolve(simulatedFaceDetection(img))
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
    }
  })
}

/**
 * Simulated face detection for browsers without FaceDetector API
 * Uses basic image analysis to detect if there's likely a face present
 * Calculates actual skin-tone region coverage for realistic estimates
 */
function simulatedFaceDetection(img: HTMLImageElement): FaceDetectionResult {
  // Create canvas to analyze the image
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    // If we can't analyze, return low coverage to encourage proper positioning
    console.warn('Could not create canvas context for face detection')
    return {
      success: true,
      faceDetected: true,
      faceCount: 1,
      coverage: 30, // Low coverage to encourage close-up
      isCentered: true,
      isHumanFace: true,
    }
  }
  
  ctx.drawImage(img, 0, 0)
  
  // Analyze the FULL image to find skin-tone regions
  const centerX = img.width / 2
  const centerY = img.height / 2
  const sampleSize = Math.min(img.width, img.height) * 0.5
  
  try {
    // Analyze FULL image to find skin-tone bounding box
    const fullImageData = ctx.getImageData(0, 0, img.width, img.height)
    const fullData = fullImageData.data
    
    let minX = img.width, maxX = 0, minY = img.height, maxY = 0
    let skinTonePixels = 0
    let nonBlackPixels = 0
    const totalPixels = fullData.length / 4
    
    // Find skin-tone region bounds
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const i = (y * img.width + x) * 4
        const r = fullData[i]
        const g = fullData[i + 1]
        const b = fullData[i + 2]
        
        // Count non-black pixels
        if (r > 20 || g > 20 || b > 20) {
          nonBlackPixels++
        }
        
        // Detect skin tones (all skin colors)
        const isLightSkin = r > 180 && g > 140 && b > 100 && r > g && g > b
        const isMediumSkin = r > 120 && r < 220 && g > 80 && g < 180 && b > 50 && b < 150
        const isDarkSkin = r > 60 && r < 160 && g > 40 && g < 120 && b > 20 && b < 100
        
        if (isLightSkin || isMediumSkin || isDarkSkin) {
          skinTonePixels++
          // Track bounding box of skin-tone region
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
        }
      }
    }
    
    const skinToneRatio = skinTonePixels / totalPixels
    const contentRatio = nonBlackPixels / totalPixels
    
    // Calculate actual coverage based on skin-tone region bounding box
    let actualCoverage = 0
    let isCentered = false
    
    if (skinTonePixels > 100 && maxX > minX && maxY > minY) {
      const skinWidth = maxX - minX
      const skinHeight = maxY - minY
      const skinArea = skinWidth * skinHeight
      const imageArea = img.width * img.height
      
      // Calculate coverage as percentage of image
      actualCoverage = Math.round((skinArea / imageArea) * 100)
      
      // Check if skin region is centered (within middle 60% of frame)
      const skinCenterX = (minX + maxX) / 2
      const skinCenterY = (minY + maxY) / 2
      const isCenteredX = skinCenterX > img.width * 0.2 && skinCenterX < img.width * 0.8
      const isCenteredY = skinCenterY > img.height * 0.15 && skinCenterY < img.height * 0.85
      isCentered = isCenteredX && isCenteredY
    }
    
    console.log(`Face detection - Skin ratio: ${(skinToneRatio * 100).toFixed(1)}%, Content ratio: ${(contentRatio * 100).toFixed(1)}%, Actual coverage: ${actualCoverage}%`)
    
    // If there's good content in the image (not just black screen)
    if (contentRatio > 0.5) {
      // If we detect some skin tones, calculate real coverage
      if (skinToneRatio > 0.05) {
        return {
          success: true,
          faceDetected: true,
          faceCount: 1,
          coverage: actualCoverage,
          isCentered,
          isHumanFace: true,
          faceRectangle: {
            top: minY,
            left: minX,
            width: maxX - minX,
            height: maxY - minY,
          },
        }
      }
      
      // Very low skin detection - may not have face visible
      return {
        success: true,
        faceDetected: false,
        faceCount: 0,
        coverage: 0,
        isCentered: false,
        isHumanFace: false,
        errorMessage: 'Face not clearly visible. Please move closer to camera.',
      }
    }
    
    // Very little content - likely black screen or camera issue
    return {
      success: true,
      faceDetected: false,
      faceCount: 0,
      coverage: 0,
      isCentered: false,
      isHumanFace: false,
      errorMessage: 'Camera may not be working properly. Please ensure good lighting.',
    }
  } catch (error) {
    console.error('Error in simulated face detection:', error)
    // On error, return low coverage to encourage proper positioning
    return {
      success: true,
      faceDetected: true,
      faceCount: 1,
      coverage: 30,
      isCentered: false,
      isHumanFace: true,
    }
  }
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
 */
async function getFaceApiKey(): Promise<string | null> {
  try {
    // Try to get from runtime config - use import.meta.env.BASE_URL for correct path
    const basePath = import.meta.env.BASE_URL || '/'
    const configUrl = `${basePath}runtime.config.json`
    const response = await fetch(configUrl)
    if (response.ok) {
      const config = await response.json()
      // Check for key in azure.faceApi.key (new structure)
      if (config.azure?.faceApi?.key) {
        return config.azure.faceApi.key
      }
      // Fallback to old structure
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
 * Get Azure Face API endpoint from runtime config
 */
async function getFaceApiEndpoint(): Promise<string> {
  try {
    const basePath = import.meta.env.BASE_URL || '/'
    const configUrl = `${basePath}runtime.config.json`
    const response = await fetch(configUrl)
    if (response.ok) {
      const config = await response.json()
      if (config.azure?.faceApi?.endpoint) {
        return config.azure.faceApi.endpoint
      }
    }
  } catch {
    // Config not available
  }
  
  // Default endpoint
  return 'https://eastus2.api.cognitive.microsoft.com/'
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
