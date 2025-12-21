import { useState, useMemo, useEffect } from 'react'
import { useKV } from '@/hooks/useKV'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { List, Heart, UserPlus, MagnifyingGlass, ShieldCheck, SignIn, SignOut, UserCircle, Envelope, ChatCircle, Gear, Storefront, ClockCounterClockwise } from '@phosphor-icons/react'
import { HeroSearch } from '@/components/HeroSearch'
import { ProfileCard } from '@/components/ProfileCard'
import { ProfileDetailDialog } from '@/components/ProfileDetailDialog'
import { RegistrationDialog } from '@/components/RegistrationDialog'
import { LoginDialog } from '@/components/LoginDialog'
import { MyMatches } from '@/components/MyMatches'
import { MyActivity } from '@/components/MyActivity'
import { Inbox } from '@/components/Inbox'
import { Chat } from '@/components/Chat'
import { MyProfile } from '@/components/MyProfile'
import { Settings } from '@/components/Settings'
import { WeddingServices } from '@/components/WeddingServicesPage'
import type { Profile, SearchFilters, WeddingService, BlockedProfile } from '@/types/profile'
import type { User } from '@/types/user'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { AdminPanel } from '@/components/AdminPanel'
import { AdminLoginDialog } from '@/components/AdminLoginDialog'
import { useTranslation, type Language } from '@/lib/translations'
import { toast } from 'sonner'
import { sampleWeddingServices, sampleProfiles, sampleUsers } from '@/lib/sampleData'

type View = 'home' | 'search-results' | 'admin' | 'my-matches' | 'my-activity' | 'inbox' | 'chat' | 'my-profile' | 'wedding-services'

