import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useKV } from '@/hooks/useKV'
import { Eye, Heart, ChatCircle, Check, X, MagnifyingGlassPlus, ProhibitInset, Phone, Envelope as EnvelopeIcon, User, Clock, ArrowCounterClockwise, Warning, Rocket, UploadSimple, CurrencyInr } from '@phosphor-icons/react'
import type { Interest, ContactRequest, Profile, BlockedProfile, MembershipPlan, DeclinedProfile, UserNotification } from '@/types/profile'
import type { ChatMessage } from '@/types/chat'
import type { Language } from '@/lib/translations'
import { toast } from 'sonner'
import { PhotoLightbox, useLightbox } from '@/components/PhotoLightbox'
import { ProfileDetailDialog } from '@/components/ProfileDetailDialog'
import { formatDateDDMMYYYY } from '@/lib/utils'

// Membership settings interface for plan limits
interface MembershipSettings {
  freePlanChatLimit: number
  freePlanContactLimit: number
  sixMonthChatLimit: number
  sixMonthContactLimit: number
  oneYearChatLimit: number
  oneYearContactLimit: number
  requestExpiryDays?: number  // Days before pending requests auto-expire (default: 15)
  // Boost pack settings
  boostPackEnabled?: boolean
  boostPackInterestLimit?: number
  boostPackContactLimit?: number
  boostPackPrice?: number
  // Payment details for boost pack
  upiId?: string
  qrCodeImage?: string
}

// Default limits if settings not provided
const DEFAULT_SETTINGS: MembershipSettings = {
  freePlanChatLimit: 5,
  freePlanContactLimit: 0,
  sixMonthChatLimit: 50,
  sixMonthContactLimit: 20,
  oneYearChatLimit: 120,
  oneYearContactLimit: 50,
  requestExpiryDays: 15,
  boostPackEnabled: true,
  boostPackInterestLimit: 10,
  boostPackContactLimit: 10,
  boostPackPrice: 100
}

interface MyActivityProps {
  loggedInUserId: string | null
  profiles: Profile[]
  language: Language
  onViewProfile?: (profile: Profile) => void
  onNavigateToChat?: (profileId?: string) => void
  membershipPlan?: MembershipPlan
  membershipSettings?: MembershipSettings
  setProfiles?: (newValue: Profile[] | ((oldValue?: Profile[] | undefined) => Profile[])) => void
}

