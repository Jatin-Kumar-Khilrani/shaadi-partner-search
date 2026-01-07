import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MagnifyingGlass, Heart, Users, ShieldCheck, Brain } from '@phosphor-icons/react'
import { useState } from 'react'
import type { SearchFilters } from '@/types/profile'
import { COUNTRY_OPTIONS, getStateOptionsForCountries, RELIGION_OPTIONS, MOTHER_TONGUE_OPTIONS } from '@/components/ui/multi-select'

interface MembershipSettings {
  sixMonthPrice: number
  oneYearPrice: number
  sixMonthDuration: number
  oneYearDuration: number
  discountPercentage: number
  discountEnabled: boolean
  discountEndDate: string | null
}

interface HeroSearchProps {
  onSearch: (filters: SearchFilters) => void
  language?: 'hi' | 'en'
  membershipSettings?: MembershipSettings
}

export function HeroSearch({ onSearch, language = 'hi', membershipSettings }: HeroSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({})

  const handleSearch = () => {
    // Validate age range - swap if min > max
    const validatedFilters = { ...filters }
    if (validatedFilters.ageMin && validatedFilters.ageMax && validatedFilters.ageMin > validatedFilters.ageMax) {
      // Swap the values
      const temp = validatedFilters.ageMin
      validatedFilters.ageMin = validatedFilters.ageMax
      validatedFilters.ageMax = temp
    }
    onSearch(validatedFilters)
  }

  // Dynamic pricing from membership settings
  const sixMonthPrice = membershipSettings?.sixMonthPrice || 500
  const oneYearPrice = membershipSettings?.oneYearPrice || 900

  const t = {
    title: language === 'hi' ? 'अपना जीवनसाथी खोजें' : 'Find Your Life Partner',
    subtitle1: language === 'hi' ? 'विवाह एक पवित्र बंधन है।' : 'Marriage is a sacred bond.',
    subtitle2: language === 'hi' ? 'ShaadiPartnerSearch — मॅट्रिमोनी प्लेटफॉर्म' : 'ShaadiPartnerSearch — Matrimony Platform',
    searchTitle: language === 'hi' ? 'जीवनसाथी खोजें' : 'Find Life Partner',
    searchDesc: language === 'hi' ? 'सरल और सटीक खोज — अपने मानदंड भरें' : 'Simple and accurate search — fill your criteria',
    gender: language === 'hi' ? 'लिंग' : 'Gender',
    country: language === 'hi' ? 'देश' : 'Country',
    state: language === 'hi' ? 'राज्य' : 'State',
    age: language === 'hi' ? 'आयु' : 'Age',
    to: language === 'hi' ? 'से' : 'to',
    religion: language === 'hi' ? 'धर्म' : 'Religion',
    motherTongue: language === 'hi' ? 'मातृभाषा' : 'Mother Tongue',
    caste: language === 'hi' ? 'जाति' : 'Caste',
    optional: language === 'hi' ? 'वैकल्पिक' : 'Optional',
    select: language === 'hi' ? 'चुनें' : 'Select',
    any: language === 'hi' ? 'कोई भी' : 'Any',
    selectCountryFirst: language === 'hi' ? 'पहले देश चुनें' : 'Select country first',
    male: language === 'hi' ? 'पुरुष' : 'Male',
    female: language === 'hi' ? 'महिला' : 'Female',
    searchButton: language === 'hi' ? 'खोजें' : 'Search',
    feature1: language === 'hi' ? 'किफायती सदस्यता' : 'Affordable Membership',
    feature1Desc: language === 'hi' 
      ? `6 महीने ₹${sixMonthPrice} या 1 साल ₹${oneYearPrice} — कोई छुपी लागत नहीं` 
      : `6 months ₹${sixMonthPrice} or 1 year ₹${oneYearPrice} — no hidden costs`,
    feature2: language === 'hi' ? 'सुरक्षित और सत्यापित' : 'Secure and Verified',
    feature2Desc: language === 'hi' ? 'हर प्रोफ़ाइल AI और अनुभवी पेशेवरों द्वारा सत्यापित' : 'Every profile verified by AI and experienced professionals',
    feature3: language === 'hi' ? 'सभी समुदायों के लिए' : 'For All Communities',
    feature3Desc: language === 'hi' ? 'सभी धर्मों और समुदायों का स्वागत' : 'All religions and communities welcome',
    feature4: language === 'hi' ? 'विवाह तैयारी' : 'Marriage Readiness',
    feature4Desc: language === 'hi' ? 'AI-संचालित आत्म-खोज और EQ मूल्यांकन' : 'AI-powered self-discovery & EQ assessment',
    castePlaceholder: language === 'hi' ? 'यदि ज्ञात हो' : 'If known',
  }

  // Get state options based on selected country
  const stateOptions = filters.country ? getStateOptionsForCountries([filters.country]) : []

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
        }} />
      </div>
      
      <div className="relative container mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
            {t.title}
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-4">
            {t.subtitle1}
          </p>
          <p className="text-lg text-primary-foreground/80">
            {t.subtitle2}
          </p>
        </div>

        <Card className="max-w-3xl mx-auto shadow-2xl border-2">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <MagnifyingGlass size={28} weight="bold" />
              {t.searchTitle}
            </CardTitle>
            <CardDescription className="text-base">
              {t.searchDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-5">
              {/* Row 1: Gender, Country, State */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">{t.gender}</Label>
                  <Select onValueChange={(value: 'male' | 'female') => setFilters({ ...filters, gender: value })}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder={t.select} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t.male}</SelectItem>
                      <SelectItem value="female">{t.female}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">{t.country}</Label>
                  <Select 
                    value={filters.country || ''} 
                    onValueChange={(value) => setFilters({ ...filters, country: value || undefined, state: undefined })}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder={t.select} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t.any}</SelectItem>
                      {COUNTRY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">{t.state}</Label>
                  <Select 
                    value={filters.state || ''} 
                    onValueChange={(value) => setFilters({ ...filters, state: value || undefined })}
                    disabled={!filters.country || filters.country === 'any' || stateOptions.length === 0}
                  >
                    <SelectTrigger id="state">
                      <SelectValue placeholder={filters.country && filters.country !== 'any' ? t.select : t.selectCountryFirst} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t.any}</SelectItem>
                      {stateOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Age Range (compact inline), Religion, Mother Tongue */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t.age}</Label>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={filters.ageMin?.toString() || ''} 
                      onValueChange={(value) => setFilters({ ...filters, ageMin: parseInt(value) || undefined })}
                    >
                      <SelectTrigger className="w-[75px]">
                        <SelectValue placeholder="21" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 53 }, (_, i) => 18 + i).map((age) => (
                          <SelectItem key={age} value={age.toString()}>{age}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground text-sm font-medium">{t.to}</span>
                    <Select 
                      value={filters.ageMax?.toString() || ''} 
                      onValueChange={(value) => setFilters({ ...filters, ageMax: parseInt(value) || undefined })}
                    >
                      <SelectTrigger className="w-[75px]">
                        <SelectValue placeholder="35" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 53 }, (_, i) => 18 + i).map((age) => (
                          <SelectItem key={age} value={age.toString()}>{age}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="religion">{t.religion}</Label>
                  <Select 
                    value={filters.religion || ''} 
                    onValueChange={(value) => setFilters({ ...filters, religion: value === 'any' ? undefined : value })}
                  >
                    <SelectTrigger id="religion">
                      <SelectValue placeholder={t.select} />
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
                  <Label htmlFor="motherTongue">{t.motherTongue}</Label>
                  <Select 
                    value={filters.motherTongue || ''} 
                    onValueChange={(value) => setFilters({ ...filters, motherTongue: value === 'any' ? undefined : value })}
                  >
                    <SelectTrigger id="motherTongue">
                      <SelectValue placeholder={t.select} />
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
              </div>

              {/* Row 3: Caste (optional) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="caste">{t.caste} ({t.optional})</Label>
                  <Input
                    id="caste"
                    placeholder={t.castePlaceholder}
                    value={filters.caste || ''}
                    onChange={(e) => setFilters({ ...filters, caste: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                <MagnifyingGlass size={20} weight="bold" className="mr-2" />
                {t.searchButton}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="max-w-6xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Heart size={32} weight="fill" />}
            title={t.feature1}
            description={t.feature1Desc}
          />
          <FeatureCard
            icon={<ShieldCheck size={32} weight="fill" />}
            title={t.feature2}
            description={t.feature2Desc}
          />
          <FeatureCard
            icon={<Users size={32} weight="fill" />}
            title={t.feature3}
            description={t.feature3Desc}
          />
          <FeatureCard
            icon={<Brain size={32} weight="fill" />}
            title={t.feature4}
            description={t.feature4Desc}
            highlight
          />
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description, highlight }: { icon: React.ReactNode; title: string; description: string; highlight?: boolean }) {
  return (
    <Card className={`backdrop-blur hover:shadow-lg transition-all duration-300 ${highlight ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 ring-2 ring-amber-200/50 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-700' : 'bg-white/95 border-white/50'}`}>
      <CardContent className="pt-6 text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${highlight ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-accent/20 text-accent'}`}>
          {icon}
        </div>
        {highlight && (
          <span className="inline-block px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full mb-2">NEW</span>
        )}
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
