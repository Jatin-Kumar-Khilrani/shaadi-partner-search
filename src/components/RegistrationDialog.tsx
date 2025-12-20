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
import { UserPlus, CheckCircle, Info, CurrencyInr, Camera, Image } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Gender, MaritalStatus, Profile, MembershipPlan } from '@/types/profile'
import { useTranslation, type Language } from '@/lib/translations'

interface RegistrationDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (profile: Partial<Profile>) => void
  language: Language
}

export function RegistrationDialog({ open, onClose, onSubmit, language }: RegistrationDialogProps) {
  const t = useTranslation(language)
  const [step, setStep] = useState(1)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | undefined>(undefined)
  const [showCamera, setShowCamera] = useState(false)
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

  const handleSubmit = () => {
    if (!formData.fullName || !formData.dateOfBirth || !formData.gender || !formData.email || !formData.mobile || !formData.membershipPlan) {
      toast.error(t.registration.fillAllFields)
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
      maritalStatus: formData.maritalStatus || 'never-married',
      membershipPlan: formData.membershipPlan!,
      relationToProfile: formData.profileCreatedFor === 'Other' ? formData.otherRelation : formData.profileCreatedFor!,
      hideEmail: false,
      hideMobile: false,
      photos: photoPreview ? [photoPreview] : [],
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
      mobile: '',
      height: '',
      bio: '',
      familyDetails: '',
      membershipPlan: undefined
    })
    setPhotoFile(null)
    setPhotoPreview(undefined)
    setSelfieFile(null)
    setSelfiePreview(undefined)
    stopCamera()
    setStep(1)
    onClose()
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
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
        description: `Email: ${emailOtpCode} | Mobile: ${mobileOtpCode}`
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
    if (step === 1 && (!formData.fullName || !formData.dateOfBirth || !formData.gender)) {
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
                  s < step ? 'bg-teal text-teal-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {s < step ? <CheckCircle size={20} weight="fill" /> : s}
                </div>
                {s < 5 && <div className={`w-12 h-1 ${s < step ? 'bg-teal' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>

          <Alert className="mb-4">
            <Info size={18} />
            <AlertDescription>
              {step === 1 && t.registration.step1}
              {step === 2 && t.registration.step2}
              {step === 3 && t.registration.step3}
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
                    <Label htmlFor="gender">{t.fields.gender} / Gender *</Label>
                    <Select onValueChange={(value: Gender) => updateField('gender', value)} value={formData.gender}>
                      <SelectTrigger id="gender" className="w-full">
                        <SelectValue placeholder={t.fields.select} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="male">{t.fields.male} / Male</SelectItem>
                        <SelectItem value="female">{t.fields.female} / Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">{t.fields.dateOfBirth} / Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateField('dateOfBirth', e.target.value)}
                      max={getMaxDate()}
                      min={getMinDate()}
                      required
                      disabled={!formData.gender}
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
                    <Label htmlFor="religion">{t.fields.religion} / Religion</Label>
                    <Input
                      id="religion"
                      placeholder={language === 'hi' ? 'उदाहरण: हिंदू, मुस्लिम, सिख, ईसाई' : 'Example: Hindu, Muslim, Sikh, Christian'}
                      value={formData.religion}
                      onChange={(e) => updateField('religion', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caste">{t.fields.caste} / Caste ({t.fields.optional})</Label>
                    <Input
                      id="caste"
                      placeholder={language === 'hi' ? 'यदि ज्ञात हो' : 'If known'}
                      value={formData.caste}
                      onChange={(e) => updateField('caste', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">{t.fields.maritalStatus} / Marital Status</Label>
                    <Select onValueChange={(value: MaritalStatus) => updateField('maritalStatus', value)} value={formData.maritalStatus}>
                      <SelectTrigger id="maritalStatus" className="w-full">
                        <SelectValue placeholder={t.fields.select} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="never-married">{t.fields.neverMarried} / Never Married</SelectItem>
                        <SelectItem value="divorced">{t.fields.divorced} / Divorced</SelectItem>
                        <SelectItem value="widowed">{t.fields.widowed} / Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">{t.fields.height} / Height ({t.fields.optional})</Label>
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
                  <Label htmlFor="education">{t.fields.education} / Education *</Label>
                  <Input
                    id="education"
                    placeholder={language === 'hi' ? 'उदाहरण: B.Tech, MBA, M.Com' : 'Example: B.Tech, MBA, M.Com'}
                    value={formData.education}
                    onChange={(e) => updateField('education', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">{t.fields.occupation} / Occupation *</Label>
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

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">{t.fields.city} / City *</Label>
                    <Input
                      id="location"
                      placeholder={language === 'hi' ? 'उदाहरण: मुंबई, जयपुर' : 'Example: Mumbai, Jaipur'}
                      value={formData.location}
                      onChange={(e) => updateField('location', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">{t.fields.country} / Country *</Label>
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
                  <Label htmlFor="email">{t.fields.email} / Email *</Label>
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
                  <Label htmlFor="mobile">{t.fields.mobile} / Mobile *</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="+91 98XXXXXXXX"
                    value={formData.mobile}
                    onChange={(e) => updateField('mobile', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="photo" className="flex items-center gap-2">
                      <Image size={20} weight="bold" />
                      {t.registration.uploadPhoto}
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      {photoPreview ? (
                        <div className="space-y-3">
                          <img 
                            src={photoPreview} 
                            alt="Preview" 
                            className="mx-auto w-full h-48 object-cover rounded-lg"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setPhotoFile(null)
                              setPhotoPreview(undefined)
                            }}
                          >
                            {t.registration.changePhoto}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-muted-foreground">
                            <Image size={48} weight="light" className="mx-auto mb-2 text-muted-foreground/50" />
                            <p className="text-sm">{t.registration.uploadPhotoFile}</p>
                            <p className="text-xs mt-1">{t.registration.photoFormat}</p>
                          </div>
                          <Input
                            id="photo"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="selfie" className="flex items-center gap-2">
                      <Camera size={20} weight="bold" />
                      {t.registration.uploadSelfie}
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      {selfiePreview ? (
                        <div className="space-y-3">
                          <img 
                            src={selfiePreview} 
                            alt="Selfie Preview" 
                            className="mx-auto w-full h-48 object-cover rounded-lg"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelfieFile(null)
                              setSelfiePreview(undefined)
                            }}
                          >
                            {t.registration.retake}
                          </Button>
                        </div>
                      ) : showCamera ? (
                        <div className="space-y-3">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline
                            className="mx-auto w-full h-48 object-cover rounded-lg bg-black"
                          />
                          <div className="flex gap-2 justify-center">
                            <Button 
                              type="button" 
                              onClick={capturePhoto}
                              size="sm"
                              className="gap-2"
                            >
                              <Camera size={16} weight="bold" />
                              {t.registration.capture}
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={stopCamera}
                              size="sm"
                            >
                              {t.registration.cancel}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-muted-foreground">
                            <Camera size={48} weight="light" className="mx-auto mb-2 text-muted-foreground/50" />
                            <p className="text-sm">{t.registration.takeLiveSelfie}</p>
                            <p className="text-xs mt-1">{t.registration.orUploadFile}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button 
                              type="button" 
                              onClick={startCamera}
                              size="sm"
                              className="gap-2"
                            >
                              <Camera size={16} weight="bold" />
                              {t.registration.startCamera}
                            </Button>
                            <Input
                              id="selfie"
                              type="file"
                              accept="image/*"
                              capture="user"
                              onChange={handleSelfieUpload}
                              className="cursor-pointer text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
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

        <div className="flex justify-between gap-4 mt-6 px-1">
          {step > 1 && (
            <Button variant="outline" onClick={prevStep}>
              {t.registration.back}
            </Button>
          )}
          {step < 5 ? (
            <Button onClick={nextStep} className="ml-auto">
              {t.registration.next}
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="ml-auto bg-accent hover:bg-accent/90 text-accent-foreground">
              {t.registration.submit}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
