import { useState } from 'react'
import { useKV } from '@/hooks/useKV'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Heart, Check, X, Eye, Clock, ChatCircle, ProhibitInset, Phone, Envelope as EnvelopeIcon, MagnifyingGlassPlus, User } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Interest, ContactRequest, Profile, BlockedProfile, MembershipPlan } from '@/types/profile'
import { ProfileDetailDialog } from '@/components/ProfileDetailDialog'
import type { ChatMessage } from '@/types/chat'
import type { Language } from '@/lib/translations'
import { formatDateDDMMYYYY } from '@/lib/utils'
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

interface InboxProps {
  loggedInUserId: string | null
  profiles: Profile[]
  language: Language
  onNavigateToChat?: (profileId?: string) => void
  membershipPlan?: MembershipPlan
  membershipSettings?: MembershipSettings
  setProfiles?: (newValue: Profile[] | ((oldValue?: Profile[] | undefined) => Profile[])) => void
}

export function Inbox({ loggedInUserId, profiles, language, onNavigateToChat, membershipPlan, membershipSettings, setProfiles }: InboxProps) {
  const [interests, setInterests] = useKV<Interest[]>('interests', [])
  const [contactRequests, setContactRequests] = useKV<ContactRequest[]>('contactRequests', [])
  const [_messages, setMessages] = useKV<ChatMessage[]>('chatMessages', [])
  const [_blockedProfiles, setBlockedProfiles] = useKV<BlockedProfile[]>('blockedProfiles', [])
  const [interestToDecline, setInterestToDecline] = useState<string | null>(null)
  const [interestToBlock, setInterestToBlock] = useState<{ interestId: string, profileId: string } | null>(null)
  const [viewContactProfile, setViewContactProfile] = useState<Profile | null>(null)
  const [selectedProfileForDetails, setSelectedProfileForDetails] = useState<Profile | null>(null)
  
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

  const chatLimit = getChatLimit()
  const chatRequestsUsed = currentUserProfile?.chatRequestsUsed || currentUserProfile?.freeChatProfiles || []
  const remainingChats = Math.max(0, chatLimit - chatRequestsUsed.length)

  const t = {
    title: language === 'hi' ? 'इनबॉक्स' : 'Inbox',
    receivedInterest: language === 'hi' ? 'प्राप्त रुचि' : 'Received Interest',
    acceptedInterest: language === 'hi' ? 'स्वीकृत रुचि' : 'Accepted Interest',
    contactRequests: language === 'hi' ? 'संपर्क अनुरोध' : 'Contact Requests',
    accept: language === 'hi' ? 'स्वीकार करें' : 'Accept',
    decline: language === 'hi' ? 'अस्वीकार करें' : 'Decline',
    block: language === 'hi' ? 'ब्लॉक करें' : 'Block',
    viewContact: language === 'hi' ? 'संपर्क देखें' : 'View Contact',
    approve: language === 'hi' ? 'स्वीकृत करें' : 'Approve',
    pending: language === 'hi' ? 'लंबित' : 'Pending',
    approved: language === 'hi' ? 'स्वीकृत' : 'Approved',
    declined: language === 'hi' ? 'अस्वीकृत' : 'Declined',
    noInterests: language === 'hi' ? 'कोई रुचि नहीं' : 'No interests',
    noContactRequests: language === 'hi' ? 'कोई संपर्क अनुरोध नहीं' : 'No contact requests',
    from: language === 'hi' ? 'से' : 'From',
    sentOn: language === 'hi' ? 'भेजा गया' : 'Sent on',
    interestAccepted: language === 'hi' ? 'रुचि स्वीकार की गई' : 'Interest accepted',
    interestDeclined: language === 'hi' ? 'रुचि अस्वीकार की गई' : 'Interest declined',
    contactApproved: language === 'hi' ? 'संपर्क स्वीकृत किया गया' : 'Contact approved',
    contactDeclined: language === 'hi' ? 'संपर्क अस्वीकृत किया गया' : 'Contact declined',
    startChat: language === 'hi' ? 'चैट शुरू करें' : 'Start Chat',
    confirmDecline: language === 'hi' ? 'क्या आप वाकई इस रुचि को अस्वीकार करना चाहते हैं?' : 'Are you sure you want to decline this interest?',
    confirmBlock: language === 'hi' ? 'क्या आप वाकई इस प्रोफाइल को ब्लॉक करना चाहते हैं?' : 'Are you sure you want to block this profile?',
    blockWarning: language === 'hi' ? 'ब्लॉक करने के बाद, यह प्रोफाइल आपको फिर से नहीं दिखेगी और वे आपकी प्रोफाइल भी नहीं देख पाएंगे।' : 'After blocking, this profile will not be shown to you again and they will not be able to see your profile either.',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    confirm: language === 'hi' ? 'पुष्टि करें' : 'Confirm',
    profileBlocked: language === 'hi' ? 'प्रोफाइल ब्लॉक की गई' : 'Profile blocked',
    contactInformation: language === 'hi' ? 'संपर्क जानकारी' : 'Contact Information',
    mobile: language === 'hi' ? 'मोबाइल' : 'Mobile',
    email: language === 'hi' ? 'ईमेल' : 'Email',
    notProvided: language === 'hi' ? 'उपलब्ध नहीं' : 'Not Provided',
    close: language === 'hi' ? 'बंद करें' : 'Close',
    chatLimitReached: language === 'hi' 
      ? `चैट सीमा समाप्त: आप केवल ${chatLimit} प्रोफाइल के साथ चैट कर सकते हैं` 
      : `Chat limit reached: You can only chat with ${chatLimit} profiles`,
    upgradeForMoreChats: language === 'hi' 
      ? 'और चैट के लिए सदस्यता अपग्रेड करें' 
      : 'Upgrade membership for more chats',
    chatRemaining: language === 'hi' 
      ? (n: number) => `चैट शेष: ${n} प्रोफाइल` 
      : (n: number) => `Chats remaining: ${n} profiles`,
    lastChat: language === 'hi' 
      ? 'यह आपकी अंतिम चैट थी!' 
      : 'This was your last chat!',
    remainingChats: language === 'hi' ? 'शेष चैट' : 'Chats Left',
    viewProfile: language === 'hi' ? 'प्रोफाइल देखें' : 'View Profile',
    clickToViewProfile: language === 'hi' ? 'प्रोफाइल देखने के लिए क्लिक करें' : 'Click to view profile',
  }

  // Helper to check if a profile is deleted
  const isProfileDeleted = (profileId: string) => {
    const profile = profiles.find(p => p.profileId === profileId)
    return profile?.isDeleted === true
  }
  
  const receivedInterests = interests?.filter(
    i => i.toProfileId === currentUserProfile?.profileId && i.status === 'pending' && !isProfileDeleted(i.fromProfileId)
  ) || []

  const acceptedInterests = interests?.filter(
    i => (i.toProfileId === currentUserProfile?.profileId || i.fromProfileId === currentUserProfile?.profileId) && 
       i.status === 'accepted'
  ) || []

  const pendingContactRequests = contactRequests?.filter(
    r => r.toUserId === loggedInUserId && r.status === 'pending'
  ) || []

  const allContactRequests = contactRequests?.filter(
    r => r.toUserId === loggedInUserId
  ) || []

  const handleAcceptInterest = (interestId: string) => {
    const interest = interests?.find(i => i.id === interestId)
    if (!interest || !currentUserProfile) return

    const senderProfileId = interest.fromProfileId
    const senderProfile = getProfileByProfileId(senderProfileId)
    
    if (!senderProfile) {
      toast.error(language === 'hi' ? 'प्रेषक प्रोफाइल नहीं मिला' : 'Sender profile not found')
      return
    }

    // Business Logic: Use SENDER's chat slot when interest is accepted
    const senderChatUsed = senderProfile.chatRequestsUsed || senderProfile.freeChatProfiles || []
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

    setInterests(current => 
      (current || []).map(i => 
        i.id === interestId ? { ...i, status: 'accepted' as const } : i
      )
    )

    // Send welcome messages (senderProfile already defined above)
    if (senderProfile) {
      const welcomeMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        fromUserId: 'system',
        fromProfileId: currentUserProfile.profileId,
        toProfileId: interest.fromProfileId,
        message: language === 'hi' 
          ? `${currentUserProfile.fullName} ने आपकी रुचि स्वीकार कर ली है! अब आप उनसे बात कर सकते हैं।`
          : `${currentUserProfile.fullName} has accepted your interest! You can now chat with them.`,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        read: false,
        type: 'user-to-user',
      }

      const responseMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        fromUserId: 'system',
        fromProfileId: interest.fromProfileId,
        toProfileId: currentUserProfile.profileId,
        message: language === 'hi' 
          ? `आपने ${senderProfile.fullName} की रुचि स्वीकार कर ली है। अब आप उनसे बात कर सकते हैं।`
          : `You have accepted ${senderProfile.fullName}'s interest. You can now chat with them.`,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        read: false,
        type: 'user-to-user',
      }

      setMessages(current => [...(current || []), welcomeMessage, responseMessage])
    }

    toast.success(t.interestAccepted, {
      description: language === 'hi' 
        ? 'आप अब चैट सेक्शन में जाकर बातचीत शुरू कर सकते हैं।'
        : 'You can now start chatting in the Chat section.'
    })
  }

  const handleDeclineInterest = (interestId: string) => {
    setInterests(current => 
      (current || []).map(i => 
        i.id === interestId ? { ...i, status: 'declined' as const, declinedAt: new Date().toISOString() } : i
      )
    )
    setInterestToDecline(null)
    toast.success(t.interestDeclined)
  }

  const handleBlockProfile = (interestId: string, profileIdToBlock: string) => {
    if (!currentUserProfile) return

    setInterests(current => 
      (current || []).map(i => 
        i.id === interestId ? { ...i, status: 'blocked' as const, blockedAt: new Date().toISOString() } : i
      )
    )

    const newBlock: BlockedProfile = {
      id: `block-${Date.now()}`,
      blockerProfileId: currentUserProfile.profileId,
      blockedProfileId: profileIdToBlock,
      createdAt: new Date().toISOString(),
    }

    setBlockedProfiles(current => [...(current || []), newBlock])
    setInterestToBlock(null)
    toast.success(t.profileBlocked)
  }

  const handleApproveContact = (requestId: string) => {
    setContactRequests(current => 
      (current || []).map(r => 
        r.id === requestId ? { ...r, status: 'approved' as const } : r
      )
    )
    toast.success(t.contactApproved)
  }

  const handleDeclineContact = (requestId: string) => {
    setContactRequests(current => 
      (current || []).map(r => 
        r.id === requestId ? { ...r, status: 'declined' as const } : r
      )
    )
    toast.success(t.contactDeclined)
  }

  const getProfileByProfileId = (profileId: string) => {
    return profiles.find(p => p.profileId === profileId)
  }

  const formatDate = (date: string) => {
    return formatDateDDMMYYYY(date)
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t.title}</h1>

        <Tabs defaultValue="received" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="received">
              {t.receivedInterest}
              {receivedInterests.length > 0 && (
                <Badge className="ml-2" variant="destructive">{receivedInterests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted">{t.acceptedInterest}</TabsTrigger>
            <TabsTrigger value="contact">
              {t.contactRequests}
              {pendingContactRequests.length > 0 && (
                <Badge className="ml-2" variant="destructive">{pendingContactRequests.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            {/* Show remaining chats info */}
            {setProfiles && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ChatCircle size={18} />
                  <span>
                    {language === 'hi' 
                      ? 'रुचि स्वीकार करने पर चैट सीमा से एक घटेगी' 
                      : 'Accepting an interest uses 1 chat slot'}
                  </span>
                </div>
                <Badge variant={remainingChats > 0 ? "outline" : "destructive"}>
                  {language === 'hi' 
                    ? `शेष चैट: ${remainingChats}/${chatLimit}` 
                    : `Chats: ${remainingChats}/${chatLimit}`}
                </Badge>
              </div>
            )}
            
            {receivedInterests.length === 0 ? (
              <Alert>
                <AlertDescription>{t.noInterests}</AlertDescription>
              </Alert>
            ) : (
              receivedInterests.map(interest => {
                const profile = getProfileByProfileId(interest.fromProfileId)
                // Skip if profile not found or is deleted
                if (!profile || profile.isDeleted) return null
                
                // Check if already chatted with this profile
                const alreadyChatted = chatRequestsUsed.includes(interest.fromProfileId)
                // Can accept if already chatted OR if remaining chats available
                const canAccept = alreadyChatted || remainingChats > 0
                
                return (
                  <Card key={interest.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {profile.photos?.[0] ? (
                            <div 
                              className="relative cursor-pointer group"
                              onClick={() => openLightbox(profile.photos || [], 0)}
                              title={language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge'}
                            >
                              <img 
                                src={profile.photos[0]} 
                                alt={profile.fullName}
                                className="h-16 w-16 rounded-full object-cover border-2 border-primary/20 group-hover:ring-4 group-hover:ring-primary/50 transition-all"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                <MagnifyingGlassPlus size={20} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                              {profile.firstName[0]}{profile.lastName[0]}
                            </div>
                          )}
                          <div>
                            <h3 
                              className="font-bold text-lg text-primary hover:underline cursor-pointer inline-flex items-center gap-1 transition-colors"
                              onClick={() => setSelectedProfileForDetails(profile)}
                              title={t.clickToViewProfile}
                            >
                              {profile.fullName}
                              <User size={14} weight="bold" className="opacity-60" />
                            </h3>
                            <p className="text-sm text-muted-foreground">{profile.profileId}</p>
                            <p className="text-sm text-muted-foreground">
                              {profile.age} {language === 'hi' ? 'वर्ष' : 'years'} • {profile.location}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t.sentOn}: {formatDate(interest.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleAcceptInterest(interest.id)}
                              disabled={!canAccept}
                              className="gap-2"
                              title={!canAccept ? (language === 'hi' ? 'चैट सीमा समाप्त' : 'Chat limit reached') : ''}
                            >
                              <Check size={16} />
                              {t.accept}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeclineInterest(interest.id)}
                              className="gap-2"
                            >
                              <X size={16} />
                              {t.decline}
                            </Button>
                          </div>
                          {!canAccept && (
                            <p className="text-xs text-destructive text-right">
                              {language === 'hi' 
                                ? 'चैट सीमा समाप्त - अपग्रेड करें' 
                                : 'Chat limit reached - Upgrade'}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="accepted" className="space-y-4">
            {acceptedInterests.length === 0 ? (
              <Alert>
                <AlertDescription>{t.noInterests}</AlertDescription>
              </Alert>
            ) : (
              acceptedInterests.map(interest => {
                const otherProfileId = interest.fromProfileId === currentUserProfile?.profileId 
                  ? interest.toProfileId 
                  : interest.fromProfileId
                const profile = getProfileByProfileId(otherProfileId)
                // Skip if profile not found or is deleted
                if (!profile || profile.isDeleted) return null
                
                return (
                  <Card key={interest.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {profile.photos?.[0] ? (
                              <div 
                                className="relative cursor-pointer group"
                                onClick={() => openLightbox(profile.photos || [], 0)}
                                title={language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge'}
                              >
                                <img 
                                  src={profile.photos[0]} 
                                  alt={profile.fullName}
                                  className="h-16 w-16 rounded-full object-cover border-2 border-primary/20 group-hover:ring-4 group-hover:ring-primary/50 transition-all"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                  <MagnifyingGlassPlus size={20} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ) : (
                              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                                {profile.firstName[0]}{profile.lastName[0]}
                              </div>
                            )}
                            <div>
                              <h3 
                                className="font-bold text-lg text-primary hover:underline cursor-pointer inline-flex items-center gap-1 transition-colors"
                                onClick={() => setSelectedProfileForDetails(profile)}
                                title={t.clickToViewProfile}
                              >
                                {profile.fullName}
                                <User size={14} weight="bold" className="opacity-60" />
                              </h3>
                              <p className="text-sm text-muted-foreground">{profile.profileId}</p>
                              <p className="text-sm text-muted-foreground">
                                {profile.age} {language === 'hi' ? 'वर्ष' : 'years'} • {profile.location}
                              </p>
                              <Badge variant="secondary" className="mt-2">
                                <Heart size={14} className="mr-1" weight="fill" />
                                {t.approved}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => onNavigateToChat && onNavigateToChat(otherProfileId)}
                            className="gap-2 flex-1"
                          >
                            <ChatCircle size={18} weight="fill" />
                            {t.startChat}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setInterestToDecline(interest.id)}
                            className="gap-2"
                          >
                            <X size={18} />
                            {t.decline}
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => setInterestToBlock({ interestId: interest.id, profileId: otherProfileId })}
                            className="gap-2"
                          >
                            <ProhibitInset size={18} weight="fill" />
                            {t.block}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            {allContactRequests.length === 0 ? (
              <Alert>
                <AlertDescription>{t.noContactRequests}</AlertDescription>
              </Alert>
            ) : (
              allContactRequests.map(request => {
                const profile = profiles.find(p => p.id === request.fromUserId)
                // Skip if profile not found or is deleted
                if (!profile || profile.isDeleted) return null
                
                return (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {profile.photos?.[0] ? (
                            <div 
                              className="relative cursor-pointer group"
                              onClick={() => openLightbox(profile.photos || [], 0)}
                              title={language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge'}
                            >
                              <img 
                                src={profile.photos[0]} 
                                alt={profile.fullName}
                                className="h-16 w-16 rounded-full object-cover border-2 border-primary/20 group-hover:ring-4 group-hover:ring-primary/50 transition-all"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                <MagnifyingGlassPlus size={20} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                              {profile.firstName[0]}{profile.lastName[0]}
                            </div>
                          )}
                          <div>
                            <h3 
                              className="font-bold text-lg text-primary hover:underline cursor-pointer inline-flex items-center gap-1 transition-colors"
                              onClick={() => setSelectedProfileForDetails(profile)}
                              title={t.clickToViewProfile}
                            >
                              {profile.fullName}
                              <User size={14} weight="bold" className="opacity-60" />
                            </h3>
                            <p className="text-sm text-muted-foreground">{profile.profileId}</p>
                            <p className="text-sm text-muted-foreground">
                              {profile.age} {language === 'hi' ? 'वर्ष' : 'years'} • {profile.location}
                            </p>
                            <Badge variant={
                              request.status === 'approved' ? 'default' :
                              request.status === 'declined' ? 'destructive' : 'secondary'
                            } className="mt-2">
                              {request.status === 'approved' ? <Check size={14} className="mr-1" /> :
                               request.status === 'declined' ? <X size={14} className="mr-1" /> :
                               <Clock size={14} className="mr-1" />}
                              {request.status === 'approved' ? t.approved :
                               request.status === 'declined' ? t.declined : t.pending}
                            </Badge>
                          </div>
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleApproveContact(request.id)}
                              className="gap-2"
                            >
                              <Check size={16} />
                              {t.approve}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeclineContact(request.id)}
                              className="gap-2"
                            >
                              <X size={16} />
                              {t.decline}
                            </Button>
                          </div>
                        )}
                        {request.status === 'approved' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="gap-2"
                            onClick={() => setViewContactProfile(profile)}
                          >
                            <Eye size={16} />
                            {t.viewContact}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
        </Tabs>

        <AlertDialog open={!!interestToDecline} onOpenChange={(open) => !open && setInterestToDecline(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.decline}</AlertDialogTitle>
              <AlertDialogDescription>
                {t.confirmDecline}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={() => interestToDecline && handleDeclineInterest(interestToDecline)}>
                {t.confirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!interestToBlock} onOpenChange={(open) => !open && setInterestToBlock(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.block}</AlertDialogTitle>
              <AlertDialogDescription>
                {t.confirmBlock}
                <br /><br />
                {t.blockWarning}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => interestToBlock && handleBlockProfile(interestToBlock.interestId, interestToBlock.profileId)}
                className="bg-destructive hover:bg-destructive/90"
              >
                {t.confirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={!!viewContactProfile} onOpenChange={(open) => !open && setViewContactProfile(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.contactInformation}</DialogTitle>
            </DialogHeader>
            {viewContactProfile && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-3xl font-bold">
                    {viewContactProfile.firstName[0]}{viewContactProfile.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{viewContactProfile.fullName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {viewContactProfile.age} {language === 'hi' ? 'वर्ष' : 'years'} • {viewContactProfile.location}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <Phone size={24} weight="bold" className="text-primary mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">{t.mobile}</p>
                      <p className="text-lg font-semibold">
                        {viewContactProfile.hideMobile ? t.notProvided : (viewContactProfile.mobile?.replace(/^undefined\s*/i, '') || t.notProvided)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <EnvelopeIcon size={24} weight="bold" className="text-primary mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">{t.email}</p>
                      <p className="text-lg font-semibold break-all">
                        {viewContactProfile.hideEmail ? t.notProvided : viewContactProfile.email}
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setViewContactProfile(null)} 
                  className="w-full"
                >
                  {t.close}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Photo Lightbox for viewing photos in full size */}
        <PhotoLightbox
          photos={lightboxState.photos}
          initialIndex={lightboxState.initialIndex}
          open={lightboxState.open}
          onClose={closeLightbox}
        />

        {/* Profile Detail Dialog for viewing full profile */}
        <ProfileDetailDialog
          profile={selectedProfileForDetails}
          open={!!selectedProfileForDetails}
          onClose={() => setSelectedProfileForDetails(null)}
          language={language}
          currentUserProfile={currentUserProfile}
          isLoggedIn={!!loggedInUserId}
          membershipPlan={membershipPlan}
          membershipSettings={membershipSettings}
          setProfiles={setProfiles}
        />
      </div>
    </div>
  )
}
