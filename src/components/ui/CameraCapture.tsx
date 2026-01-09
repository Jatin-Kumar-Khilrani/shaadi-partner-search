import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Camera, X, ArrowsClockwise, CheckCircle, SpinnerGap, Image } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface CameraCaptureProps {
  open: boolean
  onClose: () => void
  onCapture: (imageDataUrl: string) => void
  language: 'en' | 'hi'
  title?: string
  description?: string
  preferBackCamera?: boolean // For document capture, prefer back camera
  multiple?: boolean // Allow capturing multiple photos
  maxPhotos?: number // Maximum number of photos when multiple is true
  existingPhotosCount?: number // Current count when multiple is true
}

export function CameraCapture({
  open,
  onClose,
  onCapture,
  language,
  title,
  description,
  preferBackCamera = false,
  multiple = false,
  maxPhotos = 5,
  existingPhotosCount = 0
}: CameraCaptureProps) {
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const t = {
    title: title || (language === 'hi' ? 'कैमरा से कैप्चर करें' : 'Capture from Camera'),
    description: description || (language === 'hi' ? 'अपने डिवाइस के कैमरे से फोटो लें' : 'Take a photo using your device camera'),
    capture: language === 'hi' ? 'फोटो लें' : 'Capture',
    retake: language === 'hi' ? 'दोबारा लें' : 'Retake',
    usePhoto: language === 'hi' ? 'इस फोटो का उपयोग करें' : 'Use this photo',
    done: language === 'hi' ? 'पूर्ण' : 'Done',
    switchCamera: language === 'hi' ? 'कैमरा बदलें' : 'Switch Camera',
    selectCamera: language === 'hi' ? 'कैमरा चुनें' : 'Select Camera',
    cameraError: language === 'hi' ? 'कैमरा एक्सेस करने में त्रुटि। कृपया अनुमति दें।' : 'Error accessing camera. Please grant permission.',
    noCameraFound: language === 'hi' ? 'कोई कैमरा नहीं मिला' : 'No camera found',
    captureMore: language === 'hi' ? 'और कैप्चर करें' : 'Capture More',
    photosRemaining: language === 'hi' ? 'शेष फोटो' : 'photos remaining',
    frontCamera: language === 'hi' ? 'फ्रंट कैमरा' : 'Front Camera',
    backCamera: language === 'hi' ? 'बैक कैमरा' : 'Back Camera',
    camera: language === 'hi' ? 'कैमरा' : 'Camera',
    loading: language === 'hi' ? 'कैमरा लोड हो रहा है...' : 'Loading camera...',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    uploadInstead: language === 'hi' ? 'फाइल से अपलोड करें' : 'Upload from file instead',
  }

  const remainingPhotos = maxPhotos - existingPhotosCount - capturedImages.length

  const startCamera = async (deviceId?: string) => {
    try {
      setError(null)
      setIsCameraReady(false)
      
      // First enumerate available cameras
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setAvailableCameras(videoDevices)
      
      if (videoDevices.length === 0) {
        setError(t.noCameraFound)
        return
      }
      
      // Determine which camera to use
      let cameraId = deviceId || selectedCameraId
      if (!cameraId && videoDevices.length > 0) {
        if (preferBackCamera) {
          // Try to find back/rear camera for documents
          const backCamera = videoDevices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          )
          cameraId = backCamera?.deviceId || videoDevices[0].deviceId
        } else {
          // Try to find front/user camera for selfie
          const frontCamera = videoDevices.find(d => 
            d.label.toLowerCase().includes('front') || 
            d.label.toLowerCase().includes('user') ||
            d.label.toLowerCase().includes('face')
          )
          cameraId = frontCamera?.deviceId || videoDevices[0].deviceId
        }
        setSelectedCameraId(cameraId)
      }
      
      // Build constraints
      const videoConstraints: MediaTrackConstraints = cameraId 
        ? { deviceId: { exact: cameraId } }
        : { facingMode: preferBackCamera ? 'environment' : 'user' }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          ...videoConstraints,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false 
      })
      
      streamRef.current = stream
      
      // Assign stream to video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            setIsCameraReady(true)
          }
        }
      }, 100)
    } catch (err) {
      console.error('Camera error:', err)
      setError(t.cameraError)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraReady(false)
  }

  const switchCamera = async (deviceId: string) => {
    setSelectedCameraId(deviceId)
    stopCamera()
    await startCamera(deviceId)
  }

  const capturePhoto = async () => {
    if (isCapturing || !videoRef.current || !canvasRef.current) return
    
    setIsCapturing(true)
    
    const canvas = canvasRef.current
    const video = videoRef.current
    
    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // For front camera, mirror the image
      const isFrontCamera = !preferBackCamera && (
        availableCameras.find(c => c.deviceId === selectedCameraId)?.label.toLowerCase().includes('front') ||
        availableCameras.find(c => c.deviceId === selectedCameraId)?.label.toLowerCase().includes('user')
      )
      
      if (isFrontCamera) {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
      
      if (multiple) {
        setCapturedImages(prev => [...prev, imageDataUrl])
      } else {
        onCapture(imageDataUrl)
        handleClose()
      }
    }
    
    setIsCapturing(false)
  }

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleDone = () => {
    capturedImages.forEach(img => onCapture(img))
    handleClose()
  }

  const handleClose = () => {
    stopCamera()
    setCapturedImages([])
    setError(null)
    onClose()
  }

  // Start camera when dialog opens
  useEffect(() => {
    if (open) {
      startCamera()
    } else {
      stopCamera()
    }
    
    return () => {
      stopCamera()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const getCameraLabel = (device: MediaDeviceInfo) => {
    const label = device.label.toLowerCase()
    if (label.includes('front') || label.includes('user') || label.includes('face')) {
      return t.frontCamera
    }
    if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
      return t.backCamera
    }
    return device.label || `${t.camera} ${availableCameras.indexOf(device) + 1}`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera size={24} weight="fill" />
            {t.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Camera Selection */}
          {availableCameras.length > 1 && (
            <div className="flex items-center gap-2">
              <ArrowsClockwise size={18} className="text-muted-foreground" />
              <Select value={selectedCameraId} onValueChange={switchCamera}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t.selectCamera} />
                </SelectTrigger>
                <SelectContent>
                  {availableCameras.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {getCameraLabel(device)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => startCamera()}
                className="mt-2"
              >
                {language === 'hi' ? 'पुनः प्रयास करें' : 'Try Again'}
              </Button>
            </div>
          )}
          
          {/* Camera Preview */}
          {!error && (
            <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
              {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <SpinnerGap size={32} className="animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t.loading}</p>
                  </div>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!preferBackCamera ? 'scale-x-[-1]' : ''}`}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
          
          {/* Captured Images Preview (Multiple Mode) */}
          {multiple && capturedImages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <CheckCircle size={16} weight="fill" className="text-green-600" />
                {language === 'hi' ? `${capturedImages.length} फोटो कैप्चर किए गए` : `${capturedImages.length} photo(s) captured`}
              </p>
              <div className="flex flex-wrap gap-2">
                {capturedImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={img} 
                      alt={`Captured ${index + 1}`} 
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full"
                      onClick={() => removeImage(index)}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ))}
              </div>
              {remainingPhotos > 0 && (
                <p className="text-xs text-muted-foreground">
                  {remainingPhotos} {t.photosRemaining}
                </p>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              {t.cancel}
            </Button>
            
            {multiple && capturedImages.length > 0 ? (
              <>
                {remainingPhotos > 0 && (
                  <Button 
                    onClick={capturePhoto} 
                    disabled={!isCameraReady || isCapturing}
                    className="flex-1 gap-2"
                  >
                    {isCapturing ? (
                      <SpinnerGap size={18} className="animate-spin" />
                    ) : (
                      <Camera size={18} weight="fill" />
                    )}
                    {t.captureMore}
                  </Button>
                )}
                <Button 
                  onClick={handleDone}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle size={18} weight="fill" />
                  {t.done}
                </Button>
              </>
            ) : (
              <Button 
                onClick={capturePhoto} 
                disabled={!isCameraReady || isCapturing || (multiple && remainingPhotos <= 0)}
                className="flex-1 gap-2 bg-primary"
              >
                {isCapturing ? (
                  <SpinnerGap size={18} className="animate-spin" />
                ) : (
                  <Camera size={18} weight="fill" />
                )}
                {t.capture}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
