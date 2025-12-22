import { useState, useEffect, useRef } from 'react'
import { useKV } from '@/hooks/useKV'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { ChatCircle, PaperPlaneTilt, MagnifyingGlass, LockSimple, Check, Checks } from '@phosphor-icons/react'
import type { ChatMessage, ChatConversation } from '@/types/chat'
import type { Profile, Interest, MembershipPlan } from '@/types/profile'
import type { Language } from '@/lib/translations'
import { toast } from 'sonner'

interface ChatProps {
  currentUserProfile: Profile | null
  profiles: Profile[]
  language: Language
  isAdmin?: boolean
  shouldBlur?: boolean
  membershipPlan?: MembershipPlan
  setProfiles?: (newValue: Profile[] | ((oldValue?: Profile[] | undefined) => Profile[])) => void
}

const FREE_CHAT_LIMIT = 2

export function Chat({ currentUserProfile, profiles, language, isAdmin = false, shouldBlur = false, membershipPlan, setProfiles }: ChatProps) {
  const [messages, setMessages] = useKV<ChatMessage[]>('chatMessages', [])
  const [interests, setInterests] = useKV<Interest[]>('interests', [])
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const t = {
    title: language === 'hi' ? 'चैट' : 'Chat',
    search: language === 'hi' ? 'खोजें' : 'Search',
    noConversations: language === 'hi' ? 'कोई बातचीत नहीं' : 'No conversations',
    selectConversation: language === 'hi' ? 'बातचीत चुनें' : 'Select a conversation',
    typeMessage: language === 'hi' ? 'संदेश लिखें...' : 'Type a message...',
    send: language === 'hi' ? 'भेजें' : 'Send',
    you: language === 'hi' ? 'आप' : 'You',
    admin: language === 'hi' ? 'एडमिन' : 'Admin',
    broadcast: language === 'hi' ? 'सभी को' : 'Broadcast',
    chatLocked: language === 'hi' ? 'चैट लॉक है' : 'Chat Locked',
    acceptInterestFirst: language === 'hi' ? 'चैट करने के लिए पहले रुचि स्वीकार करें' : 'Accept interest first to chat',
    freeChatLimitReached: language === 'hi' 
      ? `मुफ्त चैट सीमा समाप्त: आप केवल ${FREE_CHAT_LIMIT} प्रोफाइल के साथ मुफ्त में चैट कर सकते हैं` 
      : `Free chat limit reached: You can only chat with ${FREE_CHAT_LIMIT} profiles for free`,
    upgradeForUnlimitedChat: language === 'hi' 
      ? 'असीमित चैट के लिए प्रीमियम सदस्यता लें' 
      : 'Upgrade to premium membership for unlimited chats',
    freeChatRemaining: language === 'hi' 
      ? (n: number) => `मुफ्त चैट: ${n} प्रोफाइल शेष` 
      : (n: number) => `Free chats: ${n} profiles remaining`,
    lastFreeChat: language === 'hi' 
      ? 'यह आपकी अंतिम मुफ्त चैट थी!' 
      : 'This was your last free chat!',
  }

  const getOtherProfileIdFromConversation = (conversationId: string): string | null => {
    if (!conversationId || !currentUserProfile) return null
    if (conversationId.startsWith('admin-') || conversationId === 'admin-broadcast') return null
    
    const parts = conversationId.split('-')
    return parts.find(id => id !== currentUserProfile.profileId) || null
  }

  const canChatWith = (otherProfileId: string): boolean => {
    if (isAdmin) return true
    if (!currentUserProfile) return false
    if (!otherProfileId) return false
    if (!interests || interests.length === 0) return false

    const currentProfileId = currentUserProfile.profileId
    if (!currentProfileId) return false

    const hasAcceptedInterest = interests.some(
      i => i.status === 'accepted' && (
        (i.fromProfileId === currentProfileId && i.toProfileId === otherProfileId) ||
        (i.fromProfileId === otherProfileId && i.toProfileId === currentProfileId)
      )
    )

    return hasAcceptedInterest
  }

  useEffect(() => {
    if (!messages) return
    if (!isAdmin && !currentUserProfile) return

    const convMap = new Map<string, ChatConversation>()

    messages.forEach(msg => {
      if (msg.type === 'admin-broadcast') {
        const convId = 'admin-broadcast'
        if (!convMap.has(convId)) {
          convMap.set(convId, {
            id: convId,
            participants: ['admin'],
            lastMessage: msg,
            timestamp: msg.timestamp,
            unreadCount: msg.read ? 0 : 1,
            createdAt: msg.timestamp,
            updatedAt: msg.timestamp,
          })
        } else {
          const conv = convMap.get(convId)!
          const lastMsg = conv.lastMessage
          if (lastMsg && new Date(msg.timestamp) > new Date(lastMsg.timestamp)) {
            conv.lastMessage = msg
            conv.timestamp = msg.timestamp
            conv.updatedAt = msg.timestamp
          }
          if (!msg.read) conv.unreadCount++
        }
      } else if (msg.type === 'admin-to-user') {
        if (isAdmin || msg.toProfileId === currentUserProfile?.profileId) {
          const convId = `admin-${msg.toProfileId}`
          if (!convMap.has(convId)) {
            convMap.set(convId, {
              id: convId,
              participants: ['admin', msg.toProfileId!],
              lastMessage: msg,
              timestamp: msg.timestamp,
              unreadCount: msg.read ? 0 : 1,
              createdAt: msg.timestamp,
              updatedAt: msg.timestamp,
            })
          } else {
            const conv = convMap.get(convId)!
            const lastMsg = conv.lastMessage
            if (lastMsg && new Date(msg.timestamp) > new Date(lastMsg.timestamp)) {
              conv.lastMessage = msg
              conv.timestamp = msg.timestamp
              conv.updatedAt = msg.timestamp
            }
            if (!msg.read && (isAdmin ? msg.fromProfileId !== 'admin' : msg.fromProfileId === 'admin')) {
              conv.unreadCount++
            }
          }
        }
      } else if (msg.type === 'user-to-user') {
        if (isAdmin || msg.fromProfileId === currentUserProfile?.profileId || msg.toProfileId === currentUserProfile?.profileId) {
          const otherProfileId = isAdmin 
            ? (msg.fromProfileId < msg.toProfileId! ? `${msg.fromProfileId}-${msg.toProfileId}` : `${msg.toProfileId}-${msg.fromProfileId}`)
            : msg.fromProfileId === currentUserProfile?.profileId ? msg.toProfileId! : msg.fromProfileId
          
          const convId = isAdmin 
            ? otherProfileId
            : [currentUserProfile!.profileId, otherProfileId].sort().join('-')
          
          if (!convMap.has(convId)) {
            convMap.set(convId, {
              id: convId,
              participants: isAdmin ? [msg.fromProfileId, msg.toProfileId!] : [currentUserProfile!.profileId, otherProfileId],
              lastMessage: msg,
              timestamp: msg.timestamp,
              unreadCount: msg.read || (isAdmin ? false : msg.fromProfileId === currentUserProfile?.profileId) ? 0 : 1,
              createdAt: msg.timestamp,
              updatedAt: msg.timestamp,
            })
          } else {
            const conv = convMap.get(convId)!
            const lastMsg = conv.lastMessage
            if (lastMsg && new Date(msg.timestamp) > new Date(lastMsg.timestamp)) {
              conv.lastMessage = msg
              conv.timestamp = msg.timestamp
              conv.updatedAt = msg.timestamp
            }
            if (!msg.read && !isAdmin && msg.fromProfileId !== currentUserProfile?.profileId) {
              conv.unreadCount++
            }
          }
        }
      }
    })

    const sortedConversations = Array.from(convMap.values()).sort(
      (a, b) => new Date(b.updatedAt || b.createdAt || '').getTime() - new Date(a.updatedAt || a.createdAt || '').getTime()
    )

    setConversations(sortedConversations)
  }, [messages, currentUserProfile, isAdmin])

  // Mark messages as delivered/read when conversation is opened
  useEffect(() => {
    if (!selectedConversation || !messages || isAdmin) return
    if (!currentUserProfile) return

    const currentProfileId = currentUserProfile.profileId
    let hasUpdates = false
    
    const updatedMessages = messages.map(msg => {
      // Only update messages sent TO the current user
      if (msg.toProfileId === currentProfileId && msg.fromProfileId !== currentProfileId) {
        // Check if message belongs to selected conversation
        const convId = [msg.fromProfileId, msg.toProfileId].sort().join('-')
        const isAdminConv = msg.type === 'admin-to-user' || msg.type === 'admin-broadcast'
        const matchesConversation = isAdminConv 
          ? selectedConversation.startsWith('admin-')
          : convId === selectedConversation || selectedConversation.includes(msg.fromProfileId)
        
        if (matchesConversation && !msg.read) {
          hasUpdates = true
          return { 
            ...msg, 
            read: true, 
            readAt: new Date().toISOString(),
            status: 'read' as const,
            delivered: true,
            deliveredAt: msg.deliveredAt || new Date().toISOString()
          }
        }
      }
      return msg
    })

    if (hasUpdates) {
      setMessages(updatedMessages)
    }
  }, [selectedConversation, currentUserProfile])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation, messages])

  const getConversationMessages = (convId: string) => {
    if (!messages) return []
    if (!isAdmin && !currentUserProfile) return []

    if (convId === 'admin-broadcast') {
      return messages.filter(m => m.type === 'admin-broadcast')
    }

    if (convId.startsWith('admin-')) {
      const profileId = convId.replace('admin-', '')
      return messages.filter(m => {
        if (m.type === 'admin-to-user') {
          if (isAdmin) {
            return m.toProfileId === profileId || m.fromProfileId === profileId
          } else {
            return m.toProfileId === profileId || m.fromProfileId === 'admin'
          }
        }
        return false
      })
    }

    if (isAdmin) {
      const [profileId1, profileId2] = convId.split('-')
      return messages.filter(m => 
        m.type === 'user-to-user' &&
        ((m.fromProfileId === profileId1 && m.toProfileId === profileId2) ||
         (m.fromProfileId === profileId2 && m.toProfileId === profileId1))
      )
    }

    const [profileId1, profileId2] = convId.split('-')
    return messages.filter(m => 
      m.type === 'user-to-user' &&
      ((m.fromProfileId === profileId1 && m.toProfileId === profileId2) ||
       (m.fromProfileId === profileId2 && m.toProfileId === profileId1))
    )
  }

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return
    if (!isAdmin && !currentUserProfile) return

    // Check if this is admin chat (always allowed for free users)
    const isAdminChat = selectedConversation.startsWith('admin-')

    if (!isAdmin && selectedConversation.includes('-') && !isAdminChat) {
      const otherProfileId = getOtherProfileIdFromConversation(selectedConversation)
      if (otherProfileId && !canChatWith(otherProfileId)) {
        toast.error(t.acceptInterestFirst)
        return
      }

      // Check free user chat limit (only for user-to-user chats, not admin chats)
      const isFreeUser = !membershipPlan || membershipPlan === 'free'
      if (isFreeUser && otherProfileId && setProfiles) {
        const chattedProfiles = currentUserProfile.freeChatProfiles || []
        
        // If already chatted with this profile, allow
        if (!chattedProfiles.includes(otherProfileId)) {
          // Check if limit reached
          if (chattedProfiles.length >= FREE_CHAT_LIMIT) {
            toast.error(t.freeChatLimitReached, {
              description: t.upgradeForUnlimitedChat,
              duration: 6000
            })
            return
          }

          // Add to chatted profiles
          const updatedChattedProfiles = [...chattedProfiles, otherProfileId]
          setProfiles((current) => 
            (current || []).map(p => 
              p.id === currentUserProfile.id 
                ? { ...p, freeChatProfiles: updatedChattedProfiles }
                : p
            )
          )

          // Notify user about remaining free chats
          const remaining = FREE_CHAT_LIMIT - updatedChattedProfiles.length
          if (remaining > 0) {
            toast.info(t.freeChatRemaining(remaining), { duration: 3000 })
          } else {
            toast.warning(t.lastFreeChat, {
              description: t.upgradeForUnlimitedChat,
              duration: 5000
            })
          }
        }
      }
    }

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      fromUserId: isAdmin ? 'admin' : currentUserProfile!.id,
      fromProfileId: isAdmin ? 'admin' : currentUserProfile!.profileId,
      toProfileId: '',
      message: messageInput,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      read: false,
      status: 'sent',
      delivered: false,
      type: 'user-to-user',
    }

    if (selectedConversation === 'admin-broadcast') {
      newMessage.type = 'admin-broadcast'
      newMessage.toProfileId = 'all'
    } else if (selectedConversation.startsWith('admin-')) {
      newMessage.type = 'admin-to-user'
      const targetProfileId = selectedConversation.replace('admin-', '')
      if (isAdmin) {
        newMessage.fromProfileId = 'admin'
        newMessage.toProfileId = targetProfileId
      } else {
        newMessage.fromProfileId = currentUserProfile!.profileId
        newMessage.toProfileId = targetProfileId
      }
    } else {
      newMessage.type = 'user-to-user'
      if (isAdmin) {
        const [profileId1, profileId2] = selectedConversation.split('-')
        newMessage.fromProfileId = profileId1
        newMessage.toProfileId = profileId2
      } else {
        const otherProfileId = selectedConversation.split('-').find(id => id !== currentUserProfile!.profileId) || ''
        newMessage.toProfileId = otherProfileId
      }
    }

    setMessages(current => [...(current || []), newMessage])
    setMessageInput('')
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return ''
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getConversationTitle = (conv: ChatConversation) => {
    if (conv.id === 'admin-broadcast') return t.broadcast
    if (conv.id.startsWith('admin-')) {
      const profileId = conv.id.replace('admin-', '')
      if (isAdmin) {
        const profile = profiles.find(p => p.profileId === profileId)
        return profile?.fullName || profileId
      }
      return t.admin
    }

    if (isAdmin) {
      const [profileId1, profileId2] = conv.id.split('-')
      const profile1 = profiles.find(p => p.profileId === profileId1)
      const profile2 = profiles.find(p => p.profileId === profileId2)
      return `${profile1?.fullName || profileId1} ↔ ${profile2?.fullName || profileId2}`
    }

    const otherProfileId = conv.participants?.find(id => id !== currentUserProfile?.profileId)
    const profile = profiles.find(p => p.profileId === otherProfileId)
    return profile?.fullName || otherProfileId || ''
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const title = getConversationTitle(conv).toLowerCase()
    return title.includes(searchQuery.toLowerCase())
  })

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t.title}</h1>

        {/* Blur overlay for free/expired membership */}
        {shouldBlur && !isAdmin && (
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
              <LockSimple size={48} weight="bold" className="text-amber-600 mb-4" />
              <h3 className="text-xl font-bold text-amber-600 mb-2">
                {language === 'hi' ? 'चैट सुविधा सीमित है' : 'Chat Feature Limited'}
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                {language === 'hi' 
                  ? 'मुफ्त या समाप्त सदस्यता पर चैट सुविधा उपलब्ध नहीं है। पूर्ण एक्सेस के लिए प्रीमियम योजना में अपग्रेड करें।' 
                  : 'Chat feature is not available on Free or Expired membership. Upgrade to Premium for full access.'}
              </p>
            </div>
            <div className="filter blur-sm pointer-events-none h-[600px] bg-muted/20 rounded-lg" />
          </div>
        )}

        {!shouldBlur && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
          <Card className="md:col-span-1">
            <CardHeader>
              <div className="relative">
                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <ScrollArea className="h-[calc(600px-80px)]">
              <CardContent className="space-y-2">
                {filteredConversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t.noConversations}
                  </p>
                ) : (
                  filteredConversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conv.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                          <ChatCircle size={20} weight="fill" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold truncate">{getConversationTitle(conv)}</p>
                            {conv.unreadCount > 0 && (
                              <Badge variant="destructive" className="ml-2">{conv.unreadCount}</Badge>
                            )}
                          </div>
                          <p className="text-xs truncate opacity-70">
                            {conv.lastMessage?.message || ''}
                          </p>
                          <p className="text-xs opacity-50">
                            {formatDate((conv.lastMessage?.timestamp || conv.timestamp || conv.createdAt) || '')} {formatTime((conv.lastMessage?.timestamp || conv.timestamp || conv.createdAt) || '')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </ScrollArea>
          </Card>

          <Card className="md:col-span-2">
            {!selectedConversation ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                {t.selectConversation}
              </div>
            ) : (() => {
              const conv = conversations.find(c => c.id === selectedConversation)
              const otherProfileId = getOtherProfileIdFromConversation(selectedConversation)
              const isChatAllowed = isAdmin || 
                                   selectedConversation.startsWith('admin-') || 
                                   selectedConversation === 'admin-broadcast' ||
                                   (otherProfileId && canChatWith(otherProfileId))

              return (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getConversationTitle(conv!)}
                      {!isChatAllowed && !isAdmin && (
                        <Badge variant="secondary" className="gap-1">
                          <LockSimple size={14} weight="fill" />
                          {t.chatLocked}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <Separator />
                  <ScrollArea className="h-[calc(600px-180px)] p-4">
                    <div className="space-y-4">
                      {getConversationMessages(selectedConversation).map(msg => {
                        const isFromCurrentUser = isAdmin 
                          ? msg.fromProfileId === 'admin'
                          : msg.fromProfileId === currentUserProfile?.profileId
                        
                        const senderProfile = isAdmin && msg.fromProfileId !== 'admin'
                          ? profiles.find(p => p.profileId === msg.fromProfileId)
                          : null

                        // Determine message status for tick marks
                        const getMessageStatus = () => {
                          if (msg.status) return msg.status
                          if (msg.read || msg.readAt) return 'read'
                          if (msg.delivered || msg.deliveredAt) return 'delivered'
                          return 'sent'
                        }
                        const messageStatus = getMessageStatus()

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="max-w-[70%]">
                              {isAdmin && !isFromCurrentUser && senderProfile && (
                                <p className="text-xs text-muted-foreground mb-1 px-1">
                                  {senderProfile.fullName} ({senderProfile.profileId})
                                </p>
                              )}
                              <div
                                className={`rounded-lg px-4 py-2 ${
                                  isFromCurrentUser
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm">{msg.message}</p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <span className="text-xs opacity-70">
                                    {formatTime(msg.timestamp)}
                                  </span>
                                  {isFromCurrentUser && (
                                    <span className={`flex items-center ${
                                      messageStatus === 'read' 
                                        ? 'text-blue-400' 
                                        : messageStatus === 'delivered' 
                                          ? 'text-gray-400' 
                                          : 'text-gray-300'
                                    }`}>
                                      {messageStatus === 'sent' ? (
                                        <Check size={14} weight="bold" />
                                      ) : (
                                        <Checks size={14} weight="bold" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <Separator />
                  {isChatAllowed || isAdmin ? (
                    <div className="p-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder={t.typeMessage}
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <Button onClick={sendMessage} size="icon">
                          <PaperPlaneTilt size={20} weight="fill" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <LockSimple size={32} className="mx-auto mb-2 text-muted-foreground" weight="fill" />
                        <p className="text-sm text-muted-foreground">
                          {t.acceptInterestFirst}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </Card>
        </div>
        )}
      </div>
    </div>
  )
}