export function MyActivity({ loggedInUserId, profiles, language, onViewProfile, onNavigateToChat, membershipPlan, membershipSettings, setProfiles }: MyActivityProps) {
  const [interests, setInterests] = useKV<Interest[]>('interests', [])
  const [contactRequests, setContactRequests] = useKV<ContactRequest[]>('contactRequests', [])
  const [messages, setMessages] = useKV<ChatMessage[]>('chatMessages', [])
  const [_blockedProfiles, setBlockedProfiles] = useKV<BlockedProfile[]>('blockedProfiles', [])
  const [declinedProfiles, setDeclinedProfiles] = useKV<DeclinedProfile[]>('declinedProfiles', [])
  const [, setUserNotifications] = useKV<UserNotification[]>('userNotifications', [])
  
  // State for tab navigation
  const [activeTab, setActiveTab] = useState<string>('received-interests')
  
  // State for dialogs
  const [interestToDecline, setInterestToDecline] = useState<string | null>(null)
  const [interestToBlock, setInterestToBlock] = useState<{ interestId: string, profileId: string } | null>(null)
  const [viewContactProfile, setViewContactProfile] = useState<Profile | null>(null)
  const [selectedProfileForDetails, setSelectedProfileForDetails] = useState<Profile | null>(null)
  const [profileToReconsider, setProfileToReconsider] = useState<{ profileId: string, type: 'interest' | 'contact' | 'block' } | null>(null)
  
  // State for boost pack purchase
  const [showBoostPackDialog, setShowBoostPackDialog] = useState(false)
  const [boostPackScreenshot, setBoostPackScreenshot] = useState<string | null>(null)
  const [isSubmittingBoostPack, setIsSubmittingBoostPack] = useState(false)
  
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
    acceptedInterests: language === 'hi' ? 'स्वीकृत रुचि' : 'Accepted Interests',
    declinedInterests: language === 'hi' ? 'अस्वीकृत रुचि' : 'Declined Interests',
    myContactRequests: language === 'hi' ? 'संपर्क अनुरोध' : 'Contact Requests',
    recentChats: language === 'hi' ? 'नवीनतम चैट' : 'Recent Chats',
    profileViews: language === 'hi' ? 'प्रोफाइल देखे गए' : 'Profile Views',
    pending: language === 'hi' ? 'लंबित' : 'Pending',
    accepted: language === 'hi' ? 'स्वीकृत' : 'Accepted',
    declined: language === 'hi' ? 'अस्वीकृत' : 'Declined',
    approved: language === 'hi' ? 'स्वीकृत' : 'Approved',
    cancelled: language === 'hi' ? 'रद्द' : 'Cancelled',
    revoked: language === 'hi' ? 'वापस लिया' : 'Revoked',
    blocked: language === 'hi' ? 'ब्लॉक' : 'Blocked',
    to: language === 'hi' ? 'को' : 'To',
    from: language === 'hi' ? 'से' : 'From',
    noActivity: language === 'hi' ? 'कोई गतिविधि नहीं' : 'No activity',
    viewProfile: language === 'hi' ? 'प्रोफाइल देखें' : 'View Profile',
    accept: language === 'hi' ? 'स्वीकार करें' : 'Accept',
    decline: language === 'hi' ? 'अस्वीकार करें' : 'Decline',
    block: language === 'hi' ? 'ब्लॉक करें' : 'Block',
    blockTooltip: language === 'hi' 
      ? 'इस प्रोफाइल को ब्लॉक करें - वे आपको दोबारा नहीं दिखेंगे' 
      : 'Block this profile - they won\'t appear in your matches again',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    revoke: language === 'hi' ? 'वापस लें' : 'Revoke',
    sentRequests: language === 'hi' ? 'भेजे गए अनुरोध' : 'Sent Requests',
    receivedRequests: language === 'hi' ? 'प्राप्त अनुरोध' : 'Received Requests',
    contactsRemaining: language === 'hi' ? 'संपर्क शेष' : 'Contacts remaining',
    chatsRemaining: language === 'hi' ? 'चैट शेष' : 'Chats remaining',
    usageInfo: language === 'hi' ? 'उपयोग जानकारी' : 'Usage Info',
    acceptInterestFirst: language === 'hi' ? 'पहले रुचि स्वीकार करें' : 'Accept interest first',
    interestNotAccepted: language === 'hi' ? 'संपर्क अनुरोध स्वीकार करने से पहले रुचि स्वीकार होनी चाहिए' : 'Interest must be accepted before accepting contact request',
    startChat: language === 'hi' ? 'चैट शुरू करें' : 'Start Chat',
    viewContact: language === 'hi' ? 'संपर्क देखें' : 'View Contact',
    contactInformation: language === 'hi' ? 'संपर्क जानकारी' : 'Contact Information',
    mobile: language === 'hi' ? 'मोबाइल' : 'Mobile',
    email: language === 'hi' ? 'ईमेल' : 'Email',
    notProvided: language === 'hi' ? 'उपलब्ध नहीं' : 'Not Provided',
    close: language === 'hi' ? 'बंद करें' : 'Close',
    confirmDecline: language === 'hi' ? 'क्या आप वाकई इस रुचि को अस्वीकार करना चाहते हैं?' : 'Are you sure you want to decline this interest?',
    confirmBlock: language === 'hi' ? 'क्या आप वाकई इस प्रोफाइल को ब्लॉक करना चाहते हैं?' : 'Are you sure you want to block this profile?',
    blockWarning: language === 'hi' ? 'ब्लॉक करने के बाद, यह प्रोफाइल आपको फिर से नहीं दिखेगी और वे आपकी प्रोफाइल भी नहीं देख पाएंगे।' : 'After blocking, this profile will not be shown to you again and they will not be able to see your profile either.',
    confirm: language === 'hi' ? 'पुष्टि करें' : 'Confirm',
    profileBlocked: language === 'hi' ? 'प्रोफाइल ब्लॉक की गई' : 'Profile blocked',
    sentOn: language === 'hi' ? 'भेजा गया' : 'Sent on',
    clickToViewProfile: language === 'hi' ? 'प्रोफाइल देखने के लिए क्लिक करें' : 'Click to view profile',
    years: language === 'hi' ? 'वर्ष' : 'years',
    // Business flow info messages
    interestFlowInfo: language === 'hi' 
      ? '💡 रुचि स्वीकार करने पर प्रेषक का 1 चैट स्लॉट उपयोग होगा' 
      : '💡 Accepting interest will use 1 chat slot from sender',
    contactFlowInfo: language === 'hi' 
      ? '💡 संपर्क स्वीकार करने पर दोनों का 1-1 संपर्क स्लॉट उपयोग होगा' 
      : '💡 Accepting contact will use 1 slot from each party',
    revokeInfo: language === 'hi' 
      ? '↩️ कभी भी वापस ले सकते हैं - स्लॉट वापस नहीं मिलेगा' 
      : '↩️ Can revoke anytime - slots will NOT be refunded',
    slotConsumed: language === 'hi' ? 'स्लॉट उपभोग हो गया' : 'Slot consumed',
    noSlotImpact: language === 'hi' ? 'कोई स्लॉट प्रभाव नहीं' : 'No slot impact',
    chatLimitInfo: language === 'hi' 
      ? 'रुचि स्वीकार करने पर चैट सीमा से एक घटेगी' 
      : 'Accepting an interest uses 1 chat slot',
    chatLimitInfoReceiver: language === 'hi'
      ? 'स्वीकार करने पर भेजने वाले का 1 चैट स्लॉट उपयोग होगा'
      : 'Accepting interest will use 1 chat slot from sender',
    chatLimitReached: language === 'hi' ? 'चैट सीमा समाप्त - अपग्रेड करें' : 'Chat limit reached - Upgrade',
    // New translations for enhanced features
    autoDeclinedContact: language === 'hi' 
      ? '⚠️ संपर्क अनुरोध भी स्वतः अस्वीकृत' 
      : '⚠️ Contact request also auto-declined',
    contactAutoDeclineInfo: language === 'hi'
      ? 'रुचि अस्वीकार करने पर संपर्क अनुरोध भी स्वतः अस्वीकृत हो जाएगा'
      : 'Declining interest will also auto-decline any pending contact request',
    declinedByMe: language === 'hi' ? 'मेरे द्वारा अस्वीकृत' : 'Declined by me',
    declinedByThem: language === 'hi' ? 'उनके द्वारा अस्वीकृत' : 'Declined by them',
    reconsider: language === 'hi' ? 'पुनर्विचार करें' : 'Reconsider',
    undo: language === 'hi' ? 'पूर्ववत करें' : 'Undo',
    unblock: language === 'hi' ? 'अनब्लॉक करें' : 'Unblock',
    confirmReconsider: language === 'hi' 
      ? 'क्या आप इस प्रोफाइल पर पुनर्विचार करना चाहते हैं?' 
      : 'Do you want to reconsider this profile?',
    reconsiderInfo: language === 'hi'
      ? 'पुनर्विचार करने पर आप फिर से रुचि/संपर्क अनुरोध भेज सकते हैं'
      : 'After reconsideration, you can send interest/contact request again',
    profileReconsidered: language === 'hi' ? 'प्रोफाइल पुनर्विचार की गई' : 'Profile reconsidered',
    profileUnblocked: language === 'hi' ? 'प्रोफाइल अनब्लॉक की गई' : 'Profile unblocked',
    contactVisibilityInfo: language === 'hi'
      ? '📱 आपने अनुरोध भेजा और स्वीकृत हुआ = आप उनका संपर्क देख सकते हैं'
      : '📱 You sent request & it was accepted = You can view their contact',
    contactVisibilityWarning: language === 'hi'
      ? '⚠️ वे आपका संपर्क नहीं देख सकते (जब तक वे भी अनुरोध न भेजें)'
      : '⚠️ They cannot view your contact (unless they also request)',
    autoDeclined: language === 'hi' ? 'स्वतः अस्वीकृत' : 'Auto-declined',
    // Profile deleted translations
    profileDeleted: language === 'hi' ? 'प्रोफाइल हटाई गई' : 'Profile Deleted',
    profileDeletedInfo: language === 'hi' 
      ? 'यह प्रोफाइल हटा दी गई है और अब उपलब्ध नहीं है' 
      : 'This profile has been deleted and is no longer available',
    // Request expiry translations
    expiresIn: language === 'hi' ? 'में समाप्त' : 'Expires in',
    daysLeft: language === 'hi' ? 'दिन शेष' : 'days left',
    dayLeft: language === 'hi' ? 'दिन शेष' : 'day left',
    hoursLeft: language === 'hi' ? 'घंटे शेष' : 'hours left',
    expired: language === 'hi' ? 'समाप्त' : 'Expired',
    autoExpired: language === 'hi' ? 'समय समाप्त - स्वतः रद्द' : 'Time expired - Auto-cancelled',
    expiryNotice: language === 'hi' 
      ? '⏳ समय पर जवाब न देने पर अनुरोध स्वतः रद्द हो जाएगा' 
      : '⏳ Request will auto-cancel if not responded in time',
    // Boost pack translations
    boostPack: language === 'hi' ? 'बूस्ट पैक' : 'Boost Pack',
    buyBoostPack: language === 'hi' ? 'बूस्ट पैक खरीदें' : 'Buy Boost Pack',
    boostPackDescription: language === 'hi' 
      ? 'अतिरिक्त रुचि और संपर्क अनुरोध खरीदें' 
      : 'Purchase additional interest and contact requests',
    boostPackIncludes: language === 'hi' ? 'बूस्ट पैक में शामिल' : 'Boost Pack includes',
    interests: language === 'hi' ? 'रुचि अनुरोध' : 'Interest requests',
    contacts: language === 'hi' ? 'संपर्क अनुरोध' : 'Contact requests',
    uploadPaymentScreenshot: language === 'hi' ? 'भुगतान स्क्रीनशॉट अपलोड करें' : 'Upload Payment Screenshot',
    paymentInstructions: language === 'hi' 
      ? 'नीचे दिए गए UPI/QR से भुगतान करें और स्क्रीनशॉट अपलोड करें' 
      : 'Pay using UPI/QR below and upload screenshot',
    submitForVerification: language === 'hi' ? 'सत्यापन के लिए जमा करें' : 'Submit for Verification',
    boostPackPending: language === 'hi' ? 'बूस्ट पैक सत्यापन लंबित' : 'Boost Pack verification pending',
    boostPackSuccess: language === 'hi' ? 'बूस्ट पैक अनुरोध जमा किया गया' : 'Boost Pack request submitted',
    limitsExhausted: language === 'hi' ? 'सीमा समाप्त' : 'Limits exhausted',
    getMoreRequests: language === 'hi' ? 'अधिक अनुरोध प्राप्त करें' : 'Get more requests',
  }

  // Get request expiry days from settings
  const requestExpiryDays = membershipSettings?.requestExpiryDays || DEFAULT_SETTINGS.requestExpiryDays || 15
  
  // Get boost pack settings
  const boostPackEnabled = settings.boostPackEnabled ?? true
  const boostPackInterestLimit = settings.boostPackInterestLimit ?? 10
  const boostPackContactLimit = settings.boostPackContactLimit ?? 10
  const boostPackPrice = settings.boostPackPrice ?? 100
  const upiId = settings.upiId || ''
  const qrCodeImage = settings.qrCodeImage || ''

  // Handler for boost pack purchase submission
  const handleBoostPackSubmit = async () => {
    if (!boostPackScreenshot || !currentUserProfile || !setProfiles) return
    
    setIsSubmittingBoostPack(true)
    try {
      const now = new Date().toISOString()
      const boostPackPurchase = {
        id: `boost-${Date.now()}`,
        purchasedAt: now,
        interestCredits: boostPackInterestLimit,
        contactCredits: boostPackContactLimit,
        amountPaid: boostPackPrice,
        paymentScreenshotUrl: boostPackScreenshot,
        status: 'pending' as const,
      }
      
      // Update the profile with the new boost pack purchase
      setProfiles((prev) => {
        if (!prev) return []
        return prev.map(p => {
          if (p.id === currentUserProfile.id) {
            const existingPurchases = p.boostPacksPurchased || []
            return {
              ...p,
              boostPacksPurchased: [...existingPurchases, boostPackPurchase]
            } as Profile
          }
          return p
        })
      })
      
      toast.success(t.boostPackSuccess)
      setShowBoostPackDialog(false)
      setBoostPackScreenshot(null)
    } catch {
      toast.error(language === 'hi' ? 'बूस्ट पैक जमा करने में त्रुटि' : 'Error submitting boost pack')
    } finally {
      setIsSubmittingBoostPack(false)
    }
  }
  
  // Check if user has pending boost pack
  const hasPendingBoostPack = currentUserProfile?.boostPacksPurchased?.some(bp => bp.status === 'pending')

  // Helper function to calculate days remaining until expiry
  const getDaysRemaining = (createdAt: string): number => {
    const created = new Date(createdAt)
    const expiryDate = new Date(created.getTime() + requestExpiryDays * 24 * 60 * 60 * 1000)
    const now = new Date()
    const diffMs = expiryDate.getTime() - now.getTime()
    return Math.ceil(diffMs / (24 * 60 * 60 * 1000))
  }

  // Helper function to format expiry countdown
  const formatExpiryCountdown = (createdAt: string): { text: string, isUrgent: boolean, isExpired: boolean } => {
    const daysRemaining = getDaysRemaining(createdAt)
    
    if (daysRemaining <= 0) {
      return { text: t.expired, isUrgent: true, isExpired: true }
    } else if (daysRemaining === 1) {
      return { text: `1 ${t.dayLeft}`, isUrgent: true, isExpired: false }
    } else if (daysRemaining <= 3) {
      return { text: `${daysRemaining} ${t.daysLeft}`, isUrgent: true, isExpired: false }
    } else {
      return { text: `${daysRemaining} ${t.daysLeft}`, isUrgent: false, isExpired: false }
    }
  }

  // Auto-expire pending requests that have passed the expiry deadline
  useEffect(() => {
    if (!interests || !contactRequests || !currentUserProfile) return

    let hasChanges = false
    const now = new Date()

    // Check and expire pending interests
    const updatedInterests = interests.map(interest => {
      if (interest.status === 'pending') {
        const daysRemaining = getDaysRemaining(interest.createdAt)
        if (daysRemaining <= 0) {
          hasChanges = true
          
          // Send notification to the sender about expiry
          const senderProfile = getProfileByProfileId(interest.fromProfileId)
          const receiverProfile = getProfileByProfileId(interest.toProfileId)
          
          if (senderProfile) {
            setUserNotifications(prev => [...(prev || []), {
              id: `interest-expired-${interest.id}-${now.getTime()}`,
              recipientProfileId: senderProfile.profileId,
              type: 'interest_expired' as const,
              title: 'Interest Expired',
              titleHi: 'रुचि समाप्त',
              description: `Your interest to ${receiverProfile?.fullName || 'profile'} has expired due to no response in ${requestExpiryDays} days.`,
              descriptionHi: `${receiverProfile?.fullName || 'प्रोफाइल'} को भेजी गई आपकी रुचि ${requestExpiryDays} दिनों में जवाब न मिलने के कारण समाप्त हो गई।`,
              senderProfileId: interest.toProfileId,
              senderName: receiverProfile?.fullName,
              isRead: false,
              createdAt: now.toISOString()
            }])
          }
          
          return {
            ...interest,
            status: 'expired' as const,
            expiredAt: now.toISOString(),
            expiryReason: 'timeout'
          }
        }
      }
      return interest
    })

    // Check and expire pending contact requests
    const updatedContactRequests = contactRequests.map(request => {
      if (request.status === 'pending') {
        const created = new Date(request.createdAt)
        const expiryDate = new Date(created.getTime() + requestExpiryDays * 24 * 60 * 60 * 1000)
        if (now > expiryDate) {
          hasChanges = true
          
          // Send notification to the sender about expiry
          const senderProfile = profiles.find(p => p.id === request.fromUserId)
          const receiverProfile = profiles.find(p => p.id === request.toUserId)
          
          if (senderProfile) {
            setUserNotifications(prev => [...(prev || []), {
              id: `contact-expired-${request.id}-${now.getTime()}`,
              recipientProfileId: senderProfile.profileId,
              type: 'contact_expired' as const,
              title: 'Contact Request Expired',
              titleHi: 'संपर्क अनुरोध समाप्त',
              description: `Your contact request to ${receiverProfile?.fullName || 'profile'} has expired due to no response in ${requestExpiryDays} days.`,
              descriptionHi: `${receiverProfile?.fullName || 'प्रोफाइल'} को भेजा गया आपका संपर्क अनुरोध ${requestExpiryDays} दिनों में जवाब न मिलने के कारण समाप्त हो गया।`,
              senderProfileId: receiverProfile?.profileId,
              senderName: receiverProfile?.fullName,
              isRead: false,
              createdAt: now.toISOString()
            }])
          }
          
          return {
            ...request,
            status: 'expired' as const,
            expiredAt: now.toISOString(),
            expiryReason: 'timeout'
          }
        }
      }
      return request
    })

    // Update if any changes
    if (hasChanges) {
      // @ts-expect-error - status type needs to include 'expired'
      setInterests(updatedInterests)
      // @ts-expect-error - status type needs to include 'expired'
      setContactRequests(updatedContactRequests)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interests, contactRequests, currentUserProfile?.profileId, requestExpiryDays])

  const remainingChats = Math.max(0, chatLimit - chatRequestsUsed.length)
  
  const sentInterests = interests?.filter(i => i.fromProfileId === currentUserProfile?.profileId) || []
  const receivedInterests = interests?.filter(i => i.toProfileId === currentUserProfile?.profileId) || []
  // Filter for pending received interests (for badge count)
  const pendingReceivedInterests = receivedInterests.filter(i => i.status === 'pending')
  // Accepted interests (both sent and received that are accepted)
  const acceptedInterests = interests?.filter(
    i => (i.toProfileId === currentUserProfile?.profileId || i.fromProfileId === currentUserProfile?.profileId) && 
       i.status === 'accepted'
  ) || []
  // Declined interests (both where I declined or they declined)
  const declinedInterests = interests?.filter(
    i => (i.toProfileId === currentUserProfile?.profileId || i.fromProfileId === currentUserProfile?.profileId) && 
       i.status === 'declined'
  ) || []
  const sentContactRequests = contactRequests?.filter(r => r.fromUserId === loggedInUserId) || []
  const receivedContactRequests = contactRequests?.filter(r => r.toUserId === loggedInUserId) || []
  // Filter for pending contact requests (for badge count)
  const pendingContactRequests = receivedContactRequests.filter(r => r.status === 'pending')
  const myChats = messages?.filter(
    m => m.fromUserId === loggedInUserId || m.fromProfileId === currentUserProfile?.profileId || m.toProfileId === currentUserProfile?.profileId
  ).slice(-10) || []

  const getProfileByProfileId = (profileId: string) => {
    return profiles.find(p => p.profileId === profileId)
  }

  const formatDate = (date: string) => {
    return formatDateDDMMYYYY(date)
  }

  const getStatusBadge = (status: string, declinedBy?: 'sender' | 'receiver', autoDeclined?: boolean) => {
    if (status === 'pending') return <Badge variant="secondary"><Clock size={12} className="mr-1" />{t.pending}</Badge>
    if (status === 'accepted' || status === 'approved') return <Badge variant="default" className="bg-teal"><Check size={12} className="mr-1" />{t.accepted}</Badge>
    if (status === 'declined') {
      if (autoDeclined) {
        return <Badge variant="outline" className="border-amber-500 text-amber-600"><Warning size={12} className="mr-1" />{t.autoDeclined}</Badge>
      }
      return <Badge variant="destructive"><X size={12} className="mr-1" />{t.declined}</Badge>
    }
    if (status === 'revoked') return <Badge variant="outline" className="border-amber-500 text-amber-600"><ArrowCounterClockwise size={12} className="mr-1" />{t.revoked}</Badge>
    if (status === 'blocked') return <Badge variant="destructive"><ProhibitInset size={12} className="mr-1" />{t.blocked}</Badge>
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

    // Send welcome messages to both users
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

    // Store in-app notification for the sender (they'll see it in their bell icon)
    const notification: UserNotification = {
      id: `notif-${Date.now()}`,
      recipientProfileId: senderProfile.profileId,
      type: 'interest_accepted',
      title: 'Interest Accepted!',
      titleHi: 'रुचि स्वीकार हुई!',
      description: `${currentUserProfile.fullName} has accepted your interest. You can now chat!`,
      descriptionHi: `${currentUserProfile.fullName} ने आपकी रुचि स्वीकार कर ली है। अब आप चैट कर सकते हैं!`,
      senderProfileId: currentUserProfile.profileId,
      senderName: currentUserProfile.fullName,
      isRead: false,
      createdAt: new Date().toISOString(),
    }
    setUserNotifications(current => [...(current || []), notification])

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
    const interest = interests?.find(i => i.id === interestId)
    if (!interest || !currentUserProfile) return

    const senderProfile = profiles.find(p => p.profileId === interest.fromProfileId)
    const senderProfileId = interest.fromProfileId
    
    // Determine who is declining (sender or receiver of the interest)
    const isReceiver = interest.toProfileId === currentUserProfile.profileId
    const declinedBy = isReceiver ? 'receiver' : 'sender'

    // Update the interest status with tracking info
    setInterests((current) => 
      (current || []).map(i => 
        i.id === interestId 
          ? { 
              ...i, 
              status: 'declined' as const, 
              declinedAt: new Date().toISOString(),
              declinedBy: declinedBy
            }
          : i
      )
    )

    // BUSINESS RULE: When interest is declined, auto-decline any pending contact request from sender
    // This makes the logic transparent: if B declines A's interest, B also declines A's contact request
    if (isReceiver) {
      const pendingContactFromSender = contactRequests?.find(
        r => r.fromProfileId === senderProfileId && 
             r.toUserId === loggedInUserId && 
             r.status === 'pending'
      )
      
      if (pendingContactFromSender) {
        setContactRequests((current) =>
          (current || []).map(r =>
            r.id === pendingContactFromSender.id
              ? { 
                  ...r, 
                  status: 'declined' as const, 
                  declinedAt: new Date().toISOString(),
                  declinedBy: 'receiver' as const,
                  autoDeclinedDueToInterest: true 
                }
              : r
          )
        )
        
        // Update interest to mark that contact was also declined
        setInterests((current) =>
          (current || []).map(i =>
            i.id === interestId
              ? { ...i, contactAutoDeclined: true }
              : i
          )
        )
        
        toast.info(
          language === 'hi' 
            ? 'संपर्क अनुरोध भी स्वतः अस्वीकृत' 
            : 'Contact request also auto-declined',
          { duration: 4000 }
        )
      }
    }

    // Track in declined profiles for reconsider feature
    const newDeclined: DeclinedProfile = {
      id: `declined-${Date.now()}`,
      declinerProfileId: currentUserProfile.profileId,
      declinedProfileId: senderProfileId,
      type: 'interest',
      declinedAt: new Date().toISOString(),
    }
    setDeclinedProfiles(current => [...(current || []), newDeclined])

    // Store in-app notification for the sender (they'll see it in their bell icon)
    if (senderProfile) {
      const notification: UserNotification = {
        id: `notif-${Date.now()}`,
        recipientProfileId: senderProfile.profileId,
        type: 'interest_declined',
        title: 'Interest Declined',
        titleHi: 'रुचि अस्वीकार',
        description: `${currentUserProfile.fullName} has declined your interest`,
        descriptionHi: `${currentUserProfile.fullName} ने आपकी रुचि अस्वीकार कर दी है`,
        senderProfileId: currentUserProfile.profileId,
        senderName: currentUserProfile.fullName,
        isRead: false,
        createdAt: new Date().toISOString(),
      }
      setUserNotifications(current => [...(current || []), notification])
    }

    toast.success(language === 'hi' ? 'रुचि अस्वीकार की गई' : 'Interest declined')
    setInterestToDecline(null)
  }

  // Handler to undo a declined interest - sets status back to pending
  const handleUndoDeclineInterest = (interestId: string) => {
    const interest = interests?.find(i => i.id === interestId)
    const senderProfile = profiles.find(p => p.profileId === interest?.fromProfileId)
    
    setInterests((current) => 
      (current || []).map(i => 
        i.id === interestId 
          ? { ...i, status: 'pending' as const, declinedAt: undefined, declinedBy: undefined, contactAutoDeclined: undefined }
          : i
      )
    )
    
    // Also restore any auto-declined contact request from this sender
    if (interest?.contactAutoDeclined) {
      const autoDeclinedContact = contactRequests?.find(
        r => r.fromProfileId === interest.fromProfileId && 
             r.toUserId === loggedInUserId && 
             r.autoDeclinedDueToInterest === true
      )
      if (autoDeclinedContact) {
        setContactRequests((current) =>
          (current || []).map(r =>
            r.id === autoDeclinedContact.id
              ? { ...r, status: 'pending' as const, declinedAt: undefined, declinedBy: undefined, autoDeclinedDueToInterest: undefined }
              : r
          )
        )
      }
    }
    
    toast.success(
      language === 'hi' 
        ? 'अस्वीकृति वापस ली गई' 
        : 'Decline undone',
      {
        description: language === 'hi' 
          ? `${senderProfile?.fullName || 'उपयोगकर्ता'} की रुचि फिर से लंबित है` 
          : `${senderProfile?.fullName || 'User'}'s interest is pending again`
      }
    )
  }

  const handleBlockProfile = (interestId: string, profileIdToBlock: string) => {
    if (!currentUserProfile) return

    // Block affects both interests and contact requests
    setInterests((current) => 
      (current || []).map(i => 
        i.id === interestId ? { ...i, status: 'blocked' as const, blockedAt: new Date().toISOString() } : i
      )
    )
    
    // Also auto-decline any pending contact requests from blocked profile
    setContactRequests((current) =>
      (current || []).map(r =>
        (r.fromProfileId === profileIdToBlock && r.status === 'pending')
          ? { 
              ...r, 
              status: 'declined' as const, 
              declinedAt: new Date().toISOString(),
              autoDeclinedDueToInterest: true 
            }
          : r
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

  // Handler to reconsider a declined profile - allows user to send new interest/contact
  const handleReconsiderProfile = (profileId: string, type: 'interest' | 'contact' | 'block') => {
    if (!currentUserProfile) return

    if (type === 'block') {
      // Unblock the profile
      setBlockedProfiles((current) =>
        (current || []).map(b =>
          b.blockerProfileId === currentUserProfile.profileId && b.blockedProfileId === profileId
            ? { ...b, isUnblocked: true, unblockedAt: new Date().toISOString() }
            : b
        )
      )
      toast.success(t.profileUnblocked)
    } else {
      // Mark as reconsidered in declined profiles
      setDeclinedProfiles((current) =>
        (current || []).map(d =>
          d.declinerProfileId === currentUserProfile.profileId && d.declinedProfileId === profileId && d.type === type
            ? { ...d, isReconsidered: true, reconsideredAt: new Date().toISOString() }
            : d
        )
      )
      
      // Remove the declined status from interest/contact so user can re-engage
      if (type === 'interest') {
        setInterests((current) =>
          (current || []).filter(i => 
            !(i.toProfileId === currentUserProfile.profileId && i.fromProfileId === profileId && i.status === 'declined')
          )
        )
      } else if (type === 'contact') {
        setContactRequests((current) =>
          (current || []).filter(r =>
            !(r.toUserId === loggedInUserId && r.fromProfileId === profileId && r.status === 'declined')
          )
        )
      }
      
      toast.success(t.profileReconsidered)
    }
    
    setProfileToReconsider(null)
  }

  const handleAcceptContactRequest = (requestId: string) => {
    const request = contactRequests?.find(r => r.id === requestId)
    if (!request || !currentUserProfile) return

    const senderProfile = profiles.find(p => p.id === request.fromUserId)
    const senderProfileId = senderProfile?.profileId || request.fromProfileId || ''
    
    // Business Logic: There must be an accepted interest BETWEEN the two profiles (either direction)
    const interestFromSender = interests?.find(
      i => i.fromProfileId === senderProfileId && 
           i.toProfileId === currentUserProfile.profileId &&
           i.status === 'accepted'
    )
    const interestToSender = interests?.find(
      i => i.fromProfileId === currentUserProfile.profileId && 
           i.toProfileId === senderProfileId &&
           i.status === 'accepted'
    )
    const isAnyInterestAccepted = !!interestFromSender || !!interestToSender
    
    if (!isAnyInterestAccepted) {
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

    // Store in-app notification for the sender (they'll see it in their bell icon)
    const notification: UserNotification = {
      id: `notif-${Date.now()}`,
      recipientProfileId: senderProfile.profileId,
      type: 'contact_accepted',
      title: 'Contact Request Accepted!',
      titleHi: 'संपर्क अनुरोध स्वीकार!',
      description: `${currentUserProfile.fullName} has accepted your contact request. You can now view their contact details!`,
      descriptionHi: `${currentUserProfile.fullName} ने आपका संपर्क अनुरोध स्वीकार कर लिया है। अब आप उनका संपर्क विवरण देख सकते हैं!`,
      senderProfileId: currentUserProfile.profileId,
      senderName: currentUserProfile.fullName,
      isRead: false,
      createdAt: new Date().toISOString(),
    }
    setUserNotifications(current => [...(current || []), notification])
    
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

    // Store in-app notification for the sender (they'll see it in their bell icon)
    if (senderProfile && currentUserProfile) {
      const notification: UserNotification = {
        id: `notif-${Date.now()}`,
        recipientProfileId: senderProfile.profileId,
        type: 'contact_declined',
        title: 'Contact Request Declined',
        titleHi: 'संपर्क अनुरोध अस्वीकार',
        description: `${currentUserProfile.fullName} has declined your contact request`,
        descriptionHi: `${currentUserProfile.fullName} ने आपका संपर्क अनुरोध अस्वीकार कर दिया है`,
        senderProfileId: currentUserProfile.profileId,
        senderName: currentUserProfile.fullName,
        isRead: false,
        createdAt: new Date().toISOString(),
      }
      setUserNotifications(current => [...(current || []), notification])
    }
    
    toast.success(
      language === 'hi' 
        ? 'संपर्क अनुरोध अस्वीकार किया गया' 
        : 'Contact request declined'
    )
  }

  // Handler to undo a declined contact request - sets status back to pending
  const handleUndoDeclineContactRequest = (requestId: string) => {
    const request = contactRequests?.find(r => r.id === requestId)
    const senderProfile = profiles.find(p => p.id === request?.fromUserId)
    
    setContactRequests((current) => 
      (current || []).map(req => 
        req.id === requestId 
          ? { ...req, status: 'pending' as const }
          : req
      )
    )
    
    toast.success(
      language === 'hi' 
        ? 'अस्वीकृति वापस ली गई' 
        : 'Decline undone',
      {
        description: language === 'hi' 
          ? `${senderProfile?.fullName || 'उपयोगकर्ता'} का अनुरोध फिर से लंबित है` 
          : `${senderProfile?.fullName || 'User'}'s request is pending again`
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

  // Revoke handlers - can revoke after accepting, but slots are NOT refunded (consumed permanently)
  const handleRevokeInterest = (interestId: string) => {
    const interest = interests?.find(i => i.id === interestId)
    if (!interest || !currentUserProfile) return

    const senderProfile = getProfileByProfileId(interest.fromProfileId)
    
    // Note: Slots are NOT refunded on revoke - they remain consumed
    // This is the business policy to prevent abuse of the system

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
          ? 'स्लॉट पहले ही उपभोग हो चुका है और वापस नहीं होगा' 
          : 'Slot has been consumed and will not be refunded'
      }
    )
  }

  const handleRevokeContactRequest = (requestId: string) => {
    const request = contactRequests?.find(r => r.id === requestId)
    if (!request || !currentUserProfile) return

    // Note: Slots are NOT refunded on revoke - they remain consumed
    // This is the business policy to prevent abuse of the system

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
          ? 'स्लॉट पहले ही उपभोग हो चुका है और वापस नहीं होगा' 
          : 'Slots have been consumed and will not be refunded'
      }
    )
  }

  return (
    <section className="container mx-auto px-4 md:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{t.title}</h2>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto gap-1 p-1">
            <TabsTrigger value="received-interests" className="relative">
              {t.receivedInterests}
              {pendingReceivedInterests.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5" variant="destructive">{pendingReceivedInterests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted-interests">{t.acceptedInterests}</TabsTrigger>
            <TabsTrigger value="declined-interests" className="relative">
              {t.declinedInterests}
              {declinedInterests.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5" variant="outline">{declinedInterests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent-interests">{t.sentInterests}</TabsTrigger>
            <TabsTrigger value="contact-requests" className="relative">
              {t.myContactRequests}
              {pendingContactRequests.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5" variant="destructive">{pendingContactRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="chats">{t.recentChats}</TabsTrigger>
          </TabsList>

          {/* RECEIVED INTERESTS TAB - Most actionable, now first */}
          <TabsContent value="received-interests">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t.receivedInterests}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ChatCircle size={16} />
                    <span>{t.chatLimitInfoReceiver}</span>
                    {/* Note: Receiver's chat slots are NOT shown here because accepting uses SENDER's slot, not receiver's */}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {receivedInterests.length === 0 ? (
                    <Alert>
                      <AlertDescription>{t.noActivity}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      {receivedInterests.map((interest) => {
                        const profile = getProfileByProfileId(interest.fromProfileId)
                        const alreadyChatted = chatRequestsUsed.includes(interest.fromProfileId)
                        const canAccept = alreadyChatted || remainingChats > 0
                        const isProfileDeleted = profile?.isDeleted === true
                        
                        return (
                          <Card key={interest.id} className={`hover:shadow-md transition-shadow ${isProfileDeleted ? 'opacity-70 bg-gray-50 dark:bg-gray-900/50 border-gray-300' : 'border-rose-100 dark:border-rose-900/30'}`}>
                            <CardContent className="py-2 px-3">
                              <div className="flex flex-col gap-2">
                                <div 
                                  className={`flex items-center justify-between ${isProfileDeleted ? '' : 'cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/20'} -mx-2 px-2 py-1 rounded-lg transition-colors`}
                                  onClick={() => !isProfileDeleted && profile && setSelectedProfileForDetails(profile)}
                                  title={isProfileDeleted ? t.profileDeletedInfo : t.clickToViewProfile}
                                >
                                  <div className="flex items-center gap-2">
                                    {/* Profile Photo */}
                                    {profile?.photos?.[0] ? (
                                      <div 
                                        className="relative cursor-pointer group"
                                        onClick={(e) => { e.stopPropagation(); openLightbox(profile.photos || [], 0) }}
                                        title={language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge'}
                                      >
                                        <div className="absolute -inset-0.5 bg-gradient-to-tr from-rose-300 to-amber-200 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
                                        <img 
                                          src={profile.photos[0]} 
                                          alt={profile.fullName || ''}
                                          className="relative w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                          <MagnifyingGlassPlus size={12} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/50 dark:to-amber-900/50 flex items-center justify-center">
                                        <Heart size={18} weight="fill" className="text-rose-500" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium text-gray-800 dark:text-gray-100 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center gap-1 text-sm leading-tight">
                                        {profile?.fullName || 'Unknown'}
                                        <User size={10} weight="bold" className="opacity-60" />
                                      </p>
                                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{profile?.profileId || interest.fromProfileId}</p>
                                      <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-tight">
                                        {profile?.age} {t.years} • {profile?.location}
                                      </p>
                                      <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{t.sentOn}: {formatDate(interest.createdAt)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {isProfileDeleted && (
                                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 bg-gray-500">
                                        <ProhibitInset size={10} className="mr-0.5" />
                                        {t.profileDeleted}
                                      </Badge>
                                    )}
                                    {interest.status === 'pending' && !isProfileDeleted && (() => {
                                      const expiry = formatExpiryCountdown(interest.createdAt)
                                      return (
                                        <Badge 
                                          variant={expiry.isExpired ? "destructive" : expiry.isUrgent ? "warning" : "outline"} 
                                          className={`text-[10px] px-1.5 py-0 ${expiry.isUrgent ? 'animate-pulse' : ''}`}
                                        >
                                          <Clock size={10} className="mr-0.5" />
                                          {expiry.text}
                                        </Badge>
                                      )
                                    })()}
                                    {getStatusBadge(interest.status)}
                                  </div>
                                </div>
                                {interest.status === 'pending' && !isProfileDeleted && (
                                  <>
                                    <div className="flex gap-1.5">
                                      <Button 
                                        variant="default" 
                                        size="sm"
                                        onClick={() => handleAcceptInterest(interest.id)}
                                        className="flex-1 bg-teal hover:bg-teal/90 h-7 text-xs"
                                        disabled={!canAccept}
                                        title={!canAccept ? t.chatLimitReached : ''}
                                      >
                                        <Check size={12} className="mr-1" />
                                        {t.accept}
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setInterestToDecline(interest.id)}
                                        className="flex-1 h-7 text-xs"
                                      >
                                        <X size={12} className="mr-1" />
                                        {t.decline}
                                      </Button>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button 
                                              variant="destructive" 
                                              size="sm"
                                              onClick={() => setInterestToBlock({ interestId: interest.id, profileId: interest.fromProfileId })}
                                              className="gap-1 h-7 text-xs px-2"
                                            >
                                              <ProhibitInset size={12} />
                                              <span className="hidden sm:inline">{t.block}</span>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" className="max-w-[200px] text-center">
                                            <p>{t.blockTooltip}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                    {!canAccept && (
                                      <p className="text-[9px] text-destructive text-center">
                                        {t.chatLimitReached}
                                      </p>
                                    )}
                                    <div className="text-[9px] text-gray-500 dark:text-gray-400 bg-rose-50/50 dark:bg-rose-950/20 px-2 py-1 rounded border border-rose-100 dark:border-rose-900/30">
                                      <p>💡 {t.interestFlowInfo} <span className="text-emerald-600 dark:text-emerald-400">• {t.revokeInfo}</span></p>
                                    </div>
                                  </>
                                )}
                                {/* Show message for pending interests from deleted profiles */}
                                {interest.status === 'pending' && isProfileDeleted && (
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-center">
                                    <ProhibitInset size={12} className="inline mr-1" />
                                    {t.profileDeletedInfo}
                                  </div>
                                )}
                                {interest.status === 'accepted' && (
                                  <div className="flex gap-2">
                                    <Button 
                                      onClick={() => onNavigateToChat && onNavigateToChat(interest.fromProfileId)}
                                      className="flex-1 gap-2"
                                    >
                                      <ChatCircle size={18} weight="fill" />
                                      {t.startChat}
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleRevokeInterest(interest.id)}
                                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                                    >
                                      <X size={14} className="mr-1" />
                                      {t.revoke}
                                    </Button>
                                  </div>
                                )}
                                {/* Undo button for declined interests */}
                                {interest.status === 'declined' && (
                                  <div className="flex items-center gap-3 mt-2 p-3 bg-muted/30 rounded-lg border border-muted">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleUndoDeclineInterest(interest.id)}
                                      className="text-teal hover:text-teal hover:bg-teal/10 border-teal/30"
                                    >
                                      <ArrowCounterClockwise size={14} className="mr-1" />
                                      {t.undo}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                      {language === 'hi' ? 'पुनर्विचार करने के लिए क्लिक करें' : 'Changed your mind? Click to reconsider'}
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACCEPTED INTERESTS TAB - Ready to chat */}
          <TabsContent value="accepted-interests">
            <Card>
              <CardHeader>
                <CardTitle>{t.acceptedInterests}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {acceptedInterests.length === 0 ? (
                    <Alert>
                      <AlertDescription>{t.noActivity}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {acceptedInterests.map((interest) => {
                        const otherProfileId = interest.fromProfileId === currentUserProfile?.profileId 
                          ? interest.toProfileId 
                          : interest.fromProfileId
                        const profile = getProfileByProfileId(otherProfileId)
                        const isSentByMe = interest.fromProfileId === currentUserProfile?.profileId
                        
                        return (
                          <Card key={interest.id} className="hover:shadow-md transition-shadow border-rose-100 dark:border-rose-900/30">
                            <CardContent className="py-3 px-4">
                              <div className="flex flex-col gap-3">
                                <div 
                                  className="flex items-center justify-between cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/20 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                                  onClick={() => profile && setSelectedProfileForDetails(profile)}
                                  title={t.clickToViewProfile}
                                >
                                  <div className="flex items-center gap-3">
                                    {profile?.photos?.[0] ? (
                                      <div 
                                        className="relative cursor-pointer group"
                                        onClick={(e) => { e.stopPropagation(); openLightbox(profile.photos || [], 0) }}
                                        title={language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge'}
                                      >
                                        <div className="absolute -inset-0.5 bg-gradient-to-tr from-emerald-300 to-teal-200 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
                                        <img 
                                          src={profile.photos[0]} 
                                          alt={profile.fullName || ''}
                                          className="relative w-11 h-11 rounded-full object-cover border-2 border-white dark:border-gray-800 group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                          <MagnifyingGlassPlus size={14} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                        {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-semibold text-gray-800 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center gap-1 text-sm">
                                        {profile?.fullName || 'Unknown'}
                                        <User size={10} weight="bold" className="opacity-60" />
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{profile?.profileId}</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-300">
                                        {profile?.age} {t.years} • {profile?.location}
                                      </p>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                          <Heart size={10} className="mr-0.5" weight="fill" />
                                          {isSentByMe ? (language === 'hi' ? 'आपने भेजी' : 'You sent') : (language === 'hi' ? 'आपको मिली' : 'You received')}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  {getStatusBadge(interest.status)}
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => onNavigateToChat && onNavigateToChat(otherProfileId)}
                                    className="gap-1 flex-1 h-8 text-xs"
                                  >
                                    <ChatCircle size={14} weight="fill" />
                                    {t.startChat}
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => setInterestToDecline(interest.id)}
                                    className="gap-1 h-8 text-xs"
                                  >
                                    <X size={14} />
                                    {t.decline}
                                  </Button>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="destructive"
                                          onClick={() => setInterestToBlock({ interestId: interest.id, profileId: otherProfileId })}
                                          className="gap-1 h-8 text-xs px-2"
                                        >
                                          <ProhibitInset size={14} weight="fill" />
                                          <span className="hidden sm:inline">{t.block}</span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[200px] text-center">
                                        <p>{t.blockTooltip}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
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

          {/* DECLINED INTERESTS TAB */}
          <TabsContent value="declined-interests">
            <Card>
              <CardHeader>
                <CardTitle>{t.declinedInterests}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {declinedInterests.length === 0 ? (
                    <Alert>
                      <AlertDescription>{t.noActivity}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {declinedInterests.map((interest) => {
                        const otherProfileId = interest.fromProfileId === currentUserProfile?.profileId 
                          ? interest.toProfileId 
                          : interest.fromProfileId
                        const profile = getProfileByProfileId(otherProfileId)
                        const wasDeclinedByMe = interest.declinedBy === 'receiver' && interest.toProfileId === currentUserProfile?.profileId
                          || interest.declinedBy === 'sender' && interest.fromProfileId === currentUserProfile?.profileId
                        const isSentByMe = interest.fromProfileId === currentUserProfile?.profileId
                        
                        return (
                          <Card key={interest.id} className="hover:shadow-md transition-shadow border-l-4 border-l-rose-400/50 border-gray-200 dark:border-gray-700">
                            <CardContent className="py-3 px-4">
                              <div className="flex flex-col gap-3">
                                <div 
                                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                                  onClick={() => profile && setSelectedProfileForDetails(profile)}
                                  title={t.clickToViewProfile}
                                >
                                  <div className="flex items-center gap-3">
                                    {profile?.photos?.[0] ? (
                                      <div 
                                        className="relative cursor-pointer group"
                                        onClick={(e) => { e.stopPropagation(); openLightbox(profile.photos || [], 0) }}
                                        title={language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge'}
                                      >
                                        <img 
                                          src={profile.photos[0]} 
                                          alt={profile.fullName || ''}
                                          className="w-11 h-11 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 grayscale-[30%] opacity-80 group-hover:opacity-100 group-hover:grayscale-0 transition-all"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                          <MagnifyingGlassPlus size={14} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400">
                                        {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 inline-flex items-center gap-1 text-sm">
                                        {profile?.fullName || 'Unknown'}
                                        <User size={10} weight="bold" className="opacity-60" />
                                      </p>
                                      <p className="text-xs text-gray-400 dark:text-gray-500">{profile?.profileId}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {profile?.age} {t.years} • {profile?.location}
                                      </p>
                                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                          <Heart size={10} className="mr-0.5" />
                                          {isSentByMe ? (language === 'hi' ? 'आपने भेजी' : 'You sent') : (language === 'hi' ? 'आपको मिली' : 'You received')}
                                        </Badge>
                                        <Badge variant={wasDeclinedByMe ? "outline" : "destructive"} className="text-[10px] px-1.5 py-0 h-4">
                                          <X size={10} className="mr-0.5" />
                                          {wasDeclinedByMe ? t.declinedByMe : t.declinedByThem}
                                        </Badge>
                                        {interest.contactAutoDeclined && (
                                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500 text-amber-600">
                                            <Warning size={10} className="mr-0.5" />
                                            {t.autoDeclinedContact}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {getStatusBadge(interest.status, interest.declinedBy, interest.contactAutoDeclined)}
                                </div>
                                <div className="flex gap-2">
                                  {wasDeclinedByMe && (
                                    <Button 
                                      variant="outline"
                                      onClick={() => handleUndoDeclineInterest(interest.id)}
                                      className="gap-1 flex-1 h-8 text-xs"
                                    >
                                      <ArrowCounterClockwise size={14} />
                                      {t.undo} / {t.reconsider}
                                    </Button>
                                  )}
                                  <Button 
                                    variant="outline"
                                    onClick={() => profile && setSelectedProfileForDetails(profile)}
                                    className="gap-1 h-8 text-xs"
                                  >
                                    <Eye size={14} />
                                    {t.viewProfile}
                                  </Button>
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

          {/* SENT INTERESTS TAB */}
          <TabsContent value="sent-interests">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle>{t.sentInterests}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {t.chatsRemaining}: {Math.max(0, chatLimit - chatRequestsUsed.length)}/{chatLimit}
                    </Badge>
                    {/* Show boost pack button when limits exhausted */}
                    {boostPackEnabled && chatLimit - chatRequestsUsed.length <= 0 && !hasPendingBoostPack && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowBoostPackDialog(true)}
                        className="h-6 text-xs gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                      >
                        <Rocket size={12} weight="fill" />
                        {t.getMoreRequests}
                      </Button>
                    )}
                    {hasPendingBoostPack && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                        {t.boostPackPending}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {sentInterests.length === 0 ? (
                    <Alert>
                      <AlertDescription>{t.noActivity}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      {sentInterests.map((interest) => {
                        const profile = getProfileByProfileId(interest.toProfileId)
                        const isProfileDeleted = profile?.isDeleted === true
                        return (
                          <Card key={interest.id} className={`hover:shadow-sm transition-shadow ${isProfileDeleted ? 'opacity-70 bg-gray-50 dark:bg-gray-900/50 border-gray-300' : 'border-amber-100'}`}>
                            <CardContent className="py-3 px-4">
                              <div 
                                className={`flex items-center justify-between ${isProfileDeleted ? '' : 'cursor-pointer hover:bg-amber-50/50'} -mx-2 px-2 py-1 rounded-lg transition-colors`}
                                onClick={() => !isProfileDeleted && profile && setSelectedProfileForDetails(profile)}
                                title={isProfileDeleted ? t.profileDeletedInfo : t.clickToViewProfile}
                              >
                                <div className="flex items-center gap-3">
                                  {/* Profile Photo */}
                                  {profile?.photos?.[0] ? (
                                    <div 
                                      className={`relative ${isProfileDeleted ? '' : 'cursor-pointer'} group`}
                                      onClick={(e) => { if (!isProfileDeleted) { e.stopPropagation(); openLightbox(profile.photos || [], 0) } }}
                                      title={isProfileDeleted ? t.profileDeletedInfo : (language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge')}
                                    >
                                      <div className={`p-[2px] rounded-full ${isProfileDeleted ? 'bg-gray-400' : 'bg-gradient-to-r from-amber-400 via-rose-400 to-amber-500'}`}>
                                        <img 
                                          src={profile.photos[0]} 
                                          alt={profile.fullName || ''}
                                          className={`w-11 h-11 rounded-full object-cover border-2 border-white ${isProfileDeleted ? 'grayscale' : 'group-hover:scale-105'} transition-transform`}
                                        />
                                      </div>
                                      {!isProfileDeleted && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                          <MagnifyingGlassPlus size={14} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className={`p-[2px] rounded-full ${isProfileDeleted ? 'bg-gray-400' : 'bg-gradient-to-r from-amber-400 via-rose-400 to-amber-500'}`}>
                                      <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                                        <Heart size={20} weight="fill" className={isProfileDeleted ? 'text-gray-400' : 'text-amber-500'} />
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <p className={`font-semibold text-sm ${isProfileDeleted ? 'text-gray-500 line-through' : 'text-amber-700 hover:underline'}`}>
                                      {profile?.fullName || 'Unknown'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{profile?.profileId || interest.toProfileId}</p>
                                    <p className="text-[10px] text-muted-foreground">{formatDate(interest.createdAt)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                  {/* Deleted profile badge */}
                                  {isProfileDeleted && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 bg-gray-500">
                                      <ProhibitInset size={10} className="mr-0.5" />
                                      {t.profileDeleted}
                                    </Badge>
                                  )}
                                  {/* Expiry countdown for pending interests */}
                                  {interest.status === 'pending' && !isProfileDeleted && (() => {
                                    const expiry = formatExpiryCountdown(interest.createdAt)
                                    return (
                                      <Badge 
                                        variant={expiry.isExpired ? "destructive" : expiry.isUrgent ? "warning" : "outline"} 
                                        className={`text-[10px] px-1.5 py-0 ${expiry.isUrgent ? 'animate-pulse' : ''}`}
                                        title={language === 'hi' ? 'प्रतिक्रिया के लिए शेष समय' : 'Time left for response'}
                                      >
                                        <Clock size={10} className="mr-0.5" />
                                        {expiry.text}
                                      </Badge>
                                    )
                                  })()}
                                  {getStatusBadge(interest.status)}
                                  {/* Cancel button for pending interests */}
                                  {interest.status === 'pending' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleCancelInterest(interest.id)}
                                      className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <X size={12} className="mr-1" />
                                      {t.cancel}
                                    </Button>
                                  )}
                                  {/* Revoke button for accepted interests - sender can also revoke */}
                                  {interest.status === 'accepted' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleRevokeInterest(interest.id)}
                                      className="h-8 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                                    >
                                      <X size={12} className="mr-1" />
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

          <TabsContent value="contact-requests">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle>{t.myContactRequests}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {t.contactsRemaining}: {Math.max(0, contactLimit - contactViewsUsed.length)}/{contactLimit}
                    </Badge>
                    {/* Show boost pack button when limits exhausted */}
                    {boostPackEnabled && contactLimit - contactViewsUsed.length <= 0 && !hasPendingBoostPack && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowBoostPackDialog(true)}
                        className="h-6 text-xs gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                      >
                        <Rocket size={12} weight="fill" />
                        {t.getMoreRequests}
                      </Button>
                    )}
                    {hasPendingBoostPack && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                        {t.boostPackPending}
                      </Badge>
                    )}
                  </div>
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
                        <div className="space-y-2">
                          {sentContactRequests.map((request) => {
                            const profile = profiles.find(p => p.id === request.toUserId)
                            const isProfileDeleted = profile?.isDeleted === true
                            return (
                              <Card key={request.id} className={`hover:shadow-sm transition-shadow ${isProfileDeleted ? 'opacity-70 bg-gray-50 dark:bg-gray-900/50 border-gray-300' : 'border-purple-100'}`}>
                                <CardContent className="py-3 px-4">
                                  <div 
                                    className={`flex items-center justify-between ${isProfileDeleted ? '' : 'cursor-pointer hover:bg-purple-50/50'} -mx-2 px-2 py-1 rounded-lg transition-colors`}
                                    onClick={() => !isProfileDeleted && profile && setSelectedProfileForDetails(profile)}
                                    title={isProfileDeleted ? t.profileDeletedInfo : t.clickToViewProfile}
                                  >
                                    <div className="flex items-center gap-3">
                                      {/* Profile Photo */}
                                      {profile?.photos?.[0] ? (
                                        <div 
                                          className={`relative ${isProfileDeleted ? '' : 'cursor-pointer'} group`}
                                          onClick={(e) => { if (!isProfileDeleted) { e.stopPropagation(); openLightbox(profile.photos || [], 0) } }}
                                          title={isProfileDeleted ? t.profileDeletedInfo : (language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge')}
                                        >
                                          <div className={`p-[2px] rounded-full ${isProfileDeleted ? 'bg-gray-400' : 'bg-gradient-to-r from-purple-400 via-rose-400 to-purple-500'}`}>
                                            <img 
                                              src={profile.photos[0]} 
                                              alt={profile.fullName || ''}
                                              className={`w-11 h-11 rounded-full object-cover border-2 border-white ${isProfileDeleted ? 'grayscale' : 'group-hover:scale-105'} transition-transform`}
                                            />
                                          </div>
                                          {!isProfileDeleted && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                              <MagnifyingGlassPlus size={14} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className={`p-[2px] rounded-full ${isProfileDeleted ? 'bg-gray-400' : 'bg-gradient-to-r from-purple-400 via-rose-400 to-purple-500'}`}>
                                          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                                            <Eye size={20} weight="fill" className={isProfileDeleted ? 'text-gray-400' : 'text-purple-500'} />
                                          </div>
                                        </div>
                                      )}
                                      <div>
                                        <p className={`font-semibold text-sm ${isProfileDeleted ? 'text-gray-500 line-through' : 'text-purple-700 hover:underline'}`}>
                                          {profile?.fullName || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{profile?.profileId || 'Unknown'}</p>
                                        <p className="text-[10px] text-muted-foreground">{formatDate(request.createdAt)}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                      {/* Deleted profile badge */}
                                      {isProfileDeleted && (
                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 bg-gray-500">
                                          <ProhibitInset size={10} className="mr-0.5" />
                                          {t.profileDeleted}
                                        </Badge>
                                      )}
                                      {/* Expiry countdown for pending contact requests */}
                                      {request.status === 'pending' && !isProfileDeleted && (() => {
                                        const expiry = formatExpiryCountdown(request.createdAt)
                                        return (
                                          <Badge 
                                            variant={expiry.isExpired ? "destructive" : expiry.isUrgent ? "warning" : "outline"} 
                                            className={`text-[10px] px-1.5 py-0 ${expiry.isUrgent ? 'animate-pulse' : ''}`}
                                            title={language === 'hi' ? 'प्रतिक्रिया के लिए शेष समय' : 'Time left for response'}
                                          >
                                            <Clock size={10} className="mr-0.5" />
                                            {expiry.text}
                                          </Badge>
                                        )
                                      })()}
                                      {getStatusBadge(request.status)}
                                      {/* Cancel button for pending contact requests */}
                                      {request.status === 'pending' && (
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleCancelContactRequest(request.id)}
                                          className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                          <X size={12} className="mr-1" />
                                          {t.cancel}
                                        </Button>
                                      )}
                                      {/* View Contact + Revoke button for approved contact requests - but not for deleted profiles */}
                                      {request.status === 'approved' && profile && !isProfileDeleted && (
                                        <>
                                          <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setViewContactProfile(profile)}
                                            className="h-8 text-xs gap-1"
                                          >
                                            <Eye size={12} />
                                            {t.viewContact}
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleRevokeContactRequest(request.id)}
                                            className="h-8 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                                          >
                                            <X size={12} className="mr-1" />
                                            {t.revoke}
                                          </Button>
                                        </>
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
                        <div className="space-y-2">
                          {receivedContactRequests.map((request) => {
                            const profile = profiles.find(p => p.id === request.fromUserId)
                            const isProfileDeleted = profile?.isDeleted === true
                            return (
                              <Card key={request.id} className={`hover:shadow-sm transition-shadow ${isProfileDeleted ? 'opacity-70 bg-gray-50 dark:bg-gray-900/50 border-gray-300' : 'border-teal-100'}`}>
                                <CardContent className="py-3 px-4">
                                  <div className="flex flex-col gap-2">
                                    <div 
                                      className={`flex items-center justify-between ${isProfileDeleted ? '' : 'cursor-pointer hover:bg-teal-50/50'} -mx-2 px-2 py-1 rounded-lg transition-colors`}
                                      onClick={() => !isProfileDeleted && profile && setSelectedProfileForDetails(profile)}
                                      title={isProfileDeleted ? t.profileDeletedInfo : t.clickToViewProfile}
                                    >
                                      <div className="flex items-center gap-3">
                                        {/* Profile Photo */}
                                        {profile?.photos?.[0] ? (
                                          <div 
                                            className={`relative ${isProfileDeleted ? '' : 'cursor-pointer'} group`}
                                            onClick={(e) => { if (!isProfileDeleted) { e.stopPropagation(); openLightbox(profile.photos || [], 0) } }}
                                            title={isProfileDeleted ? t.profileDeletedInfo : (language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge')}
                                          >
                                            <div className={`p-[2px] rounded-full ${isProfileDeleted ? 'bg-gray-400' : 'bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500'}`}>
                                              <img 
                                                src={profile.photos[0]} 
                                                alt={profile.fullName || ''}
                                                className={`w-11 h-11 rounded-full object-cover border-2 border-white ${isProfileDeleted ? 'grayscale' : 'group-hover:scale-105'} transition-transform`}
                                              />
                                            </div>
                                            {!isProfileDeleted && (
                                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                                <MagnifyingGlassPlus size={14} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className={`p-[2px] rounded-full ${isProfileDeleted ? 'bg-gray-400' : 'bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500'}`}>
                                            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                                              <Eye size={20} weight="fill" className={isProfileDeleted ? 'text-gray-400' : 'text-teal-500'} />
                                            </div>
                                          </div>
                                        )}
                                        <div>
                                          <p className={`font-semibold text-sm ${isProfileDeleted ? 'text-gray-500 line-through' : 'text-teal-700 hover:underline'}`}>
                                            {profile?.fullName || 'Unknown'}
                                          </p>
                                          <p className="text-xs text-muted-foreground">{profile?.profileId || 'Unknown'}</p>
                                          <p className="text-[10px] text-muted-foreground">{formatDate(request.createdAt)}</p>
                                        </div>
                                      </div>
                                      {/* Expiry countdown for pending contact requests */}
                                      <div className="flex items-center gap-2">
                                        {/* Deleted profile badge */}
                                        {isProfileDeleted && (
                                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 bg-gray-500">
                                            <ProhibitInset size={10} className="mr-0.5" />
                                            {t.profileDeleted}
                                          </Badge>
                                        )}
                                        {request.status === 'pending' && !isProfileDeleted && (() => {
                                          const expiry = formatExpiryCountdown(request.createdAt)
                                          return (
                                            <Badge 
                                              variant={expiry.isExpired ? "destructive" : expiry.isUrgent ? "warning" : "outline"} 
                                              className={`text-[10px] px-1.5 py-0 ${expiry.isUrgent ? 'animate-pulse' : ''}`}
                                              title={language === 'hi' ? 'प्रतिक्रिया के लिए शेष समय' : 'Time left for response'}
                                            >
                                              <Clock size={10} className="mr-0.5" />
                                              {expiry.text}
                                            </Badge>
                                          )
                                        })()}
                                        {getStatusBadge(request.status)}
                                      </div>
                                    </div>
                                    {/* Show deleted profile info message for pending requests from deleted profiles */}
                                    {request.status === 'pending' && isProfileDeleted && (
                                      <div className="text-center py-2">
                                        <p className="text-xs text-gray-500 italic">
                                          {t.profileDeletedInfo}
                                        </p>
                                      </div>
                                    )}
                                    {/* Accept/Decline buttons for pending requests - but not for deleted profiles */}
                                    {request.status === 'pending' && !isProfileDeleted && (() => {
                                      // Check if there's any accepted interest between the two profiles (either direction)
                                      const senderProfileId = profile?.profileId || request.fromProfileId
                                      const interestFromSender = interests?.find(
                                        i => i.fromProfileId === senderProfileId && 
                                             i.toProfileId === currentUserProfile?.profileId &&
                                             i.status === 'accepted'
                                      )
                                      const interestToSender = interests?.find(
                                        i => i.fromProfileId === currentUserProfile?.profileId && 
                                             i.toProfileId === senderProfileId &&
                                             i.status === 'accepted'
                                      )
                                      const isAnyInterestAccepted = !!interestFromSender || !!interestToSender
                                      const hasPendingInterest = interests?.find(
                                        i => ((i.fromProfileId === senderProfileId && i.toProfileId === currentUserProfile?.profileId) ||
                                              (i.fromProfileId === currentUserProfile?.profileId && i.toProfileId === senderProfileId)) &&
                                             i.status === 'pending'
                                      )
                                      
                                      return (
                                        <div className="space-y-1">
                                          <div className="flex gap-2">
                                            <Button 
                                              variant="default" 
                                              size="sm"
                                              onClick={() => handleAcceptContactRequest(request.id)}
                                              className="flex-1 h-8 text-xs bg-teal hover:bg-teal/90"
                                              disabled={!isAnyInterestAccepted}
                                            >
                                              <Check size={12} className="mr-1" />
                                              {t.accept}
                                            </Button>
                                            <Button 
                                              variant="destructive" 
                                              size="sm"
                                              onClick={() => handleDeclineContactRequest(request.id)}
                                              className="flex-1 h-8 text-xs"
                                            >
                                              <X size={12} className="mr-1" />
                                              {t.decline}
                                            </Button>
                                          </div>
                                          {!isAnyInterestAccepted && (
                                            <div className="text-center space-y-0.5">
                                              <p className="text-[10px] text-amber-600 font-medium">
                                                ⚠️ {t.acceptInterestFirst}
                                              </p>
                                              {hasPendingInterest ? (
                                                <Button
                                                  variant="link"
                                                  size="sm"
                                                  className="text-[10px] h-auto p-0 text-primary underline"
                                                  onClick={() => setActiveTab('received-interests')}
                                                >
                                                  {language === 'hi' ? '→ प्राप्त रुचि में जाएं' : '→ Go to Received Interests'}
                                                </Button>
                                              ) : (
                                                <p className="text-[10px] text-muted-foreground">
                                                  {language === 'hi' ? 'इस प्रोफाइल के साथ कोई स्वीकृत रुचि नहीं' : 'No accepted interest with this profile'}
                                                </p>
                                              )}
                                            </div>
                                          )}
                                          <p className="text-[10px] text-muted-foreground text-center">
                                            {t.contactFlowInfo}
                                          </p>
                                          <p className="text-[10px] text-green-600 text-center">
                                            {t.revokeInfo}
                                          </p>
                                        </div>
                                      )
                                    })()}
                                    {/* Revoke button for approved RECEIVED contact requests */}
                                    {/* Note: Receiver does NOT get to view sender's contact - they only allowed sender to view THEIR contact */}
                                    {request.status === 'approved' && profile && (
                                      <div className="flex flex-col gap-1">
                                        <p className="text-[10px] text-muted-foreground bg-muted/50 p-1.5 rounded">
                                          ℹ️ {language === 'hi' 
                                            ? 'आपने उन्हें अपना संपर्क देखने की अनुमति दी है। उनका संपर्क देखने के लिए आपको भी उन्हें अनुरोध भेजना होगा।'
                                            : 'You allowed them to view your contact. To view their contact, you need to send them a request too.'}
                                        </p>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleRevokeContactRequest(request.id)}
                                          className="h-8 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                                        >
                                          <X size={12} className="mr-1" />
                                          {t.revoke}
                                        </Button>
                                      </div>
                                    )}
                                    {/* Undo button for declined contact requests */}
                                    {request.status === 'declined' && (
                                      <div className="flex gap-2 mt-1">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleUndoDeclineContactRequest(request.id)}
                                          className="h-8 text-xs text-teal hover:text-teal hover:bg-teal/10 border-teal/30"
                                        >
                                          <ArrowCounterClockwise size={12} className="mr-1" />
                                          {t.undo}
                                        </Button>
                                        <p className="text-[10px] text-muted-foreground flex items-center">
                                          {language === 'hi' ? 'पुनर्विचार करने के लिए क्लिक करें' : 'Click to reconsider'}
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
                    <div className="space-y-2">
                      {myChats.map((msg) => {
                        const isMyMessage = msg.fromProfileId === currentUserProfile?.profileId
                        const otherProfileId = isMyMessage ? msg.toProfileId : msg.fromProfileId
                        const otherProfile = profiles.find(p => p.profileId === otherProfileId)
                        const isAdminMessage = msg.type === 'admin-broadcast' || msg.type === 'admin-to-user' || msg.type === 'admin'
                        
                        return (
                          <Card key={msg.id} className="hover:shadow-sm transition-shadow border-blue-100">
                            <CardContent className="py-3 px-4">
                              <div className="flex items-start gap-3">
                                {/* Profile Photo */}
                                {isAdminMessage ? (
                                  <div className="p-[2px] rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
                                    <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                                      <ChatCircle size={20} weight="fill" className="text-blue-500" />
                                    </div>
                                  </div>
                                ) : otherProfile?.photos?.[0] ? (
                                  <div 
                                    className="relative cursor-pointer group"
                                    onClick={() => openLightbox(otherProfile.photos || [], 0)}
                                    title={language === 'hi' ? 'फोटो बड़ा करें' : 'Click to enlarge'}
                                  >
                                    <div className="p-[2px] rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
                                      <img 
                                        src={otherProfile.photos[0]} 
                                        alt={otherProfile.fullName || ''}
                                        className="w-11 h-11 rounded-full object-cover border-2 border-white group-hover:scale-105 transition-transform"
                                      />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-full transition-all">
                                      <MagnifyingGlassPlus size={14} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-[2px] rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
                                    <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                                      <ChatCircle size={20} weight="fill" className={isMyMessage ? 'text-blue-500' : 'text-indigo-500'} />
                                    </div>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <div>
                                      <p 
                                        className={`font-semibold text-sm text-blue-700 ${!isAdminMessage && otherProfile && onViewProfile ? 'cursor-pointer hover:underline transition-colors' : ''}`}
                                        onClick={() => !isAdminMessage && otherProfile && onViewProfile?.(otherProfile)}
                                      >
                                        {isAdminMessage ? 'Admin' : (otherProfile?.fullName || 'Unknown')}
                                      </p>
                                      {!isAdminMessage && (
                                        <p className="text-[10px] text-muted-foreground">{otherProfile?.profileId || otherProfileId}</p>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                      {new Date(msg.timestamp || msg.createdAt).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')}
                                    </p>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-1">{msg.message}</p>
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

      {/* Decline Confirmation Dialog */}
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

      {/* Block Confirmation Dialog */}
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

      {/* View Contact Dialog */}
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
                    {viewContactProfile.age} {t.years} • {viewContactProfile.location}
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

      {/* Boost Pack Purchase Dialog */}
      <Dialog open={showBoostPackDialog} onOpenChange={setShowBoostPackDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket size={24} className="text-purple-500" weight="fill" />
              {t.boostPack}
            </DialogTitle>
            <DialogDescription>
              {t.boostPackDescription}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Boost pack contents */}
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg space-y-2">
              <h4 className="font-medium text-sm text-purple-700 dark:text-purple-300">{t.boostPackIncludes}:</h4>
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-pink-500" weight="fill" />
                <span className="text-sm">{boostPackInterestLimit} {t.interests}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-teal-500" weight="fill" />
                <span className="text-sm">{boostPackContactLimit} {t.contacts}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center gap-2 text-lg font-bold text-purple-700 dark:text-purple-300">
                <CurrencyInr size={20} weight="bold" />
                <span>₹{boostPackPrice}</span>
              </div>
            </div>

            {/* Payment info */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t.paymentInstructions}</p>
              {upiId && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <span className="text-xs font-medium">UPI:</span>
                  <span className="text-xs font-mono">{upiId}</span>
                </div>
              )}
              {qrCodeImage && (
                <div className="flex justify-center">
                  <img src={qrCodeImage} alt="Payment QR" className="w-32 h-32 object-contain" />
                </div>
              )}
            </div>

            {/* Screenshot upload */}
            <div className="space-y-2">
              <Label htmlFor="boost-screenshot" className="text-sm font-medium">
                {t.uploadPaymentScreenshot}
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="boost-screenshot"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setBoostPackScreenshot(reader.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('boost-screenshot')?.click()}
                  className="flex-1"
                >
                  <UploadSimple size={16} className="mr-2" />
                  {boostPackScreenshot ? (language === 'hi' ? 'स्क्रीनशॉट बदलें' : 'Change Screenshot') : t.uploadPaymentScreenshot}
                </Button>
              </div>
              {boostPackScreenshot && (
                <div className="mt-2">
                  <img src={boostPackScreenshot} alt="Payment screenshot" className="w-full max-h-40 object-contain rounded border" />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBoostPackDialog(false)}>
              {t.cancel}
            </Button>
            <Button 
              onClick={handleBoostPackSubmit}
              disabled={!boostPackScreenshot || isSubmittingBoostPack}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmittingBoostPack ? (
                language === 'hi' ? 'जमा हो रहा है...' : 'Submitting...'
              ) : (
                t.submitForVerification
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
