import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MapPin, Briefcase, GraduationCap, UserCircle, Phone, Envelope, Heart, ShieldCheck, Seal, Calendar } from '@phosphor-icons/react'
import type { Profile } from '@/types/profile'
import { toast } from 'sonner'

interface ProfileDetailDialogProps {
  profile: Profile | null
  open: boolean
  onClose: () => void
  language: 'hi' | 'en'
}

export function ProfileDetailDialog({ profile, open, onClose, language }: ProfileDetailDialogProps) {
  if (!profile) return null

  const initials = profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const getTrustBadge = () => {
    if (profile.trustLevel >= 5) {
      return { 
        text: language === 'hi' ? 'स्तर 5 - वीडियो सत्यापित' : 'Level 5 - Video Verified', 
        color: 'bg-accent text-accent-foreground', 
        icon: <Seal weight="fill" size={18} /> 
      }
    } else if (profile.trustLevel >= 3) {
      return { 
        text: language === 'hi' ? 'स्तर 3 - ID सत्यापित' : 'Level 3 - ID Verified', 
        color: 'bg-teal text-teal-foreground', 
        icon: <ShieldCheck weight="fill" size={18} /> 
      }
    } else if (profile.trustLevel >= 1) {
      return { 
        text: language === 'hi' ? 'स्तर 1 - मोबाइल सत्यापित' : 'Level 1 - Mobile Verified', 
        color: 'bg-muted text-muted-foreground', 
        icon: <ShieldCheck weight="regular" size={18} /> 
      }
    }
    return null
  }

  const handleExpressInterest = () => {
    toast.success(
      language === 'hi' ? 'रुचि दर्ज की गई!' : 'Interest recorded!',
      {
        description: language === 'hi' 
          ? 'हमारे स्वयंसेवक जल्द ही संपर्क करेंगे और दोनों परिवारों को सूचित करेंगे।'
          : 'Our volunteers will contact you soon and inform both families.'
      }
    )
  }

  const handleRequestContact = () => {
    toast.info(
      language === 'hi' ? 'संपर्क अनुरोध भेजा गया' : 'Contact request sent',
      {
        description: language === 'hi' 
          ? 'स्वयंसेवक समीक्षा के बाद संपर्क जानकारी साझा की जाएगी।'
          : 'Contact information will be shared after volunteer review.'
      }
    )
  }

  const badge = getTrustBadge()
  
  const getMaritalStatus = () => {
    if (profile.maritalStatus === 'never-married') {
      return language === 'hi' ? 'अविवाहित' : 'Never Married'
    } else if (profile.maritalStatus === 'divorced') {
      return language === 'hi' ? 'तलाकशुदा' : 'Divorced'
    } else {
      return language === 'hi' ? 'विधुर/विधवा' : 'Widowed'
    }
  }
  
  const t = {
    years: language === 'hi' ? 'वर्ष' : 'years',
    male: language === 'hi' ? 'पुरुष' : 'Male',
    female: language === 'hi' ? 'महिला' : 'Female',
    personalInfo: language === 'hi' ? 'व्यक्तिगत जानकारी' : 'Personal Information',
    location: language === 'hi' ? 'स्थान' : 'Location',
    dateOfBirth: language === 'hi' ? 'जन्म तिथि' : 'Date of Birth',
    education: language === 'hi' ? 'शिक्षा' : 'Education',
    occupation: language === 'hi' ? 'व्यवसाय' : 'Occupation',
    religion: language === 'hi' ? 'धर्म' : 'Religion',
    caste: language === 'hi' ? 'जाति' : 'Caste',
    height: language === 'hi' ? 'ऊंचाई' : 'Height',
    bio: language === 'hi' ? 'परिचय' : 'About',
    familyDetails: language === 'hi' ? 'पारिवारिक विवरण' : 'Family Details',
    contactInfo: language === 'hi' ? 'संपर्क जानकारी' : 'Contact Information',
    privacyNotice: language === 'hi' 
      ? 'गोपनीयता और सुरक्षा के लिए, संपर्क विवरण केवल स्वयंसेवक अनुमोदन के बाद साझा किए जाते हैं।'
      : 'For privacy and security, contact details are shared only after volunteer approval.',
    expressInterest: language === 'hi' ? 'रुचि दर्ज करें' : 'Express Interest',
    requestContact: language === 'hi' ? 'संपर्क अनुरोध करें' : 'Request Contact',
    profileId: language === 'hi' ? 'प्रोफाइल ID' : 'Profile ID',
    createdOn: language === 'hi' ? 'बनाया गया' : 'Created on',
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
              <AvatarImage src={profile.photoUrl} alt={profile.fullName} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-3xl mb-2">{profile.fullName}</DialogTitle>
              <DialogDescription className="text-base">
                {profile.age} {t.years} | {profile.gender === 'male' ? t.male : t.female} | {getMaritalStatus()}
              </DialogDescription>
              {badge && (
                <Badge className={`${badge.color} gap-1.5 mt-2`}>
                  {badge.icon}
                  <span>{badge.text}</span>
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <section>
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <UserCircle size={22} weight="fill" />
              {t.personalInfo}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={<MapPin size={18} />} label={t.location} value={`${profile.location}, ${profile.country}`} />
              <InfoItem icon={<Calendar size={18} />} label={t.dateOfBirth} value={new Date(profile.dateOfBirth).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US')} />
              <InfoItem icon={<GraduationCap size={18} />} label={t.education} value={profile.education} />
              <InfoItem icon={<Briefcase size={18} />} label={t.occupation} value={profile.occupation} />
              {profile.religion && (
                <InfoItem icon={<UserCircle size={18} />} label={t.religion} value={profile.religion} />
              )}
              {profile.caste && (
                <InfoItem icon={<UserCircle size={18} />} label={t.caste} value={profile.caste} />
              )}
              {profile.height && (
                <InfoItem icon={<UserCircle size={18} />} label={t.height} value={profile.height} />
              )}
            </div>
          </section>

          {profile.bio && (
            <>
              <Separator />
              <section>
                <h3 className="font-bold text-lg mb-3">{t.bio}</h3>
                <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
              </section>
            </>
          )}

          {profile.familyDetails && (
            <>
              <Separator />
              <section>
                <h3 className="font-bold text-lg mb-3">{t.familyDetails}</h3>
                <p className="text-muted-foreground leading-relaxed">{profile.familyDetails}</p>
              </section>
            </>
          )}

          <Separator />

          <section className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Phone size={22} weight="fill" />
              {t.contactInfo}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t.privacyNotice}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleExpressInterest} className="flex-1 bg-primary hover:bg-primary/90">
                <Heart size={20} weight="fill" className="mr-2" />
                {t.expressInterest}
              </Button>
              <Button onClick={handleRequestContact} variant="outline" className="flex-1">
                <Phone size={20} className="mr-2" />
                {t.requestContact}
              </Button>
            </div>
          </section>

          <div className="text-xs text-muted-foreground text-center pt-2">
            {t.profileId}: {profile.id} | {t.createdOn}: {new Date(profile.createdAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  )
}
