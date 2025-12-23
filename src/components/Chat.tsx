import { useState, useEffect, useRef } from 'react'
import { useKV } from '@/hooks/useKV'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { ChatCircle, PaperPlaneTilt, MagnifyingGlass, LockSimple, Check, Checks, X } from '@phosphor-icons/react'
import type { ChatMessage, ChatConversation } from '@/types/chat'
import type { Profile, Interest, MembershipPlan } from '@/types/profile'
import type { Language } from '@/lib/translations'
import { toast } from 'sonner'

// Membership settings interface for plan limits
interface MembershipSettings {
  freePlanChatLimit: number
  freePlanContactLimit: number
  sixMonthChatLimit: number
  sixMonthContactLimit: number
  oneYearChatLimit: number
  oneYearContactLimit: number
}

interface ChatProps {
  currentUserProfile: Profile | null
  profiles: Profile[]
  language: Language
  isAdmin?: boolean
  shouldBlur?: boolean
  membershipPlan?: MembershipPlan
  membershipSettings?: MembershipSettings
  setProfiles?: (newValue: Profile[] | ((oldValue?: Profile[] | undefined) => Profile[])) => void
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

export function Chat({ currentUserProfile, profiles, language, isAdmin = false, shouldBlur = false, membershipPlan, membershipSettings, setProfiles }: ChatProps) {
  const [messages, setMessages] = useKV<ChatMessage[]>('chatMessages', [])
  const [interests, setInterests] = useKV<Interest[]>('interests', [])
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  // Close/delete a conversation (admin only) - removes all messages for this conversation
  const handleCloseConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selecting the conversation
    if (!isAdmin) return
    
    if (!confirm(language === 'hi' 
      ? 'क्या आप वाकई इस चैट को बंद करना चाहते हैं? सभी संदेश हटा दिए जाएंगे।' 
      : 'Are you sure you want to close this chat? All messages will be deleted.'
    )) return

    // Remove all messages for this conversation
    setMessages((current) => {
      if (!current) return []
      return current.filter(msg => {
        if (conversationId === 'admin-broadcast') {
          return msg.type !== 'admin-broadcast'
        }
        if (conversationId.startsWith('admin-')) {
          const profileId = conversationId.replace('admin-', '')
          return !(msg.type === 'admin-to-user' && 
            (msg.fromProfileId === profileId || msg.toProfileId === profileId))
        }
        // User-to-user conversation
        const [profileId1, profileId2] = conversationId.split('-')
        return !(
          (msg.fromProfileId === profileId1 && msg.toProfileId === profileId2) ||
          (msg.fromProfileId === profileId2 && msg.toProfileId === profileId1)
        )
      })
    })
    
    // Clear selection if this was selected
    if (selectedConversation === conversationId) {
      setSelectedConversation(null)
    }
    
    toast.success(language === 'hi' ? 'चैट बंद कर दी गई' : 'Chat closed')
  }

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return
    if (!isAdmin && !currentUserProfile) return

    // Check if this is admin chat (always allowed for all users - free feature)
    const isAdminChat = selectedConversation.startsWith('admin-')

