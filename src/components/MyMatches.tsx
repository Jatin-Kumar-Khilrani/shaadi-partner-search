import { useState, useMemo } from 'react'
import { useKV } from '@/hooks/useKV'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect, OCCUPATION_OPTIONS } from '@/components/ui/searchable-select'
import { MultiSelect, EDUCATION_OPTIONS, EMPLOYMENT_STATUS_OPTIONS } from '@/components/ui/multi-select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ProfileCard } from './ProfileCard'
import { MagnifyingGlass, Funnel, X, GraduationCap, Briefcase, MapPin, Globe, Calendar, Trophy, Sparkle } from '@phosphor-icons/react'
import type { Profile, SearchFilters, BlockedProfile, MembershipPlan, ProfileStatus } from '@/types/profile'
import type { Language } from '@/lib/translations'

// Extended filters interface with additional fields
interface ExtendedFilters extends SearchFilters {
  educationLevels?: string[]
  employmentStatuses?: string[]
  occupationType?: string
  country?: string
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
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 60])
  const [usePartnerPreferences, setUsePartnerPreferences] = useState(true) // Smart matching toggle

  const currentUserProfile = profiles.find(p => p.id === loggedInUserId)
  
  // Free plan users or pending approval users should have restricted access
  const isFreePlan = membershipPlan === 'free' || !membershipPlan
  const isPendingApproval = profileStatus === 'pending'
  const shouldBlurProfiles = isFreePlan || isPendingApproval

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.caste) count++
    if (filters.community) count++
    if (filters.motherTongue) count++
    if (filters.manglik !== undefined) count++
    if (filters.dietPreference) count++
    if (filters.drinkingHabit) count++
    if (filters.smokingHabit) count++
    if (filters.educationLevels && filters.educationLevels.length > 0) count++
    if (filters.employmentStatuses && filters.employmentStatuses.length > 0) count++
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
    caste: language === 'hi' ? 'जाति' : 'Caste',
    community: language === 'hi' ? 'समुदाय' : 'Community',
    motherTongue: language === 'hi' ? 'मातृभाषा' : 'Mother Tongue',
    manglik: language === 'hi' ? 'मांगलिक' : 'Manglik',
    diet: language === 'hi' ? 'आहार' : 'Diet',
    drinking: language === 'hi' ? 'पीने की आदत' : 'Drinking',
    smoking: language === 'hi' ? 'धूम्रपान' : 'Smoking',
    
    // New enhanced filters
    education: language === 'hi' ? 'शिक्षा' : 'Education',
    occupation: language === 'hi' ? 'रोजगार स्थिति' : 'Employment Status',
    country: language === 'hi' ? 'देश' : 'Country',
    city: language === 'hi' ? 'शहर' : 'City',
    ageRange: language === 'hi' ? 'आयु सीमा' : 'Age Range',
    readinessBadge: language === 'hi' ? 'तैयारी बैज' : 'Readiness Badge',
    verifiedOnly: language === 'hi' ? 'केवल सत्यापित' : 'Verified Only',
    withPhotoOnly: language === 'hi' ? 'फोटो वाले' : 'With Photo Only',
    
    // Values
    veg: language === 'hi' ? 'शाकाहारी' : 'Vegetarian',
    nonVeg: language === 'hi' ? 'मांसाहारी' : 'Non-Vegetarian',
    eggetarian: language === 'hi' ? 'अंडा खाने वाले' : 'Eggetarian',
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
      if (filters.educationLevels && filters.educationLevels.length > 0) {
        const profileEducation = profile.education?.toLowerCase() || ''
        if (!filters.educationLevels.some(edu => profileEducation === edu.toLowerCase())) return false
      }
      
      // Employment status filter - multi-select match
      if (filters.employmentStatuses && filters.employmentStatuses.length > 0) {
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
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-6 pr-4">
        {/* Smart Matching Toggle */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkle size={18} className="text-primary" weight="fill" />
              <Label className="font-medium">{t.smartMatching}</Label>
            </div>
            <Switch
              checked={usePartnerPreferences}
              onCheckedChange={setUsePartnerPreferences}
              disabled={!hasPartnerPreferences}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {hasPartnerPreferences ? t.smartMatchingDesc : t.noPreferencesSet}
          </p>
          {hasPartnerPreferences && usePartnerPreferences && (
            <Badge variant="secondary" className="mt-2 text-xs">
              <Sparkle size={12} className="mr-1" weight="fill" />
              {t.preferencesApplied}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Age Range */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <Label className="font-medium">{t.ageRange}</Label>
          </div>
          <div className="px-2">
            <Slider
              value={ageRange}
              onValueChange={(value) => {
                setAgeRange(value as [number, number])
                setFilters({ ...filters, ageRange: value as [number, number] })
              }}
              min={18}
              max={60}
              step={1}
            />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{ageRange[0]} {t.years}</span>
              <span>{ageRange[1]} {t.years}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Education & Career */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <GraduationCap size={16} />
            {t.educationCareer}
          </h4>
          
          <div className="space-y-2">
            <Label>{t.education} {language === 'hi' ? '(एक से अधिक चुनें)' : '(select multiple)'}</Label>
            <MultiSelect
              options={EDUCATION_OPTIONS}
              value={filters.educationLevels || []}
              onValueChange={(val) => setFilters({ ...filters, educationLevels: val.length > 0 ? val : undefined })}
              placeholder={t.any}
              searchPlaceholder={language === 'hi' ? 'शिक्षा खोजें...' : 'Search education...'}
              emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
            />
          </div>

          <div className="space-y-2">
            <Label>{language === 'hi' ? 'रोजगार स्थिति' : 'Employment Status'} {language === 'hi' ? '(एक से अधिक चुनें)' : '(select multiple)'}</Label>
            <MultiSelect
              options={EMPLOYMENT_STATUS_OPTIONS}
              value={filters.employmentStatuses || []}
              onValueChange={(val) => setFilters({ ...filters, employmentStatuses: val.length > 0 ? val : undefined })}
              placeholder={t.any}
              searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
              emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.occupation}</Label>
            <SearchableSelect
              options={[{ value: 'any', label: t.any }, ...OCCUPATION_OPTIONS]}
              value={filters.occupationType || 'any'}
              onValueChange={(val) => setFilters({ ...filters, occupationType: val === 'any' ? undefined : val })}
              placeholder={t.any}
              searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
              emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
            />
          </div>
        </div>

        <Separator />

        {/* Location */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Globe size={16} />
            {t.locationFilters}
          </h4>
          
          <div className="space-y-2">
            <Label>{t.country}</Label>
            <Select 
              value={filters.country || ''} 
              onValueChange={(val) => setFilters({ ...filters, country: val || undefined })}
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

          <div className="space-y-2">
            <Label>{t.city}</Label>
            <Input 
              placeholder={t.city}
              value={filters.city || ''}
              onChange={(e) => setFilters({ ...filters, city: e.target.value || undefined })}
            />
          </div>
        </div>

        <Separator />

        {/* Community & Religion */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">{t.basicFilters}</h4>
          
          <div className="space-y-2">
            <Label>{t.caste}</Label>
            <Input 
              placeholder={t.caste}
              value={filters.caste || ''}
              onChange={(e) => setFilters({ ...filters, caste: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.community}</Label>
            <Input 
              placeholder={t.community}
              value={filters.community || ''}
              onChange={(e) => setFilters({ ...filters, community: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.motherTongue}</Label>
            <Input 
              placeholder={t.motherTongue}
              value={filters.motherTongue || ''}
              onChange={(e) => setFilters({ ...filters, motherTongue: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.manglik}</Label>
            <Select 
              value={filters.manglik !== undefined ? (filters.manglik ? 'yes' : 'no') : ''} 
              onValueChange={(val) => {
                if (val === 'any') {
                  const { manglik, ...rest } = filters
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

        <Separator />

        {/* Lifestyle */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">{t.lifestyleFilters}</h4>
          
          <div className="space-y-2">
            <Label>{t.diet}</Label>
            <Select 
              value={filters.dietPreference || ''} 
              onValueChange={(val: any) => {
                if (val === 'any') {
                  const { dietPreference, ...rest } = filters
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
                <SelectItem value="veg">{t.veg}</SelectItem>
                <SelectItem value="non-veg">{t.nonVeg}</SelectItem>
                <SelectItem value="eggetarian">{t.eggetarian}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t.drinking}</Label>
            <Select 
              value={filters.drinkingHabit || ''} 
              onValueChange={(val: any) => {
                if (val === 'any') {
                  const { drinkingHabit, ...rest } = filters
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
                <SelectItem value="never">{t.never}</SelectItem>
                <SelectItem value="occasionally">{t.occasionally}</SelectItem>
                <SelectItem value="regularly">{t.regularly}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t.smoking}</Label>
            <Select 
              value={filters.smokingHabit || ''} 
              onValueChange={(val: any) => {
                if (val === 'any') {
                  const { smokingHabit, ...rest } = filters
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
                <SelectItem value="never">{t.never}</SelectItem>
                <SelectItem value="occasionally">{t.occasionally}</SelectItem>
                <SelectItem value="regularly">{t.regularly}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Disability Filter */}
        <div className="space-y-3">
          <Label className="font-medium">{t.disability}</Label>
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

        <Separator />

        {/* Special Filters */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Trophy size={16} />
            {t.specialFilters}
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="readinessBadge"
                checked={filters.hasReadinessBadge || false}
                onCheckedChange={(checked) => setFilters({ ...filters, hasReadinessBadge: !!checked })}
              />
              <Label htmlFor="readinessBadge" className="text-sm cursor-pointer">
                {t.readinessBadge} ⭐
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="verified"
                checked={filters.isVerified || false}
                onCheckedChange={(checked) => setFilters({ ...filters, isVerified: !!checked })}
              />
              <Label htmlFor="verified" className="text-sm cursor-pointer">
                {t.verifiedOnly} ✓
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="hasPhoto"
                checked={filters.hasPhoto || false}
                onCheckedChange={(checked) => setFilters({ ...filters, hasPhoto: !!checked })}
              />
              <Label htmlFor="hasPhoto" className="text-sm cursor-pointer">
                {t.withPhotoOnly} 📷
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2 sticky bottom-0 bg-background pt-2">
          <Button onClick={() => setShowFilters(false)} className="flex-1">
            {t.applyFilters}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setFilters({})
              setAgeRange([18, 60])
            }} 
            className="flex-1"
          >
            <X size={16} className="mr-1" />
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
            {filteredProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onViewProfile={onViewProfile}
                language={language}
                isLoggedIn={true}
                shouldBlur={shouldBlurProfiles}
                membershipPlan={membershipPlan}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
