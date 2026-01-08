import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useKV } from '@/hooks/useKV'
import { logger } from '@/lib/logger'
import { sanitizeChatMessage } from '@/lib/validation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChatCircle, PaperPlaneTilt, MagnifyingGlass, LockSimple, Check, Checks, X, Warning, ShieldWarning, Prohibit, MagnifyingGlassPlus, Paperclip, Image as ImageIcon, FilePdf, DownloadSimple, Smiley, Trash, Rocket } from '@phosphor-icons/react'
import type { ChatMessage, ChatConversation, ChatAttachment } from '@/types/chat'
import type { Profile, Interest, MembershipPlan, BlockedProfile, ReportReason } from '@/types/profile'
import type { Language } from '@/lib/translations'
import { toast } from 'sonner'
import { PhotoLightbox, useLightbox } from '@/components/PhotoLightbox'

// Emoji categories for WhatsApp-like picker
const EMOJI_CATEGORIES = {
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
  gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄'],
  love: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️'],
  celebration: ['🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁', '🥂', '🍾', '🥳', '🎄', '🎃', '🎆', '🎇', '✨', '🎍', '🎋', '🎏', '🎎', '🎐', '🎑', '🏮', '🪔', '💐', '🌸', '🌺', '🌹', '🌷', '🌻', '🌼', '💮', '🏵️', '🍀', '🌿', '🌱', '🪴', '🌵', '🎋'],
  objects: ['📱', '💻', '🖥️', '📷', '📸', '📹', '🎥', '📞', '☎️', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏰', '⏱️', '⏲️', '🕰️', '💡', '🔦', '🕯️', '💰', '💵', '💴', '💶', '💷', '💳', '💎', '⚖️', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🔗', '📎', '🖇️', '📏', '📐', '✂️', '📌', '📍', '🗑️'],
  indian: ['🙏', '🪷', '🕉️', '🛕', '🪔', '🎪', '🐘', '🦚', '🌺', '🌸', '💐', '🍛', '🫓', '🥘', '🍚', '🥭', '🍌', '🥥', '🫖', '☕', '🍵', '🥛', '🍯', '🪘', '🎵', '💃', '🕺', '👰', '🤵', '💒', '💍', '👨‍👩‍👧', '👨‍👩‍👦', '👪', '🏠', '🏡']
}

// Membership settings interface for plan limits
interface MembershipSettings {
  freePlanChatLimit: number
  freePlanContactLimit: number
  sixMonthChatLimit: number
  sixMonthContactLimit: number
  oneYearChatLimit: number
  oneYearContactLimit: number
  // Inactivity settings
  inactivityDays?: number
  freePlanChatDurationMonths?: number
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
  initialChatProfileId?: string | null // Profile ID to auto-select for chat
  onUpgrade?: () => void // Callback to open Settings for upgrade
}

// Default limits if settings not provided
const DEFAULT_SETTINGS: MembershipSettings = {
  freePlanChatLimit: 5,
  freePlanContactLimit: 0,
  sixMonthChatLimit: 50,
  sixMonthContactLimit: 20,
  oneYearChatLimit: 120,
  oneYearContactLimit: 50,
  inactivityDays: 30,
  freePlanChatDurationMonths: 6
}

