import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, MapPin, Briefcase, GraduationCap, Heart, House, PencilSimple,
  ChatCircle, Envelope, Phone, Calendar
} from '@phosphor-icons/react'
import type { Profile } from '@/types/profile'
import type { Language } from '@/lib/translations'

interface MyProfileProps {
  profile: Profile | null
  language: Language
  onEdit?: () => void
}

export function MyProfile({ profile, language, onEdit }: MyProfileProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const t = {
    title: language === 'hi' ? 'मेरी प्रोफाइल' : 'My Profile',
    edit: language === 'hi' ? 'संपादित करें' : 'Edit Profile',
    profileId: language === 'hi' ? 'प्रोफाइल ID' : 'Profile ID',
    personalInfo: language === 'hi' ? 'व्यक्तिगत जानकारी' : 'Personal Information',
    familyInfo: language === 'hi' ? 'पारिवारिक जानकारी' : 'Family Information',
    contactInfo: language === 'hi' ? 'संपर्क जानकारी' : 'Contact Information',
    age: language === 'hi' ? 'आयु' : 'Age',
    years: language === 'hi' ? 'वर्ष' : 'years',
    height: language === 'hi' ? 'ऊंचाई' : 'Height',
    education: language === 'hi' ? 'शिक्षा' : 'Education',
    occupation: language === 'hi' ? 'व्यवसाय' : 'Occupation',
    location: language === 'hi' ? 'स्थान' : 'Location',
    religion: language === 'hi' ? 'धर्म' : 'Religion',
    caste: language === 'hi' ? 'जाति' : 'Caste',
    maritalStatus: language === 'hi' ? 'वैवाहिक स्थिति' : 'Marital Status',
    aboutMe: language === 'hi' ? 'मेरे बारे में' : 'About Me',
    familyDetails: language === 'hi' ? 'पारिवारिक विवरण' : 'Family Details',
    email: language === 'hi' ? 'ईमेल' : 'Email',
    mobile: language === 'hi' ? 'मोबाइल' : 'Mobile',
    verified: language === 'hi' ? 'सत्यापित' : 'Verified',
    pending: language === 'hi' ? 'लंबित' : 'Pending',
    level: language === 'hi' ? 'स्तर' : 'Level',
    trustLevel: language === 'hi' ? 'विश्वास स्तर' : 'Trust Level',
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-8">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {language === 'hi' ? 'प्रोफाइल नहीं मिली' : 'Profile not found'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const photos = profile.photos?.length > 0 ? profile.photos : []

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{t.title}</h1>
          {onEdit && (
            <Button onClick={onEdit} className="gap-2">
              <PencilSimple size={20} />
              {t.edit}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {photos.length > 0 ? (
                    <div className="space-y-3">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={photos[currentPhotoIndex]} 
                          alt={profile.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {photos.length > 1 && (
                        <div className="grid grid-cols-5 gap-2">
                          {photos.map((photo, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentPhotoIndex(index)}
                              className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                                currentPhotoIndex === index ? 'border-primary' : 'border-transparent'
                              }`}
                            >
                              <img 
                                src={photo} 
                                alt={`Photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                      <User size={64} className="text-muted-foreground" />
                    </div>
                  )}

                  <div className="text-center pt-4">
                    <h2 className="text-2xl font-bold">{profile.fullName}</h2>
                    <p className="text-muted-foreground">
                      {profile.age} {t.years}
                    </p>
                    <div className="mt-2">
                      <Badge variant="secondary">
                        {t.profileId}: {profile.profileId}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Badge variant={profile.status === 'verified' ? 'default' : 'secondary'}>
                        {profile.status === 'verified' ? t.verified : t.pending}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline">
                        {t.trustLevel} {profile.trustLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Tabs defaultValue="personal" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">{t.personalInfo}</TabsTrigger>
                <TabsTrigger value="family">{t.familyInfo}</TabsTrigger>
                <TabsTrigger value="contact">{t.contactInfo}</TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.personalInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.bio && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Heart size={18} />
                          {t.aboutMe}
                        </h4>
                        <p className="text-muted-foreground">{profile.bio}</p>
                      </div>
                    )}
                    
                    <Separator />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.age}</p>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar size={16} />
                          {profile.age} {t.years}
                        </p>
                      </div>

                      {profile.height && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.height}</p>
                          <p className="font-medium">{profile.height}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground">{t.education}</p>
                        <p className="font-medium flex items-center gap-2">
                          <GraduationCap size={16} />
                          {profile.education}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">{t.occupation}</p>
                        <p className="font-medium flex items-center gap-2">
                          <Briefcase size={16} />
                          {profile.occupation}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">{t.location}</p>
                        <p className="font-medium flex items-center gap-2">
                          <MapPin size={16} />
                          {profile.location}, {profile.country}
                        </p>
                      </div>

                      {profile.religion && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.religion}</p>
                          <p className="font-medium">{profile.religion}</p>
                        </div>
                      )}

                      {profile.caste && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.caste}</p>
                          <p className="font-medium">{profile.caste}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground">{t.maritalStatus}</p>
                        <p className="font-medium">{profile.maritalStatus}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="family">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.familyInfo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.familyDetails ? (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <House size={18} />
                          {t.familyDetails}
                        </h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{profile.familyDetails}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        {language === 'hi' ? 'कोई पारिवारिक जानकारी नहीं' : 'No family information'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contact">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.contactInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t.email}</p>
                      <p className="font-medium flex items-center gap-2">
                        <Envelope size={18} />
                        {profile.hideEmail ? 'XXX@XXX.com' : profile.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t.mobile}</p>
                      <p className="font-medium flex items-center gap-2">
                        <Phone size={18} />
                        {profile.hideMobile ? '+91 XXXXXXXXXX' : profile.mobile}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="mt-6">
          <Card>
            <CardContent className="py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="gap-2" disabled>
                  <Heart size={20} weight="fill" />
                  {language === 'hi' ? 'मुखपृष्ठ' : 'Home'}
                </Button>
                <Button variant="outline" className="gap-2" disabled>
                  <User size={20} />
                  {language === 'hi' ? 'मेरी गतिविधि' : 'My Activity'}
                </Button>
                <Button variant="outline" className="gap-2" disabled>
                  <Envelope size={20} />
                  {language === 'hi' ? 'इनबॉक्स' : 'Inbox'}
                </Button>
                <Button variant="outline" className="gap-2" disabled>
                  <ChatCircle size={20} />
                  {language === 'hi' ? 'चैट' : 'Chat'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
