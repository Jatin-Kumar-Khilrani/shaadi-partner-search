import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Camera, 
  Confetti, 
  PaintBrush, 
  Sparkle, 
  UserSound, 
  Buildings, 
  ChefHat,
  Palette,
  FlowerLotus,
  MusicNote,
  MapPin,
  Phone,
  Envelope,
  CurrencyInr,
  Star,
  MagnifyingGlass,
  Info
} from '@phosphor-icons/react'
import type { WeddingService } from '@/types/profile'

interface WeddingServicesProps {
  services: WeddingService[]
}

const categoryIcons = {
  venue: <Buildings size={24} weight="duotone" />,
  caterer: <ChefHat size={24} weight="duotone" />,
  photographer: <Camera size={24} weight="duotone" />,
  decorator: <Palette size={24} weight="duotone" />,
  mehandi: <FlowerLotus size={24} weight="duotone" />,
  makeup: <Sparkle size={24} weight="duotone" />,
  dj: <MusicNote size={24} weight="duotone" />,
  priest: <FlowerLotus size={24} weight="duotone" />,
  'card-designer': <PaintBrush size={24} weight="duotone" />,
  choreographer: <UserSound size={24} weight="duotone" />,
  other: <Confetti size={24} weight="duotone" />
}

const categoryLabels = {
  venue: 'विवाह स्थल / Venue',
  caterer: 'कैटरिंग / Caterer',
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

export function WeddingServices({ services }: WeddingServicesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedService, setSelectedService] = useState<WeddingService | null>(null)
  const [showContactDialog, setShowContactDialog] = useState(false)

  const verifiedServices = services.filter(s => s.verificationStatus === 'verified')

  const filteredServices = verifiedServices.filter(service => {
    if (selectedCategory !== 'all' && service.category !== selectedCategory) return false
    if (selectedCity && !service.city.toLowerCase().includes(selectedCity.toLowerCase())) return false
    return true
  })

  const uniqueCities = Array.from(new Set(verifiedServices.map(s => s.city))).sort()

  const handleViewDetails = (service: WeddingService) => {
    setSelectedService(service)
    setShowContactDialog(true)
  }

  return (
    <section className="container mx-auto px-4 md:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            विवाह सेवाएं / Wedding Services
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            विवाह की सभी आवश्यकताओं के लिए सत्यापित सेवा प्रदाता
          </p>
          <Alert className="mt-6 max-w-2xl mx-auto bg-accent/10 border-accent">
            <Info size={20} weight="fill" />
            <AlertDescription className="text-base">
              <strong>परामर्श शुल्क:</strong> प्रत्येक सेवा के लिए केवल ₹200 प्रारंभिक परामर्श शुल्क
            </AlertDescription>
          </Alert>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">श्रेणी / Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">सभी श्रेणियाँ / All Categories</SelectItem>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">शहर / City</label>
                <div className="relative">
                  <Input
                    placeholder="शहर खोजें / Search City"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  />
                  <MagnifyingGlass 
                    size={20} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
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
              इस श्रेणी या शहर में कोई सेवा उपलब्ध नहीं है।
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
                        ({service.reviewCount} समीक्षाएं)
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <div className="text-xs text-center text-muted-foreground mb-2">
                      परामर्श शुल्क: ₹{service.consultationFee}
                    </div>
                    <Button 
                      onClick={() => handleViewDetails(service)} 
                      className="w-full"
                    >
                      संपर्क करें / Contact
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
                    <CardTitle className="text-lg">संपर्क विवरण / Contact Details</CardTitle>
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
                        <div className="font-medium">मूल्य सीमा: {selectedService.priceRange}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Alert className="bg-accent/10 border-accent">
                  <CurrencyInr size={20} weight="bold" />
                  <AlertDescription>
                    <strong>परामर्श शुल्क: ₹{selectedService.consultationFee}</strong>
                    <p className="text-sm mt-1">
                      प्रारंभिक परामर्श और आवश्यकताओं के विस्तृत चर्चा के लिए। 
                      अंतिम बुकिंग शुल्क सीधे सेवा प्रदाता से तय करें।
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowContactDialog(false)}
                    className="flex-1"
                  >
                    बंद करें
                  </Button>
                  <Button 
                    onClick={() => {
                      window.location.href = `tel:${selectedService.mobile}`
                    }}
                    className="flex-1"
                  >
                    <Phone size={18} weight="bold" className="mr-2" />
                    कॉल करें
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
