import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DatePicker } from '@/components/ui/date-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { UserPlus, CheckCircle, Info, CurrencyInr, Camera, Image, X, ArrowUp, ArrowDown, FloppyDisk, Sparkle, Warning, SpinnerGap, Gift, ShieldCheck, IdentificationCard, ArrowCounterClockwise, Upload } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Gender, MaritalStatus, Profile, MembershipPlan } from '@/types/profile'
import { useTranslation, type Language } from '@/lib/translations'
import { generateBio, type BioGenerationParams } from '@/lib/aiFoundryService'
import { PhotoLightbox, useLightbox } from '@/components/PhotoLightbox'
import { TermsAndConditions } from '@/components/TermsAndConditions'
import { uploadPhoto, isBlobStorageAvailable, dataUrlToFile } from '@/lib/blobService'

// Country code to phone length mapping
const COUNTRY_PHONE_LENGTHS: Record<string, { min: number; max: number; display: string }> = {
  '+91': { min: 10, max: 10, display: '10' },      // India
  '+1': { min: 10, max: 10, display: '10' },       // USA/Canada
  '+44': { min: 10, max: 10, display: '10' },      // UK
  '+971': { min: 9, max: 9, display: '9' },        // UAE
  '+65': { min: 8, max: 8, display: '8' },         // Singapore
  '+61': { min: 9, max: 9, display: '9' },         // Australia
  '+49': { min: 10, max: 11, display: '10-11' },   // Germany
  '+33': { min: 9, max: 9, display: '9' },         // France
  '+81': { min: 10, max: 10, display: '10' },      // Japan
  '+86': { min: 11, max: 11, display: '11' },      // China
}

// Helper function to get phone length for a country code
const getPhoneLengthInfo = (countryCode: string) => {
  return COUNTRY_PHONE_LENGTHS[countryCode] || { min: 7, max: 15, display: '7-15' }
}

// Helper function to validate phone number length
const isValidPhoneLength = (phone: string, countryCode: string): boolean => {
  const lengthInfo = getPhoneLengthInfo(countryCode)
  return phone.length >= lengthInfo.min && phone.length <= lengthInfo.max
}

interface MembershipSettings {
  sixMonthPrice: number
  oneYearPrice: number
  sixMonthDuration: number
  oneYearDuration: number
  discountPercentage: number
  discountEnabled: boolean
  discountEndDate: string | null
  // Plan-specific limits
  freePlanChatLimit: number
  freePlanContactLimit: number
  sixMonthChatLimit: number
  sixMonthContactLimit: number
  oneYearChatLimit: number
  oneYearContactLimit: number
  // Payment details
  upiId: string
  bankName: string
  accountNumber: string
  ifscCode: string
  accountHolderName: string
  qrCodeImage: string
}

interface RegistrationDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (profile: Partial<Profile>) => void
  language: Language
  existingProfiles?: Profile[]
  editProfile?: Profile | null
  membershipSettings?: MembershipSettings
}

