import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Heart, Check, X, Eye, Clock, ChatCircle, ProhibitInset } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Interest, ContactRequest, Profile, BlockedProfile } from '@/types/profile'
import type { ChatMessage } from '@/types/chat'
import type { Language } from '@/lib/translations'

interface InboxProps {
  loggedInUserId: string | null
  profiles: Profile[]
  language: Language
  onNavigateToChat?: () => void
}

export function Inbox({ loggedInUserId, profiles, language, onNavigateToChat }: InboxProps) {
  const [interests, setInterests] = useKV<Interest[]>('interests', [])
  const [contactRequests, setContactRequests] = useKV<ContactRequest[]>('contactRequests', [])
  const [messages, setMessages] = useKV<ChatMessage[]>('chatMessages', [])
  const [blockedProfiles, setBlockedProfiles] = useKV<BlockedProfile[]>('blockedProfiles', [])
  const [interestToDecline, setInterestToDecline] = useState<string | null>(null)
  const [interestToBlock, setInterestToBlock] = useState<{ interestId: string, profileId: string } | null>(null)

  const currentUserProfile = profiles.find(p => p.id === loggedInUserId)

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
  }

  const receivedInterests = interests?.filter(
    i => i.toProfileId === currentUserProfile?.profileId && i.status === 'pending'
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

    setInterests(current => 
      (current || []).map(i => 
        i.id === interestId ? { ...i, status: 'accepted' as const } : i
      )
    )

    const senderProfile = getProfileByProfileId(interest.fromProfileId)
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
    return new Date(date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN')
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
            {receivedInterests.length === 0 ? (
              <Alert>
                <AlertDescription>{t.noInterests}</AlertDescription>
              </Alert>
            ) : (
              receivedInterests.map(interest => {
                const profile = getProfileByProfileId(interest.fromProfileId)
                if (!profile) return null
                
                return (
                  <Card key={interest.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                            {profile.firstName[0]}{profile.lastName[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{profile.fullName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {profile.age} {language === 'hi' ? 'वर्ष' : 'years'} • {profile.location}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t.sentOn}: {formatDate(interest.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleAcceptInterest(interest.id)}
                            className="gap-2"
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
                if (!profile) return null
                
                return (
                  <Card key={interest.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                              {profile.firstName[0]}{profile.lastName[0]}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{profile.fullName}</h3>
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
                            onClick={() => onNavigateToChat && onNavigateToChat()}
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
                if (!profile) return null
                
                return (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                            {profile.firstName[0]}{profile.lastName[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{profile.fullName}</h3>
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
                          <Button size="sm" variant="outline" className="gap-2">
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
      </div>
    </div>
  )
}
