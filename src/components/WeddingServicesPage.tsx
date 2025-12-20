import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin, Phone, Envelope, CurrencyInr, Star, Camera, MagnifyingGlass } from '@phosphor-icons/react'
import type { WeddingService } from '@/types/profile'
import type { Language } from '@/lib/translations'

interface WeddingServicesProps {
  language: Language
}

export function WeddingServices({ language }: WeddingServicesProps) {
  const [services] = useKV<WeddingService[]>('weddingServices', [])
  const [selectedService, setSelectedService] = useState<WeddingService | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [cityFilter, setCityFilter] = useState('')

  const t = {
    title: language === 'hi' ? 'विवाह सेवाएं' : 'Wedding Services',
    subtitle: language === 'hi' ? 'सत्यापित विवाह सेवा प्रदाताओं की डायरेक्टरी' : 'Directory of Verified Wedding Service Providers',
    search: language === 'hi' ? 'खोजें' : 'Search',
    category: language === 'hi' ? 'श्रेणी' : 'Category',
    city: language === 'hi' ? 'शहर' : 'City',
    allCategories: language === 'hi' ? 'सभी श्रेणियां' : 'All Categories',
    consultationFee: language === 'hi' ? 'परामर्श शुल्क' : 'Consultation Fee',
    priceRange: language === 'hi' ? 'मूल्य सीमा' : 'Price Range',
    contactPerson: language === 'hi' ? 'संपर्क व्यक्ति' : 'Contact Person',
    address: language === 'hi' ? 'पता' : 'Address',
    viewDetails: language === 'hi' ? 'विवरण देखें' : 'View Details',
    close: language === 'hi' ? 'बंद करें' : 'Close',
    verified: language === 'hi' ? 'सत्यापित' : 'Verified',
    noServices: language === 'hi' ? 'कोई सेवा नहीं मिली' : 'No services found',
    
    categories: {
      venue: language === 'hi' ? 'स्थल' : 'Venue',
      caterer: language === 'hi' ? 'कैटरर' : 'Caterer',
      photographer: language === 'hi' ? 'फोटोग्राफर' : 'Photographer',
      decorator: language === 'hi' ? 'सजावटकर्ता' : 'Decorator',
      mehandi: language === 'hi' ? 'मेहंदी कलाकार' : 'Mehandi Artist',
      makeup: language === 'hi' ? 'मेकअप कलाकार' : 'Makeup Artist',
      dj: language === 'hi' ? 'डीजे / संगीत' : 'DJ / Music',
      priest: language === 'hi' ? 'पंडित' : 'Priest',
      'card-designer': language === 'hi' ? 'कार्ड डिज़ाइनर' : 'Card Designer',
      choreographer: language === 'hi' ? 'कोरियोग्राफर' : 'Choreographer',
      other: language === 'hi' ? 'अन्य' : 'Other',
    }
  }

  const filteredServices = useMemo(() => {
    if (!services) return []
    
    return services.filter(service => {
      if (service.verificationStatus !== 'verified') return false
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!service.businessName.toLowerCase().includes(query) &&
            !service.contactPerson.toLowerCase().includes(query) &&
            !service.city.toLowerCase().includes(query)) {
          return false
        }
      }
      
      if (categoryFilter && service.category !== categoryFilter) return false
      if (cityFilter && !service.city.toLowerCase().includes(cityFilter.toLowerCase())) return false
      
      return true
    })
  }, [services, searchQuery, categoryFilter, cityFilter])

  const getCategoryName = (category: string) => {
    return t.categories[category as keyof typeof t.categories] || category
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative">
            <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t.allCategories} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t.allCategories}</SelectItem>
              {Object.keys(t.categories).map(cat => (
                <SelectItem key={cat} value={cat}>
                  {getCategoryName(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input 
            placeholder={t.city}
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          />
        </div>

        {filteredServices.length === 0 ? (
          <Alert>
            <AlertDescription>{t.noServices}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map(service => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{service.businessName}</CardTitle>
                      <Badge variant="secondary" className="mt-2">
                        {getCategoryName(service.category)}
                      </Badge>
                    </div>
                    {service.verificationStatus === 'verified' && (
                      <Badge variant="default" className="ml-2">
                        {t.verified}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={16} />
                    <span>{service.city}, {service.state}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <CurrencyInr size={16} />
                    <span className="font-medium">{t.priceRange}: {service.priceRange}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <CurrencyInr size={16} />
                    <span className="text-accent font-medium">
                      {t.consultationFee}: ₹{service.consultationFee}
                    </span>
                  </div>

                  {service.rating && (
                    <div className="flex items-center gap-2 text-sm">
                      <Star size={16} weight="fill" className="text-yellow-500" />
                      <span>{service.rating}/5</span>
                      {service.reviewCount && (
                        <span className="text-muted-foreground">({service.reviewCount} reviews)</span>
                      )}
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setSelectedService(service)}
                  >
                    {t.viewDetails}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="max-w-2xl">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedService.businessName}</DialogTitle>
                <DialogDescription>
                  {getCategoryName(selectedService.category)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">{language === 'hi' ? 'विवरण' : 'Description'}</h4>
                  <p className="text-muted-foreground">{selectedService.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t.contactPerson}</p>
                    <p className="font-medium">{selectedService.contactPerson}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t.consultationFee}</p>
                    <p className="font-medium text-accent">₹{selectedService.consultationFee}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t.priceRange}</p>
                    <p className="font-medium">{selectedService.priceRange}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t.address}</p>
                  <p className="font-medium flex items-start gap-2">
                    <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                    <span>{selectedService.address}, {selectedService.city}, {selectedService.state}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{language === 'hi' ? 'मोबाइल' : 'Mobile'}</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone size={18} />
                      {selectedService.mobile}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{language === 'hi' ? 'ईमेल' : 'Email'}</p>
                    <p className="font-medium flex items-center gap-2">
                      <Envelope size={18} />
                      {selectedService.email}
                    </p>
                  </div>
                </div>

                {selectedService.photos && selectedService.photos.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Camera size={18} />
                        {language === 'hi' ? 'फोटो' : 'Photos'}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedService.photos.map((photo, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img 
                              src={photo} 
                              alt={`${selectedService.businessName} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setSelectedService(null)}>
                  {t.close}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
