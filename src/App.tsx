import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { useKV } from '@/hooks/useKV'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { List, Heart, UserPlus, MagnifyingGlass, ShieldCheck, SignIn, SignOut, UserCircle, Envelope, ChatCircle, Gear, Storefront, ClockCounterClockwise, CaretDown, User as UserIcon, Trophy, Brain, Sparkle, ChartLine, Target, Robot, ArrowRight, Bell, Check } from '@phosphor-icons/react'
import { HeroSearch } from '@/components/HeroSearch'
import { ProfileCard } from '@/components/ProfileCard'
import { ProfileDetailDialog } from '@/components/ProfileDetailDialog'
import { RegistrationDialog } from '@/components/RegistrationDialog'
import { LoginDialog } from '@/components/LoginDialog'
import { MyMatches } from '@/components/MyMatches'
import { MyActivity } from '@/components/MyActivity'
import { Chat } from '@/components/Chat'
import { MyProfile } from '@/components/MyProfile'
import { Settings } from '@/components/Settings'
import { WeddingServices } from '@/components/WeddingServicesPage'
import { ReadinessDashboard } from '@/components/readiness'
import type { Profile, SearchFilters, WeddingService, BlockedProfile, UserNotification, ProfileDeletionData, SuccessStory, ProfileDeletionReason } from '@/types/profile'
import type { User } from '@/types/user'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
// Lazy load AdminPanel - only needed for admins
const AdminPanel = lazy(() => import('@/components/AdminPanel').then(m => ({ default: m.AdminPanel })))
import { AdminLoginDialog } from '@/components/AdminLoginDialog'
import { CookieConsent } from '@/components/CookieConsent'
import { type Language } from '@/lib/translations'
import { toast } from 'sonner'
import { sampleWeddingServices } from '@/lib/sampleData'

// Loading fallback for lazy-loaded components
const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading Admin Panel...</p>
    </div>
  </div>
)

type View = 'home' | 'search-results' | 'admin' | 'my-matches' | 'my-activity' | 'chat' | 'my-profile' | 'wedding-services' | 'readiness' | 'inbox'

// Membership settings interface for dynamic pricing and plan limits
interface MembershipSettings {
  sixMonthPrice: number
  oneYearPrice: number
  sixMonthDuration: number
  oneYearDuration: number
  discountPercentage: number
  discountEnabled: boolean
  discountEndDate: string | null
  // Plan-specific limits
  freePlanChatLimit: number       // Free plan: interest request limit
  freePlanContactLimit: number    // Free plan: contact view limit (0 = none)
  sixMonthChatLimit: number       // 6-month plan: interest request limit
  sixMonthContactLimit: number    // 6-month plan: contact view limit
  oneYearChatLimit: number        // 1-year plan: interest request limit
  oneYearContactLimit: number     // 1-year plan: contact view limit
  // Inactivity deactivation settings
  inactivityDays: number          // Days of inactivity before deactivation (default: 30)
  freePlanChatDurationMonths: number  // Months free plan users can chat with admin after deactivation (default: 6)
  // Payment details
  upiId: string                   // UPI ID for payments
  bankName: string                // Bank name
  accountNumber: string           // Bank account number
  ifscCode: string                // IFSC code
  accountHolderName: string       // Account holder name
  qrCodeImage: string             // QR code image URL/base64
}

const defaultMembershipSettings: MembershipSettings = {
  sixMonthPrice: 500,
  oneYearPrice: 900,
  sixMonthDuration: 6,
  oneYearDuration: 12,
  discountPercentage: 0,
  discountEnabled: false,
  discountEndDate: null,
  // Default plan limits
  freePlanChatLimit: 5,
  freePlanContactLimit: 0,
  sixMonthChatLimit: 50,
  sixMonthContactLimit: 20,
  oneYearChatLimit: 120,
  oneYearContactLimit: 50,
  // Default inactivity settings
  inactivityDays: 30,
  freePlanChatDurationMonths: 6,
  // Default payment details
  upiId: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  accountHolderName: '',
  qrCodeImage: ''
}

