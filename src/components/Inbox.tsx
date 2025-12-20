import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Heart, Check, X, Eye, Clock } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Interest, ContactRequest, Profile } from '@/types/profile'
import type { Language } from '@/lib/translations'

interface InboxProps {
  loggedInUserId: string | null
  profiles: Profile[]
  language: Language
}

export function Inbox({ loggedInUserId, profiles, language }: InboxProps) {
  const [interests, setInterests] = useKV<Interest[]>('interests', [])
  const [contactRequests, setContactRequests] = useKV<ContactRequest[]>('contactRequests', [])

  const currentUserProfile = profiles.find(p => p.id === loggedInUserId)

  const t = {
    title: language === 'hi' ? 'इनबॉक्स' : 'Inbox',
    receivedInterest: language === 'hi' ? 'प्राप्त रुचि' : 'Received Interest',
    acceptedInterest: language === 'hi' ? 'स्वीकृत रुचि' : 'Accepted Interest',
    contactRequests: language === 'hi' ? 'संपर्क अनुरोध' : 'Contact Requests',
    accept: language === 'hi' ? 'स्वीकार करें' : 'Accept',
    decline: language === 'hi' ? 'अस्वीकार करें' : 'Decline',
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
  }

  const receivedInterests = interests?.filter(
    i => i.toProfileId === currentUserProfile?.profileId && i.status === 'pending'
  ) || []

  const acceptedInterests = interests?.filter(
    i => (i.toProfileId === currentUserProfile?.profileId || i.fromProfileId === currentUserProfile?.profileId) && 
       i.status === 'accepted'
  ) || []

  const pendingContactRequests = contactRequests?.filter(
    r => r.toUserId === loggedInUserId
  ) || []

  const handleAcceptInterest = (interestId: string) => {
    setInterests(current => 
      (current || []).map(i => 
        i.id === interestId ? { ...i, status: 'accepted' as const } : i
      )
    )
    toast.success(t.interestAccepted)
  }

  const handleDeclineInterest = (interestId: string) => {
    setInterests(current => 
      (current || []).map(i => 
        i.id === interestId ? { ...i, status: 'declined' as const } : i
      )
    )
    toast.success(t.interestDeclined)
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
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            {pendingContactRequests.length === 0 ? (
              <Alert>
                <AlertDescription>{t.noContactRequests}</AlertDescription>
              </Alert>
            ) : (
              pendingContactRequests.map(request => {
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
      </div>
    </div>
  )
}
