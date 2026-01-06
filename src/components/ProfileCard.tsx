import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Briefcase, GraduationCap, UserCircle, ShieldCheck, Seal, Clock, Lock, Crown, Eye, XCircle, ArrowCounterClockwise, ProhibitInset, Heart, PaperPlaneTilt, Phone, CheckCircle, Sparkle, Star } from '@phosphor-icons/react'
import type { Profile, MembershipPlan } from '@/types/profile'
import { motion } from 'framer-motion'
import { PhotoLightbox, useLightbox } from '@/components/PhotoLightbox'

// Status indicators for profile interactions
export interface ProfileInteractionStatus {
  isNew?: boolean  // Not viewed yet
  isViewed?: boolean  // Profile has been viewed by current user
  interestSent?: boolean  // Interest sent by current user
  interestReceived?: boolean  // Interest received from this profile
  interestAccepted?: boolean  // Mutual interest accepted
  contactRequestSent?: boolean  // Contact request sent by current user
  contactRequestReceived?: boolean  // Contact request received from this profile
  contactRequestAccepted?: boolean  // Contact request accepted
  canChat?: boolean  // Can chat with this profile (interest accepted)
}

interface ProfileCardProps {
  profile: Profile
  onViewProfile: (profile: Profile) => void
  language?: 'hi' | 'en'
  isLoggedIn?: boolean
  shouldBlur?: boolean
  membershipPlan?: MembershipPlan
  // New props for declined/blocked status
  isDeclinedByMe?: boolean
  isDeclinedByThem?: boolean
  onReconsider?: (profileId: string) => void
  // New prop for interaction status
  interactionStatus?: ProfileInteractionStatus
}

