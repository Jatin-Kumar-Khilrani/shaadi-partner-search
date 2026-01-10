import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useKV } from '@/hooks/useKV'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { MultiSelect, EDUCATION_OPTIONS, EMPLOYMENT_STATUS_OPTIONS, OCCUPATION_PROFESSION_OPTIONS, RELIGION_OPTIONS, MOTHER_TONGUE_OPTIONS, DIET_PREFERENCE_OPTIONS, DRINKING_HABIT_OPTIONS, SMOKING_HABIT_OPTIONS, getStateOptionsForCountries, getCityOptionsForStates, COUNTRY_OPTIONS } from '@/components/ui/multi-select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ProfileCard } from './ProfileCard'
import { MagnifyingGlass, Funnel, X, GraduationCap, Globe, Calendar, Trophy, Sparkle, Heart, Users, FloppyDisk, ArrowCounterClockwise, SortAscending, CaretLeft, CaretRight, CircleNotch, CurrencyInr, Camera, Clock, UserCheck, Lightning, Eye, Info, WarningCircle, ArrowRight } from '@phosphor-icons/react'
import type { Profile, SearchFilters, BlockedProfile, MembershipPlan, ProfileStatus, Interest, DeclinedProfile, DietPreference, DrinkingHabit, SmokingHabit, ContactRequest } from '@/types/profile'
import type { ProfileInteractionStatus } from './ProfileCard'
import type { Language } from '@/lib/translations'

// Extended filters interface with additional fields - now with multi-select support
interface ExtendedFilters extends SearchFilters {
  educationLevels?: string[]
  employmentStatuses?: string[]
  occupations?: string[]           // Changed to array for multi-select
  countries?: string[]             // Changed to array for multi-select
  states?: string[]                // Changed to array for multi-select
  cities?: string[]                // Changed to array for multi-select
  motherTongues?: string[]         // Changed to array for multi-select
  religions?: string[]             // Changed to array for multi-select
  dietPreferences?: DietPreference[] // Changed to array for multi-select
  ageRange?: [number, number]
  hasReadinessBadge?: boolean
  isVerified?: boolean
  hasPhoto?: boolean
  disability?: string
  hideDeclinedProfiles?: boolean   // Option to hide profiles user has declined
  // New filters
  recentlyJoined?: '7days' | '15days' | '30days'  // Filter by join date
  lastActive?: '7days' | '30days' | '60days' | '90days'  // Filter by last activity
  incomeRange?: [number, number]   // Annual income range in lakhs
  profileCompleteness?: number     // Minimum profile completion percentage (e.g., 80, 90)
  heightRange?: [number, number]   // Height in cm for numeric comparison
  // Quick filters
  hasNewPhoto?: boolean            // Photos uploaded in last 30 days
  onlineRecently?: boolean         // Active in last 24 hours
}

interface MyMatchesProps {
  loggedInUserId: string | null
  profiles: Profile[]
  onViewProfile: (profile: Profile) => void
  language: Language
  membershipPlan?: MembershipPlan
  profileStatus?: ProfileStatus
  onUpgrade?: () => void
  currentUserProfile?: Profile | null  // For match percentage calculation
}

// Local storage key for saved filter drafts
const FILTER_DRAFT_KEY = 'myMatches_filterDraft'

// Sort options for profiles
type SortOption = 'newest' | 'age-asc' | 'age-desc' | 'name-asc' | 'compatibility'