export function RegistrationDialog({ open, onClose, onSubmit, language, existingProfiles = [], editProfile = null, membershipSettings }: RegistrationDialogProps) {
  const t = useTranslation(language)
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | undefined>(undefined)
  const [idProofFile, setIdProofFile] = useState<File | null>(null)
  const [idProofPreview, setIdProofPreview] = useState<string | null>(null)
  const [idProofType, setIdProofType] = useState<'aadhaar' | 'pan' | 'driving-license' | 'passport' | 'voter-id'>('aadhaar')
  const [showCamera, setShowCamera] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [faceCoverageValid, setFaceCoverageValid] = useState(false)
  const [faceCoveragePercent, setFaceCoveragePercent] = useState(0)
  const [selfieZoom, setSelfieZoom] = useState(1) // Zoom level for selfie (1 = 100%)
  const [liveZoom, setLiveZoom] = useState(1) // Live zoom for camera preview
  const [isGeneratingBio, setIsGeneratingBio] = useState(false)
  const [registrationGeoLocation, setRegistrationGeoLocation] = useState<{
    latitude: number
    longitude: number
    accuracy: number
    city?: string
    region?: string
    country?: string
    capturedAt: string
  } | null>(null)
  const { lightboxState, openLightbox, closeLightbox } = useLightbox()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [emailOtp, setEmailOtp] = useState('')
  const [mobileOtp, setMobileOtp] = useState('')
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState('')
  const [generatedMobileOtp, setGeneratedMobileOtp] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [mobileVerified, setMobileVerified] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  
  // Payment screenshot state for paid plans
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null)
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<string | null>(null)
  
  // DigiLocker verification state (OAuth flow - no Aadhaar number input)
  const [digilockerVerifying, setDigilockerVerifying] = useState(false)
  const [digilockerVerified, setDigilockerVerified] = useState(false)
  const [digilockerData, setDigilockerData] = useState<{
    name: string
    dob: string
    gender: 'male' | 'female'
    verifiedAt: string
    digilockerID: string
    aadhaarLastFour?: string
  } | null>(null)
  
  const [formData, setFormData] = useState({
    fullName: '',
    profileCreatedFor: undefined as 'Self' | 'Daughter' | 'Son' | 'Brother' | 'Sister' | 'Other' | undefined,
    otherRelation: '',
    dateOfBirth: '',
    birthTime: '',
    birthPlace: '',
    horoscopeMatching: 'not-mandatory' as 'mandatory' | 'not-mandatory' | 'decide-later',
    diet: '' as '' | 'veg' | 'non-veg' | 'occasionally-non-veg' | 'jain' | 'vegan',
    habit: '' as '' | 'none' | 'smoking' | 'drinking' | 'occasionally-drinking' | 'occasionally-smoking',
    annualIncome: '' as string,
    profession: '' as string,
    position: '' as string,
    gender: undefined as Gender | undefined,
    religion: '',
    caste: '',
    motherTongue: '',
    education: '',
    occupation: '',
    location: '',
    state: '',
    country: 'India',
    residentialStatus: '' as string,
    maritalStatus: undefined as MaritalStatus | undefined,
    email: '',
    countryCode: '+91',
    mobile: '',
    height: '',
    weight: '',
    bio: '',
    familyDetails: '',
    membershipPlan: undefined as MembershipPlan | undefined
  })

  const STORAGE_KEY = 'registration_draft'
  const isEditMode = !!editProfile

  // Load edit profile data when in edit mode
  useEffect(() => {
    if (editProfile && open) {
      // Parse mobile to extract country code and number
      const mobileMatch = editProfile.mobile?.match(/^(\+\d+)\s*(.*)$/)
      const countryCode = mobileMatch?.[1] || '+91'
      const mobileNumber = mobileMatch?.[2]?.replace(/\s/g, '') || editProfile.mobile?.replace(/\s/g, '') || ''
      
      setFormData({
        fullName: editProfile.fullName || '',
        profileCreatedFor: editProfile.relationToProfile as 'Self' | 'Daughter' | 'Son' | 'Brother' | 'Sister' | 'Other' | undefined,
        otherRelation: ['Self', 'Daughter', 'Son', 'Brother', 'Sister'].includes(editProfile.relationToProfile || '') ? '' : editProfile.relationToProfile || '',
        dateOfBirth: editProfile.dateOfBirth || '',
        birthTime: editProfile.birthTime || '',
        birthPlace: editProfile.birthPlace || '',
        horoscopeMatching: editProfile.horoscopeMatching || 'not-mandatory',
        diet: (editProfile.dietPreference as '' | 'veg' | 'non-veg' | 'occasionally-non-veg' | 'jain' | 'vegan') || '',
        habit: (editProfile.smokingHabit || editProfile.drinkingHabit || '') as '' | 'none' | 'smoking' | 'drinking' | 'occasionally-drinking' | 'occasionally-smoking',
        annualIncome: editProfile.salary || '',
        profession: editProfile.occupation || '',
        position: editProfile.position || '',
        gender: editProfile.gender,
        religion: editProfile.religion || '',
        caste: editProfile.caste || '',
        motherTongue: editProfile.motherTongue || '',
        education: editProfile.education || '',
        occupation: editProfile.occupation || '',
        location: editProfile.location || '',
        state: editProfile.state || '',
        country: editProfile.country || 'India',
        residentialStatus: editProfile.residentialStatus || '',
        maritalStatus: editProfile.maritalStatus,
        email: editProfile.email || '',
        countryCode: countryCode,
        mobile: mobileNumber,
        height: editProfile.height || '',
        weight: editProfile.weight || '',
        bio: editProfile.bio || '',
        familyDetails: editProfile.familyDetails || '',
        membershipPlan: editProfile.membershipPlan
      })
      
      // Load existing photos
      if (editProfile.photos && editProfile.photos.length > 0) {
        setPhotos(editProfile.photos.map((url, index) => ({
          file: new File([], `existing-photo-${index}`),
          preview: url
        })))
      }
      
      // Load selfie
      if (editProfile.selfieUrl) {
        setSelfiePreview(editProfile.selfieUrl)
      }
      
      // Skip verification for edit mode
      setEmailVerified(true)
      setMobileVerified(true)
      setTermsAccepted(true)
      setStep(1)
    }
  }, [editProfile, open])

  // Load saved draft when dialog opens (only for new registration, not edit mode)
  useEffect(() => {
    if (!open) return // Only load when dialog is opened
    if (isEditMode) return // Skip draft loading in edit mode
    
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY)
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
        if (parsed.formData) {
          setFormData(prev => ({ ...prev, ...parsed.formData }))
        }
        if (parsed.step) {
          setStep(parsed.step)
        }
        if (parsed.photos && parsed.photos.length > 0) {
          setPhotos(parsed.photos)
        }
        if (parsed.selfiePreview) {
          setSelfiePreview(parsed.selfiePreview)
        }
        // Also restore verification states if saved
        if (parsed.emailVerified) {
          setEmailVerified(parsed.emailVerified)
        }
        if (parsed.mobileVerified) {
          setMobileVerified(parsed.mobileVerified)
        }
        if (parsed.digilockerVerified) {
          setDigilockerVerified(parsed.digilockerVerified)
        }
        if (parsed.digilockerData) {
          setDigilockerData(parsed.digilockerData)
        }
        toast.info(
          language === 'hi' ? 'पिछला ड्राफ्ट लोड किया गया' : 'Previous draft loaded',
          { description: language === 'hi' ? 'आप वहीं से जारी रख सकते हैं' : 'You can continue from where you left' }
        )
      }
    } catch (e) {
      console.error('Error loading draft:', e)
    }
  }, [open, isEditMode, language])

  // Save draft function
  const saveDraft = () => {
    try {
      const draft = {
        formData,
        step,
        photos,
        selfiePreview,
        // Also save verification states
        emailVerified,
        mobileVerified,
        digilockerVerified,
        digilockerData
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
      toast.success(
        language === 'hi' ? 'ड्राफ्ट सेव हो गया!' : 'Draft saved!',
        { description: language === 'hi' ? 'आप बाद में जारी रख सकते हैं' : 'You can continue later' }
      )
    } catch (e) {
      console.error('Error saving draft:', e)
      toast.error(language === 'hi' ? 'ड्राफ्ट सेव नहीं हो सका' : 'Could not save draft')
    }
  }

  // Clear draft function
  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error('Error clearing draft:', e)
    }
  }

  // Reset draft function (user-facing with confirmation)
  const resetDraft = () => {
    if (confirm(language === 'hi' 
      ? 'क्या आप वाकई सभी सहेजे गए ड्राफ्ट डेटा को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
      : 'Are you sure you want to delete all saved draft data? This action cannot be undone.'
    )) {
      try {
        localStorage.removeItem(STORAGE_KEY)
        // Reset all form states
        setFormData({
          fullName: '', email: '', mobile: '', dateOfBirth: '', gender: '' as 'male' | 'female',
          religion: '', caste: '', motherTongue: '', height: '', weight: '',
          maritalStatus: '', education: '', occupation: '', income: '', city: '',
          state: '', country: 'India', about: '', familyType: '', familyStatus: '',
          fatherOccupation: '', motherOccupation: '', siblings: '', familyAbout: '',
          partnerAgeMin: '', partnerAgeMax: '', partnerHeightMin: '', partnerHeightMax: '',
          partnerEducation: '', partnerOccupation: '', partnerLocation: '', partnerAbout: '',
          membershipPlan: '', profileCreatedFor: '', otherRelation: '', subcaste: '', gotram: '',
          manglik: '', horoscope: '', residentialStatus: '', citizenship: '', employmentSector: '',
          companyName: '', fatherStatus: '', motherStatus: '', brothersCount: '', sistersCount: '',
          familyValues: '', physicalStatus: '', bloodGroup: '', skinTone: '',
          bodyType: '', partnerReligion: '', partnerCaste: '', partnerMotherTongue: '',
          partnerMaritalStatus: '', partnerIncomeMin: '', partnerIncomeMax: '', partnerCountry: '',
          partnerState: '', alternateEmail: '', alternatePhone: '', landlinePhone: '', timeToCall: '',
          address: '', pincode: '', nativePlace: '', birthTime: '', birthPlace: ''
        })
        setStep(1)
        setPhotos([])
        setSelfiePreview(null)
        setEmailVerified(false)
        setMobileVerified(false)
        setDigilockerVerified(false)
        setDigilockerData(null)
        setTermsAccepted(false)
        toast.success(
          language === 'hi' ? 'ड्राफ्ट रीसेट हो गया!' : 'Draft reset successfully!',
          { description: language === 'hi' ? 'आप नए सिरे से शुरू कर सकते हैं' : 'You can start fresh' }
        )
      } catch (e) {
        console.error('Error resetting draft:', e)
        toast.error(language === 'hi' ? 'ड्राफ्ट रीसेट नहीं हो सका' : 'Could not reset draft')
      }
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getMaxDate = () => {
    const today = new Date()
    const minAge = formData.gender === 'male' ? 21 : formData.gender === 'female' ? 18 : 21
    const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate())
    return maxDate.toISOString().split('T')[0]
  }

  const getMinDate = () => {
    const today = new Date()
    const maxAge = 100
    const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate())
    return minDate.toISOString().split('T')[0]
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const startCamera = async (deviceId?: string) => {
    try {
      // First enumerate available cameras
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setAvailableCameras(videoDevices)
      
      // If no deviceId provided and we have cameras, use the first one or preferred front camera
      let cameraId = deviceId || selectedCameraId
      if (!cameraId && videoDevices.length > 0) {
        // Try to find front camera
        const frontCamera = videoDevices.find(d => d.label.toLowerCase().includes('front') || d.label.toLowerCase().includes('user'))
        cameraId = frontCamera?.deviceId || videoDevices[0].deviceId
        setSelectedCameraId(cameraId)
      }
      
      // First set showCamera to true so the video element is rendered
      setShowCamera(true)
      
      // Build constraints based on selected camera
      const videoConstraints: MediaTrackConstraints = cameraId 
        ? { deviceId: { exact: cameraId } }
        : { facingMode: 'user' }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: videoConstraints,
        audio: false 
      })
      
      streamRef.current = stream
      
      // Use setTimeout to ensure video element is mounted
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
      setShowCamera(false)
      toast.error(t.registration.cameraAccessDenied)
    }
  }

  const switchCamera = async (deviceId: string) => {
    setSelectedCameraId(deviceId)
    // Stop current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraReady(false)
    // Start with new camera
    await startCamera(deviceId)
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
    setIsCameraReady(false)
    setLiveZoom(1) // Reset live zoom
  }

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      
      // Apply live zoom by cropping the center portion
      const zoom = liveZoom
      const sourceWidth = video.videoWidth / zoom
      const sourceHeight = video.videoHeight / zoom
      const sourceX = (video.videoWidth - sourceWidth) / 2
      const sourceY = (video.videoHeight - sourceHeight) / 2
      
      // Output at original resolution for quality
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Flip the canvas horizontally to un-mirror the captured image
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        
        // Draw zoomed portion (center crop scaled to full canvas)
        ctx.drawImage(
          video,
          sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle (center crop)
          0, 0, canvas.width, canvas.height // Destination (full canvas)
        )
        
        // Reset transformation for any future drawings
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        
        // Analyze face coverage using Azure Face API service
        // The service handles all validation: no face, multiple faces, hands/objects, centering, coverage
        const coverage = await analyzeFaceCoverageFromCanvas(canvas)
        setFaceCoveragePercent(coverage)
        
        // If coverage is less than 50%, show preview and ask user to retake with live zoom
        if (coverage < 50 && coverage > 0) {
          setFaceCoverageValid(false)
          // Save preview to show what was captured
          setSelfiePreview(canvas.toDataURL('image/jpeg'))
          // Don't enter zoom mode - user should retake with live zoom instead
          stopCamera()
          return
        } else if (coverage === 0) {
          // No face detected at all
          setFaceCoverageValid(false)
          return
        }
        
        // Face validated successfully - save selfie
        finalizeSelfieCapture(coverage)
      }
    }
  }

  // Finalize selfie capture after validation
  const finalizeSelfieCapture = (coverage: number) => {
    if (canvasRef.current) {
      setFaceCoverageValid(true)
      
      // Capture geolocation when selfie is taken
      captureGeoLocation()
      
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
          setSelfieFile(file)
          setSelfiePreview(canvasRef.current!.toDataURL('image/jpeg'))
          stopCamera()
        }
      }, 'image/jpeg')
    }
  }

  // Capture user's geolocation when selfie is taken
  const captureGeoLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords
          
          // Try to get city/region from coordinates using reverse geocoding
          let city, region, country
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
              { headers: { 'Accept-Language': language } }
            )
            if (response.ok) {
              const data = await response.json()
              city = data.address?.city || data.address?.town || data.address?.village
              region = data.address?.state || data.address?.county
              country = data.address?.country
            }
          } catch (e) {
            console.log('Reverse geocoding failed, using coordinates only')
          }
          
          setRegistrationGeoLocation({
            latitude,
            longitude,
            accuracy,
            city,
            region,
            country,
            capturedAt: new Date().toISOString()
          })
          
          toast.info(
            language === 'hi' 
              ? `स्थान कैप्चर किया गया: ${city || 'अज्ञात'}, ${region || ''}` 
              : `Location captured: ${city || 'Unknown'}, ${region || ''}`,
            { duration: 3000 }
          )
        },
        (error) => {
          console.log('Geolocation error:', error.message)
          // Still allow registration even if location fails
          toast.warning(
            language === 'hi' 
              ? 'स्थान प्राप्त नहीं हो सका' 
              : 'Could not get location',
            { duration: 3000 }
          )
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    }
  }

  // Analyze face coverage from canvas using Azure Face API service
  const analyzeFaceCoverageFromCanvas = async (canvas: HTMLCanvasElement): Promise<number> => {
    // Convert canvas to data URL for face detection service
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    
    // Import and use the Azure Face Service
    const { validateSelfie } = await import('@/lib/azureFaceService')
    
    const result = await validateSelfie(imageData, language)
    
    if (!result.valid) {
      toast.error(result.message, { duration: 5000 })
      return result.coverage // Return 0 or partial coverage for rejection
    }
    
    // Face detected, validated, and meets all criteria
    toast.success(result.message, { duration: 3000 })
    return result.coverage
  }

  // AI Bio Generation
  const handleGenerateBio = async () => {
    if (!formData.fullName || !formData.education || !formData.occupation) {
      toast.error(
        language === 'hi' 
          ? 'कृपया पहले नाम, शिक्षा और व्यवसाय भरें' 
          : 'Please fill in name, education and occupation first'
      )
      return
    }

    setIsGeneratingBio(true)
    try {
      const birthDate = formData.dateOfBirth ? new Date(formData.dateOfBirth) : null
      const age = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 25

      const params: BioGenerationParams = {
        name: formData.fullName,
        age,
        gender: formData.gender || 'male',
        education: formData.education,
        occupation: formData.occupation,
        location: formData.location || '',
        religion: formData.religion,
        caste: formData.caste,
        familyDetails: formData.familyDetails,
        language
      }

      const result = await generateBio(params)
      
      if (result.success && result.bio) {
        updateField('bio', result.bio)
        toast.success(
          language === 'hi' ? 'AI ने परिचय तैयार किया!' : 'AI generated bio!',
          { description: language === 'hi' ? 'आप इसे संपादित कर सकते हैं' : 'You can edit it as needed' }
        )
      } else {
        toast.error(result.message || (language === 'hi' ? 'परिचय बनाने में त्रुटि' : 'Error generating bio'))
      }
    } catch (error) {
      console.error('Bio generation error:', error)
      toast.error(language === 'hi' ? 'परिचय बनाने में त्रुटि' : 'Error generating bio')
    } finally {
      setIsGeneratingBio(false)
    }
  }

  // Check for duplicate email or mobile
  const isDuplicateEmail = (email: string) => {
    return existingProfiles.some(p => {
      // Skip self in edit mode
      if (isEditMode && editProfile && p.id === editProfile.id) return false
      return p.email?.toLowerCase() === email.toLowerCase()
    })
  }

  const isDuplicateMobile = (mobile: string) => {
    const fullMobile = `${formData.countryCode} ${mobile}`
    return existingProfiles.some(p => {
      // Skip self in edit mode
      if (isEditMode && editProfile && p.id === editProfile.id) return false
      // Check both with and without country code
      const existingMobile = p.mobile?.replace(/\s+/g, '') || ''
      const newMobile = fullMobile.replace(/\s+/g, '')
      return existingMobile === newMobile || existingMobile.endsWith(mobile)
    })
  }

  // Email format validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.dateOfBirth || !formData.gender || !formData.religion || !formData.motherTongue || !formData.height || !formData.maritalStatus || !formData.horoscopeMatching || !formData.email || !formData.mobile || !formData.membershipPlan) {
      toast.error(t.registration.fillAllFields)
      return
    }

    // Validate Terms and Conditions acceptance
    if (!termsAccepted) {
      toast.error(
        language === 'hi' 
          ? 'कृपया नियम और शर्तें स्वीकार करें' 
          : 'Please accept Terms and Conditions'
      )
      return
    }

    // If horoscope matching is mandatory, birth time and place are required
    if (formData.horoscopeMatching === 'mandatory' && (!formData.birthTime || !formData.birthPlace)) {
      toast.error(
        language === 'hi' 
          ? 'कुंडली मिलान अनिवार्य है, कृपया जन्म समय और जन्म स्थान दर्ज करें' 
          : 'Horoscope matching is mandatory, please provide birth time and birth place'
      )
      return
    }

    // Check for duplicate email
    if (isDuplicateEmail(formData.email)) {
      toast.error(
        language === 'hi' 
          ? 'यह ईमेल पहले से पंजीकृत है। कृपया दूसरा ईमेल उपयोग करें।' 
          : 'This email is already registered. Please use a different email.'
      )
      return
    }

    // Check for duplicate mobile
    if (isDuplicateMobile(formData.mobile)) {
      toast.error(
        language === 'hi' 
          ? 'यह मोबाइल नंबर पहले से पंजीकृत है। कृपया दूसरा नंबर उपयोग करें।' 
          : 'This mobile number is already registered. Please use a different number.'
      )
      return
    }

    // Validate mobile based on country code
    const phoneLengthInfo = getPhoneLengthInfo(formData.countryCode)
    if (!isValidPhoneLength(formData.mobile, formData.countryCode)) {
      toast.error(
        language === 'hi' 
          ? `कृपया ${phoneLengthInfo.display} अंक का मोबाइल नंबर दर्ज करें` 
          : `Please enter a ${phoneLengthInfo.display} digit mobile number`
      )
      return
    }

    const age = calculateAge(formData.dateOfBirth)
    const minAge = formData.gender === 'male' ? 21 : 18
    
    if (age < minAge) {
      toast.error(
        `${formData.gender === 'male' ? (language === 'hi' ? 'पुरुष' : 'Male') : (language === 'hi' ? 'महिला' : 'Female')} ${t.registration.minAgeError} ${minAge} ${t.registration.yearsRequired}`
      )
      return
    }

    // Calculate membership cost and expiry based on plan
    const membershipCost = formData.membershipPlan === 'free' ? 0 : formData.membershipPlan === '6-month' ? 500 : 900
    
    // In edit mode, keep existing membership expiry unless plan changed
    let membershipExpiry: Date
    if (isEditMode && editProfile?.membershipExpiry && formData.membershipPlan === editProfile.membershipPlan) {
      membershipExpiry = new Date(editProfile.membershipExpiry)
    } else {
      membershipExpiry = new Date()
      // Free plan also gets 6 months, just with limited features
      membershipExpiry.setMonth(membershipExpiry.getMonth() + (formData.membershipPlan === '1-year' ? 12 : 6))
    }

    // Generate a temporary profile ID for new registrations (for photo uploads)
    const tempProfileId = isEditMode && editProfile?.profileId 
      ? editProfile.profileId 
      : `SP${Date.now().toString().slice(-8)}`

    // Upload photos to blob storage if available
    setIsSubmitting(true)
    let photoUrls: string[] = []
    let uploadedSelfieUrl: string | undefined = selfiePreview
    let uploadedIdProofUrl: string | undefined = idProofPreview
    let uploadedPaymentScreenshotUrl: string | undefined = paymentScreenshotPreview

    try {
      const blobAvailable = await isBlobStorageAvailable()
      
      if (blobAvailable) {
        // Upload profile photos
        const photoUploadPromises = photos.map(async (photo, index) => {
          // Skip if it's already a CDN URL (from previous upload)
          if (photo.preview.startsWith('https://')) {
            return photo.preview
          }
          // Convert base64 to file and upload
          try {
            const file = photo.file.size > 0 
              ? photo.file 
              : dataUrlToFile(photo.preview, `photo-${index}.jpg`)
            const { cdnUrl } = await uploadPhoto(tempProfileId, file)
            return cdnUrl
          } catch (err) {
            console.warn(`Failed to upload photo ${index}:`, err)
            return photo.preview // Fallback to base64
          }
        })

        photoUrls = await Promise.all(photoUploadPromises)

        // Upload selfie if it's base64
        if (selfiePreview && !selfiePreview.startsWith('https://')) {
          try {
            const selfieFile = dataUrlToFile(selfiePreview, 'selfie.jpg')
            const { cdnUrl } = await uploadPhoto(tempProfileId, selfieFile)
            uploadedSelfieUrl = cdnUrl
          } catch (err) {
            console.warn('Failed to upload selfie:', err)
          }
        }

        // Upload ID proof if it's base64
        if (idProofPreview && !idProofPreview.startsWith('https://')) {
          try {
            const idFile = dataUrlToFile(idProofPreview, 'id-proof.jpg')
            const { cdnUrl } = await uploadPhoto(tempProfileId, idFile)
            uploadedIdProofUrl = cdnUrl
          } catch (err) {
            console.warn('Failed to upload ID proof:', err)
          }
        }

        // Upload payment screenshot if it's base64
        if (paymentScreenshotPreview && !paymentScreenshotPreview.startsWith('https://')) {
          try {
            const paymentFile = dataUrlToFile(paymentScreenshotPreview, 'payment-screenshot.jpg')
            const { cdnUrl } = await uploadPhoto(tempProfileId, paymentFile)
            uploadedPaymentScreenshotUrl = cdnUrl
          } catch (err) {
            console.warn('Failed to upload payment screenshot:', err)
          }
        }
      } else {
        // Fallback: use base64 (not recommended for production)
        photoUrls = photos.map(p => p.preview)
      }
    } catch (err) {
      console.warn('Blob storage not available, using base64:', err)
      photoUrls = photos.map(p => p.preview)
    } finally {
      setIsSubmitting(false)
    }

    const profile: Partial<Profile> = {
      ...formData,
      // Include existing profile fields for edit mode
      ...(isEditMode && editProfile ? {
        id: editProfile.id,
        profileId: editProfile.profileId,
        createdAt: editProfile.createdAt,
        trustLevel: editProfile.trustLevel,
        status: 'pending', // Reset to pending for re-verification
        returnedForEdit: false, // Clear the returned flag
        editReason: undefined,
        returnedAt: undefined
      } : {
        profileId: tempProfileId // Use the temp ID for new registrations
      }),
      // DigiLocker verification data
      ...(digilockerVerified && digilockerData ? {
        digilockerVerified: true,
        digilockerVerifiedAt: digilockerData.verifiedAt,
        digilockerID: digilockerData.digilockerID,
        aadhaarLastFour: digilockerData.aadhaarLastFour,
        digilockerVerifiedName: digilockerData.name,
        digilockerVerifiedDob: digilockerData.dob
      } : (isEditMode && editProfile ? {
        digilockerVerified: editProfile.digilockerVerified,
        digilockerVerifiedAt: editProfile.digilockerVerifiedAt,
        digilockerID: editProfile.digilockerID,
        aadhaarLastFour: editProfile.aadhaarLastFour,
        digilockerVerifiedName: editProfile.digilockerVerifiedName,
        digilockerVerifiedDob: editProfile.digilockerVerifiedDob
      } : {})),
      firstName: formData.fullName.split(' ')[0],
      lastName: formData.fullName.split(' ').slice(1).join(' ') || formData.fullName.split(' ')[0],
      age,
      gender: formData.gender!,
      maritalStatus: formData.maritalStatus!,
      mobile: `${formData.countryCode} ${formData.mobile}`,
      membershipPlan: formData.membershipPlan!,
      relationToProfile: formData.profileCreatedFor === 'Other' ? formData.otherRelation : formData.profileCreatedFor!,
      hideEmail: editProfile?.hideEmail ?? false,
      hideMobile: editProfile?.hideMobile ?? false,
      photos: photoUrls, // Use uploaded CDN URLs (or base64 fallback)
      selfieUrl: uploadedSelfieUrl, // Use uploaded CDN URL
      // ID Proof data (only add if provided - for new registrations)
      ...(uploadedIdProofUrl ? {
        idProofUrl: uploadedIdProofUrl, // Use uploaded CDN URL
        idProofType: idProofType,
        idProofUploadedAt: new Date().toISOString(),
        idProofVerified: false
      } : (isEditMode && editProfile ? {
        idProofUrl: editProfile.idProofUrl,
        idProofType: editProfile.idProofType,
        idProofUploadedAt: editProfile.idProofUploadedAt,
        idProofVerified: editProfile.idProofVerified,
        idProofVerifiedAt: editProfile.idProofVerifiedAt,
        idProofVerifiedBy: editProfile.idProofVerifiedBy,
        idProofNotes: editProfile.idProofNotes
      } : {})),
      membershipExpiry: membershipExpiry.toISOString(),
      registrationLocation: isEditMode && editProfile?.registrationLocation ? editProfile.registrationLocation : (registrationGeoLocation || undefined),
      // Payment data for paid plans
      ...(formData.membershipPlan && formData.membershipPlan !== 'free' ? {
        paymentScreenshotUrl: uploadedPaymentScreenshotUrl || undefined,
        paymentStatus: uploadedPaymentScreenshotUrl ? 'pending' : undefined,
        paymentAmount: formData.membershipPlan === '6-month' 
          ? (membershipSettings?.sixMonthPrice || 500) 
          : (membershipSettings?.oneYearPrice || 900),
        paymentUploadedAt: uploadedPaymentScreenshotUrl ? new Date().toISOString() : undefined
      } : {
        paymentStatus: 'not-required' as const
      })
    }

    onSubmit(profile)
    
    if (!isEditMode) {
      clearDraft()
    }
    
    // Show appropriate message based on mode and plan type
    if (isEditMode) {
      toast.success(
        language === 'hi' ? 'प्रोफ़ाइल अपडेट किया गया!' : 'Profile Updated!',
        {
          description: language === 'hi' 
            ? 'आपकी प्रोफ़ाइल सत्यापन के लिए भेजी गई है।'
            : 'Your profile has been submitted for verification.'
        }
      )
    } else if (formData.membershipPlan === 'free') {
      toast.success(
        t.registration.profileSubmitted,
        {
          description: language === 'hi' 
            ? 'आपने मुफ्त परिचयात्मक योजना (6 महीने) चुनी है। प्रोफ़ाइल देखने और रुचि व्यक्त करने का आनंद लें!'
            : 'You have chosen the Free Introductory Plan (6 months). Enjoy viewing profiles and expressing interest!'
        }
      )
    } else {
      toast.success(
        t.registration.profileSubmitted,
        {
          description: `${t.registration.membershipFee}: ₹${membershipCost}। ${t.registration.otpSending}`
        }
      )
    }
    
    setTimeout(() => {
      toast.info(
        t.registration.verificationProcess,
        {
          description: t.registration.reviewNote
        }
      )
    }, 2000)

    setFormData({
      fullName: '',
      profileCreatedFor: undefined,
      otherRelation: '',
      dateOfBirth: '',
      birthTime: '',
      birthPlace: '',
      horoscopeMatching: 'not-mandatory',
      diet: '',
      habit: '',
      annualIncome: '',
      profession: '',
      position: '',
      gender: undefined,
      religion: '',
      caste: '',
      motherTongue: '',
      education: '',
      occupation: '',
      location: '',
      country: '',
      maritalStatus: undefined,
      email: '',
      countryCode: '+91',
      mobile: '',
      height: '',
      weight: '',
      bio: '',
      familyDetails: '',
      membershipPlan: undefined
    })
    setPhotos([])
    setSelfieFile(null)
    setSelfiePreview(undefined)
    setTermsAccepted(false)
    stopCamera()
    setStep(1)
    onClose()
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const remainingSlots = 3 - photos.length
      const filesToAdd = Array.from(files).slice(0, remainingSlots)
      
      filesToAdd.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPhotos(prev => {
            if (prev.length >= 3) return prev
            return [...prev, { file, preview: reader.result as string }]
          })
        }
        reader.readAsDataURL(file)
      })
    }
    // Reset input to allow re-selecting same file
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    if (photos.length > 1) {
      setPhotos(prev => prev.filter((_, i) => i !== index))
    } else {
      toast.error(language === 'hi' ? 'कम से कम एक फोटो आवश्यक है' : 'At least one photo is required')
    }
  }

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === photos.length - 1)) {
      return
    }
    setPhotos(prev => {
      const newPhotos = [...prev]
      const swapIndex = direction === 'up' ? index - 1 : index + 1
      ;[newPhotos[index], newPhotos[swapIndex]] = [newPhotos[swapIndex], newPhotos[index]]
      return newPhotos
    })
  }

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelfieFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const sendOtps = (emailOnly?: boolean, mobileOnly?: boolean) => {
    let emailOtpCode = generatedEmailOtp
    let mobileOtpCode = generatedMobileOtp
    
    // Only generate new OTP for channels that are not verified
    if (!emailVerified && !mobileOnly) {
      emailOtpCode = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedEmailOtp(emailOtpCode)
    }
    
    if (!mobileVerified && !emailOnly) {
      mobileOtpCode = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedMobileOtp(mobileOtpCode)
    }
    
    setShowVerification(true)
    
    // Build message based on what was sent
    let message = ''
    if (!emailVerified && !mobileOnly) {
      message += `Email: ${emailOtpCode}`
    }
    if (!mobileVerified && !emailOnly) {
      if (message) message += ' | '
      message += `Mobile: ${mobileOtpCode}`
    }
    
    if (message) {
      toast.success(
        language === 'hi' ? 'OTP भेजा गया!' : 'OTP Sent!',
        {
          description: message,
          duration: 30000
        }
      )
    }
  }

  const verifyEmailOtp = () => {
    if (emailOtp === generatedEmailOtp) {
      setEmailVerified(true)
      toast.success(language === 'hi' ? 'ईमेल सत्यापित!' : 'Email Verified!')
      return true
    } else {
      toast.error(language === 'hi' ? 'गलत ईमेल OTP' : 'Invalid Email OTP')
      return false
    }
  }

  const verifyMobileOtp = () => {
    if (mobileOtp === generatedMobileOtp) {
      setMobileVerified(true)
      toast.success(language === 'hi' ? 'मोबाइल सत्यापित!' : 'Mobile Verified!')
      return true
    } else {
      toast.error(language === 'hi' ? 'गलत मोबाइल OTP' : 'Invalid Mobile OTP')
      return false
    }
  }

  // DigiLocker verification disabled for now - will be integrated later
  // Using strict warnings for name/DOB instead

  const handleVerificationComplete = () => {
    const emailValid = verifyEmailOtp()
    const mobileValid = verifyMobileOtp()
    
    if (emailValid && mobileValid) {
      setShowVerification(false)
      setStep(4)
    }
  }

  const nextStep = () => {
    // Validate step 1 fields
    if (step === 1 && (!formData.fullName || !formData.dateOfBirth || !formData.gender || !formData.religion || !formData.motherTongue || !formData.height || !formData.maritalStatus)) {
      toast.error(t.registration.fillAllFields)
      return
    }
    if (step === 1 && !formData.profileCreatedFor) {
      toast.error(language === 'hi' ? 'कृपया प्रोफाइल किसके लिए बनाई जा रही है चुनें' : 'Please select who this profile is for')
      return
    }
    if (step === 1 && formData.profileCreatedFor === 'Other' && !(formData.otherRelation || '').trim()) {
      toast.error(language === 'hi' ? 'कृपया रिश्ता बताएं' : 'Please specify the relation')
      return
    }
    // Horoscope matching mandatory requires birth time and place (step 1)
    if (step === 1 && (formData.horoscopeMatching || 'not-mandatory') === 'mandatory' && (!formData.birthTime || !formData.birthPlace)) {
      toast.error(
        language === 'hi' 
          ? 'कुंडली मिलान अनिवार्य है, कृपया जन्म समय और जन्म स्थान दर्ज करें' 
          : 'Horoscope matching is mandatory, please provide birth time and birth place'
      )
      return
    }
    if (step === 2 && (!formData.education || !formData.occupation)) {
      toast.error(t.registration.fillEducation)
      return
    }
    if (step === 3 && (!formData.location || !formData.state || !formData.country || !formData.email || !formData.mobile)) {
      toast.error(t.registration.fillContact)
      return
    }
    // Validate residential status is required when living outside India
    if (step === 3 && formData.country && formData.country !== 'India' && !formData.residentialStatus) {
      toast.error(
        language === 'hi' 
          ? 'विदेश में रहने वालों के लिए निवास स्थिति चुनना आवश्यक है' 
          : 'Residential status is required for those living outside India'
      )
      return
    }
    if (step === 3) {
      // Validate email format first
      if (!isValidEmail(formData.email)) {
        toast.error(
          language === 'hi' 
            ? 'कृपया वैध ईमेल पता दर्ज करें (उदाहरण: example@email.com)' 
            : 'Please enter a valid email address (e.g., example@email.com)'
        )
        return
      }
      
      // Validate mobile based on country code
      const countryCode = formData.countryCode || '+91'
      const stepPhoneLengthInfo = getPhoneLengthInfo(countryCode)
      if (!isValidPhoneLength(formData.mobile, countryCode)) {
        toast.error(
          language === 'hi' 
            ? `कृपया ${stepPhoneLengthInfo.display} अंक का मोबाइल नंबर दर्ज करें` 
            : `Please enter a ${stepPhoneLengthInfo.display} digit mobile number`
        )
        return
      }
      
      // Check for duplicate email in database (skip if editing own profile)
      const duplicateEmail = existingProfiles.find(
        p => p.email?.toLowerCase() === formData.email?.toLowerCase() && 
        (!isEditMode || p.id !== editProfile?.id)
      )
      
      // Check for duplicate mobile in database (skip if editing own profile)
      const fullMobileCheck = `${formData.countryCode} ${formData.mobile}`
      const duplicateMobile = existingProfiles.find(
        p => {
          if (isEditMode && p.id === editProfile?.id) return false
          const existingMobile = p.mobile?.replace(/\s+/g, '') || ''
          const newMobile = fullMobileCheck.replace(/\s+/g, '')
          return existingMobile === newMobile || existingMobile.endsWith(formData.mobile)
        }
      )
      
      // Show errors for both if both are duplicates
      if (duplicateEmail && duplicateMobile) {
        toast.error(
          language === 'hi' 
            ? 'यह ईमेल और मोबाइल नंबर दोनों पहले से पंजीकृत हैं। कृपया दूसरा ईमेल और मोबाइल नंबर उपयोग करें।' 
            : 'Both email and mobile number are already registered. Please use different email and mobile number.'
        )
        return
      }
      
      if (duplicateEmail) {
        toast.error(
          language === 'hi' 
            ? 'यह ईमेल पहले से पंजीकृत है। कृपया दूसरा ईमेल उपयोग करें।' 
            : 'This email is already registered. Please use a different email.'
        )
        return
      }
      
      if (duplicateMobile) {
        toast.error(
          language === 'hi' 
            ? 'यह मोबाइल नंबर पहले से पंजीकृत है। कृपया दूसरा नंबर उपयोग करें।' 
            : 'This mobile number is already registered. Please use a different number.'
        )
        return
      }
      
      // Only send OTPs if not already verified
      if (emailVerified && mobileVerified) {
        // Both already verified, skip OTP step and proceed to next step
        setStep(4)
        return
      }
      sendOtps()
      return
    }
    if (step === 4 && photos.length === 0) {
      toast.error(language === 'hi' ? 'कृपया कम से कम एक फोटो अपलोड करें' : 'Please upload at least one photo')
      return
    }
    if (step === 4 && !selfiePreview) {
      toast.error(language === 'hi' ? 'कृपया लाइव सेल्फी लें' : 'Please capture a live selfie')
      return
    }
    // ID Proof is mandatory for new registrations only (not for edit mode)
    if (step === 4 && !isEditMode && !idProofPreview) {
      toast.error(language === 'hi' ? 'कृपया सरकारी पहचान प्रमाण अपलोड करें' : 'Please upload government ID proof')
      return
    }
    if (step === 4 && !isEditMode && !idProofType) {
      toast.error(language === 'hi' ? 'कृपया दस्तावेज़ का प्रकार चुनें' : 'Please select document type')
      return
    }
    // Step 5 - Bio is mandatory
    if (step === 5 && !(formData.bio || '').trim()) {
      toast.error(language === 'hi' ? 'कृपया अपने बारे में लिखें (अनिवार्य है)' : 'Please write about yourself (required)')
      return
    }
    setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  return (
    <Dialog open={open} onOpenChange={onClose} modal>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col z-50" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-3xl flex items-center gap-2">
            <UserPlus size={32} weight="bold" />
            {isEditMode 
              ? (language === 'hi' ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile')
              : t.registration.title}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? (language === 'hi' ? 'अपनी प्रोफ़ाइल जानकारी अपडेट करें' : 'Update your profile information')
              : t.registration.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-1">
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5, 6].map((s) => {
              const isCompleted = s < step || (s === 3 && emailVerified && mobileVerified)
              const isCurrent = s === step
              const canClick = isCompleted && !showVerification // Can click on completed steps
              
              return (
                <div key={s} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => canClick && setStep(s)}
                    disabled={!canClick}
                    className={`relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold transition-all text-sm border-0 ${
                      isCurrent ? 'bg-primary text-primary-foreground scale-110' :
                      isCompleted ? 'bg-teal text-teal-foreground cursor-pointer hover:scale-110 hover:ring-2 hover:ring-teal/50' : 'bg-muted text-muted-foreground cursor-default'
                    }`}
                    title={canClick ? (language === 'hi' ? `चरण ${s} पर जाएं` : `Go to step ${s}`) : ''}
                  >
                    {s}
                    {isCompleted && (
                      <CheckCircle 
                        size={14} 
                        weight="fill" 
                        className="absolute -top-1 -right-1 text-white bg-green-600 rounded-full"
                      />
                    )}
                  </button>
                  {s < 6 && <div className={`w-6 md:w-10 h-1 ${isCompleted ? 'bg-teal' : 'bg-muted'}`} />}
                </div>
              )
            })}
          </div>

          <Alert className="mb-4">
            <Info size={18} />
            <AlertDescription>
              {step === 1 && t.registration.step1}
              {step === 2 && t.registration.step2}
              {step === 3 && !showVerification && t.registration.step3}
              {step === 3 && showVerification && (language === 'hi' ? 'कृपया अपने ईमेल और मोबाइल पर भेजे गए OTP को सत्यापित करें।' : 'Please verify the OTPs sent to your email and mobile.')}
              {step === 4 && (language === 'hi' ? 'अपनी फ़ोटो और लाइव सेल्फी अपलोड करें। चेहरा फ्रेम का 50% होना चाहिए।' : 'Upload your photos and capture a live selfie. Face must cover 50% of frame.')}
              {step === 5 && (language === 'hi' ? 'अपने बारे में और परिवार की जानकारी दें। यह आवश्यक है।' : 'Tell us about yourself and your family. This is required.')}
              {step === 6 && t.registration.step5}
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="pt-6">
            {step === 1 && (
              <div className="space-y-4">
                {/* Important Warning - Name and DOB cannot be changed after registration */}
                {!isEditMode && (
                  <div className="p-4 rounded-lg border-2 border-orange-400 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-600">
                    <div className="flex items-start gap-3">
                      <Warning size={28} weight="bold" className="text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <h3 className="font-bold text-orange-800 dark:text-orange-300 text-lg">
                          {language === 'hi' ? '⚠️ महत्वपूर्ण सूचना - ध्यान से पढ़ें' : '⚠️ Important Notice - Read Carefully'}
                        </h3>
                        <div className="space-y-2 text-sm text-orange-700 dark:text-orange-400">
                          <p className="font-semibold">
                            {language === 'hi' 
                              ? 'आपका नाम और जन्म तिथि पंजीकरण के बाद कभी भी बदले नहीं जा सकते।'
                              : 'Your Name and Date of Birth CANNOT be changed after registration.'}
                          </p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>
                              {language === 'hi' 
                                ? 'कृपया अपने आधिकारिक दस्तावेजों (आधार/पैन) के अनुसार सही नाम दर्ज करें'
                                : 'Please enter your name exactly as per official documents (Aadhaar/PAN)'}
                            </li>
                            <li>
                              {language === 'hi' 
                                ? 'जन्म तिथि सही दर्ज करें - यह बाद में संशोधित नहीं की जा सकती'
                                : 'Enter correct date of birth - it cannot be modified later'}
                            </li>
                            <li>
                              {language === 'hi' 
                                ? 'गलत जानकारी देने पर प्रोफाइल अस्वीकार हो सकती है'
                                : 'Incorrect information may lead to profile rejection'}
                            </li>
                          </ul>
                          <p className="text-xs italic mt-2 border-t border-orange-300 pt-2">
                            {language === 'hi' 
                              ? 'हम फोटो सत्यापन द्वारा आपकी पहचान की जांच करते हैं। गलत जानकारी वाली प्रोफाइल स्थायी रूप से ब्लॉक की जा सकती है।'
                              : 'We verify identity through photo verification. Profiles with false information may be permanently blocked.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show locked badge for edit mode */}
                {isEditMode && (
                  <Alert className="bg-gray-50 border-gray-400 dark:bg-gray-950/30">
                    <ShieldCheck size={20} weight="fill" className="text-gray-600" />
                    <AlertDescription className="text-gray-700 dark:text-gray-300">
                      {language === 'hi' 
                        ? 'नाम और जन्म तिथि संपादित नहीं किए जा सकते'
                        : 'Name and Date of Birth cannot be edited'}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    {language === 'hi' ? 'नाम' : 'Name'} *
                    {isEditMode && (
                      <span className="ml-2 text-xs text-gray-500">
                        🔒 {language === 'hi' ? 'स्थायी' : 'Permanent'}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="fullName"
                    placeholder={language === 'hi' ? 'आधिकारिक नाम दर्ज करें (आधार/पैन अनुसार)' : 'Enter official name (as per Aadhaar/PAN)'}
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    required
                    disabled={isEditMode}
                    className={isEditMode ? 'bg-muted' : ''}
                  />
                  {!isEditMode && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      ⚠️ {language === 'hi' ? 'पंजीकरण के बाद बदला नहीं जा सकता' : 'Cannot be changed after registration'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profileCreatedFor">
                    {language === 'hi' ? 'यह प्रोफाइल किसके लिए बनाई जा रही है?' : 'Profile created for'} *
                  </Label>
                  <Select 
                    value={formData.profileCreatedFor || ''}
                    onValueChange={(value: 'Self' | 'Daughter' | 'Son' | 'Brother' | 'Sister' | 'Other') => {
                      setFormData({ ...formData, profileCreatedFor: value, otherRelation: value !== 'Other' ? '' : formData.otherRelation });
                    }}
                  >
                    <SelectTrigger id="profileCreatedFor" className="w-full">
                      <SelectValue placeholder={t.fields.select} />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                      <SelectItem value="Self">{language === 'hi' ? 'स्वयं' : 'Self'}</SelectItem>
                      <SelectItem value="Daughter">{language === 'hi' ? 'बेटी' : 'Daughter'}</SelectItem>
                      <SelectItem value="Son">{language === 'hi' ? 'बेटा' : 'Son'}</SelectItem>
                      <SelectItem value="Brother">{language === 'hi' ? 'भाई' : 'Brother'}</SelectItem>
                      <SelectItem value="Sister">{language === 'hi' ? 'बहन' : 'Sister'}</SelectItem>
                      <SelectItem value="Other">{language === 'hi' ? 'अन्य' : 'Other'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.profileCreatedFor === 'Other' && (
                  <div className="space-y-2">
                    <Label htmlFor="otherRelation">
                      {language === 'hi' ? 'रिश्ता बताएं' : 'Specify Relation'} *
                    </Label>
                    <Input
                      id="otherRelation"
                      placeholder={language === 'hi' ? 'उदाहरण: मामा, चाची, दोस्त' : 'Example: Uncle, Aunt, Friend'}
                      value={formData.otherRelation}
                      onChange={(e) => updateField('otherRelation', e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">{language === 'hi' ? 'लिंग' : 'Gender'} *</Label>
                    <Select onValueChange={(value: Gender) => updateField('gender', value)} value={formData.gender || ''}>
                      <SelectTrigger id="gender" className="w-full">
                        <SelectValue placeholder={t.fields.select} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="male">{language === 'hi' ? 'पुरुष' : 'Male'}</SelectItem>
                        <SelectItem value="female">{language === 'hi' ? 'महिला' : 'Female'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">
                      {language === 'hi' ? 'जन्म तिथि' : 'Date of Birth'} * <span className="text-xs font-normal text-muted-foreground">(DD/MM/YYYY)</span>
                      {isEditMode && (
                        <span className="ml-2 text-xs text-gray-500">
                          🔒 {language === 'hi' ? 'स्थायी' : 'Permanent'}
                        </span>
                      )}
                    </Label>
                    <DatePicker
                      value={formData.dateOfBirth}
                      onChange={(value) => updateField('dateOfBirth', value)}
                      maxDate={new Date(getMaxDate())}
                      minDate={new Date(getMinDate())}
                      disabled={!formData.gender || isEditMode}
                      placeholder="DD/MM/YYYY"
                    />
                    {isEditMode && (
                      <p className="text-xs text-gray-600">
                        {language === 'hi' ? 'जन्म तिथि संपादित नहीं की जा सकती' : 'Date of birth cannot be edited'}
                      </p>
                    )}
                    {!formData.gender && !isEditMode && (
                      <p className="text-xs text-muted-foreground">
                        {t.registration.selectGenderFirst}
                      </p>
                    )}
                    {formData.gender && !isEditMode && (
                      <>
                        <p className="text-xs text-muted-foreground">
                          {t.registration.minAgeInfo}: {formData.gender === 'male' ? '21' : '18'} {t.registration.yearsText}
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          ⚠️ {language === 'hi' ? 'पंजीकरण के बाद बदला नहीं जा सकता' : 'Cannot be changed after registration'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="religion">{language === 'hi' ? 'धर्म' : 'Religion'} *</Label>
                    <Select onValueChange={(value) => updateField('religion', value)} value={formData.religion || ''}>
                      <SelectTrigger id="religion" className="w-full">
                        <SelectValue placeholder={language === 'hi' ? 'धर्म चुनें' : 'Select Religion'} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="Hindu">{language === 'hi' ? 'हिंदू' : 'Hindu'}</SelectItem>
                        <SelectItem value="Muslim">{language === 'hi' ? 'मुस्लिम' : 'Muslim'}</SelectItem>
                        <SelectItem value="Sikh">{language === 'hi' ? 'सिख' : 'Sikh'}</SelectItem>
                        <SelectItem value="Christian">{language === 'hi' ? 'ईसाई' : 'Christian'}</SelectItem>
                        <SelectItem value="Jain">{language === 'hi' ? 'जैन' : 'Jain'}</SelectItem>
                        <SelectItem value="Buddhist">{language === 'hi' ? 'बौद्ध' : 'Buddhist'}</SelectItem>
                        <SelectItem value="Parsi">{language === 'hi' ? 'पारसी' : 'Parsi'}</SelectItem>
                        <SelectItem value="Jewish">{language === 'hi' ? 'यहूदी' : 'Jewish'}</SelectItem>
                        <SelectItem value="Bahai">{language === 'hi' ? 'बहाई' : 'Bahai'}</SelectItem>
                        <SelectItem value="Spiritual">{language === 'hi' ? 'आध्यात्मिक' : 'Spiritual'}</SelectItem>
                        <SelectItem value="No Religion">{language === 'hi' ? 'कोई धर्म नहीं' : 'No Religion'}</SelectItem>
                        <SelectItem value="Other">{language === 'hi' ? 'अन्य' : 'Other'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motherTongue">{language === 'hi' ? 'मातृभाषा' : 'Mother Tongue'} *</Label>
                    <Select onValueChange={(value) => updateField('motherTongue', value)} value={formData.motherTongue || ''}>
                      <SelectTrigger id="motherTongue" className="w-full">
                        <SelectValue placeholder={language === 'hi' ? 'मातृभाषा चुनें' : 'Select Mother Tongue'} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="Hindi">{language === 'hi' ? 'हिंदी' : 'Hindi'}</SelectItem>
                        <SelectItem value="English">{language === 'hi' ? 'अंग्रेज़ी' : 'English'}</SelectItem>
                        <SelectItem value="Punjabi">{language === 'hi' ? 'पंजाबी' : 'Punjabi'}</SelectItem>
                        <SelectItem value="Gujarati">{language === 'hi' ? 'गुजराती' : 'Gujarati'}</SelectItem>
                        <SelectItem value="Marathi">{language === 'hi' ? 'मराठी' : 'Marathi'}</SelectItem>
                        <SelectItem value="Tamil">{language === 'hi' ? 'तमिल' : 'Tamil'}</SelectItem>
                        <SelectItem value="Telugu">{language === 'hi' ? 'तेलुगु' : 'Telugu'}</SelectItem>
                        <SelectItem value="Kannada">{language === 'hi' ? 'कन्नड़' : 'Kannada'}</SelectItem>
                        <SelectItem value="Malayalam">{language === 'hi' ? 'मलयालम' : 'Malayalam'}</SelectItem>
                        <SelectItem value="Bengali">{language === 'hi' ? 'बंगाली' : 'Bengali'}</SelectItem>
                        <SelectItem value="Odia">{language === 'hi' ? 'ओड़िया' : 'Odia'}</SelectItem>
                        <SelectItem value="Assamese">{language === 'hi' ? 'असमिया' : 'Assamese'}</SelectItem>
                        <SelectItem value="Kashmiri">{language === 'hi' ? 'कश्मीरी' : 'Kashmiri'}</SelectItem>
                        <SelectItem value="Konkani">{language === 'hi' ? 'कोंकणी' : 'Konkani'}</SelectItem>
                        <SelectItem value="Manipuri">{language === 'hi' ? 'मणिपुरी' : 'Manipuri'}</SelectItem>
                        <SelectItem value="Nepali">{language === 'hi' ? 'नेपाली' : 'Nepali'}</SelectItem>
                        <SelectItem value="Sanskrit">{language === 'hi' ? 'संस्कृत' : 'Sanskrit'}</SelectItem>
                        <SelectItem value="Sindhi">{language === 'hi' ? 'सिंधी' : 'Sindhi'}</SelectItem>
                        <SelectItem value="Urdu">{language === 'hi' ? 'उर्दू' : 'Urdu'}</SelectItem>
                        <SelectItem value="Bhojpuri">{language === 'hi' ? 'भोजपुरी' : 'Bhojpuri'}</SelectItem>
                        <SelectItem value="Rajasthani">{language === 'hi' ? 'राजस्थानी' : 'Rajasthani'}</SelectItem>
                        <SelectItem value="Haryanvi">{language === 'hi' ? 'हरियाणवी' : 'Haryanvi'}</SelectItem>
                        <SelectItem value="Maithili">{language === 'hi' ? 'मैथिली' : 'Maithili'}</SelectItem>
                        <SelectItem value="Dogri">{language === 'hi' ? 'डोगरी' : 'Dogri'}</SelectItem>
                        <SelectItem value="Santali">{language === 'hi' ? 'संथाली' : 'Santali'}</SelectItem>
                        <SelectItem value="Bodo">{language === 'hi' ? 'बोडो' : 'Bodo'}</SelectItem>
                        <SelectItem value="Other">{language === 'hi' ? 'अन्य' : 'Other'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caste">{language === 'hi' ? 'जाति (वैकल्पिक)' : 'Caste (Optional)'}</Label>
                    <Input
                      id="caste"
                      placeholder={language === 'hi' ? 'यदि ज्ञात हो' : 'If known'}
                      value={formData.caste}
                      onChange={(e) => updateField('caste', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">{language === 'hi' ? 'वैवाहिक स्थिति' : 'Marital Status'} *</Label>
                    <Select onValueChange={(value: MaritalStatus) => updateField('maritalStatus', value)} value={formData.maritalStatus || ''}>
                      <SelectTrigger id="maritalStatus" className="w-full">
                        <SelectValue placeholder={t.fields.select} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="never-married">{language === 'hi' ? 'अविवाहित' : 'Never Married'}</SelectItem>
                        <SelectItem value="divorced">{language === 'hi' ? 'तलाकशुदा' : 'Divorced'}</SelectItem>
                        <SelectItem value="widowed">{language === 'hi' ? 'विधुर/विधवा' : 'Widowed'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">{language === 'hi' ? 'ऊंचाई' : 'Height'} *</Label>
                    <Select onValueChange={(value) => updateField('height', value)} value={formData.height || ''}>
                      <SelectTrigger id="height" className="w-full">
                        <SelectValue placeholder={language === 'hi' ? 'ऊंचाई चुनें' : 'Select Height'} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] max-h-60" position="popper" sideOffset={4}>
                        <SelectItem value="4'0&quot; (122 cm)">4'0" (122 cm)</SelectItem>
                        <SelectItem value="4'1&quot; (124 cm)">4'1" (124 cm)</SelectItem>
                        <SelectItem value="4'2&quot; (127 cm)">4'2" (127 cm)</SelectItem>
                        <SelectItem value="4'3&quot; (130 cm)">4'3" (130 cm)</SelectItem>
                        <SelectItem value="4'4&quot; (132 cm)">4'4" (132 cm)</SelectItem>
                        <SelectItem value="4'5&quot; (135 cm)">4'5" (135 cm)</SelectItem>
                        <SelectItem value="4'6&quot; (137 cm)">4'6" (137 cm)</SelectItem>
                        <SelectItem value="4'7&quot; (140 cm)">4'7" (140 cm)</SelectItem>
                        <SelectItem value="4'8&quot; (142 cm)">4'8" (142 cm)</SelectItem>
                        <SelectItem value="4'9&quot; (145 cm)">4'9" (145 cm)</SelectItem>
                        <SelectItem value="4'10&quot; (147 cm)">4'10" (147 cm)</SelectItem>
                        <SelectItem value="4'11&quot; (150 cm)">4'11" (150 cm)</SelectItem>
                        <SelectItem value="5'0&quot; (152 cm)">5'0" (152 cm)</SelectItem>
                        <SelectItem value="5'1&quot; (155 cm)">5'1" (155 cm)</SelectItem>
                        <SelectItem value="5'2&quot; (157 cm)">5'2" (157 cm)</SelectItem>
                        <SelectItem value="5'3&quot; (160 cm)">5'3" (160 cm)</SelectItem>
                        <SelectItem value="5'4&quot; (163 cm)">5'4" (163 cm)</SelectItem>
                        <SelectItem value="5'5&quot; (165 cm)">5'5" (165 cm)</SelectItem>
                        <SelectItem value="5'6&quot; (168 cm)">5'6" (168 cm)</SelectItem>
                        <SelectItem value="5'7&quot; (170 cm)">5'7" (170 cm)</SelectItem>
                        <SelectItem value="5'8&quot; (173 cm)">5'8" (173 cm)</SelectItem>
                        <SelectItem value="5'9&quot; (175 cm)">5'9" (175 cm)</SelectItem>
                        <SelectItem value="5'10&quot; (178 cm)">5'10" (178 cm)</SelectItem>
                        <SelectItem value="5'11&quot; (180 cm)">5'11" (180 cm)</SelectItem>
                        <SelectItem value="6'0&quot; (183 cm)">6'0" (183 cm)</SelectItem>
                        <SelectItem value="6'1&quot; (185 cm)">6'1" (185 cm)</SelectItem>
                        <SelectItem value="6'2&quot; (188 cm)">6'2" (188 cm)</SelectItem>
                        <SelectItem value="6'3&quot; (191 cm)">6'3" (191 cm)</SelectItem>
                        <SelectItem value="6'4&quot; (193 cm)">6'4" (193 cm)</SelectItem>
                        <SelectItem value="6'5&quot; (196 cm)">6'5" (196 cm)</SelectItem>
                        <SelectItem value="6'6&quot; (198 cm)">6'6" (198 cm)</SelectItem>
                        <SelectItem value="6'7&quot; (201 cm)">6'7" (201 cm)</SelectItem>
                        <SelectItem value="6'8&quot; (203 cm)">6'8" (203 cm)</SelectItem>
                        <SelectItem value="6'9&quot; (206 cm)">6'9" (206 cm)</SelectItem>
                        <SelectItem value="6'10&quot; (208 cm)">6'10" (208 cm)</SelectItem>
                        <SelectItem value="6'11&quot; (211 cm)">6'11" (211 cm)</SelectItem>
                        <SelectItem value="7'0&quot; (213 cm)">7'0" (213 cm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">{language === 'hi' ? 'वजन (वैकल्पिक)' : 'Weight (Optional)'}</Label>
                    <Select onValueChange={(value) => updateField('weight', value)} value={formData.weight || ''}>
                      <SelectTrigger id="weight" className="w-full">
                        <SelectValue placeholder={language === 'hi' ? 'वजन चुनें' : 'Select Weight'} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] max-h-60" position="popper" sideOffset={4}>
                        <SelectItem value="40 kg (88 lbs)">40 kg (88 lbs)</SelectItem>
                        <SelectItem value="45 kg (99 lbs)">45 kg (99 lbs)</SelectItem>
                        <SelectItem value="50 kg (110 lbs)">50 kg (110 lbs)</SelectItem>
                        <SelectItem value="55 kg (121 lbs)">55 kg (121 lbs)</SelectItem>
                        <SelectItem value="60 kg (132 lbs)">60 kg (132 lbs)</SelectItem>
                        <SelectItem value="65 kg (143 lbs)">65 kg (143 lbs)</SelectItem>
                        <SelectItem value="70 kg (154 lbs)">70 kg (154 lbs)</SelectItem>
                        <SelectItem value="75 kg (165 lbs)">75 kg (165 lbs)</SelectItem>
                        <SelectItem value="80 kg (176 lbs)">80 kg (176 lbs)</SelectItem>
                        <SelectItem value="85 kg (187 lbs)">85 kg (187 lbs)</SelectItem>
                        <SelectItem value="90 kg (198 lbs)">90 kg (198 lbs)</SelectItem>
                        <SelectItem value="95 kg (209 lbs)">95 kg (209 lbs)</SelectItem>
                        <SelectItem value="100 kg (220 lbs)">100 kg (220 lbs)</SelectItem>
                        <SelectItem value="105 kg (231 lbs)">105 kg (231 lbs)</SelectItem>
                        <SelectItem value="110 kg (243 lbs)">110 kg (243 lbs)</SelectItem>
                        <SelectItem value="115 kg (254 lbs)">115 kg (254 lbs)</SelectItem>
                        <SelectItem value="120 kg (265 lbs)">120 kg (265 lbs)</SelectItem>
                        <SelectItem value="125+ kg (275+ lbs)">125+ kg (275+ lbs)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="horoscopeMatching">{language === 'hi' ? 'कुंडली मिलान' : 'Horoscope Matching'} *</Label>
                    <Select 
                      value={formData.horoscopeMatching || 'not-mandatory'} 
                      onValueChange={(value: 'mandatory' | 'not-mandatory' | 'decide-later') => updateField('horoscopeMatching', value)}
                    >
                      <SelectTrigger id="horoscopeMatching" className="w-full">
                        <SelectValue placeholder={t.fields.select} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="mandatory">{language === 'hi' ? 'अनिवार्य' : 'Mandatory'}</SelectItem>
                        <SelectItem value="not-mandatory">{language === 'hi' ? 'अनिवार्य नहीं' : 'Not Mandatory'}</SelectItem>
                        <SelectItem value="decide-later">{language === 'hi' ? 'बाद में तय करेंगे' : 'Decide Later'}</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.horoscopeMatching === 'mandatory' && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        {language === 'hi' 
                          ? '⚠️ कुंडली मिलान अनिवार्य है - जन्म समय और जन्म स्थान आवश्यक है'
                          : '⚠️ Horoscope matching is mandatory - Birth Time and Birth Place are required'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthTime">
                      {language === 'hi' ? 'जन्म समय' : 'Birth Time'}
                      {formData.horoscopeMatching === 'mandatory' ? ' *' : ` (${language === 'hi' ? 'वैकल्पिक' : 'Optional'})`}
                    </Label>
                    <Input
                      id="birthTime"
                      type="time"
                      placeholder={language === 'hi' ? 'उदाहरण: 10:30 AM' : 'Example: 10:30 AM'}
                      value={formData.birthTime}
                      onChange={(e) => updateField('birthTime', e.target.value)}
                      className={formData.horoscopeMatching === 'mandatory' && !formData.birthTime ? 'border-amber-500' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthPlace">
                      {language === 'hi' ? 'जन्म स्थान' : 'Birth Place'}
                      {formData.horoscopeMatching === 'mandatory' ? ' *' : ` (${language === 'hi' ? 'वैकल्पिक' : 'Optional'})`}
                    </Label>
                    <Input
                      id="birthPlace"
                      placeholder={language === 'hi' ? 'उदाहरण: दिल्ली, जयपुर' : 'Example: Delhi, Jaipur'}
                      value={formData.birthPlace}
                      onChange={(e) => updateField('birthPlace', e.target.value)}
                      className={formData.horoscopeMatching === 'mandatory' && !formData.birthPlace ? 'border-amber-500' : ''}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diet">{language === 'hi' ? 'खान-पान (वैकल्पिक)' : 'Diet (Optional)'}</Label>
                    <Select 
                      value={formData.diet} 
                      onValueChange={(value) => updateField('diet', value)}
                    >
                      <SelectTrigger id="diet" className="w-full">
                        <SelectValue placeholder={t.fields.select} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="veg">{language === 'hi' ? 'शाकाहारी' : 'Vegetarian'}</SelectItem>
                        <SelectItem value="non-veg">{language === 'hi' ? 'मांसाहारी' : 'Non-Vegetarian'}</SelectItem>
                        <SelectItem value="occasionally-non-veg">{language === 'hi' ? 'कभी-कभी मांसाहारी' : 'Occasionally Non-Veg'}</SelectItem>
                        <SelectItem value="jain">{language === 'hi' ? 'जैन' : 'Jain'}</SelectItem>
                        <SelectItem value="vegan">{language === 'hi' ? 'वीगन' : 'Vegan'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="habit">{language === 'hi' ? 'आदतें (वैकल्पिक)' : 'Habits (Optional)'}</Label>
                    <Select 
                      value={formData.habit} 
                      onValueChange={(value) => updateField('habit', value)}
                    >
                      <SelectTrigger id="habit" className="w-full">
                        <SelectValue placeholder={t.fields.select} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="none">{language === 'hi' ? 'कोई नहीं' : 'None'}</SelectItem>
                        <SelectItem value="smoking">{language === 'hi' ? 'धूम्रपान' : 'Smoking'}</SelectItem>
                        <SelectItem value="drinking">{language === 'hi' ? 'शराब' : 'Drinking'}</SelectItem>
                        <SelectItem value="occasionally-drinking">{language === 'hi' ? 'कभी-कभी शराब' : 'Occasionally Drinking'}</SelectItem>
                        <SelectItem value="occasionally-smoking">{language === 'hi' ? 'कभी-कभी धूम्रपान' : 'Occasionally Smoking'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annualIncome">{language === 'hi' ? 'वार्षिक आय (वैकल्पिक)' : 'Annual Income (Optional)'}</Label>
                  <Select 
                    value={formData.annualIncome} 
                    onValueChange={(value) => updateField('annualIncome', value)}
                  >
                    <SelectTrigger id="annualIncome" className="w-full">
                      <SelectValue placeholder={t.fields.select} />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                      <SelectItem value="no-income">{language === 'hi' ? 'कोई आय नहीं' : 'No Income'}</SelectItem>
                      <SelectItem value="below-1-lakh">{language === 'hi' ? '₹1 लाख से कम' : 'Below ₹1 Lakh'}</SelectItem>
                      <SelectItem value="1-2-lakh">{language === 'hi' ? '₹1-2 लाख' : '₹1-2 Lakh'}</SelectItem>
                      <SelectItem value="2-3-lakh">{language === 'hi' ? '₹2-3 लाख' : '₹2-3 Lakh'}</SelectItem>
                      <SelectItem value="3-4-lakh">{language === 'hi' ? '₹3-4 लाख' : '₹3-4 Lakh'}</SelectItem>
                      <SelectItem value="4-5-lakh">{language === 'hi' ? '₹4-5 लाख' : '₹4-5 Lakh'}</SelectItem>
                      <SelectItem value="5-7.5-lakh">{language === 'hi' ? '₹5-7.5 लाख' : '₹5-7.5 Lakh'}</SelectItem>
                      <SelectItem value="7.5-10-lakh">{language === 'hi' ? '₹7.5-10 लाख' : '₹7.5-10 Lakh'}</SelectItem>
                      <SelectItem value="10-15-lakh">{language === 'hi' ? '₹10-15 लाख' : '₹10-15 Lakh'}</SelectItem>
                      <SelectItem value="15-20-lakh">{language === 'hi' ? '₹15-20 लाख' : '₹15-20 Lakh'}</SelectItem>
                      <SelectItem value="20-25-lakh">{language === 'hi' ? '₹20-25 लाख' : '₹20-25 Lakh'}</SelectItem>
                      <SelectItem value="25-35-lakh">{language === 'hi' ? '₹25-35 लाख' : '₹25-35 Lakh'}</SelectItem>
                      <SelectItem value="35-50-lakh">{language === 'hi' ? '₹35-50 लाख' : '₹35-50 Lakh'}</SelectItem>
                      <SelectItem value="50-75-lakh">{language === 'hi' ? '₹50-75 लाख' : '₹50-75 Lakh'}</SelectItem>
                      <SelectItem value="75-1-crore">{language === 'hi' ? '₹75 लाख - 1 करोड़' : '₹75 Lakh - 1 Crore'}</SelectItem>
                      <SelectItem value="above-1-crore">{language === 'hi' ? '₹1 करोड़ से अधिक' : 'Above ₹1 Crore'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="education">{language === 'hi' ? 'शिक्षा' : 'Education'} *</Label>
                  <Input
                    id="education"
                    placeholder={language === 'hi' ? 'उदाहरण: B.Tech, MBA, M.Com' : 'Example: B.Tech, MBA, M.Com'}
                    value={formData.education}
                    onChange={(e) => updateField('education', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">{language === 'hi' ? 'व्यवसाय' : 'Occupation'} *</Label>
                  <Input
                    id="occupation"
                    placeholder={language === 'hi' ? 'उदाहरण: सॉफ्टवेयर इंजीनियर, डॉक्टर, व्यवसायी' : 'Example: Software Engineer, Doctor, Business'}
                    value={formData.occupation}
                    onChange={(e) => updateField('occupation', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profession">{language === 'hi' ? 'पेशा (वैकल्पिक)' : 'Profession (Optional)'}</Label>
                    <Select 
                      value={formData.profession} 
                      onValueChange={(value) => updateField('profession', value)}
                    >
                      <SelectTrigger id="profession" className="w-full">
                        <SelectValue placeholder={t.fields.select} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="business">{language === 'hi' ? 'व्यापार' : 'Business'}</SelectItem>
                        <SelectItem value="self-employed">{language === 'hi' ? 'स्व-रोज़गार' : 'Self-Employed'}</SelectItem>
                        <SelectItem value="govt-service">{language === 'hi' ? 'सरकारी नौकरी' : 'Govt. Service'}</SelectItem>
                        <SelectItem value="pvt-service">{language === 'hi' ? 'प्राइवेट नौकरी' : 'Pvt. Service'}</SelectItem>
                        <SelectItem value="defence">{language === 'hi' ? 'रक्षा सेवा' : 'Defence'}</SelectItem>
                        <SelectItem value="civil-services">{language === 'hi' ? 'सिविल सर्विसेज़' : 'Civil Services'}</SelectItem>
                        <SelectItem value="doctor">{language === 'hi' ? 'डॉक्टर' : 'Doctor'}</SelectItem>
                        <SelectItem value="engineer">{language === 'hi' ? 'इंजीनियर' : 'Engineer'}</SelectItem>
                        <SelectItem value="teacher">{language === 'hi' ? 'शिक्षक' : 'Teacher/Professor'}</SelectItem>
                        <SelectItem value="lawyer">{language === 'hi' ? 'वकील' : 'Lawyer'}</SelectItem>
                        <SelectItem value="ca-cs">{language === 'hi' ? 'CA/CS' : 'CA/CS'}</SelectItem>
                        <SelectItem value="banker">{language === 'hi' ? 'बैंकर' : 'Banker'}</SelectItem>
                        <SelectItem value="it-professional">{language === 'hi' ? 'IT प्रोफेशनल' : 'IT Professional'}</SelectItem>
                        <SelectItem value="student">{language === 'hi' ? 'विद्यार्थी' : 'Student'}</SelectItem>
                        <SelectItem value="homemaker">{language === 'hi' ? 'गृहिणी' : 'Homemaker'}</SelectItem>
                        <SelectItem value="not-working">{language === 'hi' ? 'काम नहीं कर रहे' : 'Not Working'}</SelectItem>
                        <SelectItem value="other">{language === 'hi' ? 'अन्य' : 'Other'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">{language === 'hi' ? 'पद (वैकल्पिक)' : 'Position/Designation (Optional)'}</Label>
                    <Input
                      id="position"
                      placeholder={language === 'hi' ? 'उदाहरण: मैनेजर, डायरेक्टर, टीम लीड' : 'Example: Manager, Director, Team Lead'}
                      value={formData.position}
                      onChange={(e) => updateField('position', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && !showVerification && (
              <div className="space-y-4">
                {/* Country, State, City - in order */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">{language === 'hi' ? 'वर्तमान में रह रहे देश' : 'Living in Country'} *</Label>
                    <Select 
                      value={formData.country || ''} 
                      onValueChange={(value) => {
                        // Update country and clear residential status if switching to India
                        setFormData(prev => ({
                          ...prev,
                          country: value,
                          residentialStatus: value === 'India' ? '' : prev.residentialStatus
                        }))
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={language === 'hi' ? 'देश चुनें' : 'Select Country'} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="item-aligned">
                        <SelectItem value="India">🇮🇳 India</SelectItem>
                        <SelectItem value="United States">🇺🇸 United States</SelectItem>
                        <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                        <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                        <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
                        <SelectItem value="UAE">🇦🇪 UAE</SelectItem>
                        <SelectItem value="Singapore">🇸🇬 Singapore</SelectItem>
                        <SelectItem value="Germany">🇩🇪 Germany</SelectItem>
                        <SelectItem value="New Zealand">🇳🇿 New Zealand</SelectItem>
                        <SelectItem value="Saudi Arabia">🇸🇦 Saudi Arabia</SelectItem>
                        <SelectItem value="Qatar">🇶🇦 Qatar</SelectItem>
                        <SelectItem value="Kuwait">🇰🇼 Kuwait</SelectItem>
                        <SelectItem value="Oman">🇴🇲 Oman</SelectItem>
                        <SelectItem value="Bahrain">🇧🇭 Bahrain</SelectItem>
                        <SelectItem value="Malaysia">🇲🇾 Malaysia</SelectItem>
                        <SelectItem value="Netherlands">🇳🇱 Netherlands</SelectItem>
                        <SelectItem value="France">🇫🇷 France</SelectItem>
                        <SelectItem value="Ireland">🇮🇪 Ireland</SelectItem>
                        <SelectItem value="Switzerland">🇨🇭 Switzerland</SelectItem>
                        <SelectItem value="Japan">🇯🇵 Japan</SelectItem>
                        <SelectItem value="South Korea">🇰🇷 South Korea</SelectItem>
                        <SelectItem value="Hong Kong">🇭🇰 Hong Kong</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">{language === 'hi' ? 'राज्य/प्रांत' : 'State/Province'} *</Label>
                    <Input
                      id="state"
                      placeholder={language === 'hi' ? 'उदाहरण: महाराष्ट्र, कैलिफोर्निया' : 'Example: Maharashtra, California'}
                      value={formData.state || ''}
                      onChange={(e) => updateField('state', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">{language === 'hi' ? 'शहर' : 'City'} *</Label>
                    <Input
                      id="location"
                      placeholder={language === 'hi' ? 'उदाहरण: मुंबई, न्यूयॉर्क' : 'Example: Mumbai, New York'}
                      value={formData.location || ''}
                      onChange={(e) => updateField('location', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Residential Status - Only show if country is not India */}
                {formData.country && formData.country !== 'India' && (
                  <div className="space-y-2">
                    <Label htmlFor="residentialStatus">
                      {language === 'hi' ? 'निवास स्थिति' : 'Residential Status'} *
                    </Label>
                    <Select 
                      value={formData.residentialStatus} 
                      onValueChange={(value) => updateField('residentialStatus', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'hi' ? 'निवास स्थिति चुनें' : 'Select Residential Status'} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="citizen">
                          {language === 'hi' ? '🛂 नागरिक (Citizen)' : '🛂 Citizen'}
                        </SelectItem>
                        <SelectItem value="permanent-resident">
                          {language === 'hi' ? '🏠 स्थायी निवासी (PR)' : '🏠 Permanent Resident (PR)'}
                        </SelectItem>
                        <SelectItem value="work-permit">
                          {language === 'hi' ? '💼 वर्क परमिट / वर्क वीसा' : '💼 Work Permit / Work Visa'}
                        </SelectItem>
                        <SelectItem value="student-visa">
                          {language === 'hi' ? '🎓 स्टूडेंट वीसा' : '🎓 Student Visa'}
                        </SelectItem>
                        <SelectItem value="dependent-visa">
                          {language === 'hi' ? '👨‍👩‍👧 डिपेंडेंट वीसा' : '👨‍👩‍👧 Dependent Visa'}
                        </SelectItem>
                        <SelectItem value="oci">
                          {language === 'hi' ? '🇮🇳 OCI (भारत का विदेशी नागरिक)' : '🇮🇳 OCI (Overseas Citizen of India)'}
                        </SelectItem>
                        <SelectItem value="applied-for-pr">
                          {language === 'hi' ? '📝 PR के लिए आवेदन किया' : '📝 Applied for PR'}
                        </SelectItem>
                        <SelectItem value="applied-for-citizenship">
                          {language === 'hi' ? '📝 नागरिकता के लिए आवेदन किया' : '📝 Applied for Citizenship'}
                        </SelectItem>
                        <SelectItem value="temporary-visa">
                          {language === 'hi' ? '⏳ अस्थायी वीसा' : '⏳ Temporary Visa'}
                        </SelectItem>
                        <SelectItem value="tourist-visa">
                          {language === 'hi' ? '✈️ टूरिस्ट/विजिटर वीसा' : '✈️ Tourist/Visitor Visa'}
                        </SelectItem>
                        <SelectItem value="other">
                          {language === 'hi' ? '📋 अन्य' : '📋 Other'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {language === 'hi' 
                        ? 'विदेश में रहने वालों के लिए निवास स्थिति बताना आवश्यक है'
                        : 'Residential status is required for those living outside India'}
                    </p>
                  </div>
                )}

                {/* Email and Mobile - Locked in edit mode */}
                {isEditMode && (
                  <Alert className="bg-gray-50 border-gray-400 dark:bg-gray-950/30">
                    <ShieldCheck size={20} weight="fill" className="text-gray-600" />
                    <AlertDescription className="text-gray-700 dark:text-gray-300">
                      {language === 'hi' 
                        ? 'ईमेल और मोबाइल संपादित नहीं किए जा सकते। इन्हें पंजीकरण के समय सत्यापित किया गया था। बदलने के लिए एडमिन से संपर्क करें।'
                        : 'Email and Mobile cannot be edited. These were verified during registration. Contact admin to change.'}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">
                    {language === 'hi' ? 'ईमेल' : 'Email'} *
                    {isEditMode && (
                      <span className="ml-2 text-xs text-gray-500">
                        🔒 {language === 'hi' ? 'सत्यापित' : 'Verified'}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    required
                    disabled={isEditMode}
                    className={isEditMode ? 'bg-muted' : ''}
                  />
                  {isEditMode && (
                    <p className="text-xs text-gray-600">
                      {language === 'hi' ? 'ईमेल बदलने के लिए एडमिन से संपर्क करें' : 'Contact admin to change email'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">
                    {language === 'hi' ? 'मोबाइल' : 'Mobile'} *
                    {isEditMode && (
                      <span className="ml-2 text-xs text-gray-500">
                        🔒 {language === 'hi' ? 'सत्यापित' : 'Verified'}
                      </span>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Select 
                      onValueChange={(value) => updateField('countryCode', value)} 
                      value={formData.countryCode}
                      disabled={isEditMode}
                    >
                      <SelectTrigger className={`w-[100px] ${isEditMode ? 'bg-muted' : ''}`}>
                        <SelectValue placeholder="+91" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="+91">+91 🇮🇳</SelectItem>
                        <SelectItem value="+1">+1 🇺🇸</SelectItem>
                        <SelectItem value="+44">+44 🇬🇧</SelectItem>
                        <SelectItem value="+971">+971 🇦🇪</SelectItem>
                        <SelectItem value="+65">+65 🇸🇬</SelectItem>
                        <SelectItem value="+61">+61 🇦🇺</SelectItem>
                        <SelectItem value="+49">+49 🇩🇪</SelectItem>
                        <SelectItem value="+33">+33 🇫🇷</SelectItem>
                        <SelectItem value="+81">+81 🇯🇵</SelectItem>
                        <SelectItem value="+86">+86 🇨🇳</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder={language === 'hi' ? `${getPhoneLengthInfo(formData.countryCode || '+91').display} अंक का मोबाइल नंबर` : `${getPhoneLengthInfo(formData.countryCode || '+91').display} digit mobile number`}
                      value={formData.mobile || ''}
                      onChange={(e) => {
                        const maxLength = getPhoneLengthInfo(formData.countryCode || '+91').max
                        const value = e.target.value.replace(/\D/g, '').slice(0, maxLength)
                        updateField('mobile', value)
                      }}
                      maxLength={getPhoneLengthInfo(formData.countryCode || '+91').max}
                      required
                      disabled={isEditMode}
                      className={`flex-1 ${isEditMode ? 'bg-muted' : ''}`}
                    />
                  </div>
                  {isEditMode && (
                    <p className="text-xs text-gray-600">
                      {language === 'hi' ? 'मोबाइल बदलने के लिए एडमिन से संपर्क करें' : 'Contact admin to change mobile'}
                    </p>
                  )}
                  {!isEditMode && formData.mobile && !isValidPhoneLength(formData.mobile, formData.countryCode || '+91') && (
                    <p className="text-xs text-destructive">
                      {language === 'hi' ? `कृपया ${getPhoneLengthInfo(formData.countryCode || '+91').display} अंक का मोबाइल नंबर दर्ज करें` : `Please enter a ${getPhoneLengthInfo(formData.countryCode || '+91').display} digit mobile number`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && showVerification && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <CheckCircle size={48} weight="fill" className="text-teal mx-auto mb-2" />
                  <h3 className="text-xl font-bold mb-1">
                    {language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'hi' 
                      ? 'आपके ईमेल और मोबाइल पर OTP भेजा गया है' 
                      : 'OTPs have been sent to your email and mobile'}
                  </p>
                </div>

                <Alert className="bg-primary/5 border-primary/20">
                  <Info size={18} />
                  <AlertDescription className="text-sm">
                    <strong>{language === 'hi' ? 'डेमो के लिए:' : 'For Demo:'}</strong>{' '}
                    {language === 'hi' 
                      ? 'OTP ऊपर toast सूचना में दिखाए गए हैं' 
                      : 'OTPs are shown in the toast notification above'}
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="emailOtp" className="text-base font-semibold">
                      {language === 'hi' ? 'ईमेल OTP' : 'Email OTP'}
                    </Label>
                    <div className="space-y-2">
                      <Input
                        id="emailOtp"
                        placeholder="000000"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        maxLength={6}
                        className="text-center text-lg tracking-widest font-mono"
                        disabled={emailVerified}
                      />
                      {emailVerified && (
                        <div className="flex items-center gap-2 text-sm text-teal">
                          <CheckCircle size={16} weight="fill" />
                          {language === 'hi' ? 'ईमेल सत्यापित' : 'Email Verified'}
                        </div>
                      )}
                      {!emailVerified && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={verifyEmailOtp}
                          disabled={emailOtp.length !== 6}
                          className="w-full"
                        >
                          {language === 'hi' ? 'ईमेल OTP सत्यापित करें' : 'Verify Email OTP'}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === 'hi' ? 'भेजा गया:' : 'Sent to:'} {formData.email}
                    </p>
                    {!emailVerified && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => sendOtps(true, false)}
                        className="text-xs p-0 h-auto"
                      >
                        {language === 'hi' ? 'ईमेल OTP पुनः भेजें' : 'Resend Email OTP'}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="mobileOtp" className="text-base font-semibold">
                      {language === 'hi' ? 'मोबाइल OTP' : 'Mobile OTP'}
                    </Label>
                    <div className="space-y-2">
                      <Input
                        id="mobileOtp"
                        placeholder="000000"
                        value={mobileOtp}
                        onChange={(e) => setMobileOtp(e.target.value)}
                        maxLength={6}
                        className="text-center text-lg tracking-widest font-mono"
                        disabled={mobileVerified}
                      />
                      {mobileVerified && (
                        <div className="flex items-center gap-2 text-sm text-teal">
                          <CheckCircle size={16} weight="fill" />
                          {language === 'hi' ? 'मोबाइल सत्यापित' : 'Mobile Verified'}
                        </div>
                      )}
                      {!mobileVerified && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={verifyMobileOtp}
                          disabled={mobileOtp.length !== 6}
                          className="w-full"
                        >
                          {language === 'hi' ? 'मोबाइल OTP सत्यापित करें' : 'Verify Mobile OTP'}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === 'hi' ? 'भेजा गया:' : 'Sent to:'} {formData.mobile}
                    </p>
                    {!mobileVerified && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => sendOtps(false, true)}
                        className="text-xs p-0 h-auto"
                      >
                        {language === 'hi' ? 'मोबाइल OTP पुनः भेजें' : 'Resend Mobile OTP'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={handleVerificationComplete}
                    disabled={!emailVerified || !mobileVerified}
                    className="w-full"
                  >
                    {language === 'hi' ? 'सत्यापन पूर्ण करें और जारी रखें' : 'Complete Verification & Continue'}
                  </Button>
                </div>

                {/* Show Resend All OTPs button only if both are not verified */}
                {!emailVerified && !mobileVerified && (
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => sendOtps()}
                      className="text-sm"
                    >
                      {language === 'hi' ? 'दोनों OTP पुनः भेजें' : 'Resend Both OTPs'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                {/* Multiple Photos Upload Section */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Image size={20} weight="bold" />
                    {language === 'hi' ? 'फोटो अपलोड करें (1-3 फोटो अनिवार्य)' : 'Upload Photos (1-3 photos required)'} *
                  </Label>
                  
                  <Alert className="bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700">
                    <Warning size={16} className="text-amber-600" />
                    <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                      {language === 'hi' 
                        ? '⏰ कृपया हाल की फोटो अपलोड करें। फोटो 6 महीने से अधिक पुरानी नहीं होनी चाहिए।'
                        : '⏰ Please upload recent photographs. Photos should not be more than 6 months old.'}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {/* Existing Photos */}
                    {photos.map((photo, index) => (
                      <div key={index} className="relative border-2 border-border rounded-lg p-1 aspect-square group">
                        <img 
                          src={photo.preview} 
                          alt={`Photo ${index + 1}`} 
                          className="w-full h-full object-cover rounded-md cursor-pointer transition-opacity group-hover:opacity-90"
                          onClick={() => openLightbox(photos.map(p => p.preview), index)}
                          title={language === 'hi' ? 'बड़ा देखने के लिए क्लिक करें' : 'Click to view larger'}
                        />
                        <div className="absolute top-1 right-1 flex gap-1">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 bg-background/80 hover:bg-background"
                            onClick={() => removePhoto(index)}
                            disabled={photos.length <= 1}
                            title={language === 'hi' ? 'हटाएं' : 'Delete'}
                          >
                            <X size={14} weight="bold" />
                          </Button>
                        </div>
                        <div className="absolute bottom-1 left-1 flex gap-1">
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-6 w-6 bg-background/80 hover:bg-background"
                              onClick={() => movePhoto(index, 'up')}
                              title={language === 'hi' ? 'ऊपर ले जाएं' : 'Move up'}
                            >
                              <ArrowUp size={14} weight="bold" />
                            </Button>
                          )}
                          {index < photos.length - 1 && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-6 w-6 bg-background/80 hover:bg-background"
                              onClick={() => movePhoto(index, 'down')}
                              title={language === 'hi' ? 'नीचे ले जाएं' : 'Move down'}
                            >
                              <ArrowDown size={14} weight="bold" />
                            </Button>
                          )}
                        </div>
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Photo Slot */}
                    {photos.length < 3 && (
                      <label className="border-2 border-dashed border-border rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                        <Image size={32} weight="light" className="text-muted-foreground/50 mb-2" />
                        <span className="text-xs text-muted-foreground">
                          {language === 'hi' ? 'फोटो जोड़ें' : 'Add Photo'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({photos.length}/3)
                        </span>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                          multiple
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'hi' 
                      ? 'पहली फोटो मुख्य प्रोफाइल फोटो होगी। तीर बटन से क्रम बदलें।' 
                      : 'First photo will be the main profile photo. Use arrow buttons to reorder.'}
                  </p>
                </div>

                {/* Live Selfie Capture Section */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Camera size={20} weight="bold" />
                    {language === 'hi' ? 'लाइव सेल्फी लें (पहचान सत्यापन के लिए)' : 'Capture Live Selfie (for identity verification)'} *
                  </Label>
                  
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 bg-muted/20">
                    <div className="relative aspect-video max-w-md mx-auto rounded-lg overflow-hidden bg-black">
                      {selfiePreview ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={selfiePreview} 
                            alt="Captured Selfie" 
                            className="w-full h-full object-cover"
                          />
                          {/* Show coverage info on captured image */}
                          {faceCoveragePercent > 0 && !faceCoverageValid && (
                            <div className="absolute inset-0 border-4 border-amber-400 pointer-events-none">
                              <div className="absolute top-2 left-2 right-2 bg-amber-500/90 text-white text-xs px-2 py-1 rounded text-center">
                                {language === 'hi' 
                                  ? `चेहरा ${faceCoveragePercent}% - कृपया लाइव ज़ूम के साथ दोबारा लें (50% आवश्यक)`
                                  : `Face ${faceCoveragePercent}% - Please retake with live zoom (50% required)`}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : showCamera ? (
                        <div className="relative w-full h-full overflow-hidden">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline
                            className="w-full h-full object-cover transition-transform"
                            style={{ transform: `scaleX(-1) scale(${liveZoom})` }}
                          />
                          {/* Face guide overlay - shows oval for face positioning */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-48 h-64 border-4 border-dashed border-white/60 rounded-full flex items-center justify-center">
                              <div className="text-white/80 text-xs text-center bg-black/40 px-2 py-1 rounded">
                                {language === 'hi' ? 'चेहरा यहां रखें' : 'Position face here'}
                              </div>
                            </div>
                          </div>
                          {/* Live Zoom Slider */}
                          <div className="absolute bottom-2 left-2 right-2 bg-black/70 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-xs whitespace-nowrap">
                                {language === 'hi' ? 'ज़ूम:' : 'Zoom:'}
                              </span>
                              <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.1"
                                value={liveZoom}
                                onChange={(e) => setLiveZoom(parseFloat(e.target.value))}
                                className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                              />
                              <span className="text-white text-xs font-medium w-10">{Math.round(liveZoom * 100)}%</span>
                            </div>
                            <p className="text-white/80 text-xs mt-1 text-center">
                              {language === 'hi' ? 'चेहरा 50% तक दिखने के लिए ज़ूम करें' : 'Zoom until face covers 50% of frame'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                          <Camera size={64} weight="light" className="opacity-30 mb-2" />
                          <p className="text-sm">{language === 'hi' ? 'कैमरा प्रीव्यू यहां दिखेगा' : 'Camera preview will appear here'}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-center gap-3 mt-4">
                      {selfiePreview ? (
                        /* Preview mode - just show retake button */
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setSelfieFile(null)
                            setSelfiePreview(undefined)
                            setSelfieZoom(1)
                            setLiveZoom(1)
                          }}
                          className="gap-2"
                        >
                          <Camera size={16} />
                          {language === 'hi' ? 'दोबारा लें' : 'Retake'}
                        </Button>
                      ) : showCamera ? (
                        <>
                          <Button 
                            type="button" 
                            onClick={capturePhoto}
                            disabled={!isCameraReady}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                          >
                            <Camera size={16} weight="bold" />
                            {language === 'hi' ? 'कैप्चर करें' : 'Capture'}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={stopCamera}
                          >
                            {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                          </Button>
                          {/* Switch Camera button - shown when multiple cameras available */}
                          {availableCameras.length > 1 && (
                            <Button 
                              type="button" 
                              variant="secondary"
                              onClick={() => {
                                // Cycle to next camera
                                const currentIndex = availableCameras.findIndex(c => c.deviceId === selectedCameraId)
                                const nextIndex = (currentIndex + 1) % availableCameras.length
                                switchCamera(availableCameras[nextIndex].deviceId)
                              }}
                              className="gap-2"
                            >
                              🔄 {language === 'hi' ? 'कैमरा बदलें' : 'Switch Camera'}
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button 
                          type="button" 
                          onClick={() => startCamera()}
                          className="gap-2"
                        >
                          <Camera size={16} weight="bold" />
                          {language === 'hi' ? 'कैमरा शुरू करें' : 'Start Camera'}
                        </Button>
                      )}
                    </div>
                    
                    {/* Camera source selector - dropdown for selecting specific camera */}
                    {showCamera && availableCameras.length > 1 && (
                      <div className="flex flex-col items-center gap-2 mt-3">
                        <p className="text-xs text-muted-foreground">
                          {language === 'hi' 
                            ? `${availableCameras.length} कैमरे उपलब्ध हैं - नीचे से चुनें` 
                            : `${availableCameras.length} cameras available - select below`}
                        </p>
                        <Select value={selectedCameraId} onValueChange={switchCamera}>
                          <SelectTrigger className="w-72">
                            <SelectValue placeholder={language === 'hi' ? 'कैमरा चुनें' : 'Select Camera'} />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            {availableCameras.map((camera, index) => (
                              <SelectItem key={camera.deviceId} value={camera.deviceId}>
                                {camera.label || (language === 'hi' ? `कैमरा ${index + 1}` : `Camera ${index + 1}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {/* Show message when only one camera is available */}
                    {showCamera && availableCameras.length === 1 && (
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        {language === 'hi' 
                          ? `कैमरा: ${availableCameras[0]?.label || 'डिफ़ॉल्ट कैमरा'}` 
                          : `Camera: ${availableCameras[0]?.label || 'Default Camera'}`}
                      </p>
                    )}
                    
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  
                  <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                    <Info size={16} />
                    <AlertDescription className="text-xs">
                      {language === 'hi' 
                        ? 'चेहरा फ्रेम का कम से कम 50% होना चाहिए। सेल्फी का उपयोग AI द्वारा पहचान सत्यापन के लिए किया जाएगा।' 
                        : 'Face must cover at least 50% of the frame. Selfie will be used for AI identity verification.'}
                    </AlertDescription>
                  </Alert>
                  
                  {/* Face coverage indicator */}
                  {faceCoveragePercent > 0 && (
                    <div className={`flex items-center gap-2 text-sm ${faceCoverageValid ? 'text-green-600' : 'text-amber-600'}`}>
                      {faceCoverageValid ? (
                        <CheckCircle size={16} weight="fill" />
                      ) : (
                        <Warning size={16} weight="fill" />
                      )}
                      {language === 'hi' 
                        ? `चेहरा कवरेज: ${faceCoveragePercent}% ${faceCoverageValid ? '✓' : '(50% आवश्यक)'}` 
                        : `Face coverage: ${faceCoveragePercent}% ${faceCoverageValid ? '✓' : '(50% required)'}`}
                    </div>
                  )}
                </div>

                {/* Photo Lightbox for viewing uploaded photos */}
                {photos.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      {language === 'hi' ? 'पूर्ण आकार में देखने के लिए फोटो पर क्लिक करें' : 'Click on a photo to view full size'}
                    </p>
                  </div>
                )}

                {/* Government ID Proof Upload Section - Mandatory */}
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <IdentificationCard size={24} weight="bold" className="text-blue-600" />
                    <Label className="text-lg font-semibold">
                      {language === 'hi' ? 'सरकारी पहचान प्रमाण अपलोड करें' : 'Upload Government ID Proof'} *
                      {isEditMode && (
                        <span className="ml-2 text-xs text-gray-500 font-normal">
                          🔒 {language === 'hi' ? 'स्थायी' : 'Permanent'}
                        </span>
                      )}
                    </Label>
                  </div>
                  
                  {/* In Edit Mode - Show locked message */}
                  {isEditMode ? (
                    <Alert className="bg-gray-50 border-gray-400 dark:bg-gray-950/30">
                      <ShieldCheck size={20} weight="fill" className="text-gray-600" />
                      <AlertDescription className="text-gray-700 dark:text-gray-300">
                        {language === 'hi' 
                          ? 'पहचान प्रमाण संपादित नहीं किया जा सकता। यह पंजीकरण के समय सत्यापन के लिए जमा किया गया था।'
                          : 'ID Proof cannot be edited. It was submitted during registration for verification.'}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-orange-50 border-orange-300 dark:bg-orange-950/20 dark:border-orange-700">
                      <Warning size={18} className="text-orange-600" />
                      <AlertDescription className="text-orange-700 dark:text-orange-400">
                        {language === 'hi' 
                          ? 'नाम और जन्म तिथि सत्यापन के लिए सरकारी पहचान पत्र अनिवार्य है। यह केवल सत्यापन के लिए है और अन्य उपयोगकर्ताओं को नहीं दिखाया जाएगा।'
                          : 'Government ID is mandatory for name and DOB verification. This is for verification only and will NOT be shown to other users.'}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Only show ID proof upload controls in new registration mode */}
                  {!isEditMode && (
                    <>
                      <div className="space-y-3">
                        <Label>{language === 'hi' ? 'दस्तावेज़ का प्रकार चुनें' : 'Select Document Type'} *</Label>
                        <Select 
                          value={idProofType} 
                          onValueChange={(value: 'aadhaar' | 'pan' | 'driving-license' | 'passport' | 'voter-id') => setIdProofType(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={language === 'hi' ? 'दस्तावेज़ प्रकार चुनें' : 'Select document type'} />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            <SelectItem value="aadhaar">{language === 'hi' ? 'आधार कार्ड' : 'Aadhaar Card'}</SelectItem>
                            <SelectItem value="pan">{language === 'hi' ? 'पैन कार्ड' : 'PAN Card'}</SelectItem>
                            <SelectItem value="driving-license">{language === 'hi' ? 'ड्राइविंग लाइसेंस' : 'Driving License'}</SelectItem>
                            <SelectItem value="passport">{language === 'hi' ? 'पासपोर्ट' : 'Passport'}</SelectItem>
                            <SelectItem value="voter-id">{language === 'hi' ? 'मतदाता पहचान पत्र' : 'Voter ID'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        {idProofPreview ? (
                          <div className="space-y-3">
                            <div className="relative inline-block">
                              <img 
                                src={idProofPreview} 
                                alt="ID Proof" 
                                className="max-h-48 object-contain rounded-lg mx-auto border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={() => {
                                  setIdProofFile(null)
                                  setIdProofPreview(null)
                                }}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-green-600">
                              <CheckCircle size={20} weight="fill" />
                              <span className="text-sm font-medium">
                                {language === 'hi' ? 'पहचान प्रमाण अपलोड किया गया' : 'ID Proof uploaded'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setIdProofFile(file)
                                  const reader = new FileReader()
                                  reader.onload = (event) => {
                                    setIdProofPreview(event.target?.result as string)
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }}
                            />
                            <div className="space-y-2">
                              <Upload size={40} weight="light" className="mx-auto text-muted-foreground/50" />
                              <p className="text-sm text-muted-foreground">
                                {language === 'hi' ? 'पहचान पत्र की फोटो अपलोड करने के लिए क्लिक करें' : 'Click to upload ID proof photo'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {language === 'hi' ? 'नाम और जन्म तिथि स्पष्ट दिखनी चाहिए' : 'Name and DOB must be clearly visible'}
                              </p>
                            </div>
                          </label>
                        )}
                      </div>

                      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                        <Info size={16} />
                        <AlertDescription className="text-xs">
                          {language === 'hi' 
                            ? '• पहचान पत्र में आपका नाम और जन्म तिथि स्पष्ट दिखनी चाहिए\n• यह जानकारी केवल एडमिन सत्यापन के लिए है\n• गलत दस्तावेज़ देने पर प्रोफाइल अस्वीकार हो सकती है'
                            : '• Name and DOB must be clearly visible on the ID\n• This information is for admin verification only\n• Profile may be rejected for incorrect documents'}
                        </AlertDescription>
                      </Alert>
                    </>
                  )}

                  {/* In edit mode, show existing ID proof info (read-only) */}
                  {isEditMode && editProfile?.idProofType && (
                    <div className="border-2 border-gray-300 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={24} weight="fill" className="text-green-600" />
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">
                            {language === 'hi' ? 'पहचान प्रमाण:' : 'ID Proof:'} {{
                              'aadhaar': language === 'hi' ? 'आधार कार्ड' : 'Aadhaar Card',
                              'pan': language === 'hi' ? 'पैन कार्ड' : 'PAN Card',
                              'driving-license': language === 'hi' ? 'ड्राइविंग लाइसेंस' : 'Driving License',
                              'passport': language === 'hi' ? 'पासपोर्ट' : 'Passport',
                              'voter-id': language === 'hi' ? 'मतदाता पहचान पत्र' : 'Voter ID'
                            }[editProfile.idProofType] || editProfile.idProofType}
                          </p>
                          <p className="text-sm text-gray-500">
                            {editProfile.idProofVerified 
                              ? (language === 'hi' ? '✅ सत्यापित' : '✅ Verified')
                              : (language === 'hi' ? '⏳ सत्यापन लंबित' : '⏳ Verification pending')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bio" className="flex items-center gap-2">
                      {language === 'hi' ? 'अपने बारे में' : 'About Yourself'} *
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateBio}
                      disabled={isGeneratingBio}
                      className="gap-2 text-primary border-primary/50 hover:bg-primary/10"
                    >
                      {isGeneratingBio ? (
                        <SpinnerGap size={16} className="animate-spin" />
                      ) : (
                        <Sparkle size={16} weight="fill" />
                      )}
                      {language === 'hi' ? 'AI से बनाएं' : 'Generate with AI'}
                    </Button>
                  </div>
                  <Textarea
                    id="bio"
                    placeholder={language === 'hi' 
                      ? 'अपने बारे में, अपनी रुचियों, व्यक्तित्व और जीवन के लक्ष्यों के बारे में लिखें...' 
                      : 'Write about yourself, your interests, personality and life goals...'}
                    value={formData.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    rows={6}
                    className={!(formData.bio || '').trim() ? 'border-amber-500' : ''}
                  />
                  {!(formData.bio || '').trim() && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <Warning size={14} />
                      {language === 'hi' ? 'यह फ़ील्ड अनिवार्य है' : 'This field is required'}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {language === 'hi' 
                      ? 'AI बटन दबाएं और हम आपकी जानकारी के आधार पर एक आकर्षक परिचय बनाएंगे। आप इसे संपादित कर सकते हैं।' 
                      : 'Click the AI button and we\'ll create an attractive bio based on your details. You can edit it afterward.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="familyDetails">{t.registration.familyDetailsLabel}</Label>
                  <Textarea
                    id="familyDetails"
                    placeholder={t.registration.familyPlaceholder}
                    value={formData.familyDetails}
                    onChange={(e) => updateField('familyDetails', e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{t.registration.choosePlan}</h3>
                  <p className="text-muted-foreground">{t.registration.affordablePricing}</p>
                </div>

                <RadioGroup value={formData.membershipPlan || ''} onValueChange={(value: MembershipPlan) => updateField('membershipPlan', value)}>
                  <div className="space-y-4">
                    {/* Free Plan - Introductory Offer */}
                    <label htmlFor="free" className="cursor-pointer">
                      <Card className={`border-2 transition-all ${formData.membershipPlan === 'free' ? 'border-green-500 shadow-lg' : 'hover:border-green-500/50'}`}>
                        <CardContent className="pt-6 relative">
                          <div className="absolute top-0 right-4 -translate-y-1/2">
                            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <Gift size={12} weight="bold" />
                              {language === 'hi' ? 'परिचयात्मक ऑफर' : 'Introductory Offer'}
                            </span>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <RadioGroupItem value="free" id="free" />
                              <div className="flex-1">
                                <h4 className="font-bold text-xl mb-2 text-green-600">
                                  {language === 'hi' ? 'मुफ्त योजना (6 महीने)' : 'Free Plan (6 Months)'}
                                </h4>
                                <div className="flex items-baseline gap-2 mb-3">
                                  <span className="text-3xl font-bold text-green-600">₹0</span>
                                  <span className="text-muted-foreground">{language === 'hi' ? '6 महीने के लिए मुफ्त' : 'Free for 6 months'}</span>
                                </div>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-green-500" />
                                    {language === 'hi' ? 'प्रोफाइल बनाएं और देखें' : 'Create and view profiles'}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-green-500" />
                                    {language === 'hi' ? 'रुचि व्यक्त करें' : 'Express interest'}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-green-500" />
                                    {language === 'hi' 
                                      ? `चैट सीमा: ${membershipSettings?.freePlanChatLimit || 5} प्रोफाइल` 
                                      : `Chat limit: ${membershipSettings?.freePlanChatLimit || 5} profiles`}
                                  </li>
                                  <li className="flex items-center gap-2 text-amber-600">
                                    <X size={16} weight="bold" />
                                    {language === 'hi' ? 'संपर्क देखने की सुविधा नहीं' : 'No contact view access'}
                                  </li>
                                  <li className="flex items-center gap-2 text-amber-600">
                                    <X size={16} weight="bold" />
                                    {language === 'hi' ? 'बायोडेटा जनरेट/डाउनलोड नहीं' : 'No biodata generation/download'}
                                  </li>
                                  <li className="flex items-center gap-2 text-amber-600">
                                    <X size={16} weight="bold" />
                                    {language === 'hi' ? 'वेडिंग सर्विसेज एक्सेस नहीं' : 'No Wedding Services access'}
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </label>

                    <label htmlFor="6-month" className="cursor-pointer">
                      <Card className={`border-2 transition-all ${formData.membershipPlan === '6-month' ? 'border-primary shadow-lg' : 'hover:border-primary/50'}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <RadioGroupItem value="6-month" id="6-month" />
                              <div className="flex-1">
                                <h4 className="font-bold text-xl mb-2">{t.registration.plan6Month}</h4>
                                <div className="flex items-baseline gap-2 mb-3">
                                  <CurrencyInr size={24} weight="bold" className="text-primary" />
                                  <span className="text-3xl font-bold text-primary">{membershipSettings?.sixMonthPrice || 500}</span>
                                  <span className="text-muted-foreground">{t.registration.perMonth}</span>
                                </div>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {t.registration.unlimitedProfiles}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' 
                                      ? `चैट सीमा: ${membershipSettings?.sixMonthChatLimit || 50} प्रोफाइल` 
                                      : `Chat limit: ${membershipSettings?.sixMonthChatLimit || 50} profiles`}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' 
                                      ? `संपर्क देखें: ${membershipSettings?.sixMonthContactLimit || 20} प्रोफाइल` 
                                      : `Contact views: ${membershipSettings?.sixMonthContactLimit || 20} profiles`}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {t.registration.volunteerSupport}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' ? 'बायोडेटा जनरेट और डाउनलोड' : 'Biodata generation & download'}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' ? 'वेडिंग सर्विसेज एक्सेस' : 'Wedding Services access'}
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </label>

                    <label htmlFor="1-year" className="cursor-pointer">
                      <Card className={`border-2 transition-all ${formData.membershipPlan === '1-year' ? 'border-accent shadow-lg' : 'hover:border-accent/50'}`}>
                        <CardContent className="pt-6 relative">
                          <div className="absolute top-0 right-4 -translate-y-1/2">
                            <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold">{t.registration.mostPopular}</span>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <RadioGroupItem value="1-year" id="1-year" />
                              <div className="flex-1">
                                <h4 className="font-bold text-xl mb-2">{t.registration.plan1Year}</h4>
                                <div className="flex items-baseline gap-2 mb-3">
                                  <CurrencyInr size={24} weight="bold" className="text-accent" />
                                  <span className="text-3xl font-bold text-accent">{membershipSettings?.oneYearPrice || 900}</span>
                                  <span className="text-muted-foreground">{t.registration.perYear}</span>
                                  <span className="text-sm text-teal font-medium ml-2">{t.registration.savings}</span>
                                </div>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {t.registration.unlimitedProfiles}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' 
                                      ? `चैट सीमा: ${membershipSettings?.oneYearChatLimit || 120} प्रोफाइल` 
                                      : `Chat limit: ${membershipSettings?.oneYearChatLimit || 120} profiles`}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' 
                                      ? `संपर्क देखें: ${membershipSettings?.oneYearContactLimit || 50} प्रोफाइल` 
                                      : `Contact views: ${membershipSettings?.oneYearContactLimit || 50} profiles`}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {t.registration.prioritySupport}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {t.registration.profileHighlight}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' ? 'बायोडेटा जनरेट और डाउनलोड' : 'Biodata generation & download'}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' ? 'वेडिंग सर्विसेज एक्सेस' : 'Wedding Services access'}
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </label>
                  </div>
                </RadioGroup>

                {/* Payment Section - Only for paid plans */}
                {formData.membershipPlan && formData.membershipPlan !== 'free' && (
                  <Card className="border-2 border-primary/30 bg-primary/5">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CurrencyInr size={24} weight="bold" className="text-primary" />
                        <h4 className="font-bold text-lg">
                          {language === 'hi' ? 'भुगतान विवरण' : 'Payment Details'}
                        </h4>
                      </div>
                      
                      <Alert className="bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800">
                        <Info size={18} className="text-amber-600" />
                        <AlertDescription className="text-amber-800 dark:text-amber-200">
                          <strong>
                            {language === 'hi' 
                              ? `कुल राशि: ₹${formData.membershipPlan === '6-month' ? (membershipSettings?.sixMonthPrice || 500) : (membershipSettings?.oneYearPrice || 900)}`
                              : `Total Amount: ₹${formData.membershipPlan === '6-month' ? (membershipSettings?.sixMonthPrice || 500) : (membershipSettings?.oneYearPrice || 900)}`}
                          </strong>
                          <span className="ml-2 text-sm">
                            ({formData.membershipPlan === '6-month' 
                              ? (language === 'hi' ? '6 महीने' : '6 months') 
                              : (language === 'hi' ? '1 वर्ष' : '1 year')})
                          </span>
                        </AlertDescription>
                      </Alert>

                      {/* Payment Methods */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* UPI Details */}
                        <div className="p-4 border rounded-lg bg-white dark:bg-background">
                          <h5 className="font-semibold mb-2 flex items-center gap-2">
                            📱 {language === 'hi' ? 'UPI से भुगतान करें' : 'Pay via UPI'}
                          </h5>
                          <div className="space-y-2 text-sm">
                            {membershipSettings?.upiId ? (
                              <>
                                <p 
                                  className="font-mono bg-muted p-2 rounded text-center select-all cursor-pointer hover:bg-muted/80"
                                  onClick={() => {
                                    navigator.clipboard.writeText(membershipSettings.upiId)
                                    toast.success(language === 'hi' ? 'UPI ID कॉपी हुई!' : 'UPI ID copied!')
                                  }}
                                >
                                  {membershipSettings.upiId}
                                </p>
                                <p className="text-muted-foreground text-xs text-center">
                                  {language === 'hi' ? 'UPI ID कॉपी करने के लिए क्लिक करें' : 'Click to copy UPI ID'}
                                </p>
                              </>
                            ) : (
                              <p className="text-muted-foreground text-center py-2">
                                {language === 'hi' ? 'UPI विवरण जल्द उपलब्ध होगा' : 'UPI details coming soon'}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Bank Details */}
                        <div className="p-4 border rounded-lg bg-white dark:bg-background">
                          <h5 className="font-semibold mb-2 flex items-center gap-2">
                            🏦 {language === 'hi' ? 'बैंक ट्रांसफर' : 'Bank Transfer'}
                          </h5>
                          {membershipSettings?.bankName && membershipSettings?.accountNumber ? (
                            <div className="space-y-1 text-sm">
                              <p><span className="text-muted-foreground">{language === 'hi' ? 'बैंक:' : 'Bank:'}</span> {membershipSettings.bankName}</p>
                              <p><span className="text-muted-foreground">{language === 'hi' ? 'खाता नं:' : 'A/C:'}</span> {membershipSettings.accountNumber}</p>
                              {membershipSettings.ifscCode && (
                                <p><span className="text-muted-foreground">IFSC:</span> {membershipSettings.ifscCode}</p>
                              )}
                              {membershipSettings.accountHolderName && (
                                <p><span className="text-muted-foreground">{language === 'hi' ? 'नाम:' : 'Name:'}</span> {membershipSettings.accountHolderName}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-center py-2 text-sm">
                              {language === 'hi' ? 'बैंक विवरण जल्द उपलब्ध होगा' : 'Bank details coming soon'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="flex justify-center p-4">
                        <div className="text-center">
                          {membershipSettings?.qrCodeImage ? (
                            <img 
                              src={membershipSettings.qrCodeImage} 
                              alt="Payment QR Code" 
                              className="w-40 h-40 object-contain border rounded-lg mx-auto mb-2"
                            />
                          ) : (
                            <div className="w-32 h-32 bg-muted border-2 border-dashed rounded-lg flex items-center justify-center mx-auto mb-2">
                              <span className="text-4xl">📲</span>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {language === 'hi' ? 'QR कोड स्कैन करें' : 'Scan QR Code'}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Upload Payment Screenshot */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Upload size={18} />
                          {language === 'hi' ? 'भुगतान स्क्रीनशॉट अपलोड करें *' : 'Upload Payment Screenshot *'}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {language === 'hi' 
                            ? 'भुगतान करने के बाद, कृपया भुगतान स्क्रीनशॉट अपलोड करें। एडमिन द्वारा सत्यापन के बाद आपकी सदस्यता सक्रिय हो जाएगी।'
                            : 'After making payment, please upload the payment screenshot. Your membership will be activated after admin verification.'}
                        </p>
                        
                        {paymentScreenshotPreview ? (
                          <div className="relative inline-block">
                            <img 
                              src={paymentScreenshotPreview} 
                              alt="Payment Screenshot" 
                              className="max-w-[200px] max-h-[200px] object-contain rounded-lg border cursor-pointer"
                              onClick={() => openLightbox([paymentScreenshotPreview], 0)}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => {
                                setPaymentScreenshotFile(null)
                                setPaymentScreenshotPreview(null)
                              }}
                            >
                              <X size={14} />
                            </Button>
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <CheckCircle size={14} weight="fill" />
                              {language === 'hi' ? 'स्क्रीनशॉट अपलोड हो गया' : 'Screenshot uploaded'}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <label className="flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    setPaymentScreenshotFile(file)
                                    const reader = new FileReader()
                                    reader.onloadend = () => {
                                      setPaymentScreenshotPreview(reader.result as string)
                                    }
                                    reader.readAsDataURL(file)
                                  }
                                }}
                              />
                              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                                <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm font-medium">
                                  {language === 'hi' ? 'क्लिक करें या फ़ाइल खींचें' : 'Click or drag file'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  PNG, JPG {language === 'hi' ? 'अधिकतम' : 'max'} 5MB
                                </p>
                              </div>
                            </label>
                          </div>
                        )}
                        
                        {!paymentScreenshotPreview && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <Warning size={14} />
                            {language === 'hi' 
                              ? 'पंजीकरण पूरा करने के लिए भुगतान स्क्रीनशॉट अपलोड करना आवश्यक है'
                              : 'Payment screenshot is required to complete registration'}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Terms and Conditions Checkbox */}
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor="terms" className="text-sm cursor-pointer">
                        {language === 'hi' 
                          ? 'मैंने ' 
                          : 'I have read and agree to the '}
                        <Button 
                          type="button" 
                          variant="link" 
                          className="p-0 h-auto text-primary underline font-semibold"
                          onClick={(e) => {
                            e.preventDefault()
                            setShowTerms(true)
                          }}
                        >
                          {language === 'hi' ? 'नियम और शर्तें' : 'Terms and Conditions'}
                        </Button>
                        {language === 'hi' 
                          ? ' पढ़ लिया है और मैं इनसे सहमत हूं।' 
                          : '.'}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === 'hi' 
                          ? 'पंजीकरण करके आप हमारी गोपनीयता नीति और सेवा शर्तों को स्वीकार करते हैं।' 
                          : 'By registering, you accept our Privacy Policy and Service Terms.'}
                      </p>
                    </div>
                  </div>
                  {!termsAccepted && formData.membershipPlan && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-2 pl-7">
                      <Warning size={14} />
                      {language === 'hi' ? 'कृपया आगे बढ़ने के लिए नियम और शर्तें स्वीकार करें' : 'Please accept Terms and Conditions to proceed'}
                    </p>
                  )}
                </div>

                <Alert>
                  <Info size={18} />
                  <AlertDescription>
                    {t.registration.verificationNote}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t min-h-[60px]">
          <div className="flex items-center gap-2 flex-shrink-0">
            {step > 1 && !showVerification && (
              <Button variant="outline" onClick={prevStep} size="sm" className="text-sm">
                {t.registration.back}
              </Button>
            )}
            {showVerification && (
              <Button 
                variant="outline"
                size="sm"
                className="text-sm"
                onClick={() => {
                  setShowVerification(false)
                  setEmailOtp('')
                  setMobileOtp('')
                  setEmailVerified(false)
                  setMobileVerified(false)
                }}
              >
                {t.registration.back}
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 justify-end flex-1 min-w-0">
            <Button 
              variant="ghost"
              size="sm"
              onClick={resetDraft}
              className="gap-1 text-muted-foreground hover:text-destructive px-2"
              title={language === 'hi' ? 'ड्राफ्ट रीसेट करें' : 'Reset Draft'}
            >
              <ArrowCounterClockwise size={16} />
              <span className="hidden md:inline text-sm">{language === 'hi' ? 'रीसेट' : 'Reset'}</span>
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={saveDraft}
              className="gap-1 text-muted-foreground hover:text-primary px-2"
            >
              <FloppyDisk size={16} />
              <span className="hidden sm:inline text-sm">{language === 'hi' ? 'सेव' : 'Save'}</span>
            </Button>
            
            {step < 6 && !showVerification ? (
              <Button 
                size="sm"
                onClick={nextStep}
                disabled={
                  (step === 1 && (
                    !(formData.fullName || '').trim() || 
                    !formData.dateOfBirth || 
                    !formData.gender || 
                    !(formData.religion || '').trim() || 
                    !formData.maritalStatus ||
                    !formData.profileCreatedFor ||
                    (formData.profileCreatedFor === 'Other' && !(formData.otherRelation || '').trim()) ||
                    ((formData.horoscopeMatching || 'not-mandatory') === 'mandatory' && (!formData.birthTime || !formData.birthPlace))
                  )) ||
                  (step === 2 && (!formData.education || !formData.occupation)) ||
                  (step === 3 && (
                    !formData.location || 
                    !formData.state || 
                    !formData.country || 
                    !formData.email || 
                    !formData.mobile ||
                    (formData.country !== 'India' && !formData.residentialStatus)
                  )) ||
                  (step === 4 && (photos.length === 0 || !selfiePreview || (!isEditMode && !idProofPreview))) ||
                  (step === 5 && !(formData.bio || '').trim())
                }
              >
                {t.registration.next}
              </Button>
            ) : step === 6 ? (
              <Button 
                size="sm" 
                onClick={handleSubmit} 
                disabled={
                  !termsAccepted || 
                  !formData.membershipPlan || 
                  isSubmitting ||
                  // Require payment screenshot for paid plans
                  (formData.membershipPlan !== 'free' && !paymentScreenshotPreview)
                }
              >
                {isSubmitting ? (
                  <>
                    <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...'}
                  </>
                ) : (
                  t.registration.submit
                )}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Photo Lightbox */}
        <PhotoLightbox
          photos={lightboxState.photos}
          initialIndex={lightboxState.initialIndex}
          open={lightboxState.open}
          onClose={closeLightbox}
        />
      </DialogContent>

      {/* Terms and Conditions Dialog */}
      <TermsAndConditions
        open={showTerms}
        onClose={() => setShowTerms(false)}
        language={language}
        membershipSettings={membershipSettings}
      />
    </Dialog>
  )
}
