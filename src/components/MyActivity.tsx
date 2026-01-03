import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useKV } from '@/hooks/useKV'
import { Eye, Heart, ChatCircle, Check, X, MagnifyingGlassPlus } from '@phosphor-icons/react'
import type { Interest, ContactRequest, Profile, MembershipPlan } from '@/types/profile'
import type { ChatMessage } from '@/types/chat'
import type { Language } from '@/lib/translations'
import { toast } from 'sonner'
import { PhotoLightbox, useLightbox } from '@/components/PhotoLightbox'

// Membership settings interface for plan limits
interface MembershipSettings {
  freePlanChatLimit: number
  freePlanContactLimit: number
  sixMonthChatLimit: number
  sixMonthContactLimit: number
  oneYearChatLimit: number
  oneYearContactLimit: number
}

// Default limits if settings not provided
const DEFAULT_SETTINGS: MembershipSettings = {
  freePlanChatLimit: 5,
  freePlanContactLimit: 0,
  sixMonthChatLimit: 50,
  sixMonthContactLimit: 20,
  oneYearChatLimit: 120,
  oneYearContactLimit: 50
}

interface MyActivityProps {
  loggedInUserId: string | null
  profiles: Profile[]
  language: Language
  onViewProfile?: (profile: Profile) => void
  membershipPlan?: MembershipPlan
  membershipSettings?: MembershipSettings
  setProfiles?: (newValue: Profile[] | ((oldValue?: Profile[] | undefined) => Profile[])) => void
}

