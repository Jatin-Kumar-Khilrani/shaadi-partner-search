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
}

export function ProfileDetailDialog({ profile, open, onClose }: ProfileDetailDialogProps) {
  if (!profile) return null

  const initials = profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const getTrustBadge = () => {
    if (profile.trustLevel >= 5) {
      return { text: 'स्तर 5 - वीडियो सत्यापित', color: 'bg-accent text-accent-foreground', icon: <Seal weight="fill" size={18} /> }
    } else if (profile.trustLevel >= 3) {
      return { text: 'स्तर 3 - ID सत्यापित', color: 'bg-teal text-teal-foreground', icon: <ShieldCheck weight="fill" size={18} /> }
    } else if (profile.trustLevel >= 1) {
      return { text: 'स्तर 1 - मोबाइल सत्यापित', color: 'bg-muted text-muted-foreground', icon: <ShieldCheck weight="regular" size={18} /> }
    }
    return null
  }

  const handleExpressInterest = () => {
    toast.success('रुचि दर्ज की गई!', {
      description: 'हमारे स्वयंसेवक जल्द ही संपर्क करेंगे और दोनों परिवारों को सूचित करेंगे।'
    })
  }

  const handleRequestContact = () => {
    toast.info('संपर्क अनुरोध भेजा गया', {
      description: 'स्वयंसेवक समीक्षा के बाद संपर्क जानकारी साझा की जाएगी।'
    })
  }

  const badge = getTrustBadge()

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
                {profile.age} वर्ष | {profile.gender === 'male' ? 'पुरुष' : 'महिला'} | {profile.maritalStatus === 'never-married' ? 'अविवाहित' : profile.maritalStatus === 'divorced' ? 'तलाकशुदा' : 'विधुर/विधवा'}
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
              व्यक्तिगत जानकारी
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={<MapPin size={18} />} label="स्थान" value={`${profile.location}, ${profile.country}`} />
              <InfoItem icon={<Calendar size={18} />} label="जन्म तिथि" value={new Date(profile.dateOfBirth).toLocaleDateString('hi-IN')} />
              <InfoItem icon={<GraduationCap size={18} />} label="शिक्षा" value={profile.education} />
              <InfoItem icon={<Briefcase size={18} />} label="व्यवसाय" value={profile.occupation} />
              {profile.gotra && (
                <InfoItem icon={<UserCircle size={18} />} label="गोत्र / कुल" value={profile.gotra} />
              )}
              {profile.height && (
                <InfoItem icon={<UserCircle size={18} />} label="ऊंचाई" value={profile.height} />
              )}
            </div>
          </section>

          {profile.bio && (
            <>
              <Separator />
              <section>
                <h3 className="font-bold text-lg mb-3">परिचय</h3>
                <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
              </section>
            </>
          )}

          {profile.familyDetails && (
            <>
              <Separator />
              <section>
                <h3 className="font-bold text-lg mb-3">पारिवारिक विवरण</h3>
                <p className="text-muted-foreground leading-relaxed">{profile.familyDetails}</p>
              </section>
            </>
          )}

          <Separator />

          <section className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Phone size={22} weight="fill" />
              संपर्क जानकारी
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              गोपनीयता और सुरक्षा के लिए, संपर्क विवरण केवल स्वयंसेवक अनुमोदन के बाद साझा किए जाते हैं।
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleExpressInterest} className="flex-1 bg-primary hover:bg-primary/90">
                <Heart size={20} weight="fill" className="mr-2" />
                रुचि दर्ज करें
              </Button>
              <Button onClick={handleRequestContact} variant="outline" className="flex-1">
                <Phone size={20} className="mr-2" />
                संपर्क अनुरोध करें
              </Button>
            </div>
          </section>

          <div className="text-xs text-muted-foreground text-center pt-2">
            प्रोफाइल ID: {profile.id} | बनाया गया: {new Date(profile.createdAt).toLocaleDateString('hi-IN')}
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
