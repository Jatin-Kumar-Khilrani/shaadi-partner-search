import { useState, useMemo } from 'react'
import { useKV } from '@/hooks/useKV'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ProfileCard } from './ProfileCard'
import { MagnifyingGlass, Funnel, X } from '@phosphor-icons/react'
import type { Profile, SearchFilters, BlockedProfile } from '@/types/profile'
import type { Language } from '@/lib/translations'

interface MyMatchesProps {
  loggedInUserId: string | null
  profiles: Profile[]
  onViewProfile: (profile: Profile) => void
  language: Language
}

export function MyMatches({ loggedInUserId, profiles, onViewProfile, language }: MyMatchesProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [blockedProfiles] = useKV<BlockedProfile[]>('blockedProfiles', [])

  const currentUserProfile = profiles.find(p => p.id === loggedInUserId)

  const t = {
    title: language === 'hi' ? 'मेरे मैच' : 'My Matches',
    search: language === 'hi' ? 'खोजें' : 'Search',
    newMatches: language === 'hi' ? 'नए मैच' : 'New Matches',
    filters: language === 'hi' ? 'फ़िल्टर' : 'Filters',
    applyFilters: language === 'hi' ? 'लागू करें' : 'Apply Filters',
    clearFilters: language === 'hi' ? 'साफ़ करें' : 'Clear Filters',
    caste: language === 'hi' ? 'जाति' : 'Caste',
    community: language === 'hi' ? 'समुदाय' : 'Community',
    motherTongue: language === 'hi' ? 'मातृभाषा' : 'Mother Tongue',
    manglik: language === 'hi' ? 'मांगलिक' : 'Manglik',
    diet: language === 'hi' ? 'आहार' : 'Diet',
    drinking: language === 'hi' ? 'पीने की आदत' : 'Drinking',
    smoking: language === 'hi' ? 'धूम्रपान' : 'Smoking',
    veg: language === 'hi' ? 'शाकाहारी' : 'Vegetarian',
    nonVeg: language === 'hi' ? 'मांसाहारी' : 'Non-Vegetarian',
    never: language === 'hi' ? 'कभी नहीं' : 'Never',
    occasionally: language === 'hi' ? 'कभी-कभी' : 'Occasionally',
    yes: language === 'hi' ? 'हाँ' : 'Yes',
    no: language === 'hi' ? 'नहीं' : 'No',
    matchesFound: language === 'hi' ? 'मैच मिले' : 'matches found',
    noMatches: language === 'hi' ? 'कोई मैच नहीं मिला' : 'No matches found'
  }

  const filteredProfiles = useMemo(() => {
    if (!profiles || !currentUserProfile) return []
    
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
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!profile.fullName.toLowerCase().includes(query) &&
            !profile.location.toLowerCase().includes(query) &&
            !profile.profileId.toLowerCase().includes(query)) {
          return false
        }
      }
      
      if (filters.caste && !profile.caste?.toLowerCase().includes(filters.caste.toLowerCase())) return false
      if (filters.community && !profile.community?.toLowerCase().includes(filters.community.toLowerCase())) return false
      if (filters.motherTongue && !profile.motherTongue?.toLowerCase().includes(filters.motherTongue.toLowerCase())) return false
      if (filters.manglik !== undefined && profile.manglik !== filters.manglik) return false
      if (filters.dietPreference && profile.dietPreference !== filters.dietPreference) return false
      if (filters.drinkingHabit && profile.drinkingHabit !== filters.drinkingHabit) return false
      if (filters.smokingHabit && profile.smokingHabit !== filters.smokingHabit) return false
      
      return true
    })
  }, [profiles, currentUserProfile, searchQuery, filters, blockedProfiles])

  const FilterPanel = () => (
    <div className="space-y-6">
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
          value={filters.manglik !== undefined ? (filters.manglik ? 'yes' : 'no') : undefined} 
          onValueChange={(val) => {
            setFilters({ ...filters, manglik: val === 'yes' })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={t.manglik} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">{t.yes}</SelectItem>
            <SelectItem value="no">{t.no}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t.diet}</Label>
        <Select 
          value={filters.dietPreference || undefined} 
          onValueChange={(val: any) => {
            setFilters({ ...filters, dietPreference: val })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={t.diet} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="veg">{t.veg}</SelectItem>
            <SelectItem value="non-veg">{t.nonVeg}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t.drinking}</Label>
        <Select 
          value={filters.drinkingHabit || undefined} 
          onValueChange={(val: any) => {
            setFilters({ ...filters, drinkingHabit: val })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={t.drinking} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">{t.never}</SelectItem>
            <SelectItem value="occasionally">{t.occasionally}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t.smoking}</Label>
        <Select 
          value={filters.smokingHabit || undefined} 
          onValueChange={(val: any) => {
            setFilters({ ...filters, smokingHabit: val })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={t.smoking} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">{t.never}</SelectItem>
            <SelectItem value="occasionally">{t.occasionally}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setShowFilters(false)} className="flex-1">
          {t.applyFilters}
        </Button>
        <Button variant="outline" onClick={() => setFilters({})} className="flex-1">
          {t.clearFilters}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Funnel size={20} />
                {t.filters}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{t.filters}</SheetTitle>
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

        <div className="mb-4 text-muted-foreground">
          {filteredProfiles.length} {t.matchesFound}
        </div>

        {filteredProfiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t.noMatches}
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
