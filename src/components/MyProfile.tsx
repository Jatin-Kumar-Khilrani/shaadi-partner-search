import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  User, MapPin, Briefcase, GraduationCap, Heart, House, PencilSimple,
  ChatCircle, Envelope, Phone, Calendar, Warning, FilePdf, Trash,
  CurrencyInr, ArrowClockwise, Camera, CheckCircle
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Profile } from '@/types/profile'
import type { Language } from '@/lib/translations'
import { BiodataGenerator } from './BiodataGenerator'
import { PhotoLightbox } from './PhotoLightbox'

interface MyProfileProps {
  profile: Profile | null
  language: Language
  onEdit?: () => void
  onDeleteProfile?: (profileId: string) => void
  onUpdateProfile?: (updatedProfile: Partial<Profile>) => void
}

export function MyProfile({ profile, language, onEdit, onDeleteProfile, onUpdateProfile }: MyProfileProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showPhotoLightbox, setShowPhotoLightbox] = useState(false)
  const [showBiodataGenerator, setShowBiodataGenerator] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditConfirmDialog, setShowEditConfirmDialog] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'otp'>('confirm')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [enteredOtp, setEnteredOtp] = useState('')
  
  // Renewal payment state
  const [showRenewalDialog, setShowRenewalDialog] = useState(false)
  const [renewalPlan, setRenewalPlan] = useState<'6-month' | '1-year'>('6-month')
  const [renewalPaymentFile, setRenewalPaymentFile] = useState<File | null>(null)
  const [renewalPaymentPreview, setRenewalPaymentPreview] = useState<string | null>(null)
  const renewalFileInputRef = useRef<HTMLInputElement>(null)

  const t = {
    title: language === 'hi' ? 'मेरी प्रोफाइल' : 'My Profile',
    edit: language === 'hi' ? 'संपादित करें' : 'Edit Profile',
    profileId: language === 'hi' ? 'प्रोफाइल ID' : 'Profile ID',
    personalInfo: language === 'hi' ? 'व्यक्तिगत जानकारी' : 'Personal Information',
    familyInfo: language === 'hi' ? 'पारिवारिक जानकारी' : 'Family Information',
    contactInfo: language === 'hi' ? 'संपर्क जानकारी' : 'Contact Information',
    lifestyleInfo: language === 'hi' ? 'जीवनशैली' : 'Lifestyle',
    age: language === 'hi' ? 'आयु' : 'Age',
    years: language === 'hi' ? 'वर्ष' : 'years',
    height: language === 'hi' ? 'ऊंचाई' : 'Height',
    education: language === 'hi' ? 'शिक्षा' : 'Education',
    occupation: language === 'hi' ? 'व्यवसाय' : 'Occupation',
    salary: language === 'hi' ? 'वार्षिक आय' : 'Annual Income',
    location: language === 'hi' ? 'स्थान' : 'Location',
    state: language === 'hi' ? 'राज्य' : 'State',
    country: language === 'hi' ? 'देश' : 'Country',
    residentialStatus: language === 'hi' ? 'आवासीय स्थिति' : 'Residential Status',
    religion: language === 'hi' ? 'धर्म' : 'Religion',
    caste: language === 'hi' ? 'जाति' : 'Caste',
    community: language === 'hi' ? 'समुदाय' : 'Community',
    motherTongue: language === 'hi' ? 'मातृभाषा' : 'Mother Tongue',
    maritalStatus: language === 'hi' ? 'वैवाहिक स्थिति' : 'Marital Status',
    manglik: language === 'hi' ? 'मांगलिक' : 'Manglik',
    diet: language === 'hi' ? 'आहार' : 'Diet',
    drinking: language === 'hi' ? 'शराब' : 'Drinking',
    smoking: language === 'hi' ? 'धूम्रपान' : 'Smoking',
    aboutMe: language === 'hi' ? 'मेरे बारे में' : 'About Me',
    familyDetails: language === 'hi' ? 'पारिवारिक विवरण' : 'Family Details',
    email: language === 'hi' ? 'ईमेल' : 'Email',
    mobile: language === 'hi' ? 'मोबाइल' : 'Mobile',
    verified: language === 'hi' ? 'सत्यापित' : 'Verified',
    pending: language === 'hi' ? 'लंबित' : 'Pending',
    level: language === 'hi' ? 'स्तर' : 'Level',
    trustLevel: language === 'hi' ? 'विश्वास स्तर' : 'Trust Level',
    digilockerVerified: language === 'hi' ? 'सत्यापित' : 'Verified',
    idProofVerified: language === 'hi' ? 'पहचान सत्यापित' : 'ID Verified',
    returnedForEdit: language === 'hi' ? 'संपादन आवश्यक' : 'Edit Required',
    returnedForEditDesc: language === 'hi' ? 'एडमिन ने आपकी प्रोफाइल संपादन के लिए वापस भेजी है' : 'Admin has returned your profile for editing',
    adminReason: language === 'hi' ? 'एडमिन संदेश' : 'Admin Message',
    generateBiodata: language === 'hi' ? 'बायोडाटा बनाएं' : 'Generate Biodata',
    deleteProfile: language === 'hi' ? 'प्रोफाइल हटाएं' : 'Delete Profile',
    deleteConfirmTitle: language === 'hi' ? 'क्या आप वाकई प्रोफाइल हटाना चाहते हैं?' : 'Are you sure you want to delete your profile?',
    deleteConfirmDesc: language === 'hi' ? 'यह क्रिया आपकी प्रोफाइल को सभी उपयोगकर्ताओं से छुपा देगी। आप बाद में एडमिन से संपर्क करके इसे पुनः सक्रिय कर सकते हैं।' : 'This action will hide your profile from all users. You can contact admin later to reactivate it.',
    sendOtp: language === 'hi' ? 'OTP भेजें' : 'Send OTP',
    enterOtp: language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP',
    otpSent: language === 'hi' ? 'OTP आपके मोबाइल पर भेजा गया' : 'OTP sent to your mobile',
    confirmDelete: language === 'hi' ? 'हटाने की पुष्टि करें' : 'Confirm Delete',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    profileDeleted: language === 'hi' ? 'प्रोफाइल सफलतापूर्वक हटाई गई' : 'Profile deleted successfully',
    invalidOtp: language === 'hi' ? 'गलत OTP' : 'Invalid OTP',
    editConfirmTitle: language === 'hi' ? 'प्रोफ़ाइल संपादित करें?' : 'Edit Profile?',
    editConfirmDesc: language === 'hi' ? 'संपादन के बाद आपकी प्रोफ़ाइल को एडमिन द्वारा पुनः स्वीकृत करना होगा। स्वीकृति तक आपकी प्रोफ़ाइल अन्य उपयोगकर्ताओं को दिखाई नहीं देगी।' : 'After editing, your profile will need to be re-approved by admin. Your profile will not be visible to other users until approved.',
    confirmEdit: language === 'hi' ? 'संपादित करें' : 'Proceed to Edit',
    pendingApproval: language === 'hi' ? 'स्वीकृति लंबित' : 'Pending Approval',
    pendingApprovalDesc: language === 'hi' ? 'आपकी प्रोफ़ाइल एडमिन द्वारा समीक्षा के लिए लंबित है। स्वीकृति तक अन्य उपयोगकर्ताओं को दिखाई नहीं देगी।' : 'Your profile is pending review by admin. It will not be visible to other users until approved.',
  }

  // Helper functions for displaying lifestyle values
  const getDietLabel = (diet: string | undefined) => {
    const labels: Record<string, { hi: string; en: string }> = {
      'veg': { hi: 'शाकाहारी', en: 'Vegetarian' },
      'non-veg': { hi: 'मांसाहारी', en: 'Non-Vegetarian' },
      'eggetarian': { hi: 'अंडाहारी', en: 'Eggetarian' },
    }
    return diet ? (labels[diet]?.[language] || diet) : '-'
  }

  const getHabitLabel = (habit: string | undefined) => {
    const labels: Record<string, { hi: string; en: string }> = {
      'never': { hi: 'कभी नहीं', en: 'Never' },
      'occasionally': { hi: 'कभी-कभी', en: 'Occasionally' },
      'regularly': { hi: 'नियमित', en: 'Regularly' },
    }
    return habit ? (labels[habit]?.[language] || habit) : '-'
  }

  const getManglikLabel = (manglik: boolean | undefined) => {
    if (manglik === undefined) return '-'
    return manglik ? (language === 'hi' ? 'हां' : 'Yes') : (language === 'hi' ? 'नहीं' : 'No')
  }

  const getResidentialStatusLabel = (status: string | undefined) => {
    const labels: Record<string, { hi: string; en: string }> = {
      'citizen': { hi: 'नागरिक', en: 'Citizen' },
      'permanent-resident': { hi: 'स्थायी निवासी', en: 'Permanent Resident' },
      'work-permit': { hi: 'वर्क परमिट', en: 'Work Permit' },
      'student-visa': { hi: 'स्टूडेंट वीज़ा', en: 'Student Visa' },
      'dependent-visa': { hi: 'आश्रित वीज़ा', en: 'Dependent Visa' },
      'temporary-visa': { hi: 'अस्थायी वीज़ा', en: 'Temporary Visa' },
      'oci': { hi: 'OCI', en: 'OCI' },
      'applied-for-pr': { hi: 'PR के लिए आवेदन', en: 'Applied for PR' },
      'applied-for-citizenship': { hi: 'नागरिकता के लिए आवेदन', en: 'Applied for Citizenship' },
      'tourist-visa': { hi: 'टूरिस्ट वीज़ा', en: 'Tourist Visa' },
      'other': { hi: 'अन्य', en: 'Other' },
    }
    return status ? (labels[status]?.[language] || status) : '-'
  }

  const getMaritalStatusLabel = (status: string) => {
    const labels: Record<string, { hi: string; en: string }> = {
      'never-married': { hi: 'अविवाहित', en: 'Never Married' },
      'divorced': { hi: 'तलाकशुदा', en: 'Divorced' },
      'widowed': { hi: 'विधवा/विधुर', en: 'Widowed' },
    }
    return labels[status]?.[language] || status
  }

  const handleEditClick = () => {
    // If profile is returned for edit, go directly to edit
    if (profile?.returnedForEdit) {
      onEdit?.()
    } else {
      // Show confirmation dialog for regular edits
      setShowEditConfirmDialog(true)
    }
  }

  const handleConfirmEdit = () => {
    setShowEditConfirmDialog(false)
    onEdit?.()
  }

  const handleDeleteRequest = () => {
    setShowDeleteDialog(true)
    setDeleteStep('confirm')
    setEnteredOtp('')
  }

  const handleSendOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(otp)
    setDeleteStep('otp')
    toast.info(t.otpSent, {
      description: `OTP: ${otp}`,
      duration: 10000
    })
  }

  const handleConfirmDelete = () => {
    if (enteredOtp !== generatedOtp) {
      toast.error(t.invalidOtp)
      return
    }
    
    if (onDeleteProfile && profile) {
      onDeleteProfile(profile.profileId)
      toast.success(t.profileDeleted)
      setShowDeleteDialog(false)
      setDeleteStep('confirm')
      setEnteredOtp('')
      setGeneratedOtp('')
    }
  }

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false)
    setDeleteStep('confirm')
    setEnteredOtp('')
    setGeneratedOtp('')
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-8">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {language === 'hi' ? 'प्रोफाइल नहीं मिली' : 'Profile not found'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const photos = profile.photos?.length > 0 ? profile.photos : []
  const isPaidUser = !!profile.membershipPlan && profile.membershipExpiry && new Date(profile.membershipExpiry) > new Date()
  const isFreePlan = profile.membershipPlan === 'free'
  const canAccessBiodata = isPaidUser && !isFreePlan

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                if (!canAccessBiodata) {
                  toast.error(
                    language === 'hi' 
                      ? 'बायोडाटा जनरेटर मुफ्त योजना पर उपलब्ध नहीं है। कृपया प्रीमियम में अपग्रेड करें।' 
                      : 'Biodata generator is not available on Free Plan. Please upgrade to Premium.'
                  )
                  return
                }
                setShowBiodataGenerator(true)
              }} 
              variant="outline"
              className={`gap-2 ${canAccessBiodata ? 'text-red-600 border-red-300 hover:bg-red-50' : 'text-muted-foreground border-muted'}`}
            >
              <FilePdf size={20} weight="fill" />
              {t.generateBiodata}
              {!canAccessBiodata && <Badge variant="outline" className="ml-1 text-xs">Premium</Badge>}
            </Button>
            {onEdit && (
              <Button onClick={handleEditClick} className="gap-2">
                <PencilSimple size={20} />
                {t.edit}
              </Button>
            )}
            {onDeleteProfile && (
              <Button 
                onClick={handleDeleteRequest} 
                variant="destructive"
                className="gap-2"
              >
                <Trash size={20} />
                {t.deleteProfile}
              </Button>
            )}
          </div>
        </div>

        {/* Delete Profile Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={handleCloseDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash size={24} />
                {t.deleteConfirmTitle}
              </DialogTitle>
              <DialogDescription>
                {t.deleteConfirmDesc}
              </DialogDescription>
            </DialogHeader>
            
            {deleteStep === 'confirm' ? (
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={handleCloseDeleteDialog} className="flex-1">
                  {t.cancel}
                </Button>
                <Button variant="destructive" onClick={handleSendOtp} className="flex-1">
                  {t.sendOtp}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="delete-otp">{t.enterOtp}</Label>
                  <Input
                    id="delete-otp"
                    type="text"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    maxLength={6}
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleCloseDeleteDialog} className="flex-1">
                    {t.cancel}
                  </Button>
                  <Button variant="destructive" onClick={handleConfirmDelete} className="flex-1">
                    {t.confirmDelete}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Confirmation Dialog */}
        <Dialog open={showEditConfirmDialog} onOpenChange={setShowEditConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <Warning size={24} weight="fill" />
                {t.editConfirmTitle}
              </DialogTitle>
              <DialogDescription>
                {t.editConfirmDesc}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowEditConfirmDialog(false)} className="flex-1">
                {t.cancel}
              </Button>
              <Button onClick={handleConfirmEdit} className="flex-1 bg-amber-600 hover:bg-amber-700">
                {t.confirmEdit}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Biodata Generator Dialog */}
        <BiodataGenerator
          profile={profile}
          language={language}
          isPaidUser={isPaidUser}
          open={showBiodataGenerator}
          onClose={() => setShowBiodataGenerator(false)}
        />

        {/* Returned for Edit Alert */}
        {profile.returnedForEdit && (
          <Alert className="mb-6 bg-amber-50 border-amber-400 dark:bg-amber-950/30 dark:border-amber-700">
            <Warning size={20} weight="fill" className="text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200 font-semibold">
              {t.returnedForEdit}
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              {t.returnedForEditDesc}
              {profile.editReason && (
                <div className="mt-2 p-3 bg-white/50 dark:bg-black/20 rounded-md border border-amber-300">
                  <span className="font-semibold">{t.adminReason}:</span>{' '}
                  {profile.editReason}
                </div>
              )}
              {profile.returnedAt && (
                <p className="text-sm mt-2 text-amber-600 dark:text-amber-400">
                  {new Date(profile.returnedAt).toLocaleDateString()}
                </p>
              )}
              {onEdit && (
                <Button 
                  onClick={onEdit} 
                  className="mt-4 gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <PencilSimple size={20} weight="bold" />
                  {t.edit}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Approval Alert (when profile is pending and not returned for edit) */}
        {profile.status === 'pending' && !profile.returnedForEdit && (
          <Alert className="mb-6 bg-blue-50 border-blue-400 dark:bg-blue-950/30 dark:border-blue-700">
            <Warning size={20} weight="fill" className="text-blue-600" />
            <AlertTitle className="text-blue-800 dark:text-blue-200 font-semibold">
              {t.pendingApproval}
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              {t.pendingApprovalDesc}
            </AlertDescription>
          </Alert>
        )}

        {/* Membership Status & Renewal Section */}
        {profile.membershipPlan && profile.membershipPlan !== 'free' && (
          (() => {
            const now = new Date()
            const expiryDate = profile.membershipEndDate ? new Date(profile.membershipEndDate) : 
                               profile.membershipExpiry ? new Date(profile.membershipExpiry) : null
            const isExpired = expiryDate ? expiryDate < now : false
            const daysToExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
            const isNearExpiry = daysToExpiry > 0 && daysToExpiry <= 30
            const renewalPending = profile.renewalPaymentStatus === 'pending'
            const renewalRejected = profile.renewalPaymentStatus === 'rejected'

            if (!isExpired && !isNearExpiry && !renewalPending && !renewalRejected) return null

            return (
              <Alert className={`mb-6 ${
                isExpired ? 'bg-red-50 border-red-400 dark:bg-red-950/30' : 
                renewalRejected ? 'bg-orange-50 border-orange-400 dark:bg-orange-950/30' :
                renewalPending ? 'bg-blue-50 border-blue-400 dark:bg-blue-950/30' :
                'bg-amber-50 border-amber-400 dark:bg-amber-950/30'
              }`}>
                {isExpired ? <CurrencyInr size={20} weight="fill" className="text-red-600" /> :
                 renewalPending ? <ArrowClockwise size={20} className="text-blue-600" /> :
                 <Warning size={20} weight="fill" className={renewalRejected ? "text-orange-600" : "text-amber-600"} />}
                <AlertTitle className={`font-semibold ${
                  isExpired ? 'text-red-800 dark:text-red-200' : 
                  renewalRejected ? 'text-orange-800 dark:text-orange-200' :
                  renewalPending ? 'text-blue-800 dark:text-blue-200' :
                  'text-amber-800 dark:text-amber-200'
                }`}>
                  {isExpired ? (language === 'hi' ? 'सदस्यता समाप्त' : 'Membership Expired') :
                   renewalPending ? (language === 'hi' ? 'नवीनीकरण भुगतान सत्यापन लंबित' : 'Renewal Payment Verification Pending') :
                   renewalRejected ? (language === 'hi' ? 'नवीनीकरण भुगतान अस्वीकृत' : 'Renewal Payment Rejected') :
                   (language === 'hi' ? 'सदस्यता जल्द समाप्त हो रही है' : 'Membership Expiring Soon')}
                </AlertTitle>
                <AlertDescription className={`${
                  isExpired ? 'text-red-700 dark:text-red-300' : 
                  renewalRejected ? 'text-orange-700 dark:text-orange-300' :
                  renewalPending ? 'text-blue-700 dark:text-blue-300' :
                  'text-amber-700 dark:text-amber-300'
                }`}>
                  {isExpired ? (
                    language === 'hi' 
                      ? `आपकी ${profile.membershipPlan === '1-year' ? '1 वर्ष' : '6 महीने'} की सदस्यता ${expiryDate?.toLocaleDateString('hi-IN')} को समाप्त हो गई। कृपया नवीनीकरण करें।`
                      : `Your ${profile.membershipPlan === '1-year' ? '1 Year' : '6 Month'} membership expired on ${expiryDate?.toLocaleDateString()}. Please renew to continue enjoying premium features.`
                  ) : renewalPending ? (
                    language === 'hi'
                      ? 'आपका नवीनीकरण भुगतान स्क्रीनशॉट सत्यापन के लिए प्रस्तुत किया गया है। कृपया प्रतीक्षा करें।'
                      : 'Your renewal payment screenshot has been submitted for verification. Please wait for admin approval.'
                  ) : renewalRejected ? (
                    <>
                      {language === 'hi' ? 'आपका नवीनीकरण भुगतान अस्वीकृत कर दिया गया।' : 'Your renewal payment was rejected.'}
                      {profile.renewalPaymentRejectionReason && (
                        <div className="mt-1 font-medium">
                          {language === 'hi' ? 'कारण:' : 'Reason:'} {profile.renewalPaymentRejectionReason}
                        </div>
                      )}
                    </>
                  ) : (
                    language === 'hi'
                      ? `आपकी सदस्यता ${daysToExpiry} दिनों में (${expiryDate?.toLocaleDateString('hi-IN')}) समाप्त हो रही है। अभी नवीनीकरण करें!`
                      : `Your membership expires in ${daysToExpiry} days (${expiryDate?.toLocaleDateString()}). Renew now to avoid interruption!`
                  )}
                  
                  {!renewalPending && (
                    <Button 
                      onClick={() => setShowRenewalDialog(true)}
                      className={`mt-3 gap-2 ${
                        isExpired || renewalRejected ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                      } text-white`}
                    >
                      <ArrowClockwise size={20} weight="bold" />
                      {renewalRejected 
                        ? (language === 'hi' ? 'पुनः भुगतान स्क्रीनशॉट अपलोड करें' : 'Re-upload Payment Screenshot')
                        : (language === 'hi' ? 'सदस्यता नवीनीकरण करें' : 'Renew Membership')}
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )
          })()
        )}

        {/* Renewal Payment Dialog */}
        <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowClockwise size={24} className="text-primary" />
                {language === 'hi' ? 'सदस्यता नवीनीकरण' : 'Renew Membership'}
              </DialogTitle>
              <DialogDescription>
                {language === 'hi' 
                  ? 'अपनी प्रीमियम सुविधाओं का आनंद लेना जारी रखने के लिए अपनी सदस्यता नवीनीकृत करें।'
                  : 'Renew your membership to continue enjoying premium features.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Plan Selection */}
              <div className="space-y-2">
                <Label>{language === 'hi' ? 'नवीनीकरण योजना चुनें' : 'Select Renewal Plan'}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={renewalPlan === '6-month' ? 'default' : 'outline'}
                    className={`h-auto py-3 flex flex-col ${renewalPlan === '6-month' ? 'bg-primary' : ''}`}
                    onClick={() => setRenewalPlan('6-month')}
                  >
                    <span className="font-bold">{language === 'hi' ? '6 महीने' : '6 Months'}</span>
                    <span className="text-lg">₹1,499</span>
                  </Button>
                  <Button
                    type="button"
                    variant={renewalPlan === '1-year' ? 'default' : 'outline'}
                    className={`h-auto py-3 flex flex-col ${renewalPlan === '1-year' ? 'bg-accent text-accent-foreground' : ''}`}
                    onClick={() => setRenewalPlan('1-year')}
                  >
                    <span className="font-bold">{language === 'hi' ? '1 वर्ष' : '1 Year'}</span>
                    <span className="text-lg">₹2,499</span>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {language === 'hi' ? '17% बचत' : 'Save 17%'}
                    </Badge>
                  </Button>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                <h4 className="font-semibold flex items-center gap-2">
                  <CurrencyInr size={18} className="text-primary" />
                  {language === 'hi' ? 'भुगतान विवरण' : 'Payment Details'}
                </h4>
                
                {/* UPI */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">UPI ID</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-background rounded border text-sm font-mono">
                      shaadipartner@upi
                    </code>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText('shaadipartner@upi')
                        toast.success(language === 'hi' ? 'UPI ID कॉपी किया गया!' : 'UPI ID copied!')
                      }}
                    >
                      {language === 'hi' ? 'कॉपी' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {language === 'hi' ? 'बैंक विवरण' : 'Bank Details'}
                  </Label>
                  <div className="text-sm space-y-1 p-2 bg-background rounded border">
                    <p><span className="text-muted-foreground">{language === 'hi' ? 'बैंक:' : 'Bank:'}</span> State Bank of India</p>
                    <p><span className="text-muted-foreground">{language === 'hi' ? 'खाता नाम:' : 'Account Name:'}</span> Shaadi Partner Services</p>
                    <p><span className="text-muted-foreground">{language === 'hi' ? 'खाता संख्या:' : 'Account No:'}</span> 1234567890</p>
                    <p><span className="text-muted-foreground">IFSC:</span> SBIN0001234</p>
                  </div>
                </div>

                <p className="text-sm text-primary font-medium">
                  {language === 'hi' 
                    ? `कृपया ₹${renewalPlan === '1-year' ? '2,499' : '1,499'} का भुगतान करें और स्क्रीनशॉट अपलोड करें।`
                    : `Please pay ₹${renewalPlan === '1-year' ? '2,499' : '1,499'} and upload the screenshot.`}
                </p>
              </div>

              {/* Payment Screenshot Upload */}
              <div className="space-y-2">
                <Label>{language === 'hi' ? 'भुगतान स्क्रीनशॉट अपलोड करें *' : 'Upload Payment Screenshot *'}</Label>
                <input
                  type="file"
                  ref={renewalFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setRenewalPaymentFile(file)
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        setRenewalPaymentPreview(e.target?.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
                <div 
                  onClick={() => renewalFileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary transition-colors text-center"
                >
                  {renewalPaymentPreview ? (
                    <div className="space-y-2">
                      <img 
                        src={renewalPaymentPreview} 
                        alt="Payment Screenshot"
                        className="max-h-48 mx-auto rounded-lg object-contain"
                      />
                      <p className="text-sm text-muted-foreground">
                        {language === 'hi' ? 'दूसरी छवि चुनने के लिए क्लिक करें' : 'Click to select another image'}
                      </p>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Camera size={32} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {language === 'hi' ? 'स्क्रीनशॉट अपलोड करने के लिए क्लिक करें' : 'Click to upload screenshot'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRenewalDialog(false)
                    setRenewalPaymentFile(null)
                    setRenewalPaymentPreview(null)
                  }}
                  className="flex-1"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
                <Button 
                  onClick={() => {
                    if (!renewalPaymentPreview) {
                      toast.error(language === 'hi' ? 'कृपया भुगतान स्क्रीनशॉट अपलोड करें' : 'Please upload payment screenshot')
                      return
                    }
                    
                    if (onUpdateProfile && profile) {
                      onUpdateProfile({
                        id: profile.id,
                        renewalPaymentScreenshotUrl: renewalPaymentPreview,
                        renewalPaymentStatus: 'pending',
                        renewalPaymentAmount: renewalPlan === '1-year' ? 900 : 500,
                        renewalPaymentUploadedAt: new Date().toISOString(),
                        membershipPlan: renewalPlan
                      })
                    }
                    
                    toast.success(
                      language === 'hi' ? 'नवीनीकरण अनुरोध प्रस्तुत!' : 'Renewal Request Submitted!',
                      {
                        description: language === 'hi' 
                          ? 'आपका भुगतान स्क्रीनशॉट सत्यापन के लिए भेजा गया है।'
                          : 'Your payment screenshot has been submitted for verification.'
                      }
                    )
                    
                    setShowRenewalDialog(false)
                    setRenewalPaymentFile(null)
                    setRenewalPaymentPreview(null)
                  }}
                  disabled={!renewalPaymentPreview}
                  className="flex-1 gap-2"
                >
                  <CheckCircle size={20} />
                  {language === 'hi' ? 'भुगतान प्रस्तुत करें' : 'Submit Payment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {photos.length > 0 ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowPhotoLightbox(true)}
                        className="aspect-square rounded-lg overflow-hidden bg-muted w-full cursor-zoom-in hover:opacity-90 transition-opacity ring-2 ring-transparent hover:ring-primary focus:ring-primary focus:outline-none relative group"
                        title={language === 'hi' ? 'बड़ा करने के लिए क्लिक करें' : 'Click to enlarge'}
                      >
                        <img 
                          src={photos[currentPhotoIndex]} 
                          alt={profile.fullName}
                          className="w-full h-full object-cover"
                        />
                        {/* Zoom indicator overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Zm112,0a8,8,0,0,1-8,8H120v24a8,8,0,0,1-16,0V120H80a8,8,0,0,1,0-16h24V80a8,8,0,0,1,16,0v24h24A8,8,0,0,1,152,112Z"></path></svg>
                            {language === 'hi' ? 'बड़ा करें' : 'Enlarge'}
                          </div>
                        </div>
                      </button>
                      {photos.length > 1 && (
                        <div className="grid grid-cols-5 gap-2">
                          {photos.map((photo, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentPhotoIndex(index)}
                              className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                                currentPhotoIndex === index ? 'border-primary' : 'border-transparent'
                              }`}
                            >
                              <img 
                                src={photo} 
                                alt={`Photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                      <User size={64} className="text-muted-foreground" />
                    </div>
                  )}

                  <div className="text-center pt-4">
                    <h2 className="text-2xl font-bold">{profile.fullName}</h2>
                    <p className="text-muted-foreground">
                      {profile.age} {t.years}
                    </p>
                    <div className="mt-2">
                      <Badge variant="secondary">
                        {t.profileId}: {profile.profileId}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Badge variant={profile.status === 'verified' ? 'default' : 'secondary'}>
                        {profile.status === 'verified' ? t.verified : t.pending}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline">
                        {t.trustLevel} {profile.trustLevel}
                      </Badge>
                    </div>
                    {profile.digilockerVerified && (
                      <div className="mt-2">
                        <Badge className="bg-green-600 hover:bg-green-700">
                          ✓ {t.digilockerVerified}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Tabs defaultValue="personal" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">{t.personalInfo}</TabsTrigger>
                <TabsTrigger value="family">{t.familyInfo}</TabsTrigger>
                <TabsTrigger value="contact">{t.contactInfo}</TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.personalInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.bio && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Heart size={18} />
                          {t.aboutMe}
                        </h4>
                        <p className="text-muted-foreground">{profile.bio}</p>
                      </div>
                    )}
                    
                    <Separator />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.age}</p>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar size={16} />
                          {profile.age} {t.years}
                        </p>
                      </div>

                      {profile.height && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.height}</p>
                          <p className="font-medium">{profile.height}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground">{t.education}</p>
                        <p className="font-medium flex items-center gap-2">
                          <GraduationCap size={16} />
                          {profile.education}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">{t.occupation}</p>
                        <p className="font-medium flex items-center gap-2">
                          <Briefcase size={16} />
                          {profile.occupation}
                        </p>
                      </div>

                      {profile.salary && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.salary}</p>
                          <p className="font-medium flex items-center gap-2">
                            <CurrencyInr size={16} />
                            {profile.salary}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground">{t.location}</p>
                        <p className="font-medium flex items-center gap-2">
                          <MapPin size={16} />
                          {profile.location}{profile.state ? `, ${profile.state}` : ''}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">{t.country}</p>
                        <p className="font-medium">{profile.country || 'India'}</p>
                      </div>

                      {profile.residentialStatus && profile.country !== 'India' && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.residentialStatus}</p>
                          <p className="font-medium">{getResidentialStatusLabel(profile.residentialStatus)}</p>
                        </div>
                      )}

                      {profile.religion && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.religion}</p>
                          <p className="font-medium">{profile.religion}</p>
                        </div>
                      )}

                      {profile.caste && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.caste}</p>
                          <p className="font-medium">{profile.caste}</p>
                        </div>
                      )}

                      {profile.community && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.community}</p>
                          <p className="font-medium">{profile.community}</p>
                        </div>
                      )}

                      {profile.motherTongue && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.motherTongue}</p>
                          <p className="font-medium">{profile.motherTongue}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground">{t.maritalStatus}</p>
                        <p className="font-medium">{getMaritalStatusLabel(profile.maritalStatus)}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">{t.manglik}</p>
                        <p className="font-medium">{getManglikLabel(profile.manglik)}</p>
                      </div>
                    </div>

                    {/* Lifestyle Section */}
                    <Separator />
                    <h4 className="font-semibold flex items-center gap-2 text-primary">
                      {t.lifestyleInfo}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.diet}</p>
                        <p className="font-medium">{getDietLabel(profile.dietPreference)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t.drinking}</p>
                        <p className="font-medium">{getHabitLabel(profile.drinkingHabit)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t.smoking}</p>
                        <p className="font-medium">{getHabitLabel(profile.smokingHabit)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="family">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.familyInfo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.familyDetails ? (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <House size={18} />
                          {t.familyDetails}
                        </h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{profile.familyDetails}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        {language === 'hi' ? 'कोई पारिवारिक जानकारी नहीं' : 'No family information'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contact">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.contactInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t.email}</p>
                      <p className="font-medium flex items-center gap-2">
                        <Envelope size={18} />
                        {profile.hideEmail ? 'XXX@XXX.com' : profile.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t.mobile}</p>
                      <p className="font-medium flex items-center gap-2">
                        <Phone size={18} />
                        {profile.hideMobile ? '+91 XXXXXXXXXX' : profile.mobile}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="mt-6">
          <Card>
            <CardContent className="py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="gap-2" disabled>
                  <Heart size={20} weight="fill" />
                  {language === 'hi' ? 'मुखपृष्ठ' : 'Home'}
                </Button>
                <Button variant="outline" className="gap-2" disabled>
                  <User size={20} />
                  {language === 'hi' ? 'मेरी गतिविधि' : 'My Activity'}
                </Button>
                <Button variant="outline" className="gap-2" disabled>
                  <Envelope size={20} />
                  {language === 'hi' ? 'इनबॉक्स' : 'Inbox'}
                </Button>
                <Button variant="outline" className="gap-2" disabled>
                  <ChatCircle size={20} />
                  {language === 'hi' ? 'चैट' : 'Chat'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Photo Lightbox for enlarged view */}
      {photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          initialIndex={currentPhotoIndex}
          open={showPhotoLightbox}
          onClose={() => setShowPhotoLightbox(false)}
        />
      )}
    </div>
  )
}
