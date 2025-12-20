import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Buildings, 
  Camera, 
  Phone, 
  Envelope,
  PaintBrush, 
  MagnifyingGlass, 
  UserSound, 
  MapPin,
  ChefHat,
  MusicNote,
  Star,
  CurrencyInr,
  Confetti
} from '@phosphor-icons/react'
import type { WeddingService } from '@/types/profile'
import type { Language } from '@/lib/translations'

interface WeddingServicesProps {
  language: Language
}

const categoryIcons = {
  venue: <Buildings size={24} weight="fill" />,
  caterer: <ChefHat size={24} weight="fill" />,
  photographer: <Camera size={24} weight="fill" />,
  decorator: <PaintBrush size={24} weight="fill" />,
  mehandi: <PaintBrush size={24} weight="fill" />,
  makeup: <PaintBrush size={24} weight="fill" />,
  dj: <MusicNote size={24} weight="fill" />,
  priest: <UserSound size={24} weight="fill" />,
  'card-designer': <Confetti size={24} weight="fill" />,
  choreographer: <UserSound size={24} weight="fill" />,
  other: <Confetti size={24} weight="fill" />
}

const categoryLabels = {
  venue: 'विवाह स्थल / Venue',
  caterer: 'कैटरिंग / Catering',
  photographer: 'फोटोग्राफर / Photographer',
  decorator: 'सजावट / Decorator',
  mehandi: 'मेहँदी / Mehandi Artist',
  makeup: 'मेकअप / Makeup Artist',
  dj: 'डीजे / DJ',
  priest: 'पुजारी / Priest',
  'card-designer': 'कार्ड डिजाइनर / Card Designer',
  choreographer: 'कोरियोग्राफर / Choreographer',
  other: 'अन्य / Other'
}

