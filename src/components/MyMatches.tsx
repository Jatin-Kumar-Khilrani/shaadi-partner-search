import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useKV } from '@/hooks/useKV'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { MultiSelect, EDUCATION_OPTIONS, EMPLOYMENT_STATUS_OPTIONS, OCCUPATION_PROFESSION_OPTIONS, RELIGION_OPTIONS, MOTHER_TONGUE_OPTIONS, DIET_PREFERENCE_OPTIONS, DRINKING_HABIT_OPTIONS, SMOKING_HABIT_OPTIONS, getStateOptionsForCountries, getCityOptionsForStates } from '@/components/ui/multi-select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ProfileCard } from './ProfileCard'
import { MagnifyingGlass, Funnel, X, GraduationCap, Globe, Calendar, Trophy, Sparkle, Heart, Users } from '@phosphor-icons/react'
import type { Profile, SearchFilters, BlockedProfile, MembershipPlan, ProfileStatus, Interest, DeclinedProfile } from '@/types/profile'
import type { Language } from '@/lib/translations'

// Extended filters interface with additional fields
interface ExtendedFilters extends SearchFilters {
  educationLevels?: string[]
  employmentStatuses?: string[]
  occupationType?: string
  country?: string
  state?: string
  city?: string
  ageRange?: [number, number]
  hasReadinessBadge?: boolean
  isVerified?: boolean
  hasPhoto?: boolean
  disability?: string
}

interface MyMatchesProps {
  loggedInUserId: string | null
  profiles: Profile[]
  onViewProfile: (profile: Profile) => void
  language: Language
  membershipPlan?: MembershipPlan
  profileStatus?: ProfileStatus
}

