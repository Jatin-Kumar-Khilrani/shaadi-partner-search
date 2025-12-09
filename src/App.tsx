import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { List, Heart, UserPlus, Users, BookOpen, HandHeart, MagnifyingGlass, ShieldCheck } from '@phosphor-icons/react'
import { HeroSearch } from '@/components/HeroSearch'
import { ProfileCard } from '@/components/ProfileCard'
import { ProfileDetailDialog } from '@/components/ProfileDetailDialog'
import { RegistrationDialog } from '@/components/RegistrationDialog'
import { VolunteerDirectory } from '@/components/VolunteerDirectory'
import { Resources } from '@/components/Resources'
import { Support } from '@/components/Support'
import type { Profile, SearchFilters, Volunteer, Resource } from '@/types/profile'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'

type View = 'home' | 'search-results' | 'volunteers' | 'resources' | 'support'

function App() {
  const [profiles, setProfiles] = useKV<Profile[]>('profiles', [])
  const [volunteers] = useKV<Volunteer[]>('volunteers', [])
  const [resources] = useKV<Resource[]>('resources', [])
  
  const [currentView, setCurrentView] = useState<View>('home')
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({})
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters)
    setCurrentView('search-results')
  }

  const filteredProfiles = useMemo(() => {
    if (!profiles) return []
    
    return profiles.filter(profile => {
      if (profile.status !== 'verified') return false
      
      if (searchFilters.gender && profile.gender !== searchFilters.gender) return false
      if (searchFilters.ageMin && profile.age < searchFilters.ageMin) return false
      if (searchFilters.ageMax && profile.age > searchFilters.ageMax) return false
      if (searchFilters.location && !profile.location.toLowerCase().includes(searchFilters.location.toLowerCase()) && 
          !profile.country.toLowerCase().includes(searchFilters.location.toLowerCase())) return false
      if (searchFilters.gotra && !profile.gotra?.toLowerCase().includes(searchFilters.gotra.toLowerCase())) return false
      if (searchFilters.education && !profile.education.toLowerCase().includes(searchFilters.education.toLowerCase())) return false
      
      return true
    })
  }, [profiles, searchFilters])

  const handleRegisterProfile = (profileData: Omit<Profile, 'id' | 'status' | 'trustLevel' | 'createdAt'>) => {
    const newProfile: Profile = {
      ...profileData,
      id: `profile-${Date.now()}`,
      status: 'pending',
      trustLevel: 1,
      createdAt: new Date().toISOString()
    }
    setProfiles(current => [...(current || []), newProfile])
  }

  const navItems = [
    { label: 'मुखपृष्ठ', icon: <Heart size={20} weight="fill" />, view: 'home' as View },
    { label: 'स्वयंसेवक', icon: <Users size={20} weight="fill" />, view: 'volunteers' as View },
    { label: 'संसाधन', icon: <BookOpen size={20} weight="fill" />, view: 'resources' as View },
    { label: 'सहयोग', icon: <HandHeart size={20} weight="fill" />, view: 'support' as View }
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Heart size={32} weight="fill" className="text-primary" />
              <div className="hidden sm:block">
                <div className="font-bold text-lg leading-tight">ShaadiPartnerSearch</div>
                <div className="text-xs text-muted-foreground">सिंधी मॅट्रिमोनी</div>
              </div>
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Button
                key={item.view}
                variant={currentView === item.view ? 'default' : 'ghost'}
                onClick={() => setCurrentView(item.view)}
                className="gap-2"
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
            <Button onClick={() => setShowRegistration(true)} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
              <UserPlus size={20} weight="bold" />
              पंजीकरण करें
            </Button>
          </nav>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <List size={24} weight="bold" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-2 mt-8">
                {navItems.map((item) => (
                  <Button
                    key={item.view}
                    variant={currentView === item.view ? 'default' : 'ghost'}
                    onClick={() => {
                      setCurrentView(item.view)
                      setMobileMenuOpen(false)
                    }}
                    className="justify-start gap-2"
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                ))}
                <Button 
                  onClick={() => {
                    setShowRegistration(true)
                    setMobileMenuOpen(false)
                  }} 
                  className="justify-start gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <UserPlus size={20} weight="bold" />
                  पंजीकरण करें
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        {currentView === 'home' && (
          <>
            <HeroSearch onSearch={handleSearch} />
            
            <section className="container mx-auto px-4 md:px-8 py-16">
              <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
                  हमारी सेवा क्यों विशेष है
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                          <ShieldCheck size={32} weight="fill" className="text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl mb-2">100% निःशुल्क पंजीकरण</h3>
                          <p className="text-muted-foreground">कोई विज्ञापन, कोई सदस्यता शुल्क नहीं। पूरी तरह से समुदाय सेवा।</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-teal/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-teal/10">
                          <Users size={32} weight="fill" className="text-teal" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl mb-2">केवल सिंधी समुदाय</h3>
                          <p className="text-muted-foreground">सिंधी परंपराओं और संस्कृति को ध्यान में रखकर बनाया गया।</p>
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
                          <h3 className="font-bold text-xl mb-2">स्वयंसेवकों द्वारा संचालित</h3>
                          <p className="text-muted-foreground">हर शहर में समुदाय के सदस्य परिवारों की मदद करते हैं।</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                          <BookOpen size={32} weight="fill" className="text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl mb-2">पारंपरिक और आधुनिक</h3>
                          <p className="text-muted-foreground">पुरानी मूल्यों के साथ नई तकनीक का संगम।</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert className="bg-primary/5 border-primary/20">
                  <ShieldCheck size={20} weight="fill" />
                  <AlertDescription className="text-base">
                    <strong>गोपनीयता और सुरक्षा:</strong> सभी प्रोफाइल की मैन्युअल जांच • कोई डेटा बिक्री नहीं • 
                    केवल सत्यापित उपयोगकर्ताओं को संपर्क की अनुमति • रिपोर्ट/ब्लॉक विकल्प उपलब्ध
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
                  <h2 className="text-3xl font-bold mb-2">खोज परिणाम</h2>
                  <p className="text-muted-foreground">
                    {filteredProfiles.length} प्रोफाइल मिली
                  </p>
                </div>
                <Button variant="outline" onClick={() => setCurrentView('home')}>
                  <MagnifyingGlass size={20} className="mr-2" />
                  नई खोज
                </Button>
              </div>

              {filteredProfiles.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    कोई प्रोफाइल नहीं मिली। कृपया अपने खोज मानदंड बदलें या बाद में पुनः प्रयास करें।
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProfiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      onViewProfile={setSelectedProfile}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {currentView === 'volunteers' && <VolunteerDirectory volunteers={volunteers || []} />}
        {currentView === 'resources' && <Resources resources={resources || []} />}
        {currentView === 'support' && <Support />}
      </main>

      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart size={24} weight="fill" className="text-primary" />
              <span className="font-bold text-lg">ShaadiPartnerSearch</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              सिंधी समाज के लिए, सिंधी समाज द्वारा — विवाह एक पवित्र बंधन है, व्यापार नहीं।
            </p>
            <p className="text-xs text-muted-foreground">
              © 2024 ShaadiPartnerSearch. एक निःस्वार्थ समुदाय सेवा।
            </p>
          </div>
        </div>
      </footer>

      <ProfileDetailDialog
        profile={selectedProfile}
        open={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
      />

      <RegistrationDialog
        open={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSubmit={handleRegisterProfile}
      />

      <Toaster position="top-right" />
    </div>
  )
}

export default App