import { useState, useEffect } from 'react'
import { useKV } from '@/hooks/useKV'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ShieldCheck, X, Check, Checks, Info, ChatCircle, ProhibitInset, Robot, PaperPlaneTilt, Eye, Database, Key, Storefront, Plus, Trash, Pencil, ScanSmiley, CheckCircle, XCircle, Spinner, CurrencyInr, Calendar, Percent, Bell, CaretDown, CaretUp, CaretLeft, CaretRight, MapPin, Globe, NavigationArrow, ArrowCounterClockwise, Receipt, FilePdf, ShareNetwork, Envelope, CurrencyCircleDollar, ChartLine, DownloadSimple, Printer, IdentificationCard, User as UserIcon, CreditCard, Upload, ShieldWarning, Prohibit, Warning } from '@phosphor-icons/react'
import type { Profile, WeddingService, PaymentTransaction, BlockedProfile, ReportReason } from '@/types/profile'
import type { User } from '@/types/user'
import type { ChatMessage } from '@/types/chat'
import { Chat } from '@/components/Chat'
import { ProfileDetailDialog } from '@/components/ProfileDetailDialog'
import { PhotoLightbox, useLightbox } from '@/components/PhotoLightbox'
import { RegistrationDialog } from '@/components/RegistrationDialog'
import { toast } from 'sonner'
import { formatDateDDMMYYYY } from '@/lib/utils'
import { verifyPhotosWithVision, type PhotoVerificationResult } from '@/lib/visionPhotoVerification'

interface AdminPanelProps {
  profiles: Profile[] | undefined
  setProfiles: (newValue: Profile[] | ((oldValue?: Profile[] | undefined) => Profile[])) => void
  users: User[] | undefined
  language: 'hi' | 'en'
  onLogout?: () => void
  onLoginAsUser?: (userId: string) => void
}

// Helper function to normalize country names for comparison
// Handles multi-language names (e.g., भारत = India, भारत गणराज्य = Republic of India)
const normalizeCountryName = (country: string): string => {
  const normalized = country.toLowerCase().trim()
  
  // Map of country name variations to their canonical English name
  const countryMappings: Record<string, string> = {
    // India variations
    'india': 'india',
    'भारत': 'india',
    'bharat': 'india',
    'bharath': 'india',
    'hindustan': 'india',
    'हिंदुस्तान': 'india',
    'भारत गणराज्य': 'india',
    'republic of india': 'india',
    // USA variations
    'usa': 'usa',
    'united states': 'usa',
    'united states of america': 'usa',
    'america': 'usa',
    'अमेरिका': 'usa',
    'संयुक्त राज्य अमेरिका': 'usa',
    // UK variations
    'uk': 'uk',
    'united kingdom': 'uk',
    'britain': 'uk',
    'great britain': 'uk',
    'england': 'uk',
    'ब्रिटेन': 'uk',
    'इंग्लैंड': 'uk',
    // Canada variations
    'canada': 'canada',
    'कनाडा': 'canada',
    // Australia variations
    'australia': 'australia',
    'ऑस्ट्रेलिया': 'australia',
    // UAE variations
    'uae': 'uae',
    'united arab emirates': 'uae',
    'संयुक्त अरब अमीरात': 'uae',
    // Pakistan variations
    'pakistan': 'pakistan',
    'पाकिस्तान': 'pakistan',
    // Nepal variations
    'nepal': 'nepal',
    'नेपाल': 'nepal',
    // Bangladesh variations
    'bangladesh': 'bangladesh',
    'बांग्लादेश': 'bangladesh',
  }
  
  return countryMappings[normalized] || normalized
}

// Check if two country names refer to the same country
const isSameCountry = (country1: string, country2: string): boolean => {
  return normalizeCountryName(country1) === normalizeCountryName(country2)
}

interface BlockedContact {
  email?: string
  mobile?: string
  blockedAt: string
  reason: string
}

interface MembershipSettings {
  sixMonthPrice: number
  oneYearPrice: number
  sixMonthDuration: number
  oneYearDuration: number
  discountPercentage: number
  discountEnabled: boolean
  discountEndDate: string
  // Plan-specific limits
  freePlanChatLimit: number       // Free plan: chat request limit
  freePlanContactLimit: number    // Free plan: contact view limit (0 = none)
  sixMonthChatLimit: number       // 6-month plan: chat request limit
  sixMonthContactLimit: number    // 6-month plan: contact view limit
  oneYearChatLimit: number        // 1-year plan: chat request limit
  oneYearContactLimit: number     // 1-year plan: contact view limit
  // Payment details
  upiId: string                   // UPI ID for payments
  bankName: string                // Bank name
  accountNumber: string           // Bank account number
  ifscCode: string                // IFSC code
  accountHolderName: string       // Account holder name
  qrCodeImage: string             // QR code image URL/base64
}