export function Chat({ currentUserProfile, profiles, language, isAdmin = false, shouldBlur = false, membershipPlan, membershipSettings, setProfiles, initialChatProfileId, onUpgrade }: ChatProps) {
  const [messages, setMessages, refreshMessages, messagesLoaded] = useKV<ChatMessage[]>('chatMessages', [])
  const [interests, _setInterests] = useKV<Interest[]>('interests', [])
  const [blockedProfiles, setBlockedProfiles] = useKV<BlockedProfile[]>('blockedProfiles', [])
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [hasAutoSelected, setHasAutoSelected] = useState(false)
  
  // Lightbox for photo zoom
  const { lightboxState, openLightbox, closeLightbox } = useLightbox()
  
  // Report & Block dialog state
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason | ''>('')
  const [reportDescription, setReportDescription] = useState('')
  const [profileToReport, setProfileToReport] = useState<{ profileId: string, name: string } | null>(null)
  
  // Attachment state for admin chat (WhatsApp-like file sharing)
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([])
  const [previewAttachment, setPreviewAttachment] = useState<ChatAttachment | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB max
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  
  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys')
  
  // Prevent race condition on rapid message sends (double-click protection)
  const isSendingRef = useRef(false)
  const pendingChatSlotsRef = useRef<Set<string>>(new Set())

  // Force refresh messages from Azure on mount
  useEffect(() => {
    refreshMessages()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-select conversation when initialChatProfileId is provided
  useEffect(() => {
    if (!initialChatProfileId || !currentUserProfile || hasAutoSelected) return
    if (conversations.length === 0) return
    
    // Find or create the conversation ID
    const convId = [currentUserProfile.profileId, initialChatProfileId].sort().join('-')
    
    // Check if conversation exists
    const conv = conversations.find(c => c.id === convId)
    if (conv) {
      setSelectedConversation(convId)
      setHasAutoSelected(true)
    } else {
      // Create a new conversation for this accepted interest
      setSelectedConversation(convId)
      setHasAutoSelected(true)
    }
  }, [initialChatProfileId, currentUserProfile, conversations, hasAutoSelected])

  // Get settings with defaults
  const settings = { ...DEFAULT_SETTINGS, ...membershipSettings }

  // Get boost credits from profile
  const boostInterestsRemaining = currentUserProfile?.boostInterestsRemaining || 0

  // Get chat limit based on current plan + boost credits
  const getChatLimit = (): number => {
    let baseLimit = settings.freePlanChatLimit
    if (membershipPlan === '6-month') {
      baseLimit = settings.sixMonthChatLimit
    } else if (membershipPlan === '1-year') {
      baseLimit = settings.oneYearChatLimit
    }
    // Add boost credits to extend the limit
    return baseLimit + boostInterestsRemaining
  }

  const chatLimit = getChatLimit()
  const baseChatLimit = membershipPlan === '1-year' ? settings.oneYearChatLimit 
    : membershipPlan === '6-month' ? settings.sixMonthChatLimit 
    : settings.freePlanChatLimit
  
  // Calculate actual profiles chatted with from messages (retroactive counting)
  // This counts unique non-admin profiles the user has SENT messages to
  const actualChattedProfiles = useMemo(() => {
    if (!currentUserProfile || !messages) return []
    
    const userProfileId = currentUserProfile.profileId
    const profilesChattedWith = new Set<string>()
    
    messages.forEach(msg => {
      // Only count messages SENT by the current user to other users (not admin)
      if (msg.fromProfileId === userProfileId && 
          msg.toProfileId && 
          msg.toProfileId !== 'admin' && 
          msg.toProfileId !== 'all' &&
          msg.type === 'user-to-user') {
        profilesChattedWith.add(msg.toProfileId)
      }
    })
    
    return Array.from(profilesChattedWith)
  }, [currentUserProfile, messages])
  
  // Use the larger of stored chatRequestsUsed or actual chatted profiles from messages
  const storedChatRequests = currentUserProfile?.chatRequestsUsed || currentUserProfile?.freeChatProfiles || []
  const chatRequestsUsed = actualChattedProfiles.length > storedChatRequests.length 
    ? actualChattedProfiles 
    : storedChatRequests
  const remainingChats = Math.max(0, chatLimit - chatRequestsUsed.length)

  const t = {
    title: language === 'hi' ? 'चैट' : 'Chat',
    search: language === 'hi' ? 'खोजें' : 'Search',
    noConversations: language === 'hi' ? 'कोई बातचीत नहीं' : 'No conversations',
    selectConversation: language === 'hi' ? 'बातचीत चुनें' : 'Select a conversation',
    typeMessage: language === 'hi' ? 'संदेश लिखें...' : 'Type a message...',
    send: language === 'hi' ? 'भेजें' : 'Send',
    you: language === 'hi' ? 'आप' : 'You',
    admin: language === 'hi' ? 'एडमिन सहायता' : 'Admin Support',
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
    getMoreChats: language === 'hi' ? 'अधिक चैट प्राप्त करें' : 'Get more chats',
    // Report & Block translations
    reportBlock: language === 'hi' ? 'रिपोर्ट और ब्लॉक' : 'Report & Block',
    reportProfile: language === 'hi' ? 'प्रोफाइल रिपोर्ट करें' : 'Report Profile',
    reportReason: language === 'hi' ? 'रिपोर्ट का कारण' : 'Reason for Report',
    selectReason: language === 'hi' ? 'कारण चुनें' : 'Select a reason',
    inappropriateMessages: language === 'hi' ? 'अनुचित संदेश' : 'Inappropriate Messages',
    fakeProfile: language === 'hi' ? 'नकली प्रोफाइल' : 'Fake Profile',
    harassment: language === 'hi' ? 'उत्पीड़न' : 'Harassment',
    spam: language === 'hi' ? 'स्पैम' : 'Spam',
    offensiveContent: language === 'hi' ? 'आपत्तिजनक सामग्री' : 'Offensive Content',
    other: language === 'hi' ? 'अन्य' : 'Other',
    additionalDetails: language === 'hi' ? 'अतिरिक्त विवरण (वैकल्पिक)' : 'Additional Details (Optional)',
    reportWarning: language === 'hi' 
      ? 'इस प्रोफाइल को रिपोर्ट करने से वे आपसे और आप उनसे छुप जाएंगे। एडमिन को सूचित किया जाएगा और वे चैट इतिहास की समीक्षा कर सकते हैं।' 
      : 'Reporting this profile will hide them from you and you from them. Admin will be notified and can review chat history.',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    confirmReport: language === 'hi' ? 'रिपोर्ट करें और ब्लॉक करें' : 'Report & Block',
    reportSuccess: language === 'hi' ? 'प्रोफाइल रिपोर्ट और ब्लॉक की गई' : 'Profile reported and blocked',
    reportSuccessDesc: language === 'hi' 
      ? 'एडमिन को सूचित कर दिया गया है और वे उचित कार्रवाई करेंगे।' 
      : 'Admin has been notified and will take appropriate action.',
    blockedUser: language === 'hi' ? 'यह प्रोफाइल ब्लॉक है' : 'This profile is blocked',
    // Phone number filter translations
    phoneNumberBlocked: language === 'hi' 
      ? 'मोबाइल नंबर शेयर करना प्रतिबंधित है' 
      : 'Sharing mobile numbers is not allowed',
    useContactRequest: language === 'hi'
      ? 'कृपया कॉन्टैक्ट रिक्वेस्ट का उपयोग करें'
      : 'Please use Contact Request feature',
    phoneNumberMasked: language === 'hi'
      ? 'आपके संदेश में मोबाइल नंबर छुपा दिया गया है'
      : 'Mobile number in your message has been masked',
  }

  const getOtherProfileIdFromConversation = (conversationId: string): string | null => {
    if (!conversationId || !currentUserProfile) return null
    if (conversationId.startsWith('admin-') || conversationId === 'admin-broadcast') return null
    
    const parts = conversationId.split('-')
    return parts.find(id => id !== currentUserProfile.profileId) || null
  }

  // Check if a profile is blocked (either direction)
  const _isProfileBlocked = (otherProfileId: string): boolean => {
    if (!currentUserProfile || !blockedProfiles) return false
    return blockedProfiles.some(
      b => (b.blockerProfileId === currentUserProfile.profileId && b.blockedProfileId === otherProfileId) ||
           (b.blockedProfileId === currentUserProfile.profileId && b.blockerProfileId === otherProfileId)
    )
  }

  // Handle report and block
  const handleReportAndBlock = () => {
    if (!currentUserProfile || !profileToReport || !reportReason) return

    const newBlock: BlockedProfile = {
      id: `block-${Date.now()}`,
      blockerProfileId: currentUserProfile.profileId,
      blockedProfileId: profileToReport.profileId,
      createdAt: new Date().toISOString(),
      reason: reportReason,
      reportedToAdmin: true,
      reportReason: reportReason as ReportReason,
      reportDescription: reportDescription || undefined,
    }

    setBlockedProfiles(current => [...(current || []), newBlock])
    
    // Close the conversation and reset dialog
    setSelectedConversation(null)
    setShowReportDialog(false)
    setReportReason('')
    setReportDescription('')
    setProfileToReport(null)

    toast.success(t.reportSuccess, {
      description: t.reportSuccessDesc,
      duration: 5000,
    })
  }

  // Attachment handling functions for admin chat (WhatsApp-like)
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    Array.from(files).forEach(file => {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(
          language === 'hi' 
            ? 'अमान्य फाइल प्रकार। केवल JPG, PNG, GIF, WebP और PDF अनुमत हैं।' 
            : 'Invalid file type. Only JPG, PNG, GIF, WebP and PDF are allowed.'
        )
        return
      }

      // Validate file size (20 MB max)
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          language === 'hi' 
            ? `फाइल बहुत बड़ी है। अधिकतम ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB अनुमत है।` 
            : `File too large. Maximum ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB allowed.`
        )
        return
      }

      // Read file as data URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const attachment: ChatAttachment = {
          id: `attach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: file.type === 'application/pdf' ? 'pdf' : 'image',
          name: file.name,
          size: file.size,
          url: dataUrl,
          mimeType: file.type,
        }

        // Create thumbnail for images
        if (attachment.type === 'image') {
          attachment.thumbnailUrl = dataUrl
        }

        setPendingAttachments(prev => [...prev, attachment])
        toast.success(
          language === 'hi' 
            ? `${file.name} जोड़ा गया` 
            : `${file.name} added`
        )
      }
      reader.onerror = () => {
        toast.error(language === 'hi' ? 'फाइल पढ़ने में त्रुटि' : 'Error reading file')
      }
      reader.readAsDataURL(file)
    })

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [language, MAX_FILE_SIZE, ALLOWED_FILE_TYPES])

  // Handle clipboard paste for images (like WhatsApp)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'))
    
    if (imageItems.length === 0) return

    e.preventDefault() // Prevent pasting text representation of image

    imageItems.forEach(item => {
      const file = item.getAsFile()
      if (!file) return

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          language === 'hi' 
            ? `इमेज बहुत बड़ी है। अधिकतम ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB अनुमत है।` 
            : `Image too large. Maximum ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB allowed.`
        )
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const attachment: ChatAttachment = {
          id: `attach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'image',
          name: `screenshot-${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.png`,
          size: file.size,
          url: dataUrl,
          mimeType: file.type,
          thumbnailUrl: dataUrl,
        }
        setPendingAttachments(prev => [...prev, attachment])
        toast.success(
          language === 'hi' 
            ? 'स्क्रीनशॉट जोड़ा गया' 
            : 'Screenshot added'
        )
      }
      reader.readAsDataURL(file)
    })
  }, [language, MAX_FILE_SIZE])

  const removeAttachment = useCallback((attachmentId: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== attachmentId))
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  // Insert emoji into message input
  const insertEmoji = useCallback((emoji: string) => {
    setMessageInput(prev => prev + emoji)
    // Keep focus on input after emoji insertion
    chatInputRef.current?.focus()
  }, [])

  // Emoji picker component
  const EmojiPicker = ({ onSelect, onClose }: { onSelect: (emoji: string) => void, onClose: () => void }) => {
    const categoryLabels: Record<keyof typeof EMOJI_CATEGORIES, { hi: string, en: string, icon: string }> = {
      smileys: { hi: 'चेहरे', en: 'Smileys', icon: '😀' },
      gestures: { hi: 'हाथ', en: 'Gestures', icon: '👋' },
      love: { hi: 'प्यार', en: 'Love', icon: '❤️' },
      celebration: { hi: 'जश्न', en: 'Celebration', icon: '🎉' },
      objects: { hi: 'वस्तुएं', en: 'Objects', icon: '📱' },
      indian: { hi: 'भारतीय', en: 'Indian', icon: '🙏' }
    }

    return (
      <div className="w-72 bg-background border rounded-lg shadow-lg overflow-hidden">
        {/* Category tabs */}
        <div className="flex border-b overflow-x-auto">
          {(Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>).map(cat => (
            <button
              key={cat}
              onClick={() => setEmojiCategory(cat)}
              className={`flex-shrink-0 p-2 text-lg transition-colors ${
                emojiCategory === cat 
                  ? 'bg-primary/10 border-b-2 border-primary' 
                  : 'hover:bg-muted'
              }`}
              title={language === 'hi' ? categoryLabels[cat].hi : categoryLabels[cat].en}
            >
              {categoryLabels[cat].icon}
            </button>
          ))}
        </div>
        
        {/* Emoji grid */}
        <ScrollArea className="h-48 p-2">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_CATEGORIES[emojiCategory].map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                onClick={() => {
                  onSelect(emoji)
                }}
                className="p-1.5 text-xl hover:bg-muted rounded transition-colors"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Render attachment in message
  const renderAttachment = (attachment: ChatAttachment, isFromUser: boolean) => {
    if (attachment.type === 'image') {
      return (
        <div 
          className="mt-2 rounded-lg overflow-hidden cursor-pointer max-w-[200px]"
          onClick={() => setPreviewAttachment(attachment)}
        >
          <img 
            src={attachment.thumbnailUrl || attachment.url} 
            alt={attachment.name}
            className="w-full h-auto object-cover"
          />
        </div>
      )
    }

    if (attachment.type === 'pdf') {
      return (
        <a 
          href={attachment.url}
          download={attachment.name}
          className={`mt-2 flex items-center gap-2 p-2 rounded-lg ${
            isFromUser ? 'bg-primary-foreground/10' : 'bg-muted'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <FilePdf size={32} className="text-red-500 shrink-0" weight="fill" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachment.name}</p>
            <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
          </div>
          <DownloadSimple size={20} className="shrink-0" />
        </a>
      )
    }

    return null
  }

  // Open report dialog
  const openReportDialog = (profileId: string, name: string) => {
    setProfileToReport({ profileId, name })
    setShowReportDialog(true)
  }

  const canChatWith = (otherProfileId: string): boolean => {
    if (isAdmin) return true
    if (!currentUserProfile) return false
    if (!otherProfileId) return false
    
    // If user is deactivated, they can only chat with admin
    if (currentUserProfile.accountStatus === 'deactivated') {
      return otherProfileId === 'admin'
    }
    
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
  
  // Check if deactivated user can still chat with admin (based on plan and duration)
  const canDeactivatedUserChatWithAdmin = (): boolean => {
    if (!currentUserProfile) return false
    if (currentUserProfile.accountStatus !== 'deactivated') return true // Active users can always chat
    
    const now = new Date()
    const deactivatedAt = currentUserProfile.deactivatedAt ? new Date(currentUserProfile.deactivatedAt) : null
    if (!deactivatedAt) return true
    
    // For paid plan users: can chat with admin until plan validity
    if (currentUserProfile.membershipPlan && currentUserProfile.membershipPlan !== 'free') {
      const planExpiry = currentUserProfile.membershipExpiry ? new Date(currentUserProfile.membershipExpiry) : null
      if (planExpiry && planExpiry > now) {
        return true
      }
      return false // Plan expired
    }
    
    // For free plan users: can chat with admin for configured months after deactivation
    const freePlanChatMonths = membershipSettings?.freePlanChatDurationMonths || 6
    const chatExpiry = new Date(deactivatedAt)
    chatExpiry.setMonth(chatExpiry.getMonth() + freePlanChatMonths)
    
    return now < chatExpiry
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
          status: (msg.read ? 'read' : 'delivered') as 'sent' | 'delivered' | 'read'
        }
      }
      return msg
    })
    
    if (hasUpdates) {
      setMessages(updatedMessages)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Admin should NOT see user-to-user conversations in Admin Chat
        // Admin Chat is only for admin-to-user support conversations
        if (!isAdmin && (msg.fromProfileId === currentUserProfile?.profileId || msg.toProfileId === currentUserProfile?.profileId)) {
          const otherProfileId = msg.fromProfileId === currentUserProfile?.profileId ? msg.toProfileId! : msg.fromProfileId
          
          const convId = [currentUserProfile!.profileId, otherProfileId].sort().join('-')
          
          if (!convMap.has(convId)) {
            convMap.set(convId, {
              id: convId,
              participants: [currentUserProfile!.profileId, otherProfileId],
              lastMessage: msg,
              timestamp: msg.timestamp,
              unreadCount: msg.read || msg.fromProfileId === currentUserProfile?.profileId ? 0 : 1,
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
            if (!msg.read && msg.fromProfileId !== currentUserProfile?.profileId) {
              conv.unreadCount++
            }
          }
        }
      }
    })

    // Also create conversations for accepted interests that don't have messages yet
    if (!isAdmin && currentUserProfile && interests) {
      const currentProfileId = currentUserProfile.profileId
      const acceptedInterests = interests.filter(i => 
        i.status === 'accepted' && 
        (i.fromProfileId === currentProfileId || i.toProfileId === currentProfileId)
      )
      
      acceptedInterests.forEach(interest => {
        const otherProfileId = interest.fromProfileId === currentProfileId 
          ? interest.toProfileId 
          : interest.fromProfileId
        
        const convId = [currentProfileId, otherProfileId].sort().join('-')
        
        // Only add if no conversation exists yet
        if (!convMap.has(convId)) {
          convMap.set(convId, {
            id: convId,
            participants: [currentProfileId, otherProfileId],
            lastMessage: undefined,
            timestamp: interest.createdAt,
            unreadCount: 0,
            createdAt: interest.createdAt,
            updatedAt: interest.createdAt,
          })
        }
      })
    }

    // Always add Admin Support conversation for non-admin users
    if (!isAdmin && currentUserProfile) {
      const adminConvId = `admin-${currentUserProfile.profileId}`
      if (!convMap.has(adminConvId)) {
        convMap.set(adminConvId, {
          id: adminConvId,
          participants: ['admin', currentUserProfile.profileId],
          lastMessage: undefined,
          timestamp: new Date().toISOString(),
          unreadCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    }

    const sortedConversations = Array.from(convMap.values()).sort(
      (a, b) => new Date(b.updatedAt || b.createdAt || '').getTime() - new Date(a.updatedAt || a.createdAt || '').getTime()
    )

    // Filter out blocked and deleted profiles from conversations (for non-admin users)
    const filteredConversations = isAdmin ? sortedConversations : sortedConversations.filter(conv => {
      // Don't filter admin chats or broadcast
      if (conv.id === 'admin-broadcast' || conv.id.startsWith('admin-')) return true
      
      // Check if the other participant is blocked or deleted
      const otherProfileId = conv.participants?.find(id => id !== currentUserProfile?.profileId)
      if (!otherProfileId) return true
      
      // Check if the other profile exists (not deleted)
      const otherProfile = profiles.find(p => p.profileId === otherProfileId)
      if (!otherProfile || otherProfile.isDeleted) {
        // Profile was deleted - don't show conversation at all
        return false
      }
      
      // Check both directions of blocking
      const isBlocked = blockedProfiles?.some(
        b => (b.blockerProfileId === currentUserProfile?.profileId && b.blockedProfileId === otherProfileId) ||
             (b.blockedProfileId === currentUserProfile?.profileId && b.blockerProfileId === otherProfileId)
      )
      
      return !isBlocked
    })

    setConversations(filteredConversations)
  }, [messages, currentUserProfile, isAdmin, interests, blockedProfiles, profiles])

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation, currentUserProfile, isAdmin, messages])

  // Scroll to bottom when conversation is selected or messages change
  useEffect(() => {
    if (!selectedConversation) return
    
    // Use setTimeout to ensure DOM has fully rendered before scrolling
    const timeoutId = setTimeout(() => {
      // Scroll only within the messages container (parent of messagesEndRef)
      // Find the nearest scrollable parent (ScrollArea viewport) and scroll it
      const element = messagesEndRef.current
      if (element) {
        const scrollParent = element.closest('[data-radix-scroll-area-viewport]') as HTMLElement
        if (scrollParent) {
          scrollParent.scrollTop = scrollParent.scrollHeight
        } else {
          // Fallback: scroll within nearest scrollable ancestor
          const parent = element.parentElement
          if (parent) {
            parent.scrollTop = parent.scrollHeight
          }
        }
      }
    }, 100)
    
    return () => clearTimeout(timeoutId)
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
      // For admin viewing user-to-user chats
      return messages.filter(m => {
        if (m.type !== 'user-to-user') return false
        if (!m.fromProfileId || !m.toProfileId) return false
        
        const msgConvId = [m.fromProfileId, m.toProfileId].sort().join('-')
        return msgConvId === convId
      })
    }

    const [profileId1, profileId2] = convId.split('-')
    // Filter messages that belong to this specific conversation
    // Ensure both fromProfileId and toProfileId are valid and match exactly
    return messages.filter(m => {
      if (m.type !== 'user-to-user') return false
      if (!m.fromProfileId || !m.toProfileId) return false
      
      // Create the conversation ID from the message's participants
      const msgConvId = [m.fromProfileId, m.toProfileId].sort().join('-')
      return msgConvId === convId
    })
  }

  // Clear chat history (admin only) - removes all messages but keeps conversation in list
  const handleClearChatHistory = (conversationId: string) => {
    if (!isAdmin) return
    
    if (!confirm(language === 'hi' 
      ? 'क्या आप वाकई इस चैट का इतिहास साफ़ करना चाहते हैं?' 
      : 'Are you sure you want to clear this chat history?'
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
          return !(msg.type === 'admin-to-user' && 
            ((msg.fromProfileId === 'admin' && msg.toProfileId === userProfileId) ||
             (msg.fromProfileId === userProfileId && msg.toProfileId === 'admin')))
        }
        const [profileId1, profileId2] = conversationId.split('-')
        return !(
          (msg.fromProfileId === profileId1 && msg.toProfileId === profileId2) ||
          (msg.fromProfileId === profileId2 && msg.toProfileId === profileId1)
        )
      })
    })
    
    toast.success(language === 'hi' ? 'चैट इतिहास साफ़ कर दिया गया' : 'Chat history cleared')
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
    if ((!messageInput.trim() && pendingAttachments.length === 0) || !selectedConversation) return
    if (!isAdmin && !currentUserProfile) return
    
    // Prevent double-click race condition
    if (isSendingRef.current) {
      logger.debug('[Chat] Send blocked - already sending')
      return
    }
    isSendingRef.current = true
    
    // Reset sending flag after a short delay to allow next message
    setTimeout(() => { isSendingRef.current = false }, 300)

    // Check if this is admin chat (always allowed for all users - free feature)
    const isAdminChat = selectedConversation.startsWith('admin-')

    // Filter phone numbers for user-to-user chats (not admin chats)
    let finalMessage = messageInput.trim()
    if (!isAdmin && !isAdminChat) {
      const sanitizeResult = sanitizeChatMessage(messageInput, {
        allowPhoneNumbers: false,
        isAdminChat: false,
        language: language === 'hi' ? 'hi' : 'en'
      })

      if (sanitizeResult.originalContainedPhone) {
        // Show warning toast
        toast.warning(t.phoneNumberBlocked, {
          description: t.useContactRequest,
          duration: 5000,
        })
        // Use the masked message
        finalMessage = sanitizeResult.sanitized
        logger.info('[Chat] Phone number detected and masked in message')
      }
    }

    if (!isAdmin && selectedConversation.includes('-') && !isAdminChat) {
      const otherProfileId = getOtherProfileIdFromConversation(selectedConversation)
      if (otherProfileId && !canChatWith(otherProfileId)) {
        toast.error(t.acceptInterestFirst)
        return
      }

      // Check chat limit for all plans (only for user-to-user chats, not admin chats)
      if (otherProfileId && setProfiles && currentUserProfile) {
        // Get the current user's profile ID for matching
        const currentProfileId = currentUserProfile.id
        const currentProfileProfileId = currentUserProfile.profileId
        
        // Use actual chatted profiles from messages (most accurate) or stored values
        // Also include any pending slots being consumed to prevent race condition
        const chattedProfiles = chatRequestsUsed
        const pendingSlots = pendingChatSlotsRef.current
        const effectiveChattedCount = chattedProfiles.length + Array.from(pendingSlots).filter(id => !chattedProfiles.includes(id)).length
        
        // If already chatted with this profile (or pending), allow without further checks
        if (!chattedProfiles.includes(otherProfileId) && !pendingSlots.has(otherProfileId)) {
          // Check if limit reached using effective count (including pending)
          if (effectiveChattedCount >= chatLimit) {
            toast.error(t.chatLimitReached, {
              description: t.upgradeForMoreChats,
              duration: 6000
            })
            return
          }
          
          // Mark this slot as pending to prevent race condition
          pendingSlots.add(otherProfileId)

          // Add to chatted profiles (use new field)
          const updatedChattedProfiles = [...chattedProfiles, otherProfileId]
          
          // Update profiles - use profileId for more reliable matching
          setProfiles((current) => {
            const updated = (current || []).map(p => {
              // Match by both id and profileId for robustness
              if (p.id === currentProfileId || p.profileId === currentProfileProfileId) {
                logger.debug(`[Chat] Updating chatRequestsUsed for profile ${p.profileId}:`, updatedChattedProfiles)
                return { 
                  ...p, 
                  chatRequestsUsed: updatedChattedProfiles, 
                  freeChatProfiles: updatedChattedProfiles,
                  updatedAt: new Date().toISOString()
                }
              }
              return p
            })
            logger.debug(`[Chat] Profiles updated, saving to storage...`)
            return updated
          })

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
      message: finalMessage,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      read: false,
      status: 'sent',
      delivered: false,
      type: 'user-to-user',
      attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined
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
    setPendingAttachments([])
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
    <div className="container mx-auto px-4 md:px-8 py-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Deactivated Account Alert */}
        {!isAdmin && currentUserProfile?.accountStatus === 'deactivated' && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Warning size={24} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  {language === 'hi' ? 'प्रोफाइल निष्क्रिय' : 'Profile Deactivated'}
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {language === 'hi' 
                    ? 'आपकी प्रोफाइल निष्क्रियता के कारण डिएक्टिवेट हो गई है। इस स्थिति में आप केवल एडमिन से चैट कर सकते हैं। पुनः सक्रिय करने के लिए एडमिन से संपर्क करें।'
                    : 'Your profile has been deactivated due to inactivity. In this state, you can only chat with admin. Contact admin to request reactivation.'}
                </p>
                {!canDeactivatedUserChatWithAdmin() && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-medium">
                    {language === 'hi' 
                      ? '⚠️ आपकी चैट अवधि समाप्त हो गई है। कृपया प्लान नवीनीकृत करें।'
                      : '⚠️ Your chat period has expired. Please renew your plan.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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
              {onUpgrade && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onUpgrade}
                  className="h-7 text-xs gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                >
                  <Rocket size={14} weight="fill" />
                  {t.getMoreChats}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Deactivated user - Only admin chat allowed */}
        {!isAdmin && currentUserProfile?.accountStatus === 'deactivated' && canDeactivatedUserChatWithAdmin() && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
            {/* Left panel - Admin Support only */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === 'hi' ? 'सहायता चैट (केवल एडमिन)' : 'Support Chat (Admin Only)'}
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
                          {hasAdminUnread && (
                            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                              {adminUnread > 99 ? '99+' : adminUnread}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{language === 'hi' ? 'एडमिन सहायता' : 'Admin Support'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {language === 'hi' ? 'पुनः सक्रियण के लिए संपर्क करें' : 'Contact for reactivation'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
                
                {/* Info about deactivated state */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    {language === 'hi' 
                      ? '🔒 अन्य प्रोफाइल के साथ चैट निष्क्रियता के कारण प्रतिबंधित है।'
                      : '🔒 Chat with other profiles is restricted due to inactivity.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Right panel - Chat area */}
            <Card className="md:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  <CardHeader className="pb-2 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                          <span className="text-sm text-primary-foreground">👤</span>
                        </div>
                        <div>
                          <p className="font-semibold">{language === 'hi' ? 'एडमिन सहायता' : 'Admin Support'}</p>
                          <p className="text-xs text-muted-foreground">{language === 'hi' ? 'ऑनलाइन' : 'Online'}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                    <ScrollArea className="flex-1 p-4">
                      {(() => {
                        const adminMessages = (messages || []).filter(m => 
                          selectedConversation && 
                          ((m.fromProfileId === currentUserProfile?.profileId && m.toProfileId === 'admin') ||
                           (m.fromProfileId === 'admin' && m.toProfileId === currentUserProfile?.profileId) ||
                           (m.type === 'admin-to-user' && m.toProfileId === currentUserProfile?.profileId))
                        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                        
                        if (adminMessages.length === 0) {
                          return (
                            <div className="text-center text-muted-foreground py-8">
                              <ChatCircle size={48} className="mx-auto mb-2 opacity-50" />
                              <p>{language === 'hi' ? 'पुनः सक्रियण के लिए एडमिन से बात करें' : 'Talk to admin for reactivation'}</p>
                            </div>
                          )
                        }
                        
                        return (
                          <div className="space-y-4">
                            {adminMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.fromProfileId === currentUserProfile?.profileId ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                                    msg.fromProfileId === currentUserProfile?.profileId
                                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                                      : 'bg-muted rounded-bl-sm'
                                  }`}
                                >
                                  {/* Display attachments */}
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="space-y-2 mb-2">
                                      {msg.attachments.map(attachment => renderAttachment(attachment, msg.fromProfileId === currentUserProfile?.profileId))}
                                    </div>
                                  )}
                                  {msg.message && <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>}
                                  <p className={`text-[10px] mt-1 ${
                                    msg.fromProfileId === currentUserProfile?.profileId 
                                      ? 'text-primary-foreground/70' 
                                      : 'text-muted-foreground'
                                  }`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                        )
                      })()}
                    </ScrollArea>
                    <div className="p-4 border-t space-y-3">
                      {/* Pending attachments preview */}
                      {pendingAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
                          {pendingAttachments.map(attachment => (
                            <div key={attachment.id} className="relative group">
                              {attachment.type === 'image' ? (
                                <div className="w-16 h-16 rounded-lg overflow-hidden border">
                                  <img 
                                    src={attachment.thumbnailUrl || attachment.url} 
                                    alt={attachment.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-lg border flex flex-col items-center justify-center bg-red-50">
                                  <FilePdf size={24} className="text-red-500" weight="fill" />
                                  <span className="text-[8px] text-muted-foreground truncate w-14 text-center mt-1">
                                    {attachment.name}
                                  </span>
                                </div>
                              )}
                              <button
                                onClick={() => removeAttachment(attachment.id)}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove attachment"
                                title="Remove attachment"
                              >
                                <X size={12} weight="bold" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                          title={language === 'hi' ? 'फाइल जोड़ें' : 'Add file'}
                        >
                          <Paperclip size={20} />
                        </Button>
                        <Input
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onPaste={handlePaste}
                          placeholder={language === 'hi' ? 'संदेश लिखें...' : 'Type a message...'}
                          className="flex-1"
                        />
                        <Button type="submit" disabled={!messageInput.trim() && pendingAttachments.length === 0}>
                          <PaperPlaneTilt size={20} />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ChatCircle size={48} className="mx-auto mb-2 opacity-50" />
                    <p>{language === 'hi' ? 'एडमिन सहायता चुनें' : 'Select Admin Support'}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Limited chat for free/expired membership - only admin chat allowed */}
        {shouldBlur && !isAdmin && currentUserProfile?.accountStatus !== 'deactivated' && (
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
                      {(() => {
                        if (!messagesLoaded) {
                          return (
                            <div className="text-center text-muted-foreground py-8">
                              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                              <p className="text-sm">
                                {language === 'hi' ? 'संदेश लोड हो रहे हैं...' : 'Loading messages...'}
                              </p>
                            </div>
                          )
                        }
                        
                        const filteredMessages = messages
                          ?.filter(m => 
                            m.type === 'admin-to-user' && 
                            (m.toProfileId === currentUserProfile?.profileId || m.fromProfileId === currentUserProfile?.profileId)
                          )
                          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) || []
                        
                        if (filteredMessages.length === 0) {
                          return (
                            <div className="text-center text-muted-foreground py-8">
                              <ChatCircle size={48} className="mx-auto mb-3 opacity-40" weight="light" />
                              <p className="text-sm">
                                {language === 'hi' ? 'अभी कोई संदेश नहीं। एडमिन को संदेश भेजें!' : 'No messages yet. Send a message to admin!'}
                              </p>
                            </div>
                          )
                        }
                        
                        return filteredMessages.map((msg) => {
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
                                {/* Display attachments */}
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="space-y-2 mb-2">
                                    {msg.attachments.map(attachment => renderAttachment(attachment, isFromUser))}
                                  </div>
                                )}
                                {(msg.message || (msg as any).content) && (
                                  <p className="text-sm">{msg.message || (msg as any).content}</p>
                                )}
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
                        })
                      })()}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Admin chat input with attachment support */}
                  <div className="p-4 border-t space-y-3">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                      multiple
                      className="hidden"
                      aria-label="Attach file"
                      title="Attach file (JPG, PNG, PDF - up to 20 MB)"
                      onChange={(e) => handleFileSelect(e.target.files)}
                    />

                    {/* Pending attachments preview */}
                    {pendingAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
                        {pendingAttachments.map(attachment => (
                          <div key={attachment.id} className="relative group">
                            {attachment.type === 'image' ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border">
                                <img 
                                  src={attachment.thumbnailUrl || attachment.url} 
                                  alt={attachment.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-lg border flex flex-col items-center justify-center bg-red-50">
                                <FilePdf size={24} className="text-red-500" weight="fill" />
                                <span className="text-[8px] text-muted-foreground truncate w-14 text-center mt-1">
                                  {attachment.name}
                                </span>
                              </div>
                            )}
                            <button
                              onClick={() => removeAttachment(attachment.id)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove attachment"
                              title="Remove attachment"
                            >
                              <X size={12} weight="bold" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {/* Attachment button */}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        title={language === 'hi' ? 'फाइल जोड़ें (JPG, PNG, PDF - 20 MB तक)' : 'Add file (JPG, PNG, PDF - up to 20 MB)'}
                      >
                        <Paperclip size={20} />
                      </Button>

                      {/* Emoji picker button */}
                      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title={language === 'hi' ? 'इमोजी जोड़ें' : 'Add emoji'}
                          >
                            <Smiley size={20} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start" side="top">
                          <EmojiPicker 
                            onSelect={(emoji) => insertEmoji(emoji)} 
                            onClose={() => setShowEmojiPicker(false)} 
                          />
                        </PopoverContent>
                      </Popover>

                      <Input
                        ref={chatInputRef}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder={language === 'hi' ? 'एडमिन को संदेश लिखें...' : 'Type message to admin...'}
                        onPaste={handlePaste}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && (messageInput.trim() || pendingAttachments.length > 0)) {
                            // Send message to admin with attachments
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
                              delivered: false,
                              attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined
                            }
                            setMessages([...(messages || []), newMsg])
                            setMessageInput('')
                            setPendingAttachments([])
                          }
                        }}
                      />
                      <Button 
                        onClick={() => {
                          if (messageInput.trim() || pendingAttachments.length > 0) {
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
                              delivered: false,
                              attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined
                            }
                            setMessages([...(messages || []), newMsg])
                            setMessageInput('')
                            setPendingAttachments([])
                          }
                        }} 
                        size="icon"
                        disabled={!messageInput.trim() && pendingAttachments.length === 0}
                      >
                        <PaperPlaneTilt size={20} weight="fill" />
                      </Button>
                    </div>

                    {/* Help text */}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ImageIcon size={12} />
                      {language === 'hi' 
                        ? 'स्क्रीनशॉट के लिए Ctrl+V दबाएं या फाइल जोड़ने के लिए 📎 क्लिक करें' 
                        : 'Press Ctrl+V to paste screenshot or click 📎 to attach files'}
                    </p>
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
                              <div 
                                className="relative cursor-pointer group"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openLightbox(profile.photos || [], 0)
                                }}
                                title={language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge'}
                              >
                                <img 
                                  src={profile.photos[0]} 
                                  alt="" 
                                  className="h-12 w-12 rounded-full object-cover border-2 border-background shadow-sm group-hover:ring-2 group-hover:ring-primary/50 transition-all"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                  <MagnifyingGlassPlus size={16} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
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

          <Card className="md:col-span-2 flex flex-col overflow-hidden">
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
              
              // Handle case where conversation doesn't exist yet (e.g., after unblocking)
              // Create a temporary profile lookup from the selectedConversation ID
              const chatProfile = conv ? getConversationProfile(conv) : (
                otherProfileId ? profiles.find(p => p.profileId === otherProfileId) : undefined
              )
              const isAdminChat = selectedConversation.startsWith('admin-') || selectedConversation === 'admin-broadcast'
              const isChatAllowed = isAdmin || 
                                   selectedConversation.startsWith('admin-') || 
                                   selectedConversation === 'admin-broadcast' ||
                                   (otherProfileId && canChatWith(otherProfileId))

              // Helper function to get conversation title when conv might be undefined
              const getChatTitle = () => {
                if (conv) return getConversationTitle(conv)
                if (isAdminChat) return t.admin
                if (chatProfile) return chatProfile.fullName || otherProfileId || ''
                return otherProfileId || ''
              }

              return (
                <>
                  {/* Enhanced Chat Header with Profile Info */}
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                      {/* Profile Avatar */}
                      {chatProfile?.photos?.[0] ? (
                        <div 
                          className="relative cursor-pointer group"
                          onClick={() => openLightbox(chatProfile.photos || [], 0)}
                          title={language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge'}
                        >
                          <img 
                            src={chatProfile.photos[0]} 
                            alt="" 
                            className="h-10 w-10 rounded-full object-cover border-2 border-background shadow-sm group-hover:ring-2 group-hover:ring-primary/50 transition-all"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                            <MagnifyingGlassPlus size={14} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
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
                          {getChatTitle()}
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
                      {/* Report & Block button - only for user-to-user chats, not admin chats */}
                      {!isAdmin && !isAdminChat && otherProfileId && chatProfile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => openReportDialog(otherProfileId, chatProfile.fullName || otherProfileId)}
                          title={t.reportBlock}
                        >
                          <ShieldWarning size={20} weight="fill" />
                        </Button>
                      )}
                      {/* Clear Chat History button - for admin only */}
                      {isAdmin && selectedConversation && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                          onClick={() => handleClearChatHistory(selectedConversation)}
                          title={language === 'hi' ? 'चैट इतिहास साफ़ करें' : 'Clear chat history'}
                        >
                          <Trash size={20} weight="fill" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <ScrollArea className="h-[calc(600px-180px)] p-4">
                    <div className="space-y-4">
                      {getConversationMessages(selectedConversation).map(msg => {
                        // Handle system messages (like interest accepted notification) - centered style
                        if (msg.isSystemMessage) {
                          return (
                            <div key={msg.id} className="flex justify-center my-4">
                              <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-full px-4 py-2 text-sm text-center max-w-[85%]">
                                <p>{msg.message || (msg as any).content}</p>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                                  {formatTime(msg.timestamp)}
                                </p>
                              </div>
                            </div>
                          )
                        }

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
                                {/* Display attachments */}
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="space-y-2 mb-2">
                                    {msg.attachments.map(attachment => renderAttachment(attachment, isFromCurrentUser))}
                                  </div>
                                )}
                                {(msg.message || (msg as any).content) && (
                                  <p className="text-sm">{msg.message || (msg as any).content}</p>
                                )}
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
                    <div className="p-4 space-y-3 border-t">
                      {/* Pending attachments preview */}
                      {pendingAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg overflow-x-auto">
                          {pendingAttachments.map(attachment => (
                            <div key={attachment.id} className="relative group">
                              {attachment.type === 'image' ? (
                                <div className="w-16 h-16 rounded-lg overflow-hidden border">
                                  <img 
                                    src={attachment.thumbnailUrl || attachment.url} 
                                    alt={attachment.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-lg border flex flex-col items-center justify-center bg-red-50">
                                  <FilePdf size={24} className="text-red-500" weight="fill" />
                                  <span className="text-[8px] text-muted-foreground truncate w-14 text-center mt-1">
                                    {attachment.name}
                                  </span>
                                </div>
                              )}
                              <button
                                onClick={() => removeAttachment(attachment.id)}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove attachment"
                                title="Remove attachment"
                              >
                                <X size={12} weight="bold" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 items-center w-full">
                        {/* Attachment button */}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="shrink-0"
                          onClick={() => fileInputRef.current?.click()}
                          title={language === 'hi' ? 'फाइल जोड़ें' : 'Add file'}
                        >
                          <Paperclip size={20} />
                        </Button>
                        {/* Emoji picker button */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="shrink-0"
                              title={language === 'hi' ? 'इमोजी जोड़ें' : 'Add emoji'}
                            >
                              <Smiley size={20} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start" side="top">
                            <EmojiPicker 
                              onSelect={(emoji) => setMessageInput(prev => prev + emoji)} 
                              onClose={() => {}} 
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          className="flex-1 min-w-0"
                          placeholder={t.typeMessage}
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          onPaste={handlePaste}
                        />
                        <Button onClick={sendMessage} size="icon" className="shrink-0" disabled={!messageInput.trim() && pendingAttachments.length === 0}>
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

      {/* Image Attachment Preview Dialog */}
      <Dialog open={!!previewAttachment} onOpenChange={() => setPreviewAttachment(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon size={20} />
              {previewAttachment?.name}
            </DialogTitle>
            <DialogDescription>
              {previewAttachment && formatFileSize(previewAttachment.size)}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            {previewAttachment?.type === 'image' && (
              <img 
                src={previewAttachment.url} 
                alt={previewAttachment.name}
                className="max-w-full max-h-[70vh] mx-auto object-contain rounded-lg"
              />
            )}
          </div>
          <DialogFooter className="p-4 pt-0">
            <a 
              href={previewAttachment?.url || ''} 
              download={previewAttachment?.name}
              className="inline-flex items-center gap-2"
            >
              <Button variant="outline">
                <DownloadSimple size={18} className="mr-2" />
                {language === 'hi' ? 'डाउनलोड' : 'Download'}
              </Button>
            </a>
            <Button onClick={() => setPreviewAttachment(null)}>
              {language === 'hi' ? 'बंद करें' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report & Block Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldWarning size={24} weight="fill" />
              {t.reportProfile}
            </DialogTitle>
            <DialogDescription>
              {profileToReport?.name && (
                <span className="font-medium text-foreground">{profileToReport.name}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Warning message */}
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <Warning size={20} className="text-amber-600 mt-0.5 shrink-0" weight="fill" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {t.reportWarning}
              </p>
            </div>

            {/* Report reason select */}
            <div className="space-y-2">
              <Label htmlFor="reportReason">{t.reportReason} *</Label>
              <Select value={reportReason} onValueChange={(value) => setReportReason(value as ReportReason)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectReason} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inappropriate-messages">{t.inappropriateMessages}</SelectItem>
                  <SelectItem value="fake-profile">{t.fakeProfile}</SelectItem>
                  <SelectItem value="harassment">{t.harassment}</SelectItem>
                  <SelectItem value="spam">{t.spam}</SelectItem>
                  <SelectItem value="offensive-content">{t.offensiveContent}</SelectItem>
                  <SelectItem value="other">{t.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional details textarea */}
            <div className="space-y-2">
              <Label htmlFor="reportDescription">{t.additionalDetails}</Label>
              <Textarea
                id="reportDescription"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder={language === 'hi' ? 'कृपया और विवरण प्रदान करें...' : 'Please provide more details...'}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowReportDialog(false)
                setReportReason('')
                setReportDescription('')
                setProfileToReport(null)
              }}
            >
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReportAndBlock}
              disabled={!reportReason}
              className="gap-2"
            >
              <Prohibit size={18} weight="bold" />
              {t.confirmReport}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox for viewing photos in full size */}
      <PhotoLightbox
        photos={lightboxState.photos}
        initialIndex={lightboxState.initialIndex}
        open={lightboxState.open}
        onClose={closeLightbox}
      />
    </div>
  )
}