    if (!isAdmin && selectedConversation.includes('-') && !isAdminChat) {
      const otherProfileId = getOtherProfileIdFromConversation(selectedConversation)
      if (otherProfileId && !canChatWith(otherProfileId)) {
        toast.error(t.acceptInterestFirst)
        return
      }

      // Check chat limit for all plans (only for user-to-user chats, not admin chats)
      if (otherProfileId && setProfiles) {
        // Use new chatRequestsUsed or fallback to legacy freeChatProfiles
        const chattedProfiles = currentUserProfile.chatRequestsUsed || currentUserProfile.freeChatProfiles || []
        
        // If already chatted with this profile, allow
        if (!chattedProfiles.includes(otherProfileId)) {
          // Check if limit reached
          if (chattedProfiles.length >= chatLimit) {
            toast.error(t.chatLimitReached, {
              description: t.upgradeForMoreChats,
              duration: 6000
            })
            return
          }

          // Add to chatted profiles (use new field)
          const updatedChattedProfiles = [...chattedProfiles, otherProfileId]
          setProfiles((current) => 
            (current || []).map(p => 
              p.id === currentUserProfile.id 
                ? { ...p, chatRequestsUsed: updatedChattedProfiles, freeChatProfiles: updatedChattedProfiles }
                : p
            )
          )

          // Notify user about remaining chats
          const remaining = chatLimit - updatedChattedProfiles.length
          if (remaining > 0) {
            toast.info(t.chatRemaining(remaining), { duration: 3000 })
          } else {
            toast.warning(t.lastChat, {
              description: t.upgradeForMoreChats,
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{t.title}</h1>
          {/* Live remaining chats counter */}
          {!isAdmin && currentUserProfile && (
            <div className="flex items-center gap-2">
              <Badge variant={remainingChats > 3 ? "secondary" : remainingChats > 0 ? "warning" : "destructive"} className="text-sm px-3 py-1">
                <ChatCircle size={16} className="mr-1" />
                {t.remainingChats}: {remainingChats}/{chatLimit}
              </Badge>
            </div>
          )}
        </div>

        {/* Limited chat for free/expired membership - only admin chat allowed */}
        {shouldBlur && !isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
            {/* Left panel - Admin Support only */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === 'hi' ? 'सहायता चैट' : 'Support Chat'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Admin Support Chat Option - Always visible */}
                <div
                  onClick={() => setSelectedConversation(`admin-${currentUserProfile?.profileId}`)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === `admin-${currentUserProfile?.profileId}` 
                      ? 'bg-primary/10 border border-primary' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 bg-primary flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-foreground">👤</span>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{language === 'hi' ? 'एडमिन सहायता' : 'Admin Support'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {language === 'hi' ? 'किसी भी प्रश्न के लिए संपर्क करें' : 'Contact for any queries'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Locked message for other chats */}
                <div className="text-center py-4">
                  <LockSimple size={32} className="mx-auto mb-2 text-amber-600" weight="bold" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'hi' 
                      ? 'अन्य प्रोफाइल के साथ चैट के लिए प्रीमियम सदस्यता आवश्यक है' 
                      : 'Premium membership required to chat with other profiles'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Right panel - Chat area */}
            <Card className="md:col-span-2 flex flex-col">
              {selectedConversation === `admin-${currentUserProfile?.profileId}` ? (
                <>
                  {/* Admin chat header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 bg-primary flex items-center justify-center">
                        <span className="text-lg">👤</span>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{language === 'hi' ? 'एडमिन सहायता' : 'Admin Support'}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {language === 'hi' ? 'आमतौर पर 24 घंटे में जवाब' : 'Usually responds within 24 hours'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Admin chat messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages
                        ?.filter(m => 
                          m.type === 'admin-to-user' && 
                          (m.toProfileId === currentUserProfile?.profileId || m.fromProfileId === currentUserProfile?.profileId)
                        )
                        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                        .map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.fromProfileId === 'admin' ? 'justify-start' : 'justify-end'}`}
                          >
                            <div className={`max-w-[80%] p-3 rounded-lg ${
                              msg.fromProfileId === 'admin' 
                                ? 'bg-muted' 
                                : 'bg-primary text-primary-foreground'
                            }`}>
                              <p className="text-sm">{msg.content}</p>
                              <p className={`text-xs mt-1 ${
                                msg.fromProfileId === 'admin' ? 'text-muted-foreground' : 'text-primary-foreground/70'
                              }`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Admin chat input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder={language === 'hi' ? 'एडमिन को संदेश लिखें...' : 'Type message to admin...'}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && messageInput.trim()) {
                            // Send message to admin
                            const newMsg: ChatMessage = {
                              id: `msg-${Date.now()}`,
                              type: 'admin-to-user',
                              fromProfileId: currentUserProfile?.profileId || '',
                              toProfileId: 'admin',
                              content: messageInput.trim(),
                              timestamp: new Date().toISOString(),
                              read: false
                            }
                            setMessages([...(messages || []), newMsg])
                            setMessageInput('')
                            toast.success(language === 'hi' ? 'संदेश भेजा गया' : 'Message sent')
                          }
                        }}
                      />
                      <Button 
                        onClick={() => {
                          if (messageInput.trim()) {
                            const newMsg: ChatMessage = {
                              id: `msg-${Date.now()}`,
                              type: 'admin-to-user',
                              fromProfileId: currentUserProfile?.profileId || '',
                              toProfileId: 'admin',
                              content: messageInput.trim(),
                              timestamp: new Date().toISOString(),
                              read: false
                            }
                            setMessages([...(messages || []), newMsg])
                            setMessageInput('')
                            toast.success(language === 'hi' ? 'संदेश भेजा गया' : 'Message sent')
                          }
                        }} 
                        size="icon"
                      >
                        <PaperPlaneTilt size={20} weight="fill" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <ChatCircle size={48} className="mx-auto mb-4 text-muted-foreground" weight="light" />
                    <p className="text-muted-foreground">
                      {language === 'hi' ? 'एडमिन सहायता चुनें' : 'Select Admin Support to chat'}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
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
                      className={`p-3 rounded-lg cursor-pointer transition-colors relative group ${
                        selectedConversation === conv.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {/* Close button for admin */}
                      {isAdmin && (
                        <button
                          onClick={(e) => handleCloseConversation(conv.id, e)}
                          className={`absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
                            selectedConversation === conv.id 
                              ? 'hover:bg-primary-foreground/20 text-primary-foreground' 
                              : 'hover:bg-destructive/10 text-destructive'
                          }`}
                          title={language === 'hi' ? 'चैट बंद करें' : 'Close chat'}
                        >
                          <X size={16} weight="bold" />
                        </button>
                      )}
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
