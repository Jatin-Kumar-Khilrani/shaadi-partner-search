import { useState, useRef, useEffect } from 'react'
import { useKV } from '@/hooks/useKV'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { formatEducation, formatOccupation } from '@/lib/utils'
import { 
  User, MapPin, Briefcase, GraduationCap, Heart, House, PencilSimple,
  ChatCircle, Envelope, Phone, Calendar, Warning, FilePdf, Trash,
  CurrencyInr, ArrowClockwise, Camera, CheckCircle, ProhibitInset, ArrowUp,
  Confetti, UserCirclePlus, HeartBreak, Upload, CreditCard, Receipt
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Profile, Interest, ProfileDeletionReason, ProfileDeletionData, SuccessStory } from '@/types/profile'
import type { Language } from '@/lib/translations'
import { BiodataGenerator } from './BiodataGenerator'
import { PhotoLightbox } from './PhotoLightbox'
import { CameraCapture } from '@/components/ui/CameraCapture'

// Membership settings interface for pricing
interface MembershipSettings {
  sixMonthPrice: number
  oneYearPrice: number
}

// Default pricing
const DEFAULT_PRICING: MembershipSettings = {
  sixMonthPrice: 500,
  oneYearPrice: 900
}

interface MyProfileProps {
  profile: Profile | null
  profiles?: Profile[]  // All profiles for partner selection
  language: Language
  onEdit?: () => void
  onUpgradeNow?: () => void  // Opens edit dialog directly at membership plan step
  onDeleteProfile?: (profileId: string, deletionData?: ProfileDeletionData) => void
  onUpdateProfile?: (updatedProfile: Partial<Profile>) => void
  onRefreshProfile?: () => Promise<void>  // Callback to refresh profile data from server
  membershipSettings?: MembershipSettings
  onNavigateHome?: () => void
  onNavigateActivity?: () => void
  onNavigateInbox?: () => void
  onNavigateChat?: () => void
}