export function AdminPanel({ profiles, setProfiles, users, language, onLogout, onLoginAsUser }: AdminPanelProps) {
  const [_blockedContacts, setBlockedContacts] = useKV<BlockedContact[]>('blockedContacts', [])
  const [blockedProfiles, setBlockedProfiles] = useKV<BlockedProfile[]>('blockedProfiles', [])
  const [messages, setMessages] = useKV<ChatMessage[]>('chatMessages', [])
  const [weddingServices, setWeddingServices] = useKV<WeddingService[]>('weddingServices', [])
  const [membershipSettings, setMembershipSettings] = useKV<MembershipSettings>('membershipSettings', {
    sixMonthPrice: 500,
    oneYearPrice: 900,
    sixMonthDuration: 6,
    oneYearDuration: 12,
    discountPercentage: 0,
    discountEnabled: false,
    discountEndDate: '',
    // Default plan limits
    freePlanChatLimit: 5,
    freePlanContactLimit: 0,
    sixMonthChatLimit: 50,
    sixMonthContactLimit: 20,
    oneYearChatLimit: 120,
    oneYearContactLimit: 50,
    // Default payment details
    upiId: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    qrCodeImage: ''
  })
  
  // Local state for editing membership settings (only saved to Azure on Save click)
  const [localMembershipSettings, setLocalMembershipSettings] = useState<MembershipSettings>({
    sixMonthPrice: 500,
    oneYearPrice: 900,
    sixMonthDuration: 6,
    oneYearDuration: 12,
    discountPercentage: 0,
    discountEnabled: false,
    discountEndDate: '',
    freePlanChatLimit: 5,
    freePlanContactLimit: 0,
    sixMonthChatLimit: 50,
    sixMonthContactLimit: 20,
    oneYearChatLimit: 120,
    oneYearContactLimit: 50,
    upiId: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    qrCodeImage: ''
  })
  
  // Sync local state when membershipSettings loads from Azure
  useEffect(() => {
    if (membershipSettings) {
      setLocalMembershipSettings(membershipSettings)
    }
  }, [membershipSettings])
  
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])
  const [selectedDatabaseProfiles, setSelectedDatabaseProfiles] = useState<string[]>([])
  const [_sortBy, _setSortBy] = useState<'name' | 'date' | 'expiry'>('date')
  const [_sortOrder, _setSortOrder] = useState<'asc' | 'desc'>('desc')
  // All Database table sorting
  const [dbSortBy, setDbSortBy] = useState<'profileId' | 'name' | 'gender' | 'plan' | 'userId' | 'relation' | 'age' | 'location' | 'status' | 'email' | 'mobile' | 'createdAt'>('createdAt')
  const [dbSortOrder, setDbSortOrder] = useState<'asc' | 'desc'>('desc')
  // Database tab filter: all, approved, pending, rejected, deleted
  const [dbStatusFilter, setDbStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'deleted'>('all')
  
  // Pagination state for all tabs
  const ITEMS_PER_PAGE = 10
  const [pendingPage, setPendingPage] = useState(1)
  const [databasePage, setDatabasePage] = useState(1)
  const [reportsPage, setReportsPage] = useState(1)
  const [_accountsPage, _setAccountsPage] = useState(1)
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [servicesPage, setServicesPage] = useState(1)
  
  const [chatMessage, setChatMessage] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [showChatDialog, setShowChatDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [editingService, setEditingService] = useState<WeddingService | null>(null)
  const [viewProfileDialog, setViewProfileDialog] = useState<Profile | null>(null)
  const [faceVerificationDialog, setFaceVerificationDialog] = useState<Profile | null>(null)
  const [faceVerificationResult, setFaceVerificationResult] = useState<PhotoVerificationResult | null>(null)
  const [isVerifyingFace, setIsVerifyingFace] = useState(false)
  const [editMembershipDialog, setEditMembershipDialog] = useState<Profile | null>(null)
  const [returnToEditDialog, setReturnToEditDialog] = useState<Profile | null>(null)
  const [returnToEditReason, setReturnToEditReason] = useState('')
  const [membershipEditData, setMembershipEditData] = useState<{plan: string, customAmount: number, discountAmount: number, expiryDate: string}>({
    plan: '',
    customAmount: 0,
    discountAmount: 0,
    expiryDate: ''
  })
  const [serviceFormData, setServiceFormData] = useState<Partial<WeddingService>>({
    category: 'venue',
    verificationStatus: 'verified',
    consultationFee: 200
  })
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastProfiles, setBroadcastProfiles] = useState<string[]>([])
  // Rejection with notification dialog state
  const [showRejectDialog, setShowRejectDialog] = useState<Profile | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [sendRejectionNotification, setSendRejectionNotification] = useState(true)
  const { lightboxState, openLightbox, closeLightbox } = useLightbox()
  
  // Payment & Accounts state
  const [paymentTransactions, setPaymentTransactions] = useKV<PaymentTransaction[]>('paymentTransactions', [])
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null)
  const [showPaymentFormDialog, setShowPaymentFormDialog] = useState(false)
  const [paymentFormData, setPaymentFormData] = useState<{
    transactionId: string
    profileId: string
    plan: string
    amount: number
    discountAmount: number
    paymentMode: string
    paymentDate: string
    notes: string
  }>({
    transactionId: '',
    profileId: '',
    plan: '6-month',
    amount: 0,
    discountAmount: 0,
    paymentMode: 'upi',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [refundFormData, setRefundFormData] = useState<{
    refundAmount: number
    refundReason: string
    refundTransactionId: string
  }>({
    refundAmount: 0,
    refundReason: '',
    refundTransactionId: ''
  })
  const [showDigilockerDialog, setShowDigilockerDialog] = useState(false)
  const [digilockerProfile, setDigilockerProfile] = useState<Profile | null>(null)
  const [digilockerFormData, setDigilockerFormData] = useState<{
    documentType: 'aadhaar' | 'pan' | 'driving-license' | 'passport'
    notes: string
  }>({
    documentType: 'aadhaar',
    notes: ''
  })
  // ID Proof viewing dialog state
  const [showIdProofViewDialog, setShowIdProofViewDialog] = useState(false)
  const [idProofViewProfile, setIdProofViewProfile] = useState<Profile | null>(null)
  const [idProofRejectionReason, setIdProofRejectionReason] = useState('')
  const [showIdProofRejectDialog, setShowIdProofRejectDialog] = useState(false)
  
  // Payment Screenshot viewing dialog state
  const [showPaymentViewDialog, setShowPaymentViewDialog] = useState(false)
  const [paymentViewProfile, setPaymentViewProfile] = useState<Profile | null>(null)
  const [paymentRejectionReason, setPaymentRejectionReason] = useState('')
  
  // Admin Edit Profile dialog state (uses RegistrationDialog with isAdminMode)
  const [adminEditDialog, setAdminEditDialog] = useState<Profile | null>(null)
  
  // Report review state
  const [showChatHistoryDialog, setShowChatHistoryDialog] = useState(false)
  const [chatHistoryParticipants, setChatHistoryParticipants] = useState<{ reporter: string, reported: string } | null>(null)
  
  // View rejection reason dialog state
  const [showRejectionReasonDialog, setShowRejectionReasonDialog] = useState<Profile | null>(null)
  
  // Bulk rejection with reason dialog state
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState<{ ids: string[], source: 'pending' | 'database' } | null>(null)
  const [bulkRejectReason, setBulkRejectReason] = useState('')
  
  // Delete transaction confirmation dialog state
  const [showDeleteTransactionDialog, setShowDeleteTransactionDialog] = useState<PaymentTransaction | null>(null)
  
  const t = {
    title: language === 'hi' ? 'प्रशासन पैनल' : 'Admin Panel',
    description: language === 'hi' ? 'प्रोफाइल सत्यापन और प्रबंधन' : 'Profile verification and management',
    pendingProfiles: language === 'hi' ? 'लंबित प्रोफाइल' : 'Pending Profiles',
    approvedProfiles: language === 'hi' ? 'स्वीकृत प्रोफाइल' : 'Approved Profiles',
    allDatabase: language === 'hi' ? 'पूरा डेटाबेस' : 'All Database',
    loginCredentials: language === 'hi' ? 'लॉगिन विवरण' : 'Login Credentials',
    adminChat: language === 'hi' ? 'एडमिन चैट' : 'Admin Chat',
    weddingServices: language === 'hi' ? 'विवाह सेवाएं' : 'Wedding Services',
    noPending: language === 'hi' ? 'कोई लंबित प्रोफाइल नहीं।' : 'No pending profiles.',
    noApproved: language === 'hi' ? 'कोई स्वीकृत प्रोफाइल नहीं।' : 'No approved profiles.',
    approve: language === 'hi' ? 'स्वीकृत करें' : 'Approve',
    reject: language === 'hi' ? 'अस्वीकृत करें' : 'Reject',
    block: language === 'hi' ? 'ब्लॉक करें' : 'Block',
    unblock: language === 'hi' ? 'अनब्लॉक करें' : 'Unblock',
    hold: language === 'hi' ? 'होल्ड पर रखें' : 'Hold',
    chat: language === 'hi' ? 'चैट करें' : 'Chat',
    aiReview: language === 'hi' ? 'AI समीक्षा' : 'AI Review',
    viewDetails: language === 'hi' ? 'विवरण देखें' : 'View Details',
    viewProfile: language === 'hi' ? 'प्रोफाइल देखें' : 'View Profile',
    pending: language === 'hi' ? 'लंबित' : 'Pending',
    verified: language === 'hi' ? 'सत्यापित' : 'Verified',
    rejected: language === 'hi' ? 'अस्वीकृत' : 'Rejected',
    blocked: language === 'hi' ? 'ब्लॉक' : 'Blocked',
    age: language === 'hi' ? 'आयु' : 'Age',
    location: language === 'hi' ? 'स्थान' : 'Location',
    education: language === 'hi' ? 'शिक्षा' : 'Education',
    occupation: language === 'hi' ? 'व्यवसाय' : 'Occupation',
    profileId: language === 'hi' ? 'प्रोफाइल ID' : 'Profile ID',
    userId: language === 'hi' ? 'यूज़र ID' : 'User ID',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    gender: language === 'hi' ? 'लिंग' : 'Gender',
    planType: language === 'hi' ? 'प्लान' : 'Plan',
    male: language === 'hi' ? 'पुरुष' : 'Male',
    female: language === 'hi' ? 'महिला' : 'Female',
    freePlanLabel: language === 'hi' ? 'मुफ्त' : 'Free',
    sixMonthPlanLabel: language === 'hi' ? '6 माह' : '6 Month',
    oneYearPlanLabel: language === 'hi' ? '1 वर्ष' : '1 Year',
    email: language === 'hi' ? 'ईमेल' : 'Email',
    mobile: language === 'hi' ? 'मोबाइल' : 'Mobile',
    name: language === 'hi' ? 'नाम' : 'Name',
    relation: language === 'hi' ? 'रिश्ता' : 'Relation',
    status: language === 'hi' ? 'स्थिति' : 'Status',
    actions: language === 'hi' ? 'कार्रवाई' : 'Actions',
    approveSuccess: language === 'hi' ? 'प्रोफाइल स्वीकृत की गई!' : 'Profile approved!',
    rejectSuccess: language === 'hi' ? 'प्रोफाइल अस्वीकृत की गई!' : 'Profile rejected!',
    blockSuccess: language === 'hi' ? 'प्रोफाइल ब्लॉक की गई!' : 'Profile blocked!',
    unblockSuccess: language === 'hi' ? 'प्रोफाइल अनब्लॉक की गई!' : 'Profile unblocked!',
    moveToPending: language === 'hi' ? 'पेंडिंग में ले जाएं' : 'Move to Pending',
    movedToPending: language === 'hi' ? 'प्रोफाइल पेंडिंग में ले जाया गया!' : 'Profile moved to pending!',
    returnToEdit: language === 'hi' ? 'संपादन के लिए वापस करें' : 'Return to Edit',
    returnToEditDesc: language === 'hi' ? 'इस प्रोफाइल को उपयोगकर्ता को संपादन के लिए वापस भेजें' : 'Send this profile back to user for editing',
    editReasonLabel: language === 'hi' ? 'संपादन का कारण' : 'Reason for Edit',
    editReasonPlaceholder: language === 'hi' ? 'उपयोगकर्ता को बताएं कि क्या संपादित/पूर्ण करना है...' : 'Tell user what to edit/complete...',
    sendForEdit: language === 'hi' ? 'संपादन के लिए भेजें' : 'Send for Edit',
    profileReturnedForEdit: language === 'hi' ? 'प्रोफाइल संपादन के लिए वापस भेजी गई!' : 'Profile sent back for editing!',
    adminEditProfile: language === 'hi' ? 'एडमिन द्वारा संपादित करें' : 'Admin Edit Profile',
    adminEditDesc: language === 'hi' ? 'उपयोगकर्ता की प्रोफाइल को सीधे संपादित करें (नाम, DOB, ईमेल, मोबाइल सहित)' : 'Directly edit user profile (including Name, DOB, Email, Mobile)',
    saveChanges: language === 'hi' ? 'बदलाव सहेजें' : 'Save Changes',
    profileUpdated: language === 'hi' ? 'प्रोफाइल अपडेट की गई!' : 'Profile updated!',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    messageSent: language === 'hi' ? 'संदेश भेजा गया!' : 'Message sent!',
    sendMessage: language === 'hi' ? 'संदेश भेजें' : 'Send Message',
    typeMessage: language === 'hi' ? 'संदेश टाइप करें...' : 'Type message...',
    aiSuggestions: language === 'hi' ? 'AI सुझाव' : 'AI Suggestions',
    getAISuggestions: language === 'hi' ? 'AI सुझाव प्राप्त करें' : 'Get AI Suggestions',
    close: language === 'hi' ? 'बंद करें' : 'Close',
    loading: language === 'hi' ? 'लोड हो रहा है...' : 'Loading...',
    createdAt: language === 'hi' ? 'बनाया गया' : 'Created At',
    verifiedAt: language === 'hi' ? 'सत्यापित' : 'Verified At',
    addService: language === 'hi' ? 'सेवा जोड़ें' : 'Add Service',
    editService: language === 'hi' ? 'सेवा संपादित करें' : 'Edit Service',
    deleteService: language === 'hi' ? 'सेवा हटाएं' : 'Delete Service',
    save: language === 'hi' ? 'सहेजें' : 'Save',
    businessName: language === 'hi' ? 'व्यवसाय का नाम' : 'Business Name',
    contactPerson: language === 'hi' ? 'संपर्क व्यक्ति' : 'Contact Person',
    category: language === 'hi' ? 'श्रेणी' : 'Category',
    address: language === 'hi' ? 'पता' : 'Address',
    city: language === 'hi' ? 'शहर' : 'City',
    state: language === 'hi' ? 'राज्य' : 'State',
    serviceDescription: language === 'hi' ? 'विवरण' : 'Description',
    priceRange: language === 'hi' ? 'मूल्य सीमा' : 'Price Range',
    consultationFee: language === 'hi' ? 'परामर्श शुल्क' : 'Consultation Fee',
    verifyFace: language === 'hi' ? 'चेहरा सत्यापित करें' : 'Verify Face',
    faceVerification: language === 'hi' ? 'चेहरा सत्यापन' : 'Face Verification',
    selfieImage: language === 'hi' ? 'सेल्फी छवि' : 'Selfie Image',
    uploadedPhotos: language === 'hi' ? 'अपलोड की गई तस्वीरें' : 'Uploaded Photos',
    verifying: language === 'hi' ? 'सत्यापित हो रहा है...' : 'Verifying...',
    verifyWithAI: language === 'hi' ? 'AI से सत्यापित करें' : 'Verify with AI',
    noSelfie: language === 'hi' ? 'कोई सेल्फी नहीं' : 'No Selfie',
    noPhotos: language === 'hi' ? 'कोई फोटो नहीं' : 'No Photos',
    // Registration location translations
    registrationLocation: language === 'hi' ? 'पंजीकरण स्थान' : 'Registration Location',
    capturedLocation: language === 'hi' ? 'कैप्चर किया गया स्थान' : 'Captured Location',
    coordinates: language === 'hi' ? 'निर्देशांक' : 'Coordinates',
    accuracy: language === 'hi' ? 'सटीकता' : 'Accuracy',
    locationNotCaptured: language === 'hi' ? 'स्थान कैप्चर नहीं हुआ' : 'Location not captured',
    viewOnMap: language === 'hi' ? 'मानचित्र पर देखें' : 'View on Map',
    // Membership translations
    membershipSettings: language === 'hi' ? 'सदस्यता सेटिंग्स' : 'Membership Settings',
    sixMonthPlan: language === 'hi' ? '6 महीने का प्लान' : '6 Month Plan',
    oneYearPlan: language === 'hi' ? '1 साल का प्लान' : '1 Year Plan',
    price: language === 'hi' ? 'मूल्य' : 'Price',
    duration: language === 'hi' ? 'अवधि (महीने)' : 'Duration (months)',
    discount: language === 'hi' ? 'छूट' : 'Discount',
    discountPercentage: language === 'hi' ? 'छूट प्रतिशत' : 'Discount Percentage',
    enableDiscount: language === 'hi' ? 'छूट सक्षम करें' : 'Enable Discount',
    discountEndDate: language === 'hi' ? 'छूट समाप्ति तिथि' : 'Discount End Date',
    editMembership: language === 'hi' ? 'सदस्यता संपादित करें' : 'Edit Membership',
    customAmount: language === 'hi' ? 'कस्टम राशि' : 'Custom Amount',
    discountAmount: language === 'hi' ? 'छूट राशि' : 'Discount Amount',
    expiryDate: language === 'hi' ? 'समाप्ति तिथि' : 'Expiry Date',
    membershipPlan: language === 'hi' ? 'सदस्यता प्लान' : 'Membership Plan',
    membershipExpiry: language === 'hi' ? 'सदस्यता समाप्ति' : 'Membership Expiry',
    freePlan: language === 'hi' ? 'मुफ्त प्लान' : 'Free Plan',
    expiringProfiles: language === 'hi' ? 'समाप्त होने वाली प्रोफाइल' : 'Expiring Profiles',
    expiringIn7Days: language === 'hi' ? '7 दिनों में समाप्त' : 'Expiring in 7 days',
    expiringIn30Days: language === 'hi' ? '30 दिनों में समाप्त' : 'Expiring in 30 days',
    expired: language === 'hi' ? 'समाप्त' : 'Expired',
    selectAll: language === 'hi' ? 'सभी चुनें' : 'Select All',
    bulkApprove: language === 'hi' ? 'एकसाथ स्वीकृत करें' : 'Bulk Approve',
    bulkReject: language === 'hi' ? 'अस्वीकृत करें' : 'Reject',
    enterRejectionReason: language === 'hi' ? 'अस्वीकृति का कारण दर्ज करें' : 'Enter Rejection Reason',
    rejectionReasonPlaceholder: language === 'hi' ? 'प्रोफाइल अस्वीकृत करने का कारण बताएं...' : 'Enter reason for rejecting the profile(s)...',
    confirmReject: language === 'hi' ? 'अस्वीकृत करें' : 'Confirm Reject',
    sortByName: language === 'hi' ? 'नाम से क्रमबद्ध करें' : 'Sort by Name',
    sortByDate: language === 'hi' ? 'तिथि से क्रमबद्ध करें' : 'Sort by Date',
    sortByExpiry: language === 'hi' ? 'समाप्ति से क्रमबद्ध करें' : 'Sort by Expiry',
    updateSettings: language === 'hi' ? 'सेटिंग्स अपडेट करें' : 'Update Settings',
    settingsUpdated: language === 'hi' ? 'सेटिंग्स अपडेट हो गईं!' : 'Settings updated!',
    membershipUpdated: language === 'hi' ? 'सदस्यता अपडेट हो गई!' : 'Membership updated!',
    deleteProfile: language === 'hi' ? 'प्रोफाइल हटाएं' : 'Delete Profile',
    deleteConfirm: language === 'hi' ? 'क्या आप वाकई इस प्रोफाइल को हटाना चाहते हैं?' : 'Are you sure you want to delete this profile?',
    deleteSuccess: language === 'hi' ? 'प्रोफाइल हटा दी गई!' : 'Profile deleted!',
    broadcastMessage: language === 'hi' ? 'संदेश प्रसारित करें' : 'Broadcast Message',
    selectProfilesToMessage: language === 'hi' ? 'संदेश भेजने के लिए प्रोफाइल चुनें' : 'Select profiles to message',
    broadcastSuccess: language === 'hi' ? 'संदेश सभी चयनित प्रोफाइलों को भेजा गया!' : 'Message sent to all selected profiles!',
    deletedProfiles: language === 'hi' ? 'हटाई गई प्रोफाइल' : 'Deleted Profiles',
    noDeletedProfiles: language === 'hi' ? 'कोई हटाई गई प्रोफाइल नहीं।' : 'No deleted profiles.',
    deletedAt: language === 'hi' ? 'हटाने की तिथि' : 'Deleted At',
    deletedBy: language === 'hi' ? 'हटाने का कारण' : 'Reason',
    restoreProfile: language === 'hi' ? 'प्रोफाइल पुनर्स्थापित करें' : 'Restore Profile',
    restoreSuccess: language === 'hi' ? 'प्रोफाइल पुनर्स्थापित!' : 'Profile restored!',
    permanentDelete: language === 'hi' ? 'स्थायी रूप से हटाएं' : 'Permanently Delete',
    permanentDeleteConfirm: language === 'hi' ? 'क्या आप इस प्रोफाइल को स्थायी रूप से हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती।' : 'Are you sure you want to permanently delete this profile? This action cannot be undone.',
    permanentDeleteSuccess: language === 'hi' ? 'प्रोफाइल स्थायी रूप से हटा दी गई!' : 'Profile permanently deleted!',
    // Rejection notification
    rejectionReason: language === 'hi' ? 'अस्वीकृति का कारण' : 'Rejection Reason',
    sendNotification: language === 'hi' ? 'SMS और ईमेल सूचना भेजें' : 'Send SMS & Email Notification',
    notificationSent: language === 'hi' ? 'SMS और ईमेल सूचना भेजी गई!' : 'SMS and Email notification sent!',
    // Rejection details view
    viewRejectionReason: language === 'hi' ? 'अस्वीकृति का कारण देखें' : 'View Rejection Reason',
    rejectionDetails: language === 'hi' ? 'अस्वीकृति विवरण' : 'Rejection Details',
    noRejectionReason: language === 'hi' ? 'कोई कारण दर्ज नहीं किया गया' : 'No reason provided',
    rejectedOn: language === 'hi' ? 'अस्वीकृत' : 'Rejected on',
    undoRejection: language === 'hi' ? 'अस्वीकृति रद्द करें' : 'Undo Rejection',
    undoRejectionSuccess: language === 'hi' ? 'प्रोफाइल को पेंडिंग में वापस ले जाया गया!' : 'Profile moved back to pending!',
    // Accounts & Payments
    accounts: language === 'hi' ? 'खाते' : 'Accounts',
    accountsDescription: language === 'hi' ? 'भुगतान प्रबंधन और रसीद जनरेशन' : 'Payment management and receipt generation',
    totalRevenue: language === 'hi' ? 'कुल राजस्व' : 'Total Revenue',
    thisMonth: language === 'hi' ? 'इस महीने' : 'This Month',
    thisYear: language === 'hi' ? 'इस साल' : 'This Year',
    allTime: language === 'hi' ? 'सभी समय' : 'All Time',
    recordPayment: language === 'hi' ? 'भुगतान दर्ज करें' : 'Record Payment',
    transactionId: language === 'hi' ? 'लेन-देन ID' : 'Transaction ID',
    paymentMode: language === 'hi' ? 'भुगतान मोड' : 'Payment Mode',
    paymentDate: language === 'hi' ? 'भुगतान तिथि' : 'Payment Date',
    generateReceipt: language === 'hi' ? 'रसीद बनाएं' : 'Generate Receipt',
    downloadReceipt: language === 'hi' ? 'रसीद डाउनलोड करें' : 'Download Receipt',
    shareReceipt: language === 'hi' ? 'रसीद साझा करें' : 'Share Receipt',
    emailReceipt: language === 'hi' ? 'ईमेल से भेजें' : 'Email Receipt',
    printReceipt: language === 'hi' ? 'प्रिंट करें' : 'Print Receipt',
    receiptNumber: language === 'hi' ? 'रसीद नंबर' : 'Receipt No',
    paymentReceipt: language === 'hi' ? 'भुगतान रसीद' : 'Payment Receipt',
    noTransactions: language === 'hi' ? 'कोई लेन-देन नहीं।' : 'No transactions.',
    paymentRecorded: language === 'hi' ? 'भुगतान दर्ज हो गया!' : 'Payment recorded!',
    recentTransactions: language === 'hi' ? 'हाल के लेन-देन' : 'Recent Transactions',
    viewReceipt: language === 'hi' ? 'रसीद देखें' : 'View Receipt',
    originalAmount: language === 'hi' ? 'मूल राशि' : 'Original Amount',
    finalAmount: language === 'hi' ? 'अंतिम राशि' : 'Final Amount',
    selectProfile: language === 'hi' ? 'प्रोफाइल चुनें' : 'Select Profile',
    cash: language === 'hi' ? 'नकद' : 'Cash',
    upi: language === 'hi' ? 'यूपीआई' : 'UPI',
    card: language === 'hi' ? 'कार्ड' : 'Card',
    netbanking: language === 'hi' ? 'नेट बैंकिंग' : 'Net Banking',
    cheque: language === 'hi' ? 'चेक' : 'Cheque',
    other: language === 'hi' ? 'अन्य' : 'Other',
    freeMembers: language === 'hi' ? 'मुफ्त सदस्य' : 'Free Members',
    paidMembers: language === 'hi' ? 'पेड सदस्य' : 'Paid Members',
    // Refund
    refund: language === 'hi' ? 'रिफंड' : 'Refund',
    processRefund: language === 'hi' ? 'रिफंड प्रोसेस करें' : 'Process Refund',
    refundAmount: language === 'hi' ? 'रिफंड राशि' : 'Refund Amount',
    refundReason: language === 'hi' ? 'रिफंड कारण' : 'Refund Reason',
    refundTransactionId: language === 'hi' ? 'रिफंड ट्रांजेक्शन ID' : 'Refund Transaction ID',
    refundProcessed: language === 'hi' ? 'रिफंड प्रोसेस हो गया!' : 'Refund processed!',
    refunded: language === 'hi' ? 'रिफंड किया गया' : 'Refunded',
    totalRefunds: language === 'hi' ? 'कुल रिफंड' : 'Total Refunds',
    netRevenue: language === 'hi' ? 'शुद्ध राजस्व' : 'Net Revenue',
    // ID Verification
    digilockerVerification: language === 'hi' ? 'पहचान सत्यापन' : 'ID Verification',
    digilockerVerify: language === 'hi' ? 'पहचान सत्यापित करें' : 'Verify ID',
    digilockerVerified: language === 'hi' ? 'सत्यापित' : 'Verified',
    digilockerNotVerified: language === 'hi' ? 'सत्यापित नहीं' : 'Not Verified',
    digilockerDocType: language === 'hi' ? 'दस्तावेज़ प्रकार' : 'Document Type',
    aadhaar: language === 'hi' ? 'आधार' : 'Aadhaar',
    pan: language === 'hi' ? 'पैन कार्ड' : 'PAN Card',
    drivingLicense: language === 'hi' ? 'ड्राइविंग लाइसेंस' : 'Driving License',
    passport: language === 'hi' ? 'पासपोर्ट' : 'Passport',
    verificationNotes: language === 'hi' ? 'सत्यापन नोट्स' : 'Verification Notes',
    markAsVerified: language === 'hi' ? 'सत्यापित के रूप में चिह्नित करें' : 'Mark as Verified',
    removeVerification: language === 'hi' ? 'सत्यापन हटाएं' : 'Remove Verification',
    markFaceVerified: language === 'hi' ? 'चेहरा सत्यापित चिह्नित करें' : 'Mark Face Verified',
    markFaceNotVerified: language === 'hi' ? 'चेहरा असत्यापित चिह्नित करें' : 'Mark Face Not Verified',
    faceVerifiedSuccess: language === 'hi' ? 'चेहरा सत्यापित के रूप में चिह्नित!' : 'Marked as Face Verified!',
    faceNotVerifiedSuccess: language === 'hi' ? 'चेहरा असत्यापित के रूप में चिह्नित!' : 'Marked as Face Not Verified!',
    photoVerifiedBadge: language === 'hi' ? 'फोटो सत्यापित' : 'Photo Verified',
    photoNotVerified: language === 'hi' ? 'फोटो असत्यापित' : 'Photo Not Verified',
    digilockerVerifySuccess: language === 'hi' ? 'पहचान सत्यापित!' : 'ID Verified!',
    digilockerVerifyRemoved: language === 'hi' ? 'सत्यापन हटाया गया!' : 'Verification removed!',
    idProofVerification: language === 'hi' ? 'पहचान प्रमाण सत्यापन' : 'ID Proof Verification',
    verifyIdProof: language === 'hi' ? 'पहचान सत्यापित करें' : 'Verify ID Proof',
    loginAsUser: language === 'hi' ? 'इस यूजर के रूप में लॉगिन करें' : 'Login as this user',
    loginAsUserConfirm: language === 'hi' ? 'क्या आप इस यूजर के रूप में लॉगिन करना चाहते हैं? आप एडमिन पैनल से बाहर हो जाएंगे।' : 'Do you want to login as this user? You will be logged out of admin panel.',
    loginAsUserSuccess: language === 'hi' ? 'यूजर के रूप में लॉगिन हो गया' : 'Logged in as user',
    viewIdProof: language === 'hi' ? 'पहचान प्रमाण देखें' : 'View ID Proof',
    idProofNotUploaded: language === 'hi' ? 'पहचान प्रमाण अपलोड नहीं किया गया' : 'ID Proof not uploaded',
    idProofType: language === 'hi' ? 'दस्तावेज़ का प्रकार' : 'Document Type',
    voterId: language === 'hi' ? 'मतदाता पहचान पत्र' : 'Voter ID',
    markAsNotVerified: language === 'hi' ? 'असत्यापित के रूप में चिह्नित करें' : 'Mark as Not Verified',
    idProofRejectionReason: language === 'hi' ? 'अस्वीकृति का कारण' : 'Rejection Reason',
    idProofRejected: language === 'hi' ? 'ID प्रमाण अस्वीकृत!' : 'ID Proof rejected!',
    idProofRejectionReasonPlaceholder: language === 'hi' ? 'कृपया ID प्रमाण अस्वीकृत करने का कारण दर्ज करें...' : 'Please enter the reason for rejecting ID proof...',
    rejectIdProof: language === 'hi' ? 'ID प्रमाण अस्वीकृत करें' : 'Reject ID Proof',
    idProofRejectedStatus: language === 'hi' ? 'अस्वीकृत' : 'Rejected',
    // Reports tab translations
    reports: language === 'hi' ? 'रिपोर्ट्स' : 'Reports',
    reportedUsers: language === 'hi' ? 'रिपोर्ट किए गए उपयोगकर्ता' : 'Reported Users',
    noReports: language === 'hi' ? 'कोई रिपोर्ट नहीं।' : 'No reports.',
    reporter: language === 'hi' ? 'रिपोर्टर' : 'Reporter',
    reported: language === 'hi' ? 'रिपोर्ट किया गया' : 'Reported',
    reportReason: language === 'hi' ? 'कारण' : 'Reason',
    reportDescription: language === 'hi' ? 'विवरण' : 'Description',
    reportDate: language === 'hi' ? 'रिपोर्ट तिथि' : 'Report Date',
    adminAction: language === 'hi' ? 'कार्रवाई' : 'Action',
    viewChatHistory: language === 'hi' ? 'चैट इतिहास देखें' : 'View Chat History',
    dismissReport: language === 'hi' ? 'रिपोर्ट खारिज करें' : 'Dismiss Report',
    warnUser: language === 'hi' ? 'उपयोगकर्ता को चेतावनी दें' : 'Warn User',
    removeProfile: language === 'hi' ? 'प्रोफाइल हटाएं' : 'Remove Profile',
    reportDismissed: language === 'hi' ? 'रिपोर्ट खारिज की गई' : 'Report dismissed',
    userWarned: language === 'hi' ? 'उपयोगकर्ता को चेतावनी दी गई' : 'User warned',
    profileRemoved: language === 'hi' ? 'प्रोफाइल हटा दी गई' : 'Profile removed',
    pendingReview: language === 'hi' ? 'समीक्षा लंबित' : 'Pending Review',
    reviewed: language === 'hi' ? 'समीक्षित' : 'Reviewed',
    inappropriateMessages: language === 'hi' ? 'अनुचित संदेश' : 'Inappropriate Messages',
    fakeProfile: language === 'hi' ? 'नकली प्रोफाइल' : 'Fake Profile',
    harassment: language === 'hi' ? 'उत्पीड़न' : 'Harassment',
    spam: language === 'hi' ? 'स्पैम' : 'Spam',
    offensiveContent: language === 'hi' ? 'आपत्तिजनक सामग्री' : 'Offensive Content',
    otherReason: language === 'hi' ? 'अन्य' : 'Other',
    chatHistory: language === 'hi' ? 'चैट इतिहास' : 'Chat History',
    noMessagesFound: language === 'hi' ? 'कोई संदेश नहीं मिला' : 'No messages found',
    // Pagination translations
    page: language === 'hi' ? 'पृष्ठ' : 'Page',
    of: language === 'hi' ? 'का' : 'of',
    showing: language === 'hi' ? 'दिखा रहे हैं' : 'Showing',
    to: language === 'hi' ? 'से' : 'to',
    entries: language === 'hi' ? 'प्रविष्टियाँ' : 'entries',
    previous: language === 'hi' ? 'पिछला' : 'Previous',
    next: language === 'hi' ? 'अगला' : 'Next',
    first: language === 'hi' ? 'पहला' : 'First',
    last: language === 'hi' ? 'अंतिम' : 'Last',
  }
  
  // Reset pagination when filters change
  useEffect(() => {
    setDatabasePage(1)
  }, [dbStatusFilter])
  
  // Pagination helper component
  const PaginationControls = ({ 
    currentPage, 
    totalItems, 
    itemsPerPage, 
    onPageChange,
    className = ''
  }: { 
    currentPage: number
    totalItems: number
    itemsPerPage: number
    onPageChange: (page: number) => void
    className?: string
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)
    
    if (totalPages <= 1) return null
    
    // Generate page numbers to show
    const getPageNumbers = () => {
      const pages: (number | string)[] = []
      const showPages = 5 // Max number of page buttons to show
      
      if (totalPages <= showPages) {
        for (let i = 1; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        
        if (currentPage > 3) pages.push('...')
        
        const start = Math.max(2, currentPage - 1)
        const end = Math.min(totalPages - 1, currentPage + 1)
        
        for (let i = start; i <= end; i++) {
          if (!pages.includes(i)) pages.push(i)
        }
        
        if (currentPage < totalPages - 2) pages.push('...')
        
        if (!pages.includes(totalPages)) pages.push(totalPages)
      }
      
      return pages
    }
    
    return (
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t ${className}`}>
        <div className="text-sm text-muted-foreground">
          {t.showing} {startItem} {t.to} {endItem} {t.of} {totalItems} {t.entries}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="h-8 px-2"
            title={t.first}
          >
            <CaretLeft size={14} weight="bold" />
            <CaretLeft size={14} weight="bold" className="-ml-2" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 px-3"
          >
            <CaretLeft size={14} />
            <span className="hidden sm:inline ml-1">{t.previous}</span>
          </Button>
          
          <div className="flex items-center gap-1 mx-1">
            {getPageNumbers().map((page, idx) => (
              typeof page === 'number' ? (
                <Button
                  key={idx}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              ) : (
                <span key={idx} className="px-1 text-muted-foreground">...</span>
              )
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 px-3"
          >
            <span className="hidden sm:inline mr-1">{t.next}</span>
            <CaretRight size={14} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 px-2"
            title={t.last}
          >
            <CaretRight size={14} weight="bold" />
            <CaretRight size={14} weight="bold" className="-ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  // Helper to get user credentials for a profile
  const getUserCredentials = (profileId: string) => users?.find(u => u.profileId === profileId)

  const pendingProfiles = profiles?.filter(p => p.status === 'pending' && !p.isDeleted) || []
  const approvedProfiles = profiles?.filter(p => p.status === 'verified' && !p.isDeleted) || []
  const rejectedProfiles = profiles?.filter(p => p.status === 'rejected' && !p.isDeleted) || []
  const deletedProfiles = profiles?.filter(p => p.isDeleted) || []

  // Filtered profiles for database tab based on status filter
  const getFilteredDatabaseProfiles = () => {
    if (!profiles) return []
    switch (dbStatusFilter) {
      case 'approved':
        return profiles.filter(p => p.status === 'verified' && !p.isDeleted)
      case 'pending':
        return profiles.filter(p => p.status === 'pending' && !p.isDeleted)
      case 'rejected':
        return profiles.filter(p => p.status === 'rejected' && !p.isDeleted)
      case 'deleted':
        return profiles.filter(p => p.isDeleted)
      default:
        return profiles
    }
  }
  const filteredDatabaseProfiles = getFilteredDatabaseProfiles()

  // Delete profile handler (soft delete - moves to Deleted Profiles tab)
  const handleDeleteProfile = (profileId: string) => {
    if (!confirm(t.deleteConfirm)) return
    setProfiles((current) => 
      (current || []).map(p => 
        p.id === profileId 
          ? { 
              ...p, 
              isDeleted: true, 
              deletedAt: new Date().toISOString(),
              deletedBy: 'Admin'
            }
          : p
      )
    )
    toast.success(t.deleteSuccess)
    setSelectedProfile(null)
    setViewProfileDialog(null)
  }

  // Restore deleted profile handler
  const handleRestoreProfile = (profileId: string) => {
    setProfiles((current) => 
      (current || []).map(p => 
        p.id === profileId 
          ? { ...p, isDeleted: false, deletedAt: undefined, deletedReason: undefined }
          : p
      )
    )
    toast.success(t.restoreSuccess)
  }

  // Permanently delete profile from database
  const handlePermanentDelete = (profileId: string) => {
    if (!confirm(t.permanentDeleteConfirm)) return
    setProfiles((current) => (current || []).filter(p => p.id !== profileId))
    toast.success(t.permanentDeleteSuccess)
  }

  // Reject with notification (SMS + Email)
  const handleRejectWithNotification = () => {
    if (!showRejectDialog) return
    
    const profile = showRejectDialog
    
    // Update profile status
    setProfiles((current) => 
      (current || []).map(p => 
        p.id === profile.id 
          ? { ...p, status: 'rejected' as const, rejectionReason: rejectionReason, rejectedAt: new Date().toISOString() }
          : p
      )
    )
    
    // Send notification if enabled
    if (sendRejectionNotification) {
      // In production, this would call an API to send SMS and Email
      // For now, we simulate the notification
      logger.debug(`[Notification] Sending rejection SMS to: ${profile.mobile}`)
      logger.debug(`[Notification] Sending rejection Email to: ${profile.email}`)
      logger.debug(`[Notification] Rejection reason: ${rejectionReason}`)
      
      // Show success toast
      toast.info(t.notificationSent)
    }
    
    toast.error(t.rejectSuccess)
    
    // Reset dialog state
    setShowRejectDialog(null)
    setRejectionReason('')
    setSendRejectionNotification(true)
    setSelectedProfile(null)
  }

  // Undo rejection - move profile back to pending
  const handleUndoRejection = (profile: Profile) => {
    setProfiles((current) => 
      (current || []).map(p => 
        p.id === profile.id 
          ? { ...p, status: 'pending' as const, rejectionReason: undefined, rejectedAt: undefined }
          : p
      )
    )
    toast.success(t.undoRejectionSuccess)
    setShowRejectionReasonDialog(null)
  }

  // DigiLocker verification handler
  const handleDigilockerVerify = (verified: boolean) => {
    if (!digilockerProfile) return
    
    setProfiles((current) =>
      (current || []).map(p =>
        p.id === digilockerProfile.id
          ? verified 
            ? {
                ...p,
                digilockerVerified: true,
                digilockerVerifiedAt: new Date().toISOString(),
                digilockerVerifiedBy: 'Admin',
                digilockerDocumentType: digilockerFormData.documentType,
                digilockerNotes: digilockerFormData.notes || undefined
              }
            : {
                ...p,
                digilockerVerified: false,
                digilockerVerifiedAt: undefined,
                digilockerVerifiedBy: undefined,
                digilockerDocumentType: undefined,
                digilockerNotes: undefined
              }
          : p
      )
    )
    
    toast.success(verified ? t.digilockerVerifySuccess : t.digilockerVerifyRemoved)
    setShowDigilockerDialog(false)
    setDigilockerProfile(null)
    setDigilockerFormData({ documentType: 'aadhaar', notes: '' })
  }

  const handleApprove = (profileId: string) => {
    setProfiles((current) => 
      (current || []).map(p => 
        p.id === profileId 
          ? { ...p, status: 'verified' as const, verifiedAt: new Date().toISOString() }
          : p
      )
    )
    toast.success(t.approveSuccess)
    setSelectedProfile(null)
  }

  const handleReject = (profileId: string, reason?: string) => {
    setProfiles((current) => 
      (current || []).map(p => 
        p.id === profileId 
          ? { 
              ...p, 
              status: 'rejected' as const,
              rejectionReason: reason || p.rejectionReason,
              rejectedAt: new Date().toISOString()
            }
          : p
      )
    )
    toast.error(t.rejectSuccess)
    setSelectedProfile(null)
  }
  
  // Handle bulk rejection with reason
  const handleBulkRejectWithReason = () => {
    if (!showBulkRejectDialog) return
    const { ids, source } = showBulkRejectDialog
    const count = ids.length
    ids.forEach(id => handleReject(id, bulkRejectReason))
    if (source === 'pending') {
      setSelectedProfiles([])
    } else {
      setSelectedDatabaseProfiles([])
    }
    toast.success(language === 'hi' ? `${count} प्रोफाइल अस्वीकृत!` : `${count} profiles rejected!`)
    setShowBulkRejectDialog(null)
    setBulkRejectReason('')
  }

  const handleMoveToPending = (profileId: string, reason?: string) => {
    setProfiles((current) => 
      (current || []).map(p => 
        p.id === profileId 
          ? { 
              ...p, 
              status: 'pending' as const, 
              verifiedAt: undefined,
              returnedForEdit: true,
              editReason: reason || '',
              returnedAt: new Date().toISOString()
            }
          : p
      )
    )
    toast.success(reason ? t.profileReturnedForEdit : t.movedToPending)
    setReturnToEditDialog(null)
    setReturnToEditReason('')
  }

  const handleBlock = (profile: Profile) => {
    setProfiles((current) => 
      (current || []).map(p => 
        p.id === profile.id 
          ? { ...p, status: 'rejected' as const, isBlocked: true }
          : p
      )
    )
    
    setBlockedContacts((current) => [
      ...(current || []),
      {
        email: profile.email,
        mobile: profile.mobile,
        blockedAt: new Date().toISOString(),
        reason: 'Admin blocked'
      }
    ])
    
    toast.success(t.blockSuccess)
    setSelectedProfile(null)
  }

  // Unblock a blocked profile
  const handleUnblock = (profile: Profile) => {
    setProfiles((current) => 
      (current || []).map(p => 
        p.id === profile.id 
          ? { ...p, status: 'pending' as const, isBlocked: false }
          : p
      )
    )
    
    // Remove from blocked contacts
    setBlockedContacts((current) => 
      (current || []).filter(bc => bc.email !== profile.email && bc.mobile !== profile.mobile)
    )
    
    toast.success(t.unblockSuccess)
    setSelectedProfile(null)
  }

  // Helper function to create payment transaction and auto-generate invoice
  const createPaymentTransactionForVerification = (
    profile: Profile, 
    isRenewal: boolean = false
  ): void => {
    const now = new Date()
    const plan = profile.membershipPlan || '6-month'
    const monthsToAdd = plan === '1-year' ? 12 : 6
    const expiryDate = new Date(now)
    expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd)
    
    // Get the amount from membership settings or use defaults
    const amount = plan === '1-year' 
      ? (membershipSettings?.oneYearPrice || 900)
      : (membershipSettings?.sixMonthPrice || 500)
    
    // Generate unique receipt number
    const receiptNumber = `RCP${Date.now().toString().slice(-8)}`
    
    // Generate transaction ID (from screenshot upload or auto-generated)
    const transactionId = `TXN${now.getTime().toString().slice(-10)}`
    
    // Create the payment transaction
    const newTransaction: PaymentTransaction = {
      id: `pt_${now.getTime()}`,
      transactionId: transactionId,
      profileId: profile.profileId,
      profileName: profile.fullName,
      profileMobile: profile.mobile,
      profileEmail: profile.email,
      plan: plan,
      amount: amount,
      discountAmount: 0,
      finalAmount: amount,
      paymentMode: 'upi', // Default to UPI since screenshot was uploaded
      paymentDate: now.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      receiptNumber: receiptNumber,
      notes: isRenewal 
        ? (language === 'hi' ? 'नवीनीकरण भुगतान - स्क्रीनशॉट से सत्यापित' : 'Renewal payment - Verified from screenshot')
        : (language === 'hi' ? 'नई सदस्यता - स्क्रीनशॉट से सत्यापित' : 'New membership - Verified from screenshot'),
      createdAt: now.toISOString(),
      createdBy: 'Admin'
    }
    
    // Add to payment transactions
    setPaymentTransactions((current) => [newTransaction, ...(current || [])])
    
    // Show success message with invoice number
    toast.success(
      language === 'hi' 
        ? `रसीद #${receiptNumber} जनरेट हो गई। खाते टैब में देखें।`
        : `Invoice #${receiptNumber} generated. View in Accounts tab.`
    )
  }

  // Open Admin Edit Profile dialog (using RegistrationDialog in admin mode)
  const handleOpenAdminEdit = (profile: Profile) => {
    setAdminEditDialog(profile)
  }

  // Handle save from admin edit mode
  const handleAdminEditSave = (updatedProfile: Profile) => {
    setProfiles((current) => 
      (current || []).map(p => 
        p.id === updatedProfile.id 
          ? { 
              ...updatedProfile,
              adminEditedAt: new Date().toISOString(),
              adminEditedBy: 'Admin'
            }
          : p
      )
    )
    
    toast.success(t.profileUpdated)
    setAdminEditDialog(null)
  }

  // Broadcast message to multiple profiles
  const handleBroadcastMessage = () => {
    if (!broadcastMessage.trim() || broadcastProfiles.length === 0) return
    
    const newMessages: ChatMessage[] = broadcastProfiles.map(profileId => ({
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromProfileId: 'admin',
      fromUserId: 'admin',
      toProfileId: profileId,
      message: broadcastMessage,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      type: 'admin-to-user' as const,
      read: false,
      status: 'sent' as const
    }))
    
    setMessages((current) => [...(current || []), ...newMessages])
    toast.success(t.broadcastSuccess)
    setShowBroadcastDialog(false)
    setBroadcastMessage('')
    setBroadcastProfiles([])
  }

  // Open face verification dialog for manual review (default)
  const handleFaceVerification = (profile: Profile) => {
    if (!profile.selfieUrl || !profile.photos || profile.photos.length === 0) {
      toast.error(language === 'hi' ? 'सेल्फी और फोटो दोनों आवश्यक हैं' : 'Both selfie and photos are required for verification')
      return
    }

    setFaceVerificationDialog(profile)
    setFaceVerificationResult(null)
    setIsVerifyingFace(false)
  }

  // Run AI face verification only when explicitly triggered
  const handleAIFaceVerification = async (profile: Profile) => {
    if (!profile.selfieUrl || !profile.photos || profile.photos.length === 0) {
      toast.error(language === 'hi' ? 'सेल्फी और फोटो दोनों आवश्यक हैं' : 'Both selfie and photos are required for verification')
      return
    }

    setFaceVerificationResult(null)
    setIsVerifyingFace(true)

    try {
      const result = await verifyPhotosWithVision(profile.selfieUrl, profile.photos)
      setFaceVerificationResult(result)
      
      if (result.isMatch) {
        toast.success(language === 'hi' ? `चेहरा सत्यापित! (विश्वास: ${result.confidence}%)` : `Face verified! (Confidence: ${result.confidence}%)`)
      } else {
        toast.warning(language === 'hi' ? 'चेहरा मेल नहीं खाता' : 'Face mismatch detected')
      }
    } catch (_error) {
      toast.error(language === 'hi' ? 'सत्यापन विफल' : 'Verification failed')
      setFaceVerificationResult({
        isMatch: false,
        confidence: 0,
        matchDetails: {
          faceShapeMatch: false,
          facialFeaturesMatch: false,
          overallSimilarity: 'no-match'
        },
        analysis: 'Verification service error',
        recommendations: ['Please retry or perform manual review']
      })
    } finally {
      setIsVerifyingFace(false)
    }
  }

  // Handle marking photo as verified/not verified (manual admin action)
  const handleMarkPhotoVerified = (profile: Profile, isVerified: boolean) => {
    const updatedProfile: Profile = {
      ...profile,
      photoVerified: isVerified,
      photoVerifiedAt: new Date().toISOString(),
      photoVerifiedBy: 'Admin',
      photoVerificationNotes: isVerified ? 'Manually verified by admin' : 'Manually marked as not verified by admin',
      photoVerificationConfidence: isVerified ? 100 : 0
    }
    
    // Update profiles state (this auto-persists to KV storage)
    setProfiles((current) => 
      (current || []).map(p => p.id === profile.id ? updatedProfile : p)
    )
    
    // Update dialog state to show the updated profile
    setFaceVerificationDialog(updatedProfile)
    
    if (isVerified) {
      toast.success(t.faceVerifiedSuccess)
    } else {
      toast.warning(t.faceNotVerifiedSuccess)
    }
  }

  const handleGetAISuggestions = async (profile: Profile) => {
    setIsLoadingAI(true)
    setSelectedProfile(profile)
    try {
      // Generate local AI suggestions (can be replaced with Azure AI Foundry in production)
      const suggestions = generateProfileSuggestions(profile)
      setAiSuggestions(suggestions)
    } catch (_error) {
      toast.error('Failed to get AI suggestions')
      setAiSuggestions([])
    } finally {
      setIsLoadingAI(false)
    }
  }

  // Local suggestion generator - can be replaced with Azure AI Foundry API call
  const generateProfileSuggestions = (profile: Profile): string[] => {
    const suggestions: string[] = []
    
    if (language === 'hi') {
      // Hindi suggestions
      if (!profile.bio || profile.bio.length < 50) {
        suggestions.push('1. परिचय (Bio) गायब है या बहुत छोटा है। उपयोगकर्ता को अपने बारे में अधिक विवरण जोड़ने के लिए प्रोत्साहित करें।')
      }
      if (!profile.photos || profile.photos.length === 0) {
        suggestions.push('2. कोई फोटो अपलोड नहीं की गई। बेहतर दृश्यता के लिए उपयोगकर्ता से प्रोफाइल फोटो जोड़ने का अनुरोध करें।')
      }
      if (!profile.familyDetails) {
        suggestions.push('3. पारिवारिक विवरण गायब है। वैवाहिक प्रोफाइल के लिए यह महत्वपूर्ण है।')
      }
      if (!profile.height) {
        suggestions.push('4. ऊंचाई की जानकारी प्रदान नहीं की गई है।')
      }
      if (!profile.selfieUrl) {
        suggestions.push('5. सेल्फी सत्यापन लंबित है। विश्वास सत्यापन के लिए उपयोगकर्ता से सेल्फी अपलोड करने का अनुरोध करें।')
      }
      if (!profile.occupation || profile.occupation.length < 5) {
        suggestions.push('6. व्यवसाय विवरण अधूरा लगता है।')
      }
      if (!(profile as any).birthTime) {
        suggestions.push('7. जन्म समय प्रदान नहीं किया गया है।')
      }
      if (!(profile as any).birthPlace) {
        suggestions.push('8. जन्म स्थान प्रदान नहीं किया गया है।')
      }
      if (!(profile as any).diet) {
        suggestions.push('9. खान-पान की जानकारी गायब है।')
      }
      if (!(profile as any).habits) {
        suggestions.push('10. आदतों की जानकारी गायब है।')
      }
      if (!(profile as any).annualIncome) {
        suggestions.push('11. वार्षिक आय की जानकारी गायब है।')
      }
      if (!(profile as any).profession) {
        suggestions.push('12. पेशे की जानकारी गायब है।')
      }
      
      if (suggestions.length === 0) {
        suggestions.push('✅ प्रोफाइल पूर्ण दिखती है। फोटो सत्यापन के बाद स्वीकृत करने पर विचार करें।')
      }
    } else {
      // English suggestions
      if (!profile.bio || profile.bio.length < 50) {
        suggestions.push('1. Bio is missing or too short. Encourage user to add more details about themselves.')
      }
      if (!profile.photos || profile.photos.length === 0) {
        suggestions.push('2. No photos uploaded. Request user to add profile photos for better visibility.')
      }
      if (!profile.familyDetails) {
        suggestions.push('3. Family details are missing. This is important for matrimonial profiles.')
      }
      if (!profile.height) {
        suggestions.push('4. Height information is not provided.')
      }
      if (!profile.selfieUrl) {
        suggestions.push('5. Selfie verification pending. Request user to upload a selfie for trust verification.')
      }
      if (!profile.occupation || profile.occupation.length < 5) {
        suggestions.push('6. Occupation details seem incomplete.')
      }
      if (!(profile as any).birthTime) {
        suggestions.push('7. Birth time is not provided.')
      }
      if (!(profile as any).birthPlace) {
        suggestions.push('8. Birth place is not provided.')
      }
      if (!(profile as any).diet) {
        suggestions.push('9. Diet information is missing.')
      }
      if (!(profile as any).habits) {
        suggestions.push('10. Habits information is missing.')
      }
      if (!(profile as any).annualIncome) {
        suggestions.push('11. Annual income information is missing.')
      }
      if (!(profile as any).profession) {
        suggestions.push('12. Profession information is missing.')
      }
      
      if (suggestions.length === 0) {
        suggestions.push('✅ Profile looks complete. Consider approving after photo verification.')
      }
    }
    
    return suggestions
  }

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !selectedProfile) return
    
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      fromUserId: 'admin',
      fromProfileId: 'admin',
      toProfileId: selectedProfile.profileId,
      message: chatMessage,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      read: false,
      type: 'admin-to-user',
      status: 'sent',
      delivered: false
    }

    setMessages((current) => [...(current || []), newMessage])
    toast.success(t.messageSent)
    setChatMessage('')
    setShowChatDialog(false)
  }

  const handleAddService = () => {
    setEditingService(null)
    setServiceFormData({
      category: 'venue',
      verificationStatus: 'verified',
      consultationFee: 200
    })
    setShowServiceDialog(true)
  }

  const handleEditService = (service: WeddingService) => {
    setEditingService(service)
    setServiceFormData(service)
    setShowServiceDialog(true)
  }

  const handleSaveService = () => {
    if (!serviceFormData.businessName || !serviceFormData.contactPerson || !serviceFormData.mobile || !serviceFormData.city) {
      toast.error(language === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें' : 'Please fill all required fields')
      return
    }

    if (editingService) {
      setWeddingServices((current) => 
        (current || []).map(s => s.id === editingService.id ? { ...serviceFormData, id: editingService.id } as WeddingService : s)
      )
      toast.success(language === 'hi' ? 'सेवा अपडेट हो गई!' : 'Service updated!')
    } else {
      const newService: WeddingService = {
        ...serviceFormData,
        id: `service-${Date.now()}`,
        createdAt: new Date().toISOString(),
      } as WeddingService

      setWeddingServices((current) => [...(current || []), newService])
      toast.success(language === 'hi' ? 'सेवा जोड़ी गई!' : 'Service added!')
    }

    setShowServiceDialog(false)
    setEditingService(null)
    setServiceFormData({
      category: 'venue',
      verificationStatus: 'verified',
      consultationFee: 200
    })
  }

  const handleDeleteService = (serviceId: string) => {
    if (confirm(language === 'hi' ? 'क्या आप इस सेवा को हटाना चाहते हैं?' : 'Are you sure you want to delete this service?')) {
      setWeddingServices((current) => (current || []).filter(s => s.id !== serviceId))
      toast.success(language === 'hi' ? 'सेवा हटा दी गई!' : 'Service deleted!')
    }
  }

  const adminProfile: Profile = {
    id: 'admin',
    profileId: 'admin',
    fullName: 'Admin',
    firstName: 'Admin',
    lastName: '',
    dateOfBirth: '',
    age: 0,
    gender: 'male',
    education: '',
    occupation: 'Administrator',
    location: '',
    country: '',
    maritalStatus: 'never-married',
    email: '',
    mobile: '',
    hideEmail: false,
    hideMobile: false,
    photos: [],
    status: 'verified',
    trustLevel: 5,
    createdAt: new Date().toISOString(),
    emailVerified: true,
    mobileVerified: true,
    isBlocked: false,
    disability: 'none'
  }

  return (
    <section className="container mx-auto px-4 md:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <ShieldCheck size={32} weight="fill" />
                {t.title}
              </h2>
              <p className="text-muted-foreground">{t.description}</p>
            </div>
            {onLogout && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (confirm(language === 'hi' 
                      ? 'क्या आप वाकई एडमिन पैनल से लॉगआउट करना चाहते हैं?' 
                      : 'Are you sure you want to logout from admin panel?'
                    )) {
                      onLogout()
                    }
                  }}
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X size={18} />
                  {language === 'hi' ? 'लॉगआउट' : 'Logout'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 w-full max-w-7xl">
            <TabsTrigger value="pending" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <Info size={16} className="shrink-0" />
              <span className="hidden sm:inline">{t.pendingProfiles}</span>
              <span className="sm:hidden">{language === 'hi' ? 'लंबित' : 'Pending'}</span>
              {pendingProfiles.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">{pendingProfiles.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <Database size={16} className="shrink-0" />
              <span className="hidden sm:inline">{t.allDatabase}</span>
              <span className="sm:hidden">{language === 'hi' ? 'डेटाबेस' : 'Database'}</span>
              <Badge variant="secondary" className="ml-1 text-xs">{profiles?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="membership" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <CurrencyInr size={16} weight="fill" className="shrink-0" />
              <span className="hidden sm:inline">{t.membershipSettings}</span>
              <span className="sm:hidden">{language === 'hi' ? 'सदस्यता' : 'Membership'}</span>
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-1 text-xs sm:text-sm whitespace-nowrap text-green-600">
              <CurrencyCircleDollar size={16} weight="fill" className="shrink-0" />
              <span className="hidden sm:inline">{t.accounts}</span>
              <span className="sm:hidden">{language === 'hi' ? 'खाते' : 'Accounts'}</span>
              {(() => {
                const pendingPaymentsCount = profiles?.filter(p => 
                  p.membershipPlan && 
                  p.membershipPlan !== 'free' && 
                  p.paymentScreenshotUrl && 
                  (p.paymentStatus === 'pending' || !p.paymentStatus) &&
                  !p.isDeleted
                ).length || 0
                const pendingRenewalsCount = profiles?.filter(p => 
                  p.renewalPaymentScreenshotUrl && 
                  p.renewalPaymentStatus === 'pending' &&
                  !p.isDeleted
                ).length || 0
                const totalPending = pendingPaymentsCount + pendingRenewalsCount
                return totalPending > 0 ? (
                  <Badge variant="destructive" className="ml-1 text-xs">{totalPending}</Badge>
                ) : null
              })()}
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <ChatCircle size={16} weight="fill" className="shrink-0" />
              <span className="hidden sm:inline">{t.adminChat}</span>
              <span className="sm:hidden">{language === 'hi' ? 'चैट' : 'Chat'}</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1 text-xs sm:text-sm whitespace-nowrap text-orange-600">
              <ShieldWarning size={16} weight="fill" className="shrink-0" />
              <span className="hidden sm:inline">{t.reports}</span>
              <span className="sm:hidden">{language === 'hi' ? 'रिपोर्ट' : 'Reports'}</span>
              {(() => {
                const pendingReportsCount = blockedProfiles?.filter(b => b.reportedToAdmin && !b.adminReviewed).length || 0
                return pendingReportsCount > 0 ? (
                  <Badge variant="destructive" className="ml-1 text-xs animate-pulse">{pendingReportsCount}</Badge>
                ) : null
              })()}
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <Storefront size={16} weight="fill" className="shrink-0" />
              <span className="hidden sm:inline">{t.weddingServices}</span>
              <span className="sm:hidden">{language === 'hi' ? 'सेवाएं' : 'Services'}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t.pendingProfiles}</CardTitle>
                    <CardDescription>
                      {pendingProfiles.length} {t.pending.toLowerCase()}
                    </CardDescription>
                  </div>
                  {/* Bulk Actions Toolbar */}
                  {selectedProfiles.length > 0 && (
                    <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                      <span className="text-sm font-medium">
                        {selectedProfiles.length} {language === 'hi' ? 'चयनित' : 'selected'}
                      </span>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => {
                          selectedProfiles.forEach(id => handleApprove(id))
                          setSelectedProfiles([])
                          toast.success(language === 'hi' ? `${selectedProfiles.length} प्रोफाइल स्वीकृत!` : `${selectedProfiles.length} profiles approved!`)
                        }}
                        className="gap-1"
                      >
                        <Check size={14} />
                        {t.bulkApprove}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => setShowBulkRejectDialog({ ids: selectedProfiles, source: 'pending' })}
                        className="gap-1"
                      >
                        <X size={14} />
                        {t.bulkReject}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedProfiles([])}
                      >
                        {t.close}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {pendingProfiles.length === 0 ? (
                  <Alert>
                    <Info size={18} />
                    <AlertDescription>{t.noPending}</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {/* Select All Checkbox */}
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                      <Checkbox 
                        checked={selectedProfiles.length === pendingProfiles.length && pendingProfiles.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProfiles(pendingProfiles.map(p => p.id))
                          } else {
                            setSelectedProfiles([])
                          }
                        }}
                      />
                      <Label className="cursor-pointer">{t.selectAll} ({pendingProfiles.length})</Label>
                    </div>
                    <div className="space-y-4">
                    {(() => {
                      const sortedPending = [...pendingProfiles].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      const paginatedPending = sortedPending.slice((pendingPage - 1) * ITEMS_PER_PAGE, pendingPage * ITEMS_PER_PAGE)
                      return paginatedPending
                    })().map((profile) => (
                      <Card key={profile.id} className={`border-2 overflow-hidden ${selectedProfiles.includes(profile.id) ? 'border-primary bg-primary/5' : ''}`}>
                        <CardContent className="pt-6 overflow-hidden">
                          <div className="flex flex-col gap-4">
                            {/* Main content row with checkbox */}
                            <div className="flex items-start gap-3">
                              {/* Checkbox for selection */}
                              <div className="flex items-center shrink-0 pt-1">
                                <Checkbox 
                                  checked={selectedProfiles.includes(profile.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedProfiles(prev => [...prev, profile.id])
                                    } else {
                                      setSelectedProfiles(prev => prev.filter(id => id !== profile.id))
                                    }
                                  }}
                                />
                              </div>
                              
                              {/* Content grid - photos and info side by side on large screens */}
                              <div className="flex-1 min-w-0">
                                {/* Name and badges row */}
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                  <h3 className="font-bold text-lg truncate max-w-[200px]">{profile.fullName}</h3>
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    {profile.relationToProfile || (language === 'hi' ? 'स्वयं' : 'Self')}
                                  </Badge>
                                  <Badge variant="secondary" className="shrink-0">{t.pending}</Badge>
                                  {profile.returnedForEdit && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50 shrink-0">
                                      {language === 'hi' ? 'संपादन हेतु लौटाया' : 'Returned for Edit'}
                                    </Badge>
                                  )}
                                  {profile.isBlocked && <Badge variant="destructive" className="shrink-0">{t.blocked}</Badge>}
                                  {/* Membership Plan Badge */}
                                  {profile.membershipPlan && (
                                    <Badge variant={profile.membershipPlan === 'free' ? 'outline' : 'default'} 
                                      className={`shrink-0 ${profile.membershipPlan === '1-year' ? 'bg-accent text-accent-foreground' : 
                                                 profile.membershipPlan === '6-month' ? 'bg-primary text-primary-foreground' : ''}`}>
                                      {profile.membershipPlan === 'free' ? (language === 'hi' ? 'फ्री' : 'Free') :
                                       profile.membershipPlan === '6-month' ? (language === 'hi' ? '6 महीने' : '6 Month') :
                                       (language === 'hi' ? '1 वर्ष' : '1 Year')}
                                    </Badge>
                                  )}
                                  {/* Payment Status Badge */}
                                  {profile.paymentStatus && profile.paymentStatus !== 'not-required' && (
                                    <Badge variant={profile.paymentStatus === 'verified' ? 'default' : 
                                                    profile.paymentStatus === 'pending' ? 'secondary' : 'destructive'}
                                      className={`shrink-0 ${profile.paymentStatus === 'verified' ? 'bg-green-600' : 
                                                 profile.paymentStatus === 'pending' ? 'bg-amber-500 text-white' : ''}`}>
                                      {profile.paymentStatus === 'verified' ? (language === 'hi' ? '₹ सत्यापित' : '₹ Verified') :
                                       profile.paymentStatus === 'pending' ? (language === 'hi' ? '₹ लंबित' : '₹ Pending') :
                                       (language === 'hi' ? '₹ अस्वीकृत' : '₹ Rejected')}
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* Photos and Details in responsive grid */}
                                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4">
                                  {/* Photos Section */}
                                  <div className="flex flex-wrap gap-3">
                                    {/* Uploaded Photos */}
                                    <div className="space-y-1">
                                      <p className="text-xs text-muted-foreground font-medium">
                                        {language === 'hi' ? 'अपलोड फोटो' : 'Photos'}
                                      </p>
                                      <div className="flex gap-1">
                                        {profile.photos && profile.photos.length > 0 ? (
                                          profile.photos.slice(0, 3).map((photo, idx) => (
                                            <img 
                                              key={idx}
                                              src={photo} 
                                              alt={`Photo ${idx + 1}`}
                                              className="w-14 h-14 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                                              onClick={() => openLightbox(profile.photos || [], idx)}
                                              title={language === 'hi' ? 'बड़ा देखें' : 'View larger'}
                                            />
                                          ))
                                        ) : (
                                          <div className="w-14 h-14 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                                            {language === 'hi' ? 'नहीं' : 'None'}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {/* Selfie */}
                                    <div className="space-y-1">
                                      <p className="text-xs text-muted-foreground font-medium">
                                        {language === 'hi' ? 'सेल्फी' : 'Selfie'}
                                      </p>
                                      {profile.selfieUrl ? (
                                        <img 
                                          src={profile.selfieUrl} 
                                          alt="Selfie"
                                          className="w-14 h-14 object-cover rounded-md border-2 border-blue-300 cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => openLightbox([profile.selfieUrl!], 0)}
                                          title={language === 'hi' ? 'बड़ा देखें' : 'View larger'}
                                        />
                                      ) : (
                                        <div className="w-14 h-14 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                                          {language === 'hi' ? 'नहीं' : 'None'}
                                        </div>
                                      )}
                                    </div>
                                    {/* Payment Screenshot (for paid plans) */}
                                    {profile.membershipPlan && profile.membershipPlan !== 'free' && (
                                      <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">
                                          {language === 'hi' ? 'भुगतान' : 'Payment'}
                                        </p>
                                        {profile.paymentScreenshotUrl ? (
                                          <img 
                                            src={profile.paymentScreenshotUrl} 
                                            alt="Payment Screenshot"
                                            className={`w-14 h-14 object-cover rounded-md border-2 cursor-pointer hover:opacity-80 transition-opacity ${
                                              profile.paymentStatus === 'verified' ? 'border-green-500' : 
                                              profile.paymentStatus === 'rejected' ? 'border-red-500' : 'border-amber-400'
                                            }`}
                                            onClick={() => {
                                              setPaymentViewProfile(profile)
                                              setShowPaymentViewDialog(true)
                                            }}
                                            title={language === 'hi' ? 'भुगतान सत्यापित करें' : 'Verify Payment'}
                                          />
                                        ) : (
                                          <div className="w-14 h-14 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground text-center p-1">
                                            {language === 'hi' ? 'नहीं' : 'None'}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Profile Details */}
                                  <div className="min-w-0 overflow-hidden">
                                    {/* Edit Reason Alert */}
                                    {profile.returnedForEdit && profile.editReason && (
                                      <Alert className="mb-2 bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800">
                                        <Pencil size={16} className="text-amber-600" />
                                        <AlertDescription className="text-sm">
                                          <span className="font-semibold text-amber-700 dark:text-amber-300">
                                            {language === 'hi' ? 'संपादन कारण:' : 'Edit Reason:'}
                                          </span>{' '}
                                          {profile.editReason}
                                        </AlertDescription>
                                      </Alert>
                                    )}
                                    
                                    {/* Profile info grid */}
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground overflow-hidden">
                                      <div className="truncate">{t.age}: {profile.age}</div>
                                      <div className="truncate">{profile.gender === 'male' ? (language === 'hi' ? 'पुरुष' : 'Male') : (language === 'hi' ? 'महिला' : 'Female')}</div>
                                      <div className="truncate">{t.location}: {profile.location}</div>
                                      <div className="truncate">{t.education}: {profile.education}</div>
                                      <div className="col-span-2 truncate">{t.occupation}: {profile.occupation}</div>
                                      <div className="col-span-2 truncate">{t.email}: {profile.email}</div>
                                      <div className="col-span-2 truncate">{t.mobile}: {profile.mobile}</div>
                                      <div className="col-span-2 flex items-center gap-2 flex-wrap">
                                        <ShieldCheck size={14} className={profile.digilockerVerified ? 'text-green-600' : 'text-muted-foreground'} />
                                        <span>{t.idProofVerification}:</span>
                                        {profile.digilockerVerified ? (
                                          <Badge variant="outline" className="text-green-600 border-green-400">
                                            ✓ {t.digilockerVerified}
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-amber-600 border-amber-400">
                                            {t.digilockerNotVerified}
                                          </Badge>
                                        )}
                                      </div>
                                      {/* Face/Photo Verification Status */}
                                      <div className="col-span-2 flex items-center gap-2 flex-wrap">
                                        <ScanSmiley size={14} className={profile.photoVerified ? 'text-green-600' : 'text-muted-foreground'} />
                                        <span>{t.faceVerification}:</span>
                                        {profile.photoVerified === true ? (
                                          <Badge variant="outline" className="text-green-600 border-green-400">
                                            ✓ {t.photoVerifiedBadge}
                                          </Badge>
                                        ) : profile.photoVerified === false ? (
                                          <Badge variant="outline" className="text-red-600 border-red-400">
                                            ✗ {t.photoNotVerified}
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-amber-600 border-amber-400">
                                            {language === 'hi' ? 'लंबित' : 'Pending'}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Login Credentials */}
                                    {(() => {
                                      const creds = getUserCredentials(profile.id)
                                      return creds ? (
                                        <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                                          <div className="flex items-center gap-2 text-sm flex-wrap">
                                            <Key size={14} weight="fill" className="text-primary" />
                                            <span className="font-semibold">{t.userId}:</span>
                                            <code className="bg-background px-1 rounded text-primary font-mono">{creds.userId}</code>
                                            <span className="font-semibold">{t.password}:</span>
                                            <code className="bg-background px-1 rounded text-accent font-mono">{creds.password}</code>
                                          </div>
                                        </div>
                                      ) : null
                                    })()}
                                    
                                    {/* Registration Location */}
                                    <div className="mt-2 p-2 bg-muted/50 rounded-lg border">
                                      <div className="flex items-center gap-2 mb-1">
                                        <NavigationArrow size={16} weight="fill" className="text-blue-500" />
                                        <span className="text-xs font-semibold">{t.registrationLocation}</span>
                                      </div>
                                      {profile.registrationLocation ? (
                                        <div className="text-xs space-y-1">
                                          <div className="flex items-center gap-1">
                                            <MapPin size={12} className="text-muted-foreground" />
                                            <span className="font-medium">
                                              {profile.registrationLocation.city || 'Unknown'}, 
                                              {profile.registrationLocation.region && ` ${profile.registrationLocation.region},`} 
                                              {profile.registrationLocation.country || ''}
                                            </span>
                                          </div>
                                          <a 
                                            href={`https://www.google.com/maps?q=${profile.registrationLocation.latitude},${profile.registrationLocation.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                          >
                                            <MapPin size={12} />
                                            {t.viewOnMap}
                                          </a>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-amber-600">
                                          ⚠️ {t.locationNotCaptured}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Admin Toolbar - Row 1: View Profile | Verification | More Actions */}
                            <div className="flex items-center gap-2 flex-wrap relative z-10">
                              {/* View Profile Button */}
                              <Button 
                                onClick={() => setViewProfileDialog(profile)}
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs px-3 text-blue-600 border-blue-300 hover:bg-blue-50 shrink-0"
                              >
                                <Eye size={14} className="mr-1.5" />
                                {t.viewProfile}
                              </Button>

                              {/* Verification Panel Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs px-3 border-primary/30 hover:bg-primary/5 shrink-0"
                                  >
                                    <ShieldCheck size={14} className="mr-1.5" />
                                    {language === 'hi' ? 'सत्यापन' : 'Verification'}
                                    {/* Quick status indicators */}
                                    <div className="flex gap-0.5 ml-2">
                                      <span className={`w-2 h-2 rounded-full ${profile.photoVerified === true ? 'bg-green-500' : profile.photoVerified === false ? 'bg-red-500' : 'bg-amber-400'}`} />
                                      <span className={`w-2 h-2 rounded-full ${profile.idProofVerified ? 'bg-green-500' : profile.idProofUrl ? 'bg-amber-400' : 'bg-gray-300'}`} />
                                      <span className={`w-2 h-2 rounded-full ${profile.membershipPlan === 'free' ? 'bg-gray-400' : profile.paymentStatus === 'verified' ? 'bg-green-500' : profile.paymentStatus === 'rejected' ? 'bg-red-500' : 'bg-amber-400'}`} />
                                    </div>
                                    <CaretDown size={12} className="ml-1.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="min-w-[280px] p-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    {/* Face Verification */}
                                    <div className={`flex items-center gap-2 p-2 rounded border cursor-pointer hover:shadow-sm transition-all ${
                                      profile.photoVerified === true ? 'bg-green-50 border-green-400' : 
                                      profile.photoVerified === false ? 'bg-red-50 border-red-300' : 
                                      'bg-background border-amber-300 hover:border-amber-400'
                                    }`}
                                      onClick={() => profile.selfieUrl && profile.photos?.length ? handleFaceVerification(profile) : null}
                                      title={!profile.selfieUrl || !profile.photos?.length ? (language === 'hi' ? 'सेल्फी या फोटो नहीं' : 'No selfie or photos') : ''}
                                    >
                                      <ScanSmiley size={16} className={
                                        profile.photoVerified === true ? 'text-green-600' : 
                                        profile.photoVerified === false ? 'text-red-500' : 'text-amber-500'
                                      } />
                                      <span className="text-xs font-medium">{t.faceVerification}</span>
                                    </div>
                                    
                                    {/* ID Proof Verification */}
                                    <div className={`flex items-center gap-2 p-2 rounded border cursor-pointer hover:shadow-sm transition-all ${
                                      profile.idProofVerified ? 'bg-green-50 border-green-400' : 
                                      profile.idProofUrl ? 'bg-background border-amber-300 hover:border-amber-400' : 
                                      'bg-muted/50 border-gray-200 opacity-60'
                                    }`}
                                      onClick={() => profile.idProofUrl ? (setIdProofViewProfile(profile), setShowIdProofViewDialog(true)) : null}
                                      title={!profile.idProofUrl ? (language === 'hi' ? 'पहचान प्रमाण अपलोड नहीं' : 'ID proof not uploaded') : ''}
                                    >
                                      <IdentificationCard size={16} className={
                                        profile.idProofVerified ? 'text-green-600' : 
                                        profile.idProofUrl ? 'text-amber-500' : 'text-gray-400'
                                      } />
                                      <span className="text-xs font-medium">{t.idProofVerification}</span>
                                    </div>
                                    
                                    {/* Payment Verification */}
                                    <div className={`flex items-center gap-2 p-2 rounded border cursor-pointer hover:shadow-sm transition-all ${
                                      profile.membershipPlan === 'free' ? 'bg-muted/50 border-gray-200' :
                                      profile.paymentStatus === 'verified' ? 'bg-green-50 border-green-400' : 
                                      profile.paymentStatus === 'rejected' ? 'bg-red-50 border-red-300' : 
                                      profile.paymentScreenshotUrl ? 'bg-background border-amber-300 hover:border-amber-400' : 
                                      'bg-muted/50 border-gray-200 opacity-60'
                                    }`}
                                      onClick={() => profile.membershipPlan !== 'free' && profile.paymentScreenshotUrl ? 
                                        (setPaymentViewProfile(profile), setPaymentRejectionReason(''), setShowPaymentViewDialog(true)) : null}
                                      title={profile.membershipPlan === 'free' ? (language === 'hi' ? 'फ्री प्लान' : 'Free plan') : 
                                             !profile.paymentScreenshotUrl ? (language === 'hi' ? 'स्क्रीनशॉट नहीं' : 'No screenshot') : ''}
                                    >
                                      <CurrencyInr size={16} className={
                                        profile.membershipPlan === 'free' ? 'text-gray-400' :
                                        profile.paymentStatus === 'verified' ? 'text-green-600' : 
                                        profile.paymentStatus === 'rejected' ? 'text-red-500' : 
                                        profile.paymentScreenshotUrl ? 'text-amber-500' : 'text-gray-400'
                                      } />
                                      <span className="text-xs font-medium">{language === 'hi' ? 'भुगतान' : 'Payment'}</span>
                                    </div>
                                    
                                    {/* AI Review */}
                                    <div className={`flex items-center gap-2 p-2 rounded border cursor-pointer hover:shadow-sm transition-all ${
                                      selectedProfile?.id === profile.id && aiSuggestions.length > 0 ? 'bg-blue-50 border-blue-400' : 
                                      'bg-background border-gray-200 hover:border-blue-300'
                                    }`}
                                      onClick={() => !isLoadingAI && handleGetAISuggestions(profile)}
                                    >
                                      <Robot size={16} className={
                                        isLoadingAI && selectedProfile?.id === profile.id ? 'text-blue-500 animate-pulse' :
                                        selectedProfile?.id === profile.id && aiSuggestions.length > 0 ? 'text-blue-600' : 'text-gray-500'
                                      } />
                                      <span className="text-xs font-medium">{t.aiReview}</span>
                                    </div>
                                  </div>
                                  
                                  {/* AI Suggestions Display */}
                                  {selectedProfile?.id === profile.id && aiSuggestions.length > 0 && (
                                    <Alert className="mt-2 bg-blue-50 border-blue-200 py-2">
                                      <Robot size={12} className="text-blue-600" />
                                      <AlertDescription>
                                        <div className="font-semibold text-[10px] mb-1 text-blue-700">{t.aiSuggestions}:</div>
                                        <ul className="space-y-0 text-[10px] text-blue-800">
                                          {aiSuggestions.map((suggestion, idx) => (
                                            <li key={idx}>• {suggestion}</li>
                                          ))}
                                        </ul>
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>

                              {/* More Actions Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs px-3 text-muted-foreground shrink-0"
                                  >
                                    <Pencil size={14} className="mr-1.5" />
                                    {language === 'hi' ? 'अधिक कार्य' : 'More Actions'}
                                    <CaretDown size={12} className="ml-1.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="min-w-[160px]">
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setReturnToEditDialog(profile)
                                      setReturnToEditReason('')
                                    }}
                                    className="text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                                  >
                                    <ArrowCounterClockwise size={14} className="mr-2" />
                                    {t.returnToEdit}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleOpenAdminEdit(profile)}
                                    className="text-purple-600 focus:text-purple-600 focus:bg-purple-50"
                                    title={language === 'hi' ? 'नाम, DOB, ईमेल, मोबाइल सहित सभी फ़ील्ड संपादित करें' : 'Edit all fields including Name, DOB, Email, Mobile'}
                                  >
                                    <UserIcon size={14} className="mr-2" />
                                    {t.adminEditProfile}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedProfile(profile)
                                      setShowChatDialog(true)
                                    }}
                                    className="text-blue-600 focus:text-blue-600 focus:bg-blue-50"
                                  >
                                    <ChatCircle size={14} className="mr-2" />
                                    {t.chat}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Admin Toolbar - Row 2: Primary Actions */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Button 
                                onClick={() => handleApprove(profile.id)} 
                                size="sm"
                                className="bg-teal hover:bg-teal/90 h-8 text-xs px-4 shrink-0"
                              >
                                <Check size={14} className="mr-1.5" />
                                {t.approve}
                              </Button>
                              <Button 
                                onClick={() => setShowRejectDialog(profile)} 
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs px-4 shrink-0"
                              >
                                <X size={14} className="mr-1.5" />
                                {t.reject}
                              </Button>
                              <Button 
                                onClick={() => handleBlock(profile)} 
                                variant="destructive"
                                size="sm"
                                className="h-8 text-xs px-4 shrink-0"
                              >
                                <ProhibitInset size={14} className="mr-1.5" />
                                {t.block}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <PaginationControls
                    currentPage={pendingPage}
                    totalItems={pendingProfiles.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setPendingPage}
                  />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database size={24} weight="fill" />
                      {t.allDatabase}
                    </CardTitle>
                    <CardDescription>
                      {filteredDatabaseProfiles.length} {language === 'hi' ? 'प्रोफाइल दिखाई जा रही हैं' : 'profiles shown'}
                      {dbStatusFilter !== 'all' && (
                        <span className="ml-1">
                          ({language === 'hi' ? 'कुल' : 'of'} {profiles?.length || 0})
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  
                  {/* Status Filter Buttons */}
                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    <div className="flex flex-wrap items-center gap-1 bg-muted rounded-lg p-1 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant={dbStatusFilter === 'all' ? 'default' : 'ghost'}
                        onClick={() => setDbStatusFilter('all')}
                        className="gap-1 text-xs h-8 flex-1 sm:flex-none min-w-0"
                      >
                        <Database size={14} className="shrink-0" />
                        <span className="hidden sm:inline">{language === 'hi' ? 'सभी' : 'All'}</span>
                        <Badge variant="outline" className="ml-1 text-xs bg-background">{profiles?.length || 0}</Badge>
                      </Button>
                      <Button
                        size="sm"
                        variant={dbStatusFilter === 'pending' ? 'default' : 'ghost'}
                        onClick={() => setDbStatusFilter('pending')}
                        className="gap-1 text-xs h-8 flex-1 sm:flex-none min-w-0"
                      >
                        <Info size={14} className="shrink-0" />
                        <span className="hidden sm:inline">{language === 'hi' ? 'लंबित' : 'Pending'}</span>
                        <Badge variant="outline" className="ml-1 text-xs bg-background">{pendingProfiles.length}</Badge>
                      </Button>
                      <Button
                        size="sm"
                        variant={dbStatusFilter === 'approved' ? 'default' : 'ghost'}
                        onClick={() => setDbStatusFilter('approved')}
                        className="gap-1 text-xs h-8 flex-1 sm:flex-none min-w-0"
                      >
                        <Check size={14} className="shrink-0" />
                        <span className="hidden sm:inline">{language === 'hi' ? 'स्वीकृत' : 'Approved'}</span>
                        <Badge variant="outline" className="ml-1 text-xs bg-background">{approvedProfiles.length}</Badge>
                      </Button>
                      <Button
                        size="sm"
                        variant={dbStatusFilter === 'rejected' ? 'default' : 'ghost'}
                        onClick={() => setDbStatusFilter('rejected')}
                        className="gap-1 text-xs h-8 text-orange-600 hover:text-orange-700 flex-1 sm:flex-none min-w-0"
                      >
                        <Prohibit size={14} className="shrink-0" />
                        <span className="hidden sm:inline">{language === 'hi' ? 'अस्वीकृत' : 'Rejected'}</span>
                        <Badge variant="outline" className="ml-1 text-xs bg-background">{rejectedProfiles.length}</Badge>
                      </Button>
                      <Button
                        size="sm"
                        variant={dbStatusFilter === 'deleted' ? 'default' : 'ghost'}
                        onClick={() => setDbStatusFilter('deleted')}
                        className="gap-1 text-xs h-8 text-red-600 hover:text-red-700 flex-1 sm:flex-none min-w-0"
                      >
                        <Trash size={14} className="shrink-0" />
                        <span className="hidden sm:inline">{language === 'hi' ? 'हटाए गए' : 'Deleted'}</span>
                        <Badge variant="outline" className="ml-1 text-xs bg-background">{deletedProfiles.length}</Badge>
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Bulk Actions Toolbar for Database */}
                {selectedDatabaseProfiles.length > 0 && (
                  <div className="flex items-center gap-2 bg-muted p-2 rounded-lg flex-wrap mt-4">
                    <span className="text-sm font-medium">
                      {selectedDatabaseProfiles.length} {language === 'hi' ? 'चयनित' : 'selected'}
                    </span>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => setShowBulkRejectDialog({ ids: selectedDatabaseProfiles, source: 'database' })}
                      className="gap-1"
                    >
                      <X size={14} />
                      {t.bulkReject}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="gap-1 text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm(language === 'hi' ? `क्या आप ${selectedDatabaseProfiles.length} प्रोफाइल हटाना चाहते हैं?` : `Delete ${selectedDatabaseProfiles.length} profiles?`)) {
                          const count = selectedDatabaseProfiles.length
                          selectedDatabaseProfiles.forEach(id => handleDeleteProfile(id))
                          setSelectedDatabaseProfiles([])
                          toast.success(language === 'hi' ? `${count} प्रोफाइल हटाई गई!` : `${count} profiles deleted!`)
                        }
                      }}
                    >
                      <Trash size={14} />
                      {language === 'hi' ? 'हटाएं' : 'Delete'}
                    </Button>
                    <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedDatabaseProfiles([])}
                      >
                        {t.close}
                      </Button>
                    </div>
                  )}
              </CardHeader>
              <CardContent>
                {filteredDatabaseProfiles.length === 0 ? (
                  <Alert>
                    <Info size={18} />
                    <AlertDescription>
                      {dbStatusFilter === 'all' 
                        ? (language === 'hi' ? 'कोई प्रोफाइल नहीं मिली।' : 'No profiles found.')
                        : (language === 'hi' ? `कोई ${dbStatusFilter === 'approved' ? 'स्वीकृत' : dbStatusFilter === 'pending' ? 'लंबित' : dbStatusFilter === 'rejected' ? 'अस्वीकृत' : 'हटाई गई'} प्रोफाइल नहीं।` : `No ${dbStatusFilter} profiles found.`)}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                  <div className="overflow-auto max-h-[70vh] sm:max-h-[600px] relative -mx-2 sm:mx-0">
                      <Table className="min-w-[900px] sm:min-w-[1200px] border-separate border-spacing-0">
                        <TableHeader className="sticky top-0 z-30 bg-background">
                          <TableRow>
                            <TableHead className="whitespace-nowrap w-8 sm:w-10 sticky left-0 z-40 bg-background border-r border-b">
                              <Checkbox 
                                checked={selectedDatabaseProfiles.length === filteredDatabaseProfiles.length && filteredDatabaseProfiles.length > 0}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedDatabaseProfiles(filteredDatabaseProfiles.map(p => p.id))
                                  } else {
                                    setSelectedDatabaseProfiles([])
                                  }
                                }}
                              />
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer hover:bg-muted/50 sticky left-8 sm:left-10 z-40 bg-background border-b" onClick={() => { setDbSortBy('profileId'); setDbSortOrder(prev => dbSortBy === 'profileId' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc') }}>
                              <div className="flex items-center gap-1">
                                {t.profileId}
                                {dbSortBy === 'profileId' ? (dbSortOrder === 'asc' ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />) : <CaretDown size={14} className="opacity-30" />}
                              </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer hover:bg-muted/50 sticky left-[6rem] sm:left-[7.5rem] z-40 bg-background min-w-[100px] sm:min-w-[120px] border-b" onClick={() => { setDbSortBy('name'); setDbSortOrder(prev => dbSortBy === 'name' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc') }}>
                              <div className="flex items-center gap-1">
                                {t.name}
                                {dbSortBy === 'name' ? (dbSortOrder === 'asc' ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />) : <CaretDown size={14} className="opacity-30" />}
                              </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer hover:bg-muted/50 sticky left-[12rem] sm:left-[15rem] z-40 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b" onClick={() => { setDbSortBy('gender'); setDbSortOrder(prev => dbSortBy === 'gender' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc') }}>
                              <div className="flex items-center gap-1">
                                {t.gender}
                                {dbSortBy === 'gender' ? (dbSortOrder === 'asc' ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />) : <CaretDown size={14} className="opacity-30" />}
                              </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer hover:bg-muted/50 bg-background border-b" onClick={() => { setDbSortBy('plan'); setDbSortOrder(prev => dbSortBy === 'plan' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc') }}>
                              <div className="flex items-center gap-1">
                                {t.planType}
                                {dbSortBy === 'plan' ? (dbSortOrder === 'asc' ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />) : <CaretDown size={14} className="opacity-30" />}
                              </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer hover:bg-muted/50 bg-background border-b" onClick={() => { setDbSortBy('userId'); setDbSortOrder(prev => dbSortBy === 'userId' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc') }}>
                              <div className="flex items-center gap-1">
                                {t.userId}
                                {dbSortBy === 'userId' ? (dbSortOrder === 'asc' ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />) : <CaretDown size={14} className="opacity-30" />}
                              </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer hover:bg-muted/50 bg-background border-b" onClick={() => { setDbSortBy('relation'); setDbSortOrder(prev => dbSortBy === 'relation' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc') }}>
                              <div className="flex items-center gap-1">
                                {t.relation}
                                {dbSortBy === 'relation' ? (dbSortOrder === 'asc' ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />) : <CaretDown size={14} className="opacity-30" />}
                              </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer hover:bg-muted/50 bg-background border-b" onClick={() => { setDbSortBy('age'); setDbSortOrder(prev => dbSortBy === 'age' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc') }}>
                              <div className="flex items-center gap-1">
                                {t.age}
                                {dbSortBy === 'age' ? (dbSortOrder === 'asc' ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />) : <CaretDown size={14} className="opacity-30" />}
                              </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer hover:bg-muted/50 bg-background border-b" onClick={() => { setDbSortBy('location'); setDbSortOrder(prev => dbSortBy === 'location' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc') }}>
                              <div className="flex items-center gap-1">
                                {t.location}
                                {dbSortBy === 'location' ? (dbSortOrder === 'asc' ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />) : <CaretDown size={14} className="opacity-30" />}
                              </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer hover:bg-muted/50 bg-background border-b" onClick={() => { setDbSortBy('status'); setDbSortOrder(prev => dbSortBy === 'status' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc') }}>
                              <div className="flex items-center gap-1">
                                {t.status}
                                {dbSortBy === 'status' ? (dbSortOrder === 'asc' ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />) : <CaretDown size={14} className="opacity-30" />}
                              </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer hover:bg-muted/50 bg-background border-b" onClick={() => { setDbSortBy('email'); setDbSortOrder(prev => dbSortBy === 'email' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc') }}>
                              <div className="flex items-center gap-1">
                                {t.email}
                                {dbSortBy === 'email' ? (dbSortOrder === 'asc' ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />) : <CaretDown size={14} className="opacity-30" />}
                              </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer hover:bg-muted/50 bg-background border-b" onClick={() => { setDbSortBy('mobile'); setDbSortOrder(prev => dbSortBy === 'mobile' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc') }}>
                              <div className="flex items-center gap-1">
                                {t.mobile}
                                {dbSortBy === 'mobile' ? (dbSortOrder === 'asc' ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />) : <CaretDown size={14} className="opacity-30" />}
                              </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer hover:bg-muted/50 bg-background border-b" onClick={() => { setDbSortBy('createdAt'); setDbSortOrder(prev => dbSortBy === 'createdAt' ? (prev === 'asc' ? 'desc' : 'asc') : 'desc') }}>
                              <div className="flex items-center gap-1">
                                {t.createdAt}
                                {dbSortBy === 'createdAt' ? (dbSortOrder === 'asc' ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />) : <CaretDown size={14} className="opacity-30" />}
                              </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap bg-background border-b">{t.actions}</TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                        {[...filteredDatabaseProfiles].sort((a, b) => {
                          let comparison = 0
                          const aUserId = users?.find(u => u.profileId === a.id)?.userId || ''
                          const bUserId = users?.find(u => u.profileId === b.id)?.userId || ''
                          
                          switch (dbSortBy) {
                            case 'profileId':
                              comparison = (a.profileId || '').localeCompare(b.profileId || '')
                              break
                            case 'name':
                              comparison = (a.fullName || '').localeCompare(b.fullName || '')
                              break
                            case 'gender':
                              comparison = (a.gender || '').localeCompare(b.gender || '')
                              break
                            case 'plan': {
                              const planOrder = { 'free': 0, '6-month': 1, '1-year': 2 }
                              comparison = (planOrder[a.membershipPlan || 'free'] || 0) - (planOrder[b.membershipPlan || 'free'] || 0)
                              break
                            }
                            case 'userId':
                              comparison = aUserId.localeCompare(bUserId)
                              break
                            case 'relation':
                              comparison = (a.relationToProfile || '').localeCompare(b.relationToProfile || '')
                              break
                            case 'age':
                              comparison = (a.age || 0) - (b.age || 0)
                              break
                            case 'location':
                              comparison = (a.location || '').localeCompare(b.location || '')
                              break
                            case 'status':
                              comparison = (a.status || '').localeCompare(b.status || '')
                              break
                            case 'email':
                              comparison = (a.email || '').localeCompare(b.email || '')
                              break
                            case 'mobile':
                              comparison = (a.mobile || '').localeCompare(b.mobile || '')
                              break
                            case 'createdAt':
                            default:
                              comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
                              break
                          }
                          return dbSortOrder === 'asc' ? comparison : -comparison
                        }).slice((databasePage - 1) * ITEMS_PER_PAGE, databasePage * ITEMS_PER_PAGE).map((profile) => {
                          const creds = getUserCredentials(profile.id)
                          return (
                            <TableRow key={profile.id} className={`${profile.isDeleted ? 'bg-red-50 dark:bg-red-950/20' : ''} ${selectedDatabaseProfiles.includes(profile.id) ? 'bg-primary/5' : ''} group`}>
                              <TableCell className={`sticky left-0 z-10 border-r w-8 sm:w-10 ${profile.isDeleted ? 'bg-red-50 dark:bg-red-950/20' : selectedDatabaseProfiles.includes(profile.id) ? 'bg-primary/5' : 'bg-background'} group-hover:bg-muted/50`}>
                                <Checkbox 
                                  checked={selectedDatabaseProfiles.includes(profile.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedDatabaseProfiles(prev => [...prev, profile.id])
                                    } else {
                                      setSelectedDatabaseProfiles(prev => prev.filter(id => id !== profile.id))
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell className={`font-mono font-semibold text-xs sm:text-sm sticky left-8 sm:left-10 z-10 ${profile.isDeleted ? 'bg-red-50 dark:bg-red-950/20 text-red-600' : selectedDatabaseProfiles.includes(profile.id) ? 'bg-primary/5' : 'bg-background'} group-hover:bg-muted/50`}>{profile.profileId}</TableCell>
                              <TableCell className={`font-medium sticky left-[6rem] sm:left-[7.5rem] z-10 min-w-[100px] sm:min-w-[120px] max-w-[120px] sm:max-w-[150px] truncate ${profile.isDeleted ? 'bg-red-50 dark:bg-red-950/20 text-red-600' : selectedDatabaseProfiles.includes(profile.id) ? 'bg-primary/5' : 'bg-background'} group-hover:bg-muted/50`} title={profile.fullName}>
                                {profile.fullName}
                                {profile.isDeleted && (
                                  <Badge variant="destructive" className="ml-1 sm:ml-2 text-xs">{language === 'hi' ? 'हटाया गया' : 'Deleted'}</Badge>
                                )}
                              </TableCell>
                              <TableCell className={`sticky left-[12rem] sm:left-[15rem] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${profile.isDeleted ? 'bg-red-50 dark:bg-red-950/20' : selectedDatabaseProfiles.includes(profile.id) ? 'bg-primary/5' : 'bg-background'} group-hover:bg-muted/50`}>
                                <Badge variant="outline" className={`text-xs sm:text-sm ${profile.gender === 'male' ? 'border-blue-500 text-blue-600' : 'border-pink-500 text-pink-600'}`}>
                                  {profile.gender === 'male' ? t.male : t.female}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  profile.membershipPlan === '1-year' ? 'default' :
                                  profile.membershipPlan === '6-month' ? 'secondary' :
                                  'outline'
                                } className={
                                  profile.membershipPlan === '1-year' ? 'bg-green-600' :
                                  profile.membershipPlan === '6-month' ? 'bg-blue-500 text-white' :
                                  ''
                                }>
                                  {profile.membershipPlan === '1-year' ? t.oneYearPlanLabel :
                                   profile.membershipPlan === '6-month' ? t.sixMonthPlanLabel :
                                   t.freePlanLabel}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-primary">{creds?.userId || '-'}</TableCell>
                              <TableCell className="text-sm">
                                {profile.relationToProfile || (language === 'hi' ? 'स्वयं' : 'Self')}
                              </TableCell>
                              <TableCell>{profile.age}</TableCell>
                              <TableCell className="text-sm">{profile.location}</TableCell>
                              <TableCell>
                              {profile.isDeleted ? (
                                <Badge variant="destructive">{language === 'hi' ? 'हटाया गया' : 'Deleted'}</Badge>
                              ) : profile.status === 'rejected' ? (
                                <Badge 
                                  variant="destructive" 
                                  className="cursor-pointer hover:bg-red-700 transition-colors"
                                  onClick={() => setShowRejectionReasonDialog(profile)}
                                  title={t.viewRejectionReason}
                                >
                                  {t.rejected}
                                </Badge>
                              ) : (
                                <Badge variant={
                                  profile.status === 'verified' ? 'default' :
                                  profile.status === 'pending' ? 'secondary' :
                                  'destructive'
                                } className={
                                  profile.status === 'verified' ? 'bg-green-600' : ''
                                }>
                                  {profile.status === 'verified' ? (language === 'hi' ? 'स्वीकृत' : 'Approved') :
                                   t.pending}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{profile.email}</TableCell>
                            <TableCell className="font-mono text-sm">{profile.mobile}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDateDDMMYYYY(profile.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setViewProfileDialog(profile)}
                                  title={t.viewProfile}
                                >
                                  <Eye size={16} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProfile(profile)
                                    setShowChatDialog(true)
                                  }}
                                  title={t.chat}
                                >
                                  <ChatCircle size={16} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setDigilockerProfile(profile)
                                    setShowDigilockerDialog(true)
                                  }}
                                  className={
                                    profile.digilockerVerified 
                                      ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                                      : profile.idProofUrl 
                                        ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50' 
                                        : 'text-gray-400 hover:text-gray-500'
                                  }
                                  title={
                                    profile.digilockerVerified 
                                      ? t.digilockerVerified 
                                      : profile.idProofUrl 
                                        ? (language === 'hi' ? 'ID प्रमाण अपलोड - सत्यापन लंबित' : 'ID Proof Uploaded - Pending Verification')
                                        : t.idProofNotUploaded
                                  }
                                >
                                  <ShieldCheck size={16} />
                                </Button>
                                {/* Photo Verification button (selfie vs uploaded photos) */}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setFaceVerificationDialog(profile)}
                                  className={profile.photoVerified === true ? 'text-green-600 hover:text-green-700' : profile.photoVerified === false ? 'text-red-500 hover:text-red-600' : 'text-amber-500 hover:text-amber-600'}
                                  title={profile.photoVerified === true ? t.photoVerifiedBadge : t.verifyFace}
                                >
                                  <ScanSmiley size={16} />
                                </Button>
                                {/* Login as User button */}
                                {onLoginAsUser && creds?.userId && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => onLoginAsUser(creds.userId)}
                                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                    title={t.loginAsUser}
                                  >
                                    <Key size={16} />
                                  </Button>
                                )}
                                {/* Unblock button for blocked profiles */}
                                {profile.isBlocked && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleUnblock(profile)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title={t.unblock}
                                  >
                                    <ArrowCounterClockwise size={16} />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleOpenAdminEdit(profile)}
                                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                  title={t.adminEditProfile}
                                >
                                  <UserIcon size={16} />
                                </Button>
                                {/* Conditional actions based on profile status */}
                                {profile.isDeleted ? (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleRestoreProfile(profile.id)}
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      title={t.restoreProfile}
                                    >
                                      <ArrowCounterClockwise size={16} />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handlePermanentDelete(profile.id)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title={t.permanentDelete}
                                    >
                                      <Trash size={16} weight="fill" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeleteProfile(profile.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title={t.deleteProfile}
                                  >
                                    <Trash size={16} />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationControls
                    currentPage={databasePage}
                    totalItems={filteredDatabaseProfiles.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setDatabasePage}
                  />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChatCircle size={24} weight="fill" />
                  {t.adminChat}
                </CardTitle>
                <CardDescription>
                  {language === 'hi' ? 'सभी उपयोगकर्ताओं के साथ चैट करें' : 'Chat with all users'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Broadcast Message Button */}
                <div className="mb-4">
                  <Button 
                    onClick={() => setShowBroadcastDialog(true)}
                    className="gap-2 bg-accent hover:bg-accent/90"
                  >
                    <Bell size={18} weight="fill" />
                    {t.broadcastMessage}
                  </Button>
                </div>
                <Chat 
                  currentUserProfile={adminProfile}
                  profiles={profiles || []}
                  language={language}
                  isAdmin={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accounts & Payments Tab */}
          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CurrencyCircleDollar size={24} weight="fill" className="text-green-600" />
                      {t.accounts}
                    </CardTitle>
                    <CardDescription>{t.accountsDescription}</CardDescription>
                  </div>
                  <Button onClick={() => {
                    setPaymentFormData({
                      transactionId: '',
                      profileId: '',
                      plan: '6-month',
                      amount: membershipSettings?.sixMonthPrice || 500,
                      discountAmount: 0,
                      paymentMode: 'upi',
                      paymentDate: new Date().toISOString().split('T')[0],
                      notes: ''
                    })
                    setShowPaymentFormDialog(true)
                  }} className="gap-2 bg-green-600 hover:bg-green-700">
                    <Plus size={18} />
                    {t.recordPayment}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Revenue Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-600 rounded-lg">
                          <ChartLine size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t.thisMonth}</p>
                          <p className="text-2xl font-bold text-green-600">
                            ₹{(paymentTransactions || [])
                              .filter(tx => {
                                const txDate = new Date(tx.paymentDate)
                                const now = new Date()
                                return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()
                              })
                              .reduce((sum, tx) => sum + tx.finalAmount, 0)
                              .toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                          <Calendar size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t.thisYear}</p>
                          <p className="text-2xl font-bold text-blue-600">
                            ₹{(paymentTransactions || [])
                              .filter(tx => new Date(tx.paymentDate).getFullYear() === new Date().getFullYear())
                              .reduce((sum, tx) => sum + tx.finalAmount, 0)
                              .toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-600 rounded-lg">
                          <CurrencyInr size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t.allTime}</p>
                          <p className="text-2xl font-bold text-purple-600">
                            ₹{(paymentTransactions || [])
                              .reduce((sum, tx) => sum + tx.finalAmount, 0)
                              .toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-600 rounded-lg">
                          <Receipt size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{language === 'hi' ? 'कुल लेन-देन' : 'Total Transactions'}</p>
                          <p className="text-2xl font-bold text-amber-600">
                            {(paymentTransactions || []).length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Refund & Net Revenue Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600 rounded-lg">
                          <ArrowCounterClockwise size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t.totalRefunds}</p>
                          <p className="text-2xl font-bold text-red-600">
                            ₹{(paymentTransactions || [])
                              .filter(tx => tx.isRefunded)
                              .reduce((sum, tx) => sum + (tx.refundAmount || 0), 0)
                              .toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-600 rounded-lg">
                          <ChartLine size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t.netRevenue}</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            ₹{((paymentTransactions || []).reduce((sum, tx) => sum + tx.finalAmount, 0) -
                               (paymentTransactions || []).filter(tx => tx.isRefunded).reduce((sum, tx) => sum + (tx.refundAmount || 0), 0))
                              .toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{language === 'hi' ? 'रिफंड किए गए' : 'Refunded'}</span>
                        <Badge variant="destructive" className="text-lg">
                          {(paymentTransactions || []).filter(tx => tx.isRefunded).length}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Member Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t.freeMembers}</span>
                        <Badge variant="secondary" className="text-lg">
                          {profiles?.filter(p => p.membershipPlan === 'free' && !p.isDeleted).length || 0}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t.paidMembers}</span>
                        <Badge className="text-lg bg-green-600">
                          {profiles?.filter(p => (p.membershipPlan === '6-month' || p.membershipPlan === '1-year') && !p.isDeleted).length || 0}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Pending Payment Verification Section */}
                {(() => {
                  const pendingPayments = profiles?.filter(p => 
                    p.membershipPlan && 
                    p.membershipPlan !== 'free' && 
                    p.paymentScreenshotUrl && 
                    (p.paymentStatus === 'pending' || !p.paymentStatus) &&
                    !p.isDeleted
                  ) || []
                  
                  const rejectedPayments = profiles?.filter(p => 
                    p.membershipPlan && 
                    p.membershipPlan !== 'free' && 
                    p.paymentStatus === 'rejected' &&
                    !p.isDeleted
                  ) || []

                  return (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CurrencyInr size={20} className="text-amber-600" />
                        {language === 'hi' ? 'भुगतान सत्यापन लंबित' : 'Pending Payment Verification'}
                        {pendingPayments.length > 0 && (
                          <Badge variant="destructive">{pendingPayments.length}</Badge>
                        )}
                      </h3>

                      {pendingPayments.length === 0 && rejectedPayments.length === 0 ? (
                        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20">
                          <CheckCircle size={16} className="text-green-600" />
                          <AlertDescription className="text-green-700">
                            {language === 'hi' ? 'कोई लंबित भुगतान सत्यापन नहीं!' : 'No pending payment verifications!'}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-3">
                          {/* Pending Payments */}
                          {pendingPayments.map(profile => (
                            <Card key={profile.id} className="border-amber-300 bg-amber-50/50 dark:bg-amber-900/10 overflow-hidden">
                              <CardContent className="p-3 sm:p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                  {/* Payment Screenshot Thumbnail */}
                                  <div className="shrink-0 flex items-start gap-3">
                                    {profile.paymentScreenshotUrl && (
                                      <img 
                                        src={profile.paymentScreenshotUrl} 
                                        alt="Payment Screenshot"
                                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border-2 border-amber-400 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => {
                                          setPaymentViewProfile(profile)
                                          setPaymentRejectionReason('')
                                          setShowPaymentViewDialog(true)
                                        }}
                                      />
                                    )}
                                    {/* Mobile: Show name next to image */}
                                    <div className="sm:hidden flex-1 min-w-0">
                                      <h4 className="font-bold truncate">{profile.fullName}</h4>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        <Badge variant="outline" className="text-xs">{profile.profileId}</Badge>
                                        <Badge className={`text-xs ${profile.membershipPlan === '1-year' ? 'bg-accent text-accent-foreground' : 'bg-primary'}`}>
                                          {profile.membershipPlan === '6-month' ? (language === 'hi' ? '6 महीने' : '6 Month') : (language === 'hi' ? '1 वर्ष' : '1 Year')}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs bg-amber-500 text-white">
                                          {language === 'hi' ? '₹ लंबित' : '₹ Pending'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Profile Info - Desktop */}
                                  <div className="flex-1 min-w-0 hidden sm:block">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <h4 className="font-bold">{profile.fullName}</h4>
                                      <Badge variant="outline" className="text-xs">{profile.profileId}</Badge>
                                      <Badge className={profile.membershipPlan === '1-year' ? 'bg-accent text-accent-foreground' : 'bg-primary'}>
                                        {profile.membershipPlan === '6-month' ? (language === 'hi' ? '6 महीने' : '6 Month') : (language === 'hi' ? '1 वर्ष' : '1 Year')}
                                      </Badge>
                                      <Badge variant="secondary" className="bg-amber-500 text-white">
                                        {language === 'hi' ? '₹ लंबित' : '₹ Pending'}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      <span>{language === 'hi' ? 'राशि:' : 'Amount:'} </span>
                                      <span className="font-semibold text-foreground">
                                        ₹{profile.paymentAmount?.toLocaleString('en-IN') || (profile.membershipPlan === '1-year' ? (membershipSettings?.oneYearPrice || 900) : (membershipSettings?.sixMonthPrice || 500))}
                                      </span>
                                      <span className="mx-2">|</span>
                                      <span>{language === 'hi' ? 'अपलोड:' : 'Uploaded:'} </span>
                                      <span>{profile.paymentUploadedAt ? formatDateDDMMYYYY(profile.paymentUploadedAt) : '-'}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Amount info - Mobile only */}
                                  <div className="sm:hidden text-sm text-muted-foreground">
                                    <span>{language === 'hi' ? 'राशि:' : 'Amount:'} </span>
                                    <span className="font-semibold text-foreground">
                                      ₹{profile.paymentAmount?.toLocaleString('en-IN') || (profile.membershipPlan === '1-year' ? (membershipSettings?.oneYearPrice || 900) : (membershipSettings?.sixMonthPrice || 500))}
                                    </span>
                                    <span className="mx-2">|</span>
                                    <span>{language === 'hi' ? 'अपलोड:' : 'Uploaded:'} </span>
                                    <span>{profile.paymentUploadedAt ? formatDateDDMMYYYY(profile.paymentUploadedAt) : '-'}</span>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-2 sm:shrink-0">
                                    <Button 
                                      size="sm"
                                      className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                                      onClick={() => {
                                        const now = new Date()
                                        const monthsToAdd = profile.membershipPlan === '1-year' ? 12 : 6
                                        const expiryDate = new Date(now)
                                        expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd)
                                        
                                        setProfiles((current) => 
                                          (current || []).map(p => 
                                            p.id === profile.id 
                                              ? { 
                                                  ...p, 
                                                  paymentStatus: 'verified' as const,
                                                  paymentVerifiedAt: now.toISOString(),
                                                  paymentVerifiedBy: 'Admin',
                                                  paymentAmount: profile.paymentAmount || (profile.membershipPlan === '1-year' ? (membershipSettings?.oneYearPrice || 900) : (membershipSettings?.sixMonthPrice || 500)),
                                                  hasMembership: true,
                                                  membershipStartDate: now.toISOString(),
                                                  membershipEndDate: expiryDate.toISOString()
                                                } 
                                              : p
                                          )
                                        )
                                        // Create payment transaction and auto-generate invoice
                                        createPaymentTransactionForVerification(profile, false)
                                        toast.success(language === 'hi' ? 'भुगतान सत्यापित! सदस्यता सक्रिय की गई।' : 'Payment verified! Membership activated.')
                                      }}
                                    >
                                      <CheckCircle size={16} className="mr-1" />
                                      {language === 'hi' ? 'सत्यापित करें' : 'Verify'}
                                    </Button>
                                    <Button 
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 sm:flex-none"
                                      onClick={() => {
                                        setPaymentViewProfile(profile)
                                        setPaymentRejectionReason('')
                                        setShowPaymentViewDialog(true)
                                      }}
                                    >
                                      <Eye size={16} className="mr-1" />
                                      {language === 'hi' ? 'देखें' : 'View'}
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}

                          {/* Rejected Payments */}
                          {rejectedPayments.length > 0 && (
                            <>
                              <h4 className="text-md font-semibold flex items-center gap-2 mt-4">
                                <XCircle size={18} className="text-red-600" />
                                {language === 'hi' ? 'अस्वीकृत भुगतान' : 'Rejected Payments'}
                                <Badge variant="destructive">{rejectedPayments.length}</Badge>
                              </h4>
                              {rejectedPayments.map(profile => (
                                <Card key={profile.id} className="border-red-300 bg-red-50/50 dark:bg-red-900/10">
                                  <CardContent className="p-3 sm:p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                          <h4 className="font-bold truncate">{profile.fullName}</h4>
                                          <Badge variant="outline" className="text-xs">{profile.profileId}</Badge>
                                          <Badge variant="destructive" className="text-xs">{language === 'hi' ? '₹ अस्वीकृत' : '₹ Rejected'}</Badge>
                                        </div>
                                        {profile.paymentRejectionReason && (
                                          <p className="text-sm text-red-600 break-words">
                                            <span className="font-semibold">{language === 'hi' ? 'कारण:' : 'Reason:'}</span> {profile.paymentRejectionReason}
                                          </p>
                                        )}
                                      </div>
                                      <Button 
                                        size="sm"
                                        variant="outline"
                                        className="w-full sm:w-auto shrink-0"
                                        onClick={() => {
                                          setPaymentViewProfile(profile)
                                          setPaymentRejectionReason('')
                                          setShowPaymentViewDialog(true)
                                        }}
                                      >
                                        <Eye size={16} className="mr-1" />
                                        {language === 'hi' ? 'देखें' : 'View'}
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Pending Renewal Payments Section */}
                {(() => {
                  const pendingRenewals = profiles?.filter(p => 
                    p.renewalPaymentScreenshotUrl && 
                    p.renewalPaymentStatus === 'pending' &&
                    !p.isDeleted
                  ) || []

                  if (pendingRenewals.length === 0) return null

                  return (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <ArrowCounterClockwise size={20} className="text-blue-600" />
                        {language === 'hi' ? 'नवीनीकरण भुगतान लंबित' : 'Pending Renewal Payments'}
                        <Badge variant="destructive">{pendingRenewals.length}</Badge>
                      </h3>

                      <div className="space-y-3">
                        {pendingRenewals.map(profile => (
                          <Card key={profile.id} className="border-blue-300 bg-blue-50/50 dark:bg-blue-900/10 overflow-hidden">
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                {/* Renewal Screenshot Thumbnail */}
                                <div className="shrink-0 flex items-start gap-3">
                                  <img 
                                    src={profile.renewalPaymentScreenshotUrl} 
                                    alt="Renewal Payment Screenshot"
                                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border-2 border-blue-400 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => openLightbox([profile.renewalPaymentScreenshotUrl!], 0)}
                                  />
                                  {/* Mobile: Show name next to image */}
                                  <div className="sm:hidden flex-1 min-w-0">
                                    <h4 className="font-bold truncate">{profile.fullName}</h4>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      <Badge variant="outline" className="text-xs">{profile.profileId}</Badge>
                                      <Badge className={`text-xs ${profile.membershipPlan === '1-year' ? 'bg-accent text-accent-foreground' : 'bg-primary'}`}>
                                        {profile.membershipPlan === '6-month' ? (language === 'hi' ? '6 महीने' : '6 Month') : (language === 'hi' ? '1 वर्ष' : '1 Year')}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs bg-blue-500 text-white">
                                        <ArrowCounterClockwise size={10} className="mr-1" />
                                        {language === 'hi' ? 'नवीनीकरण' : 'Renewal'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {/* Profile Info - Desktop */}
                                <div className="flex-1 min-w-0 hidden sm:block">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h4 className="font-bold">{profile.fullName}</h4>
                                    <Badge variant="outline" className="text-xs">{profile.profileId}</Badge>
                                    <Badge className={profile.membershipPlan === '1-year' ? 'bg-accent text-accent-foreground' : 'bg-primary'}>
                                      {profile.membershipPlan === '6-month' ? (language === 'hi' ? '6 महीने' : '6 Month') : (language === 'hi' ? '1 वर्ष' : '1 Year')}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-blue-500 text-white">
                                      <ArrowCounterClockwise size={12} className="mr-1" />
                                      {language === 'hi' ? 'नवीनीकरण' : 'Renewal'}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    <span>{language === 'hi' ? 'राशि:' : 'Amount:'} </span>
                                    <span className="font-semibold text-foreground">
                                      ₹{profile.renewalPaymentAmount?.toLocaleString('en-IN') || (profile.membershipPlan === '1-year' ? (membershipSettings?.oneYearPrice || 900) : (membershipSettings?.sixMonthPrice || 500))}
                                    </span>
                                    <span className="mx-2">|</span>
                                    <span>{language === 'hi' ? 'अपलोड:' : 'Uploaded:'} </span>
                                    <span>{profile.renewalPaymentUploadedAt ? formatDateDDMMYYYY(profile.renewalPaymentUploadedAt) : '-'}</span>
                                  </div>
                                </div>
                                
                                {/* Amount info - Mobile only */}
                                <div className="sm:hidden text-sm text-muted-foreground">
                                  <span>{language === 'hi' ? 'राशि:' : 'Amount:'} </span>
                                  <span className="font-semibold text-foreground">
                                    ₹{profile.renewalPaymentAmount?.toLocaleString('en-IN') || (profile.membershipPlan === '1-year' ? (membershipSettings?.oneYearPrice || 900) : (membershipSettings?.sixMonthPrice || 500))}
                                  </span>
                                  <span className="mx-2">|</span>
                                  <span>{language === 'hi' ? 'अपलोड:' : 'Uploaded:'} </span>
                                  <span>{profile.renewalPaymentUploadedAt ? formatDateDDMMYYYY(profile.renewalPaymentUploadedAt) : '-'}</span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 sm:shrink-0">
                                  <Button 
                                    size="sm"
                                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      const now = new Date()
                                      const monthsToAdd = profile.membershipPlan === '1-year' ? 12 : 6
                                      const expiryDate = new Date(now)
                                      expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd)
                                      
                                      setProfiles((current) => 
                                        (current || []).map(p => 
                                          p.id === profile.id 
                                            ? { 
                                                ...p, 
                                                renewalPaymentStatus: 'verified' as const,
                                                renewalPaymentVerifiedAt: now.toISOString(),
                                                paymentStatus: 'verified' as const,
                                                paymentVerifiedAt: now.toISOString(),
                                                paymentVerifiedBy: 'Admin',
                                                hasMembership: true,
                                                membershipStartDate: now.toISOString(),
                                                membershipEndDate: expiryDate.toISOString(),
                                                membershipExpiry: expiryDate.toISOString()
                                              } 
                                            : p
                                        )
                                      )
                                      // Create payment transaction and auto-generate invoice for renewal
                                      createPaymentTransactionForVerification(profile, true)
                                      toast.success(language === 'hi' ? 'नवीनीकरण भुगतान सत्यापित! सदस्यता नवीनीकृत।' : 'Renewal payment verified! Membership renewed.')
                                    }}
                                  >
                                    <CheckCircle size={16} className="mr-1" />
                                    {language === 'hi' ? 'सत्यापित करें' : 'Verify'}
                                  </Button>
                                  <Button 
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1 sm:flex-none"
                                    onClick={() => {
                                      const reason = prompt(language === 'hi' ? 'अस्वीकृति का कारण दर्ज करें:' : 'Enter rejection reason:')
                                      if (reason) {
                                        setProfiles((current) => 
                                          (current || []).map(p => 
                                            p.id === profile.id 
                                              ? { 
                                                  ...p, 
                                                  renewalPaymentStatus: 'rejected' as const,
                                                  renewalPaymentRejectionReason: reason
                                                } 
                                              : p
                                          )
                                        )
                                        toast.success(language === 'hi' ? 'नवीनीकरण भुगतान अस्वीकृत।' : 'Renewal payment rejected.')
                                      }
                                    }}
                                  >
                                    <XCircle size={16} className="mr-1" />
                                    {language === 'hi' ? 'अस्वीकार करें' : 'Reject'}
                                  </Button>
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openLightbox([profile.renewalPaymentScreenshotUrl!], 0)}
                                  >
                                    <Eye size={16} className="mr-1" />
                                    {language === 'hi' ? 'देखें' : 'View'}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Transactions Table */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Receipt size={20} />
                      {t.recentTransactions}
                    </h3>
                    {paymentTransactions && paymentTransactions.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(language === 'hi' ? 'क्या आप सभी लेन-देन रीसेट करना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती।' : 'Reset all transactions? This cannot be undone.')) {
                            setPaymentTransactions([])
                            // Also clear payment receipts from profiles
                            setProfiles((current) => 
                              (current || []).map(p => ({
                                ...p,
                                paymentReceipt: undefined,
                                paymentReceiptUrl: undefined,
                                paymentVerified: undefined,
                                paymentVerifiedAt: undefined,
                                paymentRejected: undefined,
                                paymentRejectedReason: undefined
                              }))
                            )
                            toast.success(language === 'hi' ? 'सभी लेन-देन रीसेट!' : 'All transactions reset!')
                          }
                        }}
                      >
                        <Trash size={14} className="mr-1" />
                        {language === 'hi' ? 'रीसेट करें' : 'Reset All'}
                      </Button>
                    )}
                  </div>
                  
                  {(!paymentTransactions || paymentTransactions.length === 0) ? (
                    <Alert>
                      <Info size={16} />
                      <AlertDescription>{t.noTransactions}</AlertDescription>
                    </Alert>
                  ) : (
                    <>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t.receiptNumber}</TableHead>
                            <TableHead>{t.transactionId}</TableHead>
                            <TableHead>{t.name}</TableHead>
                            <TableHead>{t.membershipPlan}</TableHead>
                            <TableHead>{t.finalAmount}</TableHead>
                            <TableHead>{t.paymentMode}</TableHead>
                            <TableHead>{t.paymentDate}</TableHead>
                            <TableHead>{t.actions}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...paymentTransactions].reverse().slice((transactionsPage - 1) * ITEMS_PER_PAGE, transactionsPage * ITEMS_PER_PAGE).map(tx => (
                            <TableRow key={tx.id}>
                              <TableCell className="font-mono text-xs">{tx.receiptNumber}</TableCell>
                              <TableCell className="font-mono text-xs">{tx.transactionId}</TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{tx.profileName}</div>
                                  <div className="text-xs text-muted-foreground">{tx.profileId}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={tx.plan === 'free' ? 'secondary' : 'default'}>
                                  {tx.plan === 'free' ? t.freePlan : tx.plan === '6-month' ? t.sixMonthPlan : t.oneYearPlan}
                                </Badge>
                              </TableCell>
                              <TableCell className={`font-bold ${tx.isRefunded ? 'text-red-600 line-through' : 'text-green-600'}`}>
                                ₹{tx.finalAmount}
                                {tx.isRefunded && (
                                  <Badge variant="destructive" className="ml-2 text-xs">{t.refunded}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {tx.paymentMode === 'cash' ? t.cash :
                                   tx.paymentMode === 'upi' ? t.upi :
                                   tx.paymentMode === 'card' ? t.card :
                                   tx.paymentMode === 'netbanking' ? t.netbanking :
                                   tx.paymentMode === 'cheque' ? t.cheque : t.other}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDateDDMMYYYY(tx.paymentDate)}</TableCell>
                              <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedTransaction(tx)
                                      setShowReceiptDialog(true)
                                    }}
                                    className="gap-1"
                                  >
                                    <Eye size={14} />
                                    {t.viewReceipt}
                                  </Button>
                                  {!tx.isRefunded && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedTransaction(tx)
                                        setRefundFormData({
                                          refundAmount: tx.finalAmount,
                                          refundReason: '',
                                          refundTransactionId: ''
                                        })
                                        setShowRefundDialog(true)
                                      }}
                                      className="gap-1 text-red-600 border-red-300 hover:bg-red-50"
                                    >
                                      <ArrowCounterClockwise size={14} />
                                      {t.refund}
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowDeleteTransactionDialog(tx)}
                                    className="gap-1 text-red-600 border-red-300 hover:bg-red-50"
                                    title={language === 'hi' ? 'हटाएं' : 'Delete'}
                                  >
                                    <Trash size={14} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <PaginationControls
                      currentPage={transactionsPage}
                      totalItems={paymentTransactions?.length || 0}
                      itemsPerPage={ITEMS_PER_PAGE}
                      onPageChange={setTransactionsPage}
                    />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab - Admin reviews user reports */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <ShieldWarning size={24} weight="fill" />
                      {t.reportedUsers}
                    </CardTitle>
                    <CardDescription>
                      {blockedProfiles?.filter(b => b.reportedToAdmin).length || 0} {language === 'hi' ? 'कुल रिपोर्ट' : 'total reports'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const reports = blockedProfiles?.filter(b => b.reportedToAdmin) || []
                  
                  if (reports.length === 0) {
                    return (
                      <div className="text-center py-12 text-muted-foreground">
                        <ShieldWarning size={48} className="mx-auto mb-4 opacity-50" weight="light" />
                        <p>{t.noReports}</p>
                      </div>
                    )
                  }

                  // Helper to get report reason label
                  const getReportReasonLabel = (reason: ReportReason | undefined) => {
                    switch (reason) {
                      case 'inappropriate-messages': return t.inappropriateMessages
                      case 'fake-profile': return t.fakeProfile
                      case 'harassment': return t.harassment
                      case 'spam': return t.spam
                      case 'offensive-content': return t.offensiveContent
                      case 'other': return t.otherReason
                      default: return t.otherReason
                    }
                  }

                  // Get profile by profileId
                  const getProfileByProfileId = (profileId: string) => 
                    profiles?.find(p => p.profileId === profileId)

                  // Handle admin actions
                  const handleDismissReport = (reportId: string) => {
                    setBlockedProfiles(current => 
                      (current || []).map(b => 
                        b.id === reportId 
                          ? { ...b, adminReviewed: true, adminReviewedAt: new Date().toISOString(), adminAction: 'dismissed' as const }
                          : b
                      )
                    )
                    toast.success(t.reportDismissed)
                  }

                  const handleWarnUser = (reportId: string, reportedProfileId: string) => {
                    setBlockedProfiles(current => 
                      (current || []).map(b => 
                        b.id === reportId 
                          ? { ...b, adminReviewed: true, adminReviewedAt: new Date().toISOString(), adminAction: 'warned' as const }
                          : b
                      )
                    )
                    // Send warning message to reported user
                    const warningMessage: ChatMessage = {
                      id: `msg-${Date.now()}`,
                      fromProfileId: 'admin',
                      toProfileId: reportedProfileId,
                      type: 'admin-to-user',
                      message: language === 'hi' 
                        ? '⚠️ चेतावनी: आपकी प्रोफाइल के बारे में एक शिकायत प्राप्त हुई है। कृपया सभी उपयोगकर्ताओं के साथ सम्मानजनक व्यवहार करें। बार-बार शिकायतों पर आपकी प्रोफाइल को हटाया जा सकता है।'
                        : '⚠️ Warning: A complaint has been received about your profile. Please be respectful to all users. Repeated complaints may result in profile removal.',
                      timestamp: new Date().toISOString(),
                      createdAt: new Date().toISOString(),
                    }
                    setMessages(current => [...(current || []), warningMessage])
                    toast.success(t.userWarned)
                  }

                  const handleRemoveProfile = (reportId: string, reportedProfileId: string) => {
                    if (!confirm(t.deleteConfirm)) return
                    
                    setBlockedProfiles(current => 
                      (current || []).map(b => 
                        b.id === reportId 
                          ? { ...b, adminReviewed: true, adminReviewedAt: new Date().toISOString(), adminAction: 'removed' as const }
                          : b
                      )
                    )
                    // Soft delete the reported profile
                    const reportedProfile = profiles?.find(p => p.profileId === reportedProfileId)
                    if (reportedProfile) {
                      setProfiles(current => 
                        (current || []).map(p => 
                          p.profileId === reportedProfileId 
                            ? { 
                                ...p, 
                                isDeleted: true, 
                                deletedAt: new Date().toISOString(),
                                deletedReason: language === 'hi' ? 'उपयोगकर्ता रिपोर्ट के कारण हटाया गया' : 'Removed due to user report'
                              }
                            : p
                        )
                      )
                    }
                    toast.success(t.profileRemoved)
                  }

                  // View chat history between two users
                  const handleViewChatHistory = (reporterProfileId: string, reportedProfileId: string) => {
                    setChatHistoryParticipants({ reporter: reporterProfileId, reported: reportedProfileId })
                    setShowChatHistoryDialog(true)
                  }

                  // Sort reports: pending first, then by date
                  const sortedReports = [...reports].sort((a, b) => {
                    if (a.adminReviewed !== b.adminReviewed) return a.adminReviewed ? 1 : -1
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  })
                  
                  // Paginate reports
                  const paginatedReports = sortedReports.slice((reportsPage - 1) * ITEMS_PER_PAGE, reportsPage * ITEMS_PER_PAGE)

                  return (
                    <div className="space-y-4">
                      {paginatedReports.map(report => {
                        const reporterProfile = getProfileByProfileId(report.blockerProfileId)
                        const reportedProfile = getProfileByProfileId(report.blockedProfileId)
                        
                        return (
                          <div 
                            key={report.id} 
                            className={`border rounded-lg p-4 ${
                              report.adminReviewed 
                                ? 'bg-muted/30 border-muted' 
                                : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
                            }`}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                              {/* Report Details */}
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                  {!report.adminReviewed && (
                                    <Badge variant="destructive" className="gap-1">
                                      <Warning size={12} weight="fill" />
                                      {t.pendingReview}
                                    </Badge>
                                  )}
                                  {report.adminReviewed && (
                                    <Badge variant="secondary" className="gap-1">
                                      <CheckCircle size={12} weight="fill" />
                                      {t.reviewed} - {
                                        report.adminAction === 'dismissed' ? t.dismissReport :
                                        report.adminAction === 'warned' ? t.warnUser :
                                        report.adminAction === 'removed' ? t.removeProfile : ''
                                      }
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="gap-1">
                                    {getReportReasonLabel(report.reportReason)}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Reporter */}
                                  <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                      <span className="text-xs text-muted-foreground">{t.reporter}</span>
                                      <div className="flex items-center gap-2">
                                        {reporterProfile?.photos?.[0] ? (
                                          <img src={reporterProfile.photos[0]} alt="" className="h-8 w-8 rounded-full object-cover" />
                                        ) : (
                                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                            {reporterProfile?.fullName?.[0] || '?'}
                                          </div>
                                        )}
                                        <span className="font-medium">{reporterProfile?.fullName || report.blockerProfileId}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Reported */}
                                  <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                      <span className="text-xs text-muted-foreground">{t.reported}</span>
                                      <div className="flex items-center gap-2">
                                        {reportedProfile?.photos?.[0] ? (
                                          <img src={reportedProfile.photos[0]} alt="" className="h-8 w-8 rounded-full object-cover" />
                                        ) : (
                                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                            {reportedProfile?.fullName?.[0] || '?'}
                                          </div>
                                        )}
                                        <span className="font-medium text-destructive">{reportedProfile?.fullName || report.blockedProfileId}</span>
                                        {reportedProfile?.isDeleted && (
                                          <Badge variant="destructive" className="text-xs">
                                            {language === 'hi' ? 'हटाया गया' : 'Removed'}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {report.reportDescription && (
                                  <div className="text-sm bg-background p-2 rounded border">
                                    <span className="font-medium">{t.reportDescription}:</span> {report.reportDescription}
                                  </div>
                                )}

                                <div className="text-xs text-muted-foreground">
                                  {t.reportDate}: {formatDateDDMMYYYY(report.createdAt)}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-wrap gap-2 lg:flex-col lg:min-w-[140px]">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => handleViewChatHistory(report.blockerProfileId, report.blockedProfileId)}
                                >
                                  <Eye size={14} />
                                  {t.viewChatHistory}
                                </Button>
                                
                                {!report.adminReviewed && (
                                  <>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      className="gap-1"
                                      onClick={() => handleDismissReport(report.id)}
                                    >
                                      <XCircle size={14} />
                                      {t.dismissReport}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1 text-amber-600 border-amber-300 hover:bg-amber-50"
                                      onClick={() => handleWarnUser(report.id, report.blockedProfileId)}
                                    >
                                      <Warning size={14} weight="fill" />
                                      {t.warnUser}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="gap-1"
                                      onClick={() => handleRemoveProfile(report.id, report.blockedProfileId)}
                                    >
                                      <Prohibit size={14} weight="bold" />
                                      {t.removeProfile}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <PaginationControls
                        currentPage={reportsPage}
                        totalItems={sortedReports.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setReportsPage}
                      />
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Storefront size={24} weight="fill" />
                      {t.weddingServices}
                    </CardTitle>
                    <CardDescription>
                      {weddingServices?.length || 0} {language === 'hi' ? 'कुल सेवाएं' : 'total services'}
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddService} className="gap-2">
                    <Plus size={18} weight="bold" />
                    {t.addService}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!weddingServices || weddingServices.length === 0 ? (
                  <Alert>
                    <Info size={18} />
                    <AlertDescription>
                      {language === 'hi' ? 'कोई सेवा नहीं मिली।' : 'No services found.'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                  <div className="overflow-auto max-h-[600px]">
                    <Table className="min-w-[900px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">{t.businessName}</TableHead>
                          <TableHead className="whitespace-nowrap">{t.category}</TableHead>
                          <TableHead className="whitespace-nowrap">{t.contactPerson}</TableHead>
                          <TableHead className="whitespace-nowrap">{t.mobile}</TableHead>
                          <TableHead className="whitespace-nowrap">{t.city}</TableHead>
                          <TableHead className="whitespace-nowrap">{t.status}</TableHead>
                          <TableHead className="whitespace-nowrap">{t.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weddingServices.slice((servicesPage - 1) * ITEMS_PER_PAGE, servicesPage * ITEMS_PER_PAGE).map((service) => (
                          <TableRow key={service.id}>
                            <TableCell className="font-medium">{service.businessName}</TableCell>
                            <TableCell>{service.category}</TableCell>
                            <TableCell>{service.contactPerson}</TableCell>
                            <TableCell className="font-mono text-sm">{service.mobile}</TableCell>
                            <TableCell>{service.city}</TableCell>
                            <TableCell>
                              <Badge variant={
                                service.verificationStatus === 'verified' ? 'default' :
                                service.verificationStatus === 'pending' ? 'secondary' :
                                'destructive'
                              }>
                                {service.verificationStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditService(service)}
                                >
                                  <Pencil size={16} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteService(service.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationControls
                    currentPage={servicesPage}
                    totalItems={weddingServices?.length || 0}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setServicesPage}
                  />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Membership Settings Tab */}
          <TabsContent value="membership">
            <div className="space-y-6">
              {/* Default Plan Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CurrencyInr size={24} weight="fill" />
                    {t.membershipSettings}
                  </CardTitle>
                  <CardDescription>
                    {language === 'hi' ? 'डिफ़ॉल्ट सदस्यता मूल्य और छूट सेटिंग्स' : 'Default membership pricing and discount settings'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 6 Month Plan */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Calendar size={18} />
                        {t.sixMonthPlan}
                      </h4>
                      <div className="space-y-2">
                        <Label>{t.price} (₹)</Label>
                        <Input 
                          type="number" 
                          value={localMembershipSettings.sixMonthPrice}
                          onChange={(e) => setLocalMembershipSettings(prev => ({
                            ...prev,
                            sixMonthPrice: parseInt(e.target.value) || 0
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.duration}</Label>
                        <Input 
                          type="number" 
                          value={localMembershipSettings.sixMonthDuration}
                          onChange={(e) => setLocalMembershipSettings(prev => ({
                            ...prev,
                            sixMonthDuration: parseInt(e.target.value) || 6
                          }))}
                        />
                      </div>
                    </div>
                    
                    {/* 1 Year Plan */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Calendar size={18} />
                        {t.oneYearPlan}
                      </h4>
                      <div className="space-y-2">
                        <Label>{t.price} (₹)</Label>
                        <Input 
                          type="number" 
                          value={localMembershipSettings.oneYearPrice}
                          onChange={(e) => setLocalMembershipSettings(prev => ({
                            ...prev,
                            oneYearPrice: parseInt(e.target.value) || 0
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.duration}</Label>
                        <Input 
                          type="number" 
                          value={localMembershipSettings.oneYearDuration}
                          onChange={(e) => setLocalMembershipSettings(prev => ({
                            ...prev,
                            oneYearDuration: parseInt(e.target.value) || 12
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Discount Settings */}
                  <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-semibold flex items-center gap-2 mb-4">
                      <Percent size={18} />
                      {t.discount}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={localMembershipSettings.discountEnabled}
                          onCheckedChange={(checked) => setLocalMembershipSettings(prev => ({
                            ...prev,
                            discountEnabled: !!checked
                          }))}
                        />
                        <Label>{t.enableDiscount}</Label>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.discountPercentage} (%)</Label>
                        <Input 
                          type="number" 
                          min="0"
                          max="100"
                          value={localMembershipSettings.discountPercentage}
                          onChange={(e) => setLocalMembershipSettings(prev => ({
                            ...prev,
                            discountPercentage: parseInt(e.target.value) || 0
                          }))}
                          disabled={!localMembershipSettings.discountEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.discountEndDate}</Label>
                        <Input 
                          type="date" 
                          value={localMembershipSettings.discountEndDate}
                          onChange={(e) => setLocalMembershipSettings(prev => ({
                            ...prev,
                            discountEndDate: e.target.value
                          }))}
                          disabled={!localMembershipSettings.discountEnabled}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Plan Limits Settings */}
                  <div className="mt-6 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-900/20">
                    <h4 className="font-semibold flex items-center gap-2 mb-4">
                      <ChatCircle size={18} />
                      {language === 'hi' ? 'प्लान सीमाएं (चैट और संपर्क)' : 'Plan Limits (Chat & Contact)'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Free Plan Limits */}
                      <div className="space-y-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300">
                          {language === 'hi' ? '🆓 मुफ्त प्लान' : '🆓 Free Plan'}
                        </h5>
                        <div className="space-y-2">
                          <Label className="text-xs">{language === 'hi' ? 'चैट अनुरोध सीमा' : 'Chat Request Limit'}</Label>
                          <Input 
                            type="number" 
                            min="0"
                            value={localMembershipSettings.freePlanChatLimit}
                            onChange={(e) => setLocalMembershipSettings(prev => ({
                              ...prev,
                              freePlanChatLimit: parseInt(e.target.value) || 0
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">{language === 'hi' ? 'संपर्क देखने की सीमा' : 'Contact View Limit'}</Label>
                          <Input 
                            type="number" 
                            min="0"
                            value={localMembershipSettings.freePlanContactLimit}
                            onChange={(e) => setLocalMembershipSettings(prev => ({
                              ...prev,
                              freePlanContactLimit: parseInt(e.target.value) || 0
                            }))}
                          />
                          <p className="text-xs text-muted-foreground">{language === 'hi' ? '0 = कोई संपर्क नहीं' : '0 = No contacts'}</p>
                        </div>
                      </div>
                      
                      {/* 6 Month Plan Limits */}
                      <div className="space-y-3 p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/30">
                        <h5 className="font-medium text-sm text-blue-600 dark:text-blue-300">
                          {language === 'hi' ? '💎 6 महीने का प्लान' : '💎 6 Month Plan'}
                        </h5>
                        <div className="space-y-2">
                          <Label className="text-xs">{language === 'hi' ? 'चैट अनुरोध सीमा' : 'Chat Request Limit'}</Label>
                          <Input 
                            type="number" 
                            min="0"
                            value={localMembershipSettings.sixMonthChatLimit}
                            onChange={(e) => setLocalMembershipSettings(prev => ({
                              ...prev,
                              sixMonthChatLimit: parseInt(e.target.value) || 0
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">{language === 'hi' ? 'संपर्क देखने की सीमा' : 'Contact View Limit'}</Label>
                          <Input 
                            type="number" 
                            min="0"
                            value={localMembershipSettings.sixMonthContactLimit}
                            onChange={(e) => setLocalMembershipSettings(prev => ({
                              ...prev,
                              sixMonthContactLimit: parseInt(e.target.value) || 0
                            }))}
                          />
                        </div>
                      </div>
                      
                      {/* 1 Year Plan Limits */}
                      <div className="space-y-3 p-3 border rounded-lg bg-green-50 dark:bg-green-900/30">
                        <h5 className="font-medium text-sm text-green-600 dark:text-green-300">
                          {language === 'hi' ? '👑 1 साल का प्लान' : '👑 1 Year Plan'}
                        </h5>
                        <div className="space-y-2">
                          <Label className="text-xs">{language === 'hi' ? 'चैट अनुरोध सीमा' : 'Chat Request Limit'}</Label>
                          <Input 
                            type="number" 
                            min="0"
                            value={localMembershipSettings.oneYearChatLimit}
                            onChange={(e) => setLocalMembershipSettings(prev => ({
                              ...prev,
                              oneYearChatLimit: parseInt(e.target.value) || 0
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">{language === 'hi' ? 'संपर्क देखने की सीमा' : 'Contact View Limit'}</Label>
                          <Input 
                            type="number" 
                            min="0"
                            value={localMembershipSettings.oneYearContactLimit}
                            onChange={(e) => setLocalMembershipSettings(prev => ({
                              ...prev,
                              oneYearContactLimit: parseInt(e.target.value) || 0
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {language === 'hi' 
                        ? '💬 सभी प्लान में एडमिन चैट मुफ्त है। ये सीमाएं केवल प्रोफाइल-टू-प्रोफाइल चैट और संपर्क देखने पर लागू होती हैं।' 
                        : '💬 Admin chat is free for all plans. These limits apply only to profile-to-profile chats and contact views.'}
                    </p>
                  </div>

                  {/* Payment Details Section */}
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CreditCard size={20} />
                      {language === 'hi' ? 'भुगतान विवरण' : 'Payment Details'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {language === 'hi' 
                        ? 'ये विवरण पंजीकरण के दौरान भुगतान के लिए दिखाए जाएंगे।' 
                        : 'These details will be shown during registration for payment.'}
                    </p>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* UPI ID */}
                      <div className="space-y-2">
                        <Label>{language === 'hi' ? 'UPI ID' : 'UPI ID'}</Label>
                        <Input 
                          type="text"
                          placeholder={language === 'hi' ? 'yourname@upi' : 'yourname@upi'}
                          value={localMembershipSettings.upiId}
                          onChange={(e) => setLocalMembershipSettings(prev => ({
                            ...prev,
                            upiId: e.target.value
                          }))}
                        />
                      </div>
                      
                      {/* Account Holder Name */}
                      <div className="space-y-2">
                        <Label>{language === 'hi' ? 'खाता धारक का नाम' : 'Account Holder Name'}</Label>
                        <Input 
                          type="text"
                          placeholder={language === 'hi' ? 'खाता धारक का नाम' : 'Account holder name'}
                          value={localMembershipSettings.accountHolderName}
                          onChange={(e) => setLocalMembershipSettings(prev => ({
                            ...prev,
                            accountHolderName: e.target.value
                          }))}
                        />
                      </div>
                      
                      {/* Bank Name */}
                      <div className="space-y-2">
                        <Label>{language === 'hi' ? 'बैंक का नाम' : 'Bank Name'}</Label>
                        <Input 
                          type="text"
                          placeholder={language === 'hi' ? 'बैंक का नाम' : 'Bank name'}
                          value={localMembershipSettings.bankName}
                          onChange={(e) => setLocalMembershipSettings(prev => ({
                            ...prev,
                            bankName: e.target.value
                          }))}
                        />
                      </div>
                      
                      {/* Account Number */}
                      <div className="space-y-2">
                        <Label>{language === 'hi' ? 'खाता संख्या' : 'Account Number'}</Label>
                        <Input 
                          type="text"
                          placeholder={language === 'hi' ? 'खाता संख्या' : 'Account number'}
                          value={localMembershipSettings.accountNumber}
                          onChange={(e) => setLocalMembershipSettings(prev => ({
                            ...prev,
                            accountNumber: e.target.value
                          }))}
                        />
                      </div>
                      
                      {/* IFSC Code */}
                      <div className="space-y-2">
                        <Label>{language === 'hi' ? 'IFSC कोड' : 'IFSC Code'}</Label>
                        <Input 
                          type="text"
                          placeholder="ABCD0123456"
                          value={localMembershipSettings.ifscCode}
                          onChange={(e) => setLocalMembershipSettings(prev => ({
                            ...prev,
                            ifscCode: e.target.value.toUpperCase()
                          }))}
                        />
                      </div>
                    </div>
                    
                    {/* QR Code Upload */}
                    <div className="space-y-2 mt-4">
                      <Label>{language === 'hi' ? 'QR कोड छवि' : 'QR Code Image'}</Label>
                      <p className="text-xs text-muted-foreground">
                        {language === 'hi' 
                          ? 'भुगतान के लिए UPI QR कोड अपलोड करें' 
                          : 'Upload UPI QR code for payment'}
                      </p>
                      <div className="flex items-start gap-4">
                        {localMembershipSettings.qrCodeImage ? (
                          <div className="relative">
                            <img 
                              src={localMembershipSettings.qrCodeImage} 
                              alt="QR Code" 
                              className="w-32 h-32 object-contain border rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => setLocalMembershipSettings(prev => ({
                                ...prev,
                                qrCodeImage: ''
                              }))}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                            <Upload size={24} className="text-muted-foreground" />
                            <span className="text-xs text-muted-foreground mt-1">
                              {language === 'hi' ? 'QR अपलोड करें' : 'Upload QR'}
                            </span>
                            <input 
                              type="file" 
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onload = () => {
                                    setLocalMembershipSettings(prev => ({
                                      ...prev,
                                      qrCodeImage: reader.result as string
                                    }))
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button 
                      onClick={() => {
                        // Save local settings to Azure
                        setMembershipSettings(localMembershipSettings)
                        toast.success(t.settingsUpdated)
                      }}
                      className="gap-2"
                    >
                      <Check size={18} />
                      {t.updateSettings}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Expiring Profiles Alert */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell size={24} weight="fill" />
                    {t.expiringProfiles}
                  </CardTitle>
                  <CardDescription>
                    {language === 'hi' ? 'जल्द समाप्त होने वाली सदस्यताएं' : 'Memberships expiring soon'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const now = new Date()
                    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
                    
                    const expiringIn7 = profiles?.filter(p => {
                      if (!p.membershipExpiry) return false
                      const expiry = new Date(p.membershipExpiry)
                      return expiry <= in7Days && expiry > now
                    }) || []
                    
                    const expiringIn30 = profiles?.filter(p => {
                      if (!p.membershipExpiry) return false
                      const expiry = new Date(p.membershipExpiry)
                      return expiry > in7Days && expiry <= in30Days
                    }) || []
                    
                    const expired = profiles?.filter(p => {
                      if (!p.membershipExpiry) return false
                      const expiry = new Date(p.membershipExpiry)
                      return expiry <= now
                    }) || []
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/30 border-red-200">
                          <h4 className="font-semibold text-red-600 flex items-center gap-2">
                            <Bell size={18} weight="fill" />
                            {t.expiringIn7Days}
                          </h4>
                          <p className="text-2xl font-bold text-red-700">{expiringIn7.length}</p>
                          <ScrollArea className="h-32 mt-2">
                            {expiringIn7.map(p => (
                              <div key={p.id} className="text-sm py-1 flex justify-between">
                                <span>{p.fullName}</span>
                                <span className="text-muted-foreground">{formatDateDDMMYYYY(p.membershipExpiry || '')}</span>
                              </div>
                            ))}
                          </ScrollArea>
                        </div>
                        
                        <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200">
                          <h4 className="font-semibold text-yellow-600 flex items-center gap-2">
                            <Calendar size={18} />
                            {t.expiringIn30Days}
                          </h4>
                          <p className="text-2xl font-bold text-yellow-700">{expiringIn30.length}</p>
                          <ScrollArea className="h-32 mt-2">
                            {expiringIn30.map(p => (
                              <div key={p.id} className="text-sm py-1 flex justify-between">
                                <span>{p.fullName}</span>
                                <span className="text-muted-foreground">{formatDateDDMMYYYY(p.membershipExpiry || '')}</span>
                              </div>
                            ))}
                          </ScrollArea>
                        </div>
                        
                        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-950/30 border-gray-200">
                          <h4 className="font-semibold text-gray-600 flex items-center gap-2">
                            <X size={18} />
                            {t.expired}
                          </h4>
                          <p className="text-2xl font-bold text-gray-700">{expired.length}</p>
                          <ScrollArea className="h-32 mt-2">
                            {expired.map(p => (
                              <div key={p.id} className="text-sm py-1 flex justify-between">
                                <span>{p.fullName}</span>
                                <span className="text-muted-foreground">{formatDateDDMMYYYY(p.membershipExpiry || '')}</span>
                              </div>
                            ))}
                          </ScrollArea>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              {/* Individual Profile Membership Edit */}
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'hi' ? 'प्रोफाइल सदस्यता प्रबंधन' : 'Profile Membership Management'}</CardTitle>
                  <CardDescription>
                    {language === 'hi' ? 'व्यक्तिगत प्रोफाइल के लिए सदस्यता संपादित करें' : 'Edit membership for individual profiles'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto max-h-[400px]">
                    <Table className="min-w-[800px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">{t.name}</TableHead>
                          <TableHead className="whitespace-nowrap">{t.profileId}</TableHead>
                          <TableHead className="whitespace-nowrap">{t.membershipPlan}</TableHead>
                          <TableHead className="whitespace-nowrap">{t.membershipExpiry}</TableHead>
                          <TableHead className="whitespace-nowrap">{t.status}</TableHead>
                          <TableHead className="whitespace-nowrap">{t.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles?.filter(p => p.status === 'verified' && !p.isDeleted).map((profile) => {
                          const hasMembership = profile.membershipPlan && profile.membershipPlan !== 'free' && profile.membershipExpiry
                          const isExpired = hasMembership && new Date(profile.membershipExpiry!) < new Date()
                          const isExpiringSoon = hasMembership && 
                            new Date(profile.membershipExpiry!) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
                            new Date(profile.membershipExpiry!) > new Date()
                          const isActive = hasMembership && !isExpired && !isExpiringSoon
                          
                          return (
                            <TableRow key={profile.id}>
                              <TableCell className="font-medium">{profile.fullName}</TableCell>
                              <TableCell className="font-mono text-sm">{profile.profileId}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {profile.membershipPlan === '6-month' ? t.sixMonthPlan : 
                                   profile.membershipPlan === '1-year' ? t.oneYearPlan : 
                                   profile.membershipPlan === 'free' ? (language === 'hi' ? 'फ्री' : 'Free') : '-'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {profile.membershipExpiry ? formatDateDDMMYYYY(profile.membershipExpiry) : '-'}
                              </TableCell>
                              <TableCell>
                                {!hasMembership ? (
                                  <Badge variant="outline" className="text-muted-foreground">{language === 'hi' ? 'कोई सदस्यता नहीं' : 'No Membership'}</Badge>
                                ) : isExpired ? (
                                  <Badge variant="destructive">{t.expired}</Badge>
                                ) : isExpiringSoon ? (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t.expiringIn30Days}</Badge>
                                ) : isActive ? (
                                  <Badge variant="default" className="bg-green-100 text-green-800">{language === 'hi' ? 'सक्रिय' : 'Active'}</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">{language === 'hi' ? 'कोई सदस्यता नहीं' : 'No Membership'}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setEditMembershipDialog(profile)
                                    setMembershipEditData({
                                      plan: profile.membershipPlan || '',
                                      customAmount: 0,
                                      discountAmount: 0,
                                      expiryDate: profile.membershipExpiry || ''
                                    })
                                  }}
                                >
                                  <Pencil size={16} className="mr-1" />
                                  {t.editMembership}
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedProfile?.photos?.[0] ? (
                <img 
                  src={selectedProfile.photos[0]} 
                  alt={selectedProfile.fullName} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold border-2 border-primary/20">
                  {selectedProfile?.firstName?.[0]}{selectedProfile?.lastName?.[0]}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-lg">{selectedProfile?.fullName}</span>
                <span className="text-sm font-normal text-muted-foreground">{selectedProfile?.profileId}</span>
              </div>
            </DialogTitle>
            <DialogDescription>
              {selectedProfile?.membershipPlan || 'free'} {selectedProfile?.membershipPlan !== 'free' && selectedProfile?.membershipPlan ? '' : ''} • {language === 'hi' ? 'चैट इतिहास और नया संदेश' : 'Chat history and new message'}
            </DialogDescription>
          </DialogHeader>
          
          {/* Chat History */}
          <ScrollArea className="flex-1 max-h-[300px] border rounded-lg p-3 bg-muted/20">
            <div className="space-y-3">
              {(() => {
                const profileMessages = messages?.filter(m => 
                  m.type === 'admin-to-user' && 
                  (m.toProfileId === selectedProfile?.profileId || m.fromProfileId === selectedProfile?.profileId)
                ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) || []
                
                if (profileMessages.length === 0) {
                  return (
                    <div className="text-center text-muted-foreground py-8">
                      <ChatCircle size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{language === 'hi' ? 'कोई पिछले संदेश नहीं' : 'No previous messages'}</p>
                    </div>
                  )
                }
                
                return profileMessages.map(msg => {
                  const isFromAdmin = msg.fromProfileId === 'admin'
                  const messageText = msg.message || (msg as any).content || ''
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
                      className={`flex ${isFromAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-2 rounded-lg ${
                        isFromAdmin 
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      }`}>
                        {!isFromAdmin && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {selectedProfile?.fullName}
                          </p>
                        )}
                        <p className="text-sm">{messageText}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className={`text-xs ${isFromAdmin ? 'opacity-70' : 'text-muted-foreground'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isFromAdmin && (
                            <span className={`flex items-center ${
                              messageStatus === 'read' 
                                ? 'text-blue-400' 
                                : messageStatus === 'delivered' 
                                  ? 'text-gray-400' 
                                  : 'text-gray-300'
                            }`}>
                              {messageStatus === 'sent' ? (
                                <Check size={12} weight="bold" />
                              ) : (
                                <Checks size={12} weight="bold" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </ScrollArea>
          
          {/* New Message Input */}
          <div className="space-y-3 pt-2">
            <Textarea
              placeholder={t.typeMessage}
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              rows={3}
            />
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowChatDialog(false)}>
                {t.close}
              </Button>
              <Button onClick={handleSendMessage} disabled={!chatMessage.trim()}>
                <PaperPlaneTilt size={16} className="mr-1" />
                {t.sendMessage}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? t.editService : t.addService}
            </DialogTitle>
            <DialogDescription>
              {language === 'hi' ? 'विवाह सेवा विवरण दर्ज करें' : 'Enter wedding service details'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.businessName} *</label>
              <Input
                placeholder={t.businessName}
                value={serviceFormData.businessName || ''}
                onChange={(e) => setServiceFormData(prev => ({ ...prev, businessName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.category} *</label>
              <Select
                value={serviceFormData.category || 'venue'}
                onValueChange={(value) => setServiceFormData(prev => ({ ...prev, category: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venue">Venue</SelectItem>
                  <SelectItem value="caterer">Caterer</SelectItem>
                  <SelectItem value="photographer">Photographer</SelectItem>
                  <SelectItem value="decorator">Decorator</SelectItem>
                  <SelectItem value="mehandi">Mehandi Artist</SelectItem>
                  <SelectItem value="makeup">Makeup Artist</SelectItem>
                  <SelectItem value="dj">DJ / Music</SelectItem>
                  <SelectItem value="priest">Priest</SelectItem>
                  <SelectItem value="card-designer">Card Designer</SelectItem>
                  <SelectItem value="choreographer">Choreographer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.contactPerson} *</label>
              <Input
                placeholder={t.contactPerson}
                value={serviceFormData.contactPerson || ''}
                onChange={(e) => setServiceFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.mobile} *</label>
              <Input
                placeholder={t.mobile}
                value={serviceFormData.mobile || ''}
                onChange={(e) => setServiceFormData(prev => ({ ...prev, mobile: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.email}</label>
              <Input
                placeholder={t.email}
                value={serviceFormData.email || ''}
                onChange={(e) => setServiceFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.city} *</label>
              <Input
                placeholder={t.city}
                value={serviceFormData.city || ''}
                onChange={(e) => setServiceFormData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.state}</label>
              <Input
                placeholder={t.state}
                value={serviceFormData.state || ''}
                onChange={(e) => setServiceFormData(prev => ({ ...prev, state: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.priceRange}</label>
              <Input
                placeholder="e.g., ₹10,000 - ₹50,000"
                value={serviceFormData.priceRange || ''}
                onChange={(e) => setServiceFormData(prev => ({ ...prev, priceRange: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.consultationFee}</label>
              <Input
                type="number"
                placeholder="200"
                value={serviceFormData.consultationFee || 200}
                onChange={(e) => setServiceFormData(prev => ({ ...prev, consultationFee: parseInt(e.target.value) || 200 }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.status}</label>
              <Select
                value={serviceFormData.verificationStatus || 'verified'}
                onValueChange={(value) => setServiceFormData(prev => ({ ...prev, verificationStatus: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">{t.address}</label>
              <Input
                placeholder={t.address}
                value={serviceFormData.address || ''}
                onChange={(e) => setServiceFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">{t.serviceDescription}</label>
              <Textarea
                placeholder={t.serviceDescription}
                value={serviceFormData.description || ''}
                onChange={(e) => setServiceFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowServiceDialog(false)}>
              {t.close}
            </Button>
            <Button onClick={handleSaveService}>
              {t.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProfileDetailDialog
        profile={viewProfileDialog}
        open={!!viewProfileDialog}
        onClose={() => setViewProfileDialog(null)}
        language={language}
        currentUserProfile={null}
        isLoggedIn={true}
        isAdmin={true}
      />

      {/* Face Verification Dialog */}
      <Dialog open={!!faceVerificationDialog} onOpenChange={() => setFaceVerificationDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanSmiley size={24} weight="bold" />
              {t.faceVerification}
            </DialogTitle>
            <DialogDescription>
              {faceVerificationDialog?.fullName} - {faceVerificationDialog?.profileId}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Selfie Section */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">{t.selfieImage}</h4>
              <div className="w-40 h-40 rounded-lg overflow-hidden bg-muted border-2 border-dashed relative group">
                {faceVerificationDialog?.selfieUrl ? (
                  <>
                    <img 
                      src={faceVerificationDialog.selfieUrl} 
                      alt="Selfie" 
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => openLightbox([faceVerificationDialog.selfieUrl!], 0)}
                    />
                    <div 
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      onClick={() => openLightbox([faceVerificationDialog.selfieUrl!], 0)}
                    >
                      <span className="text-white text-sm font-medium">{language === 'hi' ? 'ज़ूम करें' : 'Click to Zoom'}</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    {t.noSelfie}
                  </div>
                )}
              </div>
              
              {/* Registration Location in Face Verification */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <NavigationArrow size={18} weight="fill" className="text-blue-600" />
                  <span className="font-semibold text-sm">{t.registrationLocation}</span>
                </div>
                {faceVerificationDialog?.registrationLocation ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-blue-600 mt-0.5" />
                      <div>
                        <div className="font-medium">
                          {faceVerificationDialog.registrationLocation.city || 'Unknown City'}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {faceVerificationDialog.registrationLocation.region && `${faceVerificationDialog.registrationLocation.region}, `}
                          {faceVerificationDialog.registrationLocation.country || ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe size={14} />
                      <span>
                        {faceVerificationDialog.registrationLocation.latitude.toFixed(6)}, 
                        {faceVerificationDialog.registrationLocation.longitude.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{t.accuracy}: ±{Math.round(faceVerificationDialog.registrationLocation.accuracy)}m</span>
                    </div>
                    <a 
                      href={`https://www.google.com/maps?q=${faceVerificationDialog.registrationLocation.latitude},${faceVerificationDialog.registrationLocation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
                    >
                      <MapPin size={14} />
                      {t.viewOnMap} ↗
                    </a>
                    
                    {/* Location mismatch warning */}
                    {faceVerificationDialog.registrationLocation.country && 
                     faceVerificationDialog.country && 
                     !isSameCountry(faceVerificationDialog.registrationLocation.country, faceVerificationDialog.country) && (
                      <Alert className="bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800 mt-2">
                        <Info size={16} className="text-amber-600" />
                        <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                          {language === 'hi' 
                            ? `⚠️ पंजीकरण स्थान (${faceVerificationDialog.registrationLocation.country}) प्रोफाइल देश (${faceVerificationDialog.country}) से मेल नहीं खाता` 
                            : `⚠️ Registration location (${faceVerificationDialog.registrationLocation.country}) doesn't match profile country (${faceVerificationDialog.country})`}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <Info size={16} />
                    <span>{t.locationNotCaptured}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded Photos Section */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">{t.uploadedPhotos}</h4>
              <div className="grid grid-cols-2 gap-3">
                {faceVerificationDialog?.photos && faceVerificationDialog.photos.length > 0 ? (
                  faceVerificationDialog.photos.map((photo, idx) => (
                    <div key={idx} className="w-40 h-40 rounded-lg overflow-hidden bg-muted border-2 border-dashed relative group">
                      <img 
                        src={photo} 
                        alt={`Photo ${idx + 1}`} 
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openLightbox(faceVerificationDialog.photos || [], idx)}
                      />
                      <div 
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        onClick={() => openLightbox(faceVerificationDialog.photos || [], idx)}
                      >
                        <span className="text-white text-sm font-medium">{language === 'hi' ? 'ज़ूम करें' : 'Click to Zoom'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 h-40 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                    {t.noPhotos}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Verification Result */}
          {isVerifyingFace ? (
            <div className="flex items-center justify-center py-6 gap-3">
              <Spinner size={24} className="animate-spin" />
              <span>{t.verifying}</span>
            </div>
          ) : faceVerificationResult ? (
            <div className="space-y-3">
              <Alert className={faceVerificationResult.isMatch 
                ? 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800' 
                : 'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800'
              }>
                {faceVerificationResult.isMatch ? (
                  <CheckCircle size={20} weight="fill" className="text-green-600" />
                ) : (
                  <XCircle size={20} weight="fill" className="text-red-600" />
                )}
                <AlertDescription className="ml-2">
                  <div className="font-semibold text-lg">
                    {faceVerificationResult.isMatch 
                      ? (language === 'hi' ? 'चेहरा सत्यापित ✓' : 'Face Verified ✓')
                      : (language === 'hi' ? 'चेहरा मेल नहीं खाता ✗' : 'Face Mismatch ✗')
                    }
                  </div>
                  <div className="text-sm mt-1 font-medium">
                    {language === 'hi' ? 'विश्वास स्कोर' : 'Confidence'}: {faceVerificationResult.confidence}%
                  </div>
                </AlertDescription>
              </Alert>

              {/* Match Details */}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className={`p-2 rounded-lg text-center ${faceVerificationResult.matchDetails.faceShapeMatch ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <div className="font-medium">{language === 'hi' ? 'चेहरे का आकार' : 'Face Shape'}</div>
                  <div>{faceVerificationResult.matchDetails.faceShapeMatch ? '✓ Match' : '✗ No Match'}</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${faceVerificationResult.matchDetails.facialFeaturesMatch ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <div className="font-medium">{language === 'hi' ? 'चेहरे की विशेषताएं' : 'Facial Features'}</div>
                  <div>{faceVerificationResult.matchDetails.facialFeaturesMatch ? '✓ Match' : '✗ No Match'}</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${
                  faceVerificationResult.matchDetails.overallSimilarity === 'high' ? 'bg-green-100 text-green-800' :
                  faceVerificationResult.matchDetails.overallSimilarity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  <div className="font-medium">{language === 'hi' ? 'समग्र समानता' : 'Overall'}</div>
                  <div className="capitalize">{faceVerificationResult.matchDetails.overallSimilarity}</div>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm mb-1 flex items-center gap-2">
                  {language === 'hi' ? 'AI विश्लेषण' : 'AI Analysis'}:
                  {faceVerificationResult.analysis.includes('[DEMO MODE]') && (
                    <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">
                      {language === 'hi' ? 'डेमो मोड' : 'Demo Mode'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{faceVerificationResult.analysis}</p>
                {faceVerificationResult.analysis.includes('[DEMO MODE]') && (
                  <p className="text-xs text-amber-600 mt-2">
                    {language === 'hi' 
                      ? '⚠️ वास्तविक AI सत्यापन के लिए Azure OpenAI API कॉन्फ़िगर करें' 
                      : '⚠️ Configure Azure OpenAI API for real AI verification'}
                  </p>
                )}
              </div>

              {/* Recommendations */}
              {faceVerificationResult.recommendations && faceVerificationResult.recommendations.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="font-medium text-sm mb-1 text-blue-700 dark:text-blue-300">
                    {language === 'hi' ? 'सुझाव' : 'Recommendations'}:
                  </div>
                  <ul className="text-sm text-blue-600 dark:text-blue-400 list-disc list-inside">
                    {faceVerificationResult.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

          {/* Photo Verification Status Badge */}
          {faceVerificationDialog?.photoVerified !== undefined && (
            <div className={`p-3 rounded-lg border ${faceVerificationDialog.photoVerified 
              ? 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800' 
              : 'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800'}`}
            >
              <div className="flex items-center gap-2">
                {faceVerificationDialog.photoVerified ? (
                  <CheckCircle size={20} weight="fill" className="text-green-600" />
                ) : (
                  <XCircle size={20} weight="fill" className="text-red-600" />
                )}
                <span className={`font-medium ${faceVerificationDialog.photoVerified ? 'text-green-700' : 'text-red-700'}`}>
                  {faceVerificationDialog.photoVerified ? t.photoVerifiedBadge : t.photoNotVerified}
                </span>
                {faceVerificationDialog.photoVerifiedAt && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(faceVerificationDialog.photoVerifiedAt).toLocaleDateString()}
                    {faceVerificationDialog.photoVerifiedBy && ` (${faceVerificationDialog.photoVerifiedBy})`}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setFaceVerificationDialog(null)}>
              {t.close}
            </Button>
            {faceVerificationDialog && (
              <>
                <Button 
                  onClick={() => handleAIFaceVerification(faceVerificationDialog)}
                  disabled={isVerifyingFace}
                  variant="outline"
                  className="gap-2"
                >
                  <ScanSmiley size={16} />
                  {isVerifyingFace ? t.verifying : t.verifyWithAI}
                </Button>
                <Button 
                  onClick={() => handleMarkPhotoVerified(faceVerificationDialog, false)}
                  variant="outline"
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle size={16} />
                  {t.markFaceNotVerified}
                </Button>
                <Button 
                  onClick={() => handleMarkPhotoVerified(faceVerificationDialog, true)}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle size={16} />
                  {t.markFaceVerified}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Membership Dialog */}
      <Dialog open={!!editMembershipDialog} onOpenChange={() => setEditMembershipDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CurrencyInr size={24} />
              {t.editMembership} - {editMembershipDialog?.fullName}
            </DialogTitle>
            <DialogDescription>
              {language === 'hi' ? 'सदस्यता राशि और अवधि संपादित करें' : 'Edit membership amount and duration'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.membershipPlan}</Label>
              <Select 
                value={membershipEditData.plan} 
                onValueChange={(val) => setMembershipEditData(prev => ({...prev, plan: val}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'hi' ? 'प्लान चुनें' : 'Select Plan'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">{t.freePlan} (₹0 - {language === 'hi' ? '6 माह' : '6 months'})</SelectItem>
                  <SelectItem value="6-month">{t.sixMonthPlan} (₹{membershipSettings?.sixMonthPrice || 500})</SelectItem>
                  <SelectItem value="1-year">{t.oneYearPlan} (₹{membershipSettings?.oneYearPrice || 900})</SelectItem>
                  <SelectItem value="custom">{language === 'hi' ? 'कस्टम प्लान' : 'Custom Plan'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {membershipEditData.plan === 'custom' && (
              <div className="space-y-2">
                <Label>{t.customAmount} (₹) *</Label>
                <Input 
                  type="number" 
                  value={membershipEditData.customAmount}
                  onChange={(e) => setMembershipEditData(prev => ({...prev, customAmount: parseInt(e.target.value) || 0}))}
                  placeholder={language === 'hi' ? 'कस्टम राशि दर्ज करें' : 'Enter custom amount'}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>{t.discountAmount} (₹)</Label>
              <Input 
                type="number" 
                value={membershipEditData.discountAmount}
                onChange={(e) => setMembershipEditData(prev => ({...prev, discountAmount: parseInt(e.target.value) || 0}))}
                placeholder={language === 'hi' ? 'छूट राशि दर्ज करें' : 'Enter discount amount'}
              />
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span>{language === 'hi' ? 'मूल राशि' : 'Original Amount'}:</span>
                <span>₹{membershipEditData.plan === 'free'
                  ? 0
                  : membershipEditData.plan === '6-month' 
                  ? (membershipSettings?.sixMonthPrice || 500) 
                  : membershipEditData.plan === '1-year' 
                    ? (membershipSettings?.oneYearPrice || 900) 
                    : membershipEditData.plan === 'custom'
                      ? membershipEditData.customAmount
                      : 0}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>{language === 'hi' ? 'छूट' : 'Discount'}:</span>
                <span>-₹{membershipEditData.discountAmount}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>{language === 'hi' ? 'अंतिम राशि' : 'Final Amount'}:</span>
                <span>₹{Math.max(0,
                  (membershipEditData.plan === 'free'
                    ? 0
                    : membershipEditData.plan === '6-month' 
                    ? (membershipSettings?.sixMonthPrice || 500) 
                    : membershipEditData.plan === '1-year' 
                      ? (membershipSettings?.oneYearPrice || 900) 
                      : membershipEditData.plan === 'custom'
                        ? membershipEditData.customAmount
                        : 0) - membershipEditData.discountAmount
                )}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t.expiryDate}</Label>
              <Input 
                type="date" 
                value={membershipEditData.expiryDate ? new Date(membershipEditData.expiryDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setMembershipEditData(prev => ({...prev, expiryDate: e.target.value}))}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditMembershipDialog(null)}>
              {t.close}
            </Button>
            <Button onClick={() => {
              if (editMembershipDialog) {
                setProfiles((current) => 
                  (current || []).map(p => 
                    p.id === editMembershipDialog.id 
                      ? { 
                          ...p, 
                          membershipPlan: membershipEditData.plan as any,
                          membershipExpiry: membershipEditData.expiryDate
                        }
                      : p
                  )
                )
                toast.success(t.membershipUpdated)
                setEditMembershipDialog(null)
              }
            }}>
              <Check size={16} className="mr-1" />
              {t.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return to Edit Dialog */}
      <Dialog open={!!returnToEditDialog} onOpenChange={() => { setReturnToEditDialog(null); setReturnToEditReason('') }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil size={24} className="text-amber-600" />
              {t.returnToEdit}
            </DialogTitle>
            <DialogDescription>
              {t.returnToEditDesc}
            </DialogDescription>
          </DialogHeader>
          
          {returnToEditDialog && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {returnToEditDialog.photos && returnToEditDialog.photos.length > 0 ? (
                  <img 
                    src={returnToEditDialog.photos[0]} 
                    alt={returnToEditDialog.fullName}
                    className="w-12 h-12 object-cover rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                    {returnToEditDialog.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                )}
                <div>
                  <div className="font-semibold">{returnToEditDialog.fullName}</div>
                  <div className="text-sm text-muted-foreground">{returnToEditDialog.profileId}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editReason">{t.editReasonLabel}</Label>
                <Textarea
                  id="editReason"
                  value={returnToEditReason}
                  onChange={(e) => setReturnToEditReason(e.target.value)}
                  placeholder={t.editReasonPlaceholder}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'hi' 
                    ? 'उपयोगकर्ता को यह संदेश दिखाई देगा जब वे लॉगिन करेंगे।' 
                    : 'This message will be shown to the user when they login.'}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setReturnToEditDialog(null); setReturnToEditReason('') }}>
              {t.cancel}
            </Button>
            <Button 
              onClick={() => returnToEditDialog && handleMoveToPending(returnToEditDialog.id, returnToEditReason)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Pencil size={16} className="mr-1" />
              {t.sendForEdit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Edit Profile Dialog - Uses RegistrationDialog with isAdminMode */}
      {adminEditDialog && (
        <RegistrationDialog
          open={!!adminEditDialog}
          onClose={() => setAdminEditDialog(null)}
          language={language}
          editProfile={adminEditDialog}
          isAdminMode={true}
          onSubmit={(profile) => {
            handleAdminEditSave(profile as Profile)
          }}
          existingProfiles={profiles || []}
        />
      )}

      {/* Photo Lightbox for viewing photos in full size */}
      <PhotoLightbox
        photos={lightboxState.photos}
        initialIndex={lightboxState.initialIndex}
        open={lightboxState.open}
        onClose={closeLightbox}
      />

      {/* Rejection Dialog with Notification */}
      <Dialog open={!!showRejectDialog} onOpenChange={(open) => !open && setShowRejectDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X size={24} weight="bold" />
              {t.reject} - {showRejectDialog?.fullName}
            </DialogTitle>
            <DialogDescription>
              {language === 'hi' 
                ? 'प्रोफाइल को अस्वीकार करने का कारण दें और उपयोगकर्ता को SMS/Email द्वारा सूचित करें।'
                : 'Provide a reason for rejection and notify the user via SMS/Email.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">{t.rejectionReason}</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t.rejectionReasonPlaceholder}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <Switch
                id="send-notification"
                checked={sendRejectionNotification}
                onCheckedChange={setSendRejectionNotification}
              />
              <Label htmlFor="send-notification" className="flex items-center gap-2 cursor-pointer">
                <Bell size={16} />
                {t.sendNotification}
                <span className="text-xs text-muted-foreground">
                  ({language === 'hi' ? 'SMS + Email' : 'SMS + Email'})
                </span>
              </Label>
            </div>
            
            {showRejectDialog && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p className="font-medium mb-1">{language === 'hi' ? 'संपर्क विवरण:' : 'Contact Details:'}</p>
                <p className="text-muted-foreground">📱 {showRejectDialog.mobile}</p>
                <p className="text-muted-foreground">✉️ {showRejectDialog.email}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectDialog(null)
              setRejectionReason('')
              setSendRejectionNotification(true)
            }}>
              {t.cancel}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectWithNotification}
              disabled={!rejectionReason.trim()}
            >
              <X size={16} className="mr-1" />
              {t.reject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Rejection Reason Dialog */}
      <Dialog open={!!showRejectionReasonDialog} onOpenChange={(open) => !open && setShowRejectionReasonDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Prohibit size={24} weight="bold" />
              {t.rejectionDetails}
            </DialogTitle>
            <DialogDescription>
              {showRejectionReasonDialog?.fullName} ({showRejectionReasonDialog?.profileId})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Rejection reason */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.rejectionReason}</Label>
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {showRejectionReasonDialog?.rejectionReason || t.noRejectionReason}
                </p>
              </div>
            </div>
            
            {/* Rejection date */}
            {showRejectionReasonDialog?.rejectedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar size={14} />
                <span>{t.rejectedOn}: {formatDateDDMMYYYY(showRejectionReasonDialog.rejectedAt)}</span>
              </div>
            )}
            
            {/* Contact details */}
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium mb-1">{language === 'hi' ? 'संपर्क विवरण:' : 'Contact Details:'}</p>
              <p className="text-muted-foreground">📱 {showRejectionReasonDialog?.mobile}</p>
              <p className="text-muted-foreground">✉️ {showRejectionReasonDialog?.email}</p>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowRejectionReasonDialog(null)}>
              {t.close}
            </Button>
            <Button 
              variant="default" 
              onClick={() => showRejectionReasonDialog && handleUndoRejection(showRejectionReasonDialog)}
              className="bg-green-600 hover:bg-green-700"
            >
              <ArrowCounterClockwise size={16} className="mr-1" />
              {t.undoRejection}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Rejection with Reason Dialog */}
      <Dialog open={!!showBulkRejectDialog} onOpenChange={(open) => {
        if (!open) {
          setShowBulkRejectDialog(null)
          setBulkRejectReason('')
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X size={24} weight="bold" />
              {t.enterRejectionReason}
            </DialogTitle>
            <DialogDescription>
              {language === 'hi' 
                ? `${showBulkRejectDialog?.ids.length || 0} प्रोफाइल अस्वीकृत की जाएंगी` 
                : `${showBulkRejectDialog?.ids.length || 0} profile(s) will be rejected`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'hi' ? 'अस्वीकृति का कारण' : 'Reason for Rejection'}</Label>
              <Textarea 
                value={bulkRejectReason}
                onChange={(e) => setBulkRejectReason(e.target.value)}
                placeholder={t.rejectionReasonPlaceholder}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              setShowBulkRejectDialog(null)
              setBulkRejectReason('')
            }}>
              {t.close}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBulkRejectWithReason}
            >
              <X size={16} className="mr-1" />
              {t.confirmReject} ({showBulkRejectDialog?.ids.length || 0})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast Message Dialog */}
      <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell size={24} weight="fill" className="text-accent" />
              {t.broadcastMessage}
            </DialogTitle>
            <DialogDescription>
              {t.selectProfilesToMessage}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Profile Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{language === 'hi' ? 'प्रोफाइल चुनें' : 'Select Profiles'}</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (broadcastProfiles.length === (profiles?.length || 0)) {
                      setBroadcastProfiles([])
                    } else {
                      setBroadcastProfiles(profiles?.map(p => p.id) || [])
                    }
                  }}
                >
                  {broadcastProfiles.length === (profiles?.length || 0) 
                    ? (language === 'hi' ? 'सभी हटाएं' : 'Deselect All')
                    : t.selectAll
                  }
                </Button>
              </div>
              <ScrollArea className="h-48 border rounded-lg p-2">
                <div className="space-y-1">
                  {profiles?.map(profile => (
                    <div key={profile.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded-md">
                      <Checkbox
                        checked={broadcastProfiles.includes(profile.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBroadcastProfiles(prev => [...prev, profile.id])
                          } else {
                            setBroadcastProfiles(prev => prev.filter(id => id !== profile.id))
                          }
                        }}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        {profile.photos?.[0] ? (
                          <img src={profile.photos[0]} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                            {profile.fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-sm">{profile.fullName}</span>
                        <Badge variant="outline" className="text-xs">{profile.profileId}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-sm text-muted-foreground">
                {broadcastProfiles.length} {language === 'hi' ? 'प्रोफाइल चयनित' : 'profiles selected'}
              </p>
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <Label htmlFor="broadcastMsg">{language === 'hi' ? 'संदेश' : 'Message'}</Label>
              <Textarea
                id="broadcastMsg"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder={language === 'hi' ? 'अपना संदेश यहां टाइप करें...' : 'Type your message here...'}
                rows={4}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBroadcastDialog(false)}>
              {t.cancel}
            </Button>
            <Button 
              onClick={handleBroadcastMessage}
              disabled={!broadcastMessage.trim() || broadcastProfiles.length === 0}
              className="bg-accent hover:bg-accent/90"
            >
              <PaperPlaneTilt size={16} className="mr-1" />
              {t.sendMessage}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentFormDialog} onOpenChange={setShowPaymentFormDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt size={24} className="text-green-600" />
              {t.recordPayment}
            </DialogTitle>
            <DialogDescription>
              {language === 'hi' ? 'भुगतान विवरण दर्ज करें और रसीद बनाएं' : 'Enter payment details and generate receipt'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.selectProfile} *</Label>
              <Select 
                value={paymentFormData.profileId} 
                onValueChange={(val) => {
                  const _profile = profiles?.find(p => p.id === val)
                  setPaymentFormData(prev => ({
                    ...prev, 
                    profileId: val,
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'hi' ? 'प्रोफाइल चुनें' : 'Select Profile'} />
                </SelectTrigger>
                <SelectContent>
                  {profiles?.filter(p => !p.isDeleted).map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.fullName} ({profile.profileId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.transactionId} *</Label>
              <Input 
                value={paymentFormData.transactionId}
                onChange={(e) => setPaymentFormData(prev => ({...prev, transactionId: e.target.value}))}
                placeholder={language === 'hi' ? 'UPI/बैंक ट्रांसेक्शन ID' : 'UPI/Bank Transaction ID'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.membershipPlan}</Label>
                <Select 
                  value={paymentFormData.plan} 
                  onValueChange={(val) => {
                    let amount = 0
                    if (val === '6-month') amount = membershipSettings?.sixMonthPrice || 500
                    else if (val === '1-year') amount = membershipSettings?.oneYearPrice || 900
                    setPaymentFormData(prev => ({...prev, plan: val, amount}))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">{t.freePlan} (₹0)</SelectItem>
                    <SelectItem value="6-month">{t.sixMonthPlan} (₹{membershipSettings?.sixMonthPrice || 500})</SelectItem>
                    <SelectItem value="1-year">{t.oneYearPlan} (₹{membershipSettings?.oneYearPrice || 900})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.paymentMode}</Label>
                <Select 
                  value={paymentFormData.paymentMode} 
                  onValueChange={(val) => setPaymentFormData(prev => ({...prev, paymentMode: val}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t.cash}</SelectItem>
                    <SelectItem value="upi">{t.upi}</SelectItem>
                    <SelectItem value="card">{t.card}</SelectItem>
                    <SelectItem value="netbanking">{t.netbanking}</SelectItem>
                    <SelectItem value="cheque">{t.cheque}</SelectItem>
                    <SelectItem value="other">{t.other}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.originalAmount} (₹)</Label>
                <Input 
                  type="number"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData(prev => ({...prev, amount: parseInt(e.target.value) || 0}))}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.discountAmount} (₹)</Label>
                <Input 
                  type="number"
                  value={paymentFormData.discountAmount}
                  onChange={(e) => setPaymentFormData(prev => ({...prev, discountAmount: parseInt(e.target.value) || 0}))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.paymentDate}</Label>
              <Input 
                type="date"
                value={paymentFormData.paymentDate}
                onChange={(e) => setPaymentFormData(prev => ({...prev, paymentDate: e.target.value}))}
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'hi' ? 'नोट्स (वैकल्पिक)' : 'Notes (Optional)'}</Label>
              <Textarea 
                value={paymentFormData.notes}
                onChange={(e) => setPaymentFormData(prev => ({...prev, notes: e.target.value}))}
                placeholder={language === 'hi' ? 'अतिरिक्त जानकारी...' : 'Additional notes...'}
                rows={2}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span>{t.originalAmount}:</span>
                <span>₹{paymentFormData.amount}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>{language === 'hi' ? 'छूट' : 'Discount'}:</span>
                <span>-₹{paymentFormData.discountAmount}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>{t.finalAmount}:</span>
                <span className="text-green-600">₹{Math.max(0, paymentFormData.amount - paymentFormData.discountAmount)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPaymentFormDialog(false)}>
              {t.cancel}
            </Button>
            <Button 
              onClick={() => {
                const profile = profiles?.find(p => p.id === paymentFormData.profileId)
                if (!profile || !paymentFormData.transactionId) {
                  toast.error(language === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें' : 'Please fill all required fields')
                  return
                }

                // Calculate expiry date based on plan
                const paymentDate = new Date(paymentFormData.paymentDate)
                const expiryDate = new Date(paymentDate)
                if (paymentFormData.plan === 'free') {
                  expiryDate.setMonth(expiryDate.getMonth() + 6)
                } else if (paymentFormData.plan === '6-month') {
                  expiryDate.setMonth(expiryDate.getMonth() + (membershipSettings?.sixMonthDuration || 6))
                } else if (paymentFormData.plan === '1-year') {
                  expiryDate.setMonth(expiryDate.getMonth() + (membershipSettings?.oneYearDuration || 12))
                }

                // Generate receipt number
                const receiptNumber = `RCP${Date.now().toString().slice(-8)}`
                const finalAmount = Math.max(0, paymentFormData.amount - paymentFormData.discountAmount)

                const newTransaction: PaymentTransaction = {
                  id: crypto.randomUUID(),
                  transactionId: paymentFormData.transactionId,
                  profileId: profile.profileId,
                  profileName: profile.fullName,
                  profileMobile: profile.mobile,
                  profileEmail: profile.email,
                  plan: paymentFormData.plan as any,
                  amount: paymentFormData.amount,
                  discountAmount: paymentFormData.discountAmount,
                  finalAmount,
                  paymentMode: paymentFormData.paymentMode as any,
                  paymentDate: paymentFormData.paymentDate,
                  expiryDate: expiryDate.toISOString(),
                  receiptNumber,
                  notes: paymentFormData.notes,
                  createdAt: new Date().toISOString(),
                  createdBy: 'Admin'
                }

                setPaymentTransactions(prev => [...(prev || []), newTransaction])

                // Also update the profile membership
                setProfiles(current => 
                  (current || []).map(p => 
                    p.id === profile.id 
                      ? { 
                          ...p, 
                          membershipPlan: paymentFormData.plan as any,
                          membershipExpiry: expiryDate.toISOString()
                        }
                      : p
                  )
                )

                toast.success(t.paymentRecorded)
                setShowPaymentFormDialog(false)

                // Show receipt
                setSelectedTransaction(newTransaction)
                setShowReceiptDialog(true)
              }}
              className="bg-green-600 hover:bg-green-700 gap-2"
              disabled={!paymentFormData.profileId || !paymentFormData.transactionId}
            >
              <Receipt size={16} />
              {t.generateReceipt}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt View Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FilePdf size={24} className="text-red-600" />
              {t.paymentReceipt}
            </DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <ScrollArea className="flex-1 max-h-[60vh] pr-4">
              <div id="receipt-content" className="space-y-4">
                {/* Receipt Header */}
                <div className="text-center border-b pb-4">
                  <h2 className="text-2xl font-bold text-primary">ShaadiPartnerSearch</h2>
                  <p className="text-muted-foreground text-sm">
                    {language === 'hi' ? 'विश्वसनीय वैवाहिक सेवा' : 'Trusted Matrimonial Service'}
                  </p>
                  <div className="mt-2 inline-block bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-semibold">
                    {t.paymentReceipt}
                  </div>
                </div>

                {/* Receipt Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t.receiptNumber}</p>
                    <p className="font-mono font-bold">{selectedTransaction.receiptNumber}</p>
                  </div>
                <div>
                  <p className="text-muted-foreground">{t.transactionId}</p>
                  <p className="font-mono font-bold">{selectedTransaction.transactionId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.paymentDate}</p>
                  <p className="font-semibold">{formatDateDDMMYYYY(selectedTransaction.paymentDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.paymentMode}</p>
                  <p className="font-semibold capitalize">{selectedTransaction.paymentMode}</p>
                </div>
              </div>

              <Separator />

              {/* Customer Details */}
              <div className="space-y-2">
                <h4 className="font-semibold text-muted-foreground">{language === 'hi' ? 'ग्राहक विवरण' : 'Customer Details'}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t.name}</p>
                    <p className="font-semibold">{selectedTransaction.profileName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t.profileId}</p>
                    <p className="font-mono">{selectedTransaction.profileId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t.mobile}</p>
                    <p className="font-semibold">{selectedTransaction.profileMobile}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t.email}</p>
                    <p className="font-semibold text-xs">{selectedTransaction.profileEmail}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Plan Details */}
              <div className="space-y-2">
                <h4 className="font-semibold text-muted-foreground">{language === 'hi' ? 'योजना विवरण' : 'Plan Details'}</h4>
                <div className="p-4 bg-muted rounded-lg overflow-hidden">
                  <div className="flex justify-between items-center mb-2 gap-2 flex-wrap">
                    <span className="shrink-0">{t.membershipPlan}</span>
                    <Badge className="shrink-0">
                      {selectedTransaction.plan === 'free' ? t.freePlan : 
                       selectedTransaction.plan === '6-month' ? t.sixMonthPlan : t.oneYearPlan}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>{t.originalAmount}</span>
                    <span className="font-mono">₹{selectedTransaction.amount}</span>
                  </div>
                  {selectedTransaction.discountAmount > 0 && (
                    <div className="flex justify-between items-center mb-2 text-green-600">
                      <span>{language === 'hi' ? 'छूट' : 'Discount'}</span>
                      <span className="font-mono">-₹{selectedTransaction.discountAmount}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>{t.finalAmount}</span>
                    <span className="text-green-600 font-mono">₹{selectedTransaction.finalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Validity */}
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground">{language === 'hi' ? 'वैधता अवधि' : 'Validity Period'}</p>
                <p className="font-semibold">
                  {formatDateDDMMYYYY(selectedTransaction.paymentDate)} - {formatDateDDMMYYYY(selectedTransaction.expiryDate)}
                </p>
              </div>

              {selectedTransaction.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground">{language === 'hi' ? 'नोट्स' : 'Notes'}</p>
                  <p>{selectedTransaction.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground border-t pt-4">
                <p>{language === 'hi' ? 'यह कंप्यूटर जनित रसीद है।' : 'This is a computer generated receipt.'}</p>
                <p>{language === 'hi' ? 'धन्यवाद!' : 'Thank you for your payment!'}</p>
              </div>
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-end gap-2 mt-4 flex-wrap shrink-0">
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              {t.close}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                if (selectedTransaction) {
                  // Generate receipt as PDF using print-to-PDF
                  const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${selectedTransaction.receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { color: #7c3aed; font-size: 24px; margin-bottom: 5px; }
    .header .subtitle { color: #666; font-size: 12px; }
    .header .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14px; color: #666; font-weight: 600; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field { margin-bottom: 8px; }
    .field .label { font-size: 11px; color: #888; }
    .field .value { font-size: 13px; font-weight: 600; }
    .plan-box { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 10px; }
    .plan-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .plan-row.total { border-top: 1px solid #ccc; padding-top: 10px; margin-top: 10px; font-weight: bold; font-size: 16px; }
    .plan-row.total .amount { color: #16a34a; }
    .discount { color: #16a34a; }
    .validity { text-align: center; background: #eff6ff; padding: 12px; border-radius: 8px; margin-top: 15px; }
    .validity .label { font-size: 11px; color: #666; }
    .validity .dates { font-weight: 600; font-size: 13px; margin-top: 5px; }
    .footer { text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>ShaadiPartnerSearch</h1>
    <div class="subtitle">${language === 'hi' ? 'विश्वसनीय वैवाहिक सेवा' : 'Trusted Matrimonial Service'}</div>
    <div class="badge">${t.paymentReceipt}</div>
  </div>

  <div class="section">
    <div class="grid">
      <div class="field">
        <div class="label">${t.receiptNumber}</div>
        <div class="value" style="font-family: monospace;">${selectedTransaction.receiptNumber}</div>
      </div>
      <div class="field">
        <div class="label">${t.transactionId}</div>
        <div class="value" style="font-family: monospace;">${selectedTransaction.transactionId}</div>
      </div>
      <div class="field">
        <div class="label">${t.paymentDate}</div>
        <div class="value">${formatDateDDMMYYYY(selectedTransaction.paymentDate)}</div>
      </div>
      <div class="field">
        <div class="label">${t.paymentMode}</div>
        <div class="value" style="text-transform: capitalize;">${selectedTransaction.paymentMode}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${language === 'hi' ? 'ग्राहक विवरण' : 'Customer Details'}</div>
    <div class="grid">
      <div class="field">
        <div class="label">${t.name}</div>
        <div class="value">${selectedTransaction.profileName}</div>
      </div>
      <div class="field">
        <div class="label">${t.profileId}</div>
        <div class="value" style="font-family: monospace;">${selectedTransaction.profileId}</div>
      </div>
      <div class="field">
        <div class="label">${t.mobile}</div>
        <div class="value">${selectedTransaction.profileMobile}</div>
      </div>
      <div class="field">
        <div class="label">${t.email}</div>
        <div class="value" style="font-size: 11px;">${selectedTransaction.profileEmail}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${language === 'hi' ? 'योजना विवरण' : 'Plan Details'}</div>
    <div class="plan-box">
      <div class="plan-row">
        <span>${t.membershipPlan}</span>
        <span style="font-weight: 600;">${selectedTransaction.plan === 'free' ? t.freePlan : selectedTransaction.plan === '6-month' ? t.sixMonthPlan : t.oneYearPlan}</span>
      </div>
      <div class="plan-row">
        <span>${t.originalAmount}</span>
        <span style="font-family: monospace;">₹${selectedTransaction.amount}</span>
      </div>
      ${selectedTransaction.discountAmount > 0 ? `
      <div class="plan-row discount">
        <span>${language === 'hi' ? 'छूट' : 'Discount'}</span>
        <span style="font-family: monospace;">-₹${selectedTransaction.discountAmount}</span>
      </div>
      ` : ''}
      <div class="plan-row total">
        <span>${t.finalAmount}</span>
        <span class="amount" style="font-family: monospace;">₹${selectedTransaction.finalAmount}</span>
      </div>
    </div>
  </div>

  <div class="validity">
    <div class="label">${language === 'hi' ? 'वैधता अवधि' : 'Validity Period'}</div>
    <div class="dates">${formatDateDDMMYYYY(selectedTransaction.paymentDate)} - ${formatDateDDMMYYYY(selectedTransaction.expiryDate)}</div>
  </div>

  ${selectedTransaction.notes ? `
  <div class="section" style="margin-top: 15px;">
    <div class="field">
      <div class="label">${language === 'hi' ? 'नोट्स' : 'Notes'}</div>
      <div class="value">${selectedTransaction.notes}</div>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>${language === 'hi' ? 'यह कंप्यूटर जनित रसीद है।' : 'This is a computer generated receipt.'}</p>
    <p>${language === 'hi' ? 'ShaadiPartnerSearch चुनने के लिए धन्यवाद!' : 'Thank you for choosing ShaadiPartnerSearch!'}</p>
  </div>
</body>
</html>
                  `.trim()
                  
                  // Open a new window with the receipt for print/save as PDF
                  const printWindow = window.open('', '_blank', 'width=700,height=900')
                  if (printWindow) {
                    printWindow.document.write(receiptHtml)
                    printWindow.document.close()
                    // Give the content time to load before triggering print
                    setTimeout(() => {
                      printWindow.print()
                    }, 300)
                    toast.success(language === 'hi' ? 'PDF के रूप में सहेजने के लिए प्रिंट करें!' : 'Use Print > Save as PDF to download!')
                  }
                }
              }}
              className="gap-2"
            >
              <DownloadSimple size={16} />
              {t.downloadReceipt}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                if (selectedTransaction) {
                  // Print only the receipt content
                  const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${selectedTransaction.receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { color: #7c3aed; font-size: 24px; margin-bottom: 5px; }
    .header .subtitle { color: #666; font-size: 12px; }
    .header .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14px; color: #666; font-weight: 600; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field { margin-bottom: 8px; }
    .field .label { font-size: 11px; color: #888; }
    .field .value { font-size: 13px; font-weight: 600; }
    .plan-box { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 10px; }
    .plan-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .plan-row.total { border-top: 1px solid #ccc; padding-top: 10px; margin-top: 10px; font-weight: bold; font-size: 16px; }
    .plan-row.total .amount { color: #16a34a; }
    .discount { color: #16a34a; }
    .validity { text-align: center; background: #eff6ff; padding: 12px; border-radius: 8px; margin-top: 15px; }
    .validity .label { font-size: 11px; color: #666; }
    .validity .dates { font-weight: 600; font-size: 13px; margin-top: 5px; }
    .footer { text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>ShaadiPartnerSearch</h1>
    <div class="subtitle">${language === 'hi' ? 'विश्वसनीय वैवाहिक सेवा' : 'Trusted Matrimonial Service'}</div>
    <div class="badge">${t.paymentReceipt}</div>
  </div>

  <div class="section">
    <div class="grid">
      <div class="field">
        <div class="label">${t.receiptNumber}</div>
        <div class="value" style="font-family: monospace;">${selectedTransaction.receiptNumber}</div>
      </div>
      <div class="field">
        <div class="label">${t.transactionId}</div>
        <div class="value" style="font-family: monospace;">${selectedTransaction.transactionId}</div>
      </div>
      <div class="field">
        <div class="label">${t.paymentDate}</div>
        <div class="value">${formatDateDDMMYYYY(selectedTransaction.paymentDate)}</div>
      </div>
      <div class="field">
        <div class="label">${t.paymentMode}</div>
        <div class="value" style="text-transform: capitalize;">${selectedTransaction.paymentMode}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${language === 'hi' ? 'ग्राहक विवरण' : 'Customer Details'}</div>
    <div class="grid">
      <div class="field">
        <div class="label">${t.name}</div>
        <div class="value">${selectedTransaction.profileName}</div>
      </div>
      <div class="field">
        <div class="label">${t.profileId}</div>
        <div class="value" style="font-family: monospace;">${selectedTransaction.profileId}</div>
      </div>
      <div class="field">
        <div class="label">${t.mobile}</div>
        <div class="value">${selectedTransaction.profileMobile}</div>
      </div>
      <div class="field">
        <div class="label">${t.email}</div>
        <div class="value" style="font-size: 11px;">${selectedTransaction.profileEmail}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${language === 'hi' ? 'योजना विवरण' : 'Plan Details'}</div>
    <div class="plan-box">
      <div class="plan-row">
        <span>${t.membershipPlan}</span>
        <span style="font-weight: 600;">${selectedTransaction.plan === 'free' ? t.freePlan : selectedTransaction.plan === '6-month' ? t.sixMonthPlan : t.oneYearPlan}</span>
      </div>
      <div class="plan-row">
        <span>${t.originalAmount}</span>
        <span style="font-family: monospace;">₹${selectedTransaction.amount}</span>
      </div>
      ${selectedTransaction.discountAmount > 0 ? `
      <div class="plan-row discount">
        <span>${language === 'hi' ? 'छूट' : 'Discount'}</span>
        <span style="font-family: monospace;">-₹${selectedTransaction.discountAmount}</span>
      </div>
      ` : ''}
      <div class="plan-row total">
        <span>${t.finalAmount}</span>
        <span class="amount" style="font-family: monospace;">₹${selectedTransaction.finalAmount}</span>
      </div>
    </div>
  </div>

  <div class="validity">
    <div class="label">${language === 'hi' ? 'वैधता अवधि' : 'Validity Period'}</div>
    <div class="dates">${formatDateDDMMYYYY(selectedTransaction.paymentDate)} - ${formatDateDDMMYYYY(selectedTransaction.expiryDate)}</div>
  </div>

  ${selectedTransaction.notes ? `
  <div class="section" style="margin-top: 15px;">
    <div class="field">
      <div class="label">${language === 'hi' ? 'नोट्स' : 'Notes'}</div>
      <div class="value">${selectedTransaction.notes}</div>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>${language === 'hi' ? 'यह कंप्यूटर जनित रसीद है।' : 'This is a computer generated receipt.'}</p>
    <p>${language === 'hi' ? 'ShaadiPartnerSearch चुनने के लिए धन्यवाद!' : 'Thank you for choosing ShaadiPartnerSearch!'}</p>
  </div>
</body>
</html>
                  `.trim()
                  
                  // Open a new window with only the receipt for printing
                  const printWindow = window.open('', '_blank', 'width=700,height=900')
                  if (printWindow) {
                    printWindow.document.write(receiptHtml)
                    printWindow.document.close()
                    setTimeout(() => {
                      printWindow.print()
                      printWindow.close()
                    }, 300)
                  }
                }
              }}
              className="gap-2"
            >
              <Printer size={16} />
              {t.printReceipt}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                if (selectedTransaction) {
                  const receiptText = `
ShaadiPartnerSearch - ${t.paymentReceipt}
========================================
${t.receiptNumber}: ${selectedTransaction.receiptNumber}
${t.transactionId}: ${selectedTransaction.transactionId}
${t.paymentDate}: ${formatDateDDMMYYYY(selectedTransaction.paymentDate)}

${language === 'hi' ? 'ग्राहक विवरण' : 'Customer Details'}:
${t.name}: ${selectedTransaction.profileName}
${t.profileId}: ${selectedTransaction.profileId}
${t.mobile}: ${selectedTransaction.profileMobile}
${t.email}: ${selectedTransaction.profileEmail}

${language === 'hi' ? 'योजना विवरण' : 'Plan Details'}:
${t.membershipPlan}: ${selectedTransaction.plan === 'free' ? t.freePlan : selectedTransaction.plan === '6-month' ? t.sixMonthPlan : t.oneYearPlan}
${t.originalAmount}: ₹${selectedTransaction.amount}
${language === 'hi' ? 'छूट' : 'Discount'}: ₹${selectedTransaction.discountAmount}
${t.finalAmount}: ₹${selectedTransaction.finalAmount}

${language === 'hi' ? 'वैधता' : 'Validity'}: ${formatDateDDMMYYYY(selectedTransaction.paymentDate)} - ${formatDateDDMMYYYY(selectedTransaction.expiryDate)}
========================================
                  `.trim()
                  
                  if (navigator.share) {
                    navigator.share({
                      title: `${t.paymentReceipt} - ${selectedTransaction.receiptNumber}`,
                      text: receiptText
                    })
                  } else {
                    navigator.clipboard.writeText(receiptText)
                    toast.success(language === 'hi' ? 'रसीद कॉपी हो गई!' : 'Receipt copied to clipboard!')
                  }
                }
              }}
              className="gap-2"
            >
              <ShareNetwork size={16} />
              {t.shareReceipt}
            </Button>
            <Button 
              onClick={() => {
                if (selectedTransaction) {
                  const emailBody = encodeURIComponent(`
Dear ${selectedTransaction.profileName},

Thank you for your payment. Please find your receipt details below:

Receipt Number: ${selectedTransaction.receiptNumber}
Transaction ID: ${selectedTransaction.transactionId}
Payment Date: ${formatDateDDMMYYYY(selectedTransaction.paymentDate)}
Plan: ${selectedTransaction.plan === 'free' ? 'Free Plan' : selectedTransaction.plan === '6-month' ? '6 Month Plan' : '1 Year Plan'}
Amount Paid: ₹${selectedTransaction.finalAmount}
Valid Till: ${formatDateDDMMYYYY(selectedTransaction.expiryDate)}

Thank you for choosing ShaadiPartnerSearch!

Best Regards,
ShaadiPartnerSearch Team
                  `.trim())
                  
                  window.open(`mailto:${selectedTransaction.profileEmail}?subject=Payment Receipt - ${selectedTransaction.receiptNumber}&body=${emailBody}`, '_blank')
                }
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Envelope size={16} />
              {t.emailReceipt}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Confirmation Dialog */}
      <Dialog open={!!showDeleteTransactionDialog} onOpenChange={(open) => !open && setShowDeleteTransactionDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash size={24} />
              {language === 'hi' ? 'लेन-देन हटाएं' : 'Delete Transaction'}
            </DialogTitle>
            <DialogDescription>
              {language === 'hi' ? 'क्या आप वाकई इस लेन-देन को हटाना चाहते हैं?' : 'Are you sure you want to delete this transaction?'}
            </DialogDescription>
          </DialogHeader>

          {showDeleteTransactionDialog && (
            <div className="py-4 space-y-2">
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.receiptNumber}:</span>
                  <span className="font-mono font-bold">{showDeleteTransactionDialog.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.name}:</span>
                  <span className="font-semibold">{showDeleteTransactionDialog.profileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.finalAmount}:</span>
                  <span className="font-bold text-green-600">₹{showDeleteTransactionDialog.finalAmount}</span>
                </div>
              </div>
              <Alert variant="destructive">
                <Warning className="h-4 w-4" />
                <AlertDescription>
                  {language === 'hi' ? 'यह क्रिया पूर्ववत नहीं की जा सकती।' : 'This action cannot be undone.'}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteTransactionDialog(null)}>
              {t.cancel}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (showDeleteTransactionDialog) {
                  setPaymentTransactions((prev: PaymentTransaction[]) => 
                    prev.filter((tx: PaymentTransaction) => tx.id !== showDeleteTransactionDialog.id)
                  )
                  toast.success(language === 'hi' ? 'लेन-देन हटा दिया गया!' : 'Transaction deleted!')
                  setShowDeleteTransactionDialog(null)
                }
              }}
              className="gap-2"
            >
              <Trash size={16} />
              {language === 'hi' ? 'हटाएं' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ArrowCounterClockwise size={24} />
              {t.processRefund}
            </DialogTitle>
            <DialogDescription>
              {language === 'hi' ? 'रिफंड विवरण दर्ज करें' : 'Enter refund details'}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4 py-4">
              {/* Transaction Info */}
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">{t.receiptNumber}:</span>
                  <span className="font-mono">{selectedTransaction.receiptNumber}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">{t.name}:</span>
                  <span className="font-semibold">{selectedTransaction.profileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.finalAmount}:</span>
                  <span className="font-bold text-green-600">₹{selectedTransaction.finalAmount}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.refundAmount} (₹) *</Label>
                <Input 
                  type="number"
                  value={refundFormData.refundAmount}
                  onChange={(e) => setRefundFormData(prev => ({...prev, refundAmount: parseInt(e.target.value) || 0}))}
                  max={selectedTransaction.finalAmount}
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'hi' ? `अधिकतम: ₹${selectedTransaction.finalAmount}` : `Maximum: ₹${selectedTransaction.finalAmount}`}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t.refundTransactionId}</Label>
                <Input 
                  value={refundFormData.refundTransactionId}
                  onChange={(e) => setRefundFormData(prev => ({...prev, refundTransactionId: e.target.value}))}
                  placeholder={language === 'hi' ? 'रिफंड ट्रांजेक्शन ID (वैकल्पिक)' : 'Refund transaction ID (optional)'}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.refundReason} *</Label>
                <Textarea 
                  value={refundFormData.refundReason}
                  onChange={(e) => setRefundFormData(prev => ({...prev, refundReason: e.target.value}))}
                  placeholder={language === 'hi' ? 'रिफंड का कारण लिखें...' : 'Enter reason for refund...'}
                  rows={3}
                />
              </div>

              <Alert variant="destructive">
                <Info size={16} />
                <AlertDescription>
                  {language === 'hi' 
                    ? 'रिफंड प्रोसेस करने के बाद इसे वापस नहीं किया जा सकता।' 
                    : 'Once processed, refund cannot be reversed.'}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              {t.cancel}
            </Button>
            <Button 
              onClick={() => {
                if (!selectedTransaction || !refundFormData.refundReason || refundFormData.refundAmount <= 0) {
                  toast.error(language === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें' : 'Please fill all required fields')
                  return
                }

                if (refundFormData.refundAmount > selectedTransaction.finalAmount) {
                  toast.error(language === 'hi' ? 'रिफंड राशि भुगतान से अधिक नहीं हो सकती' : 'Refund amount cannot exceed payment amount')
                  return
                }

                // Update the transaction with refund info
                setPaymentTransactions(prev => 
                  (prev || []).map(tx => 
                    tx.id === selectedTransaction.id 
                      ? {
                          ...tx,
                          isRefunded: true,
                          refundAmount: refundFormData.refundAmount,
                          refundDate: new Date().toISOString(),
                          refundReason: refundFormData.refundReason,
                          refundTransactionId: refundFormData.refundTransactionId,
                          refundedBy: 'Admin'
                        }
                      : tx
                  )
                )

                toast.success(t.refundProcessed)
                setShowRefundDialog(false)
                setSelectedTransaction(null)
              }}
              className="gap-2 bg-red-600 hover:bg-red-700"
              disabled={!refundFormData.refundReason || refundFormData.refundAmount <= 0}
            >
              <ArrowCounterClockwise size={16} />
              {t.processRefund}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ID Verification Dialog */}
      <Dialog open={showDigilockerDialog} onOpenChange={setShowDigilockerDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck size={24} className="text-blue-600" />
              {t.idProofVerification}
            </DialogTitle>
            <DialogDescription>
              {digilockerProfile?.fullName} ({digilockerProfile?.profileId})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Profile Details Section for Verification */}
            <div className="p-4 bg-muted/30 rounded-lg border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <UserIcon size={18} />
                {language === 'hi' ? 'प्रोफ़ाइल विवरण (मिलान के लिए)' : 'Profile Details (For Matching)'}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">{language === 'hi' ? 'पूरा नाम' : 'Full Name'}</Label>
                  <p className="font-medium text-lg">{digilockerProfile?.fullName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{language === 'hi' ? 'जन्म तिथि' : 'Date of Birth'}</Label>
                  <p className="font-medium text-lg">{digilockerProfile?.dateOfBirth ? formatDateDDMMYYYY(digilockerProfile.dateOfBirth) : '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{language === 'hi' ? 'आयु' : 'Age'}</Label>
                  <p className="font-medium">{digilockerProfile?.age} {language === 'hi' ? 'वर्ष' : 'years'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{language === 'hi' ? 'लिंग' : 'Gender'}</Label>
                  <p className="font-medium">{digilockerProfile?.gender === 'male' ? (language === 'hi' ? 'पुरुष' : 'Male') : (language === 'hi' ? 'महिला' : 'Female')}</p>
                </div>
              </div>
            </div>

            {/* Photos Comparison Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Profile Photo */}
              <div className="border rounded-lg p-3">
                <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <UserIcon size={16} />
                  {language === 'hi' ? 'प्रोफ़ाइल फोटो' : 'Profile Photo'}
                </Label>
                <div className="bg-muted/20 rounded-lg p-2 flex items-center justify-center min-h-[200px]">
                  {digilockerProfile?.photos && digilockerProfile.photos.length > 0 ? (
                    <img 
                      src={digilockerProfile.photos[0]} 
                      alt="Profile Photo"
                      className="max-h-[250px] object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openLightbox(digilockerProfile.photos || [], 0)}
                    />
                  ) : digilockerProfile?.selfieUrl ? (
                    <img 
                      src={digilockerProfile.selfieUrl} 
                      alt="Selfie"
                      className="max-h-[250px] object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openLightbox([digilockerProfile.selfieUrl!], 0)}
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm text-center p-4">
                      {language === 'hi' ? 'कोई फोटो नहीं' : 'No photo available'}
                    </div>
                  )}
                </div>
                {(digilockerProfile?.photos && digilockerProfile.photos.length > 0) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => openLightbox(digilockerProfile.photos || [], 0)}
                  >
                    <Eye size={14} className="mr-1" />
                    {language === 'hi' ? 'बड़ा करके देखें' : 'View Full Size'}
                  </Button>
                )}
              </div>

              {/* ID Proof Photo */}
              <div className="border rounded-lg p-3">
                <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <IdentificationCard size={16} />
                  {language === 'hi' ? 'पहचान प्रमाण' : 'ID Proof'}
                  {digilockerProfile?.idProofType && (
                    <Badge variant="secondary" className="ml-2">
                      {digilockerProfile.idProofType === 'aadhaar' && t.aadhaar}
                      {digilockerProfile.idProofType === 'pan' && t.pan}
                      {digilockerProfile.idProofType === 'driving-license' && t.drivingLicense}
                      {digilockerProfile.idProofType === 'passport' && t.passport}
                      {digilockerProfile.idProofType === 'voter-id' && t.voterId}
                    </Badge>
                  )}
                </Label>
                <div className="bg-muted/20 rounded-lg p-2 flex items-center justify-center min-h-[200px]">
                  {digilockerProfile?.idProofUrl ? (
                    <img 
                      src={digilockerProfile.idProofUrl} 
                      alt="ID Proof"
                      className="max-h-[250px] object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openLightbox([digilockerProfile.idProofUrl!], 0)}
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm text-center p-4">
                      {t.idProofNotUploaded}
                    </div>
                  )}
                </div>
                {digilockerProfile?.idProofUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => openLightbox([digilockerProfile.idProofUrl!], 0)}
                  >
                    <Eye size={14} className="mr-1" />
                    {language === 'hi' ? 'बड़ा करके देखें' : 'View Full Size'}
                  </Button>
                )}
              </div>
            </div>

            {/* Verification Instructions */}
            <Alert>
              <Info size={18} />
              <AlertDescription>
                {language === 'hi' 
                  ? 'कृपया जांचें: 1) ID पर नाम प्रोफ़ाइल नाम से मेल खाता है 2) ID पर जन्मतिथि प्रोफ़ाइल से मेल खाती है 3) ID पर फोटो प्रोफ़ाइल फोटो से मेल खाती है' 
                  : 'Please verify: 1) Name on ID matches profile name 2) DOB on ID matches profile 3) Photo on ID matches profile photo'}
              </AlertDescription>
            </Alert>

            {/* Current Status */}
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t.status}:</span>
                {digilockerProfile?.digilockerVerified ? (
                  <Badge className="bg-green-600">
                    <ShieldCheck size={14} className="mr-1" />
                    {t.digilockerVerified}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-400">
                    {t.digilockerNotVerified}
                  </Badge>
                )}
              </div>
              {digilockerProfile?.digilockerVerified && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  <p>{t.digilockerDocType}: {
                    digilockerProfile.digilockerDocumentType === 'aadhaar' ? t.aadhaar :
                    digilockerProfile.digilockerDocumentType === 'pan' ? t.pan :
                    digilockerProfile.digilockerDocumentType === 'driving-license' ? t.drivingLicense :
                    t.passport
                  }</p>
                  <p>{t.verifiedAt}: {new Date(digilockerProfile.digilockerVerifiedAt!).toLocaleDateString()}</p>
                  {digilockerProfile.digilockerNotes && (
                    <p>{t.verificationNotes}: {digilockerProfile.digilockerNotes}</p>
                  )}
                </div>
              )}
            </div>

            {/* Verification Form */}
            {!digilockerProfile?.digilockerVerified && (
              <>
                <div className="space-y-2">
                  <Label>{t.digilockerDocType}</Label>
                  <Select
                    value={digilockerFormData.documentType}
                    onValueChange={(v) => setDigilockerFormData(prev => ({ 
                      ...prev, 
                      documentType: v as 'aadhaar' | 'pan' | 'driving-license' | 'passport' 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aadhaar">{t.aadhaar}</SelectItem>
                      <SelectItem value="pan">{t.pan}</SelectItem>
                      <SelectItem value="driving-license">{t.drivingLicense}</SelectItem>
                      <SelectItem value="passport">{t.passport}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t.verificationNotes}</Label>
                  <Textarea
                    value={digilockerFormData.notes}
                    onChange={(e) => setDigilockerFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={language === 'hi' ? 'वैकल्पिक नोट्स...' : 'Optional notes...'}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDigilockerDialog(false)}>
                {t.cancel}
              </Button>
              {digilockerProfile?.digilockerVerified ? (
                <Button 
                  variant="destructive" 
                  onClick={() => handleDigilockerVerify(false)}
                  className="gap-2"
                >
                  {t.removeVerification}
                </Button>
              ) : (
                <Button 
                  onClick={() => handleDigilockerVerify(true)}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <ShieldCheck size={16} />
                  {t.markAsVerified}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ID Proof View Dialog */}
      <Dialog open={showIdProofViewDialog} onOpenChange={setShowIdProofViewDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IdentificationCard size={24} weight="fill" />
              {t.viewIdProof} - {idProofViewProfile?.fullName}
            </DialogTitle>
            <DialogDescription>
              {idProofViewProfile?.profileId}
            </DialogDescription>
          </DialogHeader>

          {idProofViewProfile && (
            <div className="space-y-4">
              {/* Profile Details Section for Verification */}
              <div className="p-4 bg-muted/30 rounded-lg border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <UserIcon size={18} />
                  {language === 'hi' ? 'प्रोफ़ाइल विवरण (मिलान के लिए)' : 'Profile Details (For Matching)'}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">{language === 'hi' ? 'पूरा नाम' : 'Full Name'}</Label>
                    <p className="font-medium text-lg">{idProofViewProfile.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{language === 'hi' ? 'जन्म तिथि' : 'Date of Birth'}</Label>
                    <p className="font-medium text-lg">{idProofViewProfile.dateOfBirth ? formatDateDDMMYYYY(idProofViewProfile.dateOfBirth) : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{language === 'hi' ? 'आयु' : 'Age'}</Label>
                    <p className="font-medium">{idProofViewProfile.age} {language === 'hi' ? 'वर्ष' : 'years'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{language === 'hi' ? 'लिंग' : 'Gender'}</Label>
                    <p className="font-medium">{idProofViewProfile.gender === 'male' ? (language === 'hi' ? 'पुरुष' : 'Male') : (language === 'hi' ? 'महिला' : 'Female')}</p>
                  </div>
                </div>
              </div>

              {/* Photos Comparison Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Photo */}
                <div className="border rounded-lg p-3">
                  <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <UserIcon size={16} />
                    {language === 'hi' ? 'प्रोफ़ाइल फोटो' : 'Profile Photo'}
                  </Label>
                  <div className="bg-muted/20 rounded-lg p-2 flex items-center justify-center min-h-[200px]">
                    {idProofViewProfile.photos && idProofViewProfile.photos.length > 0 ? (
                      <img 
                        src={idProofViewProfile.photos[0]} 
                        alt="Profile Photo"
                        className="max-h-[250px] object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openLightbox(idProofViewProfile.photos || [], 0)}
                      />
                    ) : idProofViewProfile.selfieUrl ? (
                      <img 
                        src={idProofViewProfile.selfieUrl} 
                        alt="Selfie"
                        className="max-h-[250px] object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openLightbox([idProofViewProfile.selfieUrl!], 0)}
                      />
                    ) : (
                      <div className="text-muted-foreground text-sm text-center p-4">
                        {language === 'hi' ? 'कोई फोटो नहीं' : 'No photo available'}
                      </div>
                    )}
                  </div>
                  {(idProofViewProfile.photos && idProofViewProfile.photos.length > 0) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => openLightbox(idProofViewProfile.photos || [], 0)}
                    >
                      <Eye size={14} className="mr-1" />
                      {language === 'hi' ? 'बड़ा करके देखें' : 'View Full Size'}
                    </Button>
                  )}
                </div>

                {/* ID Proof Photo */}
                <div className="border rounded-lg p-3">
                  <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <IdentificationCard size={16} />
                    {language === 'hi' ? 'पहचान प्रमाण' : 'ID Proof'}
                    {idProofViewProfile.idProofType && (
                      <Badge variant="secondary" className="ml-2">
                        {idProofViewProfile.idProofType === 'aadhaar' && t.aadhaar}
                        {idProofViewProfile.idProofType === 'pan' && t.pan}
                        {idProofViewProfile.idProofType === 'driving-license' && t.drivingLicense}
                        {idProofViewProfile.idProofType === 'passport' && t.passport}
                        {idProofViewProfile.idProofType === 'voter-id' && t.voterId}
                      </Badge>
                    )}
                  </Label>
                  <div className="bg-muted/20 rounded-lg p-2 flex items-center justify-center min-h-[200px]">
                    {idProofViewProfile.idProofUrl ? (
                      <img 
                        src={idProofViewProfile.idProofUrl} 
                        alt="ID Proof"
                        className="max-h-[250px] object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openLightbox([idProofViewProfile.idProofUrl!], 0)}
                      />
                    ) : (
                      <div className="text-muted-foreground text-sm text-center p-4">
                        {t.idProofNotUploaded}
                      </div>
                    )}
                  </div>
                  {idProofViewProfile.idProofUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => openLightbox([idProofViewProfile.idProofUrl!], 0)}
                    >
                      <Eye size={14} className="mr-1" />
                      {language === 'hi' ? 'बड़ा करके देखें' : 'View Full Size'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Verification Info */}
              <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">{language === 'hi' ? 'अपलोड तिथि' : 'Upload Date'}</Label>
                  <p className="text-sm">{idProofViewProfile.idProofUploadedAt ? formatDateDDMMYYYY(idProofViewProfile.idProofUploadedAt) : '-'}</p>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">{t.status}</Label>
                  <Badge 
                    variant={idProofViewProfile.idProofVerified ? 'default' : idProofViewProfile.idProofRejected ? 'destructive' : 'secondary'} 
                    className={idProofViewProfile.idProofVerified ? 'bg-green-600' : idProofViewProfile.idProofRejected ? '' : ''}
                  >
                    {idProofViewProfile.idProofVerified 
                      ? (language === 'hi' ? '✓ सत्यापित' : '✓ Verified') 
                      : idProofViewProfile.idProofRejected
                        ? (language === 'hi' ? '✗ अस्वीकृत' : '✗ Rejected')
                        : (language === 'hi' ? 'लंबित' : 'Pending')}
                  </Badge>
                </div>
              </div>

              {/* Verification Instructions */}
              <Alert>
                <Info size={18} />
                <AlertDescription>
                  {language === 'hi' 
                    ? 'कृपया जांचें: 1) ID पर नाम प्रोफ़ाइल नाम से मेल खाता है 2) ID पर जन्मतिथि प्रोफ़ाइल से मेल खाती है 3) ID पर फोटो प्रोफ़ाइल फोटो से मेल खाती है' 
                    : 'Please verify: 1) Name on ID matches profile name 2) DOB on ID matches profile 3) Photo on ID matches profile photo'}
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {!idProofViewProfile.idProofVerified && !idProofViewProfile.idProofRejected && idProofViewProfile.idProofUrl && (
                  <Button 
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setProfiles((current) => 
                        (current || []).map(p => 
                          p.id === idProofViewProfile.id 
                            ? { 
                                ...p, 
                                idProofVerified: true,
                                idProofVerifiedAt: new Date().toISOString(),
                                idProofVerifiedBy: 'Admin',
                                idProofRejected: false,
                                idProofRejectedAt: undefined,
                                idProofRejectionReason: undefined,
                                // Also mark digilocker as verified since ID is verified
                                digilockerVerified: true,
                                digilockerVerifiedAt: new Date().toISOString(),
                                digilockerVerifiedBy: 'Admin',
                                digilockerDocumentType: idProofViewProfile.idProofType as any
                              } 
                            : p
                        )
                      )
                      setIdProofViewProfile(prev => prev ? {...prev, idProofVerified: true, idProofVerifiedAt: new Date().toISOString(), idProofRejected: false, idProofRejectionReason: undefined, digilockerVerified: true} : null)
                      toast.success(language === 'hi' ? 'पहचान प्रमाण सत्यापित!' : 'ID Proof verified!')
                    }}
                  >
                    <CheckCircle size={16} className="mr-2" />
                    {t.markAsVerified}
                  </Button>
                )}
                {!idProofViewProfile.idProofVerified && !idProofViewProfile.idProofRejected && idProofViewProfile.idProofUrl && (
                  <Button 
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setIdProofRejectionReason('')
                      setShowIdProofRejectDialog(true)
                    }}
                  >
                    <XCircle size={16} className="mr-2" />
                    {t.markAsNotVerified}
                  </Button>
                )}
                {idProofViewProfile.idProofVerified && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 border-red-300"
                    onClick={() => {
                      setProfiles((current) => 
                        (current || []).map(p => 
                          p.id === idProofViewProfile.id 
                            ? { 
                                ...p, 
                                idProofVerified: false,
                                idProofVerifiedAt: undefined,
                                idProofVerifiedBy: undefined,
                                digilockerVerified: false,
                                digilockerVerifiedAt: undefined,
                                digilockerVerifiedBy: undefined
                              } 
                            : p
                        )
                      )
                      setIdProofViewProfile(prev => prev ? {...prev, idProofVerified: false, idProofVerifiedAt: undefined, digilockerVerified: false} : null)
                      toast.success(language === 'hi' ? 'सत्यापन हटाया गया!' : 'Verification removed!')
                    }}
                  >
                    <XCircle size={16} className="mr-2" />
                    {t.removeVerification}
                  </Button>
                )}
                {idProofViewProfile.idProofRejected && (
                  <Button 
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setProfiles((current) => 
                        (current || []).map(p => 
                          p.id === idProofViewProfile.id 
                            ? { 
                                ...p, 
                                idProofVerified: true,
                                idProofVerifiedAt: new Date().toISOString(),
                                idProofVerifiedBy: 'Admin',
                                idProofRejected: false,
                                idProofRejectedAt: undefined,
                                idProofRejectionReason: undefined,
                                digilockerVerified: true,
                                digilockerVerifiedAt: new Date().toISOString(),
                                digilockerVerifiedBy: 'Admin',
                                digilockerDocumentType: idProofViewProfile.idProofType as any
                              } 
                            : p
                        )
                      )
                      setIdProofViewProfile(prev => prev ? {...prev, idProofVerified: true, idProofVerifiedAt: new Date().toISOString(), idProofRejected: false, idProofRejectionReason: undefined, digilockerVerified: true} : null)
                      toast.success(language === 'hi' ? 'पहचान प्रमाण सत्यापित!' : 'ID Proof verified!')
                    }}
                  >
                    <CheckCircle size={16} className="mr-2" />
                    {t.markAsVerified}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowIdProofViewDialog(false)}>
                  {t.cancel}
                </Button>
              </div>

              {idProofViewProfile.idProofVerified && (
                <Alert className="bg-green-50 border-green-400">
                  <CheckCircle size={18} className="text-green-600" />
                  <AlertDescription className="text-green-700">
                    {language === 'hi' 
                      ? `${idProofViewProfile.idProofVerifiedBy || 'Admin'} द्वारा ${idProofViewProfile.idProofVerifiedAt ? formatDateDDMMYYYY(idProofViewProfile.idProofVerifiedAt) : ''} को सत्यापित` 
                      : `Verified by ${idProofViewProfile.idProofVerifiedBy || 'Admin'} on ${idProofViewProfile.idProofVerifiedAt ? formatDateDDMMYYYY(idProofViewProfile.idProofVerifiedAt) : ''}`}
                  </AlertDescription>
                </Alert>
              )}

              {idProofViewProfile.idProofRejected && (
                <Alert className="bg-red-50 border-red-400">
                  <XCircle size={18} className="text-red-600" />
                  <AlertDescription className="text-red-700">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {language === 'hi' 
                          ? `${idProofViewProfile.idProofRejectedAt ? formatDateDDMMYYYY(idProofViewProfile.idProofRejectedAt) : ''} को अस्वीकृत` 
                          : `Rejected on ${idProofViewProfile.idProofRejectedAt ? formatDateDDMMYYYY(idProofViewProfile.idProofRejectedAt) : ''}`}
                      </p>
                      {idProofViewProfile.idProofRejectionReason && (
                        <p><strong>{language === 'hi' ? 'कारण:' : 'Reason:'}</strong> {idProofViewProfile.idProofRejectionReason}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ID Proof Rejection Dialog */}
      <Dialog open={showIdProofRejectDialog} onOpenChange={setShowIdProofRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle size={24} weight="fill" />
              {t.rejectIdProof}
            </DialogTitle>
            <DialogDescription>
              {idProofViewProfile?.fullName} - {idProofViewProfile?.profileId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="idProofRejectionReason">{t.idProofRejectionReason} <span className="text-red-500">*</span></Label>
              <Textarea
                id="idProofRejectionReason"
                value={idProofRejectionReason}
                onChange={(e) => setIdProofRejectionReason(e.target.value)}
                placeholder={t.idProofRejectionReasonPlaceholder}
                rows={4}
                className="resize-none"
              />
            </div>
            
            <Alert>
              <Warning size={18} className="text-amber-600" />
              <AlertDescription>
                {language === 'hi' 
                  ? 'यूजर को ID प्रमाण पुनः अपलोड करने के लिए सूचित किया जाएगा।' 
                  : 'The user will be notified to re-upload their ID proof.'}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowIdProofRejectDialog(false)
                setIdProofRejectionReason('')
              }}
            >
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={!idProofRejectionReason.trim()}
              onClick={() => {
                if (!idProofRejectionReason.trim() || !idProofViewProfile) return
                
                setProfiles((current) => 
                  (current || []).map(p => 
                    p.id === idProofViewProfile.id 
                      ? { 
                          ...p, 
                          idProofVerified: false,
                          idProofRejected: true,
                          idProofRejectedAt: new Date().toISOString(),
                          idProofRejectionReason: idProofRejectionReason.trim(),
                          digilockerVerified: false,
                          digilockerVerifiedAt: undefined,
                          digilockerVerifiedBy: undefined
                        } 
                      : p
                  )
                )
                setIdProofViewProfile(prev => prev ? {
                  ...prev, 
                  idProofVerified: false, 
                  idProofRejected: true, 
                  idProofRejectedAt: new Date().toISOString(),
                  idProofRejectionReason: idProofRejectionReason.trim(),
                  digilockerVerified: false
                } : null)
                
                toast.success(t.idProofRejected)
                setShowIdProofRejectDialog(false)
                setIdProofRejectionReason('')
              }}
            >
              <XCircle size={16} className="mr-2" />
              {t.rejectIdProof}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Verification Dialog */}
      <Dialog open={showPaymentViewDialog} onOpenChange={setShowPaymentViewDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CurrencyInr size={24} weight="fill" />
              {language === 'hi' ? 'भुगतान सत्यापन' : 'Payment Verification'} - {paymentViewProfile?.fullName}
            </DialogTitle>
            <DialogDescription>
              {paymentViewProfile?.profileId}
            </DialogDescription>
          </DialogHeader>

          {paymentViewProfile && (
            <div className="space-y-4">
              {/* Plan Details */}
              <div className="p-4 bg-muted/30 rounded-lg border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CurrencyInr size={18} />
                  {language === 'hi' ? 'चयनित योजना' : 'Selected Plan'}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">{language === 'hi' ? 'योजना प्रकार' : 'Plan Type'}</Label>
                    <Badge variant="default" className={paymentViewProfile.membershipPlan === '1-year' ? 'bg-accent text-accent-foreground text-lg' : 'bg-primary text-lg'}>
                      {paymentViewProfile.membershipPlan === '6-month' ? (language === 'hi' ? '6 महीने' : '6 Month') :
                       paymentViewProfile.membershipPlan === '1-year' ? (language === 'hi' ? '1 वर्ष' : '1 Year') :
                       (language === 'hi' ? 'फ्री' : 'Free')}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{language === 'hi' ? 'राशि' : 'Amount'}</Label>
                    <p className="font-bold text-xl text-primary">
                      ₹{paymentViewProfile.paymentAmount?.toLocaleString('en-IN') || (paymentViewProfile.membershipPlan === '6-month' ? (membershipSettings?.sixMonthPrice || 500) : paymentViewProfile.membershipPlan === '1-year' ? (membershipSettings?.oneYearPrice || 900) : '0')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{language === 'hi' ? 'अपलोड तिथि' : 'Upload Date'}</Label>
                    <p className="font-medium">{paymentViewProfile.paymentUploadedAt ? formatDateDDMMYYYY(paymentViewProfile.paymentUploadedAt) : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{language === 'hi' ? 'स्थिति' : 'Status'}</Label>
                    <Badge variant={paymentViewProfile.paymentStatus === 'verified' ? 'default' : 
                                    paymentViewProfile.paymentStatus === 'rejected' ? 'destructive' : 'secondary'}
                      className={paymentViewProfile.paymentStatus === 'verified' ? 'bg-green-600' : ''}>
                      {paymentViewProfile.paymentStatus === 'verified' ? (language === 'hi' ? '✓ सत्यापित' : '✓ Verified') :
                       paymentViewProfile.paymentStatus === 'rejected' ? (language === 'hi' ? '✗ अस्वीकृत' : '✗ Rejected') :
                       (language === 'hi' ? 'लंबित' : 'Pending')}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Payment Screenshot */}
              <div className="border rounded-lg p-3">
                <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Receipt size={16} />
                  {language === 'hi' ? 'भुगतान स्क्रीनशॉट' : 'Payment Screenshot'}
                </Label>
                <div className="bg-muted/20 rounded-lg p-2 flex items-center justify-center min-h-[300px]">
                  {paymentViewProfile.paymentScreenshotUrl ? (
                    <img 
                      src={paymentViewProfile.paymentScreenshotUrl} 
                      alt="Payment Screenshot"
                      className="max-h-[400px] object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openLightbox([paymentViewProfile.paymentScreenshotUrl!], 0)}
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm text-center p-4">
                      {language === 'hi' ? 'भुगतान स्क्रीनशॉट अपलोड नहीं किया' : 'Payment screenshot not uploaded'}
                    </div>
                  )}
                </div>
                {paymentViewProfile.paymentScreenshotUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => openLightbox([paymentViewProfile.paymentScreenshotUrl!], 0)}
                  >
                    <Eye size={14} className="mr-1" />
                    {language === 'hi' ? 'बड़ा करके देखें' : 'View Full Size'}
                  </Button>
                )}
              </div>

              {/* Previous Rejection Reason (if any) */}
              {paymentViewProfile.paymentStatus === 'rejected' && paymentViewProfile.paymentRejectionReason && (
                <Alert variant="destructive">
                  <XCircle size={18} />
                  <AlertDescription>
                    <span className="font-semibold">{language === 'hi' ? 'अस्वीकृति कारण:' : 'Rejection Reason:'}</span> {paymentViewProfile.paymentRejectionReason}
                  </AlertDescription>
                </Alert>
              )}

              {/* Verification Instructions */}
              <Alert>
                <Info size={18} />
                <AlertDescription>
                  {language === 'hi' 
                    ? 'कृपया जांचें: 1) स्क्रीनशॉट में राशि सही है 2) लेन-देन सफल दिखाई देता है 3) भुगतान तिथि हाल की है' 
                    : 'Please verify: 1) Amount in screenshot matches plan price 2) Transaction shows as successful 3) Payment date is recent'}
                </AlertDescription>
              </Alert>

              {/* Rejection Reason Input (for rejecting) */}
              {paymentViewProfile.paymentStatus !== 'verified' && (
                <div className="space-y-2">
                  <Label>{language === 'hi' ? 'अस्वीकृति कारण (यदि अस्वीकार कर रहे हैं)' : 'Rejection Reason (if rejecting)'}</Label>
                  <Textarea
                    placeholder={language === 'hi' ? 'अस्वीकृति का कारण दर्ज करें...' : 'Enter reason for rejection...'}
                    value={paymentRejectionReason}
                    onChange={(e) => setPaymentRejectionReason(e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {paymentViewProfile.paymentStatus !== 'verified' && paymentViewProfile.paymentScreenshotUrl && (
                  <Button 
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      // Calculate membership dates
                      const now = new Date()
                      const monthsToAdd = paymentViewProfile.membershipPlan === '1-year' ? 12 : 6
                      const expiryDate = new Date(now)
                      expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd)
                      
                      setProfiles((current) => 
                        (current || []).map(p => 
                          p.id === paymentViewProfile.id 
                            ? { 
                                ...p, 
                                paymentStatus: 'verified' as const,
                                paymentVerifiedAt: now.toISOString(),
                                paymentVerifiedBy: 'Admin',
                                paymentAmount: paymentViewProfile.paymentAmount || (paymentViewProfile.membershipPlan === '1-year' ? (membershipSettings?.oneYearPrice || 900) : (membershipSettings?.sixMonthPrice || 500)),
                                hasMembership: true,
                                membershipStartDate: now.toISOString(),
                                membershipEndDate: expiryDate.toISOString()
                              } 
                            : p
                        )
                      )
                      // Create payment transaction and auto-generate invoice
                      createPaymentTransactionForVerification(paymentViewProfile, false)
                      setPaymentViewProfile(prev => prev ? {...prev, paymentStatus: 'verified', paymentVerifiedAt: now.toISOString(), hasMembership: true, membershipStartDate: now.toISOString(), membershipEndDate: expiryDate.toISOString()} : null)
                      toast.success(language === 'hi' ? 'भुगतान सत्यापित! सदस्यता सक्रिय की गई।' : 'Payment verified! Membership activated.')
                    }}
                  >
                    <CheckCircle size={16} className="mr-2" />
                    {language === 'hi' ? 'भुगतान सत्यापित करें और सदस्यता सक्रिय करें' : 'Verify Payment & Activate Membership'}
                  </Button>
                )}
                {paymentViewProfile.paymentStatus !== 'verified' && paymentViewProfile.paymentScreenshotUrl && (
                  <Button 
                    variant="destructive"
                    size="sm"
                    disabled={!paymentRejectionReason.trim()}
                    onClick={() => {
                      setProfiles((current) => 
                        (current || []).map(p => 
                          p.id === paymentViewProfile.id 
                            ? { 
                                ...p, 
                                paymentStatus: 'rejected' as const,
                                paymentRejectionReason: paymentRejectionReason.trim()
                              } 
                            : p
                        )
                      )
                      setPaymentViewProfile(prev => prev ? {...prev, paymentStatus: 'rejected', paymentRejectionReason: paymentRejectionReason.trim()} : null)
                      toast.success(language === 'hi' ? 'भुगतान अस्वीकृत। उपयोगकर्ता को नया स्क्रीनशॉट अपलोड करना होगा।' : 'Payment rejected. User will need to upload a new screenshot.')
                    }}
                  >
                    <XCircle size={16} className="mr-2" />
                    {language === 'hi' ? 'भुगतान अस्वीकार करें' : 'Reject Payment'}
                  </Button>
                )}
                {paymentViewProfile.paymentStatus === 'verified' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 border-red-300"
                    onClick={() => {
                      setProfiles((current) => 
                        (current || []).map(p => 
                          p.id === paymentViewProfile.id 
                            ? { 
                                ...p, 
                                paymentStatus: 'pending' as const,
                                paymentVerifiedAt: undefined,
                                paymentVerifiedBy: undefined,
                                hasMembership: false,
                                membershipStartDate: undefined,
                                membershipEndDate: undefined
                              } 
                            : p
                        )
                      )
                      setPaymentViewProfile(prev => prev ? {...prev, paymentStatus: 'pending', paymentVerifiedAt: undefined, hasMembership: false} : null)
                      toast.success(language === 'hi' ? 'भुगतान सत्यापन हटाया गया!' : 'Payment verification removed!')
                    }}
                  >
                    <ArrowCounterClockwise size={16} className="mr-2" />
                    {language === 'hi' ? 'सत्यापन हटाएं' : 'Remove Verification'}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowPaymentViewDialog(false)}>
                  {t.cancel}
                </Button>
              </div>

              {paymentViewProfile.paymentStatus === 'verified' && (
                <Alert className="bg-green-50 border-green-400">
                  <CheckCircle size={18} className="text-green-600" />
                  <AlertDescription className="text-green-700">
                    {language === 'hi' 
                      ? `${paymentViewProfile.paymentVerifiedBy || 'Admin'} द्वारा ${paymentViewProfile.paymentVerifiedAt ? formatDateDDMMYYYY(paymentViewProfile.paymentVerifiedAt) : ''} को सत्यापित। सदस्यता ${paymentViewProfile.membershipEndDate ? formatDateDDMMYYYY(paymentViewProfile.membershipEndDate) : ''} तक सक्रिय।` 
                      : `Verified by ${paymentViewProfile.paymentVerifiedBy || 'Admin'} on ${paymentViewProfile.paymentVerifiedAt ? formatDateDDMMYYYY(paymentViewProfile.paymentVerifiedAt) : ''}. Membership active until ${paymentViewProfile.membershipEndDate ? formatDateDDMMYYYY(paymentViewProfile.membershipEndDate) : ''}.`}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat History Dialog - View conversation between reporter and reported */}
      <Dialog open={showChatHistoryDialog} onOpenChange={setShowChatHistoryDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChatCircle size={20} weight="fill" />
              {t.chatHistory}
            </DialogTitle>
            {chatHistoryParticipants && (
              <DialogDescription>
                {(() => {
                  const reporter = profiles?.find(p => p.profileId === chatHistoryParticipants.reporter)
                  const reported = profiles?.find(p => p.profileId === chatHistoryParticipants.reported)
                  return `${reporter?.fullName || chatHistoryParticipants.reporter} ↔ ${reported?.fullName || chatHistoryParticipants.reported}`
                })()}
              </DialogDescription>
            )}
          </DialogHeader>
          
          <ScrollArea className="h-[400px] pr-4">
            {chatHistoryParticipants && (() => {
              // Get messages between the two users
              const chatMessages = messages?.filter(m => 
                m.type === 'user-to-user' && (
                  (m.fromProfileId === chatHistoryParticipants.reporter && m.toProfileId === chatHistoryParticipants.reported) ||
                  (m.fromProfileId === chatHistoryParticipants.reported && m.toProfileId === chatHistoryParticipants.reporter)
                )
              ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) || []

              if (chatMessages.length === 0) {
                return (
                  <div className="text-center py-12 text-muted-foreground">
                    <ChatCircle size={48} className="mx-auto mb-4 opacity-50" weight="light" />
                    <p>{t.noMessagesFound}</p>
                  </div>
                )
              }

              const reporterProfile = profiles?.find(p => p.profileId === chatHistoryParticipants.reporter)
              const reportedProfile = profiles?.find(p => p.profileId === chatHistoryParticipants.reported)

              return (
                <div className="space-y-3">
                  {chatMessages.map(msg => {
                    const isFromReporter = msg.fromProfileId === chatHistoryParticipants.reporter
                    const senderProfile = isFromReporter ? reporterProfile : reportedProfile
                    const isReported = msg.fromProfileId === chatHistoryParticipants.reported

                    return (
                      <div 
                        key={msg.id} 
                        className={`flex ${isFromReporter ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          isReported 
                            ? 'bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-800' 
                            : 'bg-muted'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            {senderProfile?.photos?.[0] ? (
                              <img src={senderProfile.photos[0]} alt="" className="h-5 w-5 rounded-full object-cover" />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                                {senderProfile?.fullName?.[0] || '?'}
                              </div>
                            )}
                            <span className={`text-xs font-medium ${isReported ? 'text-red-600 dark:text-red-400' : ''}`}>
                              {senderProfile?.fullName || msg.fromProfileId}
                              {isReported && (
                                <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">
                                  {t.reported}
                                </Badge>
                              )}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message || (msg as any).content}</p>
                          <span className="text-xs text-muted-foreground mt-1 block">
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChatHistoryDialog(false)}>
              {t.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
