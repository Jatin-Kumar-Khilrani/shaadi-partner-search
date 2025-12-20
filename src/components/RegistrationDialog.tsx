import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DatePicker } from '@/components/ui/date-picker'
import { UserPlus, CheckCircle, Info, CurrencyInr, Camera, Image, X, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Gender, MaritalStatus, Profile, MembershipPlan } from '@/types/profile'
import { useTranslation, type Language } from '@/lib/translations'

interface RegistrationDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (profile: Partial<Profile>) => void
  language: Language
  existingProfiles?: Profile[]
}

export function RegistrationDialog({ open, onClose, onSubmit, language, existingProfiles = [] }: RegistrationDialogProps) {
  const t = useTranslation(language)
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | undefined>(undefined)
  const [showCamera, setShowCamera] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
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
  
  const [formData, setFormData] = useState({
    fullName: '',
    profileCreatedFor: undefined as 'Self' | 'Daughter' | 'Son' | 'Brother' | 'Sister' | 'Other' | undefined,
    otherRelation: '',
    dateOfBirth: '',
    gender: undefined as Gender | undefined,
    religion: '',
    caste: '',
    education: '',
    occupation: '',
    location: '',
    country: '',
    maritalStatus: undefined as MaritalStatus | undefined,
    email: '',
    countryCode: '+91',
    mobile: '',
    height: '',
    bio: '',
    familyDetails: '',
    membershipPlan: undefined as MembershipPlan | undefined
  })

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true)
        }
        streamRef.current = stream
        setShowCamera(true)
      }
    } catch (err) {
      toast.error(t.registration.cameraAccessDenied)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
    setIsCameraReady(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
            setSelfieFile(file)
            setSelfiePreview(canvas.toDataURL('image/jpeg'))
            stopCamera()
            toast.success(t.registration.selfieCaptured)
          }
        }, 'image/jpeg')
      }
    }
  }

  // Check for duplicate email or mobile
  const isDuplicateEmail = (email: string) => {
    return existingProfiles.some(p => p.email?.toLowerCase() === email.toLowerCase())
  }

  const isDuplicateMobile = (mobile: string) => {
    const fullMobile = `${formData.countryCode} ${mobile}`
    return existingProfiles.some(p => {
      // Check both with and without country code
      const existingMobile = p.mobile?.replace(/\s+/g, '') || ''
      const newMobile = fullMobile.replace(/\s+/g, '')
      return existingMobile === newMobile || existingMobile.endsWith(mobile)
    })
  }

  const handleSubmit = () => {
    if (!formData.fullName || !formData.dateOfBirth || !formData.gender || !formData.religion || !formData.maritalStatus || !formData.email || !formData.mobile || !formData.membershipPlan) {
      toast.error(t.registration.fillAllFields)
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

    // Validate mobile is 10 digits
    if (formData.mobile.length !== 10) {
      toast.error(
        language === 'hi' 
          ? 'कृपया 10 अंक का मोबाइल नंबर दर्ज करें' 
          : 'Please enter a 10 digit mobile number'
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

    const membershipCost = formData.membershipPlan === '6-month' ? 500 : 900
    const membershipExpiry = new Date()
    membershipExpiry.setMonth(membershipExpiry.getMonth() + (formData.membershipPlan === '6-month' ? 6 : 12))

    const profile: Omit<Profile, 'id' | 'profileId' | 'status' | 'trustLevel' | 'createdAt' | 'emailVerified' | 'mobileVerified' | 'isBlocked'> = {
      ...formData,
      firstName: formData.fullName.split(' ')[0],
      lastName: formData.fullName.split(' ').slice(1).join(' ') || formData.fullName.split(' ')[0],
      age,
      gender: formData.gender!,
      maritalStatus: formData.maritalStatus!,
      mobile: `${formData.countryCode} ${formData.mobile}`,
      membershipPlan: formData.membershipPlan!,
      relationToProfile: formData.profileCreatedFor === 'Other' ? formData.otherRelation : formData.profileCreatedFor!,
      hideEmail: false,
      hideMobile: false,
      photos: photos.map(p => p.preview),
      selfieUrl: selfiePreview,
      membershipExpiry: membershipExpiry.toISOString()
    }

    onSubmit(profile)
    toast.success(
      t.registration.profileSubmitted,
      {
        description: `${t.registration.membershipFee}: ₹${membershipCost}। ${t.registration.otpSending}`
      }
    )
    
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
      gender: undefined,
      religion: '',
      caste: '',
      education: '',
      occupation: '',
      location: '',
      country: '',
      maritalStatus: undefined,
      email: '',
      countryCode: '+91',
      mobile: '',
      height: '',
      bio: '',
      familyDetails: '',
      membershipPlan: undefined
    })
    setPhotos([])
    setSelfieFile(null)
    setSelfiePreview(undefined)
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

  const sendOtps = () => {
    const emailOtpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const mobileOtpCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    setGeneratedEmailOtp(emailOtpCode)
    setGeneratedMobileOtp(mobileOtpCode)
    setShowVerification(true)
    
    toast.success(
      language === 'hi' ? 'OTP भेजा गया!' : 'OTPs Sent!',
      {
        description: `Email: ${emailOtpCode} | Mobile: ${mobileOtpCode}`,
        duration: 30000
      }
    )
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

  const handleVerificationComplete = () => {
    const emailValid = verifyEmailOtp()
    const mobileValid = verifyMobileOtp()
    
    if (emailValid && mobileValid) {
      setShowVerification(false)
      setStep(4)
    }
  }

  const nextStep = () => {
    if (step === 1 && (!formData.fullName || !formData.dateOfBirth || !formData.gender || !formData.religion || !formData.maritalStatus)) {
      toast.error(t.registration.fillAllFields)
      return
    }
    if (step === 1 && !formData.profileCreatedFor) {
      toast.error(language === 'hi' ? 'कृपया प्रोफाइल किसके लिए बनाई जा रही है चुनें' : 'Please select who this profile is for')
      return
    }
    if (step === 1 && formData.profileCreatedFor === 'Other' && !formData.otherRelation.trim()) {
      toast.error(language === 'hi' ? 'कृपया रिश्ता बताएं' : 'Please specify the relation')
      return
    }
    if (step === 2 && (!formData.education || !formData.occupation)) {
      toast.error(t.registration.fillEducation)
      return
    }
    if (step === 3 && (!formData.location || !formData.country || !formData.email || !formData.mobile)) {
      toast.error(t.registration.fillContact)
      return
    }
    if (step === 3) {
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
    setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  return (
    <Dialog open={open} onOpenChange={onClose} modal>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col z-50" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-3xl flex items-center gap-2">
            <UserPlus size={32} weight="bold" />
            {t.registration.title}
          </DialogTitle>
          <DialogDescription>
            {t.registration.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-1">
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  s === step ? 'bg-primary text-primary-foreground scale-110' :
                  s < step || (s === 3 && showVerification) || (s === 4 && emailVerified && mobileVerified) ? 'bg-teal text-teal-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {(s < step || (s === 3 && emailVerified && mobileVerified)) ? <CheckCircle size={20} weight="fill" /> : s}
                </div>
                {s < 5 && <div className={`w-12 h-1 ${s < step || (s === 3 && emailVerified && mobileVerified) ? 'bg-teal' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>

          <Alert className="mb-4">
            <Info size={18} />
            <AlertDescription>
              {step === 1 && t.registration.step1}
              {step === 2 && t.registration.step2}
              {step === 3 && !showVerification && t.registration.step3}
              {step === 3 && showVerification && (language === 'hi' ? 'कृपया अपने ईमेल और मोबाइल पर भेजे गए OTP को सत्यापित करें।' : 'Please verify the OTPs sent to your email and mobile.')}
              {step === 4 && t.registration.step4}
              {step === 5 && t.registration.step5}
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="pt-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    {language === 'hi' ? 'नाम' : 'Name'} *
                  </Label>
                  <Input
                    id="fullName"
                    placeholder={language === 'hi' ? 'उदाहरण: राज आहूजा' : 'Example: Raj Ahuja'}
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profileCreatedFor">
                    {language === 'hi' ? 'यह प्रोफाइल किसके लिए बनाई जा रही है?' : 'Profile created for'} *
                  </Label>
                  <Select 
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
                    <Select onValueChange={(value: Gender) => updateField('gender', value)} value={formData.gender}>
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
                    <Label htmlFor="dateOfBirth">{language === 'hi' ? 'जन्म तिथि' : 'Date of Birth'} * <span className="text-xs font-normal text-muted-foreground">(DD/MM/YYYY)</span></Label>
                    <DatePicker
                      value={formData.dateOfBirth}
                      onChange={(value) => updateField('dateOfBirth', value)}
                      maxDate={new Date(getMaxDate())}
                      minDate={new Date(getMinDate())}
                      disabled={!formData.gender}
                      placeholder="DD/MM/YYYY"
                    />
                    {!formData.gender && (
                      <p className="text-xs text-muted-foreground">
                        {t.registration.selectGenderFirst}
                      </p>
                    )}
                    {formData.gender && (
                      <p className="text-xs text-muted-foreground">
                        {t.registration.minAgeInfo}: {formData.gender === 'male' ? '21' : '18'} {t.registration.yearsText}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="religion">{language === 'hi' ? 'धर्म' : 'Religion'} *</Label>
                    <Input
                      id="religion"
                      placeholder={language === 'hi' ? 'उदाहरण: हिंदू, मुस्लिम, सिख, ईसाई' : 'Example: Hindu, Muslim, Sikh, Christian'}
                      value={formData.religion}
                      onChange={(e) => updateField('religion', e.target.value)}
                      required
                    />
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
                    <Select onValueChange={(value: MaritalStatus) => updateField('maritalStatus', value)} value={formData.maritalStatus}>
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
                    <Label htmlFor="height">{language === 'hi' ? 'ऊंचाई (वैकल्पिक)' : 'Height (Optional)'}</Label>
                    <Input
                      id="height"
                      placeholder={language === 'hi' ? 'उदाहरण: 5\'8" या 172 cm' : 'Example: 5\'8" or 172 cm'}
                      value={formData.height}
                      onChange={(e) => updateField('height', e.target.value)}
                    />
                  </div>
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
              </div>
            )}

            {step === 3 && !showVerification && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">{language === 'hi' ? 'शहर' : 'City'} *</Label>
                    <Input
                      id="location"
                      placeholder={language === 'hi' ? 'उदाहरण: मुंबई, जयपुर' : 'Example: Mumbai, Jaipur'}
                      value={formData.location}
                      onChange={(e) => updateField('location', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">{language === 'hi' ? 'देश' : 'Country'} *</Label>
                    <Input
                      id="country"
                      placeholder={language === 'hi' ? 'उदाहरण: भारत, USA' : 'Example: India, USA'}
                      value={formData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{language === 'hi' ? 'ईमेल' : 'Email'} *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">{language === 'hi' ? 'मोबाइल' : 'Mobile'} *</Label>
                  <div className="flex gap-2">
                    <Select onValueChange={(value) => updateField('countryCode', value)} value={formData.countryCode}>
                      <SelectTrigger className="w-[100px]">
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
                      placeholder={language === 'hi' ? '10 अंक का मोबाइल नंबर' : '10 digit mobile number'}
                      value={formData.mobile}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                        updateField('mobile', value)
                      }}
                      maxLength={10}
                      required
                      className="flex-1"
                    />
                  </div>
                  {formData.mobile && formData.mobile.length !== 10 && (
                    <p className="text-xs text-destructive">
                      {language === 'hi' ? 'कृपया 10 अंक का मोबाइल नंबर दर्ज करें' : 'Please enter a 10 digit mobile number'}
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

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={sendOtps}
                    className="text-sm"
                  >
                    {language === 'hi' ? 'OTP पुनः भेजें' : 'Resend OTPs'}
                  </Button>
                </div>
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
                  
                  <div className="grid grid-cols-3 gap-3">
                    {/* Existing Photos */}
                    {photos.map((photo, index) => (
                      <div key={index} className="relative border-2 border-border rounded-lg p-1 aspect-square">
                        <img 
                          src={photo.preview} 
                          alt={`Photo ${index + 1}`} 
                          className="w-full h-full object-cover rounded-md"
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
                        <img 
                          src={selfiePreview} 
                          alt="Captured Selfie" 
                          className="w-full h-full object-cover"
                        />
                      ) : showCamera ? (
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                          <Camera size={64} weight="light" className="opacity-30 mb-2" />
                          <p className="text-sm">{language === 'hi' ? 'कैमरा प्रीव्यू यहां दिखेगा' : 'Camera preview will appear here'}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-center gap-3 mt-4">
                      {selfiePreview ? (
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setSelfieFile(null)
                            setSelfiePreview(undefined)
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
                        </>
                      ) : (
                        <Button 
                          type="button" 
                          onClick={startCamera}
                          className="gap-2"
                        >
                          <Camera size={16} weight="bold" />
                          {language === 'hi' ? 'कैमरा शुरू करें' : 'Start Camera'}
                        </Button>
                      )}
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  
                  <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                    <Info size={16} />
                    <AlertDescription className="text-xs">
                      {language === 'hi' 
                        ? 'सेल्फी का उपयोग AI द्वारा आपकी अपलोड की गई तस्वीरों से मिलान करके पहचान सत्यापित करने के लिए किया जाएगा।' 
                        : 'Selfie will be used to verify your identity by matching with your uploaded photos using AI.'}
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{t.registration.aboutYourself}</Label>
                  <Textarea
                    id="bio"
                    placeholder={t.registration.aboutPlaceholder}
                    value={formData.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    rows={4}
                  />
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

            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{t.registration.choosePlan}</h3>
                  <p className="text-muted-foreground">{t.registration.affordablePricing}</p>
                </div>

                <RadioGroup value={formData.membershipPlan} onValueChange={(value: MembershipPlan) => updateField('membershipPlan', value)}>
                  <div className="space-y-4">
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
                                  <span className="text-3xl font-bold text-primary">500</span>
                                  <span className="text-muted-foreground">{t.registration.perMonth}</span>
                                </div>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {t.registration.unlimitedProfiles}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {t.registration.contactAccess}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {t.registration.volunteerSupport}
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
                                  <span className="text-3xl font-bold text-accent">900</span>
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
                                    {t.registration.contactAccess}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {t.registration.prioritySupport}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {t.registration.profileHighlight}
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

        <div className="flex items-center justify-between gap-4 pt-4 border-t">
          {step > 1 && !showVerification && (
            <Button variant="outline" onClick={prevStep}>
              {t.registration.back}
            </Button>
          )}
          {showVerification && (
            <Button 
              variant="outline" 
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
          {step < 5 && !showVerification ? (
            <Button onClick={nextStep} className="ml-auto">
              {t.registration.next}
            </Button>
          ) : step === 5 ? (
            <Button onClick={handleSubmit} className="ml-auto">
              {t.registration.submit}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