export function MyProfile({ profile, profiles = [], language, onEdit, onUpgradeNow, onDeleteProfile, onUpdateProfile, onRefreshProfile, membershipSettings, onNavigateHome, onNavigateActivity, onNavigateInbox, onNavigateChat }: MyProfileProps) {
  // Get interests from KV store for accepted interests selection
  const [interests] = useKV<Interest[]>('interests', [])
  
  // Get pricing from settings or defaults
  const pricing = {
    sixMonth: membershipSettings?.sixMonthPrice || DEFAULT_PRICING.sixMonthPrice,
    oneYear: membershipSettings?.oneYearPrice || DEFAULT_PRICING.oneYearPrice
  }
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showPhotoLightbox, setShowPhotoLightbox] = useState(false)
  const [showBiodataGenerator, setShowBiodataGenerator] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditConfirmDialog, setShowEditConfirmDialog] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'reason' | 'partner-select' | 'consent' | 'otp'>('reason')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [enteredOtp, setEnteredOtp] = useState('')
  
  // Profile deletion state
  const [deletionReason, setDeletionReason] = useState<ProfileDeletionReason | ''>('')
  const [deletionReasonDetails, setDeletionReasonDetails] = useState('')
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [consentToPublish, setConsentToPublish] = useState(false)
  const [consentForPhotos, setConsentForPhotos] = useState(false)
  const [consentForName, setConsentForName] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [testimonial, setTestimonial] = useState('')
  
  // Get accepted interests for partner selection dropdown
  const acceptedInterests = interests?.filter(
    i => (i.toProfileId === profile?.profileId || i.fromProfileId === profile?.profileId) && 
       i.status === 'accepted'
  ) || []
  
  // Get unique partner profiles from accepted interests
  const acceptedPartnerProfiles = acceptedInterests.map(interest => {
    const partnerId = interest.fromProfileId === profile?.profileId 
      ? interest.toProfileId 
      : interest.fromProfileId
    return profiles.find(p => p.profileId === partnerId)
  }).filter((p): p is Profile => p !== undefined)
  
  // Renewal payment state
  const [showRenewalDialog, setShowRenewalDialog] = useState(false)
  const [renewalPlan, setRenewalPlan] = useState<'6-month' | '1-year'>('6-month')
  const [_renewalPaymentFile, setRenewalPaymentFile] = useState<File | null>(null)
  const [renewalPaymentPreview, setRenewalPaymentPreview] = useState<string | null>(null)
  const [showRenewalCamera, setShowRenewalCamera] = useState(false)
  const renewalFileInputRef = useRef<HTMLInputElement>(null)
  
  // Auto-refresh state for pending payment/approval
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)

  // Auto-poll for status changes when payment is pending or profile is pending approval
  useEffect(() => {
    const shouldPoll = profile && (
      // Poll when payment is pending verification
      (profile.status === 'pending' && profile.paymentStatus === 'pending' && 
       profile.paymentScreenshotUrls && profile.paymentScreenshotUrls.length > 0) ||
      // Poll when profile is pending approval
      (profile.status === 'pending' && !profile.returnedForEdit && !profile.returnedForPayment) ||
      // Poll when renewal payment is pending
      (profile.renewalPaymentStatus === 'pending')
    )

    if (!shouldPoll || !onRefreshProfile) return

    // Poll every 30 seconds
    const pollInterval = setInterval(async () => {
      try {
        await onRefreshProfile()
        setLastRefreshTime(new Date())
      } catch (error) {
        console.error('Auto-refresh failed:', error)
      }
    }, 30000)

    return () => clearInterval(pollInterval)
  }, [profile?.status, profile?.paymentStatus, profile?.renewalPaymentStatus, onRefreshProfile])

  const t = {
    title: language === 'hi' ? 'मेरी प्रोफाइल' : 'My Profile',
    edit: language === 'hi' ? 'संपादित करें' : 'Edit Profile',
    profileId: language === 'hi' ? 'प्रोफाइल ID' : 'Profile ID',
    personalInfo: language === 'hi' ? 'व्यक्तिगत' : 'Personal',
    familyInfo: language === 'hi' ? 'परिवार' : 'Family',
    contactInfo: language === 'hi' ? 'संपर्क' : 'Contact',
    partnerPreferences: language === 'hi' ? 'पार्टनर' : 'Partner Pref',
    lifestyleInfo: language === 'hi' ? 'जीवनशैली' : 'Lifestyle',
    gender: language === 'hi' ? 'लिंग' : 'Gender',
    age: language === 'hi' ? 'आयु' : 'Age',
    years: language === 'hi' ? 'वर्ष' : 'years',
    height: language === 'hi' ? 'ऊंचाई' : 'Height',
    weight: language === 'hi' ? 'वजन' : 'Weight',
    disability: language === 'hi' ? 'दिव्यांगता' : 'Disability',
    education: language === 'hi' ? 'शिक्षा' : 'Education',
    occupation: language === 'hi' ? 'रोजगार स्थिति' : 'Employment Status',
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
    dateOfBirth: language === 'hi' ? 'जन्म तिथि' : 'Date of Birth',
    birthTime: language === 'hi' ? 'जन्म समय' : 'Birth Time',
    birthPlace: language === 'hi' ? 'जन्म स्थान' : 'Birth Place',
    horoscopeMatching: language === 'hi' ? 'कुंडली मिलान' : 'Horoscope Matching',
    position: language === 'hi' ? 'पद/पदनाम' : 'Position/Designation',
    profileCreatedBy: language === 'hi' ? 'प्रोफाइल बनाने वाला' : 'Profile Created By',
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
    returnedForPayment: language === 'hi' ? 'भुगतान आवश्यक' : 'Payment Required',
    returnedForPaymentDesc: language === 'hi' ? 'आपकी प्रोफाइल सत्यापित हो गई है! पंजीकरण पूरा करने के लिए कृपया भुगतान स्क्रीनशॉट अपलोड करें।' : 'Your profile has been verified! Please upload payment screenshot to complete registration.',
    uploadPaymentScreenshot: language === 'hi' ? 'भुगतान अपलोड करें' : 'Upload Payment',
    generateBiodata: language === 'hi' ? 'बायोडाटा बनाएं' : 'Generate Biodata',
    deleteProfile: language === 'hi' ? 'प्रोफाइल हटाएं' : 'Delete Profile',
    deleteConfirmTitle: language === 'hi' ? 'प्रोफाइल हटाने का कारण बताएं' : 'Tell us why you are leaving',
    deleteConfirmDesc: language === 'hi' ? 'हम आपकी राय का सम्मान करते हैं। कृपया प्रोफाइल हटाने का कारण बताएं।' : 'We respect your decision. Please tell us why you are deleting your profile.',
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
    paymentAwaitingVerification: language === 'hi' ? 'भुगतान सत्यापन लंबित' : 'Payment Awaiting Verification',
    paymentAwaitingVerificationDesc: language === 'hi' ? 'आपका भुगतान स्क्रीनशॉट सफलतापूर्वक अपलोड किया गया है। एडमिन जल्द ही इसकी समीक्षा करेगा और आपकी सदस्यता सक्रिय करेगा।' : 'Your payment screenshot has been uploaded successfully. Admin will review it shortly and activate your membership.',
    // Profile deletion flow translations
    selectReason: language === 'hi' ? 'कारण चुनें' : 'Select Reason',
    reasonRequired: language === 'hi' ? 'कृपया कारण चुनें' : 'Please select a reason',
    next: language === 'hi' ? 'आगे' : 'Next',
    back: language === 'hi' ? 'पीछे' : 'Back',
    congratulations: language === 'hi' ? 'बधाई हो!' : 'Congratulations!',
    foundMatchHere: language === 'hi' ? 'शादी पार्टनर सर्च पर मिला मैच' : 'Found match on Shaadi Partner Search',
    foundMatchElsewhere: language === 'hi' ? 'अन्य प्लेटफॉर्म पर मिला मैच' : 'Found match elsewhere',
    foundMatchTraditional: language === 'hi' ? 'पारंपरिक/पारिवारिक व्यवस्था से' : 'Traditional/Family arrangement',
    notInterestedMatrimony: language === 'hi' ? 'विवाह में अभी रुचि नहीं' : 'Not interested in marriage right now',
    takingBreak: language === 'hi' ? 'कुछ समय के लिए विराम' : 'Taking a break',
    privacyConcerns: language === 'hi' ? 'गोपनीयता/सुरक्षा चिंता' : 'Privacy/Security concerns',
    familyDecision: language === 'hi' ? 'पारिवारिक निर्णय' : 'Family decision',
    technicalIssues: language === 'hi' ? 'तकनीकी समस्याएं' : 'Technical issues',
    poorExperience: language === 'hi' ? 'सेवा से संतुष्ट नहीं' : 'Not satisfied with service',
    otherReason: language === 'hi' ? 'अन्य कारण' : 'Other reason',
    specifyReason: language === 'hi' ? 'कृपया कारण बताएं' : 'Please specify the reason',
    selectPartner: language === 'hi' ? 'अपना पार्टनर चुनें' : 'Select Your Partner',
    selectPartnerDesc: language === 'hi' ? 'जिस व्यक्ति से आपकी शादी तय हुई है, उन्हें चुनें' : 'Select the person you are getting married to',
    selectFromAccepted: language === 'hi' ? 'स्वीकृत रुचियों में से चुनें' : 'Select from accepted interests',
    noAcceptedInterests: language === 'hi' ? 'कोई स्वीकृत रुचि नहीं मिली' : 'No accepted interests found',
    successStoryConsent: language === 'hi' ? 'सफलता की कहानी' : 'Success Story',
    successStoryConsentDesc: language === 'hi' ? 'क्या आप अपनी सफलता की कहानी हमारी वेबसाइट पर साझा करना चाहेंगे? इससे अन्य लोगों को प्रेरणा मिलेगी।' : 'Would you like to share your success story on our website? This will inspire others.',
    consentPublish: language === 'hi' ? 'हां, मैं अपनी सफलता की कहानी प्रकाशित करने की अनुमति देता/देती हूं' : 'Yes, I consent to publish my success story',
    consentPhotos: language === 'hi' ? 'मेरी तस्वीरों का उपयोग करने की अनुमति है' : 'I allow using my photos',
    consentName: language === 'hi' ? 'मेरे असली नाम का उपयोग करने की अनुमति है' : 'I allow using my real name',
    successStoryMessage: language === 'hi' ? '✨ अपनी सफलता की कहानी साझा करें और दूसरों को प्रेरित करें!' : '✨ Share your success story and inspire others!',
    feedbackOptional: language === 'hi' ? 'प्रतिक्रिया (वैकल्पिक)' : 'Feedback (Optional)',
    feedbackPlaceholder: language === 'hi' ? 'अपना अनुभव साझा करें...' : 'Share your experience...',
    thankYouSuccess: language === 'hi' ? 'धन्यवाद! आपकी सफलता की कहानी हमें प्रेरित करती है।' : 'Thank you! Your success story inspires us.',
    storySubmitted: language === 'hi' ? 'आपकी कहानी समीक्षा के लिए सबमिट हो गई है' : 'Your story has been submitted for review',
    proceedToVerify: language === 'hi' ? 'सत्यापित करें और हटाएं' : 'Verify & Delete',
    testimonialLabel: language === 'hi' ? 'अपनी कहानी साझा करें (वैकल्पिक)' : 'Share Your Story (Optional)',
    testimonialPlaceholder: language === 'hi' ? 'आपकी प्रेम कहानी कैसे शुरू हुई? अन्य लोगों को प्रेरित करें...' : 'How did your love story begin? Inspire others...',
    testimonialHint: language === 'hi' ? 'आपकी कहानी एडमिन द्वारा समीक्षा/संपादन के बाद प्रकाशित की जाएगी' : 'Your story will be published after admin review/edit',
    adminMayEdit: language === 'hi' ? 'एडमिन प्रकाशन से पहले संपादित कर सकता है' : 'Admin may edit before publishing',
  }

  // Deletion reason options
  const deletionReasonOptions: { value: ProfileDeletionReason; label: string; icon: React.ReactNode }[] = [
    { value: 'found-match-shaadi-partner-search', label: t.foundMatchHere, icon: <Heart size={20} weight="fill" className="text-rose-500" /> },
    { value: 'found-match-elsewhere', label: t.foundMatchElsewhere, icon: <Heart size={20} className="text-rose-400" /> },
    { value: 'found-match-traditional', label: t.foundMatchTraditional, icon: <UserCirclePlus size={20} className="text-amber-500" /> },
    { value: 'not-interested-matrimony', label: t.notInterestedMatrimony, icon: <HeartBreak size={20} className="text-gray-500" /> },
    { value: 'taking-break', label: t.takingBreak, icon: <Calendar size={20} className="text-blue-500" /> },
    { value: 'privacy-concerns', label: t.privacyConcerns, icon: <Warning size={20} className="text-orange-500" /> },
    { value: 'family-decision', label: t.familyDecision, icon: <House size={20} className="text-purple-500" /> },
    { value: 'technical-issues', label: t.technicalIssues, icon: <Warning size={20} className="text-red-500" /> },
    { value: 'poor-experience', label: t.poorExperience, icon: <Warning size={20} className="text-yellow-500" /> },
    { value: 'other', label: t.otherReason, icon: <ChatCircle size={20} className="text-gray-500" /> },
  ]

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
      'none': { hi: 'कभी नहीं', en: 'Never' },
      'occasionally': { hi: 'कभी-कभी', en: 'Occasionally' },
      'occasionally-drinking': { hi: 'कभी-कभी', en: 'Occasionally' },
      'occasionally-smoking': { hi: 'कभी-कभी', en: 'Occasionally' },
      'regularly': { hi: 'नियमित', en: 'Regularly' },
      'smoking': { hi: 'नियमित', en: 'Regularly' },
      'drinking': { hi: 'नियमित', en: 'Regularly' },
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

  const getGenderLabel = (gender: string | undefined) => {
    const labels: Record<string, { hi: string; en: string }> = {
      'male': { hi: 'पुरुष', en: 'Male' },
      'female': { hi: 'महिला', en: 'Female' },
    }
    return gender ? (labels[gender]?.[language] || gender) : '-'
  }

  const getDisabilityLabel = (disability: string | undefined) => {
    if (!disability) return '-'
    // Simplified to Yes/No - details can be discussed personally between parties
    if (disability === 'no') {
      return language === 'hi' ? 'नहीं' : 'No'
    }
    return language === 'hi' ? 'हां' : 'Yes'
  }

  const getHoroscopeMatchingLabel = (horoscope: string | undefined) => {
    const labels: Record<string, { hi: string; en: string }> = {
      'mandatory': { hi: 'अनिवार्य', en: 'Mandatory' },
      'preferred': { hi: 'वांछित', en: 'Preferred' },
      'not-mandatory': { hi: 'आवश्यक नहीं', en: 'Not Required' },
      'decide-later': { hi: 'बाद में तय करेंगे', en: 'Decide Later' },
    }
    return horoscope ? (labels[horoscope]?.[language] || horoscope) : '-'
  }

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!profile) return { percentage: 0, missingFields: [] as string[], tips: [] as string[] }
    
    const fields = [
      { key: 'fullName', label: language === 'hi' ? 'नाम' : 'Name', filled: !!profile.fullName },
      { key: 'gender', label: language === 'hi' ? 'लिंग' : 'Gender', filled: !!profile.gender },
      { key: 'dateOfBirth', label: language === 'hi' ? 'जन्म तिथि' : 'Date of Birth', filled: !!profile.dateOfBirth },
      { key: 'photos', label: language === 'hi' ? 'फोटो' : 'Photos', filled: profile.photos && profile.photos.length > 0 },
      { key: 'education', label: language === 'hi' ? 'शिक्षा' : 'Education', filled: !!profile.education },
      { key: 'occupation', label: language === 'hi' ? 'व्यवसाय' : 'Occupation', filled: !!profile.occupation },
      { key: 'salary', label: language === 'hi' ? 'आय' : 'Income', filled: !!profile.salary },
      { key: 'religion', label: language === 'hi' ? 'धर्म' : 'Religion', filled: !!profile.religion },
      { key: 'caste', label: language === 'hi' ? 'जाति' : 'Caste', filled: !!profile.caste },
      { key: 'motherTongue', label: language === 'hi' ? 'मातृभाषा' : 'Mother Tongue', filled: !!profile.motherTongue },
      { key: 'height', label: language === 'hi' ? 'ऊंचाई' : 'Height', filled: !!profile.height },
      { key: 'location', label: language === 'hi' ? 'स्थान' : 'Location', filled: !!profile.location },
      { key: 'bio', label: language === 'hi' ? 'परिचय' : 'About Me', filled: !!profile.bio },
      { key: 'familyDetails', label: language === 'hi' ? 'पारिवारिक विवरण' : 'Family Details', filled: !!profile.familyDetails },
      { key: 'partnerPreferences', label: language === 'hi' ? 'पार्टनर प्राथमिकता' : 'Partner Preferences', filled: !!(profile.partnerPreferences && (profile.partnerPreferences.ageMin || profile.partnerPreferences.education?.length)) },
    ]
    
    const filledCount = fields.filter(f => f.filled).length
    const percentage = Math.round((filledCount / fields.length) * 100)
    const missingFields = fields.filter(f => !f.filled).map(f => f.label)
    
    const tips: string[] = []
    if (!profile.photos || profile.photos.length < 3) {
      tips.push(language === 'hi' ? '3+ फोटो अपलोड करने से 40% अधिक प्रतिक्रिया मिलती है' : 'Adding 3+ photos increases responses by 40%')
    }
    if (!profile.bio) {
      tips.push(language === 'hi' ? 'अपना परिचय लिखें - यह प्रोफाइल को आकर्षक बनाता है' : 'Write about yourself - it makes your profile attractive')
    }
    if (!profile.familyDetails) {
      tips.push(language === 'hi' ? 'पारिवारिक विवरण जोड़ने से विश्वास बढ़ता है' : 'Adding family details builds trust')
    }
    
    return { percentage, missingFields, tips }
  }

  const profileCompletion = calculateProfileCompletion()

  const getProfileCreatedByLabel = (relation: string | undefined) => {
    const labels: Record<string, { hi: string; en: string }> = {
      'Self': { hi: 'स्वयं', en: 'Self' },
      'Daughter': { hi: 'बेटी', en: 'Daughter' },
      'Son': { hi: 'बेटा', en: 'Son' },
      'Brother': { hi: 'भाई', en: 'Brother' },
      'Sister': { hi: 'बहन', en: 'Sister' },
    }
    return relation ? (labels[relation]?.[language] || relation) : (language === 'hi' ? 'स्वयं' : 'Self')
  }

  const formatDateDDMMYYYY = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return dateStr
    }
  }

  const handleEditClick = () => {
    // If profile is returned for edit or returned for payment, go directly to edit
    // (The RegistrationDialog will handle the correct step based on profile state)
    if (profile?.returnedForEdit || profile?.returnedForPayment) {
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
    setDeleteStep('reason')
    // Reset all deletion state
    setDeletionReason('')
    setDeletionReasonDetails('')
    setSelectedPartnerId('')
    setConsentToPublish(false)
    setConsentForPhotos(false)
    setConsentForName(false)
    setFeedbackMessage('')
    setEnteredOtp('')
    setGeneratedOtp('')
  }

  const handleReasonNext = () => {
    if (!deletionReason) {
      toast.error(t.reasonRequired)
      return
    }
    
    if (deletionReason === 'other' && !deletionReasonDetails.trim()) {
      toast.error(t.specifyReason)
      return
    }
    
    // If found match from this platform, ask for partner selection
    if (deletionReason === 'found-match-shaadi-partner-search') {
      setDeleteStep('partner-select')
    } else {
      // For other reasons, skip to OTP
      setDeleteStep('otp')
      handleSendOtp()
    }
  }

  const handlePartnerSelectNext = () => {
    if (!selectedPartnerId) {
      toast.error(language === 'hi' ? 'कृपया अपना पार्टनर चुनें' : 'Please select your partner')
      return
    }
    // Go to consent step
    setDeleteStep('consent')
  }

  const handleConsentNext = () => {
    // Proceed to OTP verification
    setDeleteStep('otp')
    handleSendOtp()
  }

  const handleSendOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(otp)
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
      // Prepare deletion data
      const selectedPartner = acceptedPartnerProfiles.find(p => p.profileId === selectedPartnerId)
      const deletionData: ProfileDeletionData = {
        reason: deletionReason as ProfileDeletionReason,
        reasonDetails: deletionReasonDetails || undefined,
        partnerId: selectedPartnerId || undefined,
        partnerName: selectedPartner?.fullName || selectedPartner?.firstName || undefined,
        consentToPublish,
        consentForPhotos,
        consentForName,
        feedbackMessage: feedbackMessage || undefined,
        testimonial: testimonial || undefined,
      }
      
      onDeleteProfile(profile.profileId, deletionData)
      
      if (deletionReason === 'found-match-shaadi-partner-search' && consentToPublish) {
        toast.success(t.thankYouSuccess, {
          description: t.storySubmitted,
          duration: 5000
        })
      } else {
        toast.success(t.profileDeleted)
      }
      
      handleCloseDeleteDialog()
    }
  }

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false)
    setDeleteStep('reason')
    setDeletionReason('')
    setDeletionReasonDetails('')
    setSelectedPartnerId('')
    setConsentToPublish(false)
    setConsentForPhotos(false)
    setConsentForName(false)
    setFeedbackMessage('')
    setTestimonial('')
    setEnteredOtp('')
    setGeneratedOtp('')
  }

  const handleDeleteStepBack = () => {
    if (deleteStep === 'partner-select') {
      setDeleteStep('reason')
    } else if (deleteStep === 'consent') {
      setDeleteStep('partner-select')
    } else if (deleteStep === 'otp') {
      if (deletionReason === 'found-match-shaadi-partner-search') {
        setDeleteStep('consent')
      } else {
        setDeleteStep('reason')
      }
    }
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
  const isVerifiedOrApproved = profile.status === 'verified'
  // Free users can generate biodata with watermark, premium users without watermark
  const canGenerateBiodata = isVerifiedOrApproved
  const _canDownloadWithoutWatermark = isPaidUser && !isFreePlan && isVerifiedOrApproved

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <div className="flex gap-2">
            {canGenerateBiodata && (
            <Button 
              onClick={() => setShowBiodataGenerator(true)} 
              variant="outline"
              className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              <FilePdf size={20} weight="fill" />
              {t.generateBiodata}
              {isFreePlan && <Badge variant="secondary" className="ml-1 text-xs">{language === 'hi' ? 'वॉटरमार्क' : 'Watermark'}</Badge>}
            </Button>
            )}
            {onEdit && !(
              profile?.status === 'pending' && 
              profile?.paymentStatus === 'pending' && 
              profile?.paymentScreenshotUrls && 
              profile?.paymentScreenshotUrls.length > 0 &&
              !profile?.returnedForPayment
            ) && (
              <Button 
                onClick={handleEditClick} 
                className={`gap-2 ${profile?.returnedForPayment ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                {profile?.returnedForPayment ? (
                  <>
                    <Upload size={20} />
                    {t.uploadPaymentScreenshot}
                  </>
                ) : (
                  <>
                    <PencilSimple size={20} />
                    {t.edit}
                  </>
                )}
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

        {/* Profile Completion Indicator */}
        {profileCompletion.percentage < 100 && (
          <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className={profileCompletion.percentage >= 80 ? 'text-green-500' : 'text-amber-500'} />
                  <span className="font-semibold">
                    {language === 'hi' ? 'प्रोफाइल पूर्णता' : 'Profile Completion'}
                  </span>
                </div>
                <Badge variant={profileCompletion.percentage >= 80 ? 'default' : 'secondary'} className={profileCompletion.percentage >= 80 ? 'bg-green-500' : ''}>
                  {profileCompletion.percentage}%
                </Badge>
              </div>
              <Progress value={profileCompletion.percentage} className="h-2 mb-3" />
              
              {profileCompletion.missingFields.length > 0 && (
                <div className="text-sm text-muted-foreground mb-2">
                  <span className="font-medium">{language === 'hi' ? 'अधूरे फील्ड:' : 'Missing fields:'}</span>{' '}
                  {profileCompletion.missingFields.slice(0, 3).join(', ')}
                  {profileCompletion.missingFields.length > 3 && ` +${profileCompletion.missingFields.length - 3} ${language === 'hi' ? 'और' : 'more'}`}
                </div>
              )}
              
              {profileCompletion.tips.length > 0 && (
                <div className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <span>{profileCompletion.tips[0]}</span>
                </div>
              )}
              
              {onEdit && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-3 gap-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={handleEditClick}
                >
                  <ArrowUp size={16} />
                  {language === 'hi' ? 'प्रोफाइल पूरी करें' : 'Complete Profile'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delete Profile Dialog - Multi-step flow */}
        <Dialog open={showDeleteDialog} onOpenChange={handleCloseDeleteDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {deleteStep === 'consent' ? (
                  <>
                    <Confetti size={24} className="text-amber-500" />
                    {t.congratulations}
                  </>
                ) : (
                  <>
                    <Trash size={24} className="text-destructive" />
                    {t.deleteConfirmTitle}
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {deleteStep === 'consent' 
                  ? t.successStoryConsentDesc 
                  : t.deleteConfirmDesc}
              </DialogDescription>
            </DialogHeader>
            
            {/* Step 1: Reason Selection */}
            {deleteStep === 'reason' && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>{t.selectReason}</Label>
                  <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                    {deletionReasonOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => setDeletionReason(option.value)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          deletionReason === option.value 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {option.icon}
                        <span className="text-sm font-medium">{option.label}</span>
                        {deletionReason === option.value && (
                          <CheckCircle size={20} weight="fill" className="ml-auto text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Show text area for 'other' reason */}
                {deletionReason === 'other' && (
                  <div className="space-y-2">
                    <Label>{t.specifyReason}</Label>
                    <Textarea
                      value={deletionReasonDetails}
                      onChange={(e) => setDeletionReasonDetails(e.target.value)}
                      placeholder={t.specifyReason}
                      rows={3}
                    />
                  </div>
                )}
                
                {/* Optional feedback for all reasons */}
                <div className="space-y-2">
                  <Label>{t.feedbackOptional}</Label>
                  <Textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder={t.feedbackPlaceholder}
                    rows={2}
                  />
                </div>
                
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" onClick={handleCloseDeleteDialog} className="flex-1">
                    {t.cancel}
                  </Button>
                  <Button 
                    onClick={handleReasonNext} 
                    className="flex-1"
                    disabled={!deletionReason}
                  >
                    {t.next}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 2: Partner Selection (only for found-match-shaadi-partner-search) */}
            {deleteStep === 'partner-select' && (
              <div className="space-y-4 mt-4">
                <Alert className="bg-rose-50 border-rose-200">
                  <Heart size={20} weight="fill" className="text-rose-500" />
                  <AlertTitle className="text-rose-700">{t.congratulations}</AlertTitle>
                  <AlertDescription className="text-rose-600">
                    {t.selectPartnerDesc}
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label>{t.selectFromAccepted}</Label>
                  {acceptedPartnerProfiles.length > 0 ? (
                    <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.selectPartner} />
                      </SelectTrigger>
                      <SelectContent>
                        {acceptedPartnerProfiles.map((partner) => (
                          <SelectItem key={partner.profileId} value={partner.profileId}>
                            <div className="flex items-center gap-2">
                              {partner.photos?.[0] ? (
                                <img 
                                  src={partner.photos[0]} 
                                  alt={partner.fullName || partner.firstName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User size={16} className="text-gray-500" />
                                </div>
                              )}
                              <div>
                                <span className="font-medium">{partner.fullName || partner.firstName}</span>
                                <span className="text-muted-foreground ml-2 text-xs">
                                  ({partner.profileId})
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Alert>
                      <Warning size={18} />
                      <AlertDescription>{t.noAcceptedInterests}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" onClick={handleDeleteStepBack} className="flex-1">
                    {t.back}
                  </Button>
                  <Button 
                    onClick={handlePartnerSelectNext} 
                    className="flex-1"
                    disabled={!selectedPartnerId}
                  >
                    {t.next}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 3: Success Story Consent (only for found-match-shaadi-partner-search) */}
            {deleteStep === 'consent' && (
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart size={24} className="text-rose-600" />
                    <span className="font-semibold text-rose-800">{t.successStoryMessage}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="consent-publish"
                        checked={consentToPublish}
                        onCheckedChange={(checked) => setConsentToPublish(checked as boolean)}
                      />
                      <Label htmlFor="consent-publish" className="text-sm leading-relaxed cursor-pointer">
                        {t.consentPublish}
                      </Label>
                    </div>
                    
                    {consentToPublish && (
                      <>
                        <div className="flex items-start gap-3 ml-6">
                          <Checkbox
                            id="consent-photos"
                            checked={consentForPhotos}
                            onCheckedChange={(checked) => setConsentForPhotos(checked as boolean)}
                          />
                          <Label htmlFor="consent-photos" className="text-sm cursor-pointer">
                            {t.consentPhotos}
                          </Label>
                        </div>
                        
                        <div className="flex items-start gap-3 ml-6">
                          <Checkbox
                            id="consent-name"
                            checked={consentForName}
                            onCheckedChange={(checked) => setConsentForName(checked as boolean)}
                          />
                          <Label htmlFor="consent-name" className="text-sm cursor-pointer">
                            {t.consentName}
                          </Label>
                        </div>
                        
                        {/* Testimonial Input */}
                        <div className="ml-6 mt-3">
                          <Label htmlFor="testimonial" className="text-sm font-medium text-gray-700">
                            {t.testimonialLabel}
                          </Label>
                          <Textarea
                            id="testimonial"
                            value={testimonial}
                            onChange={(e) => setTestimonial(e.target.value)}
                            placeholder={t.testimonialPlaceholder}
                            className="mt-1"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {t.testimonialHint} {t.adminMayEdit}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" onClick={handleDeleteStepBack} className="flex-1">
                    {t.back}
                  </Button>
                  <Button onClick={handleConsentNext} className="flex-1">
                    {t.proceedToVerify}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 4: OTP Verification */}
            {deleteStep === 'otp' && (
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
                
                {/* Summary of what will happen */}
                <div className="p-3 rounded-lg bg-gray-50 border text-sm space-y-1">
                  <p className="font-medium text-gray-700">
                    {language === 'hi' ? 'सारांश:' : 'Summary:'}
                  </p>
                  <p className="text-gray-600">
                    • {deletionReasonOptions.find(o => o.value === deletionReason)?.label}
                  </p>
                  {selectedPartnerId && (
                    <p className="text-gray-600">
                      • {language === 'hi' ? 'पार्टनर:' : 'Partner:'} {acceptedPartnerProfiles.find(p => p.profileId === selectedPartnerId)?.fullName}
                    </p>
                  )}
                  {consentToPublish && (
                    <p className="text-green-600">
                      • {language === 'hi' ? 'सफलता की कहानी के लिए सहमति दी' : 'Consented for success story'}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleDeleteStepBack} className="flex-1">
                    {t.back}
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
          isPaidUser={!!isPaidUser}
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

        {/* Returned for Payment Alert */}
        {profile.status === 'pending' && profile.returnedForPayment && (
          <Alert className={`mb-6 ${profile.paymentRejectionReason ? 'bg-red-50 border-red-400 dark:bg-red-950/30 dark:border-red-700' : 'bg-green-50 border-green-400 dark:bg-green-950/30 dark:border-green-700'}`}>
            <CreditCard size={20} weight="fill" className={profile.paymentRejectionReason ? 'text-red-600' : 'text-green-600'} />
            <AlertTitle className={`font-semibold ${profile.paymentRejectionReason ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200'}`}>
              {profile.paymentRejectionReason 
                ? (language === 'hi' ? 'भुगतान अस्वीकृत - पुनः अपलोड करें' : 'Payment Rejected - Please Re-upload')
                : t.returnedForPayment}
            </AlertTitle>
            <AlertDescription className={profile.paymentRejectionReason ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}>
              {profile.paymentRejectionReason && (
                <div className="mb-3 p-3 bg-white/50 dark:bg-black/20 rounded-md border border-red-300">
                  <span className="font-semibold">{language === 'hi' ? 'अस्वीकृति कारण:' : 'Rejection Reason:'}</span>{' '}
                  {profile.paymentRejectionReason}
                </div>
              )}
              <p>{profile.paymentRejectionReason 
                ? (language === 'hi' ? 'कृपया सही भुगतान स्क्रीनशॉट अपलोड करें।' : 'Please upload a valid payment screenshot.')
                : t.returnedForPaymentDesc}</p>
              {profile.returnedForPaymentDeadline && (
                <p className="mt-2 text-sm font-medium">
                  {language === 'hi' 
                    ? `भुगतान की अंतिम तिथि: ${new Date(profile.returnedForPaymentDeadline).toLocaleDateString('hi-IN')}`
                    : `Payment deadline: ${new Date(profile.returnedForPaymentDeadline).toLocaleDateString()}`}
                </p>
              )}
              {onEdit && (
                <Button 
                  onClick={onEdit} 
                  className={`mt-4 gap-2 text-white ${profile.paymentRejectionReason ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  <Upload size={20} weight="bold" />
                  {t.uploadPaymentScreenshot}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Payment Awaiting Verification Alert (when payment screenshot submitted and pending review) */}
        {profile.status === 'pending' && 
         profile.paymentStatus === 'pending' && 
         profile.paymentScreenshotUrls && 
         profile.paymentScreenshotUrls.length > 0 &&
         !profile.returnedForPayment && (
          <Alert className="mb-6 bg-purple-50 border-purple-400 dark:bg-purple-950/30 dark:border-purple-700">
            <Receipt size={20} weight="fill" className="text-purple-600" />
            <AlertTitle className="text-purple-800 dark:text-purple-200 font-semibold">
              {t.paymentAwaitingVerification}
            </AlertTitle>
            <AlertDescription className="text-purple-700 dark:text-purple-300">
              <p>{t.paymentAwaitingVerificationDesc}</p>
              {profile.paymentUploadedAt && (
                <p className="mt-2 text-sm">
                  {language === 'hi' 
                    ? `अपलोड किया गया: ${new Date(profile.paymentUploadedAt).toLocaleDateString('hi-IN')}` 
                    : `Uploaded on: ${new Date(profile.paymentUploadedAt).toLocaleDateString()}`}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3">
                {onRefreshProfile && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      setIsRefreshing(true)
                      try {
                        await onRefreshProfile()
                        setLastRefreshTime(new Date())
                        toast.success(language === 'hi' ? 'स्थिति अपडेट की गई' : 'Status updated')
                      } catch (error) {
                        toast.error(language === 'hi' ? 'रिफ्रेश विफल' : 'Refresh failed')
                      } finally {
                        setIsRefreshing(false)
                      }
                    }}
                    disabled={isRefreshing}
                    className="border-purple-400 text-purple-700 hover:bg-purple-100"
                  >
                    <ArrowClockwise size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    {language === 'hi' ? 'स्थिति जांचें' : 'Check Status'}
                  </Button>
                )}
                {lastRefreshTime && (
                  <span className="text-xs text-purple-600">
                    {language === 'hi' 
                      ? `अंतिम जांच: ${lastRefreshTime.toLocaleTimeString('hi-IN')}`
                      : `Last checked: ${lastRefreshTime.toLocaleTimeString()}`}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs italic text-purple-600">
                {language === 'hi' 
                  ? 'स्वचालित रूप से हर 30 सेकंड में जांच होती है'
                  : 'Auto-checking every 30 seconds'}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Approval Alert (when profile is pending and not returned for edit, payment, or payment screenshot not uploaded) */}
        {profile.status === 'pending' && 
         !profile.returnedForEdit && 
         !profile.returnedForPayment && 
         !(profile.paymentStatus === 'pending' && profile.paymentScreenshotUrls && profile.paymentScreenshotUrls.length > 0) && (
          <Alert className="mb-6 bg-blue-50 border-blue-400 dark:bg-blue-950/30 dark:border-blue-700">
            <Warning size={20} weight="fill" className="text-blue-600" />
            <AlertTitle className="text-blue-800 dark:text-blue-200 font-semibold">
              {t.pendingApproval}
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              <p>{t.pendingApprovalDesc}</p>
              <div className="flex items-center gap-3 mt-3">
                {onRefreshProfile && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      setIsRefreshing(true)
                      try {
                        await onRefreshProfile()
                        setLastRefreshTime(new Date())
                        toast.success(language === 'hi' ? 'स्थिति अपडेट की गई' : 'Status updated')
                      } catch (error) {
                        toast.error(language === 'hi' ? 'रिफ्रेश विफल' : 'Refresh failed')
                      } finally {
                        setIsRefreshing(false)
                      }
                    }}
                    disabled={isRefreshing}
                    className="border-blue-400 text-blue-700 hover:bg-blue-100"
                  >
                    <ArrowClockwise size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    {language === 'hi' ? 'स्थिति जांचें' : 'Check Status'}
                  </Button>
                )}
                {lastRefreshTime && (
                  <span className="text-xs text-blue-600">
                    {language === 'hi' 
                      ? `अंतिम जांच: ${lastRefreshTime.toLocaleTimeString('hi-IN')}`
                      : `Last checked: ${lastRefreshTime.toLocaleTimeString()}`}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs italic text-blue-600">
                {language === 'hi' 
                  ? 'स्वचालित रूप से हर 30 सेकंड में जांच होती है'
                  : 'Auto-checking every 30 seconds'}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Deactivated Profile Alert with Reactivation Request */}
        {profile.accountStatus === 'deactivated' && (
          <Alert className="mb-6 bg-red-50 border-red-400 dark:bg-red-950/30 dark:border-red-700">
            <ProhibitInset size={20} weight="fill" className="text-red-600" />
            <AlertTitle className="text-red-800 dark:text-red-200 font-semibold">
              {language === 'hi' ? 'प्रोफाइल निष्क्रिय' : 'Profile Deactivated'}
            </AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300">
              <div className="space-y-2">
                <p>
                  {language === 'hi' 
                    ? 'आपकी प्रोफाइल निष्क्रियता के कारण निष्क्रिय कर दी गई है। इसका मतलब है कि आपकी प्रोफाइल अन्य उपयोगकर्ताओं को दिखाई नहीं देगी।'
                    : 'Your profile has been deactivated due to inactivity. This means your profile will not be visible to other users.'}
                </p>
                {profile.deactivatedAt && (
                  <p className="text-sm">
                    {language === 'hi' 
                      ? `निष्क्रिय होने की तिथि: ${new Date(profile.deactivatedAt).toLocaleDateString('hi-IN')}`
                      : `Deactivated on: ${new Date(profile.deactivatedAt).toLocaleDateString()}`}
                  </p>
                )}
                <p className="text-sm">
                  {language === 'hi' 
                    ? 'आप अभी भी केवल एडमिन के साथ चैट कर सकते हैं। लॉगिन करने से आपकी प्रोफाइल स्वचालित रूप से पुनः सक्रिय हो जाएगी।'
                    : 'You can still chat with admin only. Logging in will automatically reactivate your profile.'}
                </p>
                
                {profile.reactivationRequested ? (
                  <div className="flex items-center gap-2 mt-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-300">
                    <ArrowClockwise size={16} className="animate-spin" />
                    <span>
                      {language === 'hi' 
                        ? 'पुनः सक्रियण अनुरोध लंबित है। कृपया एडमिन की प्रतिक्रिया की प्रतीक्षा करें।'
                        : 'Reactivation request pending. Please wait for admin response.'}
                    </span>
                  </div>
                ) : (
                  <Button 
                    onClick={() => {
                      if (onUpdateProfile) {
                        onUpdateProfile({
                          reactivationRequested: true,
                          reactivationRequestedAt: new Date().toISOString()
                        })
                        toast.success(
                          language === 'hi' 
                            ? 'पुनः सक्रियण अनुरोध भेजा गया!'
                            : 'Reactivation request sent!'
                        )
                      }
                    }}
                    className="mt-3 gap-2 bg-primary hover:bg-primary/90 text-white"
                  >
                    <ArrowUp size={20} weight="bold" />
                    {language === 'hi' ? 'पुनः सक्रियण का अनुरोध करें' : 'Request Reactivation'}
                  </Button>
                )}
              </div>
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
                    <span className="text-lg">₹{pricing.sixMonth}</span>
                  </Button>
                  <Button
                    type="button"
                    variant={renewalPlan === '1-year' ? 'default' : 'outline'}
                    className={`h-auto py-3 flex flex-col ${renewalPlan === '1-year' ? 'bg-accent text-accent-foreground' : ''}`}
                    onClick={() => setRenewalPlan('1-year')}
                  >
                    <span className="font-bold">{language === 'hi' ? '1 वर्ष' : '1 Year'}</span>
                    <span className="text-lg">₹{pricing.oneYear}</span>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {language === 'hi' ? '10% बचत' : 'Save 10%'}
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
                    ? `कृपया ₹${renewalPlan === '1-year' ? pricing.oneYear : pricing.sixMonth} का भुगतान करें और स्क्रीनशॉट अपलोड करें।`
                    : `Please pay ₹${renewalPlan === '1-year' ? pricing.oneYear : pricing.sixMonth} and upload the screenshot.`}
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
                  aria-label={language === 'hi' ? 'भुगतान स्क्रीनशॉट अपलोड करें' : 'Upload Payment Screenshot'}
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
                
                {renewalPaymentPreview ? (
                  <div className="border-2 border-dashed rounded-lg p-4 text-center space-y-2">
                    <img 
                      src={renewalPaymentPreview} 
                      alt="Payment Screenshot"
                      className="max-h-48 mx-auto rounded-lg object-contain"
                    />
                    <p className="text-sm text-muted-foreground">
                      {language === 'hi' ? 'दूसरी छवि चुनने के लिए नीचे क्लिक करें' : 'Click below to select another image'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRenewalCamera(true)}
                      >
                        <Camera size={16} className="mr-1" />
                        {language === 'hi' ? 'कैमरा' : 'Camera'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => renewalFileInputRef.current?.click()}
                      >
                        {language === 'hi' ? 'गैलरी' : 'Gallery'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Camera Capture Option */}
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
                      onClick={() => setShowRenewalCamera(true)}
                    >
                      <Camera size={28} weight="light" className="text-primary" />
                      <span className="text-sm font-medium">
                        {language === 'hi' ? 'कैमरा से कैप्चर करें' : 'Capture from Camera'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {language === 'hi' ? 'रसीद की फोटो लें' : 'Take photo of receipt'}
                      </span>
                    </Button>
                    
                    {/* File Upload Option */}
                    <div 
                      onClick={() => renewalFileInputRef.current?.click()}
                      className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <ArrowUp size={28} weight="light" className="text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {language === 'hi' ? 'गैलरी से अपलोड करें' : 'Upload from Gallery'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {language === 'hi' ? 'स्क्रीनशॉट चुनें' : 'Select screenshot'}
                      </span>
                    </div>
                  </div>
                )}
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
                        renewalPaymentAmount: renewalPlan === '1-year' ? pricing.oneYear : pricing.sixMonth,
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

        {/* Upgrade to Premium Section for Free Users */}
        {isFreePlan && profile.status === 'verified' && (
          <Alert className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-400 dark:from-amber-950/30 dark:to-orange-950/30">
            <CurrencyInr size={20} weight="fill" className="text-amber-600" />
            <AlertTitle className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2">
              {language === 'hi' ? '✨ प्रीमियम में अपग्रेड करें' : '✨ Upgrade to Premium'}
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <div className="space-y-3">
                <p>
                  {language === 'hi' 
                    ? 'आप वर्तमान में मुफ्त योजना पर हैं। प्रीमियम सुविधाओं को अनलॉक करें:'
                    : 'You are currently on the Free plan. Unlock premium features:'}
                </p>
                <ul className="text-sm space-y-1 ml-4 list-disc">
                  <li>{language === 'hi' ? 'असीमित संपर्क विवरण देखें' : 'Unlimited contact details viewing'}</li>
                  <li>{language === 'hi' ? 'असीमित रुचि भेजें' : 'Unlimited interest sending'}</li>
                  <li>{language === 'hi' ? 'बिना वॉटरमार्क के बायोडाटा डाउनलोड करें' : 'Download biodata without watermark'}</li>
                  <li>{language === 'hi' ? 'प्राथमिकता प्रोफाइल दृश्यता' : 'Priority profile visibility'}</li>
                </ul>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-white dark:bg-amber-900/50">
                      {language === 'hi' ? '6 महीने' : '6 Months'}: ₹{pricing.sixMonth}
                    </Badge>
                    <Badge variant="outline" className="bg-white dark:bg-amber-900/50 border-green-500">
                      {language === 'hi' ? '1 वर्ष' : '1 Year'}: ₹{pricing.oneYear}
                      <span className="ml-1 text-green-600">{language === 'hi' ? '(बचत!)' : '(Save!)'}</span>
                    </Badge>
                  </div>
                </div>
                {onUpgradeNow && (
                  <Button 
                    onClick={onUpgradeNow}
                    className="mt-3 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  >
                    <ArrowUp size={20} weight="bold" />
                    {language === 'hi' ? 'अभी अपग्रेड करें' : 'Upgrade Now'}
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

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
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                <TabsTrigger value="personal" className="text-xs sm:text-sm px-2">{t.personalInfo}</TabsTrigger>
                <TabsTrigger value="family" className="text-xs sm:text-sm px-2">{t.familyInfo}</TabsTrigger>
                <TabsTrigger value="contact" className="text-xs sm:text-sm px-2">{t.contactInfo}</TabsTrigger>
                <TabsTrigger value="partner" className="text-xs sm:text-sm px-2">{t.partnerPreferences}</TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.personalInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* About Me */}
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

                    {/* Basic Info Section */}
                    <h4 className="font-semibold flex items-center gap-2 text-primary">
                      <User size={18} />
                      {language === 'hi' ? 'मूल जानकारी' : 'Basic Info'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.gender}</p>
                        <p className="font-medium flex items-center gap-2">
                          <User size={16} />
                          {getGenderLabel(profile.gender)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">{t.age}</p>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar size={16} />
                          {profile.age} {t.years}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">{t.dateOfBirth}</p>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar size={16} />
                          {formatDateDDMMYYYY(profile.dateOfBirth)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">{t.maritalStatus}</p>
                        <p className="font-medium">{getMaritalStatusLabel(profile.maritalStatus)}</p>
                      </div>
                    </div>

                    {/* Education & Career Section - Moved up for priority */}
                    <Separator />
                    <h4 className="font-semibold flex items-center gap-2 text-primary">
                      <GraduationCap size={18} />
                      {language === 'hi' ? 'शिक्षा और करियर' : 'Education & Career'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.education}</p>
                        <p className="font-medium flex items-center gap-2">
                          <GraduationCap size={16} />
                          {formatEducation(profile.education, language)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">{t.occupation}</p>
                        <p className="font-medium flex items-center gap-2">
                          <Briefcase size={16} />
                          {formatOccupation(profile.occupation, language)}
                        </p>
                      </div>

                      {profile.position && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.position}</p>
                          <p className="font-medium flex items-center gap-2">
                            <Briefcase size={16} />
                            {profile.position}
                          </p>
                        </div>
                      )}

                      {profile.salary && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.salary}</p>
                          <p className="font-medium flex items-center gap-2">
                            <CurrencyInr size={16} />
                            {profile.salary}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Religious & Social Section */}
                    <Separator />
                    <h4 className="font-semibold flex items-center gap-2 text-primary">
                      {language === 'hi' ? 'धार्मिक और सामाजिक' : 'Religious & Social'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </div>

                    {/* Physical Attributes Section */}
                    <Separator />
                    <h4 className="font-semibold flex items-center gap-2 text-primary">
                      {language === 'hi' ? 'शारीरिक विशेषताएं' : 'Physical Attributes'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {profile.height && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.height}</p>
                          <p className="font-medium">{profile.height}</p>
                        </div>
                      )}

                      {profile.weight && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.weight}</p>
                          <p className="font-medium">{profile.weight}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground">{t.disability}</p>
                        <p className="font-medium">
                          {getDisabilityLabel(profile.disability)}
                          {profile.disability !== 'no' && profile.disabilityDetails && (
                            <span className="text-muted-foreground text-sm ml-2">({profile.disabilityDetails})</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Location Section */}
                    <Separator />
                    <h4 className="font-semibold flex items-center gap-2 text-primary">
                      <MapPin size={18} />
                      {language === 'hi' ? 'स्थान' : 'Location'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                      {/* Profile Created By */}
                      <div>
                        <p className="text-sm text-muted-foreground">{t.profileCreatedBy}</p>
                        <p className="font-medium">{getProfileCreatedByLabel(profile.relationToProfile)}</p>
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

                    {/* Horoscope Section */}
                    <Separator />
                    <h4 className="font-semibold flex items-center gap-2 text-primary">
                      {language === 'hi' ? 'कुंडली जानकारी' : 'Horoscope Information'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.manglik}</p>
                        <p className="font-medium">{getManglikLabel(profile.manglik)}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">{t.horoscopeMatching}</p>
                        <p className="font-medium">{getHoroscopeMatchingLabel(profile.horoscopeMatching)}</p>
                      </div>

                      {profile.birthTime && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.birthTime}</p>
                          <p className="font-medium">{profile.birthTime}</p>
                        </div>
                      )}

                      {profile.birthPlace && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.birthPlace}</p>
                          <p className="font-medium">{profile.birthPlace}</p>
                        </div>
                      )}
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

              <TabsContent value="partner">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.partnerPreferences}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.partnerPreferences ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Age Preference */}
                        {(profile.partnerPreferences.ageMin || profile.partnerPreferences.ageMax) && (
                          <div>
                            <p className="text-sm text-muted-foreground">{language === 'hi' ? 'आयु' : 'Age'}</p>
                            <p className="font-medium">
                              {profile.partnerPreferences.ageMin || '-'} - {profile.partnerPreferences.ageMax || '-'} {t.years}
                            </p>
                          </div>
                        )}

                        {/* Height Preference */}
                        {(profile.partnerPreferences.heightMin || profile.partnerPreferences.heightMax) && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t.height}</p>
                            <p className="font-medium">
                              {profile.partnerPreferences.heightMin || '-'} - {profile.partnerPreferences.heightMax || '-'}
                            </p>
                          </div>
                        )}

                        {/* Education Preference */}
                        {profile.partnerPreferences.education && profile.partnerPreferences.education.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t.education}</p>
                            <p className="font-medium">
                              {profile.partnerPreferences.education.map(edu => formatEducation(edu, language)).join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Employment Status Preference */}
                        {profile.partnerPreferences.employmentStatus && profile.partnerPreferences.employmentStatus.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t.occupation}</p>
                            <p className="font-medium">
                              {profile.partnerPreferences.employmentStatus.map(occ => formatOccupation(occ, language)).join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Annual Income Preference */}
                        {(profile.partnerPreferences.annualIncomeMin || profile.partnerPreferences.annualIncomeMax) && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t.salary}</p>
                            <p className="font-medium">
                              {profile.partnerPreferences.annualIncomeMin || '-'} - {profile.partnerPreferences.annualIncomeMax || '-'}
                            </p>
                          </div>
                        )}

                        {/* Marital Status Preference */}
                        {profile.partnerPreferences.maritalStatus && profile.partnerPreferences.maritalStatus.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t.maritalStatus}</p>
                            <p className="font-medium">
                              {profile.partnerPreferences.maritalStatus.map(status => getMaritalStatusLabel(status)).join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Religion Preference */}
                        {profile.partnerPreferences.religion && profile.partnerPreferences.religion.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t.religion}</p>
                            <p className="font-medium">
                              {profile.partnerPreferences.religion.join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Caste Preference */}
                        {profile.partnerPreferences.caste && profile.partnerPreferences.caste.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t.caste}</p>
                            <p className="font-medium">
                              {profile.partnerPreferences.caste.join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Mother Tongue Preference */}
                        {profile.partnerPreferences.motherTongue && profile.partnerPreferences.motherTongue.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t.motherTongue}</p>
                            <p className="font-medium">
                              {profile.partnerPreferences.motherTongue.join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Living Country Preference */}
                        {profile.partnerPreferences.livingCountry && profile.partnerPreferences.livingCountry.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">{language === 'hi' ? 'देश में रहने वाला' : 'Living in Country'}</p>
                            <p className="font-medium">
                              {profile.partnerPreferences.livingCountry.join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Living State Preference */}
                        {profile.partnerPreferences.livingState && profile.partnerPreferences.livingState.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">{language === 'hi' ? 'राज्य में रहने वाला' : 'Living in State'}</p>
                            <p className="font-medium">
                              {profile.partnerPreferences.livingState.join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Diet Preference */}
                        {profile.partnerPreferences.dietPreference && profile.partnerPreferences.dietPreference.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t.diet}</p>
                            <p className="font-medium">
                              {profile.partnerPreferences.dietPreference.map(d => getDietLabel(d)).join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Manglik Preference */}
                        {profile.partnerPreferences.manglik && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t.manglik}</p>
                            <p className="font-medium">
                              {profile.partnerPreferences.manglik === 'doesnt-matter' 
                                ? (language === 'hi' ? 'कोई फर्क नहीं' : "Doesn't Matter")
                                : (profile.partnerPreferences.manglik === 'yes' 
                                  ? (language === 'hi' ? 'हां' : 'Yes') 
                                  : (language === 'hi' ? 'नहीं' : 'No'))}
                            </p>
                          </div>
                        )}

                        {/* Disability Preference */}
                        {profile.partnerPreferences.disability && profile.partnerPreferences.disability.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t.disability}</p>
                            <p className="font-medium">
                              {profile.partnerPreferences.disability.map(d => 
                                d === 'no' ? (language === 'hi' ? 'नहीं' : 'No') : (language === 'hi' ? 'हां' : 'Yes')
                              ).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        {language === 'hi' ? 'कोई पार्टनर प्राथमिकताएं नहीं' : 'No partner preferences set'}
                      </p>
                    )}
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
                <Button variant="outline" className="gap-2" onClick={onNavigateHome}>
                  <Heart size={20} weight="fill" />
                  {language === 'hi' ? 'मुखपृष्ठ' : 'Home'}
                </Button>
                <Button variant="outline" className="gap-2" onClick={onNavigateActivity}>
                  <User size={20} />
                  {language === 'hi' ? 'मेरी गतिविधि' : 'My Activity'}
                </Button>
                <Button variant="outline" className="gap-2" onClick={onNavigateInbox}>
                  <Envelope size={20} />
                  {language === 'hi' ? 'इनबॉक्स' : 'Inbox'}
                </Button>
                <Button variant="outline" className="gap-2" onClick={onNavigateChat}>
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

      {/* Camera Capture for Renewal Payment */}
      <CameraCapture
        open={showRenewalCamera}
        onClose={() => setShowRenewalCamera(false)}
        onCapture={(imageDataUrl) => {
          setRenewalPaymentPreview(imageDataUrl)
          // Convert data URL to File for upload
          fetch(imageDataUrl)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], `renewal_payment_${Date.now()}.jpg`, { type: 'image/jpeg' })
              setRenewalPaymentFile(file)
            })
        }}
        language={language}
        title={language === 'hi' ? 'भुगतान रसीद कैप्चर करें' : 'Capture Payment Receipt'}
        preferBackCamera={true}
      />
    </div>
  )
}