export function WeddingServices({ language }: WeddingServicesProps) {
  const [services] = useKV<WeddingService[]>('wedding-services', [])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [selectedService, setSelectedService] = useState<WeddingService | null>(null)

  const filteredServices = (services || []).filter(service => {
    if (service.verificationStatus !== 'verified') return false
    if (selectedCategory !== 'all' && service.category !== selectedCategory) return false
    if (selectedCity && !service.city.toLowerCase().includes(selectedCity.toLowerCase())) return false
    return true
  })

  const handleViewDetails = (service: WeddingService) => {
    setSelectedService(service)
    setShowContactDialog(true)
  }

  const t = language === 'hi' ? {
    title: 'विवाह सेवाएं',
    subtitle: 'सत्यापित विवाह सेवा प्रदाताओं की डायरेक्टरी',
    consultationInfo: 'प्रत्येक सेवा प्रदाता से संपर्क करने के लिए केवल ₹200 परामर्श शुल्क।',
    category: 'श्रेणी',
    allCategories: 'सभी श्रेणियां',
    searchCity: 'शहर खोजें',
    noServices: 'इस श्रेणी या शहर में कोई सेवा उपलब्ध नहीं है।',
    contact: 'संपर्क करें',
    reviews: 'समीक्षाएं',
    consultationFee: 'परामर्श शुल्क',
    contactDetails: 'संपर्क विवरण',
    priceRange: 'मूल्य सीमा',
    close: 'बंद करें',
    call: 'कॉल करें',
    consultationNote: 'प्रारंभिक परामर्श और आवश्यकताओं की विस्तृत चर्चा के लिए। अंतिम बुकिंग शुल्क सीधे सेवा प्रदाता से तय करें।'
  } : {
    title: 'Wedding Services',
    subtitle: 'Directory of verified wedding service providers',
    consultationInfo: 'Only ₹200 consultation fee to contact each service provider.',
    category: 'Category',
    allCategories: 'All Categories',
    searchCity: 'Search City',
    noServices: 'No services available in this category or city.',
    contact: 'Contact',
    reviews: 'reviews',
    consultationFee: 'Consultation Fee',
    contactDetails: 'Contact Details',
    priceRange: 'Price Range',
    close: 'Close',
    call: 'Call Now',
    consultationNote: 'For initial consultation and detailed discussion of requirements. Final booking charges to be decided directly with the service provider.'
  }

  return (
    <section className="container mx-auto px-4 md:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
          {t.title}
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-8">
          {t.subtitle}
        </p>

        <Alert className="mb-8 bg-accent/10 border-accent">
          <CurrencyInr size={20} weight="bold" />
          <AlertDescription className="text-base">
            {t.consultationInfo}
          </AlertDescription>
        </Alert>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t.category}</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allCategories}</SelectItem>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <label className="text-sm font-medium mb-2 block">{t.searchCity}</label>
                <Input
                  placeholder={t.searchCity}
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="pr-10"
                />
                <MagnifyingGlass 
                  size={18} 
                  weight="bold"
                  className="absolute right-3 top-1/2 text-muted-foreground pointer-events-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(key)}
              className="h-auto py-3 flex flex-col items-center gap-2"
            >
              {categoryIcons[key as keyof typeof categoryIcons]}
              <span className="text-xs text-center leading-tight">
                {label.split(' / ')[0]}
              </span>
            </Button>
          ))}
        </div>

        {filteredServices.length === 0 ? (
          <Alert>
            <AlertDescription className="text-center py-8">
              {t.noServices}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      {categoryIcons[service.category]}
                    </div>
                    <Badge variant="secondary">
                      {categoryLabels[service.category].split(' / ')[0]}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl line-clamp-1">{service.businessName}</CardTitle>
                  <CardDescription className="line-clamp-2">{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={16} weight="fill" />
                    <span>{service.city}, {service.state}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <CurrencyInr size={16} weight="bold" />
                    <span>{service.priceRange}</span>
                  </div>

                  {service.rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star size={16} weight="fill" />
                        <span className="font-medium">{service.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({service.reviewCount} {t.reviews})
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <div className="text-xs text-center text-muted-foreground mb-2">
                      {t.consultationFee}: ₹{service.consultationFee}
                    </div>
                    <Button 
                      onClick={() => handleViewDetails(service)} 
                      className="w-full"
                    >
                      {t.contact}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-2xl">
          {selectedService && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    {categoryIcons[selectedService.category]}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">{selectedService.businessName}</DialogTitle>
                    <Badge variant="secondary" className="mt-1">
                      {categoryLabels[selectedService.category]}
                    </Badge>
                  </div>
                </div>
                <DialogDescription className="text-base">
                  {selectedService.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t.contactDetails}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin size={20} weight="fill" className="text-primary mt-0.5" />
                      <div>
                        <div className="font-medium">{selectedService.address}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedService.city}, {selectedService.state}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone size={20} weight="fill" className="text-primary" />
                      <a href={`tel:${selectedService.mobile}`} className="font-medium hover:text-primary">
                        {selectedService.mobile}
                      </a>
                    </div>

                    <div className="flex items-center gap-3">
                      <Envelope size={20} weight="fill" className="text-primary" />
                      <a href={`mailto:${selectedService.email}`} className="hover:text-primary">
                        {selectedService.email}
                      </a>
                    </div>

                    <div className="flex items-center gap-3">
                      <CurrencyInr size={20} weight="bold" className="text-primary" />
                      <div>
                        <div className="font-medium">{t.priceRange}: {selectedService.priceRange}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Alert className="bg-accent/10 border-accent">
                  <CurrencyInr size={20} weight="bold" />
                  <AlertDescription>
                    <strong>{t.consultationFee}: ₹{selectedService.consultationFee}</strong>
                    <p className="text-sm mt-1">
                      {t.consultationNote}
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setShowContactDialog(false)}
                    className="flex-1"
                  >
                    {t.close}
                  </Button>
                  <Button 
                    onClick={() => {
                      window.location.href = `tel:${selectedService.mobile}`
                    }}
                    className="flex-1"
                  >
                    <Phone size={18} weight="bold" className="mr-2" />
                    {t.call}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