export function MyActivity({ loggedInUserId, profiles, language, onViewProfile, membershipPlan, membershipSettings, setProfiles }: MyActivityProps) {
  const [interests, setInterests] = useKV<Interest[]>('interests', [])
  const [contactRequests, setContactRequests] = useKV<ContactRequest[]>('contactRequests', [])
  const [messages] = useKV<ChatMessage[]>('chatMessages', [])
  
  // Lightbox for photo zoom
  const { lightboxState, openLightbox, closeLightbox } = useLightbox()

  const currentUserProfile = profiles.find(p => p.id === loggedInUserId)

  // Get settings with defaults
  const settings = { ...DEFAULT_SETTINGS, ...membershipSettings }

  // Get chat limit based on current plan
  const getChatLimit = (): number => {
    if (!membershipPlan || membershipPlan === 'free') {
      return settings.freePlanChatLimit
    } else if (membershipPlan === '6-month') {
      return settings.sixMonthChatLimit
    } else if (membershipPlan === '1-year') {
      return settings.oneYearChatLimit
    }
    return settings.freePlanChatLimit
  }

  // Get contact limit based on current plan
  const getContactLimit = (): number => {
    if (!membershipPlan || membershipPlan === 'free') {
      return settings.freePlanContactLimit
    } else if (membershipPlan === '6-month') {
      return settings.sixMonthContactLimit
    } else if (membershipPlan === '1-year') {
      return settings.oneYearContactLimit
    }
    return settings.freePlanContactLimit
  }

  const chatLimit = getChatLimit()
  const contactLimit = getContactLimit()
  const chatRequestsUsed = currentUserProfile?.chatRequestsUsed || currentUserProfile?.freeChatProfiles || []
  const contactViewsUsed = currentUserProfile?.contactViewsUsed || []

  const t = {
    title: language === 'hi' ? 'मेरी गतिविधि' : 'My Activity',
    sentInterests: language === 'hi' ? 'भेजी गई रुचि' : 'Sent Interests',
    receivedInterests: language === 'hi' ? 'प्राप्त रुचि' : 'Received Interests',
    myContactRequests: language === 'hi' ? 'संपर्क अनुरोध' : 'Contact Requests',
    recentChats: language === 'hi' ? 'नवीनतम चैट' : 'Recent Chats',
    profileViews: language === 'hi' ? 'प्रोफाइल देखे गए' : 'Profile Views',
    pending: language === 'hi' ? 'लंबित' : 'Pending',
    accepted: language === 'hi' ? 'स्वीकृत' : 'Accepted',
    declined: language === 'hi' ? 'अस्वीकृत' : 'Declined',
    approved: language === 'hi' ? 'स्वीकृत' : 'Approved',
    cancelled: language === 'hi' ? 'रद्द' : 'Cancelled',
    revoked: language === 'hi' ? 'वापस लिया' : 'Revoked',
    to: language === 'hi' ? 'को' : 'To',
    from: language === 'hi' ? 'से' : 'From',
    noActivity: language === 'hi' ? 'कोई गतिविधि नहीं' : 'No activity',
    viewProfile: language === 'hi' ? 'प्रोफाइल देखें' : 'View Profile',
    accept: language === 'hi' ? 'स्वीकार करें' : 'Accept',
    decline: language === 'hi' ? 'अस्वीकार करें' : 'Decline',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    revoke: language === 'hi' ? 'वापस लें' : 'Revoke',
    sentRequests: language === 'hi' ? 'भेजे गए अनुरोध' : 'Sent Requests',
    receivedRequests: language === 'hi' ? 'प्राप्त अनुरोध' : 'Received Requests',
    contactsRemaining: language === 'hi' ? 'संपर्क शेष' : 'Contacts remaining',
    chatsRemaining: language === 'hi' ? 'चैट शेष' : 'Chats remaining',
    usageInfo: language === 'hi' ? 'उपयोग जानकारी' : 'Usage Info',
    acceptInterestFirst: language === 'hi' ? 'पहले रुचि स्वीकार करें' : 'Accept interest first',
    interestNotAccepted: language === 'hi' ? 'संपर्क अनुरोध स्वीकार करने से पहले रुचि स्वीकार होनी चाहिए' : 'Interest must be accepted before accepting contact request',
    // Business flow info messages
    interestFlowInfo: language === 'hi' 
      ? '💡 रुचि स्वीकार करने पर प्रेषक का 1 चैट स्लॉट उपयोग होगा' 
      : '💡 Accepting interest will use 1 chat slot from sender',
    contactFlowInfo: language === 'hi' 
      ? '💡 संपर्क स्वीकार करने पर दोनों का 1-1 संपर्क स्लॉट उपयोग होगा' 
      : '💡 Accepting contact will use 1 slot from each party',
    revokeInfo: language === 'hi' 
      ? '↩️ कभी भी वापस ले सकते हैं - स्लॉट वापस मिलेगा' 
      : '↩️ Can revoke anytime - slots will be refunded',
    slotRefunded: language === 'hi' ? 'स्लॉट वापस कर दिया गया' : 'Slot refunded',
    noSlotImpact: language === 'hi' ? 'कोई स्लॉट प्रभाव नहीं' : 'No slot impact',
  }

  const sentInterests = interests?.filter(i => i.fromProfileId === currentUserProfile?.profileId) || []
  const receivedInterests = interests?.filter(i => i.toProfileId === currentUserProfile?.profileId) || []
  const sentContactRequests = contactRequests?.filter(r => r.fromUserId === loggedInUserId) || []
  const receivedContactRequests = contactRequests?.filter(r => r.toUserId === loggedInUserId) || []
  const myChats = messages?.filter(
    m => m.fromUserId === loggedInUserId || m.fromProfileId === currentUserProfile?.profileId || m.toProfileId === currentUserProfile?.profileId
  ).slice(-10) || []

  const getProfileByProfileId = (profileId: string) => {
    return profiles.find(p => p.profileId === profileId)
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getStatusBadge = (status: string) => {
    if (status === 'pending') return <Badge variant="secondary">{t.pending}</Badge>
    if (status === 'accepted' || status === 'approved') return <Badge variant="default" className="bg-teal">{t.accepted}</Badge>
    if (status === 'declined') return <Badge variant="destructive">{t.declined}</Badge>
    if (status === 'blocked') return <Badge variant="destructive">{language === 'hi' ? 'ब्लॉक' : 'Blocked'}</Badge>
    return <Badge>{status}</Badge>
  }

  const handleAcceptInterest = (interestId: string) => {
    const interest = interests?.find(i => i.id === interestId)
    if (!interest || !currentUserProfile) return

    const senderProfileId = interest.fromProfileId
    const senderProfile = profiles.find(p => p.profileId === senderProfileId)
    
    if (!senderProfile) {
      toast.error(language === 'hi' ? 'प्रेषक प्रोफाइल नहीं मिला' : 'Sender profile not found')
      return
    }

    // Business Logic: Use SENDER's chat slot when interest is accepted
    const senderChatUsed = senderProfile.chatRequestsUsed || []
    const acceptorProfileId = currentUserProfile.profileId
    
    // Check if sender already used a chat slot for this acceptor
    const senderAlreadyUsedSlot = senderChatUsed.includes(acceptorProfileId)

    if (!senderAlreadyUsedSlot && setProfiles) {
      // Check sender's chat limit
      const senderPlan = senderProfile.membershipPlan || 'free'
      const senderChatLimit = senderPlan === '1-year' ? settings.oneYearChatLimit 
        : senderPlan === '6-month' ? settings.sixMonthChatLimit 
        : settings.freePlanChatLimit

      if (senderChatUsed.length >= senderChatLimit) {
        toast.error(
          language === 'hi' 
            ? 'प्रेषक की चैट सीमा समाप्त हो गई है' 
            : 'Sender has reached their chat limit',
          {
            description: language === 'hi' 
              ? 'वे अपनी सदस्यता अपग्रेड करने के बाद आपसे चैट कर सकते हैं' 
              : 'They can chat with you after upgrading their membership',
            duration: 6000
          }
        )
        return
      }

      // Add to sender's chat used list
      const updatedSenderChatUsed = [...senderChatUsed, acceptorProfileId]
      setProfiles((current) => 
        (current || []).map(p => 
          p.id === senderProfile.id 
            ? { ...p, chatRequestsUsed: updatedSenderChatUsed, freeChatProfiles: updatedSenderChatUsed }
            : p
        )
      )
    }

    setInterests((current) => 
      (current || []).map(interest => 
        interest.id === interestId 
          ? { ...interest, status: 'accepted' as const }
          : interest
      )
    )
    toast.success(
      language === 'hi' ? 'रुचि स्वीकार की गई' : 'Interest accepted',
      {
        description: language === 'hi' 
          ? 'अब आप एक-दूसरे से चैट कर सकते हैं' 
          : 'You can now chat with each other'
      }
    )
  }

  const handleDeclineInterest = (interestId: string) => {
    setInterests((current) => 
      (current || []).map(interest => 
        interest.id === interestId 
          ? { ...interest, status: 'declined' as const }
          : interest
      )
    )
    toast.success(language === 'hi' ? 'रुचि अस्वीकार की गई' : 'Interest declined')
  }

  const handleAcceptContactRequest = (requestId: string) => {
    const request = contactRequests?.find(r => r.id === requestId)
    if (!request || !currentUserProfile) return

    const senderProfile = profiles.find(p => p.id === request.fromUserId)
    const senderProfileId = senderProfile?.profileId || request.fromProfileId || ''
    
    // Business Logic: Interest MUST be accepted before contact request can be accepted
    const interestFromSender = interests?.find(
      i => i.fromProfileId === senderProfileId && 
           i.toProfileId === currentUserProfile.profileId
    )
    
    if (!interestFromSender || interestFromSender.status !== 'accepted') {
      toast.error(
        t.acceptInterestFirst,
        {
          description: t.interestNotAccepted,
          duration: 6000
        }
      )
      return
    }

    if (!senderProfile) {
      toast.error(language === 'hi' ? 'प्रेषक प्रोफाइल नहीं मिला' : 'Sender profile not found')
      return
    }

    // Business Logic: Use BOTH sender's and accepter's contact slot
    const acceptorContactUsed = contactViewsUsed
    const senderContactUsed = senderProfile.contactViewsUsed || []
    const acceptorProfileId = currentUserProfile.profileId

    // Check if already used contact slot for this profile (for acceptor)
    const acceptorAlreadyViewed = acceptorContactUsed.includes(senderProfileId)
    // Check if sender already used contact slot for acceptor
    const senderAlreadyViewed = senderContactUsed.includes(acceptorProfileId)
    
    // Check ACCEPTOR's contact limit
    if (!acceptorAlreadyViewed && setProfiles) {
      if (acceptorContactUsed.length >= contactLimit) {
        toast.error(
          language === 'hi' 
            ? `आपकी संपर्क सीमा समाप्त: आप केवल ${contactLimit} प्रोफाइल का संपर्क देख सकते हैं` 
            : `Your contact limit reached: You can only view ${contactLimit} profile contacts`,
          {
            description: language === 'hi' 
              ? 'और संपर्क के लिए सदस्यता अपग्रेड करें' 
              : 'Upgrade membership for more contacts',
            duration: 6000
          }
        )
        return
      }
    }

    // Check SENDER's contact limit
    if (!senderAlreadyViewed && setProfiles) {
      const senderPlan = senderProfile.membershipPlan || 'free'
      const senderContactLimit = senderPlan === '1-year' ? settings.oneYearContactLimit 
        : senderPlan === '6-month' ? settings.sixMonthContactLimit 
        : settings.freePlanContactLimit

      if (senderContactUsed.length >= senderContactLimit) {
        toast.error(
          language === 'hi' 
            ? 'प्रेषक की संपर्क सीमा समाप्त हो गई है' 
            : 'Sender has reached their contact limit',
          {
            description: language === 'hi' 
              ? 'वे अपनी सदस्यता अपग्रेड करने के बाद संपर्क देख सकते हैं' 
              : 'They can view contacts after upgrading their membership',
            duration: 6000
          }
        )
        return
      }
    }

    // Update BOTH profiles' contact views
    if (setProfiles) {
      const updatedAcceptorContactViews = acceptorAlreadyViewed ? acceptorContactUsed : [...acceptorContactUsed, senderProfileId]
      const updatedSenderContactViews = senderAlreadyViewed ? senderContactUsed : [...senderContactUsed, acceptorProfileId]
      
      setProfiles((current) => 
        (current || []).map(p => {
          if (p.id === currentUserProfile.id) {
            return { ...p, contactViewsUsed: updatedAcceptorContactViews }
          }
          if (p.id === senderProfile.id) {
            return { ...p, contactViewsUsed: updatedSenderContactViews }
          }
          return p
        })
      )

      // Notify acceptor about remaining contacts
      if (!acceptorAlreadyViewed) {
        const remaining = contactLimit - updatedAcceptorContactViews.length
        if (remaining <= 0) {
          toast.warning(
            language === 'hi' ? 'यह आपका अंतिम संपर्क था!' : 'This was your last contact!',
            {
              description: language === 'hi' 
                ? 'और संपर्क के लिए सदस्यता अपग्रेड करें' 
                : 'Upgrade membership for more contacts',
              duration: 5000
            }
          )
        }
      }
    }
    
    // Update the contact request status
    setContactRequests((current) => 
      (current || []).map(req => 
        req.id === requestId 
          ? { ...req, status: 'approved' as const }
          : req
      )
    )
    
    toast.success(
      language === 'hi' 
        ? `${senderProfile?.fullName || 'उपयोगकर्ता'} का संपर्क अनुरोध स्वीकार किया गया` 
        : `Contact request from ${senderProfile?.fullName || 'user'} accepted`,
      {
        description: language === 'hi' 
          ? 'अब आप दोनों एक-दूसरे की संपर्क जानकारी देख सकते हैं।' 
          : 'You both can now view each other\'s contact details.'
      }
    )
  }

  const handleDeclineContactRequest = (requestId: string) => {
    const request = contactRequests?.find(r => r.id === requestId)
    const senderProfile = profiles.find(p => p.id === request?.fromUserId)
    
    setContactRequests((current) => 
      (current || []).map(req => 
        req.id === requestId 
          ? { ...req, status: 'declined' as const }
          : req
      )
    )
    
    toast.success(
      language === 'hi' 
        ? 'संपर्क अनुरोध अस्वीकार किया गया' 
        : 'Contact request declined',
      {
        description: language === 'hi' 
          ? `${senderProfile?.fullName || 'उपयोगकर्ता'} को सूचित किया जाएगा` 
          : `${senderProfile?.fullName || 'User'} will be notified`
      }
    )
  }

  // Cancel handlers for pending requests
  const handleCancelInterest = (interestId: string) => {
    const interest = interests?.find(i => i.id === interestId)
    if (!interest) return

    const receiverProfile = getProfileByProfileId(interest.toProfileId)
    
    setInterests((current) => 
      (current || []).filter(i => i.id !== interestId)
    )
    
    toast.success(
      language === 'hi' 
        ? 'रुचि रद्द की गई' 
        : 'Interest cancelled',
      {
        description: language === 'hi' 
          ? `${receiverProfile?.fullName || 'उपयोगकर्ता'} को अब यह अनुरोध नहीं दिखेगा` 
          : `${receiverProfile?.fullName || 'User'} will no longer see this request`
      }
    )
  }

  const handleCancelContactRequest = (requestId: string) => {
    const request = contactRequests?.find(r => r.id === requestId)
    if (!request) return

    const receiverProfile = profiles.find(p => p.id === request.toUserId)
    
    setContactRequests((current) => 
      (current || []).filter(r => r.id !== requestId)
    )
    
    toast.success(
      language === 'hi' 
        ? 'संपर्क अनुरोध रद्द किया गया' 
        : 'Contact request cancelled',
      {
        description: language === 'hi' 
          ? `${receiverProfile?.fullName || 'उपयोगकर्ता'} को अब यह अनुरोध नहीं दिखेगा` 
          : `${receiverProfile?.fullName || 'User'} will no longer see this request`
      }
    )
  }

  // Revoke handlers - can revoke after accepting, slots will be refunded
  const handleRevokeInterest = (interestId: string) => {
    const interest = interests?.find(i => i.id === interestId)
    if (!interest || !currentUserProfile) return

    const senderProfile = getProfileByProfileId(interest.fromProfileId)
    
    // Refund sender's chat slot
    if (senderProfile && setProfiles) {
      const senderChatUsed = senderProfile.chatRequestsUsed || senderProfile.freeChatProfiles || []
      const acceptorProfileId = currentUserProfile.profileId
      
      // Remove acceptor from sender's used list
      const updatedSenderChatUsed = senderChatUsed.filter(pid => pid !== acceptorProfileId)
      setProfiles((current) => 
        (current || []).map(p => 
          p.id === senderProfile.id 
            ? { ...p, chatRequestsUsed: updatedSenderChatUsed, freeChatProfiles: updatedSenderChatUsed }
            : p
        )
      )
    }

    // Update interest status to revoked/declined
    setInterests((current) => 
      (current || []).map(i => 
        i.id === interestId 
          ? { ...i, status: 'declined' as const, declinedAt: new Date().toISOString() }
          : i
      )
    )
    
    toast.success(
      language === 'hi' 
        ? 'रुचि वापस ली गई' 
        : 'Interest revoked',
      {
        description: language === 'hi' 
          ? `${senderProfile?.fullName || 'उपयोगकर्ता'} का चैट स्लॉट वापस कर दिया गया` 
          : `${senderProfile?.fullName || 'User'}'s chat slot has been refunded`
      }
    )
  }

  const handleRevokeContactRequest = (requestId: string) => {
    const request = contactRequests?.find(r => r.id === requestId)
    if (!request || !currentUserProfile) return

    const senderProfile = profiles.find(p => p.id === request.fromUserId)
    const senderProfileId = senderProfile?.profileId || request.fromProfileId || ''
    const acceptorProfileId = currentUserProfile.profileId

    // Refund BOTH parties' contact slots
    if (setProfiles) {
      // Refund acceptor's slot
      const acceptorContactUsed = contactViewsUsed
      const updatedAcceptorContactViews = acceptorContactUsed.filter(pid => pid !== senderProfileId)
      
      // Refund sender's slot
      const senderContactUsed = senderProfile?.contactViewsUsed || []
      const updatedSenderContactViews = senderContactUsed.filter(pid => pid !== acceptorProfileId)

      setProfiles((current) => 
        (current || []).map(p => {
          if (p.id === currentUserProfile.id) {
            return { ...p, contactViewsUsed: updatedAcceptorContactViews }
          }
          if (senderProfile && p.id === senderProfile.id) {
            return { ...p, contactViewsUsed: updatedSenderContactViews }
          }
          return p
        })
      )
    }

    // Update contact request status to declined
    setContactRequests((current) => 
      (current || []).map(req => 
        req.id === requestId 
          ? { ...req, status: 'declined' as const }
          : req
      )
    )
    
    toast.success(
      language === 'hi' 
        ? 'संपर्क अनुमति वापस ली गई' 
        : 'Contact permission revoked',
      {
        description: language === 'hi' 
          ? 'दोनों के संपर्क स्लॉट वापस कर दिए गए' 
          : 'Contact slots refunded for both parties'
      }
    )
  }

  return (
    <section className="container mx-auto px-4 md:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{t.title}</h2>
        </div>

        <Tabs defaultValue="sent-interests">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-1 p-1">
            <TabsTrigger value="sent-interests">{t.sentInterests}</TabsTrigger>
            <TabsTrigger value="received-interests">{t.receivedInterests}</TabsTrigger>
            <TabsTrigger value="contact-requests">{t.myContactRequests}</TabsTrigger>
            <TabsTrigger value="chats">{t.recentChats}</TabsTrigger>
          </TabsList>

          <TabsContent value="sent-interests">
            <Card>
              <CardHeader>
                <CardTitle>{t.sentInterests}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {sentInterests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t.noActivity}</p>
                  ) : (
                    <div className="space-y-4">
                      {sentInterests.map((interest) => {
                        const profile = getProfileByProfileId(interest.toProfileId)
                        return (
                          <Card key={interest.id}>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  {/* Profile Photo */}
                                  {profile?.photos?.[0] ? (
                                    <div 
                                      className="relative cursor-pointer group"
                                      onClick={() => openLightbox(profile.photos || [], 0)}
                                      title={language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge'}
                                    >
                                      <img 
                                        src={profile.photos[0]} 
                                        alt={profile.fullName || ''}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 group-hover:ring-2 group-hover:ring-primary/50 transition-all"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                        <MagnifyingGlassPlus size={16} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Heart size={24} weight="fill" className="text-primary" />
                                    </div>
                                  )}
                                  <div>
                                    <p 
                                      className={`font-semibold ${profile && onViewProfile ? 'cursor-pointer hover:text-primary hover:underline transition-colors' : ''}`}
                                      onClick={() => profile && onViewProfile?.(profile)}
                                    >
                                      {profile?.fullName || 'Unknown'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{profile?.profileId || interest.toProfileId}</p>
                                    <p className="text-xs text-muted-foreground">{formatDate(interest.createdAt)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(interest.status)}
                                  {/* Cancel button for pending interests */}
                                  {interest.status === 'pending' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleCancelInterest(interest.id)}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <X size={14} className="mr-1" />
                                      {t.cancel}
                                    </Button>
                                  )}
                                  {/* Revoke button for accepted interests - sender can also revoke */}
                                  {interest.status === 'accepted' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleRevokeInterest(interest.id)}
                                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                                    >
                                      <X size={14} className="mr-1" />
                                      {t.revoke}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="received-interests">
            <Card>
              <CardHeader>
                <CardTitle>{t.receivedInterests}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {receivedInterests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t.noActivity}</p>
                  ) : (
                    <div className="space-y-4">
                      {receivedInterests.map((interest) => {
                        const profile = getProfileByProfileId(interest.fromProfileId)
                        return (
                          <Card key={interest.id}>
                            <CardContent className="pt-6">
                              <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    {/* Profile Photo */}
                                    {profile?.photos?.[0] ? (
                                      <div 
                                        className="relative cursor-pointer group"
                                        onClick={() => openLightbox(profile.photos || [], 0)}
                                        title={language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge'}
                                      >
                                        <img 
                                          src={profile.photos[0]} 
                                          alt={profile.fullName || ''}
                                          className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 group-hover:ring-2 group-hover:ring-primary/50 transition-all"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                          <MagnifyingGlassPlus size={16} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                                        <Heart size={24} weight="fill" className="text-accent" />
                                      </div>
                                    )}
                                    <div>
                                      <p 
                                        className={`font-semibold ${profile && onViewProfile ? 'cursor-pointer hover:text-primary hover:underline transition-colors' : ''}`}
                                        onClick={() => profile && onViewProfile?.(profile)}
                                      >
                                        {profile?.fullName || 'Unknown'}
                                      </p>
                                      <p className="text-sm text-muted-foreground">{profile?.profileId || interest.fromProfileId}</p>
                                      <p className="text-xs text-muted-foreground">{formatDate(interest.createdAt)}</p>
                                    </div>
                                  </div>
                                  {getStatusBadge(interest.status)}
                                </div>
                                <div className="flex gap-2">
                                  {interest.status === 'pending' && (
                                    <>
                                      <Button 
                                        variant="default" 
                                        size="sm"
                                        onClick={() => handleAcceptInterest(interest.id)}
                                        className="flex-1 bg-teal hover:bg-teal/90"
                                      >
                                        <Check size={16} className="mr-2" />
                                        {t.accept}
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => handleDeclineInterest(interest.id)}
                                        className="flex-1"
                                      >
                                        <X size={16} className="mr-2" />
                                        {t.decline}
                                      </Button>
                                    </>
                                  )}
                                  {/* Revoke button for accepted interests */}
                                  {interest.status === 'accepted' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleRevokeInterest(interest.id)}
                                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                                    >
                                      <X size={14} className="mr-1" />
                                      {t.revoke}
                                    </Button>
                                  )}
                                </div>
                                {/* Info text for pending */}
                                {interest.status === 'pending' && (
                                  <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-2 rounded">
                                    <p>{t.interestFlowInfo}</p>
                                    <p className="text-green-600">{t.revokeInfo}</p>
                                  </div>
                                )}
                                {/* Info text for accepted */}
                                {interest.status === 'accepted' && (
                                  <p className="text-xs text-green-600">
                                    {t.revokeInfo}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact-requests">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t.myContactRequests}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {t.contactsRemaining}: {contactLimit - contactViewsUsed.length}/{contactLimit}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="sent-requests">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="sent-requests">{t.sentRequests}</TabsTrigger>
                    <TabsTrigger value="received-requests">{t.receivedRequests}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="sent-requests">
                    <ScrollArea className="h-[450px]">
                      {sentContactRequests.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">{t.noActivity}</p>
                      ) : (
                        <div className="space-y-4">
                          {sentContactRequests.map((request) => {
                            const profile = profiles.find(p => p.id === request.toUserId)
                            return (
                              <Card key={request.id}>
                                <CardContent className="pt-6">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      {/* Profile Photo */}
                                      {profile?.photos?.[0] ? (
                                        <div 
                                          className="relative cursor-pointer group"
                                          onClick={() => openLightbox(profile.photos || [], 0)}
                                          title={language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge'}
                                        >
                                          <img 
                                            src={profile.photos[0]} 
                                            alt={profile.fullName || ''}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 group-hover:ring-2 group-hover:ring-primary/50 transition-all"
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                            <MagnifyingGlassPlus size={16} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center">
                                          <Eye size={24} weight="fill" className="text-teal" />
                                        </div>
                                      )}
                                      <div>
                                        <p 
                                          className={`font-semibold ${profile && onViewProfile ? 'cursor-pointer hover:text-primary hover:underline transition-colors' : ''}`}
                                          onClick={() => profile && onViewProfile?.(profile)}
                                        >
                                          {profile?.fullName || 'Unknown'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{profile?.profileId || 'Unknown'}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {getStatusBadge(request.status)}
                                      {/* Cancel button for pending contact requests */}
                                      {request.status === 'pending' && (
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleCancelContactRequest(request.id)}
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                          <X size={14} className="mr-1" />
                                          {t.cancel}
                                        </Button>
                                      )}
                                      {/* Revoke button for approved contact requests */}
                                      {request.status === 'approved' && (
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleRevokeContactRequest(request.id)}
                                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                                        >
                                          <X size={14} className="mr-1" />
                                          {t.revoke}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="received-requests">
                    <ScrollArea className="h-[450px]">
                      {receivedContactRequests.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">{t.noActivity}</p>
                      ) : (
                        <div className="space-y-4">
                          {receivedContactRequests.map((request) => {
                            const profile = profiles.find(p => p.id === request.fromUserId)
                            return (
                              <Card key={request.id}>
                                <CardContent className="pt-6">
                                  <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        {/* Profile Photo */}
                                        {profile?.photos?.[0] ? (
                                          <div 
                                            className="relative cursor-pointer group"
                                            onClick={() => openLightbox(profile.photos || [], 0)}
                                            title={language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge'}
                                          >
                                            <img 
                                              src={profile.photos[0]} 
                                              alt={profile.fullName || ''}
                                              className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 group-hover:ring-2 group-hover:ring-primary/50 transition-all"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                              <MagnifyingGlassPlus size={16} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                                            <Eye size={24} weight="fill" className="text-accent" />
                                          </div>
                                        )}
                                        <div>
                                          <p 
                                            className={`font-semibold ${profile && onViewProfile ? 'cursor-pointer hover:text-primary hover:underline transition-colors' : ''}`}
                                            onClick={() => profile && onViewProfile?.(profile)}
                                          >
                                            {profile?.fullName || 'Unknown'}
                                          </p>
                                          <p className="text-sm text-muted-foreground">{profile?.profileId || 'Unknown'}</p>
                                          <p className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</p>
                                        </div>
                                      </div>
                                      {getStatusBadge(request.status)}
                                    </div>
                                    {/* Accept/Decline buttons for pending requests */}
                                    {request.status === 'pending' && (() => {
                                      // Check if interest from sender is accepted
                                      const senderProfileId = profile?.profileId || request.fromProfileId
                                      const interestFromSender = interests?.find(
                                        i => i.fromProfileId === senderProfileId && 
                                             i.toProfileId === currentUserProfile?.profileId
                                      )
                                      const isInterestAccepted = interestFromSender?.status === 'accepted'
                                      
                                      return (
                                        <div className="space-y-2">
                                          <div className="flex gap-2">
                                            <Button 
                                              variant="default" 
                                              size="sm"
                                              onClick={() => handleAcceptContactRequest(request.id)}
                                              className="flex-1 bg-teal hover:bg-teal/90"
                                              disabled={!isInterestAccepted}
                                            >
                                              <Check size={16} className="mr-2" />
                                              {t.accept}
                                            </Button>
                                            <Button 
                                              variant="destructive" 
                                              size="sm"
                                              onClick={() => handleDeclineContactRequest(request.id)}
                                              className="flex-1"
                                            >
                                              <X size={16} className="mr-2" />
                                              {t.decline}
                                            </Button>
                                          </div>
                                          {!isInterestAccepted && (
                                            <p className="text-xs text-amber-600 text-center font-medium">
                                              ⚠️ {t.acceptInterestFirst}
                                            </p>
                                          )}
                                          <p className="text-xs text-muted-foreground text-center">
                                            {t.contactFlowInfo}
                                          </p>
                                          <p className="text-xs text-green-600 text-center">
                                            {t.revokeInfo}
                                          </p>
                                        </div>
                                      )
                                    })()}
                                    {/* Revoke button for approved contact requests */}
                                    {request.status === 'approved' && (
                                      <div className="space-y-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleRevokeContactRequest(request.id)}
                                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                                        >
                                          <X size={14} className="mr-1" />
                                          {t.revoke}
                                        </Button>
                                        <p className="text-xs text-green-600">
                                          {t.revokeInfo}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chats">
            <Card>
              <CardHeader>
                <CardTitle>{t.recentChats}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {myChats.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t.noActivity}</p>
                  ) : (
                    <div className="space-y-4">
                      {myChats.map((msg) => {
                        const isMyMessage = msg.fromProfileId === currentUserProfile?.profileId
                        const otherProfileId = isMyMessage ? msg.toProfileId : msg.fromProfileId
                        const otherProfile = profiles.find(p => p.profileId === otherProfileId)
                        const isAdminMessage = msg.type === 'admin-broadcast' || msg.type === 'admin-to-user' || msg.type === 'admin'
                        
                        return (
                          <Card key={msg.id}>
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-4">
                                {/* Profile Photo */}
                                {isAdminMessage ? (
                                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <ChatCircle size={24} weight="fill" className="text-primary" />
                                  </div>
                                ) : otherProfile?.photos?.[0] ? (
                                  <div 
                                    className="relative cursor-pointer group"
                                    onClick={() => openLightbox(otherProfile.photos || [], 0)}
                                    title={language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge'}
                                  >
                                    <img 
                                      src={otherProfile.photos[0]} 
                                      alt={otherProfile.fullName || ''}
                                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 group-hover:ring-2 group-hover:ring-primary/50 transition-all"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                      <MagnifyingGlassPlus size={16} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                    <ChatCircle size={24} weight="fill" className={isMyMessage ? 'text-primary' : 'text-accent'} />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <p 
                                        className={`font-semibold ${!isAdminMessage && otherProfile && onViewProfile ? 'cursor-pointer hover:text-primary hover:underline transition-colors' : ''}`}
                                        onClick={() => !isAdminMessage && otherProfile && onViewProfile?.(otherProfile)}
                                      >
                                        {isAdminMessage ? 'Admin' : (otherProfile?.fullName || 'Unknown')}
                                      </p>
                                      {!isAdminMessage && (
                                        <p className="text-xs text-muted-foreground">{otherProfile?.profileId || otherProfileId}</p>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(msg.timestamp || msg.createdAt).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')}
                                    </p>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">{msg.message}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Photo Lightbox for viewing photos in full size */}
      <PhotoLightbox
        photos={lightboxState.photos}
        initialIndex={lightboxState.initialIndex}
        open={lightboxState.open}
        onClose={closeLightbox}
      />
    </section>
  )
}