export function MyMatches({ loggedInUserId, profiles, onViewProfile, language, membershipPlan, profileStatus }: MyMatchesProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ExtendedFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [blockedProfiles] = useKV<BlockedProfile[]>('blockedProfiles', [])
  const [interests, setInterests] = useKV<Interest[]>('interests', [])
  const [declinedProfiles, setDeclinedProfiles] = useKV<DeclinedProfile[]>('declinedProfiles', [])
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 60])
  const [usePartnerPreferences, setUsePartnerPreferences] = useState(true) // Smart matching toggle

  const currentUserProfile = profiles.find(p => p.id === loggedInUserId)
  
  // Free plan users or pending approval users should have restricted access
  const isFreePlan = membershipPlan === 'free' || !membershipPlan
  const isPendingApproval = profileStatus === 'pending'
  const shouldBlurProfiles = isFreePlan || isPendingApproval

  // Helper to get declined/blocked status for a profile
  const getProfileInteractionStatus = (profileId: string): { 
    isDeclinedByMe: boolean
    isDeclinedByThem: boolean
    isBlocked: boolean
    isBlockedByThem: boolean
  } => {
    if (!currentUserProfile) return { isDeclinedByMe: false, isDeclinedByThem: false, isBlocked: false, isBlockedByThem: false }
    
    // Check if I declined them
    const isDeclinedByMe = declinedProfiles?.some(
      d => d.declinerProfileId === currentUserProfile.profileId && 
           d.declinedProfileId === profileId &&
           !d.isReconsidered
    ) || false

    // Check if they declined me (from interest data)
    const isDeclinedByThem = interests?.some(
      i => i.fromProfileId === currentUserProfile.profileId && 
           i.toProfileId === profileId && 
           i.status === 'declined'
    ) || false

    // Check if I blocked them
    const isBlocked = blockedProfiles?.some(
      b => b.blockerProfileId === currentUserProfile.profileId && 
           b.blockedProfileId === profileId &&
           !b.isUnblocked
    ) || false

    // Check if they blocked me
    const isBlockedByThem = blockedProfiles?.some(
      b => b.blockedProfileId === currentUserProfile.profileId && 
           b.blockerProfileId === profileId &&
           !b.isUnblocked
    ) || false

    return { isDeclinedByMe, isDeclinedByThem, isBlocked, isBlockedByThem }
  }

  // Handler to reconsider a declined profile - synced with MyActivity logic
  const handleReconsiderProfile = (profileId: string) => {
    if (!currentUserProfile) return

    // Mark as reconsidered in declined profiles
    setDeclinedProfiles((current) =>
      (current || []).map(d =>
        d.declinerProfileId === currentUserProfile.profileId && d.declinedProfileId === profileId
          ? { ...d, isReconsidered: true, reconsideredAt: new Date().toISOString() }
          : d
      )
    )
    
    // Also remove the declined interest so user can receive new ones
    setInterests((current) =>
      (current || []).filter(i => 
        !(i.toProfileId === currentUserProfile.profileId && i.fromProfileId === profileId && i.status === 'declined')
      )
    )
    
    // Show success message
    toast.success(
      language === 'hi' ? 'प्रोफाइल पुनर्विचार की गई' : 'Profile reconsidered',
      {
        description: language === 'hi' 
          ? 'अब आप इस प्रोफाइल से रुचि प्राप्त कर सकते हैं'
          : 'You can now receive interest from this profile'
      }
    )
  }

  // Count active filters (don't count 'any' selections as active filters)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.caste) count++
    if (filters.religion) count++
    if (filters.motherTongue) count++
    if (filters.manglik !== undefined) count++
    if (filters.dietPreference) count++
    if (filters.drinkingHabit) count++
    if (filters.smokingHabit) count++
    // Don't count 'any' as active filter
    if (filters.educationLevels && filters.educationLevels.length > 0 && !(filters.educationLevels.length === 1 && filters.educationLevels[0] === 'any')) count++
    if (filters.employmentStatuses && filters.employmentStatuses.length > 0 && !(filters.employmentStatuses.length === 1 && filters.employmentStatuses[0] === 'any')) count++
    if (filters.occupationType) count++
    if (filters.country) count++
    if (filters.city) count++
    if (filters.hasReadinessBadge) count++
    if (filters.isVerified) count++
    if (filters.hasPhoto) count++
    if (filters.disability) count++
    if (filters.ageRange && (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 60)) count++
    return count
  }, [filters])

  const t = {
    title: language === 'hi' ? 'मेरे मैच' : 'My Matches',
    search: language === 'hi' ? 'नाम, स्थान या प्रोफाइल ID से खोजें' : 'Search by name, location or profile ID',
    newMatches: language === 'hi' ? 'नए मैच' : 'New Matches',
    filters: language === 'hi' ? 'फ़िल्टर' : 'Filters',
    applyFilters: language === 'hi' ? 'लागू करें' : 'Apply Filters',
    clearFilters: language === 'hi' ? 'साफ़ करें' : 'Clear All',
    
    // Basic filters
    religion: language === 'hi' ? 'धर्म' : 'Religion',
    caste: language === 'hi' ? 'जाति' : 'Caste',
    motherTongue: language === 'hi' ? 'मातृभाषा' : 'Mother Tongue',
    manglik: language === 'hi' ? 'मांगलिक' : 'Manglik',
    diet: language === 'hi' ? 'आहार' : 'Diet',
    drinking: language === 'hi' ? 'पीने की आदत' : 'Drinking',
    smoking: language === 'hi' ? 'धूम्रपान' : 'Smoking',
    
    // New enhanced filters
    education: language === 'hi' ? 'शिक्षा' : 'Education',
    occupation: language === 'hi' ? 'व्यवसाय' : 'Occupation',
    country: language === 'hi' ? 'देश' : 'Country',
    state: language === 'hi' ? 'राज्य' : 'State',
    city: language === 'hi' ? 'शहर' : 'City',
    ageRange: language === 'hi' ? 'आयु सीमा' : 'Age Range',
    readinessBadge: language === 'hi' ? 'तैयारी बैज' : 'Readiness Badge',
    verifiedOnly: language === 'hi' ? 'केवल सत्यापित' : 'Verified Only',
    withPhotoOnly: language === 'hi' ? 'फोटो वाले' : 'With Photo Only',
    
    // Values
    veg: language === 'hi' ? 'शाकाहारी' : 'Vegetarian',
    nonVeg: language === 'hi' ? 'मांसाहारी' : 'Non-Vegetarian',
    eggetarian: language === 'hi' ? 'अंडा खाने वाले' : 'Eggetarian',
    vegan: language === 'hi' ? 'वीगन' : 'Vegan',
    jain: language === 'hi' ? 'जैन' : 'Jain',
    never: language === 'hi' ? 'कभी नहीं' : 'Never',
    occasionally: language === 'hi' ? 'कभी-कभी' : 'Occasionally',
    regularly: language === 'hi' ? 'नियमित' : 'Regularly',
    yes: language === 'hi' ? 'हाँ' : 'Yes',
    no: language === 'hi' ? 'नहीं' : 'No',
    any: language === 'hi' ? 'कोई भी' : 'Any',
    
    // Education levels
    highSchool: language === 'hi' ? 'हाई स्कूल' : 'High School',
    graduate: language === 'hi' ? 'स्नातक' : 'Graduate',
    postGraduate: language === 'hi' ? 'परास्नातक' : 'Post Graduate',
    doctorate: language === 'hi' ? 'डॉक्टरेट' : 'Doctorate',
    professional: language === 'hi' ? 'प्रोफेशनल' : 'Professional (CA/CS/MBBS/LLB)',
    
    // Occupation types
    private: language === 'hi' ? 'प्राइवेट जॉब' : 'Private Job',
    government: language === 'hi' ? 'सरकारी नौकरी' : 'Government Job',
    business: language === 'hi' ? 'व्यापार' : 'Business',
    selfEmployed: language === 'hi' ? 'स्वरोजगार' : 'Self Employed',
    professional_occ: language === 'hi' ? 'प्रोफेशनल' : 'Professional',
    student: language === 'hi' ? 'छात्र' : 'Student',
    notWorking: language === 'hi' ? 'कार्यरत नहीं' : 'Not Working',
    
    // Countries
    india: language === 'hi' ? 'भारत' : 'India',
    usa: language === 'hi' ? 'अमेरिका' : 'USA',
    uk: language === 'hi' ? 'यूके' : 'UK',
    canada: language === 'hi' ? 'कनाडा' : 'Canada',
    australia: language === 'hi' ? 'ऑस्ट्रेलिया' : 'Australia',
    uae: language === 'hi' ? 'यूएई' : 'UAE',
    germany: language === 'hi' ? 'जर्मनी' : 'Germany',
    other: language === 'hi' ? 'अन्य' : 'Other',
    
    // Results
    matchesFound: language === 'hi' ? 'मैच मिले' : 'matches found',
    noMatches: language === 'hi' ? 'कोई मैच नहीं मिला' : 'No matches found',
    adjustFilters: language === 'hi' ? 'अपने फ़िल्टर समायोजित करें' : 'Try adjusting your filters',
    
    // Section headers
    basicFilters: language === 'hi' ? 'बुनियादी फ़िल्टर' : 'Basic Filters',
    educationCareer: language === 'hi' ? 'शिक्षा और करियर' : 'Education & Career',
    locationFilters: language === 'hi' ? 'स्थान' : 'Location',
    lifestyleFilters: language === 'hi' ? 'जीवनशैली' : 'Lifestyle',
    specialFilters: language === 'hi' ? 'विशेष फ़िल्टर' : 'Special Filters',
    years: language === 'hi' ? 'वर्ष' : 'years',
    
    // Disability
    disability: language === 'hi' ? 'दिव्यांग' : 'Differently Abled',
    disabilityNo: language === 'hi' ? 'नहीं' : 'No',
    disabilityYes: language === 'hi' ? 'हाँ' : 'Yes',
    
    // Smart Matching
    smartMatching: language === 'hi' ? 'स्मार्ट मैचिंग' : 'Smart Matching',
    smartMatchingDesc: language === 'hi' ? 'आपकी पार्टनर प्राथमिकताओं के आधार पर मैच दिखाएं' : 'Show matches based on your partner preferences',
    noPreferencesSet: language === 'hi' ? 'कोई पार्टनर प्राथमिकता सेट नहीं है' : 'No partner preferences set',
    preferencesApplied: language === 'hi' ? 'प्राथमिकताएं लागू' : 'Preferences applied',
  }

  const filteredProfiles = useMemo(() => {
    if (!profiles || !currentUserProfile) return []
    
    const prefs = currentUserProfile.partnerPreferences
    
    return profiles.filter(profile => {
      if (profile.id === currentUserProfile.id) return false
      
      if (profile.status !== 'verified') return false
      
      const isBlocked = blockedProfiles?.some(
        b => (b.blockerProfileId === currentUserProfile.profileId && b.blockedProfileId === profile.profileId) ||
             (b.blockedProfileId === currentUserProfile.profileId && b.blockerProfileId === profile.profileId)
      )
      if (isBlocked) return false
      
      if (currentUserProfile.gender === 'male' && profile.gender !== 'female') return false
      if (currentUserProfile.gender === 'female' && profile.gender !== 'male') return false
      
      // ============ PARTNER PREFERENCES BASED FILTERING ============
      // Apply partner preferences if enabled and preferences exist
      if (usePartnerPreferences && prefs) {
        // Age filter based on partner preferences
        if (prefs.ageMin && profile.age < prefs.ageMin) return false
        if (prefs.ageMax && profile.age > prefs.ageMax) return false
        
        // Height filter (convert height string to comparable value)
        if (prefs.heightMin || prefs.heightMax) {
          const profileHeight = profile.height?.replace(/[^0-9.]/g, '') || '0'
          const prefMinHeight = prefs.heightMin?.replace(/[^0-9.]/g, '') || '0'
          const prefMaxHeight = prefs.heightMax?.replace(/[^0-9.]/g, '') || '999'
          
          if (parseFloat(profileHeight) < parseFloat(prefMinHeight)) return false
          if (parseFloat(profileHeight) > parseFloat(prefMaxHeight)) return false
        }
        
        // Marital status filter
        if (prefs.maritalStatus && prefs.maritalStatus.length > 0) {
          if (!prefs.maritalStatus.includes(profile.maritalStatus)) return false
        }
        
        // Religion filter
        if (prefs.religion && prefs.religion.length > 0) {
          const profileReligion = profile.religion?.toLowerCase() || ''
          if (!prefs.religion.some(r => profileReligion.includes(r.toLowerCase()))) return false
        }
        
        // Caste filter
        if (prefs.caste && prefs.caste.length > 0) {
          const profileCaste = profile.caste?.toLowerCase() || ''
          if (!prefs.caste.some(c => profileCaste.includes(c.toLowerCase()))) return false
        }
        
        // Mother tongue filter
        if (prefs.motherTongue && prefs.motherTongue.length > 0) {
          const profileMotherTongue = profile.motherTongue?.toLowerCase() || ''
          if (!prefs.motherTongue.some(mt => profileMotherTongue.includes(mt.toLowerCase()))) return false
        }
        
        // Education filter
        if (prefs.education && prefs.education.length > 0) {
          const profileEducation = profile.education?.toLowerCase() || ''
          if (!prefs.education.some(edu => profileEducation.toLowerCase() === edu.toLowerCase())) return false
        }
        
        // Employment status filter
        if (prefs.employmentStatus && prefs.employmentStatus.length > 0) {
          const profileOccupation = profile.occupation?.toLowerCase() || ''
          if (!prefs.employmentStatus.some(emp => profileOccupation.includes(emp.toLowerCase()))) return false
        }
        
        // Occupation/Profession filter
        if (prefs.occupation && prefs.occupation.length > 0) {
          const profileOccupation = profile.occupation?.toLowerCase() || ''
          if (!prefs.occupation.some(occ => profileOccupation.toLowerCase() === occ.toLowerCase())) return false
        }
        
        // Living country filter
        if (prefs.livingCountry && prefs.livingCountry.length > 0) {
          const profileCountry = profile.country?.toLowerCase() || ''
          if (!prefs.livingCountry.some(c => profileCountry.includes(c.toLowerCase()))) return false
        }
        
        // Living state filter
        if (prefs.livingState && prefs.livingState.length > 0) {
          const profileState = profile.state?.toLowerCase() || ''
          if (!prefs.livingState.some(s => profileState.includes(s.toLowerCase()))) return false
        }
        
        // Location/City filter
        if (prefs.location && prefs.location.length > 0) {
          const profileLocation = profile.location?.toLowerCase() || ''
          if (!prefs.location.some(loc => profileLocation.includes(loc.toLowerCase()))) return false
        }
        
        // Diet preference filter
        if (prefs.dietPreference && prefs.dietPreference.length > 0) {
          if (!profile.dietPreference || !prefs.dietPreference.includes(profile.dietPreference)) return false
        }
        
        // Drinking habit filter
        if (prefs.drinkingHabit && prefs.drinkingHabit.length > 0) {
          if (!profile.drinkingHabit || !prefs.drinkingHabit.includes(profile.drinkingHabit)) return false
        }
        
        // Smoking habit filter
        if (prefs.smokingHabit && prefs.smokingHabit.length > 0) {
          if (!profile.smokingHabit || !prefs.smokingHabit.includes(profile.smokingHabit)) return false
        }
        
        // Manglik filter
        if (prefs.manglik && prefs.manglik !== 'doesnt-matter') {
          const prefManglik = prefs.manglik === 'yes'
          if (profile.manglik !== prefManglik) return false
        }
        
        // Disability filter
        if (prefs.disability && prefs.disability.length > 0) {
          if (!prefs.disability.includes(profile.disability)) return false
        }
      }
      // ============ END PARTNER PREFERENCES FILTERING ============
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!profile.fullName.toLowerCase().includes(query) &&
            !profile.location.toLowerCase().includes(query) &&
            !profile.profileId.toLowerCase().includes(query)) {
          return false
        }
      }
      
      // Basic filters (manual filters from filter panel)
      if (filters.caste && !profile.caste?.toLowerCase().includes(filters.caste.toLowerCase())) return false
      if (filters.community && !profile.community?.toLowerCase().includes(filters.community.toLowerCase())) return false
      if (filters.motherTongue && !profile.motherTongue?.toLowerCase().includes(filters.motherTongue.toLowerCase())) return false
      if (filters.manglik !== undefined && profile.manglik !== filters.manglik) return false
      if (filters.dietPreference && profile.dietPreference !== filters.dietPreference) return false
      if (filters.drinkingHabit && profile.drinkingHabit !== filters.drinkingHabit) return false
      if (filters.smokingHabit && profile.smokingHabit !== filters.smokingHabit) return false
      
      // Education filter - multi-select match with standardized values
      // Skip filter if 'any' is selected (means no preference)
      if (filters.educationLevels && filters.educationLevels.length > 0 && !(filters.educationLevels.length === 1 && filters.educationLevels[0] === 'any')) {
        const profileEducation = profile.education?.toLowerCase() || ''
        if (!filters.educationLevels.some(edu => profileEducation === edu.toLowerCase())) return false
      }
      
      // Employment status filter - multi-select match
      // Skip filter if 'any' is selected (means no preference)
      if (filters.employmentStatuses && filters.employmentStatuses.length > 0 && !(filters.employmentStatuses.length === 1 && filters.employmentStatuses[0] === 'any')) {
        const profileOccupation = profile.occupation?.toLowerCase() || ''
        if (!filters.employmentStatuses.some(emp => profileOccupation.includes(emp.toLowerCase()))) return false
      }
      
      // Occupation filter - exact match with standardized values
      if (filters.occupationType && filters.occupationType !== 'any') {
        if (profile.occupation !== filters.occupationType) return false
      }
      
      // Country filter
      if (filters.country) {
        const country = profile.country?.toLowerCase() || ''
        if (!country.includes(filters.country.toLowerCase())) return false
      }
      
      // City filter
      if (filters.city) {
        const location = profile.location?.toLowerCase() || ''
        if (!location.includes(filters.city.toLowerCase())) return false
      }
      
      // Age range filter
      if (filters.ageRange) {
        const age = profile.age
        if (age < filters.ageRange[0] || age > filters.ageRange[1]) return false
      }
      
      // Readiness badge filter
      if (filters.hasReadinessBadge && !profile.hasReadinessBadge) return false
      
      // Verified filter
      if (filters.isVerified && profile.status !== 'verified') return false
      
      // Photo filter
      if (filters.hasPhoto && (!profile.photos || profile.photos.length === 0)) return false
      
      // Disability filter
      if (filters.disability && filters.disability !== 'any') {
        if (profile.disability !== filters.disability) return false
      }
      
      return true
    })
  }, [profiles, currentUserProfile, searchQuery, filters, blockedProfiles, usePartnerPreferences])

  const hasPartnerPreferences = currentUserProfile?.partnerPreferences && 
    (currentUserProfile.partnerPreferences.ageMin || 
     currentUserProfile.partnerPreferences.ageMax ||
     currentUserProfile.partnerPreferences.education?.length ||
     currentUserProfile.partnerPreferences.caste?.length ||
     currentUserProfile.partnerPreferences.motherTongue?.length ||
     currentUserProfile.partnerPreferences.religion?.length ||
     currentUserProfile.partnerPreferences.livingCountry?.length ||
     currentUserProfile.partnerPreferences.dietPreference?.length)

  const FilterPanel = () => (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-5 pr-4 pb-4">
        {/* Smart Matching Toggle */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Sparkle size={18} className="text-primary" weight="fill" />
              </div>
              <Label className="font-semibold text-base">{t.smartMatching}</Label>
            </div>
            <Switch
              checked={usePartnerPreferences}
              onCheckedChange={setUsePartnerPreferences}
              disabled={!hasPartnerPreferences}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3 ml-11">
            {hasPartnerPreferences ? t.smartMatchingDesc : t.noPreferencesSet}
          </p>
          {hasPartnerPreferences && usePartnerPreferences && (
            <Badge variant="secondary" className="mt-3 ml-11 text-xs bg-primary/10 text-primary border-primary/20">
              <Sparkle size={12} className="mr-1" weight="fill" />
              {t.preferencesApplied}
            </Badge>
          )}
        </div>

        {/* Age Range */}
        <div className="p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-background rounded-lg border">
              <Calendar size={16} className="text-primary" />
            </div>
            <Label className="font-semibold">{t.ageRange}</Label>
          </div>
          <div className="px-1">
            <Slider
              value={ageRange}
              onValueChange={(value) => {
                setAgeRange(value as [number, number])
                setFilters({ ...filters, ageRange: value as [number, number] })
              }}
              min={18}
              max={60}
              step={1}
              className="my-2"
            />
            <div className="flex justify-between mt-3 text-sm">
              <span className="px-2 py-1 bg-background rounded-md border font-medium">{ageRange[0]} {t.years}</span>
              <span className="px-2 py-1 bg-background rounded-md border font-medium">{ageRange[1]} {t.years}</span>
            </div>
          </div>
        </div>

        {/* Education & Career */}
        <div className="p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-background rounded-lg border">
              <GraduationCap size={16} className="text-primary" />
            </div>
            <h4 className="font-semibold">{t.educationCareer}</h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.education}</Label>
              <MultiSelect
                options={EDUCATION_OPTIONS}
                value={filters.educationLevels || []}
                onValueChange={(val) => setFilters({ ...filters, educationLevels: val.length > 0 ? val : undefined })}
                placeholder={t.any}
                searchPlaceholder={language === 'hi' ? 'शिक्षा खोजें...' : 'Search education...'}
                emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
                showAnyOption
                anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{language === 'hi' ? 'रोजगार स्थिति' : 'Employment Status'}</Label>
              <MultiSelect
                options={EMPLOYMENT_STATUS_OPTIONS}
                value={filters.employmentStatuses || []}
                onValueChange={(val) => setFilters({ ...filters, employmentStatuses: val.length > 0 ? val : undefined })}
                placeholder={t.any}
                searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
                showAnyOption
                anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.occupation}</Label>
              <SearchableSelect
                options={[{ value: 'any', label: t.any }, ...OCCUPATION_PROFESSION_OPTIONS]}
                value={filters.occupationType || 'any'}
                onValueChange={(val) => setFilters({ ...filters, occupationType: val === 'any' ? undefined : val })}
                placeholder={t.any}
                searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-background rounded-lg border">
              <Globe size={16} className="text-primary" />
            </div>
            <h4 className="font-semibold">{t.locationFilters}</h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.country}</Label>
              <Select 
                value={filters.country || ''} 
                onValueChange={(val) => setFilters({ ...filters, country: val || undefined, state: undefined, city: undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.any} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t.any}</SelectItem>
                  <SelectItem value="india">{t.india}</SelectItem>
                  <SelectItem value="usa">{t.usa}</SelectItem>
                  <SelectItem value="uk">{t.uk}</SelectItem>
                  <SelectItem value="canada">{t.canada}</SelectItem>
                  <SelectItem value="australia">{t.australia}</SelectItem>
                  <SelectItem value="uae">{t.uae}</SelectItem>
                  <SelectItem value="germany">{t.germany}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filters.country && filters.country !== 'any' && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">{t.state}</Label>
                <Select 
                  value={filters.state || ''} 
                  onValueChange={(val) => setFilters({ ...filters, state: val || undefined, city: undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.any} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">{t.any}</SelectItem>
                    {getStateOptionsForCountries([filters.country]).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filters.state && filters.state !== 'any' && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">{t.city}</Label>
                <Select 
                  value={filters.city || ''} 
                  onValueChange={(val) => setFilters({ ...filters, city: val || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.any} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">{t.any}</SelectItem>
                    {getCityOptionsForStates([filters.state]).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Religion & Caste */}
        <div className="p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-background rounded-lg border">
              <Users size={16} className="text-primary" />
            </div>
            <h4 className="font-semibold">{t.basicFilters}</h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.religion}</Label>
              <Select 
                value={filters.religion || ''} 
                onValueChange={(val) => setFilters({ ...filters, religion: val === 'any' ? undefined : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.any} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t.any}</SelectItem>
                  {RELIGION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.caste}</Label>
              <Input 
                placeholder={t.caste}
                value={filters.caste || ''}
                onChange={(e) => setFilters({ ...filters, caste: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.motherTongue}</Label>
              <Select 
                value={filters.motherTongue || ''} 
                onValueChange={(val) => setFilters({ ...filters, motherTongue: val === 'any' ? undefined : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.any} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t.any}</SelectItem>
                  {MOTHER_TONGUE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.manglik}</Label>
              <Select 
                value={filters.manglik !== undefined ? (filters.manglik ? 'yes' : 'no') : ''} 
                onValueChange={(val) => {
                  if (val === 'any') {
                    const { manglik: _manglik, ...rest } = filters
                    setFilters(rest)
                  } else {
                    setFilters({ ...filters, manglik: val === 'yes' })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.any} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t.any}</SelectItem>
                  <SelectItem value="yes">{t.yes}</SelectItem>
                  <SelectItem value="no">{t.no}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Lifestyle */}
        <div className="p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-background rounded-lg border">
              <Heart size={16} className="text-primary" />
            </div>
            <h4 className="font-semibold">{t.lifestyleFilters}</h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.diet}</Label>
              <Select 
                value={filters.dietPreference || ''} 
                onValueChange={(val: string) => {
                  if (val === 'any') {
                    const { dietPreference: _dietPreference, ...rest } = filters
                    setFilters(rest)
                  } else {
                    setFilters({ ...filters, dietPreference: val })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.any} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t.any}</SelectItem>
                  {DIET_PREFERENCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.drinking}</Label>
              <Select 
                value={filters.drinkingHabit || ''} 
                onValueChange={(val: string) => {
                  if (val === 'any') {
                    const { drinkingHabit: _drinkingHabit, ...rest } = filters
                    setFilters(rest)
                  } else {
                    setFilters({ ...filters, drinkingHabit: val })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.any} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t.any}</SelectItem>
                  {DRINKING_HABIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.smoking}</Label>
              <Select 
                value={filters.smokingHabit || ''} 
                onValueChange={(val: string) => {
                  if (val === 'any') {
                    const { smokingHabit: _smokingHabit, ...rest } = filters
                    setFilters(rest)
                  } else {
                    setFilters({ ...filters, smokingHabit: val })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.any} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t.any}</SelectItem>
                  {SMOKING_HABIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Disability Filter */}
        <div className="p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-background rounded-lg border">
              <Users size={16} className="text-primary" />
            </div>
            <h4 className="font-semibold">{t.disability}</h4>
          </div>
          
          <Select
            value={filters.disability || ''}
            onValueChange={(value) => setFilters({ ...filters, disability: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t.any} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t.any}</SelectItem>
              <SelectItem value="no">{t.disabilityNo}</SelectItem>
              <SelectItem value="yes">{t.disabilityYes}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Special Filters */}
        <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-200/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-background rounded-lg border border-amber-200">
              <Trophy size={16} className="text-amber-600" />
            </div>
            <h4 className="font-semibold">{t.specialFilters}</h4>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-background/80 rounded-lg border cursor-pointer hover:bg-background transition-colors">
              <Checkbox 
                id="readinessBadge"
                checked={filters.hasReadinessBadge || false}
                onCheckedChange={(checked) => setFilters({ ...filters, hasReadinessBadge: !!checked })}
              />
              <span className="text-sm flex-1">{t.readinessBadge}</span>
              <span className="text-lg">⭐</span>
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-background/80 rounded-lg border cursor-pointer hover:bg-background transition-colors">
              <Checkbox 
                id="verified"
                checked={filters.isVerified || false}
                onCheckedChange={(checked) => setFilters({ ...filters, isVerified: !!checked })}
              />
              <span className="text-sm flex-1">{t.verifiedOnly}</span>
              <span className="text-lg">✓</span>
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-background/80 rounded-lg border cursor-pointer hover:bg-background transition-colors">
              <Checkbox 
                id="hasPhoto"
                checked={filters.hasPhoto || false}
                onCheckedChange={(checked) => setFilters({ ...filters, hasPhoto: !!checked })}
              />
              <span className="text-sm flex-1">{t.withPhotoOnly}</span>
              <span className="text-lg">📷</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 sticky bottom-0 bg-background pt-4 pb-2 border-t mt-2">
          <Button onClick={() => setShowFilters(false)} className="flex-1 h-11 text-base font-medium">
            {t.applyFilters}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setFilters({})
              setAgeRange([18, 60])
            }} 
            className="flex-1 h-11 text-base"
          >
            <X size={16} className="mr-2" />
            {t.clearFilters}
          </Button>
        </div>
      </div>
    </ScrollArea>
  )

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2 relative">
                <Funnel size={20} />
                {t.filters}
                {activeFilterCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[350px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Funnel size={20} />
                  {t.filters}
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary">{activeFilterCount} active</Badge>
                  )}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterPanel />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              {filteredProfiles.length} {t.matchesFound}
            </span>
            {hasPartnerPreferences && usePartnerPreferences && (
              <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
                <Sparkle size={12} className="mr-1 text-primary" weight="fill" />
                {t.smartMatching}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasPartnerPreferences && (
              <Button
                variant={usePartnerPreferences ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setUsePartnerPreferences(!usePartnerPreferences)}
                className="text-xs"
              >
                <Sparkle size={14} className={usePartnerPreferences ? "text-primary mr-1" : "mr-1"} weight={usePartnerPreferences ? "fill" : "regular"} />
                {t.smartMatching}
              </Button>
            )}
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setFilters({})
                  setAgeRange([18, 60])
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} className="mr-1" />
                {t.clearFilters}
              </Button>
            )}
          </div>
        </div>

        {filteredProfiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">{t.noMatches}</p>
              <p className="text-muted-foreground text-sm mt-2">{t.adjustFilters}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => {
              const status = getProfileInteractionStatus(profile.profileId)
              return (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onViewProfile={onViewProfile}
                  language={language}
                  isLoggedIn={true}
                  shouldBlur={shouldBlurProfiles}
                  membershipPlan={membershipPlan}
                  isDeclinedByMe={status.isDeclinedByMe}
                  isDeclinedByThem={status.isDeclinedByThem}
                  onReconsider={handleReconsiderProfile}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
