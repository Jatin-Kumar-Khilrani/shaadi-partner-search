import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Briefcase, GraduationCap, UserCircle, ShieldCheck, Seal } from '@phosphor-icons/react'
import type { Profile } from '@/types/profile'
import { motion } from 'framer-motion'

interface ProfileCardProps {
  profile: Profile
  onViewProfile: (profile: Profile) => void
}

export function ProfileCard({ profile, onViewProfile }: ProfileCardProps) {
  const initials = profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  
  const getTrustBadge = () => {
    if (profile.trustLevel >= 5) {
      return { text: 'स्तर 5 - वीडियो सत्यापित', color: 'bg-accent text-accent-foreground', icon: <Seal weight="fill" /> }
    } else if (profile.trustLevel >= 3) {
      return { text: 'स्तर 3 - ID सत्यापित', color: 'bg-teal text-teal-foreground', icon: <ShieldCheck weight="fill" /> }
    } else if (profile.trustLevel >= 1) {
      return { text: 'स्तर 1 - मोबाइल सत्यापित', color: 'bg-muted text-muted-foreground', icon: <ShieldCheck weight="regular" /> }
    }
    return null
  }

  const badge = getTrustBadge()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-teal/30">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
              <AvatarImage src={profile.photoUrl} alt={profile.fullName} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-xl leading-tight">{profile.fullName}</h3>
                {profile.status === 'verified' && badge && (
                  <Badge className={`${badge.color} gap-1 whitespace-nowrap shrink-0`}>
                    <span className="text-xs">{badge.icon}</span>
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {profile.age} वर्ष | {profile.gender === 'male' ? 'पुरुष' : 'महिला'}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} className="text-muted-foreground shrink-0" />
            <span className="truncate">{profile.location}, {profile.country}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap size={16} className="text-muted-foreground shrink-0" />
            <span className="truncate">{profile.education}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Briefcase size={16} className="text-muted-foreground shrink-0" />
            <span className="truncate">{profile.occupation}</span>
          </div>

          {profile.gotra && (
            <div className="flex items-center gap-2 text-sm">
              <UserCircle size={16} className="text-muted-foreground shrink-0" />
              <span className="truncate">गोत्र: {profile.gotra}</span>
            </div>
          )}

          {profile.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-3 pt-3 border-t">
              {profile.bio}
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <Button 
            onClick={() => onViewProfile(profile)} 
            className="w-full"
            variant="default"
          >
            प्रोफाइल देखें / View Profile
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
