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

  // Mark messages as delivered when user/admin loads the chat
  useEffect(() => {
    if (!messages) return
    if (!isAdmin && !currentUserProfile) return
    
    const currentProfileId = isAdmin ? 'admin' : currentUserProfile?.profileId
    let hasUpdates = false
    
    const updatedMessages = messages.map(msg => {
      // Mark as delivered if message is TO current user and not yet delivered
      const isToCurrentUser = (msg.toProfileId === currentProfileId) ||
        (isAdmin && msg.toProfileId === 'admin') ||
        (!isAdmin && msg.fromProfileId === 'admin' && msg.toProfileId === currentProfileId)
      
      if (isToCurrentUser && !msg.delivered && msg.fromProfileId !== currentProfileId) {
        hasUpdates = true
        return {
          ...msg,
          delivered: true,
          deliveredAt: new Date().toISOString(),
          status: msg.read ? 'read' : 'delivered' as const
        }
      }
      return msg
    })
    
    if (hasUpdates) {
      setMessages(updatedMessages)
    }
  }, [messages?.length, currentUserProfile, isAdmin])

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
        // Determine the user's profileId in this admin-user conversation
        // Admin sends TO user (toProfileId = userProfileId, fromProfileId = 'admin')
        // User sends TO admin (toProfileId = 'admin', fromProfileId = userProfileId)
        const userProfileId = msg.fromProfileId === 'admin' ? msg.toProfileId : msg.fromProfileId
        
        // Check if this message is relevant to current viewer
        const isRelevant = isAdmin || 
          msg.toProfileId === currentUserProfile?.profileId || 
          msg.fromProfileId === currentUserProfile?.profileId
        
        if (isRelevant && userProfileId) {
          const convId = `admin-${userProfileId}`
          if (!convMap.has(convId)) {
            convMap.set(convId, {
              id: convId,
              participants: ['admin', userProfileId],
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
            // Count unread: for admin, count unread from user; for user, count unread from admin
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
    if (!selectedConversation || !messages) return
    if (!isAdmin && !currentUserProfile) return

    const currentProfileId = isAdmin ? 'admin' : currentUserProfile?.profileId
    let hasUpdates = false
    
    const updatedMessages = messages.map(msg => {
      // Only update messages sent TO the current user (not from current user)
      if (msg.fromProfileId === currentProfileId) return msg
      
      // Check if this message belongs to the selected conversation
      let matchesConversation = false
      
      if (selectedConversation === 'admin-broadcast') {
        matchesConversation = msg.type === 'admin-broadcast'
      } else if (selectedConversation.startsWith('admin-')) {
        const userProfileId = selectedConversation.replace('admin-', '')
        // For admin-user conversations
        if (msg.type === 'admin-to-user') {
          if (isAdmin) {
            // Admin viewing: mark user's messages as read
            matchesConversation = msg.fromProfileId === userProfileId && msg.toProfileId === 'admin'
          } else {
            // User viewing: mark admin's messages as read
            matchesConversation = msg.fromProfileId === 'admin' && msg.toProfileId === userProfileId
          }
        }
      } else {
        // User-to-user conversation
        const [profileId1, profileId2] = selectedConversation.split('-')
        matchesConversation = msg.type === 'user-to-user' && (
          (msg.fromProfileId === profileId1 && msg.toProfileId === profileId2) ||
          (msg.fromProfileId === profileId2 && msg.toProfileId === profileId1)
        )
      }
      
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
      return msg
    })

    if (hasUpdates) {
      setMessages(updatedMessages)
    }
  }, [selectedConversation, currentUserProfile, isAdmin])

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
      const userProfileId = convId.replace('admin-', '')
      return messages.filter(m => {
        if (m.type === 'admin-to-user') {
          // Messages in this conversation:
          // - Admin to user: fromProfileId='admin', toProfileId=userProfileId
          // - User to admin: fromProfileId=userProfileId, toProfileId='admin'
          if (isAdmin) {
            // Admin sees all messages involving this user
            return (m.fromProfileId === 'admin' && m.toProfileId === userProfileId) ||
                   (m.fromProfileId === userProfileId && m.toProfileId === 'admin')
          } else {
            // User sees messages from/to admin involving themselves
            return (m.fromProfileId === 'admin' && m.toProfileId === userProfileId) ||
                   (m.fromProfileId === userProfileId && m.toProfileId === 'admin')
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
          const userProfileId = conversationId.replace('admin-', '')
          // Delete all admin-user messages involving this user
          return !(msg.type === 'admin-to-user' && 
            ((msg.fromProfileId === 'admin' && msg.toProfileId === userProfileId) ||
             (msg.fromProfileId === userProfileId && msg.toProfileId === 'admin')))
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
        // Admin sending to user
        newMessage.fromProfileId = 'admin'
        newMessage.toProfileId = targetProfileId
      } else {
        // User replying to admin - toProfileId should be 'admin', not the user's own ID
        newMessage.fromProfileId = currentUserProfile!.profileId
        newMessage.toProfileId = 'admin'
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

  // WhatsApp-style relative date formatting
  const formatRelativeDate = (timestamp: string) => {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return ''
    
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const isToday = date.toDateString() === today.toDateString()
    const isYesterday = date.toDateString() === yesterday.toDateString()
    
    if (isToday) {
      return formatTime(timestamp)
    } else if (isYesterday) {
      return language === 'hi' ? 'कल' : 'Yesterday'
    } else {
      return formatDate(timestamp)
    }
  }

  // Get profile for a conversation
  const getConversationProfile = (conv: ChatConversation): Profile | undefined => {
    if (conv.id === 'admin-broadcast') return undefined
    if (conv.id.startsWith('admin-')) {
      const profileId = conv.id.replace('admin-', '')
      return isAdmin ? profiles.find(p => p.profileId === profileId) : undefined
    }
    const otherProfileId = conv.participants?.find(id => id !== currentUserProfile?.profileId && id !== 'admin')
    return profiles.find(p => p.profileId === otherProfileId)
  }

  // Get initials from name for avatar
  const getInitials = (name: string) => {
    if (!name) return '?'
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Get message preview with sender prefix
  const getMessagePreview = (conv: ChatConversation) => {
    const lastMsg = conv.lastMessage
    const msgText = lastMsg?.message || (lastMsg as any)?.content || ''
    if (!msgText) return ''
    
    const isSentByCurrentUser = isAdmin 
      ? lastMsg?.fromProfileId === 'admin'
      : lastMsg?.fromProfileId === currentUserProfile?.profileId
    
    const prefix = isSentByCurrentUser ? `${t.you}: ` : ''
    const maxLength = 30
    const message = msgText.length > maxLength 
      ? msgText.substring(0, maxLength) + '...' 
      : msgText
    
    return prefix + message
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

  // Calculate total unread messages
  const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0)

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{t.title}</h1>
            {/* Total unread badge */}
            {totalUnread > 0 && (
              <span className="min-w-[24px] h-6 px-2 bg-green-500 text-white text-sm font-bold rounded-full flex items-center justify-center shadow-md">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>
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
                {(() => {
                  const adminConvId = `admin-${currentUserProfile?.profileId}`
                  const adminConv = conversations.find(c => c.id === adminConvId)
                  const adminUnread = adminConv?.unreadCount || 0
                  const hasAdminUnread = adminUnread > 0
                  
                  return (
                    <div
                      onClick={() => setSelectedConversation(adminConvId)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedConversation === adminConvId 
                          ? 'bg-primary/10 border border-primary shadow-sm' 
                          : hasAdminUnread 
                            ? 'bg-green-50 dark:bg-green-950/30 border-l-4 border-green-500 hover:bg-green-100 dark:hover:bg-green-950/50'
                            : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                            <span className="text-lg text-primary-foreground">👤</span>
                          </div>
                          {/* Unread badge - WhatsApp style */}
                          {hasAdminUnread && (
                            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                              {adminUnread > 99 ? '99+' : adminUnread}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold ${hasAdminUnread ? 'text-green-700 dark:text-green-400' : ''}`}>
                              {language === 'hi' ? 'एडमिन सहायता' : 'Admin Support'}
                            </p>
                            {adminConv?.lastMessage && (
                              <span className={`text-xs ${hasAdminUnread ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                {formatRelativeDate(adminConv.lastMessage.timestamp)}
                              </span>
                            )}
                          </div>
                          <p className={`text-sm truncate ${hasAdminUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                            {adminConv?.lastMessage 
                              ? getMessagePreview(adminConv) 
                              : (language === 'hi' ? 'किसी भी प्रश्न के लिए संपर्क करें' : 'Contact for any queries')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}

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
                        .map((msg) => {
                          const isFromUser = msg.fromProfileId !== 'admin'
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
                              className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[80%] p-3 rounded-lg ${
                                isFromUser 
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}>
                                <p className="text-sm">{msg.message || (msg as any).content}</p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <span className={`text-xs ${
                                    isFromUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                  }`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {isFromUser && (
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
                          )
                        })}
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
                              message: messageInput.trim(),
                              timestamp: new Date().toISOString(),
                              createdAt: new Date().toISOString(),
                              read: false,
                              status: 'sent',
                              delivered: false
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
                              message: messageInput.trim(),
                              timestamp: new Date().toISOString(),
                              createdAt: new Date().toISOString(),
                              read: false,
                              status: 'sent',
                              delivered: false
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
                  filteredConversations.map(conv => {
                    const profile = getConversationProfile(conv)
                    const hasUnread = conv.unreadCount > 0
                    const isAdminChat = conv.id.startsWith('admin-') || conv.id === 'admin-broadcast'
                    
                    return (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all relative group ${
                          selectedConversation === conv.id
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : hasUnread 
                              ? 'bg-primary/5 hover:bg-primary/10 border-l-4 border-primary' 
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
                          {/* Avatar with photo or initials */}
                          <div className="relative">
                            {profile?.photos?.[0] ? (
                              <img 
                                src={profile.photos[0]} 
                                alt="" 
                                className="h-12 w-12 rounded-full object-cover border-2 border-background shadow-sm"
                              />
                            ) : (
                              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                                isAdminChat 
                                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
                                  : 'bg-gradient-to-br from-muted to-muted/80 text-muted-foreground'
                              }`}>
                                {isAdminChat && !isAdmin ? (
                                  <span className="text-lg">👤</span>
                                ) : profile ? (
                                  getInitials(profile.fullName || '')
                                ) : (
                                  <ChatCircle size={20} weight="fill" />
                                )}
                              </div>
                            )}
                            {/* Unread count badge - WhatsApp style on avatar */}
                            {hasUnread && (
                              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                              </span>
                            )}
                            {/* Verified badge for verified profiles */}
                            {profile?.status === 'verified' && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-background">
                                <Check size={10} weight="bold" className="text-white" />
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className={`font-semibold truncate ${
                                hasUnread && selectedConversation !== conv.id ? 'text-foreground' : ''
                              }`}>
                                {getConversationTitle(conv)}
                              </p>
                              <span className={`text-xs whitespace-nowrap ml-2 ${
                                hasUnread && selectedConversation !== conv.id 
                                  ? 'text-green-600 font-medium' 
                                  : 'opacity-60'
                              }`}>
                                {formatRelativeDate((conv.lastMessage?.timestamp || conv.timestamp || conv.createdAt) || '')}
                              </span>
                            </div>
                            <p className={`text-sm truncate ${
                              hasUnread && selectedConversation !== conv.id 
                                ? 'font-medium opacity-90' 
                                : 'opacity-60'
                            }`}>
                              {getMessagePreview(conv)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </ScrollArea>
          </Card>

          <Card className="md:col-span-2 flex flex-col">
            {!selectedConversation ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <ChatCircle size={48} weight="light" className="text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {language === 'hi' ? 'अपनी बातचीत शुरू करें' : 'Start a conversation'}
                </h3>
                <p className="text-sm text-center max-w-xs">
                  {language === 'hi' 
                    ? 'बाईं ओर से किसी बातचीत का चयन करें या रुचि भेजकर नई बातचीत शुरू करें' 
                    : 'Select a conversation from the left or start a new one by sending an interest'}
                </p>
              </div>
            ) : (() => {
              const conv = conversations.find(c => c.id === selectedConversation)
              const otherProfileId = getOtherProfileIdFromConversation(selectedConversation)
              const chatProfile = getConversationProfile(conv!)
              const isAdminChat = selectedConversation.startsWith('admin-') || selectedConversation === 'admin-broadcast'
              const isChatAllowed = isAdmin || 
                                   selectedConversation.startsWith('admin-') || 
                                   selectedConversation === 'admin-broadcast' ||
                                   (otherProfileId && canChatWith(otherProfileId))

              return (
                <>
                  {/* Enhanced Chat Header with Profile Info */}
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                      {/* Profile Avatar */}
                      {chatProfile?.photos?.[0] ? (
                        <img 
                          src={chatProfile.photos[0]} 
                          alt="" 
                          className="h-10 w-10 rounded-full object-cover border-2 border-background shadow-sm"
                        />
                      ) : (
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          isAdminChat 
                            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
                            : 'bg-gradient-to-br from-muted to-muted/80 text-muted-foreground'
                        }`}>
                          {isAdminChat && !isAdmin ? (
                            <span className="text-lg">👤</span>
                          ) : chatProfile ? (
                            getInitials(chatProfile.fullName || '')
                          ) : (
                            <ChatCircle size={20} weight="fill" />
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {getConversationTitle(conv!)}
                          {chatProfile?.status === 'verified' && (
                            <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check size={10} weight="bold" className="text-white" />
                            </span>
                          )}
                          {!isChatAllowed && !isAdmin && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <LockSimple size={12} weight="fill" />
                              {t.chatLocked}
                            </Badge>
                          )}
                        </CardTitle>
                        {chatProfile && (
                          <p className="text-xs text-muted-foreground">
                            {chatProfile.location}{chatProfile.age ? `, ${chatProfile.age} ${language === 'hi' ? 'वर्ष' : 'yrs'}` : ''}
                          </p>
                        )}
                        {isAdminChat && !isAdmin && (
                          <p className="text-xs text-muted-foreground">
                            {language === 'hi' ? 'आमतौर पर 24 घंटे में जवाब' : 'Usually responds within 24 hours'}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
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
                                <p className="text-sm">{msg.message || (msg as any).content}</p>
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
