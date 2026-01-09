import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { MapPin, Briefcase, GraduationCap, UserCircle, Phone, Envelope, Heart, ShieldCheck, Seal, Calendar, Clock, Eye, CheckCircle, XCircle, ClockCountdown, UsersThree, Star, Ruler, CurrencyInr, Buildings, Globe, Translate, HandHeart, ForkKnife, Wine, Cigarette, Sun, Wheelchair, IdentificationCard } from '@phosphor-icons/react'
import type { Profile, Interest, ContactRequest, MembershipPlan, UserNotification } from '@/types/profile'
import { toast } from 'sonner'
import { useKV } from '@/hooks/useKV'
import { formatDateDDMMYYYY, formatEducation, formatOccupation } from '@/lib/utils'
import { PhotoLightbox, useLightbox } from '@/components/PhotoLightbox'

// Membership settings interface for plan limits
interface MembershipSettings {
  freePlanChatLimit: number
  freePlanContactLimit: number
  sixMonthChatLimit: number
  sixMonthContactLimit: number
  oneYearChatLimit: number
  oneYearContactLimit: number
}

// Default limits if settings not provided
const DEFAULT_SETTINGS: MembershipSettings = {
  freePlanChatLimit: 5,
  freePlanContactLimit: 0,
  sixMonthChatLimit: 50,
  sixMonthContactLimit: 20,
  oneYearChatLimit: 120,
  oneYearContactLimit: 50
}

interface ProfileDetailDialogProps {
  profile: Profile | null
  open: boolean
  onClose: () => void
  language: 'hi' | 'en'
  currentUserProfile?: Profile | null
  isLoggedIn?: boolean
  isAdmin?: boolean
  shouldBlur?: boolean
  membershipPlan?: MembershipPlan
  membershipSettings?: MembershipSettings
  setProfiles?: (newValue: Profile[] | ((oldValue?: Profile[] | undefined) => Profile[])) => void
  // Callback to navigate to upgrade/settings
  onUpgrade?: () => void
}

