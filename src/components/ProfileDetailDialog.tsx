import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MapPin, Briefcase, GraduationCap, UserCircle, Phone, Envelope, Heart, ShieldCheck, Seal, Calendar, Clock } from '@phosphor-icons/react'
import type { Profile, Interest, ContactRequest, MembershipPlan } from '@/types/profile'
import { toast } from 'sonner'
import { useKV } from '@/hooks/useKV'
import { formatDateDDMMYYYY } from '@/lib/utils'
import { PhotoLightbox, useLightbox } from '@/components/PhotoLightbox'

interface ProfileDetailDialogProps {
  profile: Profile | null
  open: boolean
  onClose: () => void
  language: 'hi' | 'en'
  currentUserProfile?: Profile | null
  isLoggedIn?: boolean
  isAdmin?: boolean
  shouldBlur?: boolean
  membershipPlan?: MembershipPlan
}

export function ProfileDetailDialog({ profile, open, onClose, language, currentUserProfile, isLoggedIn = false, isAdmin = false, shouldBlur = false, membershipPlan }: ProfileDetailDialogProps) {
  const [interests, setInterests] = useKV<Interest[]>('interests', [])
  const [contactRequests, setContactRequests] = useKV<ContactRequest[]>('contactRequests', [])
  const { lightboxState, openLightbox, closeLightbox } = useLightbox()

  if (!profile) return null

  // For admin or logged in users without blur, show full name; otherwise first name only
  const canSeeFullDetails = isAdmin || (isLoggedIn && !shouldBlur)
  const displayName = canSeeFullDetails ? profile.fullName : profile.fullName.split(' ')[0]
  const initials = canSeeFullDetails 
    ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.fullName.split(' ')[0][0].toUpperCase()
  
  // Blur content for free/expired membership
  const blurContent = shouldBlur && !isAdmin

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

  const existingInterest = currentUserProfile && interests?.find(
    i => i.fromProfileId === currentUserProfile.profileId && 
         i.toProfileId === profile.profileId
  )

  const hasReceivedInterestFromProfile = currentUserProfile && interests?.find(
    i => i.fromProfileId === profile.profileId && 
         i.toProfileId === currentUserProfile.profileId
  )

  const handleExpressInterest = () => {
    if (!currentUserProfile) {
      toast.error(
        language === 'hi' ? 'कृपया पहले लॉगिन करें' : 'Please login first'
      )
      return
    }

    if (currentUserProfile.id === profile.id) {
      toast.error(
        language === 'hi' ? 'आप अपने आप को रुचि नहीं भेज सकते' : 'You cannot send interest to yourself'
      )
      return
    }

    if (existingInterest) {
      toast.info(
        language === 'hi' ? 'आपने पहले ही रुचि दर्ज की है' : 'You have already expressed interest'
      )
      return
    }

    if (hasReceivedInterestFromProfile) {
      toast.info(
        language === 'hi' ? 'इस प्रोफाइल ने आपको पहले ही रुचि भेजी है' : 'This profile has already sent you interest'
      )
      return
    }

    const newInterest: Interest = {
      id: `interest-${Date.now()}`,
      fromProfileId: currentUserProfile.profileId,
      toProfileId: profile.profileId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    setInterests(current => [...(current || []), newInterest])

    toast.success(
      language === 'hi' ? 'रुचि दर्ज की गई!' : 'Interest recorded!',
      {
        description: language === 'hi' 
          ? 'दूसरे व्यक्ति को आपकी रुचि की सूचना मिल गई है। वे इसे स्वीकार या अस्वीकार कर सकते हैं।'
          : 'The other person has been notified of your interest. They can accept or decline it.'
      }
    )
  }

  const handleRequestContact = () => {
    if (!currentUserProfile) {
      toast.error(
        language === 'hi' ? 'कृपया पहले लॉगिन करें' : 'Please login first'
      )
      return
    }

    if (currentUserProfile.id === profile.id) {
      toast.error(
        language === 'hi' ? 'आप अपने आप को संपर्क अनुरोध नहीं भेज सकते' : 'You cannot send contact request to yourself'
      )
      return
    }

    const existingRequest = contactRequests?.find(
      r => r.fromUserId === currentUserProfile.id && 
           r.toUserId === profile.id
    )

    if (existingRequest) {
      toast.info(
        language === 'hi' ? 'आपने पहले ही संपर्क अनुरोध भेजा है' : 'You have already sent a contact request'
      )
      return
    }

    const newRequest: ContactRequest = {
      id: `contact-req-${Date.now()}`,
      fromUserId: currentUserProfile.id,
      toUserId: profile.id,
      fromProfileId: currentUserProfile.profileId,
      toProfileId: profile.profileId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    setContactRequests(current => [...(current || []), newRequest])

    toast.info(
      language === 'hi' ? 'संपर्क अनुरोध भेजा गया' : 'Contact request sent',
      {
        description: language === 'hi' 
          ? 'दूसरे व्यक्ति को आपके संपर्क अनुरोध की सूचना मिल गई है।'
          : 'The other person has been notified of your contact request.'
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
    // Admin labels
    allPhotos: language === 'hi' ? 'सभी फोटो' : 'All Photos',
    selfiePhoto: language === 'hi' ? 'सेल्फी फोटो' : 'Selfie Photo',
    mobileNumber: language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number',
    email: language === 'hi' ? 'ईमेल' : 'Email',
    birthTime: language === 'hi' ? 'जन्म समय' : 'Birth Time',
    birthPlace: language === 'hi' ? 'जन्म स्थान' : 'Birth Place',
    horoscopeMatching: language === 'hi' ? 'कुंडली मिलान' : 'Horoscope Matching',
    diet: language === 'hi' ? 'खान-पान' : 'Diet',
    habits: language === 'hi' ? 'आदतें' : 'Habits',
    annualIncome: language === 'hi' ? 'वार्षिक आय' : 'Annual Income',
    profession: language === 'hi' ? 'पेशा' : 'Profession',
    position: language === 'hi' ? 'पद/पदनाम' : 'Position/Designation',
    relation: language === 'hi' ? 'संबंध' : 'Relation',
    registeredBy: language === 'hi' ? 'पंजीकरणकर्ता' : 'Registered By',
    notProvided: language === 'hi' ? 'प्रदान नहीं किया गया' : 'Not Provided',
    mandatory: language === 'hi' ? 'अनिवार्य' : 'Mandatory',
    preferred: language === 'hi' ? 'वांछित' : 'Preferred',
    notRequired: language === 'hi' ? 'आवश्यक नहीं' : 'Not Required',
    lastLogin: language === 'hi' ? 'अंतिम लॉगिन' : 'Last Login',
  }

  // Format last login time
  const formatLastLogin = (lastLoginAt?: string) => {
    if (!lastLoginAt) return language === 'hi' ? 'कभी नहीं' : 'Never'
    const date = new Date(lastLoginAt)
    return date.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4 mb-4">
            <Avatar className={`w-24 h-24 border-4 border-background shadow-xl ${(!canSeeFullDetails || blurContent) ? 'blur-sm' : ''}`}>
              {canSeeFullDetails && !blurContent ? (
                <AvatarImage src={profile.photos?.[0]} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-3xl mb-2">
                {displayName}
                {!canSeeFullDetails && <span className="text-muted-foreground"> ...</span>}
              </DialogTitle>
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
              <InfoItem icon={<Calendar size={18} />} label={t.dateOfBirth} value={formatDateDDMMYYYY(profile.dateOfBirth)} />
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
              {/* Show last login for logged in users */}
              {canSeeFullDetails && (
                <InfoItem 
                  icon={<Clock size={18} className="text-green-600" />} 
                  label={t.lastLogin} 
                  value={formatLastLogin(profile.lastLoginAt)} 
                />
              )}
              {/* Admin sees all additional fields */}
              {isAdmin && (
                <>
                  <InfoItem 
                    icon={<UserCircle size={18} />} 
                    label={t.birthTime} 
                    value={(profile as any).birthTime || t.notProvided} 
                  />
                  <InfoItem 
                    icon={<MapPin size={18} />} 
                    label={t.birthPlace} 
                    value={(profile as any).birthPlace || t.notProvided} 
                  />
                  <InfoItem 
                    icon={<UserCircle size={18} />} 
                    label={t.horoscopeMatching} 
                    value={
                      (profile as any).horoscopeMatching === 'mandatory' ? t.mandatory :
                      (profile as any).horoscopeMatching === 'preferred' ? t.preferred :
                      (profile as any).horoscopeMatching === 'not-required' ? t.notRequired : t.notProvided
                    } 
                  />
                  <InfoItem 
                    icon={<UserCircle size={18} />} 
                    label={t.diet} 
                    value={(profile as any).diet || t.notProvided} 
                  />
                  <InfoItem 
                    icon={<UserCircle size={18} />} 
                    label={t.habits} 
                    value={(profile as any).habits || t.notProvided} 
                  />
                  <InfoItem 
                    icon={<Briefcase size={18} />} 
                    label={t.annualIncome} 
                    value={(profile as any).annualIncome || t.notProvided} 
                  />
                  <InfoItem 
                    icon={<Briefcase size={18} />} 
                    label={t.profession} 
                    value={(profile as any).profession || t.notProvided} 
                  />
                  <InfoItem 
                    icon={<Briefcase size={18} />} 
                    label={t.position} 
                    value={(profile as any).position || t.notProvided} 
                  />
                  <InfoItem 
                    icon={<UserCircle size={18} />} 
                    label={t.relation} 
                    value={(profile as any).relation || (language === 'hi' ? 'स्वयं' : 'Self')} 
                  />
                </>
              )}
            </div>
          </section>

          {/* Admin: Show all photos and selfie */}
          {isAdmin && (
            <>
              <Separator />
              <section>
                <h3 className="font-bold text-lg mb-3">{t.allPhotos}</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {language === 'hi' ? 'बड़ा देखने के लिए फोटो पर क्लिक करें' : 'Click on a photo to view larger'}
                </p>
                <div className="flex flex-wrap gap-3">
                  {profile.photos && profile.photos.length > 0 ? (
                    profile.photos.map((photo, idx) => (
                      <img 
                        key={idx} 
                        src={photo} 
                        alt={`Photo ${idx + 1}`} 
                        className="w-24 h-24 object-cover rounded-lg border-2 border-border shadow cursor-pointer hover:opacity-80 transition-opacity hover:ring-2 hover:ring-primary"
                        onClick={() => openLightbox(profile.photos || [], idx)}
                        title={language === 'hi' ? 'बड़ा देखें' : 'View larger'}
                      />
                    ))
                  ) : (
                    <span className="text-muted-foreground">{t.notProvided}</span>
                  )}
                </div>
              </section>
              <section>
                <h3 className="font-bold text-lg mb-3">{t.selfiePhoto}</h3>
                <div className="flex gap-3">
                  {profile.selfieUrl ? (
                    <img 
                      src={profile.selfieUrl} 
                      alt="Selfie" 
                      className="w-24 h-24 object-cover rounded-lg border-2 border-blue-500 shadow cursor-pointer hover:opacity-80 transition-opacity hover:ring-2 hover:ring-primary"
                      onClick={() => openLightbox([profile.selfieUrl!], 0)}
                      title={language === 'hi' ? 'बड़ा देखें' : 'View larger'}
                    />
                  ) : (
                    <span className="text-muted-foreground">{t.notProvided}</span>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Admin: Show contact information */}
          {isAdmin && (
            <>
              <Separator />
              <section className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Phone size={22} weight="fill" />
                  {t.contactInfo} ({language === 'hi' ? 'व्यवस्थापक दृश्य' : 'Admin View'})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem 
                    icon={<Phone size={18} />} 
                    label={t.mobileNumber} 
                    value={(profile as any).mobile || (profile as any).phoneNumber || t.notProvided} 
                  />
                  <InfoItem 
                    icon={<Envelope size={18} />} 
                    label={t.email} 
                    value={(profile as any).email || t.notProvided} 
                  />
                  <InfoItem 
                    icon={<UserCircle size={18} />} 
                    label={t.registeredBy} 
                    value={(profile as any).registeredByName || t.notProvided} 
                  />
                </div>
              </section>
            </>
          )}

          {profile.bio && (
            <>
              <Separator />
              <section>
                <h3 className="font-bold text-lg mb-3">{t.bio}</h3>
                <p className={`text-muted-foreground leading-relaxed ${blurContent ? 'blur-sm select-none' : ''}`}>
                  {profile.bio}
                </p>
                {blurContent && (
                  <p className="text-xs text-amber-600 mt-2">
                    {language === 'hi' 
                      ? 'पूर्ण विवरण देखने के लिए प्रीमियम योजना में अपग्रेड करें' 
                      : 'Upgrade to Premium plan to view full details'}
                  </p>
                )}
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

          {currentUserProfile && currentUserProfile.id !== profile.id && (
            <section className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Phone size={22} weight="fill" />
                {t.contactInfo}
              </h3>
              {blurContent ? (
                <div className="text-center py-4">
                  <div className="blur-sm select-none mb-3">
                    <p className="text-muted-foreground">+91 98XXX XXXXX</p>
                    <p className="text-muted-foreground">example@email.com</p>
                  </div>
                  <p className="text-sm text-amber-600">
                    {language === 'hi' 
                      ? 'संपर्क विवरण देखने के लिए प्रीमियम योजना में अपग्रेड करें' 
                      : 'Upgrade to Premium plan to view contact details'}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t.privacyNotice}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={handleExpressInterest} 
                      className="flex-1 bg-primary hover:bg-primary/90"
                      disabled={!!existingInterest || !!hasReceivedInterestFromProfile}
                      variant={(existingInterest || hasReceivedInterestFromProfile) ? "secondary" : "default"}
                    >
                      <Heart size={20} weight="fill" className="mr-2" />
                      {existingInterest 
                        ? (language === 'hi' ? 'रुचि भेजी गई' : 'Interest Sent')
                        : hasReceivedInterestFromProfile
                        ? (language === 'hi' ? 'रुचि प्राप्त' : 'Interest Received')
                        : t.expressInterest
                      }
                    </Button>
                    <Button onClick={handleRequestContact} variant="outline" className="flex-1">
                      <Phone size={20} className="mr-2" />
                      {t.requestContact}
                    </Button>
                  </div>
                </>
              )}
            </section>
          )}

          <div className="text-xs text-muted-foreground text-center pt-2">
            {t.profileId}: {profile.id} | {t.createdOn}: {formatDateDDMMYYYY(profile.createdAt)}
          </div>
        </div>

        {/* Photo Lightbox for viewing photos in full size */}
        <PhotoLightbox
          photos={lightboxState.photos}
          initialIndex={lightboxState.initialIndex}
          open={lightboxState.open}
          onClose={closeLightbox}
        />
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
