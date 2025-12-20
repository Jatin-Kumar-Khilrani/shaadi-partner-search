import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useKV } from '@github/spark/hooks'
import { Eye, Heart, ChatCircle, Clock } from '@phosphor-icons/react'
import type { Interest, ContactRequest, Profile } from '@/types/profile'
import type { ChatMessage } from '@/types/chat'
import type { Language } from '@/lib/translations'

interface MyActivityProps {
  loggedInUserId: string | null
  profiles: Profile[]
  language: Language
}

export function MyActivity({ loggedInUserId, profiles, language }: MyActivityProps) {
  const [interests] = useKV<Interest[]>('interests', [])
  const [contactRequests] = useKV<ContactRequest[]>('contactRequests', [])
  const [messages] = useKV<ChatMessage[]>('chatMessages', [])

  const currentUserProfile = profiles.find(p => p.id === loggedInUserId)

  const t = {
    title: language === 'hi' ? 'मेरी गतिविधि' : 'My Activity',
    sentInterests: language === 'hi' ? 'भेजी गई रुचि' : 'Sent Interests',
    receivedInterests: language === 'hi' ? 'प्राप्त रुचि' : 'Received Interests',
    myContactRequests: language === 'hi' ? 'मेरे संपर्क अनुरोध' : 'My Contact Requests',
    recentChats: language === 'hi' ? 'हालिया चैट' : 'Recent Chats',
    profileViews: language === 'hi' ? 'प्रोफाइल देखे गए' : 'Profile Views',
    pending: language === 'hi' ? 'लंबित' : 'Pending',
    accepted: language === 'hi' ? 'स्वीकृत' : 'Accepted',
    declined: language === 'hi' ? 'अस्वीकृत' : 'Declined',
    approved: language === 'hi' ? 'स्वीकृत' : 'Approved',
    to: language === 'hi' ? 'को' : 'To',
    from: language === 'hi' ? 'से' : 'From',
    noActivity: language === 'hi' ? 'कोई गतिविधि नहीं' : 'No activity',
  }

  const sentInterests = interests?.filter(i => i.fromProfileId === currentUserProfile?.profileId) || []
  const receivedInterests = interests?.filter(i => i.toProfileId === currentUserProfile?.profileId) || []
  const myContactRequests = contactRequests?.filter(r => r.fromUserId === loggedInUserId) || []
  const myChats = messages?.filter(
    m => m.fromUserId === loggedInUserId || m.toProfileId === currentUserProfile?.profileId
  ).slice(-10) || []

  const getProfileByProfileId = (profileId: string) => {
    return profiles.find(p => p.profileId === profileId)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    if (status === 'pending') return <Badge variant="secondary">{t.pending}</Badge>
    if (status === 'accepted' || status === 'approved') return <Badge variant="default" className="bg-teal">{t.accepted}</Badge>
    if (status === 'declined') return <Badge variant="destructive">{t.declined}</Badge>
    return <Badge>{status}</Badge>
  }

  return (
    <section className="container mx-auto px-4 md:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{t.title}</h2>
        </div>

        <Tabs defaultValue="sent-interests">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
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
                                  <Heart size={24} weight="fill" className="text-primary" />
                                  <div>
                                    <p className="font-semibold">{t.to}: {profile?.profileId || 'Unknown'}</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(interest.createdAt)}</p>
                                  </div>
                                </div>
                                {getStatusBadge(interest.status)}
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
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <Heart size={24} weight="fill" className="text-accent" />
                                  <div>
                                    <p className="font-semibold">{t.from}: {profile?.profileId || 'Unknown'}</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(interest.createdAt)}</p>
                                  </div>
                                </div>
                                {getStatusBadge(interest.status)}
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
                <CardTitle>{t.myContactRequests}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {myContactRequests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t.noActivity}</p>
                  ) : (
                    <div className="space-y-4">
                      {myContactRequests.map((request) => {
                        const profile = profiles.find(p => p.id === request.toUserId)
                        return (
                          <Card key={request.id}>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <Eye size={24} weight="fill" className="text-teal" />
                                  <div>
                                    <p className="font-semibold">{t.to}: {profile?.profileId || 'Unknown'}</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(request.createdAt)}</p>
                                  </div>
                                </div>
                                {getStatusBadge(request.status)}
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
                        const isMyMessage = msg.fromUserId === loggedInUserId
                        const otherProfileId = isMyMessage ? msg.toProfileId : msg.fromProfileId
                        const otherProfile = profiles.find(p => p.profileId === otherProfileId)
                        
                        return (
                          <Card key={msg.id}>
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-4">
                                <ChatCircle size={24} weight="fill" className={isMyMessage ? 'text-primary' : 'text-accent'} />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold">
                                      {isMyMessage ? t.to : t.from}: {otherProfile?.profileId || msg.type === 'admin-broadcast' ? 'Admin' : 'Unknown'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(msg.timestamp).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')}
                                    </p>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{msg.message}</p>
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
    </section>
  )
}