export function ProfileDetailDialog({ profile, open, onClose, language, currentUserProfile, isLoggedIn = false, isAdmin = false, shouldBlur = false, membershipPlan, membershipSettings, setProfiles, onUpgrade }: ProfileDetailDialogProps) {
  const [interests, setInterests] = useKV<Interest[]>('interests', [])
  const [contactRequests, setContactRequests] = useKV<ContactRequest[]>('contactRequests', [])
  const [userNotifications, setUserNotifications] = useKV<UserNotification[]>('userNotifications', [])
  const [showContactInfo, setShowContactInfo] = useState(false)
  const { lightboxState, openLightbox, closeLightbox } = useLightbox()

  // Get settings with defaults
  const settings = { ...DEFAULT_SETTINGS, ...membershipSettings }

  // Get boost credits from profile
  const boostContactsRemaining = currentUserProfile?.boostContactsRemaining || 0

  // Get contact view limit based on current plan + boost credits
  const getContactLimit = (): number => {
    let baseLimit = settings.freePlanContactLimit
    if (membershipPlan === '6-month') {
      baseLimit = settings.sixMonthContactLimit
    } else if (membershipPlan === '1-year') {
      baseLimit = settings.oneYearContactLimit
    }
    // Add boost credits to extend the limit
    return baseLimit + boostContactsRemaining
  }

  const contactLimit = getContactLimit()
  const contactViewsUsed = currentUserProfile?.contactViewsUsed || []
  const remainingContacts = Math.max(0, contactLimit - contactViewsUsed.length)

  // Check if user can view contact info for a profile
  const canViewContactFor = (profileId: string): boolean => {
    if (isAdmin) return true
    if (!currentUserProfile) return false
    if (contactViewsUsed.includes(profileId)) return true // Already viewed
    return remainingContacts > 0
  }

  // Track contact view when user views contact info
  const trackContactView = (profileId: string) => {
    if (!currentUserProfile || !setProfiles) return
    if (contactViewsUsed.includes(profileId)) return // Already tracked
    if (isAdmin) return // Admin doesn't consume quota

    const updatedContactViews = [...contactViewsUsed, profileId]
    setProfiles((current) => 
      (current || []).map(p => 
        p.id === currentUserProfile.id 
          ? { ...p, contactViewsUsed: updatedContactViews }
          : p
      )
    )

    const remaining = contactLimit - updatedContactViews.length
    if (remaining > 0) {
      toast.info(
        language === 'hi' 
          ? `संपर्क दृश्य: ${remaining} शेष` 
          : `Contact views: ${remaining} remaining`,
        { duration: 3000 }
      )
    } else {
      toast.warning(
        language === 'hi' 
          ? 'यह आपका अंतिम संपर्क दृश्य था!' 
          : 'This was your last contact view!',
        {
          description: language === 'hi' 
            ? 'अधिक संपर्क देखने के लिए अपग्रेड करें' 
            : 'Upgrade for more contact views',
          duration: 5000
        }
      )
    }
  }

  if (!profile) return null

  // Helper function to format preference arrays - shows "Any / No Preference" if empty or ['any']
  const formatPreferenceValue = (values: string[] | undefined, mapFn?: (v: string) => string): string => {
    if (!values || values.length === 0) return language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'
    if (values.length === 1 && values[0] === 'any') {
      return language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'
    }
    return mapFn ? values.map(mapFn).join(', ') : values.join(', ')
  }

  // Check if preference has meaningful values (not empty and not just 'any')
  const hasPreferenceValue = (values: string[] | undefined): boolean => {
    return !!(values && values.length > 0)
  }

  // Check if user is viewing their own profile
  const isSelf = currentUserProfile?.id === profile.id

  // For admin or logged in users without blur, show full name; otherwise first name only
  const canSeeFullDetails = isAdmin || isSelf || (isLoggedIn && !shouldBlur)
  const displayName = canSeeFullDetails ? profile.fullName : profile.fullName.split(' ')[0]
  const initials = canSeeFullDetails 
    ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.fullName.split(' ')[0][0].toUpperCase()
  
  // Blur content for free/expired membership (but never blur self view)
  const blurContent = shouldBlur && !isAdmin && !isSelf

  const getTrustBadge = () => {
    if (profile.trustLevel >= 5) {
      return { 
        text: language === 'hi' ? 'स्तर 5 - वीडियो सत्यापित' : 'Level 5 - Video Verified', 
        color: 'bg-accent text-accent-foreground', 
        icon: <Seal weight="fill" size={18} /> 
      }
    } else if (profile.trustLevel >= 3) {
      return { 
        text: language === 'hi' ? 'स्तर 3 - ID सत्यापित' : 'Level 3 - ID Verified', 
        color: 'bg-teal text-teal-foreground', 
        icon: <ShieldCheck weight="fill" size={18} /> 
      }
    } else if (profile.trustLevel >= 1) {
      return { 
        text: language === 'hi' ? 'स्तर 1 - मोबाइल सत्यापित' : 'Level 1 - Mobile Verified', 
        color: 'bg-muted text-muted-foreground', 
        icon: <ShieldCheck weight="regular" size={18} /> 
      }
    }
    return null
  }

  const existingInterest = currentUserProfile && interests?.find(
    i => i.fromProfileId === currentUserProfile.profileId && 
         i.toProfileId === profile.profileId
  )

  const hasReceivedInterestFromProfile = currentUserProfile && interests?.find(
    i => i.fromProfileId === profile.profileId && 
         i.toProfileId === currentUserProfile.profileId
  )

  // Find existing contact request from current user to this profile
  const existingContactRequest = currentUserProfile && contactRequests?.find(
    r => r.fromUserId === currentUserProfile.id && 
         r.toUserId === profile.id
  )

  // Check the status of the contact request
  const contactRequestStatus = existingContactRequest?.status // 'pending' | 'approved' | 'declined' | undefined

  const handleExpressInterest = () => {
    if (!currentUserProfile) {
      toast.error(
        language === 'hi' ? 'कृपया पहले लॉगिन करें' : 'Please login first'
      )
      return
    }

    if (currentUserProfile.id === profile.id) {
      toast.error(
        language === 'hi' ? 'आप अपने आप को रुचि नहीं भेज सकते' : 'You cannot send interest to yourself'
      )
      return
    }

    if (existingInterest) {
      toast.info(
        language === 'hi' ? 'आपने पहले ही रुचि दर्ज की है' : 'You have already expressed interest'
      )
      return
    }

    if (hasReceivedInterestFromProfile) {
      toast.info(
        language === 'hi' ? 'इस प्रोफाइल ने आपको पहले ही रुचि भेजी है' : 'This profile has already sent you interest'
      )
      return
    }

    const newInterest: Interest = {
      id: `interest-${Date.now()}`,
      fromProfileId: currentUserProfile.profileId,
      toProfileId: profile.profileId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    setInterests(current => [...(current || []), newInterest])

    // Store in-app notification for recipient (they'll see it when they log in)
    const notification: UserNotification = {
      id: `notif-${Date.now()}`,
      recipientProfileId: profile.profileId,
      type: 'interest_received',
      title: 'New Interest Received',
      titleHi: 'नई रुचि प्राप्त',
      description: `${currentUserProfile.fullName} has expressed interest in your profile`,
      descriptionHi: `${currentUserProfile.fullName} ने आपकी प्रोफाइल में रुचि दर्ज की है`,
      senderProfileId: currentUserProfile.profileId,
      senderName: currentUserProfile.fullName,
      isRead: false,
      createdAt: new Date().toISOString(),
    }
    setUserNotifications(current => [...(current || []), notification])

    // Notification is stored in bell icon - no toast for other profile
    // Toast only shown for current user's action confirmation
    toast.success(
      language === 'hi' ? 'रुचि दर्ज की गई!' : 'Interest recorded!',
      {
        description: language === 'hi' 
          ? 'दूसरे व्यक्ति को आपकी रुचि की सूचना मिल गई है। वे इसे स्वीकार या अस्वीकार कर सकते हैं।'
          : 'The other person has been notified of your interest. They can accept or decline it.'
      }
    )
  }

  const handleRequestContact = () => {
    if (!currentUserProfile) {
      toast.error(
        language === 'hi' ? 'कृपया पहले लॉगिन करें' : 'Please login first'
      )
      return
    }

    if (currentUserProfile.id === profile.id) {
      toast.error(
        language === 'hi' ? 'आप अपने आप को संपर्क अनुरोध नहीं भेज सकते' : 'You cannot send contact request to yourself'
      )
      return
    }

    // Check contact view limit (allow if already requested this profile)
    const existingRequest = contactRequests?.find(
      r => r.fromUserId === currentUserProfile.id && 
           r.toUserId === profile.id
    )

    if (existingRequest) {
      toast.info(
        language === 'hi' ? 'आपने पहले ही संपर्क अनुरोध भेजा है' : 'You have already sent a contact request'
      )
      return
    }

    // Check if contact limit allows new request (unless already viewed this profile's contact)
    if (!canViewContactFor(profile.profileId)) {
      if (contactLimit === 0) {
        toast.error(
          language === 'hi' 
            ? 'मुफ्त प्लान में संपर्क देखने की सुविधा नहीं है' 
            : 'Contact viewing not available on Free plan',
          {
            description: language === 'hi' 
              ? 'संपर्क देखने के लिए पेड प्लान में अपग्रेड करें' 
              : 'Upgrade to paid plan to view contacts',
            duration: 6000
          }
        )
      } else {
        toast.error(
          language === 'hi' 
            ? `संपर्क देखने की सीमा समाप्त: आप केवल ${contactLimit} संपर्क देख सकते हैं` 
            : `Contact view limit reached: You can only view ${contactLimit} contacts`,
          {
            description: language === 'hi' 
              ? 'अधिक संपर्क देखने के लिए प्लान अपग्रेड करें' 
              : 'Upgrade your plan for more contact views',
            duration: 6000
          }
        )
      }
      return
    }

    // Track this contact view (will be confirmed when request is approved)
    trackContactView(profile.profileId)

    const newRequest: ContactRequest = {
      id: `contact-req-${Date.now()}`,
      fromUserId: currentUserProfile.id,
      toUserId: profile.id,
      fromProfileId: currentUserProfile.profileId,
      toProfileId: profile.profileId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    setContactRequests(current => [...(current || []), newRequest])

    // Store in-app notification for the recipient (they'll see it in their bell icon)
    const contactNotification: UserNotification = {
      id: `notif-${Date.now()}-contact`,
      recipientProfileId: profile.profileId,
      type: 'contact_request_received',
      title: 'New Contact Request',
      titleHi: 'नया संपर्क अनुरोध',
      description: `${currentUserProfile.fullName} has requested your contact details`,
      descriptionHi: `${currentUserProfile.fullName} ने आपका संपर्क विवरण मांगा है`,
      senderProfileId: currentUserProfile.profileId,
      senderName: currentUserProfile.fullName,
      isRead: false,
      createdAt: new Date().toISOString(),
    }
    setUserNotifications(current => [...(current || []), contactNotification])

    // Business Logic: Auto-send interest when sending contact request (if not already sent)
    if (!existingInterest && !hasReceivedInterestFromProfile) {
      const newInterest: Interest = {
        id: `interest-${Date.now()}`,
        fromProfileId: currentUserProfile.profileId,
        toProfileId: profile.profileId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      setInterests(current => [...(current || []), newInterest])
      
      toast.info(
        language === 'hi' ? 'संपर्क और रुचि अनुरोध भेजा गया' : 'Contact and interest request sent',
        {
          description: language === 'hi' 
            ? 'दूसरे व्यक्ति को पहले आपकी रुचि स्वीकार करनी होगी, फिर संपर्क अनुरोध।'
            : 'The other person must first accept your interest, then the contact request.'
        }
      )
    } else {
      toast.info(
        language === 'hi' ? 'संपर्क अनुरोध भेजा गया' : 'Contact request sent',
        {
          description: language === 'hi' 
            ? 'दूसरे व्यक्ति को पहले रुचि स्वीकार करनी होगी, फिर संपर्क अनुरोध।'
            : 'The other person must first accept interest, then contact request.'
        }
      )
    }
  }

  const badge = getTrustBadge()
  
  const getMaritalStatus = () => {
    if (profile.maritalStatus === 'never-married') {
      return language === 'hi' ? 'अविवाहित' : 'Never Married'
    } else if (profile.maritalStatus === 'divorced') {
      return language === 'hi' ? 'तलाकशुदा' : 'Divorced'
    } else {
      return language === 'hi' ? 'विधुर/विधवा' : 'Widowed'
    }
  }
  
  const t = {
    years: language === 'hi' ? 'वर्ष' : 'years',
    male: language === 'hi' ? 'पुरुष' : 'Male',
    female: language === 'hi' ? 'महिला' : 'Female',
    personalInfo: language === 'hi' ? 'व्यक्तिगत जानकारी' : 'Personal Information',
    location: language === 'hi' ? 'स्थान' : 'Location',
    dateOfBirth: language === 'hi' ? 'जन्म तिथि' : 'Date of Birth',
    education: language === 'hi' ? 'शिक्षा' : 'Education',
    occupation: language === 'hi' ? 'रोजगार स्थिति' : 'Employment Status',
    religion: language === 'hi' ? 'धर्म' : 'Religion',
    caste: language === 'hi' ? 'जाति' : 'Caste',
    height: language === 'hi' ? 'ऊंचाई' : 'Height',
    weight: language === 'hi' ? 'वजन' : 'Weight',
    motherTongue: language === 'hi' ? 'मातृभाषा' : 'Mother Tongue',
    bio: language === 'hi' ? 'परिचय' : 'About',
    familyDetails: language === 'hi' ? 'पारिवारिक विवरण' : 'Family Details',
    contactInfo: language === 'hi' ? 'संपर्क जानकारी' : 'Contact Information',
    privacyNotice: language === 'hi' 
      ? 'गोपनीयता और सुरक्षा के लिए, संपर्क विवरण केवल एडमिन अनुमोदन के बाद साझा किए जाते हैं।'
      : 'For privacy and security, contact details are shared only after admin approval.',
    expressInterest: language === 'hi' ? 'रुचि दर्ज करें' : 'Express Interest',
    requestContact: language === 'hi' ? 'संपर्क अनुरोध करें' : 'Request Contact',
    requestSent: language === 'hi' ? 'अनुरोध भेजा गया' : 'Request Sent',
    viewContact: language === 'hi' ? 'संपर्क देखें' : 'View Contact',
    requestDeclined: language === 'hi' ? 'अनुरोध अस्वीकृत' : 'Request Declined',
    profileId: language === 'hi' ? 'प्रोफाइल ID' : 'Profile ID',
    createdOn: language === 'hi' ? 'बनाया गया' : 'Created on',
    // Admin labels
    allPhotos: language === 'hi' ? 'सभी फोटो' : 'All Photos',
    selfiePhoto: language === 'hi' ? 'सेल्फी फोटो' : 'Selfie Photo',
    mobileNumber: language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number',
    email: language === 'hi' ? 'ईमेल' : 'Email',
    birthTime: language === 'hi' ? 'जन्म समय' : 'Birth Time',
    birthPlace: language === 'hi' ? 'जन्म स्थान' : 'Birth Place',
    horoscopeMatching: language === 'hi' ? 'कुंडली मिलान' : 'Horoscope Matching',
    diet: language === 'hi' ? 'खान-पान' : 'Diet',
    habits: language === 'hi' ? 'आदतें' : 'Habits',
    annualIncome: language === 'hi' ? 'वार्षिक आय' : 'Annual Income',
    profession: language === 'hi' ? 'व्यवसाय/पेशा' : 'Occupation/Profession',
    relation: language === 'hi' ? 'प्रोफाइल किसके लिए बनाई' : 'Profile Created For',
    registeredBy: language === 'hi' ? 'पंजीकरणकर्ता' : 'Registered By',
    notProvided: language === 'hi' ? 'प्रदान नहीं किया गया' : 'Not Provided',
    mandatory: language === 'hi' ? 'अनिवार्य' : 'Mandatory',
    preferred: language === 'hi' ? 'वांछित' : 'Preferred',
    notRequired: language === 'hi' ? 'आवश्यक नहीं' : 'Not Required',
    lastLogin: language === 'hi' ? 'अंतिम लॉगिन' : 'Last Login',
    disability: language === 'hi' ? 'दिव्यांगता' : 'Disability',
    disabilityNone: language === 'hi' ? 'कोई नहीं' : 'None',
    disabilityPhysical: language === 'hi' ? 'शारीरिक' : 'Physical',
    disabilityVisual: language === 'hi' ? 'दृष्टि संबंधी' : 'Visual',
    disabilityHearing: language === 'hi' ? 'श्रवण संबंधी' : 'Hearing',
    disabilitySpeech: language === 'hi' ? 'वाक् संबंधी' : 'Speech',
    disabilityIntellectual: language === 'hi' ? 'बौद्धिक' : 'Intellectual',
    disabilityMultiple: language === 'hi' ? 'एकाधिक' : 'Multiple',
    disabilityOther: language === 'hi' ? 'अन्य' : 'Other',
    // Partner Preferences labels
    partnerPreferences: language === 'hi' ? 'पार्टनर प्राथमिकताएं' : 'Partner Preferences',
    preferredAge: language === 'hi' ? 'आयु वरीयता' : 'Age Preference',
    preferredHeight: language === 'hi' ? 'ऊंचाई वरीयता' : 'Height Preference',
    preferredEducation: language === 'hi' ? 'शिक्षा वरीयता' : 'Education Preference',
    preferredEmploymentStatus: language === 'hi' ? 'रोजगार स्थिति वरीयता' : 'Employment Status Preference',
    preferredOccupation: language === 'hi' ? 'व्यवसाय वरीयता' : 'Occupation Preference',
    preferredLivingCountry: language === 'hi' ? 'रहने वाला देश वरीयता' : 'Living Country Preference',
    preferredLivingState: language === 'hi' ? 'रहने वाला राज्य वरीयता' : 'Living State Preference',
    preferredLocation: language === 'hi' ? 'स्थान वरीयता' : 'Location Preference',
    preferredCountry: language === 'hi' ? 'देश वरीयता' : 'Country Preference',
    preferredReligion: language === 'hi' ? 'धर्म वरीयता' : 'Religion Preference',
    preferredCaste: language === 'hi' ? 'जाति वरीयता' : 'Caste Preference',
    preferredMotherTongue: language === 'hi' ? 'मातृभाषा वरीयता' : 'Mother Tongue Preference',
    preferredMaritalStatus: language === 'hi' ? 'वैवाहिक स्थिति वरीयता' : 'Marital Status Preference',
    preferredDiet: language === 'hi' ? 'खान-पान वरीयता' : 'Diet Preference',
    preferredDrinking: language === 'hi' ? 'पेय आदत वरीयता' : 'Drinking Habit Preference',
    preferredSmoking: language === 'hi' ? 'धूम्रपान आदत वरीयता' : 'Smoking Habit Preference',
    preferredManglik: language === 'hi' ? 'मांगलिक वरीयता' : 'Manglik Preference',
    preferredDisability: language === 'hi' ? 'दिव्यांगता वरीयता' : 'Disability Preference',
    preferredAnnualIncome: language === 'hi' ? 'वार्षिक आय वरीयता' : 'Annual Income Preference',
    noPreference: language === 'hi' ? 'कोई विशेष वरीयता नहीं' : 'No specific preference',
    doesntMatter: language === 'hi' ? 'कोई फर्क नहीं' : 'Doesn\'t Matter',
    yes: language === 'hi' ? 'हाँ' : 'Yes',
    no: language === 'hi' ? 'नहीं' : 'No',
    to: language === 'hi' ? 'से' : 'to',
    // Additional profile fields
    state: language === 'hi' ? 'राज्य' : 'State',
    country: language === 'hi' ? 'देश' : 'Country',
    residentialStatus: language === 'hi' ? 'आवासीय स्थिति' : 'Residential Status',
    community: language === 'hi' ? 'समुदाय' : 'Community',
    manglik: language === 'hi' ? 'मांगलिक' : 'Manglik',
    drinkingHabit: language === 'hi' ? 'पेय आदत' : 'Drinking Habit',
    smokingHabit: language === 'hi' ? 'धूम्रपान आदत' : 'Smoking Habit',
    never: language === 'hi' ? 'कभी नहीं' : 'Never',
    occasionally: language === 'hi' ? 'कभी-कभी' : 'Occasionally',
    regularly: language === 'hi' ? 'नियमित' : 'Regularly',
    veg: language === 'hi' ? 'शाकाहारी' : 'Vegetarian',
    nonVeg: language === 'hi' ? 'मांसाहारी' : 'Non-Vegetarian',
    eggetarian: language === 'hi' ? 'अंडाहारी' : 'Eggetarian',
    idProof: language === 'hi' ? 'पहचान प्रमाण' : 'ID Proof',
    idProofType: language === 'hi' ? 'पहचान प्रमाण प्रकार' : 'ID Proof Type',
    membershipPlan: language === 'hi' ? 'सदस्यता योजना' : 'Membership Plan',
    membershipExpiry: language === 'hi' ? 'सदस्यता समाप्ति' : 'Membership Expiry',
    freePlan: language === 'hi' ? 'निःशुल्क' : 'Free',
    sixMonthPlan: language === 'hi' ? '6 माह' : '6 Months',
    oneYearPlan: language === 'hi' ? '1 वर्ष' : '1 Year',
  }

  // Format last login time in DD/MM/YYYY with IST time
  const formatLastLogin = (lastLoginAt?: string) => {
    if (!lastLoginAt) return language === 'hi' ? 'कभी नहीं' : 'Never'
    const date = new Date(lastLoginAt)
    // Format as DD/MM/YYYY HH:MM AM/PM IST
    const day = date.toLocaleString('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' })
    const month = date.toLocaleString('en-IN', { month: '2-digit', timeZone: 'Asia/Kolkata' })
    const year = date.toLocaleString('en-IN', { year: 'numeric', timeZone: 'Asia/Kolkata' })
    const time = date.toLocaleString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true, 
      timeZone: 'Asia/Kolkata' 
    })
    return `${day}/${month}/${year} ${time} IST`
  }

  // Paid verified user (not admin, not free, not expired, verified) OR viewing self
  const isPaidVerifiedUser = isLoggedIn && !shouldBlur && !isAdmin
  
  // Can see all profile details: Admin, self viewer, or paid verified user
  const canSeeAllDetails = isAdmin || isSelf || isPaidVerifiedUser

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-white via-rose-50/30 to-amber-50/20 dark:from-gray-900 dark:via-rose-950/20 dark:to-amber-950/10 border-rose-200 dark:border-rose-800/50">
        <DialogHeader className="relative">
          <div className="flex items-start gap-5 mb-4 pb-4 border-b border-rose-100 dark:border-rose-900/30">
            <div 
              className={`relative ${canSeeFullDetails && !blurContent && profile.photos && profile.photos.length > 0 ? 'cursor-pointer group' : ''}`}
              onClick={() => {
                if (canSeeFullDetails && !blurContent && profile.photos && profile.photos.length > 0) {
                  openLightbox(profile.photos, 0)
                }
              }}
              title={canSeeFullDetails && !blurContent && profile.photos && profile.photos.length > 0 ? (language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge') : ''}
            >
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-rose-400 via-pink-300 to-amber-300 rounded-full opacity-70 group-hover:opacity-100 transition-opacity blur-sm"></div>
              <Avatar className={`relative w-24 h-24 border-3 border-white dark:border-gray-800 shadow-xl ${(!canSeeFullDetails || blurContent) ? 'blur-sm' : ''} ${canSeeFullDetails && !blurContent && profile.photos && profile.photos.length > 0 ? 'group-hover:scale-105 transition-transform' : ''}`}>
                {canSeeFullDetails && !blurContent ? (
                  <AvatarImage src={profile.photos?.[0]} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/50 dark:to-amber-900/50 text-rose-700 dark:text-rose-300 text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {canSeeFullDetails && !blurContent && profile.photos && profile.photos.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                  <Eye size={24} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                {displayName}
                {!canSeeFullDetails && <span className="text-rose-300">...</span>}
              </DialogTitle>
              <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
                <span className="inline-flex items-center gap-2">
                  <span className="font-medium text-rose-600 dark:text-rose-400">{profile.age} {t.years}</span>
                  <span className="text-rose-300">•</span>
                  <span>{profile.gender === 'male' ? t.male : t.female}</span>
                  <span className="text-rose-300">•</span>
                  <span>{getMaritalStatus()}</span>
                </span>
              </DialogDescription>
              {badge && (
                <Badge className={`${badge.color} gap-1.5 mt-2 shadow-sm`}>
                  {badge.icon}
                  <span>{badge.text}</span>
                </Badge>
              )}
              {/* Readiness Badge - shows if user has completed readiness assessment */}
              {profile.hasReadinessBadge && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white gap-1.5 mt-2 ml-1 shadow-sm cursor-help">
                        <Star size={14} weight="fill" />
                        <span>{language === 'hi' ? 'विवाह तैयार' : 'Marriage Ready'}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">
                        {language === 'hi' 
                          ? `तत्परता स्कोर: ${profile.readinessScore || 0}%`
                          : `Readiness Score: ${profile.readinessScore || 0}%`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <section className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 shadow-sm border border-rose-100 dark:border-rose-900/30">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/50 dark:to-amber-900/50">
                <UserCircle size={20} weight="fill" className="text-rose-600 dark:text-rose-400" />
              </div>
              {t.personalInfo}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
              <InfoItem icon={<MapPin size={18} />} label={t.location} value={`${profile.location}, ${profile.country}`} />
              <InfoItem icon={<Calendar size={18} />} label={t.dateOfBirth} value={formatDateDDMMYYYY(profile.dateOfBirth)} />
              <InfoItem icon={<GraduationCap size={18} />} label={t.education} value={formatEducation(profile.education, language)} />
              <InfoItem icon={<Briefcase size={18} />} label={t.occupation} value={formatOccupation(profile.occupation, language)} />
              {profile.religion && (
                <InfoItem icon={<UserCircle size={18} />} label={t.religion} value={profile.religion} />
              )}
              {profile.caste && (
                <InfoItem icon={<UserCircle size={18} />} label={t.caste} value={profile.caste} />
              )}
              {profile.height && (
                <InfoItem icon={<UserCircle size={18} />} label={t.height} value={profile.height} />
              )}
              {profile.weight && (
                <InfoItem icon={<UserCircle size={18} />} label={t.weight} value={profile.weight} />
              )}
              {profile.disability && (
                <InfoItem 
                  icon={<UserCircle size={18} />} 
                  label={t.disability} 
                  value={
                    profile.disability === 'none' ? t.disabilityNone :
                    profile.disability === 'physical' ? t.disabilityPhysical :
                    profile.disability === 'visual' ? t.disabilityVisual :
                    profile.disability === 'hearing' ? t.disabilityHearing :
                    profile.disability === 'speech' ? t.disabilitySpeech :
                    profile.disability === 'intellectual' ? t.disabilityIntellectual :
                    profile.disability === 'multiple' ? t.disabilityMultiple :
                    t.disabilityOther
                  } 
                />
              )}
              {profile.motherTongue && (
                <InfoItem icon={<UserCircle size={18} />} label={t.motherTongue} value={profile.motherTongue} />
              )}
              {/* Show last login for logged in users */}
              {canSeeFullDetails && (
                <InfoItem 
                  icon={<Clock size={18} className="text-green-600" />} 
                  label={t.lastLogin} 
                  value={formatLastLogin(profile.lastLoginAt)} 
                />
              )}
              {/* Paid verified users, Admin, and Self view see all additional fields */}
              {canSeeAllDetails && (
                <>
                  {/* State */}
                  {profile.state && (
                    <InfoItem 
                      icon={<MapPin size={18} />} 
                      label={t.state} 
                      value={profile.state} 
                    />
                  )}
                  {/* Country */}
                  <InfoItem 
                    icon={<Globe size={18} />} 
                    label={t.country} 
                    value={profile.country || t.notProvided} 
                  />
                  {/* Residential Status */}
                  {profile.residentialStatus && (
                    <InfoItem 
                      icon={<Buildings size={18} />} 
                      label={t.residentialStatus} 
                      value={profile.residentialStatus.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} 
                    />
                  )}
                  {/* Community */}
                  {profile.community && (
                    <InfoItem 
                      icon={<UsersThree size={18} />} 
                      label={t.community} 
                      value={profile.community} 
                    />
                  )}
                  {/* Birth Time */}
                  <InfoItem 
                    icon={<Clock size={18} />} 
                    label={t.birthTime} 
                    value={profile.birthTime || t.notProvided} 
                  />
                  {/* Birth Place */}
                  <InfoItem 
                    icon={<MapPin size={18} />} 
                    label={t.birthPlace} 
                    value={profile.birthPlace || t.notProvided} 
                  />
                  {/* Horoscope Matching */}
                  <InfoItem 
                    icon={<Sun size={18} />} 
                    label={t.horoscopeMatching} 
                    value={
                      profile.horoscopeMatching === 'mandatory' ? t.mandatory :
                      profile.horoscopeMatching === 'preferred' ? t.preferred :
                      profile.horoscopeMatching === 'not-mandatory' ? t.notRequired :
                      profile.horoscopeMatching === 'decide-later' ? (language === 'hi' ? 'बाद में तय करेंगे' : 'Decide Later') :
                      t.notProvided
                    } 
                  />
                  {/* Diet Preference */}
                  <InfoItem 
                    icon={<ForkKnife size={18} />} 
                    label={t.diet} 
                    value={
                      profile.dietPreference === 'veg' ? t.veg :
                      profile.dietPreference === 'non-veg' ? t.nonVeg :
                      profile.dietPreference === 'eggetarian' ? t.eggetarian :
                      t.notProvided
                    } 
                  />
                  {/* Drinking Habit */}
                  <InfoItem 
                    icon={<Wine size={18} />} 
                    label={t.drinkingHabit} 
                    value={
                      profile.drinkingHabit === 'never' ? t.never :
                      profile.drinkingHabit === 'occasionally' ? t.occasionally :
                      profile.drinkingHabit === 'regularly' ? t.regularly :
                      t.notProvided
                    } 
                  />
                  {/* Smoking Habit */}
                  <InfoItem 
                    icon={<Cigarette size={18} />} 
                    label={t.smokingHabit} 
                    value={
                      profile.smokingHabit === 'never' ? t.never :
                      profile.smokingHabit === 'occasionally' ? t.occasionally :
                      profile.smokingHabit === 'regularly' ? t.regularly :
                      t.notProvided
                    } 
                  />
                  {/* Manglik */}
                  <InfoItem 
                    icon={<Star size={18} />} 
                    label={t.manglik} 
                    value={
                      profile.manglik === true ? t.yes :
                      profile.manglik === false ? t.no :
                      t.notProvided
                    } 
                  />
                  {/* Disability Details */}
                  {profile.disabilityDetails && (
                    <InfoItem 
                      icon={<Wheelchair size={18} />} 
                      label={language === 'hi' ? 'दिव्यांगता विवरण' : 'Disability Details'} 
                      value={profile.disabilityDetails} 
                    />
                  )}
                  {/* Annual Income / Salary */}
                  <InfoItem 
                    icon={<CurrencyInr size={18} />} 
                    label={t.annualIncome} 
                    value={profile.salary || t.notProvided} 
                  />
                  {/* Occupation/Profession */}
                  <InfoItem 
                    icon={<Briefcase size={18} />} 
                    label={t.profession} 
                    value={profile.position || t.notProvided} 
                  />
                  {/* Relation to Profile */}
                  <InfoItem 
                    icon={<UsersThree size={18} />} 
                    label={t.relation} 
                    value={profile.relationToProfile || (language === 'hi' ? 'स्वयं' : 'Self')} 
                  />
                  {/* Membership Plan - Only visible to Admin or Self */}
                  {(isAdmin || isSelf) && (
                    <InfoItem 
                      icon={<Star size={18} className="text-amber-500" />} 
                      label={t.membershipPlan} 
                      value={
                        profile.membershipPlan === '1-year' ? t.oneYearPlan :
                        profile.membershipPlan === '6-month' ? t.sixMonthPlan :
                        t.freePlan
                      } 
                    />
                  )}
                  {/* Membership Expiry - Only visible to Admin or Self */}
                  {(isAdmin || isSelf) && profile.membershipExpiry && (
                    <InfoItem 
                      icon={<Calendar size={18} />} 
                      label={t.membershipExpiry} 
                      value={formatDateDDMMYYYY(profile.membershipExpiry)} 
                    />
                  )}
                  {/* ID Proof Type - Only visible to Admin or Self */}
                  {(isAdmin || isSelf) && profile.idProofType && (
                    <InfoItem 
                      icon={<IdentificationCard size={18} />} 
                      label={t.idProofType} 
                      value={profile.idProofType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} 
                    />
                  )}
                </>
              )}
            </div>
          </section>

          {/* Paid verified users, Admin, and Self: Show all photos */}
          {canSeeAllDetails && profile.photos && profile.photos.length > 0 && (
            <>
              <Separator className="bg-rose-100 dark:bg-rose-900/30" />
              <section className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 shadow-sm border border-rose-100 dark:border-rose-900/30">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-rose-700 dark:text-rose-400">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/50 dark:to-amber-900/50">
                    <Eye size={18} weight="fill" className="text-rose-600 dark:text-rose-400" />
                  </div>
                  {t.allPhotos}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {language === 'hi' ? 'बड़ा देखने के लिए फोटो पर क्लिक करें' : 'Click on a photo to view larger'}
                </p>
                <div className="flex flex-wrap gap-3">
                  {profile.photos && profile.photos.length > 0 ? (
                    profile.photos.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-rose-300 via-pink-200 to-amber-200 rounded-xl opacity-0 group-hover:opacity-70 transition-opacity blur-sm"></div>
                        <img 
                          src={photo} 
                          alt={`Photo ${idx + 1}`} 
                          className="relative w-24 h-24 object-cover rounded-lg border-2 border-white dark:border-gray-700 shadow-md cursor-pointer group-hover:scale-105 transition-transform"
                          onClick={() => openLightbox(profile.photos || [], idx)}
                          title={language === 'hi' ? 'बड़ा देखें' : 'View larger'}
                        />
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-500">{t.notProvided}</span>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Admin only: Show selfie photo (for verification purposes) */}
          {isAdmin && (
            <section className="bg-blue-50/70 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-900/30">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <UserCircle size={18} weight="fill" className="text-blue-600" />
                </div>
                {t.selfiePhoto}
              </h3>
              <div className="flex gap-3">
                {profile.selfieUrl ? (
                  <img 
                    src={profile.selfieUrl} 
                    alt="Selfie" 
                    className="w-24 h-24 object-cover rounded-lg border-2 border-blue-500 shadow cursor-pointer hover:opacity-80 transition-opacity hover:ring-2 hover:ring-primary"
                    onClick={() => openLightbox([profile.selfieUrl!], 0)}
                    title={language === 'hi' ? 'बड़ा देखें' : 'View larger'}
                  />
                ) : (
                  <span className="text-muted-foreground">{t.notProvided}</span>
                )}
              </div>
            </section>
          )}

          {/* Admin: Show contact information */}
          {isAdmin && (
            <>
              <Separator className="bg-rose-100 dark:bg-rose-900/30" />
              <section className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-900/30">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <Phone size={20} weight="fill" className="text-blue-600 dark:text-blue-400" />
                  </div>
                  {t.contactInfo} ({language === 'hi' ? 'व्यवस्थापक दृश्य' : 'Admin View'})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
                  <InfoItem 
                    icon={<Phone size={18} />} 
                    label={t.mobileNumber} 
                    value={profile.mobile || t.notProvided} 
                  />
                  <InfoItem 
                    icon={<Envelope size={18} />} 
                    label={t.email} 
                    value={profile.email || t.notProvided} 
                  />
                  <InfoItem 
                    icon={<UserCircle size={18} />} 
                    label={t.registeredBy} 
                    value={profile.relationToProfile || (language === 'hi' ? 'स्वयं' : 'Self')} 
                  />
                </div>
              </section>
            </>
          )}

          {/* Paid verified users, Admin, and Self: Show Partner Preferences */}
          {canSeeAllDetails && profile.partnerPreferences && (
            <>
              <Separator className="bg-rose-100 dark:bg-rose-900/30" />
              <section className="bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-900/30">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-purple-700 dark:text-purple-400">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50">
                    <HandHeart size={20} weight="fill" className="text-purple-600 dark:text-purple-400" />
                  </div>
                  {t.partnerPreferences}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
                  {/* Age Preference */}
                  {(profile.partnerPreferences.ageMin || profile.partnerPreferences.ageMax) && (
                    <InfoItem 
                      icon={<Calendar size={18} />} 
                      label={t.preferredAge} 
                      value={
                        profile.partnerPreferences.ageMin && profile.partnerPreferences.ageMax
                          ? `${profile.partnerPreferences.ageMin} ${t.to} ${profile.partnerPreferences.ageMax} ${t.years}`
                          : profile.partnerPreferences.ageMin 
                            ? `${profile.partnerPreferences.ageMin}+ ${t.years}`
                            : `${language === 'hi' ? 'अधिकतम' : 'Up to'} ${profile.partnerPreferences.ageMax} ${t.years}`
                      } 
                    />
                  )}
                  {/* Height Preference */}
                  {(profile.partnerPreferences.heightMin || profile.partnerPreferences.heightMax) && (
                    <InfoItem 
                      icon={<Ruler size={18} />} 
                      label={t.preferredHeight} 
                      value={
                        profile.partnerPreferences.heightMin && profile.partnerPreferences.heightMax
                          ? `${profile.partnerPreferences.heightMin} ${t.to} ${profile.partnerPreferences.heightMax}`
                          : profile.partnerPreferences.heightMin || profile.partnerPreferences.heightMax || t.noPreference
                      } 
                    />
                  )}
                  {/* Education Preference */}
                  <InfoItem 
                    icon={<GraduationCap size={18} />} 
                    label={t.preferredEducation} 
                    value={formatPreferenceValue(profile.partnerPreferences.education, v => formatEducation(v, language))} 
                  />
                  {/* Occupation Preference */}
                  <InfoItem 
                    icon={<Briefcase size={18} />} 
                    label={t.preferredOccupation} 
                    value={formatPreferenceValue(profile.partnerPreferences.occupation, v => formatOccupation(v, language))} 
                  />
                  {/* Employment Status Preference */}
                  <InfoItem 
                    icon={<Briefcase size={18} />} 
                    label={t.preferredEmploymentStatus} 
                    value={formatPreferenceValue(profile.partnerPreferences.employmentStatus, s => 
                      s === 'employed' ? (language === 'hi' ? 'नौकरी' : 'Employed') :
                      s === 'self-employed' ? (language === 'hi' ? 'स्वरोजगार' : 'Self-Employed') :
                      s === 'business-owner' ? (language === 'hi' ? 'व्यापारी' : 'Business Owner') :
                      s === 'govt-employee' ? (language === 'hi' ? 'सरकारी कर्मचारी' : 'Government Employee') :
                      s === 'student' ? (language === 'hi' ? 'विद्यार्थी' : 'Student') :
                      s === 'homemaker' ? (language === 'hi' ? 'गृहिणी' : 'Homemaker') :
                      s === 'not-working' ? (language === 'hi' ? 'काम नहीं करते' : 'Not Working') : s
                    )} 
                  />
                  {/* Living Country Preference */}
                  <InfoItem 
                    icon={<Globe size={18} />} 
                    label={t.preferredLivingCountry} 
                    value={formatPreferenceValue(profile.partnerPreferences.livingCountry)} 
                  />
                  {/* Living State Preference */}
                  <InfoItem 
                    icon={<MapPin size={18} />} 
                    label={t.preferredLivingState} 
                    value={formatPreferenceValue(profile.partnerPreferences.livingState)} 
                  />
                  {/* Annual Income Preference */}
                  {(profile.partnerPreferences.annualIncomeMin || profile.partnerPreferences.annualIncomeMax) && (
                    <InfoItem 
                      icon={<Briefcase size={18} />} 
                      label={t.preferredAnnualIncome} 
                      value={
                        profile.partnerPreferences.annualIncomeMin && profile.partnerPreferences.annualIncomeMax
                          ? `${profile.partnerPreferences.annualIncomeMin} ${t.to} ${profile.partnerPreferences.annualIncomeMax}`
                          : profile.partnerPreferences.annualIncomeMin 
                            ? `${profile.partnerPreferences.annualIncomeMin}+`
                            : `${language === 'hi' ? 'अधिकतम' : 'Up to'} ${profile.partnerPreferences.annualIncomeMax}`
                      } 
                    />
                  )}
                  {/* Location Preference */}
                  <InfoItem 
                    icon={<MapPin size={18} />} 
                    label={t.preferredLocation} 
                    value={formatPreferenceValue(profile.partnerPreferences.location)} 
                  />
                  {/* Country Preference */}
                  <InfoItem 
                    icon={<Globe size={18} />} 
                    label={t.preferredCountry} 
                    value={formatPreferenceValue(profile.partnerPreferences.country)} 
                  />
                  {/* Religion Preference */}
                  <InfoItem 
                    icon={<UserCircle size={18} />} 
                    label={t.preferredReligion} 
                    value={formatPreferenceValue(profile.partnerPreferences.religion)} 
                  />
                  {/* Caste Preference */}
                  <InfoItem 
                    icon={<UsersThree size={18} />} 
                    label={t.preferredCaste} 
                    value={formatPreferenceValue(profile.partnerPreferences.caste)} 
                  />
                  {/* Mother Tongue Preference */}
                  <InfoItem 
                    icon={<Translate size={18} />} 
                    label={t.preferredMotherTongue} 
                    value={formatPreferenceValue(profile.partnerPreferences.motherTongue)} 
                  />
                  {/* Marital Status Preference */}
                  <InfoItem 
                    icon={<Heart size={18} />} 
                    label={t.preferredMaritalStatus} 
                    value={formatPreferenceValue(profile.partnerPreferences.maritalStatus, s => 
                      s === 'never-married' ? (language === 'hi' ? 'अविवाहित' : 'Never Married') :
                      s === 'divorced' ? (language === 'hi' ? 'तलाकशुदा' : 'Divorced') :
                      s === 'widowed' ? (language === 'hi' ? 'विधुर/विधवा' : 'Widowed') : s
                    )} 
                  />
                  {/* Diet Preference */}
                  <InfoItem 
                    icon={<ForkKnife size={18} />} 
                    label={t.preferredDiet} 
                    value={formatPreferenceValue(profile.partnerPreferences.dietPreference, d => 
                      d === 'veg' ? t.veg :
                      d === 'non-veg' ? t.nonVeg :
                      d === 'eggetarian' ? t.eggetarian : d
                    )} 
                  />
                  {/* Drinking Habit Preference */}
                  <InfoItem 
                    icon={<Wine size={18} />} 
                    label={t.preferredDrinking} 
                    value={formatPreferenceValue(profile.partnerPreferences.drinkingHabit, h => 
                      h === 'never' ? t.never :
                      h === 'occasionally' ? t.occasionally :
                      h === 'regularly' ? t.regularly : h
                    )} 
                  />
                  {/* Smoking Habit Preference */}
                  <InfoItem 
                    icon={<Cigarette size={18} />} 
                    label={t.preferredSmoking} 
                    value={formatPreferenceValue(profile.partnerPreferences.smokingHabit, h => 
                      h === 'never' ? t.never :
                      h === 'occasionally' ? t.occasionally :
                      h === 'regularly' ? t.regularly : h
                    )} 
                  />
                  {/* Manglik Preference */}
                  <InfoItem 
                    icon={<Star size={18} />} 
                    label={t.preferredManglik} 
                    value={
                      profile.partnerPreferences.manglik === 'yes' ? t.yes :
                      profile.partnerPreferences.manglik === 'no' ? t.no :
                      profile.partnerPreferences.manglik === 'doesnt-matter' ? t.doesntMatter : 
                      (language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference')
                    } 
                  />
                  {/* Disability Preference */}
                  <InfoItem 
                    icon={<Wheelchair size={18} />} 
                    label={t.preferredDisability} 
                    value={formatPreferenceValue(profile.partnerPreferences.disability, d => 
                      d === 'no' ? t.no :
                      d === 'yes' ? t.yes : d
                    )} 
                  />
                </div>
              </section>
            </>
          )}

          {/* Admin: Show ID Proof Image */}
          {isAdmin && profile.idProofUrl && (
            <>
              <Separator className="bg-rose-100 dark:bg-rose-900/30" />
              <section className="bg-amber-50/70 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-900/30">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                    <IdentificationCard size={20} weight="fill" className="text-amber-600 dark:text-amber-400" />
                  </div>
                  {t.idProof}
                </h3>
                <div className="flex gap-3">
                  <img 
                    src={profile.idProofUrl} 
                    alt="ID Proof" 
                    className="max-w-xs max-h-48 object-contain rounded-lg border-2 border-amber-400 shadow-md cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => openLightbox([profile.idProofUrl!], 0)}
                    title={language === 'hi' ? 'बड़ा देखें' : 'View larger'}
                  />
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                  {profile.idProofType && `${t.idProofType}: ${profile.idProofType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`}
                  {profile.idProofVerified && ` • ${language === 'hi' ? 'सत्यापित' : 'Verified'}`}
                </p>
              </section>
            </>
          )}

          {profile.bio && (
            <>
              <Separator className="bg-rose-100 dark:bg-rose-900/30" />
              <section className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 shadow-sm border border-rose-100 dark:border-rose-900/30">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-rose-700 dark:text-rose-400">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/50 dark:to-amber-900/50">
                    <Heart size={20} weight="fill" className="text-rose-600 dark:text-rose-400" />
                  </div>
                  {t.bio}
                </h3>
                <p className={`text-gray-800 dark:text-gray-200 leading-relaxed italic border-l-4 border-rose-300 dark:border-rose-600 pl-4 bg-white/50 dark:bg-gray-900/50 py-2 rounded-r ${blurContent ? 'blur-sm select-none' : ''}`}>
                  "{profile.bio}"
                </p>
                {blurContent && (
                  <button 
                    onClick={onUpgrade}
                    className="text-xs text-amber-600 mt-3 font-medium hover:text-amber-700 underline underline-offset-2 cursor-pointer transition-colors"
                  >
                    {language === 'hi' 
                      ? 'पूर्ण विवरण देखने के लिए प्रीमियम योजना में अपग्रेड करें' 
                      : 'Upgrade to Premium plan to view full details'}
                  </button>
                )}
              </section>
            </>
          )}

          {profile.familyDetails && (
            <>
              <Separator className="bg-rose-100 dark:bg-rose-900/30" />
              <section className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 shadow-sm border border-rose-100 dark:border-rose-900/30">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-rose-700 dark:text-rose-400">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/50 dark:to-amber-900/50">
                    <UsersThree size={20} weight="fill" className="text-rose-600 dark:text-rose-400" />
                  </div>
                  {t.familyDetails}
                </h3>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{profile.familyDetails}</p>
              </section>
            </>
          )}

          <Separator className="bg-rose-100 dark:bg-rose-900/30" />

          {currentUserProfile && currentUserProfile.id !== profile.id && (
            <section className="bg-gradient-to-br from-rose-50/80 to-amber-50/80 dark:from-rose-950/30 dark:to-amber-950/30 rounded-xl p-4 border border-rose-200 dark:border-rose-900/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-rose-700 dark:text-rose-400">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/50 dark:to-amber-900/50">
                    <Phone size={20} weight="fill" className="text-rose-600 dark:text-rose-400" />
                  </div>
                  {t.contactInfo}
                </h3>
                {isLoggedIn && !isAdmin && (
                  <Badge variant={remainingContacts > 0 ? "outline" : "destructive"} className="text-xs">
                    {language === 'hi' 
                      ? `शेष: ${remainingContacts}/${contactLimit}` 
                      : `Remaining: ${remainingContacts}/${contactLimit}`}
                  </Badge>
                )}
              </div>
              {blurContent ? (
                <div className="text-center py-4">
                  <div className="blur-sm select-none mb-3">
                    <p className="text-muted-foreground">+91 98XXX XXXXX</p>
                    <p className="text-muted-foreground">example@email.com</p>
                  </div>
                  <button 
                    onClick={onUpgrade}
                    className="text-sm text-amber-600 hover:text-amber-700 underline underline-offset-2 cursor-pointer transition-colors font-medium"
                  >
                    {language === 'hi' 
                      ? 'संपर्क विवरण देखने के लिए प्रीमियम योजना में अपग्रेड करें' 
                      : 'Upgrade to Premium plan to view contact details'}
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t.privacyNotice}
                  </p>
                  {contactLimit === 0 ? (
                    <div className="text-center py-4">
                      <button 
                        onClick={onUpgrade}
                        className="text-sm text-amber-600 hover:text-amber-700 underline underline-offset-2 cursor-pointer transition-colors font-medium mb-3"
                      >
                        {language === 'hi' 
                          ? 'मुफ्त प्लान में संपर्क अनुरोध उपलब्ध नहीं है। पेड प्लान में अपग्रेड करें।' 
                          : 'Contact requests not available on Free plan. Upgrade to a paid plan.'}
                      </button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="w-full">
                              <Button 
                                onClick={handleExpressInterest} 
                                className="w-full bg-primary hover:bg-primary/90"
                                disabled={!!existingInterest || !!hasReceivedInterestFromProfile}
                                variant={(existingInterest || hasReceivedInterestFromProfile) ? "secondary" : "default"}
                              >
                                <Heart size={20} weight="fill" className="mr-2" />
                                {existingInterest 
                                  ? (language === 'hi' ? 'रुचि भेजी गई' : 'Interest Sent')
                                  : hasReceivedInterestFromProfile
                                  ? (language === 'hi' ? 'रुचि प्राप्त' : 'Interest Received')
                                  : t.expressInterest
                                }
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {(existingInterest || hasReceivedInterestFromProfile) && (
                            <TooltipContent side="top" className="max-w-[250px] text-center">
                              <p>
                                {existingInterest 
                                  ? (language === 'hi' 
                                    ? 'आपने पहले ही इस प्रोफाइल पर रुचि भेजी है। प्रतिक्रिया का इंतज़ार करें।' 
                                    : 'You have already sent interest to this profile. Wait for their response.')
                                  : (language === 'hi' 
                                    ? 'इस प्रोफाइल ने आपको पहले ही रुचि भेजी है। "मेरी गतिविधि" में जाकर स्वीकार करें।' 
                                    : 'This profile has already sent you interest. Go to "My Activity" to accept.')
                                }
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex-1">
                              <Button 
                                onClick={handleExpressInterest} 
                                className="w-full bg-primary hover:bg-primary/90"
                                disabled={!!existingInterest || !!hasReceivedInterestFromProfile}
                                variant={(existingInterest || hasReceivedInterestFromProfile) ? "secondary" : "default"}
                              >
                                <Heart size={20} weight="fill" className="mr-2" />
                                {existingInterest 
                                  ? (language === 'hi' ? 'रुचि भेजी गई' : 'Interest Sent')
                                  : hasReceivedInterestFromProfile
                                  ? (language === 'hi' ? 'रुचि प्राप्त' : 'Interest Received')
                                  : t.expressInterest
                                }
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {(existingInterest || hasReceivedInterestFromProfile) && (
                            <TooltipContent side="top" className="max-w-[250px] text-center">
                              <p>
                                {existingInterest 
                                  ? (language === 'hi' 
                                    ? 'आपने पहले ही इस प्रोफाइल पर रुचि भेजी है। प्रतिक्रिया का इंतज़ार करें।' 
                                    : 'You have already sent interest to this profile. Wait for their response.')
                                  : (language === 'hi' 
                                    ? 'इस प्रोफाइल ने आपको पहले ही रुचि भेजी है। "मेरी गतिविधि" में जाकर स्वीकार करें।' 
                                    : 'This profile has already sent you interest. Go to "My Activity" to accept.')
                                }
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      {/* Contact Request Button - Shows different states based on request status */}
                      {contactRequestStatus === 'pending' ? (
                        <Button 
                          variant="secondary" 
                          className="flex-1"
                          disabled
                        >
                          <ClockCountdown size={20} className="mr-2" />
                          {t.requestSent}
                        </Button>
                      ) : contactRequestStatus === 'approved' ? (
                        <Button 
                          onClick={() => setShowContactInfo(!showContactInfo)}
                          variant="default"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle size={20} weight="fill" className="mr-2" />
                          {t.viewContact}
                        </Button>
                      ) : contactRequestStatus === 'declined' ? (
                        <Button 
                          variant="secondary" 
                          className="flex-1 text-red-600 dark:text-red-400"
                          disabled
                        >
                          <XCircle size={20} weight="fill" className="mr-2" />
                          {t.requestDeclined}
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleRequestContact} 
                          variant="outline" 
                          className="flex-1"
                          disabled={remainingContacts <= 0 && !contactViewsUsed.includes(profile.profileId)}
                        >
                          <Phone size={20} className="mr-2" />
                          {t.requestContact}
                        </Button>
                      )}
                    </div>
                  )}
                  {/* Show contact info when approved and button clicked */}
                  {contactRequestStatus === 'approved' && showContactInfo && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                        <CheckCircle size={18} weight="fill" />
                        {t.contactInfo}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-muted-foreground" />
                          <span className="font-medium">{profile.mobile || t.notProvided}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Envelope size={16} className="text-muted-foreground" />
                          <span className="font-medium">{profile.email || t.notProvided}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-4 pb-2 border-t border-rose-100 dark:border-rose-900/30">
            <span className="text-rose-400">❤</span> {t.profileId}: <span className="font-medium">{profile.id}</span> | {t.createdOn}: <span className="font-medium">{formatDateDDMMYYYY(profile.createdAt)}</span> <span className="text-rose-400">❤</span>
          </div>
        </div>

        {/* Photo Lightbox for viewing photos in full size */}
        <PhotoLightbox
          photos={lightboxState.photos}
          initialIndex={lightboxState.initialIndex}
          open={lightboxState.open}
          onClose={closeLightbox}
        />
      </DialogContent>
    </Dialog>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 min-w-0 overflow-hidden p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
      <div className="text-rose-500 dark:text-rose-400 mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="text-xs text-gray-600 dark:text-gray-400 truncate mb-0.5 font-medium">{label}</div>
        <div className="font-semibold text-gray-900 dark:text-gray-100 break-words" title={value}>{value}</div>
      </div>
    </div>
  )
}
