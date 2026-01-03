import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Briefcase, GraduationCap, UserCircle, ShieldCheck, Seal, Clock, Lock, Crown, Eye } from '@phosphor-icons/react'
import type { Profile, MembershipPlan } from '@/types/profile'
import { motion } from 'framer-motion'
import { PhotoLightbox, useLightbox } from '@/components/PhotoLightbox'

interface ProfileCardProps {
  profile: Profile
  onViewProfile: (profile: Profile) => void
  language?: 'hi' | 'en'
  isLoggedIn?: boolean
  shouldBlur?: boolean
  membershipPlan?: MembershipPlan
}

export function ProfileCard({ profile, onViewProfile, language = 'hi', isLoggedIn = false, shouldBlur = false, membershipPlan }: ProfileCardProps) {
  
  // Lightbox for photo zoom
  const { lightboxState, openLightbox, closeLightbox } = useLightbox()
  
  // Determine if user has premium access
  const _hasPremiumAccess = membershipPlan === '6-month' || membershipPlan === '1-year'
  
  const getTrustBadge = () => {
    if (profile.trustLevel >= 5) {
      return { 
        text: language === 'hi' ? 'स्तर 5 - वीडियो सत्यापित' : 'Level 5 - Video Verified', 
        color: 'bg-accent text-accent-foreground', 
        icon: <Seal weight="fill" /> 
      }
    } else if (profile.trustLevel >= 3) {
      return { 
        text: language === 'hi' ? 'स्तर 3 - ID सत्यापित' : 'Level 3 - ID Verified', 
        color: 'bg-teal text-teal-foreground', 
        icon: <ShieldCheck weight="fill" /> 
      }
    } else if (profile.trustLevel >= 1) {
      return { 
        text: language === 'hi' ? 'स्तर 1 - मोबाइल सत्यापित' : 'Level 1 - Mobile Verified', 
        color: 'bg-muted text-muted-foreground', 
        icon: <ShieldCheck weight="regular" /> 
      }
    }
    return null
  }

  const badge = getTrustBadge()
  
  // Get first name only (hide surname for non-logged in users or blurred users)
  const shouldHideSurname = !isLoggedIn || shouldBlur
  const displayName = shouldHideSurname ? profile.fullName.split(' ')[0] : profile.fullName
  const initials = shouldHideSurname 
    ? profile.fullName.split(' ')[0][0].toUpperCase()
    : profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  
  const t = {
    years: language === 'hi' ? 'वर्ष' : 'years',
    male: language === 'hi' ? 'पुरुष' : 'Male',
    female: language === 'hi' ? 'महिला' : 'Female',
    religion: language === 'hi' ? 'धर्म' : 'Religion',
    caste: language === 'hi' ? 'जाति' : 'Caste',
    viewProfile: language === 'hi' ? 'प्रोफाइल देखें' : 'View Profile',
    lastSeen: language === 'hi' ? 'अंतिम लॉगिन' : 'Last seen',
  }

  // Format last login time
  const formatLastLogin = (lastLoginAt?: string) => {
    if (!lastLoginAt) return null
    const date = new Date(lastLoginAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 60) {
      return language === 'hi' ? `${diffMins} मिनट पहले` : `${diffMins}m ago`
    } else if (diffHours < 24) {
      return language === 'hi' ? `${diffHours} घंटे पहले` : `${diffHours}h ago`
    } else if (diffDays < 7) {
      return language === 'hi' ? `${diffDays} दिन पहले` : `${diffDays}d ago`
    } else {
      return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { 
        day: 'numeric', 
        month: 'short' 
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card 
        className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/40 cursor-pointer group/card bg-background hover:bg-primary/[0.02] active:scale-[0.99]"
        onClick={() => onViewProfile(profile)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onViewProfile(profile)
          }
        }}
        aria-label={`${language === 'hi' ? 'प्रोफाइल देखें:' : 'View profile:'} ${displayName}`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div 
              className={`relative ${isLoggedIn && !shouldBlur && profile.photos && profile.photos.length > 0 ? 'cursor-pointer group' : ''}`}
              onClick={(e) => {
                if (isLoggedIn && !shouldBlur && profile.photos && profile.photos.length > 0) {
                  e.stopPropagation()
                  openLightbox(profile.photos, 0)
                }
              }}
              title={isLoggedIn && !shouldBlur && profile.photos && profile.photos.length > 0 ? (language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge') : ''}
            >
              <Avatar className={`w-20 h-20 border-4 border-background shadow-lg ${(!isLoggedIn || shouldBlur) ? 'blur-md' : ''} ${isLoggedIn && !shouldBlur && profile.photos && profile.photos.length > 0 ? 'group-hover:ring-4 group-hover:ring-primary/50 transition-all' : ''}`}>
                {isLoggedIn && !shouldBlur ? (
                  <AvatarImage src={profile.photos?.[0]} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Zoom indicator for logged-in users who can see photos */}
              {isLoggedIn && !shouldBlur && profile.photos && profile.photos.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                  <Eye size={20} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
              {/* Lock overlay for free/pending users */}
              {shouldBlur && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                  <Lock size={24} weight="fill" className="text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 
                  className="font-bold text-xl leading-tight group-hover/card:text-primary transition-colors"
                >
                  {displayName}
                  {shouldHideSurname && <span className="text-muted-foreground"> ...</span>}
                </h3>
                <div className="flex flex-col gap-1 items-end">
                  {profile.status === 'verified' && badge && (
                    <Badge className={`${badge.color} gap-1 whitespace-nowrap shrink-0`}>
                      <span className="text-xs">{badge.icon}</span>
                    </Badge>
                  )}
                  {profile.digilockerVerified && (
                    <Badge className="bg-green-600 gap-1 whitespace-nowrap shrink-0 text-xs">
                      ✓ ID
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {profile.age} {t.years} | {profile.gender === 'male' ? t.male : t.female}
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Upgrade prompt for free/pending users */}
        {shouldBlur && (
          <div className="mx-4 mb-2 p-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs">
              <Crown size={14} weight="fill" />
              <span>
                {language === 'hi' 
                  ? 'फोटो और पूरा नाम देखने के लिए प्लान अपग्रेड करें' 
                  : 'Upgrade plan to view photo & full name'}
              </span>
            </div>
          </div>
        )}

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

          {profile.religion && (
            <div className="flex items-center gap-2 text-sm">
              <UserCircle size={16} className="text-muted-foreground shrink-0" />
              <span className="truncate">{t.religion}: {profile.religion}</span>
            </div>
          )}

          {profile.caste && (
            <div className="flex items-center gap-2 text-sm">
              <UserCircle size={16} className="text-muted-foreground shrink-0" />
              <span className="truncate">{t.caste}: {profile.caste}</span>
            </div>
          )}

          {profile.disability && profile.disability !== 'no' && (
            <div className="flex items-center gap-2 text-sm">
              <UserCircle size={16} className="text-muted-foreground shrink-0" />
              <span className="truncate">
                {language === 'hi' ? 'दिव्यांग' : 'Differently Abled'}: {language === 'hi' ? 'हाँ' : 'Yes'}
              </span>
            </div>
          )}

          {isLoggedIn && profile.lastLoginAt && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Clock size={16} className="shrink-0" />
              <span className="truncate">{t.lastSeen}: {formatLastLogin(profile.lastLoginAt)}</span>
            </div>
          )}

          {profile.bio && (
            <p className={`text-sm text-muted-foreground line-clamp-2 mt-3 pt-3 border-t ${shouldBlur ? 'blur-sm select-none' : ''}`}>
              {profile.bio}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Photo Lightbox for viewing photos in full size */}
      <PhotoLightbox
        photos={lightboxState.photos}
        initialIndex={lightboxState.initialIndex}
        open={lightboxState.open}
        onClose={closeLightbox}
      />
    </motion.div>
  )
}