export function ProfileCard({ profile, onViewProfile, language = 'hi', isLoggedIn = false, shouldBlur = false, membershipPlan, isDeclinedByMe = false, isDeclinedByThem = false, onReconsider, interactionStatus }: ProfileCardProps) {
  
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
    declinedByMe: language === 'hi' ? 'मेरे द्वारा अस्वीकृत' : 'Declined by me',
    declinedByThem: language === 'hi' ? 'उनके द्वारा अस्वीकृत' : 'Declined by them',
    reconsider: language === 'hi' ? 'पुनर्विचार' : 'Reconsider',
    // Interaction status labels
    new: language === 'hi' ? 'नया' : 'New',
    viewed: language === 'hi' ? 'देखा गया' : 'Viewed',
    interestSent: language === 'hi' ? 'रुचि भेजी' : 'Interest Sent',
    interestReceived: language === 'hi' ? 'रुचि मिली' : 'Interest Received',
    connected: language === 'hi' ? 'जुड़े हुए' : 'Connected',
    contactSent: language === 'hi' ? 'संपर्क भेजा' : 'Contact Sent',
    contactReceived: language === 'hi' ? 'संपर्क मिला' : 'Contact Received',
    canChat: language === 'hi' ? 'चैट करें' : 'Can Chat',
  }

  // Get primary interaction status badge
  const getInteractionBadge = () => {
    if (!interactionStatus || !isLoggedIn) return null
    
    // Priority order: Connected > Interest Accepted > Contact Sent > Interest Sent > Interest Received > Contact Received > Viewed > New
    if (interactionStatus.canChat || interactionStatus.interestAccepted) {
      return {
        text: t.connected,
        icon: <Heart size={10} weight="fill" />,
        className: 'bg-green-500 text-white border-green-600'
      }
    }
    if (interactionStatus.contactRequestAccepted) {
      return {
        text: t.canChat,
        icon: <Phone size={10} weight="fill" />,
        className: 'bg-emerald-500 text-white border-emerald-600'
      }
    }
    if (interactionStatus.contactRequestSent) {
      return {
        text: t.contactSent,
        icon: <Phone size={10} weight="regular" />,
        className: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300'
      }
    }
    if (interactionStatus.interestSent) {
      return {
        text: t.interestSent,
        icon: <PaperPlaneTilt size={10} weight="fill" />,
        className: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300'
      }
    }
    if (interactionStatus.interestReceived) {
      return {
        text: t.interestReceived,
        icon: <Heart size={10} weight="fill" />,
        className: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/50 dark:text-rose-300 animate-pulse'
      }
    }
    if (interactionStatus.contactRequestReceived) {
      return {
        text: t.contactReceived,
        icon: <Phone size={10} weight="fill" />,
        className: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 animate-pulse'
      }
    }
    if (interactionStatus.isViewed) {
      return {
        text: t.viewed,
        icon: <Eye size={10} weight="fill" />,
        className: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400'
      }
    }
    if (interactionStatus.isNew) {
      return {
        text: t.new,
        icon: <Sparkle size={10} weight="fill" />,
        className: 'bg-gradient-to-r from-rose-500 to-amber-500 text-white border-rose-400'
      }
    }
    return null
  }

  const interactionBadge = getInteractionBadge()

  // Determine if this card should have special styling for declined status
  const hasDeclinedStatus = isDeclinedByMe || isDeclinedByThem
  const declinedCardClass = hasDeclinedStatus ? 'opacity-70 border-gray-300' : ''
  const declinedByMeClass = isDeclinedByMe ? 'bg-rose-50/50 dark:bg-rose-950/10' : ''
  const declinedByThemClass = isDeclinedByThem && !isDeclinedByMe ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''

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
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      <Card 
        className={`relative overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border border-rose-100 dark:border-rose-900/30 hover:border-primary/50 cursor-pointer group/card bg-gradient-to-b from-white to-rose-50/30 dark:from-gray-900 dark:to-rose-950/20 active:scale-[0.98] ${declinedCardClass} ${declinedByMeClass} ${declinedByThemClass}`}
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
        {/* Declined status banner */}
        {hasDeclinedStatus && (
          <div className={`px-3 py-1.5 flex items-center justify-between text-[10px] font-medium ${isDeclinedByMe ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
            <div className="flex items-center gap-1.5">
              <XCircle size={12} weight="fill" />
              <span>{isDeclinedByMe ? t.declinedByMe : t.declinedByThem}</span>
            </div>
            {isDeclinedByMe && onReconsider && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  onReconsider(profile.profileId)
                }}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                <ArrowCounterClockwise size={10} weight="bold" />
                {t.reconsider}
              </button>
            )}
          </div>
        )}

        {/* Interaction status badge - floating in top right */}
        {interactionBadge && !hasDeclinedStatus && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className={`${interactionBadge.className} text-[9px] px-1.5 py-0.5 flex items-center gap-1 shadow-sm border`}>
              {interactionBadge.icon}
              <span>{interactionBadge.text}</span>
            </Badge>
          </div>
        )}
        
        <CardHeader className="pb-2 pt-3 px-3 bg-gradient-to-r from-rose-50/50 via-transparent to-amber-50/50 dark:from-rose-950/30 dark:to-amber-950/30">
          <div className="flex items-start gap-3">
            <div 
              className={`relative shrink-0 ${isLoggedIn && !shouldBlur && profile.photos && profile.photos.length > 0 ? 'cursor-pointer group' : ''}`}
              onClick={(e) => {
                if (isLoggedIn && !shouldBlur && profile.photos && profile.photos.length > 0) {
                  e.stopPropagation()
                  openLightbox(profile.photos, 0)
                }
              }}
              title={isLoggedIn && !shouldBlur && profile.photos && profile.photos.length > 0 ? (language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge') : ''}
            >
              <div className="absolute -inset-1 bg-gradient-to-tr from-rose-400 via-pink-300 to-amber-300 rounded-full opacity-60 group-hover/card:opacity-100 transition-opacity blur-sm"></div>
              <Avatar className={`relative w-14 h-14 border-2 border-white dark:border-gray-800 shadow-lg ${(!isLoggedIn || shouldBlur) ? 'blur-md' : ''} ${isLoggedIn && !shouldBlur && profile.photos && profile.photos.length > 0 ? 'group-hover:scale-105 transition-transform' : ''}`}>
                {isLoggedIn && !shouldBlur ? (
                  <AvatarImage src={profile.photos?.[0]} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/50 dark:to-amber-900/50 text-rose-700 dark:text-rose-300 text-base font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Zoom indicator for logged-in users who can see photos */}
              {isLoggedIn && !shouldBlur && profile.photos && profile.photos.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                  <Eye size={16} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
              {/* Lock overlay for free/pending users */}
              {shouldBlur && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                  <Lock size={18} weight="fill" className="text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <h3 
                  className="font-semibold text-base leading-tight text-gray-800 dark:text-gray-100 group-hover/card:text-rose-600 dark:group-hover/card:text-rose-400 transition-colors truncate"
                >
                  {displayName}
                  {shouldHideSurname && <span className="text-muted-foreground">...</span>}
                </h3>
                <div className="flex gap-1 items-center shrink-0">
                  {profile.status === 'verified' && badge && (
                    <Badge className={`${badge.color} gap-0.5 whitespace-nowrap shrink-0 text-[10px] px-1.5 py-0`}>
                      <span className="text-[10px]">{badge.icon}</span>
                    </Badge>
                  )}
                  {profile.hasReadinessBadge && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white gap-0.5 whitespace-nowrap shrink-0 text-[10px] px-1.5 py-0" title={language === 'hi' ? 'विवाह तैयार' : 'Marriage Ready'}>
                      <Star size={10} weight="fill" />
                    </Badge>
                  )}
                  {profile.digilockerVerified && (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-0.5 whitespace-nowrap shrink-0 text-[10px] px-1.5 py-0">
                      ✓
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">
                {profile.age} {t.years} • {profile.gender === 'male' ? t.male : t.female}
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Upgrade prompt for free/pending users */}
        {shouldBlur && (
          <div className="mx-3 mb-1 px-2 py-1.5 bg-gradient-to-r from-rose-100 to-amber-100 dark:from-rose-900/40 dark:to-amber-900/40 border border-rose-200 dark:border-rose-800/50 rounded-md">
            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 text-[10px] font-medium">
              <Crown size={12} weight="fill" className="shrink-0 text-amber-500" />
              <span className="line-clamp-1">
                {language === 'hi' 
                  ? 'अपग्रेड करें' 
                  : 'Upgrade to view details'}
              </span>
            </div>
          </div>
        )}

        <CardContent className="space-y-1.5 pb-3 pt-2 px-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
            <MapPin size={12} className="text-rose-400 shrink-0" weight="fill" />
            <span className="truncate">{profile.location}, {profile.country}</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
            <GraduationCap size={12} className="text-amber-500 shrink-0" weight="fill" />
            <span className="truncate">{profile.education}</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
            <Briefcase size={12} className="text-teal-500 shrink-0" weight="fill" />
            <span className="truncate">{profile.occupation}</span>
          </div>

          {(profile.religion || profile.caste) && (
            <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
              <UserCircle size={12} className="text-purple-400 shrink-0" weight="fill" />
              <span className="truncate">
                {profile.religion}{profile.caste ? ` • ${profile.caste}` : ''}
              </span>
            </div>
          )}

          {profile.disability && profile.disability !== 'no' && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600">
              <UserCircle size={12} className="shrink-0" />
              <span className="truncate">
                {language === 'hi' ? 'दिव्यांग' : 'Differently Abled'}
              </span>
            </div>
          )}

          {isLoggedIn && profile.lastLoginAt && (
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="truncate">{formatLastLogin(profile.lastLoginAt)}</span>
            </div>
          )}

          {profile.bio && (
            <p className={`text-[11px] text-gray-600 dark:text-gray-400 line-clamp-2 mt-2 pt-2 border-t border-rose-100 dark:border-rose-900/30 italic ${shouldBlur ? 'blur-sm select-none' : ''}`}>
              "{profile.bio}"
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