function App() {
  const [profiles, setProfiles] = useKV<Profile[]>('profiles', [])
  const [users, setUsers] = useKV<User[]>('users', [])
  const [weddingServices, setWeddingServices] = useKV<WeddingService[]>('weddingServices', [])
  const [loggedInUser, setLoggedInUser] = useKV<string | null>('loggedInUser', null)
  const [blockedProfiles] = useKV<BlockedProfile[]>('blockedProfiles', [])
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  
  const [currentView, setCurrentView] = useState<View>('home')
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

  useEffect(() => {
    if ((!profiles || profiles.length === 0) && sampleProfiles.length > 0) {
      setProfiles(sampleProfiles)
    }
    if ((!users || users.length === 0) && sampleUsers.length > 0) {
      setUsers(sampleUsers)
    }
    if ((!weddingServices || weddingServices.length === 0) && sampleWeddingServices.length > 0) {
      setWeddingServices(sampleWeddingServices)
    }
  }, [])

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
  }, [profiles, searchFilters, currentUserProfile, blockedProfiles])

  const handleRegisterProfile = (profileData: Partial<Profile>) => {
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
      id,
      profileId: generatedProfileId,
      firstName,
      lastName,
      fullName: profileData.fullName || `${firstName} ${lastName}`,
      dateOfBirth: profileData.dateOfBirth || '',
      age: profileData.age || 0,
      gender: profileData.gender || 'male',
      religion: profileData.religion,
      caste: profileData.caste,
      community: profileData.community,
      motherTongue: profileData.motherTongue,
      education: profileData.education || '',
      occupation: profileData.occupation || '',
      salary: profileData.salary,
      location: profileData.location || '',
      country: profileData.country || '',
      maritalStatus: profileData.maritalStatus || 'never-married',
      email: profileData.email || '',
      mobile: profileData.mobile || '',
      relationToProfile: profileData.relationToProfile || 'Self',
      hideEmail: profileData.hideEmail || false,
      hideMobile: profileData.hideMobile || false,
      photos: profileData.photos || [],
      selfieUrl: profileData.selfieUrl,
      bio: profileData.bio,
      height: profileData.height,
      familyDetails: profileData.familyDetails,
      dietPreference: profileData.dietPreference,
      manglik: profileData.manglik,
      drinkingHabit: profileData.drinkingHabit,
      smokingHabit: profileData.smokingHabit,
      status: 'pending',
      trustLevel: 1,
      createdAt: new Date().toISOString(),
      membershipPlan: profileData.membershipPlan,
      membershipExpiry: profileData.membershipExpiry,
      emailVerified: false,
      mobileVerified: false,
      isBlocked: false
    }
    
    const newUser: User = {
      userId,
      password,
      profileId: id,
      createdAt: new Date().toISOString()
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
    if (keepLoggedIn) {
      setLoggedInUser(userId)
    } else {
      setLoggedInUser(userId)
    }
    
    // Update last login time for the profile
    setProfiles(current => {
      if (!current) return []
      return current.map(p => {
        if (p.profileId === profileId) {
          return { ...p, lastLoginAt: new Date().toISOString() }
        }
        return p
      })
    })
  }

  // Handle soft delete profile (hide from everyone but admin)
  const handleDeleteProfile = (profileId: string) => {
    setProfiles(current => {
      if (!current) return []
      return current.map(p => {
        if (p.profileId === profileId) {
          return { 
            ...p, 
            isDeleted: true, 
            deletedAt: new Date().toISOString(),
            deletedReason: 'User requested deletion'
          }
        }
        return p
      })
    })
    setLoggedInUser(null)
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
    toast.success(language === 'hi' ? 'लॉगआउट सफल' : 'Logged out successfully')
  }

  const t = {
    homeButton: language === 'hi' ? 'मुखपृष्ठ' : 'Home',
    register: language === 'hi' ? 'पंजीकरण करें' : 'Register',
    login: language === 'hi' ? 'लॉगिन करें' : 'Login',
    logout: language === 'hi' ? 'लॉगआउट' : 'Logout',
    adminButton: language === 'hi' ? 'एडमिन' : 'Admin',
    myMatches: language === 'hi' ? 'मेरे मैच' : 'My Matches',
    myActivity: language === 'hi' ? 'मेरी गतिविधि' : 'My Activity',
    inbox: language === 'hi' ? 'इनबॉक्स' : 'Inbox',
    chat: language === 'hi' ? 'चैट' : 'Chat',
    myProfile: language === 'hi' ? 'मेरी प्रोफाइल' : 'My Profile',
    settings: language === 'hi' ? 'सेटिंग्स' : 'Settings',
    weddingServices: language === 'hi' ? 'विवाह सेवाएं' : 'Wedding Services',
    searchResults: language === 'hi' ? 'खोज परिणाम' : 'Search Results',
    profilesFound: language === 'hi' ? 'प्रोफाइल मिली' : 'profiles found',
    newSearch: language === 'hi' ? 'नई खोज' : 'New Search',
    noProfiles: language === 'hi' ? 'कोई प्रोफाइल नहीं मिली। कृपया अपने खोज मानदंड बदलें या बाद में पुनः प्रयास करें।' : 'No profiles found. Please change your search criteria or try again later.',
    subtitle: language === 'hi' ? 'मॅट्रिमोनी सेवा' : 'Matrimony Service',
    footerText: language === 'hi' ? 'सभी समुदायों के लिए — विवाह एक पवित्र बंधन है।' : 'For all communities — Marriage is a sacred bond.',
    footerCopyright: language === 'hi' ? '© 2024 ShaadiPartnerSearch. एक निःस्वार्थ समुदाय सेवा।' : '© 2024 ShaadiPartnerSearch. A selfless community service.'
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Heart size={32} weight="fill" className="text-primary" />
              <div className="hidden sm:block">
                <div className="font-bold text-lg leading-tight">ShaadiPartnerSearch</div>
                <div className="text-xs text-muted-foreground">{t.subtitle}</div>
              </div>
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <Button
              variant={currentView === 'home' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('home')}
              className="gap-2"
            >
              <Heart size={20} weight="fill" />
              {t.homeButton}
            </Button>
            {loggedInUser && (
              <>
                <Button
                  variant={currentView === 'my-matches' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('my-matches')}
                  className="gap-2"
                >
                  <MagnifyingGlass size={20} />
                  {t.myMatches}
                </Button>
                <Button
                  variant={currentView === 'my-activity' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('my-activity')}
                  className="gap-2"
                >
                  <ClockCounterClockwise size={20} />
                  {t.myActivity}
                </Button>
                <Button
                  variant={currentView === 'inbox' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('inbox')}
                  className="gap-2"
                >
                  <Envelope size={20} />
                  {t.inbox}
                </Button>
                <Button
                  variant={currentView === 'chat' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('chat')}
                  className="gap-2"
                >
                  <ChatCircle size={20} />
                  {t.chat}
                </Button>
                <Button
                  variant={currentView === 'my-profile' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('my-profile')}
                  className="gap-2"
                >
                  <UserCircle size={20} />
                  {t.myProfile}
                </Button>
              </>
            )}
            <Button
              variant={currentView === 'wedding-services' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('wedding-services')}
              className="gap-2"
            >
              <Storefront size={20} />
              {t.weddingServices}
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
              className="gap-2"
            >
              <ShieldCheck size={20} weight="fill" />
              {t.adminButton}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              title={language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
              className="text-xl font-bold"
            >
              {language === 'hi' ? 'A' : 'अ'}
            </Button>
            {loggedInUser && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowSettings(true)}
                title={t.settings}
              >
                <Gear size={20} weight="bold" />
              </Button>
            )}
            {!loggedInUser ? (
              <>
                <Button onClick={() => setShowLogin(true)} variant="ghost" className="gap-2">
                  <SignIn size={20} weight="bold" />
                  {t.login}
                </Button>
                <Button onClick={() => setShowRegistration(true)} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <UserPlus size={20} weight="bold" />
                  {t.register}
                </Button>
              </>
            ) : (
              <Button onClick={handleLogout} variant="ghost" className="gap-2">
                <SignOut size={20} weight="bold" />
                {t.logout}
              </Button>
            )}
          </nav>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <List size={24} weight="bold" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-2 mt-8">
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
                      variant={currentView === 'inbox' ? 'default' : 'ghost'}
                      onClick={() => {
                        setCurrentView('inbox')
                        setMobileMenuOpen(false)
                      }}
                      className="justify-start gap-2"
                    >
                      <Envelope size={20} />
                      {t.inbox}
                    </Button>
                    <Button
                      variant={currentView === 'chat' ? 'default' : 'ghost'}
                      onClick={() => {
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

      <main className="flex-1">
        {currentView === 'home' && (
          <>
            <HeroSearch onSearch={handleSearch} language={language} />
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
                            {language === 'hi' ? '6 महीने के लिए ₹500 या 1 साल के लिए ₹900 — कोई छुपी लागत नहीं।' : '₹500 for 6 months or ₹900 for 1 year — no hidden costs.'}
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
                        onClick={() => setShowRegister(true)}
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
                      onViewProfile={setSelectedProfile}
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

        {currentView === 'admin' && <AdminPanel profiles={profiles} setProfiles={setProfiles} users={users} language={language} />}

        {currentView === 'my-matches' && (
          <MyMatches 
            loggedInUserId={currentUserProfile?.id || null}
            profiles={profiles || []}
            onViewProfile={setSelectedProfile}
            language={language}
          />
        )}

        {currentView === 'my-activity' && (
          <MyActivity 
            loggedInUserId={currentUserProfile?.id || null}
            profiles={profiles || []}
            language={language}
            onViewProfile={setSelectedProfile}
          />
        )}

        {currentView === 'inbox' && (
          <Inbox 
            loggedInUserId={currentUserProfile?.id || null}
            profiles={profiles || []}
            language={language}
            onNavigateToChat={() => setCurrentView('chat')}
          />
        )}

        {currentView === 'chat' && (
          <Chat 
            currentUserProfile={currentUserProfile}
            profiles={profiles || []}
            language={language}
            shouldBlur={currentMembershipStatus.shouldBlur}
            membershipPlan={currentUserProfile?.membershipPlan}
          />
        )}

        {currentView === 'my-profile' && (
          <MyProfile 
            profile={currentUserProfile}
            language={language}
            onEdit={currentUserProfile?.returnedForEdit ? handleEditProfile : undefined}
            onDeleteProfile={handleDeleteProfile}
          />
        )}

        {currentView === 'wedding-services' && (
          <WeddingServices 
            language={language} 
            shouldBlur={currentMembershipStatus.shouldBlur}
            membershipPlan={currentUserProfile?.membershipPlan}
          />
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
              variant={currentView === 'inbox' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('inbox')}
              className="flex-col h-auto py-2 px-1"
              size="sm"
            >
              <Envelope size={20} weight={currentView === 'inbox' ? 'fill' : 'regular'} />
              <span className="text-xs mt-1">{language === 'hi' ? '���नबॉक्स' : 'Inbox'}</span>
            </Button>
            <Button
              variant={currentView === 'chat' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('chat')}
              className="flex-col h-auto py-2 px-1"
              size="sm"
            >
              <ChatCircle size={20} weight={currentView === 'chat' ? 'fill' : 'regular'} />
              <span className="text-xs mt-1">{language === 'hi' ? 'चैट' : 'Chat'}</span>
            </Button>
          </div>
        </nav>
      )}

      <footer className="border-t bg-muted/30 py-8" style={{ marginBottom: loggedInUser ? '64px' : '0' }}>
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
      />

      <LoginDialog
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
        users={users || []}
        language={language}
      />

      {loggedInUser && currentUserProfile && (
        <Settings
          open={showSettings}
          onClose={() => setShowSettings(false)}
          profileId={currentUserProfile.profileId}
          language={language}
        />
      )}

      <AdminLoginDialog
        open={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLoginSuccess={() => {
          setIsAdminLoggedIn(true)
          setCurrentView('admin')
          toast.success(language === 'hi' ? 'एडमिन पैनल में आपका स्वागत है!' : 'Welcome to Admin Panel!')
        }}
        language={language}
      />

      <Toaster position="top-right" />
    </div>
  )
}

export default App