function App() {
  const [profiles, setProfiles, , isProfilesLoaded] = useKV<Profile[]>('profiles', [])
  const [users, setUsers, , isUsersLoaded] = useKV<User[]>('users', [])
  const [weddingServices, setWeddingServices] = useKV<WeddingService[]>('weddingServices', [])
  const [userNotifications, setUserNotifications] = useKV<UserNotification[]>('userNotifications', [])
  // IMPORTANT: Login state must be stored in localStorage, NOT in shared KV store!
  // Each device/browser should have its own independent login session
  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => {
    try {
      // First check localStorage for persistent "keep me logged in"
      const persistentLogin = localStorage.getItem('shaadi_loggedInUser')
      if (persistentLogin) return persistentLogin
      
      // Then check sessionStorage for session-only logins
      const sessionLogin = sessionStorage.getItem('shaadi_loggedInUser')
      if (sessionLogin) return sessionLogin
      
      return null
    } catch {
      return null
    }
  })
  const [blockedProfiles] = useKV<BlockedProfile[]>('blockedProfiles', [])
  const [membershipSettings] = useKV<MembershipSettings>('membershipSettings', defaultMembershipSettings)
  
  // Track if critical data is loaded from Azure
  const isDataReady = isProfilesLoaded && isUsersLoaded
  
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    // Check if admin was previously logged in with 'keep me logged in'
    try {
      return localStorage.getItem('adminLoggedIn') === 'true'
    } catch {
      return false
    }
  })
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  
  const [currentView, setCurrentView] = useState<View>('home')
  const [chatTargetProfileId, setChatTargetProfileId] = useState<string | null>(null)
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({})
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [profileToEdit, setProfileToEdit] = useState<Profile | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [language, setLanguage] = useState<Language>('hi')

  const currentUser = users?.find(u => u.userId === loggedInUser)
  const currentUserProfile = currentUser 
    ? profiles?.find(p => p.id === currentUser.profileId) || null
    : null

  // Membership status utility functions
  const getMembershipStatus = (profile: Profile | null) => {
    if (!profile) return { isExpired: true, daysUntilExpiry: 0, isFree: false, shouldBlur: true, isVerified: false }
    
    const isFree = profile.membershipPlan === 'free'
    const isVerified = profile.status === 'verified'
    const expiry = profile.membershipExpiry ? new Date(profile.membershipExpiry) : null
    const now = new Date()
    
    if (!expiry) return { isExpired: true, daysUntilExpiry: 0, isFree, shouldBlur: true, isVerified }
    
    const timeDiff = expiry.getTime() - now.getTime()
    const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
    const isExpired = daysUntilExpiry <= 0
    
    // Free plan has limited features (acts like expired for certain features)
    // Expired plan also has limited features
    // Non-verified profiles also have limited features (treated as free plan)
    const shouldBlur = isExpired || isFree || !isVerified
    
    return { isExpired, daysUntilExpiry, isFree, shouldBlur, isVerified }
  }

  const currentMembershipStatus = getMembershipStatus(currentUserProfile)

  // Free user profile view limit (max 2 profiles)
  const FREE_PROFILE_VIEW_LIMIT = 2

  const handleViewProfile = (profile: Profile) => {
    // Admin can view any profile
    if (isAdminLoggedIn) {
      setSelectedProfile(profile)
      return
    }

    // Not logged in - allow viewing (for browsing)
    if (!currentUserProfile) {
      setSelectedProfile(profile)
      return
    }

    // Own profile - always allowed
    if (profile.profileId === currentUserProfile.profileId) {
      setSelectedProfile(profile)
      return
    }

    // Premium/Paid users - unlimited viewing
    const { isFree, isExpired } = getMembershipStatus(currentUserProfile)
    if (!isFree && !isExpired) {
      setSelectedProfile(profile)
      return
    }

    // Free/Expired users - check limit
    const viewedProfiles = currentUserProfile.freeViewedProfiles || []
    
    // If already viewed this profile, allow viewing again
    if (viewedProfiles.includes(profile.profileId)) {
      setSelectedProfile(profile)
      return
    }

    // Check if limit reached
    if (viewedProfiles.length >= FREE_PROFILE_VIEW_LIMIT) {
      toast.error(
        language === 'hi' 
          ? `मुफ्त सीमा समाप्त: आप केवल ${FREE_PROFILE_VIEW_LIMIT} प्रोफाइल मुफ्त में देख सकते हैं` 
          : `Free limit reached: You can only view ${FREE_PROFILE_VIEW_LIMIT} profiles for free`,
        {
          description: language === 'hi' 
            ? 'असीमित प्रोफाइल देखने के लिए प्रीमियम सदस्यता लें' 
            : 'Upgrade to premium membership for unlimited profile views',
          duration: 6000
        }
      )
      return
    }

    // Add to viewed profiles and allow viewing
    const updatedViewedProfiles = [...viewedProfiles, profile.profileId]
    setProfiles((current) => 
      (current || []).map(p => 
        p.id === currentUserProfile.id 
          ? { ...p, freeViewedProfiles: updatedViewedProfiles }
          : p
      )
    )
    
    setSelectedProfile(profile)
    
    // Notify user about remaining free views
    const remaining = FREE_PROFILE_VIEW_LIMIT - updatedViewedProfiles.length
    if (remaining > 0) {
      toast.info(
        language === 'hi' 
          ? `मुफ्त प्रोफाइल दृश्य: ${remaining} शेष` 
          : `Free profile views: ${remaining} remaining`,
        { duration: 3000 }
      )
    } else {
      toast.warning(
        language === 'hi' 
          ? 'यह आपका अंतिम मुफ्त प्रोफाइल दृश्य था!' 
          : 'This was your last free profile view!',
        {
          description: language === 'hi' 
            ? 'असीमित प्रोफाइल देखने के लिए प्रीमियम में अपग्रेड करें' 
            : 'Upgrade to premium for unlimited profile views',
          duration: 5000
        }
      )
    }
  }

  // Check for expiry notifications on login and periodically
  useEffect(() => {
    if (!currentUserProfile || !loggedInUser) return
    
    const { daysUntilExpiry, isExpired, isFree } = getMembershipStatus(currentUserProfile)
    
    // Show expiry warning 7 days before expiry (once per day)
    const notificationKey = `expiry_notification_${currentUserProfile.profileId}_${new Date().toDateString()}`
    const alreadyNotified = localStorage.getItem(notificationKey)
    
    if (!alreadyNotified) {
      if (isExpired && !isFree) {
        // Membership has expired
        toast.error(
          language === 'hi' 
            ? 'आपकी सदस्यता समाप्त हो गई है!' 
            : 'Your membership has expired!',
          {
            description: language === 'hi' 
              ? 'चैट, संपर्क, फोटो और अन्य सुविधाएं धुंधली हो जाएंगी। कृपया नवीनीकरण करें।' 
              : 'Chat, contact, photos and other features will be blurred. Please renew your plan.',
            duration: 10000
          }
        )
        localStorage.setItem(notificationKey, 'true')
      } else if (daysUntilExpiry > 0 && daysUntilExpiry <= 7 && !isFree) {
        // 7 days before expiry - daily reminder
        toast.warning(
          language === 'hi' 
            ? `सदस्यता समाप्ति चेतावनी: ${daysUntilExpiry} दिन शेष` 
            : `Membership Expiry Warning: ${daysUntilExpiry} days remaining`,
          {
            description: language === 'hi' 
              ? 'कृपया समय पर नवीनीकरण करें। समाप्ति के बाद सुविधाएं सीमित हो जाएंगी।' 
              : 'Please renew on time. Features will be limited after expiry.',
            duration: 8000
          }
        )
        localStorage.setItem(notificationKey, 'true')
      } else if (isFree) {
        // First time login notification for free users
        const freeNotifKey = `free_plan_info_${currentUserProfile.profileId}`
        if (!localStorage.getItem(freeNotifKey)) {
          toast.info(
            language === 'hi' 
              ? 'मुफ्त योजना सक्रिय' 
              : 'Free Plan Active',
            {
              description: language === 'hi' 
                ? 'आप मुफ्त परिचयात्मक योजना पर हैं। पूर्ण सुविधाओं के लिए प्रीमियम योजना में अपग्रेड करें।' 
                : 'You are on the Free Introductory Plan. Upgrade to Premium for full features.',
              duration: 8000
            }
          )
          localStorage.setItem(freeNotifKey, 'true')
        }
      }
    }
  }, [loggedInUser, currentUserProfile, language])

  // Check if logged-in user's profile is deleted and force logout
  useEffect(() => {
    if (loggedInUser && currentUserProfile?.isDeleted) {
      // Profile is deleted, force logout
      setLoggedInUser(null)
      try {
        localStorage.removeItem('shaadi_loggedInUser')
        localStorage.removeItem('shaadi_keepLoggedIn')
        sessionStorage.removeItem('shaadi_loggedInUser')
      } catch (e) {
        logger.warn('Failed to clear login storage:', e)
      }
      toast.error(
        language === 'hi' ? 'प्रोफाइल हटा दी गई है' : 'Profile Deleted',
        {
          description: language === 'hi'
            ? 'आपकी प्रोफाइल हटा दी गई है। कृपया पुनः पंजीकरण करें।'
            : 'Your profile has been deleted. Please register again.'
        }
      )
    }
  }, [loggedInUser, currentUserProfile, language])

  // Load sample wedding services if none exist (wedding services are not stored in Azure)
  useEffect(() => {
    if ((!weddingServices || weddingServices.length === 0) && sampleWeddingServices.length > 0) {
      const hasLoadedBefore = localStorage.getItem('shaadi_partner_azure_loaded')
      if (!hasLoadedBefore) {
        setWeddingServices(sampleWeddingServices)
        localStorage.setItem('shaadi_partner_azure_loaded', 'true')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check and deactivate profiles that have been inactive for too long
  // This runs once when data is ready, and checks all profiles
  useEffect(() => {
    if (!isDataReady || !profiles || profiles.length === 0) return
    
    const inactivityDays = membershipSettings?.inactivityDays || 30
    const inactivityThreshold = inactivityDays * 24 * 60 * 60 * 1000 // Convert days to milliseconds
    const now = new Date()
    
    // Find profiles that should be deactivated (inactive for too long and not already deactivated)
    const profilesToDeactivate = profiles.filter(profile => {
      // Skip already deactivated, deleted, or pending profiles
      if (profile.accountStatus === 'deactivated') return false
      if (profile.isDeleted) return false
      if (profile.status !== 'verified') return false
      
      // Check last activity (prefer lastActivityAt, fallback to lastLoginAt, then createdAt)
      const lastActive = profile.lastActivityAt || profile.lastLoginAt || profile.createdAt
      if (!lastActive) return false
      
      const lastActiveDate = new Date(lastActive)
      const timeSinceActive = now.getTime() - lastActiveDate.getTime()
      
      return timeSinceActive > inactivityThreshold
    })
    
    // Deactivate inactive profiles
    if (profilesToDeactivate.length > 0) {
      setProfiles(current => {
        if (!current) return []
        return current.map(profile => {
          const shouldDeactivate = profilesToDeactivate.some(p => p.id === profile.id)
          if (shouldDeactivate) {
            return {
              ...profile,
              accountStatus: 'deactivated' as const,
              deactivatedAt: now.toISOString(),
              deactivationReason: 'inactivity' as const
            }
          }
          return profile
        })
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDataReady, membershipSettings?.inactivityDays])

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters)
    setCurrentView('search-results')
  }

  const filteredProfiles = useMemo(() => {
    if (!profiles) return []
    
    return profiles.filter(profile => {
      if (profile.status !== 'verified') return false
      
      // Exclude deleted profiles from regular users
      if (profile.isDeleted) return false
      
      // Exclude deactivated profiles from regular users (only admin can see them)
      if (profile.accountStatus === 'deactivated' && !isAdminLoggedIn) return false
      
      if (currentUserProfile && blockedProfiles) {
        const isBlocked = blockedProfiles.some(
          b => (b.blockerProfileId === currentUserProfile.profileId && b.blockedProfileId === profile.profileId) ||
               (b.blockedProfileId === currentUserProfile.profileId && b.blockerProfileId === profile.profileId)
        )
        if (isBlocked) return false
      }
      
      if (searchFilters.gender && profile.gender !== searchFilters.gender) return false
      if (searchFilters.ageMin && profile.age < searchFilters.ageMin) return false
      if (searchFilters.ageMax && profile.age > searchFilters.ageMax) return false
      if (searchFilters.location && !profile.location.toLowerCase().includes(searchFilters.location.toLowerCase()) && 
          !profile.country.toLowerCase().includes(searchFilters.location.toLowerCase())) return false
      if (searchFilters.religion && !profile.religion?.toLowerCase().includes(searchFilters.religion.toLowerCase())) return false
      if (searchFilters.caste && !profile.caste?.toLowerCase().includes(searchFilters.caste.toLowerCase())) return false
      if (searchFilters.education && !profile.education.toLowerCase().includes(searchFilters.education.toLowerCase())) return false
      
      return true
    })
  }, [profiles, searchFilters, currentUserProfile, blockedProfiles, isAdminLoggedIn])

  const handleRegisterProfile = (profileData: Partial<Profile>) => {
    // Ensure data is loaded from Azure before registering
    if (!isDataReady) {
      toast.error(
        language === 'hi' 
          ? 'कृपया प्रतीक्षा करें, डेटा लोड हो रहा है...' 
          : 'Please wait, data is loading from server...'
      )
      return
    }
    
    // Check for duplicate email or mobile
    const existingEmailProfile = profiles?.find(p => p.email && p.email.toLowerCase() === profileData.email?.toLowerCase())
    const existingMobileProfile = profiles?.find(p => p.mobile && p.mobile === profileData.mobile)
    
    if (existingEmailProfile) {
      toast.error(
        language === 'hi' 
          ? 'यह ईमेल पहले से पंजीकृत है। कृपया दूसरा ईमेल उपयोग करें।' 
          : 'This email is already registered. Please use a different email.'
      )
      return
    }
    
    if (existingMobileProfile) {
      toast.error(
        language === 'hi' 
          ? 'यह मोबाइल नंबर पहले से पंजीकृत है। कृपया दूसरा नंबर उपयोग करें।' 
          : 'This mobile number is already registered. Please use a different number.'
      )
      return
    }
    
    const id = `profile-${Date.now()}`
    
    // Generate easy-to-remember credentials
    const firstName = profileData.firstName || profileData.fullName?.split(' ')[0] || ''
    const lastName = profileData.lastName || profileData.fullName?.split(' ').slice(1).join(' ') || firstName
    const birthYear = profileData.dateOfBirth ? new Date(profileData.dateOfBirth).getFullYear().toString().slice(-2) : '00'
    const randomDigits = Math.floor(Math.random() * 9000 + 1000)
    const generatedProfileId = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}${randomDigits}${birthYear}`
    
    // Easy to remember User ID: FirstName + LastName Initial + 2-digit number (e.g., RahulS25)
    const userRandomNum = Math.floor(Math.random() * 90 + 10)
    const userId = `${firstName.charAt(0).toUpperCase()}${firstName.slice(1, 5).toLowerCase()}${lastName.charAt(0).toUpperCase()}${userRandomNum}`
    
    // Easy to remember Password: FirstNameLowercase + Birth Year (e.g., rahul1995)
    const mobileLastFour = profileData.mobile?.slice(-4) || Math.floor(Math.random() * 9000 + 1000).toString()
    const password = `${firstName.toLowerCase().slice(0, 4)}${mobileLastFour}`
    
    const newProfile: Profile = {
      // Spread all profileData fields first to include all form data
      ...profileData as Profile,
      // Then override with computed/generated fields
      id,
      profileId: generatedProfileId,
      firstName,
      lastName,
      fullName: profileData.fullName || `${firstName} ${lastName}`,
      dateOfBirth: profileData.dateOfBirth || '',
      age: profileData.age || 0,
      gender: profileData.gender || 'male',
      maritalStatus: profileData.maritalStatus || 'never-married',
      email: profileData.email || '',
      mobile: profileData.mobile || '',
      relationToProfile: profileData.relationToProfile || 'Self',
      hideEmail: profileData.hideEmail || false,
      hideMobile: profileData.hideMobile || false,
      photos: profileData.photos || [],
      education: profileData.education || '',
      occupation: profileData.occupation || '',
      location: profileData.location || '',
      country: profileData.country || '',
      status: 'pending',
      trustLevel: 1,
      createdAt: new Date().toISOString(),
      emailVerified: false,
      mobileVerified: false,
      isBlocked: false
    }
    
    const newUser: User = {
      userId,
      password,
      profileId: id,
      createdAt: new Date().toISOString(),
      firstLogin: true // User will be prompted to change password on first login
    }
    
    setProfiles(current => [...(current || []), newProfile])
    setUsers(current => [...(current || []), newUser])
    
    setTimeout(() => {
      toast.info(
        language === 'hi' ? 'लॉगिन क्रेडेंशियल्स' : 'Login Credentials',
        {
          description: `User ID: ${userId} | Password: ${password} | Profile ID: ${generatedProfileId}`,
          duration: 10000
        }
      )
    }, 2500)
  }

  const handleLogin = (userId: string, profileId: string, keepLoggedIn: boolean) => {
    // Store login state in localStorage (device-specific, not shared!)
    setLoggedInUser(userId)
    if (keepLoggedIn) {
      try {
        localStorage.setItem('shaadi_loggedInUser', userId)
        localStorage.setItem('shaadi_keepLoggedIn', 'true')
      } catch (e) {
        logger.warn('Failed to save login to localStorage:', e)
      }
    } else {
      // Session-only login - still use state but clear on browser close
      // We use sessionStorage as backup for session-only logins
      try {
        sessionStorage.setItem('shaadi_loggedInUser', userId)
        localStorage.removeItem('shaadi_loggedInUser')
        localStorage.removeItem('shaadi_keepLoggedIn')
      } catch (e) {
        logger.warn('Failed to save session login:', e)
      }
    }
    
    // Redirect to home page after login
    setCurrentView('home')
    
    // Update last login time and last activity time for the profile
    // Also reactivate the profile if user was deactivated (login = active again)
    // Note: profileId from User type is actually the profile's id (UUID), not profileId (M1234567)
    setProfiles(current => {
      if (!current) return []
      const now = new Date().toISOString()
      return current.map(p => {
        if (p.id === profileId) {
          return { 
            ...p, 
            lastLoginAt: now,
            lastActivityAt: now,
            // Reactivate if was deactivated due to inactivity (user logged back in)
            accountStatus: 'active',
            deactivatedAt: undefined,
            deactivationReason: undefined
          }
        }
        return p
      })
    })
  }

  // Success stories KV store
  const [successStories, setSuccessStories] = useKV<SuccessStory[]>('successStories', [])

  // Handle soft delete profile (hide from everyone but admin) with deletion data
  const handleDeleteProfile = (profileId: string, deletionData?: ProfileDeletionData) => {
    const deletingProfile = profiles?.find(p => p.profileId === profileId)
    
    // Update the profile with deletion data
    setProfiles(current => {
      if (!current) return []
      return current.map(p => {
        if (p.profileId === profileId) {
          return { 
            ...p, 
            isDeleted: true, 
            deletedAt: new Date().toISOString(),
            deletedReason: deletionData?.reason || ('user-request' as ProfileDeletionReason),
            deletedReasonDetails: deletionData?.reasonDetails,
            deletionPartnerId: deletionData?.partnerId,
            deletionPartnerName: deletionData?.partnerName,
            successStoryConsent: deletionData?.consentToPublish,
            successStoryPhotoConsent: deletionData?.consentForPhotos,
            successStoryNameConsent: deletionData?.consentForName,
            deletionFeedback: deletionData?.feedbackMessage,
            deletionTestimonial: deletionData?.testimonial,
          }
        }
        return p
      })
    })
    
    // If user found match from this platform and consented, create an individual success story
    if (deletionData?.reason === 'found-match-shaadi-partner-search' && 
        deletionData.partnerId && 
        deletionData.consentToPublish &&
        deletingProfile) {
      
      const partnerProfile = profiles?.find(p => p.profileId === deletionData.partnerId)
      
      if (partnerProfile) {
        const newSuccessStory: SuccessStory = {
          id: `ss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          profile1Id: profileId,
          profile1Name: deletionData.consentForName 
            ? (deletingProfile.fullName || deletingProfile.firstName || 'Anonymous')
            : (language === 'hi' ? 'गोपनीय' : 'Anonymous'),
          profile1PhotoUrl: deletionData.consentForPhotos ? deletingProfile.photos?.[0] : undefined,
          profile1City: deletingProfile.city || deletingProfile.location,
          profile1Gender: deletingProfile.gender,
          
          profile2Id: deletionData.partnerId,
          profile2Name: partnerProfile.fullName || partnerProfile.firstName || 'Partner',
          profile2PhotoUrl: undefined, // Partner didn't consent yet
          profile2City: partnerProfile.city || partnerProfile.location,
          profile2Gender: partnerProfile.gender,
          
          // Individual consent model - only track this user's consent
          profile1Consent: true,
          profile1ConsentAt: new Date().toISOString(),
          profile1PhotoConsent: deletionData.consentForPhotos,
          profile1NameConsent: deletionData.consentForName,
          profile2Consent: false,
          profile2ConsentAt: undefined,
          profile2PhotoConsent: false,
          profile2NameConsent: false,
          bothConsented: false, // Not required for publishing
          
          // Add testimonial from this user
          profile1Testimonial: deletionData.testimonial,
          profile1TestimonialStatus: deletionData.testimonial ? 'pending' : undefined,
          
          // Story goes directly to pending-review for admin
          status: 'pending-review',
          submittedAt: new Date().toISOString(),
          
          rewardStatus: 'not-applicable', // No wedding goodies
        }
        
        // Add to success stories
        setSuccessStories(current => [...(current || []), newSuccessStory])
        
        // Update the profile to link to success story
        setProfiles(current => {
          if (!current) return []
          return current.map(p => {
            if (p.profileId === profileId) {
              return { ...p, successStoryId: newSuccessStory.id }
            }
            return p
          })
        })
        
        logger.info('Success story created for admin review', { 
          storyId: newSuccessStory.id,
          profile1: profileId,
          profile2: deletionData.partnerId,
          hasTestimonial: !!deletionData.testimonial,
        })
      }
    }
    // Clear login state from storage
    setLoggedInUser(null)
    try {
      localStorage.removeItem('shaadi_loggedInUser')
      localStorage.removeItem('shaadi_keepLoggedIn')
      sessionStorage.removeItem('shaadi_loggedInUser')
    } catch (e) {
      logger.warn('Failed to clear login storage:', e)
    }
  }

  // Handle edit profile request
  const handleEditProfile = () => {
    if (currentUserProfile) {
      setProfileToEdit(currentUserProfile)
      setShowRegistration(true)
    }
  }

  // Handle profile update (from edit mode)
  const handleUpdateProfile = (profileData: Partial<Profile>) => {
    if (!profileData.id) {
      // This is a new registration, not an edit
      handleRegisterProfile(profileData)
      return
    }

    // Update existing profile - always send back to pending for admin approval
    setProfiles(current => {
      if (!current) return []
      return current.map(p => {
        if (p.id === profileData.id) {
          return {
            ...p,
            ...profileData,
            // Reset status to pending for admin re-approval
            status: 'pending',
            // Clear the returnedForEdit flag
            returnedForEdit: false,
            editReason: undefined,
            returnedAt: undefined,
            // Track when profile was edited
            updatedAt: new Date().toISOString(),
            lastEditedAt: new Date().toISOString()
          }
        }
        return p
      })
    })

    setShowRegistration(false)
    setProfileToEdit(null)
    
    // Notify user that profile is sent for re-approval
    toast.info(
      language === 'hi' 
        ? 'प्रोफ़ाइल अपडेट हो गई। एडमिन की पुनः स्वीकृति के लिए भेजी गई।' 
        : 'Profile updated. Sent for admin re-approval.',
      {
        description: language === 'hi'
          ? 'आपकी प्रोफ़ाइल स्वीकृति तक अन्य उपयोगकर्ताओं को दिखाई नहीं देगी।'
          : 'Your profile will not be visible to other users until approved.'
      }
    )
  }

  const handleLogout = () => {
    setLoggedInUser(null)
    // Clear login state from all storage
    try {
      localStorage.removeItem('shaadi_loggedInUser')
      localStorage.removeItem('shaadi_keepLoggedIn')
      sessionStorage.removeItem('shaadi_loggedInUser')
    } catch (e) {
      logger.warn('Failed to clear login storage:', e)
    }
    toast.success(language === 'hi' ? 'लॉगआउट सफल' : 'Logged out successfully')
  }

  const t = {
    homeButton: language === 'hi' ? 'मुखपृष्ठ' : 'Home',
    register: language === 'hi' ? 'पंजीकरण करें' : 'Register',
    login: language === 'hi' ? 'लॉगिन करें' : 'Login',
    logout: language === 'hi' ? 'लॉगआउट' : 'Logout',
    adminButton: language === 'hi' ? 'एडमिन' : 'Admin',
    myMatches: language === 'hi' ? 'मैच' : 'Matches',
    myActivity: language === 'hi' ? 'गतिविधि' : 'Activity',
    chat: language === 'hi' ? 'चैट' : 'Chat',
    myProfile: language === 'hi' ? 'प्रोफाइल' : 'Profile',
    settings: language === 'hi' ? 'सेटिंग्स' : 'Settings',
    weddingServices: language === 'hi' ? 'विवाह सेवाएं' : 'Wedding Services',
    searchResults: language === 'hi' ? 'खोज परिणाम' : 'Search Results',
    profilesFound: language === 'hi' ? 'प्रोफाइल मिली' : 'profiles found',
    newSearch: language === 'hi' ? 'नई खोज' : 'New Search',
    noProfiles: language === 'hi' ? 'कोई प्रोफाइल नहीं मिली। कृपया अपने खोज मानदंड बदलें या बाद में पुनः प्रयास करें।' : 'No profiles found. Please change your search criteria or try again later.',
    subtitle: language === 'hi' ? 'मॅट्रिमोनी सेवा' : 'Matrimony Service',
    footerText: language === 'hi' ? 'सभी समुदायों के लिए — विवाह एक पवित्र बंधन है।' : 'For all communities — Marriage is a sacred bond.',
    footerCopyright: language === 'hi' ? '© 2024 ShaadiPartnerSearch. एक निःस्वार्थ समुदाय सेवा।' : '© 2024 ShaadiPartnerSearch. A selfless community service.',
    welcome: language === 'hi' ? 'स्वागत है' : 'Welcome',
    viewProfile: language === 'hi' ? 'प्रोफाइल देखें' : 'View Profile',
  }

  // Get user's first name for personalized display
  const userFirstName = currentUserProfile?.fullName?.split(' ')[0] || ''
  const userProfileId = currentUserProfile?.profileId || ''
  const userPhoto = currentUserProfile?.photos?.[0] || ''

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 flex h-16 items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Heart size={32} weight="fill" className="text-primary" />
              <div className="hidden sm:block">
                <div className="font-bold text-lg leading-tight">ShaadiPartnerSearch</div>
                <div className="text-xs text-muted-foreground">{t.subtitle}</div>
              </div>
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-1 xl:gap-2 overflow-x-auto scrollbar-hide">
            <Button
              variant={currentView === 'home' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('home')}
              className="gap-1 xl:gap-2 px-2 xl:px-3 text-sm flex-shrink-0"
              size="sm"
              aria-label={t.homeButton}
            >
              <Heart size={18} weight="fill" />
              <span className="hidden xl:inline">{t.homeButton}</span>
            </Button>
            {loggedInUser && (
              <>
                <Button
                  variant={currentView === 'my-matches' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('my-matches')}
                  className="gap-1 xl:gap-2 px-2 xl:px-3 text-sm flex-shrink-0"
                  size="sm"
                  aria-label={t.myMatches}
                >
                  <MagnifyingGlass size={18} />
                  <span className="hidden xl:inline">{t.myMatches}</span>
                </Button>
                <Button
                  variant={currentView === 'my-activity' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('my-activity')}
                  className="gap-1 xl:gap-2 px-2 xl:px-3 text-sm flex-shrink-0"
                  size="sm"
                  aria-label={t.myActivity}
                >
                  <ClockCounterClockwise size={18} />
                  <span className="hidden xl:inline">{t.myActivity}</span>
                </Button>
                <Button
                  variant={currentView === 'chat' ? 'default' : 'ghost'}
                  onClick={() => { setChatTargetProfileId(null); setCurrentView('chat'); }}
                  className="gap-1 xl:gap-2 px-2 xl:px-3 text-sm flex-shrink-0"
                  size="sm"
                  aria-label={t.chat}
                >
                  <ChatCircle size={18} />
                  <span className="hidden xl:inline">{t.chat}</span>
                </Button>
                <Button
                  variant={currentView === 'readiness' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('readiness')}
                  className="gap-1 xl:gap-2 px-2 xl:px-3 text-sm flex-shrink-0"
                  size="sm"
                  aria-label={language === 'hi' ? 'तत्परता' : 'Readiness'}
                >
                  <Trophy size={18} weight="fill" />
                  <span className="hidden xl:inline">{language === 'hi' ? 'तत्परता' : 'Readiness'}</span>
                </Button>
              </>
            )}
            <Button
              variant={currentView === 'wedding-services' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('wedding-services')}
              className="gap-1 xl:gap-2 px-2 xl:px-3 text-sm flex-shrink-0"
              size="sm"
              aria-label={t.weddingServices}
            >
              <Storefront size={18} />
              <span className="hidden xl:inline">{t.weddingServices}</span>
            </Button>
            <Button
              variant={currentView === 'admin' ? 'default' : 'ghost'}
              onClick={() => {
                if (!isAdminLoggedIn) {
                  setShowAdminLogin(true)
                } else {
                  setCurrentView('admin')
                }
              }}
              className="gap-1 xl:gap-2 px-2 xl:px-3 text-sm flex-shrink-0"
              size="sm"
              aria-label={t.adminButton}
            >
              <ShieldCheck size={18} weight="fill" />
              <span className="hidden xl:inline">{t.adminButton}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              title={language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
              aria-label={language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
              className="text-lg font-bold px-2 flex-shrink-0"
            >
              {language === 'hi' ? 'A' : 'अ'}
            </Button>
            {!loggedInUser ? (
              <>
                <Button onClick={() => setShowLogin(true)} variant="ghost" className="gap-1 xl:gap-2 px-2 xl:px-3 text-sm flex-shrink-0" size="sm" aria-label={t.login}>
                  <SignIn size={18} weight="bold" />
                  <span className="hidden xl:inline">{t.login}</span>
                </Button>
                <Button onClick={() => setShowRegistration(true)} className="gap-1 xl:gap-2 px-2 xl:px-3 text-sm bg-accent hover:bg-accent/90 text-accent-foreground flex-shrink-0" size="sm" aria-label={t.register}>
                  <UserPlus size={18} weight="bold" />
                  <span className="hidden xl:inline">{t.register}</span>
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {/* Notification Bell with Popover */}
                {(() => {
                  const myNotifications = userNotifications?.filter(
                    n => n.recipientProfileId === currentUserProfile?.profileId
                  ) || []
                  const unreadCount = myNotifications.filter(n => !n.isRead).length
                  const totalCount = myNotifications.length
                  
                  // Helper to format relative time
                  const formatRelativeTime = (dateStr: string): string => {
                    const now = new Date()
                    const date = new Date(dateStr)
                    const diffMs = now.getTime() - date.getTime()
                    const diffMins = Math.floor(diffMs / 60000)
                    const diffHours = Math.floor(diffMs / 3600000)
                    const diffDays = Math.floor(diffMs / 86400000)
                    
                    if (diffMins < 1) return language === 'hi' ? 'अभी' : 'Just now'
                    if (diffMins < 60) return language === 'hi' ? `${diffMins} मिनट पहले` : `${diffMins}m ago`
                    if (diffHours < 24) return language === 'hi' ? `${diffHours} घंटे पहले` : `${diffHours}h ago`
                    if (diffDays < 7) return language === 'hi' ? `${diffDays} दिन पहले` : `${diffDays}d ago`
                    return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })
                  }
                  
                  // Get icon for notification type
                  const getNotificationIcon = (type: string) => {
                    if (type.includes('interest_received')) return <Heart size={16} weight="fill" className="text-pink-500" />
                    if (type.includes('interest_accepted')) return <Check size={16} className="text-green-500" />
                    if (type.includes('interest_declined')) return <SignOut size={16} className="text-red-500" />
                    if (type.includes('contact')) return <Envelope size={16} className="text-blue-500" />
                    if (type.includes('message')) return <ChatCircle size={16} className="text-purple-500" />
                    return <Bell size={16} className="text-muted-foreground" />
                  }
                  
                  const handleMarkAsRead = (notifId: string) => {
                    setUserNotifications(current =>
                      (current || []).map(n =>
                        n.id === notifId ? { ...n, isRead: true } : n
                      )
                    )
                  }
                  
                  const handleMarkAllAsRead = () => {
                    setUserNotifications(current =>
                      (current || []).map(n =>
                        n.recipientProfileId === currentUserProfile?.profileId
                          ? { ...n, isRead: true }
                          : n
                      )
                    )
                  }
                  
                  const handleClearAll = () => {
                    setUserNotifications(current =>
                      (current || []).filter(n => n.recipientProfileId !== currentUserProfile?.profileId)
                    )
                  }
                  
                  const handleDeleteNotification = (notifId: string, e: React.MouseEvent) => {
                    e.stopPropagation()
                    setUserNotifications(current =>
                      (current || []).filter(n => n.id !== notifId)
                    )
                  }
                  
                  return (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative group" aria-label={language === 'hi' ? 'सूचनाएं' : 'Notifications'}>
                          <Bell 
                            size={20} 
                            weight={unreadCount > 0 ? "fill" : "regular"} 
                            className={unreadCount > 0 ? "text-primary animate-pulse" : ""}
                          />
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-96 p-0 shadow-xl">
                        {/* Header with unread count */}
                        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Bell size={18} weight="fill" className="text-primary" />
                            <h4 className="font-semibold text-sm">
                              {language === 'hi' ? 'सूचनाएं' : 'Notifications'}
                            </h4>
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                                {unreadCount} {language === 'hi' ? 'नई' : 'new'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-xs px-2"
                                onClick={handleMarkAllAsRead}
                                title={language === 'hi' ? 'सभी पढ़े गए के रूप में चिह्नित करें' : 'Mark all as read'}
                              >
                                <Check size={14} />
                              </Button>
                            )}
                            {totalCount > 0 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                                onClick={handleClearAll}
                                title={language === 'hi' ? 'सभी हटाएं' : 'Clear all'}
                              >
                                <SignOut size={14} />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Notification list */}
                        <ScrollArea className="h-[350px]">
                          {myNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                              <Bell size={48} weight="thin" className="text-muted-foreground/30 mb-3" />
                              <p className="text-muted-foreground text-sm font-medium">
                                {language === 'hi' ? 'कोई सूचना नहीं' : 'No notifications yet'}
                              </p>
                              <p className="text-muted-foreground/70 text-xs mt-1">
                                {language === 'hi' 
                                  ? 'जब कोई आपमें रुचि दिखाएगा, आपको यहां सूचित किया जाएगा' 
                                  : "When someone shows interest in you, you'll be notified here"}
                              </p>
                            </div>
                          ) : (
                            <div className="divide-y">
                              {myNotifications
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .slice(0, 30)
                                .map((notif) => (
                                  <div 
                                    key={notif.id} 
                                    className={`p-3 hover:bg-muted/50 cursor-pointer transition-all group/item ${
                                      !notif.isRead ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                                    }`}
                                    onClick={() => {
                                      handleMarkAsRead(notif.id)
                                      if (notif.type.includes('interest') || notif.type.includes('contact')) {
                                        setCurrentView('my-activity')
                                      }
                                    }}
                                  >
                                    <div className="flex items-start gap-3">
                                      {/* Icon based on notification type */}
                                      <div className={`mt-0.5 p-1.5 rounded-full ${
                                        !notif.isRead ? 'bg-primary/10' : 'bg-muted'
                                      }`}>
                                        {getNotificationIcon(notif.type)}
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <p className={`text-sm truncate ${!notif.isRead ? 'font-semibold' : 'font-medium'}`}>
                                            {language === 'hi' ? notif.titleHi : notif.title}
                                          </p>
                                          {/* Delete button - shows on hover */}
                                          <button
                                            onClick={(e) => handleDeleteNotification(notif.id, e)}
                                            className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                                            title={language === 'hi' ? 'हटाएं' : 'Delete'}
                                          >
                                            <SignOut size={12} className="text-destructive" />
                                          </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                          {language === 'hi' ? notif.descriptionHi : notif.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                          <span className="text-[10px] text-muted-foreground/70">
                                            {formatRelativeTime(notif.createdAt)}
                                          </span>
                                          {!notif.isRead && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </ScrollArea>
                        
                        {/* Footer with stats and action */}
                        {myNotifications.length > 0 && (
                          <div className="p-2 border-t bg-muted/20 flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground px-2">
                              {language === 'hi' 
                                ? `कुल ${totalCount} सूचनाएं` 
                                : `${totalCount} notification${totalCount !== 1 ? 's' : ''}`}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-xs h-7 gap-1"
                              onClick={() => setCurrentView('my-activity')}
                            >
                              {language === 'hi' ? 'सभी गतिविधि' : 'All activity'}
                              <ArrowRight size={12} />
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  )
                })()}
                
                {/* Logged-in User Profile Dropdown */}
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarImage src={userPhoto} alt={userFirstName} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {getInitials(currentUserProfile?.fullName || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:flex flex-col items-start text-left">
                      <span className="text-sm font-medium leading-tight">{userFirstName}</span>
                      <span className="text-xs text-muted-foreground leading-tight">{userProfileId}</span>
                    </div>
                    <CaretDown size={16} className="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage src={userPhoto} alt={userFirstName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {getInitials(currentUserProfile?.fullName || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{currentUserProfile?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{userProfileId}</p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => setCurrentView('my-profile')} className="gap-2 cursor-pointer">
                    <UserIcon size={18} />
                    {t.viewProfile}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSettings(true)} className="gap-2 cursor-pointer">
                    <Gear size={18} />
                    {t.settings}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                    <SignOut size={18} />
                    {t.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            )}
          </nav>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <List size={24} weight="bold" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              {/* Mobile User Profile Header */}
              {loggedInUser && currentUserProfile && (
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg mb-4 mt-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={userPhoto} alt={userFirstName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {getInitials(currentUserProfile?.fullName || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{currentUserProfile.fullName}</p>
                    <p className="text-xs text-muted-foreground">{userProfileId}</p>
                  </div>
                </div>
              )}
              <nav className="flex flex-col gap-2">
                <Button
                  variant={currentView === 'home' ? 'default' : 'ghost'}
                  onClick={() => {
                    setCurrentView('home')
                    setMobileMenuOpen(false)
                  }}
                  className="justify-start gap-2"
                >
                  <Heart size={20} weight="fill" />
                  {t.homeButton}
                </Button>
                {loggedInUser && (
                  <>
                    <Button
                      variant={currentView === 'my-matches' ? 'default' : 'ghost'}
                      onClick={() => {
                        setCurrentView('my-matches')
                        setMobileMenuOpen(false)
                      }}
                      className="justify-start gap-2"
                    >
                      <MagnifyingGlass size={20} />
                      {t.myMatches}
                    </Button>
                    <Button
                      variant={currentView === 'my-activity' ? 'default' : 'ghost'}
                      onClick={() => {
                        setCurrentView('my-activity')
                        setMobileMenuOpen(false)
                      }}
                      className="justify-start gap-2"
                    >
                      <ClockCounterClockwise size={20} />
                      {t.myActivity}
                    </Button>
                    <Button
                      variant={currentView === 'chat' ? 'default' : 'ghost'}
                      onClick={() => {
                        setChatTargetProfileId(null)
                        setCurrentView('chat')
                        setMobileMenuOpen(false)
                      }}
                      className="justify-start gap-2"
                    >
                      <ChatCircle size={20} />
                      {t.chat}
                    </Button>
                    <Button
                      variant={currentView === 'my-profile' ? 'default' : 'ghost'}
                      onClick={() => {
                        setCurrentView('my-profile')
                        setMobileMenuOpen(false)
                      }}
                      className="justify-start gap-2"
                    >
                      <UserCircle size={20} />
                      {t.myProfile}
                    </Button>
                    <Button
                      variant={currentView === 'readiness' ? 'default' : 'ghost'}
                      onClick={() => {
                        setCurrentView('readiness')
                        setMobileMenuOpen(false)
                      }}
                      className="justify-start gap-2"
                    >
                      <Trophy size={20} weight="fill" />
                      {language === 'hi' ? 'तत्परता' : 'Readiness'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowSettings(true)
                        setMobileMenuOpen(false)
                      }}
                      className="justify-start gap-2"
                    >
                      <Gear size={20} />
                      {t.settings}
                    </Button>
                  </>
                )}
                <Button
                  variant={currentView === 'wedding-services' ? 'default' : 'ghost'}
                  onClick={() => {
                    setCurrentView('wedding-services')
                    setMobileMenuOpen(false)
                  }}
                  className="justify-start gap-2"
                >
                  <Storefront size={20} />
                  {t.weddingServices}
                </Button>
                <Button
                  variant={currentView === 'admin' ? 'default' : 'ghost'}
                  onClick={() => {
                    if (!isAdminLoggedIn) {
                      setShowAdminLogin(true)
                      setMobileMenuOpen(false)
                    } else {
                      setCurrentView('admin')
                      setMobileMenuOpen(false)
                    }
                  }}
                  className="justify-start gap-2"
                >
                  <ShieldCheck size={20} weight="fill" />
                  {t.adminButton}
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
                  className="justify-start gap-2"
                >
                  <span className="text-xl font-bold w-5 text-center">{language === 'hi' ? 'A' : 'अ'}</span>
                  {language === 'hi' ? 'English' : 'हिंदी'}
                </Button>
                {!loggedInUser ? (
                  <>
                    <Button 
                      onClick={() => {
                        setShowLogin(true)
                        setMobileMenuOpen(false)
                      }}
                      variant="ghost"
                      className="justify-start gap-2"
                    >
                      <SignIn size={20} weight="bold" />
                      {t.login}
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowRegistration(true)
                        setMobileMenuOpen(false)
                      }} 
                      className="justify-start gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <UserPlus size={20} weight="bold" />
                      {t.register}
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    variant="ghost"
                    className="justify-start gap-2"
                  >
                    <SignOut size={20} weight="bold" />
                    {t.logout}
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className={`flex-1 ${loggedInUser ? 'pb-16 md:pb-0' : ''}`}>
        {currentView === 'home' && (
          <>
            <HeroSearch 
              onSearch={handleSearch} 
              language={language} 
              membershipSettings={membershipSettings || defaultMembershipSettings}
            />
            
            {/* Statistics Bar - Matrimony Site Trust Indicators */}
            {(() => {
              const activeProfiles = (profiles || []).filter(p => p.status === 'verified' && !p.deletedAt).length
              const publishedStoriesCount = (successStories || []).filter(s => s.status === 'published').length
              const totalConnections = activeProfiles > 0 ? Math.floor(activeProfiles * 2.5) : 0 // Estimated connections made
              
              // Only show stats if we have meaningful data
              if (activeProfiles === 0 && publishedStoriesCount === 0) return null
              
              return (
                <section className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 py-8 border-y border-primary/10">
                  <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                      {activeProfiles > 0 && (
                        <div className="text-center">
                          <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                            {activeProfiles.toLocaleString()}+
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {language === 'hi' ? 'सक्रिय प्रोफाइल' : 'Active Profiles'}
                          </p>
                        </div>
                      )}
                      {publishedStoriesCount > 0 && (
                        <div className="text-center">
                          <div className="text-3xl md:text-4xl font-bold text-rose-500 mb-1">
                            {publishedStoriesCount}+
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {language === 'hi' ? 'सफल जोड़े' : 'Happy Couples'}
                          </p>
                        </div>
                      )}
                      {totalConnections > 0 && (
                        <div className="text-center">
                          <div className="text-3xl md:text-4xl font-bold text-accent mb-1">
                            {totalConnections.toLocaleString()}+
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {language === 'hi' ? 'कनेक्शन बने' : 'Connections Made'}
                          </p>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-green-600 mb-1">
                          100%
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'hi' ? 'सत्यापित प्रोफाइल' : 'Verified Profiles'}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )
            })()}
            <section className="container mx-auto px-4 md:px-8 py-16">
              <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
                  {language === 'hi' ? 'हमारी सेवा क्यों विशेष है' : 'Why Our Service is Special'}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                          <ShieldCheck size={32} weight="fill" className="text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl mb-2">
                            {language === 'hi' ? 'किफायती सदस्यता' : 'Affordable Membership'}
                          </h3>
                          <p className="text-muted-foreground">
                            {language === 'hi' 
                              ? `6 महीने के लिए ₹${membershipSettings?.sixMonthPrice || 500} या 1 साल के लिए ₹${membershipSettings?.oneYearPrice || 900} — कोई छुपी लागत नहीं।` 
                              : `₹${membershipSettings?.sixMonthPrice || 500} for 6 months or ₹${membershipSettings?.oneYearPrice || 900} for 1 year — no hidden costs.`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-teal/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-teal/10">
                          <ShieldCheck size={32} weight="fill" className="text-teal" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl mb-2">
                            {language === 'hi' ? 'सभी समुदाय स्वागत हैं' : 'All Communities Welcome'}
                          </h3>
                          <p className="text-muted-foreground">
                            {language === 'hi' ? 'सभी धर्मों, जातियों और समुदायों के लिए।' : 'For all religions, castes and communities.'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-accent/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-accent/10">
                          <Heart size={32} weight="fill" className="text-accent" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl mb-2">
                            {language === 'hi' ? 'अनुभवी पेशेवरों द्वारा ऑनलाइन सहायता' : 'Online Support by Experienced Professionals'}
                          </h3>
                          <p className="text-muted-foreground">
                            {language === 'hi' ? 'हमारे अनुभवी पेशेवर ऑनलाइन परिवारों की मदद करते हैं।' : 'Our experienced professionals help families online.'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                          <Heart size={32} weight="fill" className="text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl mb-2">
                            {language === 'hi' ? 'विवाह सेवाएं' : 'Wedding Services'}
                          </h3>
                          <p className="text-muted-foreground">
                            {language === 'hi' ? 'सत्यापित विवाह सेवा प्रदाताओं की डायरेक्टरी — सिर्फ ₹200 परामर्श शुल्क।' : 'Directory of verified wedding service providers — only ₹200 consultation fee.'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Marriage Readiness - Unique USP Highlight */}
                <Card className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-300 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30 dark:border-amber-700 mb-12 overflow-hidden relative">
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                    ✨ {language === 'hi' ? 'अनोखी सुविधा' : 'Unique Feature'}
                  </div>
                  <CardContent className="py-8 px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                      {/* Left: Icon and Title */}
                      <div className="flex-shrink-0 text-center lg:text-left">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white mb-4 shadow-lg">
                          <Brain size={48} weight="fill" />
                        </div>
                        <h3 className="font-bold text-2xl md:text-3xl text-amber-800 dark:text-amber-300 mb-2">
                          {language === 'hi' ? '💡 विवाह तैयारी मूल्यांकन' : '💡 Marriage Readiness Assessment'}
                        </h3>
                        <p className="text-amber-700 dark:text-amber-400 font-medium">
                          {language === 'hi' ? 'भारत का पहला AI-संचालित विवाह तैयारी प्लेटफॉर्म' : "India's First AI-Powered Marriage Readiness Platform"}
                        </p>
                      </div>

                      {/* Right: Features Grid */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-white/10 rounded-lg">
                          <Sparkle size={24} weight="fill" className="text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm">{language === 'hi' ? 'आत्म-खोज प्रश्नावली' : 'Self-Discovery Quiz'}</h4>
                            <p className="text-xs text-muted-foreground">{language === 'hi' ? 'अपने मूल्य और व्यक्तित्व जानें' : 'Know your values & personality'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-white/10 rounded-lg">
                          <ChartLine size={24} weight="fill" className="text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm">{language === 'hi' ? 'भावनात्मक बुद्धिमत्ता (EQ)' : 'Emotional Intelligence (EQ)'}</h4>
                            <p className="text-xs text-muted-foreground">{language === 'hi' ? 'रिश्तों के लिए भावनात्मक परिपक्वता जांचें' : 'Assess emotional maturity for relationships'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-white/10 rounded-lg">
                          <Target size={24} weight="fill" className="text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm">{language === 'hi' ? 'साथी अपेक्षाएं' : 'Partner Expectations'}</h4>
                            <p className="text-xs text-muted-foreground">{language === 'hi' ? 'स्पष्ट करें क्या चाहते हैं और क्या नहीं' : 'Define must-haves & dealbreakers'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-white/10 rounded-lg">
                          <Robot size={24} weight="fill" className="text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm">{language === 'hi' ? 'AI बायो सहायक' : 'AI Bio Assistant'}</h4>
                            <p className="text-xs text-muted-foreground">{language === 'hi' ? 'आकर्षक प्रोफाइल विवरण बनाएं' : 'Create compelling profile description'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                        <Trophy size={20} weight="fill" className="text-amber-600" />
                        <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                          {language === 'hi' ? '"तैयार" बैज अर्जित करें' : 'Earn "Ready" Badge'}
                        </span>
                      </div>
                      <Button 
                        onClick={() => loggedInUser ? setCurrentView('readiness') : setShowRegistration(true)}
                        size="lg"
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2 shadow-lg"
                      >
                        {language === 'hi' ? 'अभी शुरू करें' : 'Start Now'}
                        <ArrowRight size={18} weight="bold" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Free Biodata Advertisement */}
                <Card className="bg-gradient-to-r from-red-50 to-amber-50 border-2 border-red-200 dark:from-red-950/20 dark:to-amber-950/20 dark:border-red-800">
                  <CardContent className="py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="text-red-600" viewBox="0 0 256 256">
                            <path d="M224,152a8,8,0,0,1-8,8H192v16h16a8,8,0,0,1,0,16H192v16a8,8,0,0,1-16,0V152a8,8,0,0,1,8-8h32A8,8,0,0,1,224,152ZM92,172a28,28,0,0,1-28,28H56v8a8,8,0,0,1-16,0V152a8,8,0,0,1,8-8H64A28,28,0,0,1,92,172Zm-16,0a12,12,0,0,0-12-12H56v24h8A12,12,0,0,0,76,172Zm84,8a36,36,0,0,1-36,36H104a8,8,0,0,1-8-8V152a8,8,0,0,1,8-8h20A36,36,0,0,1,160,180Zm-16,0a20,20,0,0,0-20-20H112v40h12A20,20,0,0,0,144,180ZM40,112V40A16,16,0,0,1,56,24h96a8,8,0,0,1,5.66,2.34l56,56A8,8,0,0,1,216,88v24a8,8,0,0,1-16,0V96H152a8,8,0,0,1-8-8V40H56v72a8,8,0,0,1-16,0ZM160,80h28.69L160,51.31Z"></path>
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-2xl text-red-700 dark:text-red-400 mb-1">
                            {language === 'hi' ? '🎉 मुफ्त बायोडाटा!' : '🎉 Free Biodata!'}
                          </h3>
                          <p className="text-muted-foreground">
                            {language === 'hi' 
                              ? 'पंजीकृत और स्वीकृत उपयोगकर्ताओं के लिए सुंदर बायोडाटा PDF मुफ्त में बनाएं और डाउनलोड करें!'
                              : 'Create and download beautiful biodata PDF for free for registered & approved users!'
                            }
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setShowRegistration(true)}
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 text-white gap-2 whitespace-nowrap"
                      >
                        {language === 'hi' ? 'अभी पंजीकरण करें' : 'Register Now'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Alert className="bg-primary/5 border-primary/20">
                  <ShieldCheck size={20} weight="fill" />
                  <AlertDescription className="text-base">
                    <strong>{language === 'hi' ? 'गोपनीयता और सुरक्षा:' : 'Privacy and Security:'}</strong>{' '}
                    {language === 'hi' 
                      ? 'सभी प्रोफाइल की मैन्युअल जांच • कोई डेटा बिक्री नहीं • केवल सत्यापित उपयोगकर्ताओं को संपर्क की अनुमति • रिपोर्ट/ब्लॉक विकल्प उपलब्ध'
                      : 'All profiles manually checked • No data selling • Only verified users can contact • Report/Block options available'
                    }
                  </AlertDescription>
                </Alert>

                {/* Success Stories Section */}
                {(() => {
                  const publishedStories = successStories?.filter(s => s.status === 'published') || []
                  if (publishedStories.length === 0) return null
                  
                  return (
                    <Card className="mt-12 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border-2 border-rose-200 dark:from-rose-950/30 dark:via-pink-950/30 dark:to-amber-950/30 dark:border-rose-800 overflow-hidden">
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-500 to-pink-500 text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                        💕 {language === 'hi' ? 'सफलता की कहानियां' : 'Success Stories'}
                      </div>
                      <CardContent className="pt-10 pb-6">
                        <div className="text-center mb-6">
                          <h3 className="text-2xl md:text-3xl font-bold text-rose-700 dark:text-rose-400 mb-2">
                            {language === 'hi' ? '❤️ हमारी सफलता की कहानियां' : '❤️ Our Success Stories'}
                          </h3>
                          <p className="text-muted-foreground">
                            {language === 'hi' 
                              ? 'इस प्लेटफॉर्म के माध्यम से अपना जीवनसाथी पाने वाले जोड़े' 
                              : 'Couples who found their life partner through this platform'}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {publishedStories.slice(0, 6).map((story) => {
                            // Helper to get initials from name
                            const getInitials = (name: string) => {
                              return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                            }
                            
                            // Determine what to show based on privacy settings
                            const showProfile1 = !story.hideProfile1Completely
                            const showProfile2 = !story.hideProfile2Completely
                            const isSinglePublish = story.hideProfile1Completely || story.hideProfile2Completely
                            
                            // For names - show actual name or initials
                            const profile1DisplayName = story.hideProfile1Name 
                              ? getInitials(story.profile1Name) 
                              : story.profile1Name
                            const profile2DisplayName = story.hideProfile2Name 
                              ? getInitials(story.profile2Name) 
                              : story.profile2Name
                            
                            // For photos - show photo, hidden icon, or nothing
                            const showProfile1Photo = showProfile1 && !story.hideProfile1Photo && story.profile1PhotoUrl
                            const showProfile2Photo = showProfile2 && !story.hideProfile2Photo && story.profile2PhotoUrl
                            
                            return (
                            <div key={story.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-rose-100 dark:border-rose-900/50 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-center gap-3 mb-3">
                                {/* Single Publish Layout - Only one person shown */}
                                {isSinglePublish ? (
                                  <>
                                    {showProfile1 && (
                                      showProfile1Photo ? (
                                        <div className="relative">
                                          <div className="w-16 h-16 rounded-full ring-2 ring-rose-300 ring-offset-2 overflow-hidden">
                                            <img src={story.profile1PhotoUrl} alt="" className="w-full h-full object-cover" />
                                          </div>
                                          <Heart size={20} weight="fill" className="absolute -bottom-1 -right-1 text-rose-500 bg-white rounded-full p-0.5" />
                                        </div>
                                      ) : (
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/50 dark:to-pink-900/50 flex items-center justify-center ring-2 ring-rose-300 ring-offset-2">
                                          <Heart size={28} weight="fill" className="text-rose-400" />
                                        </div>
                                      )
                                    )}
                                    {showProfile2 && (
                                      showProfile2Photo ? (
                                        <div className="relative">
                                          <div className="w-16 h-16 rounded-full ring-2 ring-rose-300 ring-offset-2 overflow-hidden">
                                            <img src={story.profile2PhotoUrl} alt="" className="w-full h-full object-cover" />
                                          </div>
                                          <Heart size={20} weight="fill" className="absolute -bottom-1 -right-1 text-rose-500 bg-white rounded-full p-0.5" />
                                        </div>
                                      ) : (
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/50 dark:to-pink-900/50 flex items-center justify-center ring-2 ring-rose-300 ring-offset-2">
                                          <Heart size={28} weight="fill" className="text-rose-400" />
                                        </div>
                                      )
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {/* Profile 1 Photo */}
                                    {showProfile1Photo ? (
                                      <div className="relative">
                                        <div className="w-14 h-14 rounded-full ring-2 ring-rose-300 ring-offset-2 overflow-hidden">
                                          <img src={story.profile1PhotoUrl} alt="" className="w-full h-full object-cover" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/50 dark:to-pink-900/50 flex items-center justify-center ring-2 ring-rose-300 ring-offset-2">
                                        <Heart size={24} weight="fill" className="text-rose-400" />
                                      </div>
                                    )}
                                    
                                    {/* Heart Icon between photos */}
                                    <Heart size={28} weight="fill" className="text-rose-500 animate-pulse" />
                                    
                                    {/* Profile 2 Photo */}
                                    {showProfile2Photo ? (
                                      <div className="relative">
                                        <div className="w-14 h-14 rounded-full ring-2 ring-rose-300 ring-offset-2 overflow-hidden">
                                          <img src={story.profile2PhotoUrl} alt="" className="w-full h-full object-cover" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/50 dark:to-pink-900/50 flex items-center justify-center ring-2 ring-rose-300 ring-offset-2">
                                        <Heart size={24} weight="fill" className="text-rose-400" />
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                              
                              {/* Names */}
                              <p className="text-center font-semibold text-rose-700 dark:text-rose-400 mb-1">
                                {isSinglePublish 
                                  ? (showProfile1 ? profile1DisplayName : profile2DisplayName)
                                  : `${profile1DisplayName} & ${profile2DisplayName}`
                                }
                              </p>
                              <p className="text-center text-xs text-muted-foreground mb-3">
                                {isSinglePublish
                                  ? (showProfile1 ? (story.profile1City || '') : (story.profile2City || ''))
                                  : (story.profile1City 
                                      ? (story.profile2City ? `${story.profile1City} & ${story.profile2City}` : story.profile1City)
                                      : story.profile2City || '')
                                }
                              </p>
                              
                              {/* Testimonial - show if story is published (admin approved it) */}
                              {story.profile1Testimonial && (
                                <div className="bg-rose-50 dark:bg-rose-950/20 rounded-lg p-3 border border-rose-100 dark:border-rose-900/50">
                                  <p className="text-xs text-gray-600 dark:text-gray-300 italic line-clamp-3">
                                    "{story.profile1Testimonial}"
                                  </p>
                                  <p className="text-[10px] text-rose-500 mt-1 text-right">
                                    — {isSinglePublish 
                                        ? (showProfile1 ? profile1DisplayName : profile2DisplayName)
                                        : profile1DisplayName
                                      }
                                  </p>
                                </div>
                              )}
                            </div>
                          )})}
                        </div>
                        
                        {publishedStories.length > 6 && (
                          <div className="text-center mt-6">
                            <p className="text-sm text-muted-foreground">
                              {language === 'hi' 
                                ? `और ${publishedStories.length - 6} सफल जोड़े...` 
                                : `And ${publishedStories.length - 6} more successful couples...`}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })()}
              </div>
            </section>
          </>
        )}

        {currentView === 'search-results' && (
          <section className="container mx-auto px-4 md:px-8 py-12">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{t.searchResults}</h2>
                  <p className="text-muted-foreground">
                    {filteredProfiles.length} {t.profilesFound}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setCurrentView('home')}>
                  <MagnifyingGlass size={20} className="mr-2" />
                  {t.newSearch}
                </Button>
              </div>

              {filteredProfiles.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    {t.noProfiles}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProfiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      onViewProfile={handleViewProfile}
                      language={language}
                      isLoggedIn={!!loggedInUser}
                      shouldBlur={currentMembershipStatus.shouldBlur}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {currentView === 'admin' && (
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminPanel profiles={profiles} setProfiles={setProfiles} users={users} language={language} onLogout={() => { setIsAdminLoggedIn(false); setCurrentView('home'); try { localStorage.removeItem('adminLoggedIn'); } catch (e) { logger.error(e); } toast.info(language === 'hi' ? 'एडमिन से लॉगआउट हो गया' : 'Logged out from admin'); }} onLoginAsUser={(userId) => { setLoggedInUser(userId); setCurrentView('home'); toast.success(language === 'hi' ? `उपयोगकर्ता ${userId} के रूप में लॉगिन` : `Logged in as user ${userId}`); }} />
          </Suspense>
        )}

        {currentView === 'my-matches' && (
          <MyMatches 
            loggedInUserId={currentUserProfile?.id || null}
            profiles={profiles || []}
            onViewProfile={handleViewProfile}
            language={language}
            membershipPlan={currentUserProfile?.membershipPlan}
            profileStatus={currentUserProfile?.status}
          />
        )}

        {currentView === 'my-activity' && (
          <MyActivity 
            loggedInUserId={currentUserProfile?.id || null}
            profiles={profiles || []}
            language={language}
            onViewProfile={handleViewProfile}
            membershipPlan={currentUserProfile?.membershipPlan}
            membershipSettings={membershipSettings || defaultMembershipSettings}
            setProfiles={setProfiles}
            onNavigateToChat={(profileId) => {
              setChatTargetProfileId(profileId || null)
              setCurrentView('chat')
            }}
          />
        )}

        {currentView === 'chat' && (
          <Chat 
            currentUserProfile={currentUserProfile}
            profiles={profiles || []}
            language={language}
            shouldBlur={currentMembershipStatus.shouldBlur}
            membershipPlan={currentUserProfile?.membershipPlan}
            membershipSettings={membershipSettings || defaultMembershipSettings}
            setProfiles={setProfiles}
            initialChatProfileId={chatTargetProfileId}
          />
        )}

        {currentView === 'my-profile' && (
          <MyProfile 
            profile={currentUserProfile}
            profiles={profiles || []}
            language={language}
            onEdit={handleEditProfile}
            onDeleteProfile={handleDeleteProfile}
            membershipSettings={membershipSettings || defaultMembershipSettings}
            onNavigateHome={() => setCurrentView('home')}
            onNavigateActivity={() => setCurrentView('my-activity')}
            onNavigateInbox={() => setCurrentView('inbox')}
            onNavigateChat={() => { setChatTargetProfileId(null); setCurrentView('chat'); }}
          />
        )}

        {currentView === 'wedding-services' && (
          <WeddingServices 
            language={language} 
            shouldBlur={currentMembershipStatus.shouldBlur}
            membershipPlan={currentUserProfile?.membershipPlan}
          />
        )}

        {currentView === 'readiness' && currentUserProfile && (
          <section className="container mx-auto px-4 md:px-8 py-8">
            <div className="max-w-5xl mx-auto">
              <ReadinessDashboard 
                language={language}
                profile={currentUserProfile}
                onProfileUpdate={(updates) => {
                  if (currentUserProfile) {
                    setProfiles((current) => 
                      (current || []).map(p => 
                        p.profileId === currentUserProfile.profileId 
                          ? { ...p, ...updates } 
                          : p
                      )
                    )
                  }
                }}
              />
            </div>
          </section>
        )}
      </main>

      {loggedInUser && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-40">
          <div className="grid grid-cols-4 gap-1 p-2">
            <Button
              variant={currentView === 'home' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('home')}
              className="flex-col h-auto py-2 px-1"
              size="sm"
            >
              <Heart size={20} weight={currentView === 'home' ? 'fill' : 'regular'} />
              <span className="text-xs mt-1">{language === 'hi' ? 'होम' : 'Home'}</span>
            </Button>
            <Button
              variant={currentView === 'my-activity' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('my-activity')}
              className="flex-col h-auto py-2 px-1"
              size="sm"
            >
              <ClockCounterClockwise size={20} weight={currentView === 'my-activity' ? 'fill' : 'regular'} />
              <span className="text-xs mt-1">{language === 'hi' ? 'गतिविधि' : 'Activity'}</span>
            </Button>
            <Button
              variant={currentView === 'chat' ? 'default' : 'ghost'}
              onClick={() => { setChatTargetProfileId(null); setCurrentView('chat'); }}
              className="flex-col h-auto py-2 px-1"
              size="sm"
            >
              <ChatCircle size={20} weight={currentView === 'chat' ? 'fill' : 'regular'} />
              <span className="text-xs mt-1">{language === 'hi' ? 'चैट' : 'Chat'}</span>
            </Button>
          </div>
        </nav>
      )}

      {/* Hide footer when in chat view to prevent overlap with chat input */}
      <footer className={`border-t bg-muted/30 py-8 ${loggedInUser && currentView === 'chat' ? 'hidden' : ''}`}>
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart size={24} weight="fill" className="text-primary" />
              <span className="font-bold text-lg">ShaadiPartnerSearch</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t.footerText}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.footerCopyright}
            </p>
          </div>
        </div>
      </footer>

      <ProfileDetailDialog
        profile={selectedProfile}
        open={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
        language={language}
        currentUserProfile={currentUserProfile}
        isLoggedIn={!!currentUserProfile}
        shouldBlur={currentMembershipStatus.shouldBlur}
        membershipPlan={currentUserProfile?.membershipPlan}
        membershipSettings={membershipSettings || defaultMembershipSettings}
        setProfiles={setProfiles}
      />

      <RegistrationDialog
        open={showRegistration}
        onClose={() => {
          setShowRegistration(false)
          setProfileToEdit(null)
        }}
        onSubmit={profileToEdit ? handleUpdateProfile : handleRegisterProfile}
        language={language}
        existingProfiles={profiles}
        editProfile={profileToEdit}
        membershipSettings={membershipSettings || defaultMembershipSettings}
      />

      <LoginDialog
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
        onUpdatePassword={(targetUserId, newPassword) => {
          setUsers(current => {
            if (!current) return []
            return current.map(u => 
              u.userId === targetUserId 
                ? { ...u, password: newPassword, firstLogin: false, passwordChangedAt: new Date().toISOString() }
                : u
            )
          })
        }}
        users={users || []}
        profiles={profiles || []}
        language={language}
      />

      {loggedInUser && currentUserProfile && (
        <Settings
          open={showSettings}
          onClose={() => setShowSettings(false)}
          profileId={currentUserProfile.profileId}
          language={language}
          currentProfile={currentUserProfile}
          onUpdateProfile={(updatedProfile) => {
            setProfiles(current => {
              if (!current) return []
              return current.map(p => 
                p.profileId === updatedProfile.profileId ? updatedProfile : p
              )
            })
          }}
        />
      )}

      <AdminLoginDialog
        open={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLoginSuccess={(keepLoggedIn) => {
          setIsAdminLoggedIn(true)
          setCurrentView('admin')
          if (keepLoggedIn) {
            try {
              localStorage.setItem('adminLoggedIn', 'true')
            } catch (e) {
              logger.error('Could not save admin login state:', e)
            }
          }
          toast.success(language === 'hi' ? 'एडमिन पैनल में आपका स्वागत है!' : 'Welcome to Admin Panel!')
        }}
        language={language}
      />

      <Toaster position="top-right" />

      {/* Cookie Consent Banner */}
      <CookieConsent language={language} />
    </div>
  )
}

export default App