export function MyMatches({ loggedInUserId, profiles, onViewProfile, language, membershipPlan, profileStatus, onUpgrade, currentUserProfile }: MyMatchesProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFiltersInternal] = useState<ExtendedFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const filterScrollRef = useRef<HTMLDivElement>(null)
  
  // Wrapper for setFilters that preserves scroll position
  const setFilters = useCallback((newFilters: ExtendedFilters | ((prev: ExtendedFilters) => ExtendedFilters)) => {
    const scrollTop = filterScrollRef.current?.scrollTop ?? 0
    setFiltersInternal(newFilters)
    // Restore scroll position after React re-renders
    requestAnimationFrame(() => {
      if (filterScrollRef.current) {
        filterScrollRef.current.scrollTop = scrollTop
      }
    })
  }, [])
  
  const [blockedProfiles] = useKV<BlockedProfile[]>('blockedProfiles', [])
  const [interests, setInterests] = useKV<Interest[]>('interests', [])
  const [contactRequests] = useKV<ContactRequest[]>('contactRequests', [])
  const [declinedProfiles, setDeclinedProfiles] = useKV<DeclinedProfile[]>('declinedProfiles', [])
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 60])
  const [usePartnerPreferences, setUsePartnerPreferences] = useState(true) // Smart matching toggle
  const [hasSavedDraft, setHasSavedDraft] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFiltering, setIsFiltering] = useState(false)
  const [incomeRange, setIncomeRange] = useState<[number, number]>([0, 100]) // 0-100 lakhs
  const [heightRange, setHeightRange] = useState<[number, number]>([140, 200]) // cm
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('') // Debounced for performance
  const [jumpToPage, setJumpToPage] = useState('') // For jumping to specific page
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const PROFILES_PER_PAGE = 20

  // Debounce search query for better performance with large datasets
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300) // 300ms debounce
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [searchQuery])

  const prefs = currentUserProfile?.partnerPreferences
  
  // Free plan users or pending approval users should have restricted access
  const isFreePlan = membershipPlan === 'free' || !membershipPlan
  const isPendingApproval = profileStatus === 'pending'
  const shouldBlurProfiles = isFreePlan || isPendingApproval

  // Check if there's a saved filter draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(FILTER_DRAFT_KEY)
    setHasSavedDraft(!!saved)
  }, [])

  // Populate filters from partner preferences when Smart Matching is enabled
  const populateFiltersFromPreferences = useCallback(() => {
    if (!prefs) return

    const newFilters: ExtendedFilters = {}
    
    // Age range
    if (prefs.ageMin || prefs.ageMax) {
      const minAge = prefs.ageMin || 18
      const maxAge = prefs.ageMax || 60
      newFilters.ageRange = [minAge, maxAge]
      setAgeRange([minAge, maxAge])
    }
    
    // Education
    if (prefs.education && prefs.education.length > 0) {
      newFilters.educationLevels = prefs.education
    }
    
    // Employment status
    if (prefs.employmentStatus && prefs.employmentStatus.length > 0) {
      newFilters.employmentStatuses = prefs.employmentStatus
    }
    
    // Occupation
    if (prefs.occupation && prefs.occupation.length > 0) {
      newFilters.occupations = prefs.occupation
    }
    
    // Country
    if (prefs.livingCountry && prefs.livingCountry.length > 0) {
      newFilters.countries = prefs.livingCountry
    }
    
    // State
    if (prefs.livingState && prefs.livingState.length > 0) {
      newFilters.states = prefs.livingState
    }
    
    // City/Location
    if (prefs.location && prefs.location.length > 0) {
      newFilters.cities = prefs.location
    }
    
    // Religion - now multi-select
    if (prefs.religion && prefs.religion.length > 0) {
      newFilters.religions = prefs.religion
    }
    
    // Mother Tongue - now multi-select
    if (prefs.motherTongue && prefs.motherTongue.length > 0) {
      newFilters.motherTongues = prefs.motherTongue
    }
    
    // Diet Preference - now multi-select
    if (prefs.dietPreference && prefs.dietPreference.length > 0) {
      newFilters.dietPreferences = prefs.dietPreference
    }
    
    // Drinking Habit
    if (prefs.drinkingHabit && prefs.drinkingHabit.length > 0) {
      newFilters.drinkingHabit = prefs.drinkingHabit[0]
    }
    
    // Smoking Habit
    if (prefs.smokingHabit && prefs.smokingHabit.length > 0) {
      newFilters.smokingHabit = prefs.smokingHabit[0]
    }
    
    // Manglik
    if (prefs.manglik && prefs.manglik !== 'doesnt-matter') {
      newFilters.manglik = prefs.manglik === 'yes'
    }
    
    // Caste
    if (prefs.caste && prefs.caste.length > 0) {
      newFilters.caste = prefs.caste.join(', ')
    }
    
    setFilters(newFilters)
  }, [prefs])

  // Auto-populate filters when Smart Matching is turned ON, clear when turned OFF
  useEffect(() => {
    if (usePartnerPreferences && prefs) {
      populateFiltersFromPreferences()
    } else if (!usePartnerPreferences) {
      // Clear filters when smart matching is turned off
      setFilters({})
      setAgeRange([18, 60])
    }
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [usePartnerPreferences, prefs, populateFiltersFromPreferences])

  // Save current filters as draft (includes smart matching preference and all range filters)
  const saveFilterDraft = useCallback(() => {
    const draft = { 
      filters, 
      ageRange, 
      incomeRange, 
      heightRange, 
      usePartnerPreferences,
      version: 2 // Version for future compatibility
    }
    localStorage.setItem(FILTER_DRAFT_KEY, JSON.stringify(draft))
    setHasSavedDraft(true)
    toast.success(
      language === 'hi' ? 'फ़िल्टर सहेजा गया' : 'Filters saved',
      { description: language === 'hi' ? 'आपके फ़िल्टर ड्राफ्ट के रूप में सहेजे गए' : 'Your filters have been saved as draft' }
    )
  }, [filters, ageRange, incomeRange, heightRange, usePartnerPreferences, language])

  // Load saved filter draft
  const loadFilterDraft = useCallback(() => {
    const saved = localStorage.getItem(FILTER_DRAFT_KEY)
    if (saved) {
      try {
        const draft = JSON.parse(saved)
        setFilters(draft.filters || {})
        setAgeRange(draft.ageRange || [18, 60])
        // Restore new range filters (with defaults for legacy drafts)
        setIncomeRange(draft.incomeRange || [0, 100])
        setHeightRange(draft.heightRange || [140, 200])
        // Restore smart matching preference from draft
        if (draft.usePartnerPreferences !== undefined) {
          setUsePartnerPreferences(draft.usePartnerPreferences)
        } else {
          setUsePartnerPreferences(false) // Default to off for legacy drafts
        }
        toast.success(
          language === 'hi' ? 'ड्राफ्ट लोड किया गया' : 'Draft loaded',
          { description: language === 'hi' ? 'आपके सहेजे गए फ़िल्टर लोड किए गए' : 'Your saved filters have been loaded' }
        )
      } catch {
        toast.error(language === 'hi' ? 'ड्राफ्ट लोड करने में त्रुटि' : 'Error loading draft')
      }
    }
  }, [language])

  // Pre-compute interaction statuses for all profiles for O(1) lookup (critical for 10k+ profiles)
  const profileInteractionStatusMap = useMemo(() => {
    const statusMap = new Map<string, {
      isDeclinedByMe: boolean
      isDeclinedByThem: boolean
      isBlocked: boolean
      isBlockedByThem: boolean
      interactionStatus: ProfileInteractionStatus
    }>()
    
    if (!currentUserProfile) return statusMap
    
    const currentProfileId = currentUserProfile.profileId
    const viewedProfiles = new Set(currentUserProfile.freeViewedProfiles || [])
    
    // Pre-index arrays for O(1) lookup
    const declinedByMeSet = new Set(
      (declinedProfiles || [])
        .filter(d => d.declinerProfileId === currentProfileId && !d.isReconsidered)
        .map(d => d.declinedProfileId)
    )
    
    const declinedByThemSet = new Set(
      (interests || [])
        .filter(i => i.fromProfileId === currentProfileId && i.status === 'declined')
        .map(i => i.toProfileId)
    )
    
    const blockedByMeSet = new Set(
      (blockedProfiles || [])
        .filter(b => b.blockerProfileId === currentProfileId && !b.isUnblocked)
        .map(b => b.blockedProfileId)
    )
    
    const blockedByThemSet = new Set(
      (blockedProfiles || [])
        .filter(b => b.blockedProfileId === currentProfileId && !b.isUnblocked)
        .map(b => b.blockerProfileId)
    )
    
    // Interest statuses indexed by profileId
    const interestSentMap = new Map<string, boolean>()
    const interestExpiredMap = new Map<string, boolean>()
    const interestReceivedMap = new Map<string, boolean>()
    const interestAcceptedMap = new Map<string, boolean>()
    
    ;(interests || []).forEach(i => {
      if (i.fromProfileId === currentProfileId) {
        if (i.status === 'pending' || i.status === 'accepted') {
          interestSentMap.set(i.toProfileId, true)
        }
        if (i.status === 'expired') {
          interestExpiredMap.set(i.toProfileId, true)
        }
        if (i.status === 'accepted') {
          interestAcceptedMap.set(i.toProfileId, true)
        }
      }
      if (i.toProfileId === currentProfileId) {
        if (i.status === 'pending') {
          interestReceivedMap.set(i.fromProfileId, true)
        }
        if (i.status === 'accepted') {
          interestAcceptedMap.set(i.fromProfileId, true)
        }
      }
    })
    
    // Contact request statuses indexed by profileId
    const contactSentMap = new Map<string, boolean>()
    const contactReceivedMap = new Map<string, boolean>()
    const contactAcceptedMap = new Map<string, boolean>()
    
    ;(contactRequests || []).forEach(r => {
      if (r.fromProfileId === currentProfileId && r.toProfileId) {
        if (r.status === 'pending' || r.status === 'approved') {
          contactSentMap.set(r.toProfileId, true)
        }
        if (r.status === 'approved') {
          contactAcceptedMap.set(r.toProfileId, true)
        }
      }
      if (r.toProfileId === currentProfileId && r.fromProfileId) {
        if (r.status === 'pending') {
          contactReceivedMap.set(r.fromProfileId, true)
        }
        if (r.status === 'approved') {
          contactAcceptedMap.set(r.fromProfileId, true)
        }
      }
    })
    
    // Build status for each profile
    profiles.forEach(profile => {
      const profileId = profile.profileId
      
      const isDeclinedByMe = declinedByMeSet.has(profileId)
      const isDeclinedByThem = declinedByThemSet.has(profileId)
      const isBlocked = blockedByMeSet.has(profileId)
      const isBlockedByThem = blockedByThemSet.has(profileId)
      
      const interestSent = interestSentMap.get(profileId) || false
      const interestExpired = interestExpiredMap.get(profileId) || false
      const interestReceived = interestReceivedMap.get(profileId) || false
      const interestAccepted = interestAcceptedMap.get(profileId) || false
      const contactRequestSent = contactSentMap.get(profileId) || false
      const contactRequestReceived = contactReceivedMap.get(profileId) || false
      const contactRequestAccepted = contactAcceptedMap.get(profileId) || false
      const canChat = interestAccepted
      const isViewed = viewedProfiles.has(profileId)
      
      const isNew = !isViewed && !interestSent && !interestReceived && !interestAccepted && 
                    !contactRequestSent && !contactRequestReceived && !contactRequestAccepted &&
                    !isDeclinedByMe && !isDeclinedByThem && !interestExpired
      
      statusMap.set(profileId, {
        isDeclinedByMe,
        isDeclinedByThem,
        isBlocked,
        isBlockedByThem,
        interactionStatus: {
          isNew,
          isViewed,
          interestSent,
          interestReceived,
          interestAccepted,
          interestExpired,
          contactRequestSent,
          contactRequestReceived,
          contactRequestAccepted,
          canChat
        }
      })
    })
    
    return statusMap
  }, [profiles, currentUserProfile, declinedProfiles, interests, blockedProfiles, contactRequests])

  // O(1) lookup for profile interaction status
  const getProfileInteractionStatus = useCallback((profileId: string) => {
    return profileInteractionStatusMap.get(profileId) || {
      isDeclinedByMe: false,
      isDeclinedByThem: false,
      isBlocked: false,
      isBlockedByThem: false,
      interactionStatus: {}
    }
  }, [profileInteractionStatusMap])

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

  // Helper to check if a filter array has 'any' selected (meaning no preference)
  const isAnySelected = (arr: string[] | undefined) => arr?.length === 1 && arr[0] === 'any'
  
  // Count active filters (don't count 'any' selections as active filters)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.caste) count++
    // Don't count 'any' as active filter for multi-selects
    if (filters.religions && filters.religions.length > 0 && !isAnySelected(filters.religions)) count++
    if (filters.religion) count++ // Legacy single select
    if (filters.motherTongues && filters.motherTongues.length > 0 && !isAnySelected(filters.motherTongues)) count++
    if (filters.manglik !== undefined) count++
    if (filters.dietPreferences && filters.dietPreferences.length > 0 && !isAnySelected(filters.dietPreferences as string[])) count++
    if (filters.drinkingHabit) count++
    if (filters.smokingHabit) count++
    // Don't count 'any' as active filter
    if (filters.educationLevels && filters.educationLevels.length > 0 && !isAnySelected(filters.educationLevels)) count++
    if (filters.employmentStatuses && filters.employmentStatuses.length > 0 && !isAnySelected(filters.employmentStatuses)) count++
    if (filters.occupations && filters.occupations.length > 0 && !isAnySelected(filters.occupations)) count++
    if (filters.countries && filters.countries.length > 0 && !isAnySelected(filters.countries)) count++
    if (filters.states && filters.states.length > 0 && !isAnySelected(filters.states)) count++
    if (filters.cities && filters.cities.length > 0 && !isAnySelected(filters.cities)) count++
    if (filters.hasReadinessBadge) count++
    if (filters.isVerified) count++
    if (filters.hasPhoto) count++
    if (filters.disability && filters.disability !== 'any') count++
    if (filters.ageRange && (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 60)) count++
    // New filters
    if (filters.recentlyJoined) count++
    if (filters.lastActive) count++
    if (filters.incomeRange && (filters.incomeRange[0] !== 0 || filters.incomeRange[1] !== 100)) count++
    if (filters.heightRange && (filters.heightRange[0] !== 140 || filters.heightRange[1] !== 200)) count++
    if (filters.profileCompleteness && filters.profileCompleteness > 0) count++
    if (filters.hasNewPhoto) count++
    if (filters.onlineRecently) count++
    return count
  }, [filters])

  // Helper function to parse height string to cm (numeric) - memoized for performance
  const parseHeightToCm = useCallback((height: string | undefined): number => {
    if (!height) return 0
    // Handle formats like "5'8\"", "5ft 8in", "172 cm", "5.8"
    const cmMatch = height.match(/(\d+)\s*cm/i)
    if (cmMatch) return parseInt(cmMatch[1], 10)
    
    const ftInMatch = height.match(/(\d+)['\s]*(?:ft)?[.\s]*(\d*)["\s]*(?:in)?/i)
    if (ftInMatch) {
      const feet = parseInt(ftInMatch[1], 10) || 0
      const inches = parseInt(ftInMatch[2], 10) || 0
      return Math.round(feet * 30.48 + inches * 2.54)
    }
    
    // Try parsing as decimal feet (5.8 = 5'8")
    const decimalMatch = height.match(/(\d+)\.(\d+)/)
    if (decimalMatch) {
      const feet = parseInt(decimalMatch[1], 10) || 0
      const inches = parseInt(decimalMatch[2], 10) || 0
      return Math.round(feet * 30.48 + inches * 2.54)
    }
    
    return 0
  }, [])

  // Helper to calculate profile completeness percentage - memoized for performance
  const getProfileCompleteness = useCallback((profile: Profile): number => {
    const fields = [
      profile.fullName,
      profile.dateOfBirth,
      profile.gender,
      profile.religion,
      profile.education,
      profile.occupation,
      profile.location,
      profile.country,
      profile.maritalStatus,
      profile.height,
      profile.bio,
      profile.familyDetails,
      profile.motherTongue,
      profile.photos?.length > 0,
      profile.dietPreference,
      profile.caste,
    ]
    const filled = fields.filter(f => f && (typeof f !== 'boolean' || f === true)).length
    return Math.round((filled / fields.length) * 100)
  }, [])

  // Helper to check if date is within N days - memoized for performance
  const isWithinDays = useCallback((dateStr: string | undefined, days: number): boolean => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays <= days
  }, [])

  // Get location options with profile counts (only show locations with profiles)
  const locationOptionsWithCounts = useMemo(() => {
    if (!profiles || !currentUserProfile) return { countries: [], states: [], cities: [] }
    
    // Get opposite gender profiles only (excluding deleted profiles)
    const matchableProfiles = profiles.filter(p => 
      p.id !== currentUserProfile.id &&
      p.status === 'verified' &&
      !p.isDeleted &&
      ((currentUserProfile.gender === 'male' && p.gender === 'female') ||
       (currentUserProfile.gender === 'female' && p.gender === 'male'))
    )
    
    // Count profiles by country
    const countryCount: Record<string, number> = {}
    const stateCount: Record<string, number> = {}
    const cityCount: Record<string, number> = {}
    
    matchableProfiles.forEach(p => {
      if (p.country) {
        countryCount[p.country] = (countryCount[p.country] || 0) + 1
      }
      if (p.state) {
        stateCount[p.state] = (stateCount[p.state] || 0) + 1
      }
      if (p.location || p.city) {
        const city = p.location || p.city || ''
        cityCount[city] = (cityCount[city] || 0) + 1
      }
    })
    
    // Filter COUNTRY_OPTIONS to only show countries with profiles
    const countriesWithProfiles = COUNTRY_OPTIONS.filter(c => countryCount[c.value] > 0).map(c => ({
      ...c,
      label: `${c.label} (${countryCount[c.value]})`
    }))
    
    return {
      countries: countriesWithProfiles,
      countryCount,
      stateCount,
      cityCount
    }
  }, [profiles, currentUserProfile])

  // Get dynamic state options based on selected countries with counts
  const stateOptionsWithCounts = useMemo(() => {
    if (!filters.countries || filters.countries.length === 0) return []
    
    const baseStateOptions = getStateOptionsForCountries(filters.countries)
    const stateCount = locationOptionsWithCounts.stateCount || {}
    
    // Filter to only states with profiles and add counts
    return baseStateOptions.filter(s => {
      // Check if any profiles exist in this state
      const baseValue = s.value.split(' (')[0] // Handle "(Country)" suffix
      return stateCount[baseValue] > 0 || stateCount[s.value] > 0
    }).map(s => {
      const baseValue = s.value.split(' (')[0]
      const count = stateCount[baseValue] || stateCount[s.value] || 0
      return {
        ...s,
        label: count > 0 ? `${s.label} (${count})` : s.label
      }
    })
  }, [filters.countries, locationOptionsWithCounts])

  // Get dynamic city options based on selected states with counts
  const cityOptionsWithCounts = useMemo(() => {
    if (!filters.states || filters.states.length === 0) return []
    
    const baseCityOptions = getCityOptionsForStates(filters.states)
    const cityCount = locationOptionsWithCounts.cityCount || {}
    
    // Filter to only cities with profiles and add counts
    return baseCityOptions.filter(c => {
      const baseValue = c.value.split(' (')[0]
      return cityCount[baseValue] > 0 || cityCount[c.value] > 0
    }).map(c => {
      const baseValue = c.value.split(' (')[0]
      const count = cityCount[baseValue] || cityCount[c.value] || 0
      return {
        ...c,
        label: count > 0 ? `${c.label} (${count})` : c.label
      }
    })
  }, [filters.states, locationOptionsWithCounts])

  // Dynamic filter options - only show values that exist in matchable profiles
  const dynamicFilterOptions = useMemo(() => {
    if (!profiles || !currentUserProfile) return {
      totalCount: 0,
      religions: RELIGION_OPTIONS,
      motherTongues: MOTHER_TONGUE_OPTIONS,
      dietPreferences: DIET_PREFERENCE_OPTIONS,
      educationLevels: EDUCATION_OPTIONS,
      employmentStatuses: EMPLOYMENT_STATUS_OPTIONS,
      occupations: OCCUPATION_PROFESSION_OPTIONS,
      drinkingHabits: DRINKING_HABIT_OPTIONS,
      smokingHabits: SMOKING_HABIT_OPTIONS
    }
    
    // Get opposite gender profiles only (excluding deleted profiles)
    const matchableProfiles = profiles.filter(p => 
      p.id !== currentUserProfile.id &&
      p.status === 'verified' &&
      !p.isDeleted &&
      ((currentUserProfile.gender === 'male' && p.gender === 'female') ||
       (currentUserProfile.gender === 'female' && p.gender === 'male'))
    )
    
    // Count profiles by each field
    const religionCount: Record<string, number> = {}
    const motherTongueCount: Record<string, number> = {}
    const dietCount: Record<string, number> = {}
    const educationCount: Record<string, number> = {}
    const employmentCount: Record<string, number> = {}
    const occupationCount: Record<string, number> = {}
    const drinkingCount: Record<string, number> = {}
    const smokingCount: Record<string, number> = {}
    
    matchableProfiles.forEach(p => {
      if (p.religion) {
        const val = p.religion.toLowerCase()
        religionCount[val] = (religionCount[val] || 0) + 1
      }
      if (p.motherTongue) {
        const val = p.motherTongue.toLowerCase()
        motherTongueCount[val] = (motherTongueCount[val] || 0) + 1
      }
      if (p.dietPreference) {
        dietCount[p.dietPreference] = (dietCount[p.dietPreference] || 0) + 1
      }
      if (p.education) {
        const val = p.education.toLowerCase()
        educationCount[val] = (educationCount[val] || 0) + 1
      }
      if (p.occupation) {
        const val = p.occupation.toLowerCase()
        employmentCount[val] = (employmentCount[val] || 0) + 1
      }
      if (p.position) {
        // Match occupation/profession options against position field
        const pos = p.position.toLowerCase()
        OCCUPATION_PROFESSION_OPTIONS.forEach(opt => {
          if (pos.includes(opt.value.toLowerCase())) {
            occupationCount[opt.value] = (occupationCount[opt.value] || 0) + 1
          }
        })
      }
      if (p.drinkingHabit) {
        drinkingCount[p.drinkingHabit] = (drinkingCount[p.drinkingHabit] || 0) + 1
      }
      if (p.smokingHabit) {
        smokingCount[p.smokingHabit] = (smokingCount[p.smokingHabit] || 0) + 1
      }
    })
    
    // Filter options to only show those with profiles and add counts
    const filterWithCounts = (options: { value: string; label: string }[], counts: Record<string, number>, caseInsensitive = false) => {
      return options.filter(opt => {
        const key = caseInsensitive ? opt.value.toLowerCase() : opt.value
        return counts[key] > 0
      }).map(opt => {
        const key = caseInsensitive ? opt.value.toLowerCase() : opt.value
        const count = counts[key] || 0
        return {
          ...opt,
          label: `${opt.label} (${count})`
        }
      })
    }
    
    const totalCount = matchableProfiles.length
    
    return {
      totalCount,
      religions: filterWithCounts(RELIGION_OPTIONS, religionCount, true),
      motherTongues: filterWithCounts(MOTHER_TONGUE_OPTIONS, motherTongueCount, true),
      dietPreferences: filterWithCounts(DIET_PREFERENCE_OPTIONS, dietCount),
      educationLevels: filterWithCounts(EDUCATION_OPTIONS, educationCount, true),
      employmentStatuses: filterWithCounts(EMPLOYMENT_STATUS_OPTIONS, employmentCount, true),
      occupations: filterWithCounts(OCCUPATION_PROFESSION_OPTIONS, occupationCount),
      drinkingHabits: filterWithCounts(DRINKING_HABIT_OPTIONS, drinkingCount),
      smokingHabits: filterWithCounts(SMOKING_HABIT_OPTIONS, smokingCount)
    }
  }, [profiles, currentUserProfile])

  // "Any" option label with total count
  const anyOptionWithCount = language === 'hi' 
    ? `\u0915\u094b\u0908 \u092d\u0940 / \u0938\u092d\u0940 (${dynamicFilterOptions.totalCount})` 
    : `Any / All (${dynamicFilterOptions.totalCount})`

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
    
    // Sort options
    sortBy: language === 'hi' ? 'क्रमबद्ध करें' : 'Sort by',
    sortNewest: language === 'hi' ? 'नवीनतम पहले' : 'Newest First',
    sortAgeAsc: language === 'hi' ? 'आयु (कम से अधिक)' : 'Age (Low to High)',
    sortAgeDesc: language === 'hi' ? 'आयु (अधिक से कम)' : 'Age (High to Low)',
    sortNameAsc: language === 'hi' ? 'नाम (A-Z)' : 'Name (A-Z)',
    sortCompatibility: language === 'hi' ? 'मिलान स्कोर' : 'Compatibility',
    
    // Draft filters
    saveDraft: language === 'hi' ? 'ड्राफ्ट सहेजें' : 'Save Draft',
    loadDraft: language === 'hi' ? 'ड्राफ्ट लोड करें' : 'Load Draft',
    draftSaved: language === 'hi' ? 'ड्राफ्ट उपलब्ध' : 'Draft available',
    
    // New filters
    recentlyJoined: language === 'hi' ? 'हाल में जुड़े' : 'Recently Joined',
    lastActive: language === 'hi' ? 'अंतिम सक्रिय' : 'Last Active',
    incomeRange: language === 'hi' ? 'वार्षिक आय' : 'Annual Income',
    heightRange: language === 'hi' ? 'ऊंचाई' : 'Height',
    profileCompleteness: language === 'hi' ? 'प्रोफ़ाइल पूर्णता' : 'Profile Completeness',
    quickFilters: language === 'hi' ? 'त्वरित फ़िल्टर' : 'Quick Filters',
    newPhotos: language === 'hi' ? 'नई तस्वीरें' : 'New Photos',
    activeRecently: language === 'hi' ? 'हाल में सक्रिय' : 'Active Recently',
    last7Days: language === 'hi' ? 'पिछले 7 दिन' : 'Last 7 days',
    last15Days: language === 'hi' ? 'पिछले 15 दिन' : 'Last 15 days',
    last30Days: language === 'hi' ? 'पिछले 30 दिन' : 'Last 30 days',
    last60Days: language === 'hi' ? 'पिछले 60 दिन' : 'Last 60 days',
    last90Days: language === 'hi' ? 'पिछले 90 दिन' : 'Last 90 days',
    lakhs: language === 'hi' ? 'लाख' : 'Lakhs',
    cm: language === 'hi' ? 'सेमी' : 'cm',
    minCompleteness: language === 'hi' ? 'न्यूनतम पूर्णता' : 'Min Completeness',
    noProfilesInLocation: language === 'hi' ? 'इस स्थान पर कोई प्रोफाइल नहीं' : 'No profiles in this location',
  }

  const filteredProfiles = useMemo(() => {
    if (!profiles || !currentUserProfile) return []
    
    const prefs = currentUserProfile.partnerPreferences
    
    return profiles.filter(profile => {
      if (profile.id === currentUserProfile.id) return false
      
      if (profile.status !== 'verified') return false
      
      // Skip deleted profiles - they should not appear in matches
      if (profile.isDeleted) return false
      
      // Check if blocked (either direction)
      const isBlocked = blockedProfiles?.some(
        b => ((b.blockerProfileId === currentUserProfile.profileId && b.blockedProfileId === profile.profileId) ||
             (b.blockedProfileId === currentUserProfile.profileId && b.blockerProfileId === profile.profileId)) &&
             !b.isUnblocked
      )
      if (isBlocked) return false
      
      // Hide profiles that user has declined (matrimony best practice - don't show rejected profiles)
      const isDeclinedByMe = declinedProfiles?.some(
        d => d.declinerProfileId === currentUserProfile.profileId && 
             d.declinedProfileId === profile.profileId &&
             !d.isReconsidered
      )
      if (isDeclinedByMe) return false
      
      // Also hide profiles that have blocked/declined the current user (respect their privacy)
      const isDeclinedByThem = interests?.some(
        i => i.fromProfileId === currentUserProfile.profileId && 
             i.toProfileId === profile.profileId && 
             (i.status === 'declined' || i.status === 'blocked')
      )
      if (isDeclinedByThem) return false
      
      if (currentUserProfile.gender === 'male' && profile.gender !== 'female') return false
      if (currentUserProfile.gender === 'female' && profile.gender !== 'male') return false
      
      // ============ PARTNER PREFERENCES BASED FILTERING ============
      // Apply partner preferences if enabled and preferences exist
      // IMPORTANT: If user selects "Any" in a filter, skip that partner preference
      if (usePartnerPreferences && prefs) {
        // Age filter based on partner preferences (skip if user modified age filter)
        // Only apply partner prefs age if filter is at default values
        const isAgeFilterDefault = !filters.ageRange || (filters.ageRange[0] === 18 && filters.ageRange[1] === 60)
        if (isAgeFilterDefault) {
          if (prefs.ageMin && profile.age < prefs.ageMin) return false
          if (prefs.ageMax && profile.age > prefs.ageMax) return false
        }
        
        // Height filter - normalized to cm for reliable comparison
        if (prefs.heightMin || prefs.heightMax) {
          const profileHeightCm = parseHeightToCm(profile.height)
          const minHeightCm = parseHeightToCm(prefs.heightMin)
          const maxHeightCm = prefs.heightMax ? parseHeightToCm(prefs.heightMax) : 999
          
          if (profileHeightCm > 0) { // Only filter if profile has valid height
            if (minHeightCm > 0 && profileHeightCm < minHeightCm) return false
            if (maxHeightCm < 999 && profileHeightCm > maxHeightCm) return false
          }
        }
        
        // Marital status filter
        if (prefs.maritalStatus && prefs.maritalStatus.length > 0) {
          if (!prefs.maritalStatus.includes(profile.maritalStatus)) return false
        }
        
        // Religion filter - skip if user selected "Any" in filter panel
        if (prefs.religion && prefs.religion.length > 0 && !isAnySelected(filters.religions)) {
          const profileReligion = profile.religion?.toLowerCase() || ''
          if (!prefs.religion.some(r => profileReligion.includes(r.toLowerCase()))) return false
        }
        
        // Caste filter
        if (prefs.caste && prefs.caste.length > 0) {
          const profileCaste = profile.caste?.toLowerCase() || ''
          if (!prefs.caste.some(c => profileCaste.includes(c.toLowerCase()))) return false
        }
        
        // Mother tongue filter - skip if user selected "Any" in filter panel
        if (prefs.motherTongue && prefs.motherTongue.length > 0 && !isAnySelected(filters.motherTongues)) {
          const profileMotherTongue = profile.motherTongue?.toLowerCase() || ''
          if (!prefs.motherTongue.some(mt => profileMotherTongue.includes(mt.toLowerCase()))) return false
        }
        
        // Education filter - skip if user selected "Any" in filter panel
        if (prefs.education && prefs.education.length > 0 && !isAnySelected(filters.educationLevels)) {
          const profileEducation = profile.education?.toLowerCase() || ''
          if (!prefs.education.some(edu => profileEducation.toLowerCase() === edu.toLowerCase())) return false
        }
        
        // Employment status filter - skip if user selected "Any" in filter panel
        if (prefs.employmentStatus && prefs.employmentStatus.length > 0 && !isAnySelected(filters.employmentStatuses)) {
          const profileOccupation = profile.occupation?.toLowerCase() || ''
          if (!prefs.employmentStatus.some(emp => profileOccupation.includes(emp.toLowerCase()))) return false
        }
        
        // Occupation/Profession filter - skip if user selected "Any" in filter panel
        // Matches against profile.position (free-text profession like "Software Engineer", "Doctor")
        if (prefs.occupation && prefs.occupation.length > 0 && !isAnySelected(filters.occupations)) {
          const profilePosition = profile.position?.toLowerCase() || ''
          if (!prefs.occupation.some(occ => profilePosition.toLowerCase().includes(occ.toLowerCase()))) return false
        }
        
        // Living country filter - skip if user selected "Any" in filter panel
        if (prefs.livingCountry && prefs.livingCountry.length > 0 && !isAnySelected(filters.countries)) {
          const profileCountry = profile.country?.toLowerCase() || ''
          if (!prefs.livingCountry.some(c => profileCountry.includes(c.toLowerCase()))) return false
        }
        
        // Living state filter - skip if user selected "Any" in filter panel
        if (prefs.livingState && prefs.livingState.length > 0 && !isAnySelected(filters.states)) {
          const profileState = profile.state?.toLowerCase() || ''
          if (!prefs.livingState.some(s => profileState.includes(s.toLowerCase()))) return false
        }
        
        // Location/City filter - skip if user selected "Any" in filter panel
        if (prefs.location && prefs.location.length > 0 && !isAnySelected(filters.cities)) {
          const profileLocation = profile.location?.toLowerCase() || ''
          if (!prefs.location.some(loc => profileLocation.includes(loc.toLowerCase()))) return false
        }
        
        // Diet preference filter - skip if user selected "Any" in filter panel
        if (prefs.dietPreference && prefs.dietPreference.length > 0 && !isAnySelected(filters.dietPreferences as string[])) {
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
      
      // Use debounced search query for better performance with large datasets
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase()
        if (!profile.fullName.toLowerCase().includes(query) &&
            !profile.location.toLowerCase().includes(query) &&
            !profile.profileId.toLowerCase().includes(query)) {
          return false
        }
      }
      
      // Basic filters (manual filters from filter panel)
      if (filters.caste && !profile.caste?.toLowerCase().includes(filters.caste.toLowerCase())) return false
      if (filters.community && !profile.community?.toLowerCase().includes(filters.community.toLowerCase())) return false
      
      // Religion - now multi-select (check new array format first, then legacy single value)
      // Skip filter if 'any' is selected (means no preference)
      if (filters.religions && filters.religions.length > 0 && !isAnySelected(filters.religions)) {
        const profileReligion = profile.religion?.toLowerCase() || ''
        if (!filters.religions.some(r => profileReligion.includes(r.toLowerCase()))) return false
      } else if (filters.religion && !profile.religion?.toLowerCase().includes(filters.religion.toLowerCase())) {
        return false
      }
      
      // Mother tongue - now multi-select
      // Skip filter if 'any' is selected (means no preference)
      if (filters.motherTongues && filters.motherTongues.length > 0 && !isAnySelected(filters.motherTongues)) {
        const profileMotherTongue = profile.motherTongue?.toLowerCase() || ''
        if (!filters.motherTongues.some(mt => profileMotherTongue.includes(mt.toLowerCase()))) return false
      }
      
      if (filters.manglik !== undefined && profile.manglik !== filters.manglik) return false
      
      // Diet preference - now multi-select
      // Skip filter if 'any' is selected (means no preference)
      if (filters.dietPreferences && filters.dietPreferences.length > 0 && !isAnySelected(filters.dietPreferences as string[])) {
        if (!profile.dietPreference || !filters.dietPreferences.includes(profile.dietPreference)) return false
      }
      
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
      
      // Occupation/Profession filter - now multi-select
      // Matches against profile.position (free-text profession like "Software Engineer", "Doctor")
      // NOT profile.occupation which stores employment status like "employed", "self-employed"
      // Skip filter if 'any' is selected (means no preference)
      if (filters.occupations && filters.occupations.length > 0 && !(filters.occupations.length === 1 && filters.occupations[0] === 'any')) {
        const profilePosition = profile.position?.toLowerCase() || ''
        if (!filters.occupations.some(occ => profilePosition.toLowerCase().includes(occ.toLowerCase()))) return false
      }
      
      // Country filter - now multi-select
      // Skip filter if 'any' is selected (means no preference)
      if (filters.countries && filters.countries.length > 0 && !isAnySelected(filters.countries)) {
        const profileCountry = profile.country?.toLowerCase() || ''
        if (!filters.countries.some(c => profileCountry.includes(c.toLowerCase()))) return false
      }
      
      // State filter - now multi-select
      // Skip filter if 'any' is selected (means no preference)
      if (filters.states && filters.states.length > 0 && !isAnySelected(filters.states)) {
        const profileState = profile.state?.toLowerCase() || ''
        if (!filters.states.some(s => profileState.includes(s.toLowerCase()))) return false
      }
      
      // City filter - now multi-select
      // Skip filter if 'any' is selected (means no preference)
      if (filters.cities && filters.cities.length > 0 && !isAnySelected(filters.cities)) {
        const profileLocation = profile.location?.toLowerCase() || ''
        if (!filters.cities.some(c => profileLocation.includes(c.toLowerCase()))) return false
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
      
      // ============ NEW FILTERS ============
      
      // Recently Joined filter
      if (filters.recentlyJoined) {
        const days = filters.recentlyJoined === '7days' ? 7 : filters.recentlyJoined === '15days' ? 15 : 30
        if (!isWithinDays(profile.createdAt, days)) return false
      }
      
      // Last Active filter
      if (filters.lastActive) {
        const days = filters.lastActive === '7days' ? 7 : 
                     filters.lastActive === '30days' ? 30 : 
                     filters.lastActive === '60days' ? 60 : 90
        const lastActive = profile.lastActivityAt || profile.lastLoginAt || profile.updatedAt
        if (!isWithinDays(lastActive, days)) return false
      }
      
      // Income range filter (assuming salary is stored as string like "10 LPA" or "10-15 Lakhs")
      if (filters.incomeRange && (filters.incomeRange[0] > 0 || filters.incomeRange[1] < 100)) {
        const salaryStr = profile.salary || ''
        const salaryMatch = salaryStr.match(/(\d+)/g)
        if (salaryMatch) {
          const salary = parseInt(salaryMatch[0], 10)
          if (salary < filters.incomeRange[0] || salary > filters.incomeRange[1]) return false
        } else if (filters.incomeRange[0] > 0) {
          // If no salary info and minimum is set, exclude
          return false
        }
      }
      
      // Height range filter (normalized to cm)
      if (filters.heightRange && (filters.heightRange[0] > 140 || filters.heightRange[1] < 200)) {
        const profileHeightCm = parseHeightToCm(profile.height)
        if (profileHeightCm > 0) {
          if (profileHeightCm < filters.heightRange[0] || profileHeightCm > filters.heightRange[1]) return false
        }
      }
      
      // Profile Completeness filter
      if (filters.profileCompleteness && filters.profileCompleteness > 0) {
        const completeness = getProfileCompleteness(profile)
        if (completeness < filters.profileCompleteness) return false
      }
      
      // Quick filter: New photos (uploaded in last 30 days)
      if (filters.hasNewPhoto) {
        // Check if any photo was added recently (we'd need uploadedAt on photos, using updatedAt as proxy)
        if (!isWithinDays(profile.updatedAt, 30) || !profile.photos || profile.photos.length === 0) return false
      }
      
      // Quick filter: Online/Active recently (last 24 hours)
      if (filters.onlineRecently) {
        const lastActive = profile.lastActivityAt || profile.lastLoginAt
        if (!isWithinDays(lastActive, 1)) return false
      }
      
      return true
    })
  }, [profiles, currentUserProfile, debouncedSearchQuery, filters, blockedProfiles, declinedProfiles, interests, usePartnerPreferences, parseHeightToCm, isWithinDays, getProfileCompleteness])

  // Handler to click on a filter issue and scroll to the relevant filter section
  const handleIssueClick = useCallback((filterType: string) => {
    // Map filter types to section IDs
    const filterSectionMap: Record<string, string> = {
      // Age filters
      'age-pref': 'filter-age',
      'age-filter': 'filter-age',
      // Religion/Community filters
      'religion-pref': 'filter-religion',
      'religion-filter': 'filter-religion',
      'mothertongue-pref': 'filter-religion',
      'mothertongue-filter': 'filter-religion',
      'manglik-filter': 'filter-religion',
      'caste-filter': 'filter-religion',
      // Location filters
      'country-pref': 'filter-location',
      'country-filter': 'filter-location',
      'state-filter': 'filter-location',
      'city-filter': 'filter-location',
      // Education/Career filters
      'education-pref': 'filter-education',
      'education-filter': 'filter-education',
      'occupation-pref': 'filter-education',
      'occupation-filter': 'filter-education',
      'employment-filter': 'filter-education',
      'income-filter': 'filter-education',
      // Lifestyle filters
      'diet-pref': 'filter-lifestyle',
      'diet-filter': 'filter-lifestyle',
      'drinking-filter': 'filter-lifestyle',
      'smoking-filter': 'filter-lifestyle',
      // Physical/Misc filters
      'height-filter': 'filter-physical',
      'disability-filter': 'filter-physical',
      // Activity/Status filters
      'readiness-filter': 'filter-activity',
      'photo-filter': 'filter-activity',
      'recent-filter': 'filter-activity',
      'active-filter': 'filter-activity',
      'online-filter': 'filter-activity',
      'completeness-filter': 'filter-activity',
    }
    
    const sectionId = filterSectionMap[filterType] || 'filter-age'
    
    // Open filter panel first
    setShowFilters(true)
    
    // Wait for panel to open, then scroll to section
    setTimeout(() => {
      const section = document.getElementById(sectionId)
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Add a brief highlight effect
        section.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
        setTimeout(() => {
          section.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
        }, 2000)
      }
    }, 300)
  }, [])

  // Diagnostic analysis: Why are there no matches?
  const filterDiagnostics = useMemo(() => {
    if (!profiles || !currentUserProfile || filteredProfiles.length > 0) {
      return null // Only calculate when there are no matches
    }
    
    const prefs = currentUserProfile.partnerPreferences
    
    // Get base pool (opposite gender, verified, not deleted, not blocked)
    const basePool = profiles.filter(p => 
      p.id !== currentUserProfile.id &&
      p.status === 'verified' &&
      !p.isDeleted &&
      ((currentUserProfile.gender === 'male' && p.gender === 'female') ||
       (currentUserProfile.gender === 'female' && p.gender === 'male'))
    )
    
    if (basePool.length === 0) {
      return { reason: 'no-profiles', totalProfiles: 0, suggestions: [] }
    }
    
    const issues: Array<{ filter: string; label: string; matchCount: number; suggestion: string }> = []
    
    // ============ PARTNER PREFERENCES (SMART MATCHING) ============
    if (usePartnerPreferences && prefs) {
      // Age preference impact
      const effectiveAgeMin = filters.ageRange ? filters.ageRange[0] : (prefs.ageMin || 18)
      const effectiveAgeMax = filters.ageRange ? filters.ageRange[1] : (prefs.ageMax || 60)
      
      if (effectiveAgeMin !== 18 || effectiveAgeMax !== 60) {
        const ageMatches = basePool.filter(p => p.age >= effectiveAgeMin && p.age <= effectiveAgeMax).length
        if (ageMatches === 0 || ageMatches < basePool.length * 0.3) {
          issues.push({
            filter: 'age-pref',
            label: language === 'hi' ? 'आयु सीमा' : 'Age Range',
            matchCount: ageMatches,
            suggestion: language === 'hi' ? `आयु सीमा ${effectiveAgeMin}-${effectiveAgeMax} वर्ष बहुत सीमित है` : `Age range ${effectiveAgeMin}-${effectiveAgeMax} years is restrictive`
          })
        }
      }
      
      // Religion preference
      if (prefs.religion && prefs.religion.length > 0 && !isAnySelected(filters.religions)) {
        const religionMatches = basePool.filter(p => {
          const profileReligion = p.religion?.toLowerCase() || ''
          return prefs.religion!.some(r => profileReligion.includes(r.toLowerCase()))
        }).length
        if (religionMatches === 0) {
          issues.push({
            filter: 'religion-pref',
            label: language === 'hi' ? 'धर्म प्राथमिकता' : 'Religion Preference',
            matchCount: religionMatches,
            suggestion: language === 'hi' ? 'चयनित धर्म वाले कोई प्रोफाइल नहीं' : 'No profiles for selected religion(s)'
          })
        }
      }
      
      // Education preference
      if (prefs.education && prefs.education.length > 0 && !isAnySelected(filters.educationLevels)) {
        const educationMatches = basePool.filter(p => {
          const profileEducation = p.education?.toLowerCase() || ''
          return prefs.education!.some(edu => profileEducation === edu.toLowerCase())
        }).length
        if (educationMatches === 0) {
          issues.push({
            filter: 'education-pref',
            label: language === 'hi' ? 'शिक्षा प्राथमिकता' : 'Education Preference',
            matchCount: educationMatches,
            suggestion: language === 'hi' ? 'चयनित शिक्षा वाले कोई प्रोफाइल नहीं' : 'No profiles match your education preference'
          })
        }
      }

      // Mother tongue preference
      if (prefs.motherTongue && prefs.motherTongue.length > 0 && !isAnySelected(filters.motherTongues)) {
        const mtMatches = basePool.filter(p => {
          const profileMT = p.motherTongue?.toLowerCase() || ''
          return prefs.motherTongue!.some(mt => profileMT.includes(mt.toLowerCase()))
        }).length
        if (mtMatches === 0) {
          issues.push({
            filter: 'mothertongue-pref',
            label: language === 'hi' ? 'मातृभाषा प्राथमिकता' : 'Mother Tongue Preference',
            matchCount: mtMatches,
            suggestion: language === 'hi' ? 'चयनित मातृभाषा वाले कोई प्रोफाइल नहीं' : 'No profiles for selected mother tongue(s)'
          })
        }
      }

      // Country preference
      if (prefs.livingCountry && prefs.livingCountry.length > 0 && !isAnySelected(filters.countries)) {
        const countryMatches = basePool.filter(p => {
          const profileCountry = p.country?.toLowerCase() || ''
          return prefs.livingCountry!.some(c => profileCountry.includes(c.toLowerCase()))
        }).length
        if (countryMatches === 0) {
          issues.push({
            filter: 'country-pref',
            label: language === 'hi' ? 'देश प्राथमिकता' : 'Country Preference',
            matchCount: countryMatches,
            suggestion: language === 'hi' ? 'चयनित देश में कोई प्रोफाइल नहीं' : 'No profiles in preferred country'
          })
        }
      }

      // Diet preference
      if (prefs.dietPreference && prefs.dietPreference.length > 0 && !isAnySelected(filters.dietPreferences as string[])) {
        const dietMatches = basePool.filter(p => 
          p.dietPreference && prefs.dietPreference!.includes(p.dietPreference)
        ).length
        if (dietMatches === 0) {
          issues.push({
            filter: 'diet-pref',
            label: language === 'hi' ? 'आहार प्राथमिकता' : 'Diet Preference',
            matchCount: dietMatches,
            suggestion: language === 'hi' ? 'चयनित आहार प्राथमिकता वाले कोई प्रोफाइल नहीं' : 'No profiles match your diet preference'
          })
        }
      }

      // Occupation preference
      if (prefs.occupation && prefs.occupation.length > 0 && !isAnySelected(filters.occupations)) {
        const occMatches = basePool.filter(p => {
          const profilePosition = p.position?.toLowerCase() || ''
          return prefs.occupation!.some(occ => profilePosition.includes(occ.toLowerCase()))
        }).length
        if (occMatches === 0) {
          issues.push({
            filter: 'occupation-pref',
            label: language === 'hi' ? 'व्यवसाय प्राथमिकता' : 'Occupation Preference',
            matchCount: occMatches,
            suggestion: language === 'hi' ? 'चयनित व्यवसाय वाले कोई प्रोफाइल नहीं' : 'No profiles match occupation preference'
          })
        }
      }
    } else {
      // When smart matching is OFF, check manual age filter
      if (filters.ageRange && (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 60)) {
        const ageMatches = basePool.filter(p => 
          p.age >= filters.ageRange![0] && p.age <= filters.ageRange![1]
        ).length
        if (ageMatches === 0 || ageMatches < basePool.length * 0.3) {
          issues.push({
            filter: 'age-filter',
            label: language === 'hi' ? 'आयु सीमा' : 'Age Range',
            matchCount: ageMatches,
            suggestion: language === 'hi' ? `${filters.ageRange[0]}-${filters.ageRange[1]} आयु में कोई/कम प्रोफाइल` : `Age range ${filters.ageRange[0]}-${filters.ageRange[1]} is restrictive`
          })
        }
      }
    }
    
    // ============ MANUAL FILTERS (Always checked) ============
    
    // Religion filter (manual)
    if (filters.religions && filters.religions.length > 0 && !isAnySelected(filters.religions)) {
      const religionMatches = basePool.filter(p => {
        const profileReligion = p.religion?.toLowerCase() || ''
        return filters.religions!.some(r => profileReligion.includes(r.toLowerCase()))
      }).length
      if (religionMatches === 0) {
        issues.push({
          filter: 'religion-filter',
          label: language === 'hi' ? 'धर्म फ़िल्टर' : 'Religion Filter',
          matchCount: religionMatches,
          suggestion: language === 'hi' ? 'चयनित धर्म वाले कोई प्रोफाइल नहीं' : 'No profiles for selected religion'
        })
      }
    }

    // Mother tongue filter (manual)
    if (filters.motherTongues && filters.motherTongues.length > 0 && !isAnySelected(filters.motherTongues)) {
      const mtMatches = basePool.filter(p => {
        const profileMT = p.motherTongue?.toLowerCase() || ''
        return filters.motherTongues!.some(mt => profileMT.includes(mt.toLowerCase()))
      }).length
      if (mtMatches === 0) {
        issues.push({
          filter: 'mothertongue-filter',
          label: language === 'hi' ? 'मातृभाषा फ़िल्टर' : 'Mother Tongue Filter',
          matchCount: mtMatches,
          suggestion: language === 'hi' ? 'चयनित मातृभाषा वाले कोई प्रोफाइल नहीं' : 'No profiles for selected mother tongue'
        })
      }
    }

    // Country filter
    if (filters.countries && filters.countries.length > 0 && !isAnySelected(filters.countries)) {
      const countryMatches = basePool.filter(p => {
        const profileCountry = p.country?.toLowerCase() || ''
        return filters.countries!.some(c => profileCountry.includes(c.toLowerCase()))
      }).length
      if (countryMatches === 0) {
        issues.push({
          filter: 'country-filter',
          label: language === 'hi' ? 'देश फ़िल्टर' : 'Country Filter',
          matchCount: countryMatches,
          suggestion: language === 'hi' ? 'चयनित देश में कोई प्रोफाइल नहीं' : 'No profiles in selected country'
        })
      }
    }

    // State filter
    if (filters.states && filters.states.length > 0 && !isAnySelected(filters.states)) {
      const stateMatches = basePool.filter(p => {
        const profileState = p.state?.toLowerCase() || ''
        return filters.states!.some(s => profileState.includes(s.toLowerCase()))
      }).length
      if (stateMatches === 0) {
        issues.push({
          filter: 'state-filter',
          label: language === 'hi' ? 'राज्य फ़िल्टर' : 'State Filter',
          matchCount: stateMatches,
          suggestion: language === 'hi' ? 'चयनित राज्य में कोई प्रोफाइल नहीं' : 'No profiles in selected state'
        })
      }
    }

    // City filter
    if (filters.cities && filters.cities.length > 0 && !isAnySelected(filters.cities)) {
      const cityMatches = basePool.filter(p => {
        const profileLocation = p.location?.toLowerCase() || ''
        return filters.cities!.some(c => profileLocation.includes(c.toLowerCase()))
      }).length
      if (cityMatches === 0) {
        issues.push({
          filter: 'city-filter',
          label: language === 'hi' ? 'शहर फ़िल्टर' : 'City Filter',
          matchCount: cityMatches,
          suggestion: language === 'hi' ? 'चयनित शहर में कोई प्रोफाइल नहीं' : 'No profiles in selected city'
        })
      }
    }
    
    // Manglik filter
    if (filters.manglik !== undefined) {
      const manglikMatches = basePool.filter(p => p.manglik === filters.manglik).length
      if (manglikMatches === 0) {
        issues.push({
          filter: 'manglik-filter',
          label: language === 'hi' ? 'मांगलिक फ़िल्टर' : 'Manglik Filter',
          matchCount: manglikMatches,
          suggestion: filters.manglik 
            ? (language === 'hi' ? 'कोई मांगलिक प्रोफाइल नहीं मिला' : 'No Manglik profiles found')
            : (language === 'hi' ? 'कोई गैर-मांगलिक प्रोफाइल नहीं मिला' : 'No non-Manglik profiles found')
        })
      }
    }

    // Education filter (manual)
    if (filters.educationLevels && filters.educationLevels.length > 0 && !isAnySelected(filters.educationLevels)) {
      const eduMatches = basePool.filter(p => {
        const profileEducation = p.education?.toLowerCase() || ''
        return filters.educationLevels!.some(edu => profileEducation === edu.toLowerCase())
      }).length
      if (eduMatches === 0) {
        issues.push({
          filter: 'education-filter',
          label: language === 'hi' ? 'शिक्षा फ़िल्टर' : 'Education Filter',
          matchCount: eduMatches,
          suggestion: language === 'hi' ? 'चयनित शिक्षा वाले कोई प्रोफाइल नहीं' : 'No profiles with selected education'
        })
      }
    }

    // Employment status filter
    if (filters.employmentStatuses && filters.employmentStatuses.length > 0 && !isAnySelected(filters.employmentStatuses)) {
      const empMatches = basePool.filter(p => {
        const profileOccupation = p.occupation?.toLowerCase() || ''
        return filters.employmentStatuses!.some(emp => profileOccupation.includes(emp.toLowerCase()))
      }).length
      if (empMatches === 0) {
        issues.push({
          filter: 'employment-filter',
          label: language === 'hi' ? 'रोजगार स्थिति' : 'Employment Status',
          matchCount: empMatches,
          suggestion: language === 'hi' ? 'चयनित रोजगार स्थिति वाले कोई प्रोफाइल नहीं' : 'No profiles with selected employment status'
        })
      }
    }

    // Occupation filter
    if (filters.occupations && filters.occupations.length > 0 && !isAnySelected(filters.occupations)) {
      const occMatches = basePool.filter(p => {
        const profilePosition = p.position?.toLowerCase() || ''
        return filters.occupations!.some(occ => profilePosition.includes(occ.toLowerCase()))
      }).length
      if (occMatches === 0) {
        issues.push({
          filter: 'occupation-filter',
          label: language === 'hi' ? 'व्यवसाय फ़िल्टर' : 'Occupation Filter',
          matchCount: occMatches,
          suggestion: language === 'hi' ? 'चयनित व्यवसाय वाले कोई प्रोफाइल नहीं' : 'No profiles with selected occupation'
        })
      }
    }

    // Diet preference filter
    if (filters.dietPreferences && filters.dietPreferences.length > 0 && !isAnySelected(filters.dietPreferences as string[])) {
      const dietMatches = basePool.filter(p => 
        p.dietPreference && filters.dietPreferences!.includes(p.dietPreference)
      ).length
      if (dietMatches === 0) {
        issues.push({
          filter: 'diet-filter',
          label: language === 'hi' ? 'आहार फ़िल्टर' : 'Diet Filter',
          matchCount: dietMatches,
          suggestion: language === 'hi' ? 'चयनित आहार प्राथमिकता वाले कोई प्रोफाइल नहीं' : 'No profiles with selected diet preference'
        })
      }
    }

    // Drinking habit filter
    if (filters.drinkingHabit) {
      const drinkMatches = basePool.filter(p => p.drinkingHabit === filters.drinkingHabit).length
      if (drinkMatches === 0) {
        issues.push({
          filter: 'drinking-filter',
          label: language === 'hi' ? 'शराब की आदत' : 'Drinking Habit',
          matchCount: drinkMatches,
          suggestion: language === 'hi' ? 'चयनित शराब की आदत वाले कोई प्रोफाइल नहीं' : 'No profiles with selected drinking habit'
        })
      }
    }

    // Smoking habit filter
    if (filters.smokingHabit) {
      const smokeMatches = basePool.filter(p => p.smokingHabit === filters.smokingHabit).length
      if (smokeMatches === 0) {
        issues.push({
          filter: 'smoking-filter',
          label: language === 'hi' ? 'धूम्रपान की आदत' : 'Smoking Habit',
          matchCount: smokeMatches,
          suggestion: language === 'hi' ? 'चयनित धूम्रपान की आदत वाले कोई प्रोफाइल नहीं' : 'No profiles with selected smoking habit'
        })
      }
    }

    // Caste filter
    if (filters.caste) {
      const casteMatches = basePool.filter(p => 
        p.caste?.toLowerCase().includes(filters.caste!.toLowerCase())
      ).length
      if (casteMatches === 0) {
        issues.push({
          filter: 'caste-filter',
          label: language === 'hi' ? 'जाति फ़िल्टर' : 'Caste Filter',
          matchCount: casteMatches,
          suggestion: language === 'hi' ? `"${filters.caste}" जाति वाले कोई प्रोफाइल नहीं` : `No profiles with caste "${filters.caste}"`
        })
      }
    }

    // Disability filter
    if (filters.disability && filters.disability !== 'any') {
      const disabilityMatches = basePool.filter(p => p.disability === filters.disability).length
      if (disabilityMatches === 0) {
        issues.push({
          filter: 'disability-filter',
          label: language === 'hi' ? 'विकलांगता फ़िल्टर' : 'Disability Filter',
          matchCount: disabilityMatches,
          suggestion: language === 'hi' ? 'चयनित विकलांगता स्थिति वाले कोई प्रोफाइल नहीं' : 'No profiles with selected disability status'
        })
      }
    }

    // Readiness badge filter
    if (filters.hasReadinessBadge) {
      const readinessMatches = basePool.filter(p => p.hasReadinessBadge).length
      if (readinessMatches === 0) {
        issues.push({
          filter: 'readiness-filter',
          label: language === 'hi' ? 'तत्परता बैज' : 'Readiness Badge',
          matchCount: readinessMatches,
          suggestion: language === 'hi' ? 'तत्परता बैज वाले कोई प्रोफाइल नहीं' : 'No profiles have readiness badge'
        })
      }
    }

    // Photo filter
    if (filters.hasPhoto) {
      const photoMatches = basePool.filter(p => p.photos && p.photos.length > 0).length
      if (photoMatches === 0) {
        issues.push({
          filter: 'photo-filter',
          label: language === 'hi' ? 'फोटो फ़िल्टर' : 'Photo Filter',
          matchCount: photoMatches,
          suggestion: language === 'hi' ? 'फोटो वाले कोई प्रोफाइल नहीं' : 'No profiles with photos'
        })
      }
    }

    // Recently joined filter
    if (filters.recentlyJoined) {
      const days = filters.recentlyJoined === '7days' ? 7 : filters.recentlyJoined === '15days' ? 15 : 30
      const recentMatches = basePool.filter(p => isWithinDays(p.createdAt, days)).length
      if (recentMatches === 0) {
        issues.push({
          filter: 'recent-filter',
          label: language === 'hi' ? 'हाल में जुड़े' : 'Recently Joined',
          matchCount: recentMatches,
          suggestion: language === 'hi' ? `पिछले ${days} दिनों में जुड़े कोई प्रोफाइल नहीं` : `No profiles joined in last ${days} days`
        })
      }
    }

    // Last active filter
    if (filters.lastActive) {
      const days = filters.lastActive === '7days' ? 7 : 
                   filters.lastActive === '30days' ? 30 : 
                   filters.lastActive === '60days' ? 60 : 90
      const activeMatches = basePool.filter(p => {
        const lastActive = p.lastActivityAt || p.lastLoginAt || p.updatedAt
        return isWithinDays(lastActive, days)
      }).length
      if (activeMatches === 0) {
        issues.push({
          filter: 'active-filter',
          label: language === 'hi' ? 'अंतिम सक्रिय' : 'Last Active',
          matchCount: activeMatches,
          suggestion: language === 'hi' ? `पिछले ${days} दिनों में सक्रिय कोई प्रोफाइल नहीं` : `No profiles active in last ${days} days`
        })
      }
    }

    // Online recently filter
    if (filters.onlineRecently) {
      const onlineMatches = basePool.filter(p => {
        const lastActive = p.lastActivityAt || p.lastLoginAt
        return isWithinDays(lastActive, 1)
      }).length
      if (onlineMatches === 0) {
        issues.push({
          filter: 'online-filter',
          label: language === 'hi' ? 'हाल में ऑनलाइन' : 'Online Recently',
          matchCount: onlineMatches,
          suggestion: language === 'hi' ? 'पिछले 24 घंटों में ऑनलाइन कोई प्रोफाइल नहीं' : 'No profiles online in last 24 hours'
        })
      }
    }

    // Height range filter
    if (filters.heightRange && (filters.heightRange[0] > 140 || filters.heightRange[1] < 200)) {
      const heightMatches = basePool.filter(p => {
        const profileHeightCm = parseHeightToCm(p.height)
        return profileHeightCm > 0 && profileHeightCm >= filters.heightRange![0] && profileHeightCm <= filters.heightRange![1]
      }).length
      if (heightMatches === 0) {
        issues.push({
          filter: 'height-filter',
          label: language === 'hi' ? 'ऊंचाई सीमा' : 'Height Range',
          matchCount: heightMatches,
          suggestion: language === 'hi' ? `${filters.heightRange[0]}-${filters.heightRange[1]} सेमी ऊंचाई में कोई प्रोफाइल नहीं` : `No profiles in ${filters.heightRange[0]}-${filters.heightRange[1]} cm height range`
        })
      }
    }

    // Income range filter
    if (filters.incomeRange && (filters.incomeRange[0] > 0 || filters.incomeRange[1] < 100)) {
      const incomeMatches = basePool.filter(p => {
        const salaryStr = p.salary || ''
        const salaryMatch = salaryStr.match(/(\d+)/g)
        if (salaryMatch) {
          const salary = parseInt(salaryMatch[0], 10)
          return salary >= filters.incomeRange![0] && salary <= filters.incomeRange![1]
        }
        return filters.incomeRange![0] === 0
      }).length
      if (incomeMatches === 0) {
        issues.push({
          filter: 'income-filter',
          label: language === 'hi' ? 'आय सीमा' : 'Income Range',
          matchCount: incomeMatches,
          suggestion: language === 'hi' ? `${filters.incomeRange[0]}-${filters.incomeRange[1]} लाख आय में कोई प्रोफाइल नहीं` : `No profiles in ${filters.incomeRange[0]}-${filters.incomeRange[1]} LPA income range`
        })
      }
    }

    // Profile completeness filter
    if (filters.profileCompleteness && filters.profileCompleteness > 0) {
      const completenessMatches = basePool.filter(p => 
        getProfileCompleteness(p) >= filters.profileCompleteness!
      ).length
      if (completenessMatches === 0) {
        issues.push({
          filter: 'completeness-filter',
          label: language === 'hi' ? 'प्रोफाइल पूर्णता' : 'Profile Completeness',
          matchCount: completenessMatches,
          suggestion: language === 'hi' ? `${filters.profileCompleteness}%+ पूर्ण प्रोफाइल नहीं मिले` : `No profiles with ${filters.profileCompleteness}%+ completeness`
        })
      }
    }
    
    return {
      reason: issues.length > 0 ? 'filters-too-strict' : 'combined-filters',
      totalProfiles: basePool.length,
      suggestions: issues.slice(0, 5), // Show top 5 issues
      smartMatchingOn: usePartnerPreferences && !!prefs
    }
  }, [profiles, currentUserProfile, filteredProfiles.length, filters, usePartnerPreferences, language, isWithinDays, parseHeightToCm, getProfileCompleteness])

  // Sort profiles based on selected option - with stable sort for consistency
  const sortedProfiles = useMemo(() => {
    // Create array with original indices for stable sort
    const indexedProfiles = filteredProfiles.map((p, idx) => ({ profile: p, originalIndex: idx }))
    
    indexedProfiles.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'newest': {
          // Sort by createdAt descending (newest first)
          const dateA = new Date(a.profile.createdAt || 0).getTime()
          const dateB = new Date(b.profile.createdAt || 0).getTime()
          comparison = dateB - dateA
          break
        }
        
        case 'age-asc':
          // Sort by age ascending (youngest first)
          comparison = (a.profile.age || 0) - (b.profile.age || 0)
          break
        
        case 'age-desc':
          // Sort by age descending (oldest first)
          comparison = (b.profile.age || 0) - (a.profile.age || 0)
          break
        
        case 'name-asc':
          // Sort by name alphabetically
          comparison = (a.profile.fullName || '').localeCompare(b.profile.fullName || '')
          break
        
        case 'compatibility': {
          // Sort by compatibility score if available, otherwise by preferences match
          const prefs = currentUserProfile?.partnerPreferences
          if (prefs) {
            const getScore = (profile: Profile): number => {
              let score = 0
              if (prefs.religion?.includes(profile.religion || '')) score += 2
              if (prefs.motherTongue?.includes(profile.motherTongue || '')) score += 2
              if (prefs.education?.some(e => profile.education?.toLowerCase().includes(e.toLowerCase()))) score += 1
              if (prefs.livingCountry?.includes(profile.country || '')) score += 1
              if (prefs.dietPreference?.includes(profile.dietPreference as never)) score += 1
              if (profile.hasReadinessBadge) score += 1
              if (profile.photos && profile.photos.length > 0) score += 1
              return score
            }
            comparison = getScore(b.profile) - getScore(a.profile)
          }
          break
        }
      }
      
      // Stable sort: if comparison is equal, maintain original order
      return comparison !== 0 ? comparison : a.originalIndex - b.originalIndex
    })
    
    return indexedProfiles.map(item => item.profile)
  }, [filteredProfiles, sortBy, currentUserProfile?.partnerPreferences])

  // Paginated profiles for display
  const totalPages = Math.ceil(sortedProfiles.length / PROFILES_PER_PAGE)
  const paginatedProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * PROFILES_PER_PAGE
    return sortedProfiles.slice(startIndex, startIndex + PROFILES_PER_PAGE)
  }, [sortedProfiles, currentPage])

  // Reset page when filters or sort changes
  useEffect(() => {
    setCurrentPage(1)
    setJumpToPage('')
  }, [filters, sortBy, debouncedSearchQuery])

  // Show loading state when filtering large datasets
  useEffect(() => {
    // Calculate dynamic loading time based on dataset size
    const loadingDuration = profiles.length > 5000 ? 500 : profiles.length > 1000 ? 300 : 150
    if (profiles.length > 100) {
      setIsFiltering(true)
      const timer = setTimeout(() => setIsFiltering(false), loadingDuration)
      return () => clearTimeout(timer)
    }
  }, [filters, debouncedSearchQuery, usePartnerPreferences, profiles.length])

  // Handle jump to page
  const handleJumpToPage = useCallback(() => {
    const pageNum = parseInt(jumpToPage, 10)
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
      setJumpToPage('')
    } else {
      toast.error(language === 'hi' ? 'अमान्य पृष्ठ संख्या' : 'Invalid page number')
    }
  }, [jumpToPage, totalPages, language])

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
    <div 
      ref={filterScrollRef} 
      className="h-[calc(100vh-180px)] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
    >
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
              aria-label={language === 'hi' ? 'स्मार्ट मैचिंग टॉगल करें' : 'Toggle smart matching'}
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
        <div id="filter-age" className="p-4 bg-muted/30 rounded-xl border">
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
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={18}
                  max={ageRange[1] - 1}
                  value={ageRange[0]}
                  onChange={(e) => {
                    const inputVal = e.target.value
                    // Allow empty or partial input while typing
                    if (inputVal === '' || /^\d*$/.test(inputVal)) {
                      const numVal = parseInt(inputVal) || 0
                      if (numVal > 0) {
                        setAgeRange([numVal, ageRange[1]])
                        setFilters({ ...filters, ageRange: [numVal, ageRange[1]] })
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // Validate on blur to ensure valid range
                    const val = Math.max(18, Math.min(parseInt(e.target.value) || 18, ageRange[1] - 1))
                    setAgeRange([val, ageRange[1]])
                    setFilters({ ...filters, ageRange: [val, ageRange[1]] })
                  }}
                  className="w-16 h-9 text-center px-2 font-medium"
                />
                <span className="text-muted-foreground">{t.years}</span>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={ageRange[0] + 1}
                  max={60}
                  value={ageRange[1]}
                  onChange={(e) => {
                    const inputVal = e.target.value
                    // Allow empty or partial input while typing
                    if (inputVal === '' || /^\d*$/.test(inputVal)) {
                      const numVal = parseInt(inputVal) || 0
                      if (numVal > 0) {
                        setAgeRange([ageRange[0], numVal])
                        setFilters({ ...filters, ageRange: [ageRange[0], numVal] })
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // Validate on blur to ensure valid range
                    const val = Math.min(60, Math.max(parseInt(e.target.value) || 60, ageRange[0] + 1))
                    setAgeRange([ageRange[0], val])
                    setFilters({ ...filters, ageRange: [ageRange[0], val] })
                  }}
                  className="w-16 h-9 text-center px-2 font-medium"
                />
                <span className="text-muted-foreground">{t.years}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Education & Career */}
        <div id="filter-education" className="p-4 bg-muted/30 rounded-xl border">
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
                options={dynamicFilterOptions.educationLevels.length > 0 ? dynamicFilterOptions.educationLevels : EDUCATION_OPTIONS}
                value={filters.educationLevels || []}
                onValueChange={(val) => setFilters({ ...filters, educationLevels: val.length > 0 ? val : undefined })}
                placeholder={t.any}
                searchPlaceholder={language === 'hi' ? 'शिक्षा खोजें...' : 'Search education...'}
                emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
                showAnyOption
                anyOptionLabel={anyOptionWithCount}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{language === 'hi' ? 'रोजगार स्थिति' : 'Employment Status'}</Label>
              <MultiSelect
                options={dynamicFilterOptions.employmentStatuses.length > 0 ? dynamicFilterOptions.employmentStatuses : EMPLOYMENT_STATUS_OPTIONS}
                value={filters.employmentStatuses || []}
                onValueChange={(val) => setFilters({ ...filters, employmentStatuses: val.length > 0 ? val : undefined })}
                placeholder={t.any}
                searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
                showAnyOption
                anyOptionLabel={anyOptionWithCount}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.occupation}</Label>
              <MultiSelect
                options={dynamicFilterOptions.occupations.length > 0 ? dynamicFilterOptions.occupations : OCCUPATION_PROFESSION_OPTIONS}
                value={filters.occupations || []}
                onValueChange={(val) => setFilters({ ...filters, occupations: val.length > 0 ? val : undefined })}
                placeholder={t.any}
                searchPlaceholder={language === 'hi' ? 'व्यवसाय खोजें...' : 'Search occupation...'}
                emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
                showAnyOption
                anyOptionLabel={anyOptionWithCount}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div id="filter-location" className="p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-background rounded-lg border">
              <Globe size={16} className="text-primary" />
            </div>
            <h4 className="font-semibold">{t.locationFilters}</h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.country}</Label>
              <MultiSelect
                options={locationOptionsWithCounts.countries.length > 0 ? locationOptionsWithCounts.countries : COUNTRY_OPTIONS}
                value={filters.countries || []}
                onValueChange={(val) => setFilters({ ...filters, countries: val.length > 0 ? val : undefined, states: undefined, cities: undefined })}
                placeholder={t.any}
                searchPlaceholder={language === 'hi' ? 'देश खोजें...' : 'Search country...'}
                emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
                showAnyOption
                anyOptionLabel={anyOptionWithCount}
              />
              {locationOptionsWithCounts.countries.length === 0 && (
                <p className="text-xs text-muted-foreground">{t.noProfilesInLocation}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.state}</Label>
              {filters.countries && filters.countries.length > 0 ? (
                <MultiSelect
                  options={stateOptionsWithCounts.length > 0 ? stateOptionsWithCounts : getStateOptionsForCountries(filters.countries)}
                  value={filters.states || []}
                  onValueChange={(val) => setFilters({ ...filters, states: val.length > 0 ? val : undefined, cities: undefined })}
                  placeholder={t.any}
                  searchPlaceholder={language === 'hi' ? 'राज्य खोजें...' : 'Search state...'}
                  emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
                  showAnyOption
                  anyOptionLabel={anyOptionWithCount}
                />
              ) : (
                <div className="h-10 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-md border border-dashed flex items-center">
                  {language === 'hi' ? 'पहले देश चुनें' : 'Select country first'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.city}</Label>
              {filters.states && filters.states.length > 0 ? (
                <MultiSelect
                  options={cityOptionsWithCounts.length > 0 ? cityOptionsWithCounts : getCityOptionsForStates(filters.states)}
                  value={filters.cities || []}
                  onValueChange={(val) => setFilters({ ...filters, cities: val.length > 0 ? val : undefined })}
                  placeholder={t.any}
                  searchPlaceholder={language === 'hi' ? 'शहर खोजें...' : 'Search city...'}
                  emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
                  showAnyOption
                  anyOptionLabel={anyOptionWithCount}
                />
              ) : (
                <div className="h-10 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-md border border-dashed flex items-center">
                  {language === 'hi' ? 'पहले राज्य चुनें' : 'Select state first'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Religion & Caste */}
        <div id="filter-religion" className="p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-background rounded-lg border">
              <Users size={16} className="text-primary" />
            </div>
            <h4 className="font-semibold">{t.basicFilters}</h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.religion}</Label>
              <MultiSelect
                options={dynamicFilterOptions.religions.length > 0 ? dynamicFilterOptions.religions : RELIGION_OPTIONS}
                value={filters.religions || []}
                onValueChange={(val) => setFilters({ ...filters, religions: val.length > 0 ? val : undefined, religion: undefined })}
                placeholder={t.any}
                searchPlaceholder={language === 'hi' ? 'धर्म खोजें...' : 'Search religion...'}
                emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
                showAnyOption
                anyOptionLabel={anyOptionWithCount}
              />
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
              <MultiSelect
                options={dynamicFilterOptions.motherTongues.length > 0 ? dynamicFilterOptions.motherTongues : MOTHER_TONGUE_OPTIONS}
                value={filters.motherTongues || []}
                onValueChange={(val) => setFilters({ ...filters, motherTongues: val.length > 0 ? val : undefined })}
                placeholder={t.any}
                searchPlaceholder={language === 'hi' ? 'मातृभाषा खोजें...' : 'Search mother tongue...'}
                emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
                showAnyOption
                anyOptionLabel={anyOptionWithCount}
              />
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
        <div id="filter-lifestyle" className="p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-background rounded-lg border">
              <Heart size={16} className="text-primary" />
            </div>
            <h4 className="font-semibold">{t.lifestyleFilters}</h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.diet}</Label>
              <MultiSelect
                options={dynamicFilterOptions.dietPreferences.length > 0 ? dynamicFilterOptions.dietPreferences : DIET_PREFERENCE_OPTIONS}
                value={filters.dietPreferences || []}
                onValueChange={(val) => setFilters({ ...filters, dietPreferences: val.length > 0 ? val as DietPreference[] : undefined })}
                placeholder={t.any}
                searchPlaceholder={language === 'hi' ? 'आहार खोजें...' : 'Search diet...'}
                emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
                showAnyOption
                anyOptionLabel={anyOptionWithCount}
              />
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
                    setFilters({ ...filters, drinkingHabit: val as DrinkingHabit })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={anyOptionWithCount} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{anyOptionWithCount}</SelectItem>
                  {(dynamicFilterOptions.drinkingHabits.length > 0 ? dynamicFilterOptions.drinkingHabits : DRINKING_HABIT_OPTIONS).map((option) => (
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
                    setFilters({ ...filters, smokingHabit: val as SmokingHabit })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={anyOptionWithCount} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{anyOptionWithCount}</SelectItem>
                  {(dynamicFilterOptions.smokingHabits.length > 0 ? dynamicFilterOptions.smokingHabits : SMOKING_HABIT_OPTIONS).map((option) => (
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
            onValueChange={(value) => {
              if (value === 'any') {
                const { disability: _disability, ...rest } = filters
                setFilters(rest)
              } else {
                setFilters({ ...filters, disability: value || undefined })
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={anyOptionWithCount} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{anyOptionWithCount}</SelectItem>
              <SelectItem value="no">{t.disabilityNo}</SelectItem>
              <SelectItem value="yes">{t.disabilityYes}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Filters - Lightning bolt section */}
        <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-200/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-background rounded-lg border border-blue-200">
              <Lightning size={16} className="text-blue-600" weight="fill" />
            </div>
            <h4 className="font-semibold">{t.quickFilters}</h4>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-background/80 rounded-lg border cursor-pointer hover:bg-background transition-colors">
              <Checkbox 
                id="onlineRecently"
                checked={filters.onlineRecently || false}
                onCheckedChange={(checked) => setFilters({ ...filters, onlineRecently: !!checked })}
              />
              <span className="text-sm flex-1">{t.activeRecently}</span>
              <Clock size={16} className="text-green-500" />
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-background/80 rounded-lg border cursor-pointer hover:bg-background transition-colors">
              <Checkbox 
                id="hasNewPhoto"
                checked={filters.hasNewPhoto || false}
                onCheckedChange={(checked) => setFilters({ ...filters, hasNewPhoto: !!checked })}
              />
              <span className="text-sm flex-1">{t.newPhotos}</span>
              <Camera size={16} className="text-purple-500" />
            </label>
          </div>
        </div>

        {/* Activity Filters - Recently Joined, Last Active */}
        <div className="p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-background rounded-lg border">
              <Clock size={16} className="text-primary" />
            </div>
            <h4 className="font-semibold">{language === 'hi' ? 'सक्रियता फ़िल्टर' : 'Activity Filters'}</h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.recentlyJoined}</Label>
              <Select 
                value={filters.recentlyJoined || ''} 
                onValueChange={(val: string) => {
                  if (val === 'any') {
                    const { recentlyJoined: _, ...rest } = filters
                    setFilters(rest)
                  } else {
                    setFilters({ ...filters, recentlyJoined: val as '7days' | '15days' | '30days' })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.any} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t.any}</SelectItem>
                  <SelectItem value="7days">{t.last7Days}</SelectItem>
                  <SelectItem value="15days">{t.last15Days}</SelectItem>
                  <SelectItem value="30days">{t.last30Days}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.lastActive}</Label>
              <Select 
                value={filters.lastActive || ''} 
                onValueChange={(val: string) => {
                  if (val === 'any') {
                    const { lastActive: _, ...rest } = filters
                    setFilters(rest)
                  } else {
                    setFilters({ ...filters, lastActive: val as '7days' | '30days' | '60days' | '90days' })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.any} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t.any}</SelectItem>
                  <SelectItem value="7days">{t.last7Days}</SelectItem>
                  <SelectItem value="30days">{t.last30Days}</SelectItem>
                  <SelectItem value="60days">{t.last60Days}</SelectItem>
                  <SelectItem value="90days">{t.last90Days}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Income & Height Filters */}
        <div className="p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-background rounded-lg border">
              <CurrencyInr size={16} className="text-primary" />
            </div>
            <h4 className="font-semibold">{language === 'hi' ? 'आय और ऊंचाई' : 'Income & Height'}</h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.incomeRange} ({t.lakhs})</Label>
              <div className="px-1">
                <Slider
                  value={incomeRange}
                  onValueChange={(value) => {
                    setIncomeRange(value as [number, number])
                    setFilters({ ...filters, incomeRange: value as [number, number] })
                  }}
                  min={0}
                  max={100}
                  step={5}
                  className="my-2"
                />
                <div className="flex justify-between mt-2 text-xs">
                  <span className="px-2 py-0.5 bg-background rounded border">{incomeRange[0]} {t.lakhs}</span>
                  <span className="px-2 py-0.5 bg-background rounded border">{incomeRange[1]}+ {t.lakhs}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.heightRange} ({t.cm})</Label>
              <div className="px-1">
                <Slider
                  value={heightRange}
                  onValueChange={(value) => {
                    setHeightRange(value as [number, number])
                    setFilters({ ...filters, heightRange: value as [number, number] })
                  }}
                  min={140}
                  max={200}
                  step={1}
                  className="my-2"
                />
                <div className="flex justify-between mt-2 text-xs">
                  <span className="px-2 py-0.5 bg-background rounded border">{heightRange[0]} {t.cm}</span>
                  <span className="px-2 py-0.5 bg-background rounded border">{heightRange[1]} {t.cm}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Quality Filter */}
        <div className="p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-background rounded-lg border">
              <UserCheck size={16} className="text-primary" />
            </div>
            <h4 className="font-semibold">{t.profileCompleteness}</h4>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{t.minCompleteness}</Label>
            <Select 
              value={filters.profileCompleteness?.toString() || ''} 
              onValueChange={(val: string) => {
                if (val === 'any' || !val) {
                  const { profileCompleteness: _, ...rest } = filters
                  setFilters(rest)
                } else {
                  setFilters({ ...filters, profileCompleteness: parseInt(val, 10) })
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.any} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t.any}</SelectItem>
                <SelectItem value="50">50%+</SelectItem>
                <SelectItem value="70">70%+</SelectItem>
                <SelectItem value="80">80%+</SelectItem>
                <SelectItem value="90">90%+</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
        <div className="sticky bottom-0 bg-background pt-4 pb-2 border-t mt-2 space-y-3">
          {/* Draft Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={saveFilterDraft} 
              className="flex-1 h-9 text-sm"
            >
              <FloppyDisk size={14} className="mr-1.5" />
              {t.saveDraft}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadFilterDraft} 
              disabled={!hasSavedDraft}
              className="flex-1 h-9 text-sm"
            >
              <ArrowCounterClockwise size={14} className="mr-1.5" />
              {t.loadDraft}
              {hasSavedDraft && (
                <span className="ml-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
              )}
            </Button>
          </div>
          
          {/* Main Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={() => setShowFilters(false)} className="flex-1 h-11 text-base font-medium">
              {t.applyFilters}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({})
                setAgeRange([18, 60])
                setIncomeRange([0, 100])
                setHeightRange([140, 200])
              }} 
              className="flex-1 h-11 text-base"
            >
              <X size={16} className="mr-2" />
              {t.clearFilters}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <Sheet open={showFilters} onOpenChange={setShowFilters} modal={false}>
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
            <SheetContent className="w-[350px] sm:w-[400px]" allowBackgroundInteraction aria-describedby="filter-description">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Funnel size={20} />
                  {t.filters}
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary">{activeFilterCount} active</Badge>
                  )}
                </SheetTitle>
                <SheetDescription id="filter-description">
                  {/* Live result count in filter panel */}
                  {sortedProfiles.length.toLocaleString()} {t.matchesFound}
                </SheetDescription>
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
              className="pl-10 pr-10"
            />
            {/* Show spinner when search is debouncing */}
            {searchQuery !== debouncedSearchQuery && (
              <CircleNotch size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
            {/* Clear search button */}
            {searchQuery && searchQuery === debouncedSearchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                title={language === 'hi' ? 'खोज साफ़ करें' : 'Clear search'}
                aria-label={language === 'hi' ? 'खोज साफ़ करें' : 'Clear search'}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              {sortedProfiles.length.toLocaleString()} {t.matchesFound}
            </span>
            {hasPartnerPreferences && usePartnerPreferences && (
              <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
                <Sparkle size={12} className="mr-1 text-primary" weight="fill" />
                {t.smartMatching}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SortAscending size={14} className="mr-1" />
                <SelectValue placeholder={t.sortBy} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t.sortNewest}</SelectItem>
                <SelectItem value="age-asc">{t.sortAgeAsc}</SelectItem>
                <SelectItem value="age-desc">{t.sortAgeDesc}</SelectItem>
                <SelectItem value="name-asc">{t.sortNameAsc}</SelectItem>
                <SelectItem value="compatibility">{t.sortCompatibility}</SelectItem>
              </SelectContent>
            </Select>
            
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
                  setIncomeRange([0, 100])
                  setHeightRange([140, 200])
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} className="mr-1" />
                {t.clearFilters}
              </Button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {isFiltering && (
          <div className="flex items-center justify-center py-12">
            <CircleNotch size={32} className="animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">{language === 'hi' ? 'फ़िल्टर कर रहा है...' : 'Filtering...'}</span>
          </div>
        )}

        {!isFiltering && sortedProfiles.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <MagnifyingGlass size={32} className="text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground mb-2">{t.noMatches}</p>
                <p className="text-muted-foreground text-sm mb-6">{t.adjustFilters}</p>
                
                {/* Diagnostic feedback */}
                {filterDiagnostics && (
                  <div className="text-left space-y-4">
                    {filterDiagnostics.totalProfiles > 0 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          <Info size={14} className="inline mr-2" />
                          {language === 'hi' 
                            ? `${filterDiagnostics.totalProfiles} प्रोफाइल उपलब्ध हैं, लेकिन आपके फ़िल्टर से कोई मेल नहीं खाता`
                            : `${filterDiagnostics.totalProfiles} profiles available, but none match your current filters`}
                        </p>
                      </div>
                    )}
                    
                    {filterDiagnostics.smartMatchingOn && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                          <Sparkle size={14} className="mt-0.5 flex-shrink-0" weight="fill" />
                          <span>
                            {language === 'hi' 
                              ? 'स्मार्ट मैचिंग आपकी पार्टनर प्राथमिकताओं का उपयोग कर रही है। अधिक परिणामों के लिए इसे बंद करें।'
                              : 'Smart Matching is using your partner preferences. Turn it OFF to see more results.'}
                          </span>
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400"
                          onClick={() => setUsePartnerPreferences(false)}
                        >
                          {language === 'hi' ? 'स्मार्ट मैचिंग बंद करें' : 'Turn OFF Smart Matching'}
                        </Button>
                      </div>
                    )}
                    
                    {filterDiagnostics.suggestions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          {language === 'hi' ? 'संभावित समस्याएं (क्लिक करें फ़िल्टर संपादित करने के लिए):' : 'Possible issues (click to edit filter):'}
                        </p>
                        {filterDiagnostics.suggestions.map((issue, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleIssueClick(issue.filter)}
                            className="w-full p-2 bg-muted/50 hover:bg-muted rounded-lg text-sm flex items-start gap-2 text-left transition-colors cursor-pointer group border border-transparent hover:border-primary/30"
                          >
                            <WarningCircle size={14} className="mt-0.5 text-orange-500 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="font-medium group-hover:text-primary transition-colors">{issue.label}:</span>{' '}
                              <span className="text-muted-foreground">{issue.suggestion}</span>
                              {issue.matchCount === 0 && (
                                <span className="text-red-500 ml-1">({language === 'hi' ? '0 मैच' : '0 matches'})</span>
                              )}
                            </div>
                            <ArrowRight size={14} className="mt-0.5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Quick actions */}
                    <div className="pt-4 border-t flex flex-wrap gap-2 justify-center">
                      {activeFilterCount > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setFilters({})
                            setAgeRange([18, 60])
                            setIncomeRange([0, 100])
                            setHeightRange([140, 200])
                          }}
                        >
                          <X size={14} className="mr-1" />
                          {language === 'hi' ? 'सभी फ़िल्टर साफ़ करें' : 'Clear All Filters'}
                        </Button>
                      )}
                      {usePartnerPreferences && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => setUsePartnerPreferences(false)}
                        >
                          {language === 'hi' ? 'सभी प्रोफाइल दिखाएं' : 'Show All Profiles'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : !isFiltering && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {paginatedProfiles.map((profile) => {
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
                    interactionStatus={status.interactionStatus}
                    onUpgrade={onUpgrade}
                    currentUserProfile={currentUserProfile}
                  />
                )
              })}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <CaretLeft size={16} />
                  {language === 'hi' ? 'पिछला' : 'Previous'}
                </Button>
                
                {/* First page button for large datasets */}
                {totalPages > 10 && currentPage > 4 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      className="w-9 h-9 p-0"
                    >
                      1
                    </Button>
                    <span className="text-muted-foreground">...</span>
                  </>
                )}
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-9 h-9 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                {/* Last page button for large datasets */}
                {totalPages > 10 && currentPage < totalPages - 3 && (
                  <>
                    <span className="text-muted-foreground">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-9 h-9 p-0"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  {language === 'hi' ? 'अगला' : 'Next'}
                  <CaretRight size={16} />
                </Button>
              </div>
            )}
            
            {/* Jump to page - for large datasets */}
            {totalPages > 10 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-sm text-muted-foreground">
                  {language === 'hi' ? 'पृष्ठ पर जाएं:' : 'Go to page:'}
                </span>
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
                  className="w-20 h-8 text-center"
                  placeholder="..."
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleJumpToPage}
                  disabled={!jumpToPage}
                  className="h-8"
                >
                  {language === 'hi' ? 'जाएं' : 'Go'}
                </Button>
              </div>
            )}
            
            {/* Page info */}
            {totalPages > 1 && (
              <p className="text-center text-sm text-muted-foreground mt-3">
                {language === 'hi' 
                  ? `${sortedProfiles.length.toLocaleString()} में से ${((currentPage - 1) * PROFILES_PER_PAGE + 1).toLocaleString()}-${Math.min(currentPage * PROFILES_PER_PAGE, sortedProfiles.length).toLocaleString()} दिखा रहा है`
                  : `Showing ${((currentPage - 1) * PROFILES_PER_PAGE + 1).toLocaleString()}-${Math.min(currentPage * PROFILES_PER_PAGE, sortedProfiles.length).toLocaleString()} of ${sortedProfiles.length.toLocaleString()}`}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
