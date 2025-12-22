import { useState } from 'react'
import { useKV, forceRefreshFromAzure } from '@/hooks/useKV'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ShieldCheck, X, Check, Info, ChatCircle, ProhibitInset, Robot, PaperPlaneTilt, Eye, Database, Key, Storefront, Plus, Trash, Pencil, ScanSmiley, CheckCircle, XCircle, Spinner, CurrencyInr, Calendar, Percent, Bell, CaretDown, CaretUp, MapPin, Globe, NavigationArrow, ArrowCounterClockwise, Receipt, FilePdf, ShareNetwork, Envelope, CurrencyCircleDollar, ChartLine, DownloadSimple, Printer, IdentificationCard, ArrowsClockwise } from '@phosphor-icons/react'
import type { Profile, WeddingService, PaymentTransaction } from '@/types/profile'
import type { User } from '@/types/user'
import type { ChatMessage } from '@/types/chat'
import { Chat } from '@/components/Chat'
import { ProfileDetailDialog } from '@/components/ProfileDetailDialog'
import { PhotoLightbox, useLightbox } from '@/components/PhotoLightbox'
import { toast } from 'sonner'
import { formatDateDDMMYYYY } from '@/lib/utils'
import { verifyPhotosWithVision, type PhotoVerificationResult } from '@/lib/visionPhotoVerification'
import { sampleProfiles, sampleUsers } from '@/lib/sampleData'

interface AdminPanelProps {
  profiles: Profile[] | undefined
  setProfiles: (newValue: Profile[] | ((oldValue?: Profile[] | undefined) => Profile[])) => void
  users: User[] | undefined
  language: 'hi' | 'en'
  onLogout?: () => void
  onLoginAsUser?: (userId: string) => void
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
}

export function AdminPanel({ profiles, setProfiles, users, language, onLogout, onLoginAsUser }: AdminPanelProps) {
  const [blockedContacts, setBlockedContacts] = useKV<BlockedContact[]>('blockedContacts', [])
  const [messages, setMessages] = useKV<ChatMessage[]>('chatMessages', [])
  const [weddingServices, setWeddingServices] = useKV<WeddingService[]>('weddingServices', [])
  const [membershipSettings, setMembershipSettings] = useKV<MembershipSettings>('membershipSettings', {
    sixMonthPrice: 500,
    oneYearPrice: 900,
    sixMonthDuration: 6,
    oneYearDuration: 12,
    discountPercentage: 0,
    discountEnabled: false,
    discountEndDate: ''
  })
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'expiry'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
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
  const [isRefreshing, setIsRefreshing] = useState(false)
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
  
  const t = {
    title: language === 'hi' ? 'प्रशासन पैनल' : 'Admin Panel',
    description: language === 'hi' ? 'प्रोफाइल सत्यापन और प्रबंधन' : 'Profile verification and management',
    refreshData: language === 'hi' ? 'डेटा रिफ्रेश करें' : 'Refresh Data',
    refreshing: language === 'hi' ? 'रिफ्रेश हो रहा है...' : 'Refreshing...',
    dataRefreshed: language === 'hi' ? 'डेटा रिफ्रेश हो गया' : 'Data refreshed',
    resetSampleData: language === 'hi' ? 'सैंपल डेटा रीसेट करें' : 'Reset Sample Data',
    sampleDataReset: language === 'hi' ? 'सैंपल डेटा रीसेट हो गया' : 'Sample data has been reset',
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
    email: language === 'hi' ? 'ईमेल' : 'Email',
    mobile: language === 'hi' ? 'मोबाइल' : 'Mobile',
    name: language === 'hi' ? 'नाम' : 'Name',
    relation: language === 'hi' ? 'रिश्ता' : 'Relation',
    status: language === 'hi' ? 'स्थिति' : 'Status',
    actions: language === 'hi' ? 'कार्रवाई' : 'Actions',
    approveSuccess: language === 'hi' ? 'प्रोफाइल स्वीकृत की गई!' : 'Profile approved!',
    rejectSuccess: language === 'hi' ? 'प्रोफाइल अस्वीकृत की गई!' : 'Profile rejected!',
    blockSuccess: language === 'hi' ? 'प्रोफाइल ब्लॉक की गई!' : 'Profile blocked!',
    unblock: language === 'hi' ? 'अनब्लॉक करें' : 'Unblock',
    unblockSuccess: language === 'hi' ? 'प्रोफाइल अनब्लॉक की गई!' : 'Profile unblocked!',
    moveToPending: language === 'hi' ? 'पेंडिंग में ले जाएं' : 'Move to Pending',
    movedToPending: language === 'hi' ? 'प्रोफाइल पेंडिंग में ले जाया गया!' : 'Profile moved to pending!',
    returnToEdit: language === 'hi' ? 'संपादन के लिए वापस करें' : 'Return to Edit',
    returnToEditDesc: language === 'hi' ? 'इस प्रोफाइल को उपयोगकर्ता को संपादन के लिए वापस भेजें' : 'Send this profile back to user for editing',
    editReasonLabel: language === 'hi' ? 'संपादन का कारण' : 'Reason for Edit',
    editReasonPlaceholder: language === 'hi' ? 'उपयोगकर्ता को बताएं कि क्या संपादित/पूर्ण करना है...' : 'Tell user what to edit/complete...',
    sendForEdit: language === 'hi' ? 'संपादन के लिए भेजें' : 'Send for Edit',
    profileReturnedForEdit: language === 'hi' ? 'प्रोफाइल संपादन के लिए वापस भेजी गई!' : 'Profile sent back for editing!',
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
    bulkReject: language === 'hi' ? 'एकसाथ अस्वीकृत करें' : 'Bulk Reject',
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
    rejectionReasonPlaceholder: language === 'hi' ? 'कृपया अस्वीकृति का कारण बताएं...' : 'Please provide reason for rejection...',
    sendNotification: language === 'hi' ? 'SMS और ईमेल सूचना भेजें' : 'Send SMS & Email Notification',
    notificationSent: language === 'hi' ? 'SMS और ईमेल सूचना भेजी गई!' : 'SMS and Email notification sent!',
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
  }

  // Helper to get user credentials for a profile
  const getUserCredentials = (profileId: string) => users?.find(u => u.profileId === profileId)

  const pendingProfiles = profiles?.filter(p => p.status === 'pending') || []
  const approvedProfiles = profiles?.filter(p => p.status === 'verified') || []

  // Delete profile handler
  const handleDeleteProfile = (profileId: string) => {
    if (!confirm(t.deleteConfirm)) return
    setProfiles((current) => (current || []).filter(p => p.id !== profileId))
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
          ? { ...p, status: 'rejected' as const, rejectionReason: rejectionReason }
          : p
      )
    )
    
    // Send notification if enabled
    if (sendRejectionNotification) {
      // In production, this would call an API to send SMS and Email
      // For now, we simulate the notification
      console.log(`[Notification] Sending rejection SMS to: ${profile.mobile}`)
      console.log(`[Notification] Sending rejection Email to: ${profile.email}`)
      console.log(`[Notification] Rejection reason: ${rejectionReason}`)
      
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

  const handleReject = (profileId: string) => {
    setProfiles((current) => 
      (current || []).map(p => 
        p.id === profileId 
          ? { ...p, status: 'rejected' as const }
          : p
      )
    )
    toast.error(t.rejectSuccess)
    setSelectedProfile(null)
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

  const handleFaceVerification = async (profile: Profile) => {
    if (!profile.selfieUrl || !profile.photos || profile.photos.length === 0) {
      toast.error(language === 'hi' ? 'सेल्फी और फोटो दोनों आवश्यक हैं' : 'Both selfie and photos are required for verification')
      return
    }

    setFaceVerificationDialog(profile)
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
    } catch (error) {
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

  const handleGetAISuggestions = async (profile: Profile) => {
    setIsLoadingAI(true)
    setSelectedProfile(profile)
    try {
      // Generate local AI suggestions (can be replaced with Azure AI Foundry in production)
      const suggestions = generateProfileSuggestions(profile)
      setAiSuggestions(suggestions)
    } catch (error) {
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
    isBlocked: false
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
                  onClick={async () => {
                    setIsRefreshing(true)
                    try {
                      forceRefreshFromAzure('profiles')
                      forceRefreshFromAzure('users')
                      await new Promise(resolve => setTimeout(resolve, 1000))
                      toast.success(t.dataRefreshed)
                    } finally {
                      setIsRefreshing(false)
                    }
                  }}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  <ArrowsClockwise size={18} className={isRefreshing ? 'animate-spin' : ''} />
                  {isRefreshing ? t.refreshing : t.refreshData}
                </Button>
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
          <TabsList className="grid w-full grid-cols-8 max-w-7xl">
            <TabsTrigger value="pending" className="gap-2">
              <Info size={18} />
              {t.pendingProfiles}
              {pendingProfiles.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingProfiles.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <Check size={18} />
              {t.approvedProfiles}
              <Badge variant="secondary" className="ml-2">{approvedProfiles.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-2">
              <Database size={18} />
              {t.allDatabase}
            </TabsTrigger>
            <TabsTrigger value="deleted" className="gap-2 text-red-600">
              <Trash size={18} weight="fill" />
              {t.deletedProfiles}
              {(profiles?.filter(p => p.isDeleted).length ?? 0) > 0 && (
                <Badge variant="destructive" className="ml-2">{profiles?.filter(p => p.isDeleted).length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="membership" className="gap-2">
              <CurrencyInr size={18} weight="fill" />
              {t.membershipSettings}
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-2 text-green-600">
              <CurrencyCircleDollar size={18} weight="fill" />
              {t.accounts}
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <ChatCircle size={18} weight="fill" />
              {t.adminChat}
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Storefront size={18} weight="fill" />
              {t.weddingServices}
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
                        onClick={() => {
                          selectedProfiles.forEach(id => handleReject(id))
                          setSelectedProfiles([])
                          toast.success(language === 'hi' ? `${selectedProfiles.length} प्रोफाइल अस्वीकृत!` : `${selectedProfiles.length} profiles rejected!`)
                        }}
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
                    {pendingProfiles.map((profile) => (
                      <Card key={profile.id} className={`border-2 ${selectedProfiles.includes(profile.id) ? 'border-primary bg-primary/5' : ''}`}>
                        <CardContent className="pt-6">
                          <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-4">
                              {/* Checkbox for selection */}
                              <div className="flex items-center shrink-0 pt-2">
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
                              {/* Photos and Selfie Section */}
                              <div className="flex gap-3 shrink-0">
                                {/* Uploaded Photos */}
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium">
                                    {language === 'hi' ? 'अपलोड फोटो' : 'Uploaded Photos'}
                                  </p>
                                  <div className="flex gap-1">
                                    {profile.photos && profile.photos.length > 0 ? (
                                      profile.photos.slice(0, 3).map((photo, idx) => (
                                        <img 
                                          key={idx}
                                          src={photo} 
                                          alt={`Photo ${idx + 1}`}
                                          className="w-16 h-16 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => openLightbox(profile.photos || [], idx)}
                                          title={language === 'hi' ? 'बड़ा देखें' : 'View larger'}
                                        />
                                      ))
                                    ) : (
                                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                                        {language === 'hi' ? 'कोई फोटो नहीं' : 'No photo'}
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
                                      className="w-16 h-16 object-cover rounded-md border-2 border-blue-300 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => openLightbox([profile.selfieUrl!], 0)}
                                      title={language === 'hi' ? 'बड़ा देखें' : 'View larger'}
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                                      {language === 'hi' ? 'कोई सेल्फी नहीं' : 'No selfie'}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-bold text-lg">{profile.fullName}</h3>
                                  <Badge variant="outline" className="text-xs">
                                    {profile.relationToProfile || (language === 'hi' ? 'स्वयं' : 'Self')}
                                  </Badge>
                                  <Badge variant="secondary">{t.pending}</Badge>
                                  {profile.returnedForEdit && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50">
                                      {language === 'hi' ? 'संपादन हेतु लौटाया' : 'Returned for Edit'}
                                    </Badge>
                                  )}
                                  {profile.isBlocked && <Badge variant="destructive">{t.blocked}</Badge>}
                                </div>
                                
                                {/* Edit Reason Alert */}
                                {profile.returnedForEdit && profile.editReason && (
                                  <Alert className="mb-2 bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800">
                                    <Pencil size={16} className="text-amber-600" />
                                    <AlertDescription className="text-sm">
                                      <span className="font-semibold text-amber-700 dark:text-amber-300">
                                        {language === 'hi' ? 'संपादन कारण:' : 'Edit Reason:'}
                                      </span>{' '}
                                      {profile.editReason}
                                      {profile.returnedAt && (
                                        <span className="block text-xs text-muted-foreground mt-1">
                                          {language === 'hi' ? 'लौटाया गया:' : 'Returned:'} {new Date(profile.returnedAt).toLocaleDateString()}
                                        </span>
                                      )}
                                    </AlertDescription>
                                  </Alert>
                                )}
                                
                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                  <div>{t.age}: {profile.age}</div>
                                  <div>{profile.gender === 'male' ? (language === 'hi' ? 'पुरुष' : 'Male') : (language === 'hi' ? 'महिला' : 'Female')}</div>
                                  <div>{t.location}: {profile.location}</div>
                                  <div>{t.education}: {profile.education}</div>
                                  <div className="col-span-2">{t.occupation}: {profile.occupation}</div>
                                  <div className="col-span-2">{t.email}: {profile.email}</div>
                                  <div className="col-span-2">{t.mobile}: {profile.mobile}</div>
                                  <div className="col-span-2 flex items-center gap-2">
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
                                </div>
                                
                                {/* Login Credentials */}
                                {(() => {
                                  const creds = getUserCredentials(profile.id)
                                  return creds ? (
                                    <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                                      <div className="flex items-center gap-2 text-sm">
                                        <Key size={14} weight="fill" className="text-primary" />
                                        <span className="font-semibold">{t.userId}:</span>
                                        <code className="bg-background px-1 rounded text-primary font-mono">{creds.userId}</code>
                                        <span className="font-semibold ml-2">{t.password}:</span>
                                        <code className="bg-background px-1 rounded text-accent font-mono">{creds.password}</code>
                                      </div>
                                    </div>
                                  ) : null
                                })()}
                                
                                {/* Registration Location */}
                                <div className="mt-3 p-2 bg-muted/50 rounded-lg border">
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
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Globe size={12} />
                                        <span>
                                          {profile.registrationLocation.latitude.toFixed(4)}, {profile.registrationLocation.longitude.toFixed(4)}
                                          {' '}({t.accuracy}: ±{Math.round(profile.registrationLocation.accuracy)}m)
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

                            {selectedProfile?.id === profile.id && aiSuggestions.length > 0 && (
                              <Alert className="bg-primary/5">
                                <Robot size={18} />
                                <AlertDescription>
                                  <div className="font-semibold mb-2">{t.aiSuggestions}:</div>
                                  <ul className="space-y-1 text-sm">
                                    {aiSuggestions.map((suggestion, idx) => (
                                      <li key={idx}>{suggestion}</li>
                                    ))}
                                  </ul>
                                </AlertDescription>
                              </Alert>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <Button 
                                onClick={() => setViewProfileDialog(profile)}
                                variant="outline"
                                size="sm"
                              >
                                <Eye size={16} className="mr-1" />
                                {t.viewProfile}
                              </Button>
                              <Button 
                                onClick={() => handleFaceVerification(profile)}
                                variant="outline"
                                size="sm"
                                disabled={!profile.selfieUrl || !profile.photos?.length}
                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              >
                                <ScanSmiley size={16} className="mr-1" />
                                {t.verifyFace}
                              </Button>
                              <Button 
                                onClick={() => handleGetAISuggestions(profile)}
                                variant="outline"
                                size="sm"
                                disabled={isLoadingAI}
                              >
                                <Robot size={16} className="mr-1" />
                                {isLoadingAI ? t.loading : t.aiReview}
                              </Button>
                              <Button 
                                onClick={() => {
                                  setSelectedProfile(profile)
                                  setShowChatDialog(true)
                                }}
                                variant="outline"
                                size="sm"
                              >
                                <ChatCircle size={16} className="mr-1" />
                                {t.chat}
                              </Button>
                              <Button 
                                onClick={() => {
                                  setDigilockerProfile(profile)
                                  setShowDigilockerDialog(true)
                                }}
                                variant="outline"
                                size="sm"
                                className={profile.digilockerVerified ? 'text-green-600 border-green-400' : 'text-blue-600 border-blue-400'}
                              >
                                <ShieldCheck size={16} className="mr-1" />
                                {profile.digilockerVerified ? `✓ ${t.digilockerVerified}` : t.verifyIdProof}
                              </Button>
                              <Button 
                                onClick={() => {
                                  setIdProofViewProfile(profile)
                                  setShowIdProofViewDialog(true)
                                }}
                                variant="outline"
                                size="sm"
                                className={profile.idProofUrl ? 'text-orange-600 border-orange-400' : 'text-gray-400 border-gray-300'}
                                disabled={!profile.idProofUrl}
                                title={profile.idProofUrl ? t.viewIdProof : t.idProofNotUploaded}
                              >
                                <IdentificationCard size={16} className="mr-1" />
                                {t.viewIdProof}
                              </Button>
                              <Button 
                                onClick={() => handleApprove(profile.id)} 
                                variant="default"
                                size="sm"
                                className="bg-teal hover:bg-teal/90"
                              >
                                <Check size={16} className="mr-1" />
                                {t.approve}
                              </Button>
                              <Button 
                                onClick={() => setShowRejectDialog(profile)} 
                                variant="outline"
                                size="sm"
                              >
                                <X size={16} className="mr-1" />
                                {t.reject}
                              </Button>
                              <Button 
                                onClick={() => handleBlock(profile)} 
                                variant="destructive"
                                size="sm"
                              >
                                <ProhibitInset size={16} className="mr-1" />
                                {t.block}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Key size={24} weight="fill" />
                      {t.approvedProfiles} - {t.loginCredentials}
                    </CardTitle>
                    <CardDescription>
                      {approvedProfiles.length} {language === 'hi' ? 'स्वीकृत प्रोफाइल और उनके लॉगिन विवरण' : 'approved profiles with login credentials'}
                    </CardDescription>
                  </div>
                  {/* Sort Controls */}
                  <div className="flex items-center gap-2">
                    <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">{t.sortByName}</SelectItem>
                        <SelectItem value="date">{t.sortByDate}</SelectItem>
                        <SelectItem value="expiry">{t.sortByExpiry}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? <CaretUp size={18} /> : <CaretDown size={18} />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {approvedProfiles.length === 0 ? (
                  <Alert>
                    <Info size={18} />
                    <AlertDescription>{t.noApproved}</AlertDescription>
                  </Alert>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === 'hi' ? 'फोटो' : 'Photo'}</TableHead>
                          <TableHead>{t.profileId}</TableHead>
                          <TableHead>{t.name}</TableHead>
                          <TableHead>{t.relation}</TableHead>
                          <TableHead>{t.membershipPlan}</TableHead>
                          <TableHead>{t.membershipExpiry}</TableHead>
                          <TableHead>{t.userId}</TableHead>
                          <TableHead>{t.password}</TableHead>
                          <TableHead>{t.email}</TableHead>
                          <TableHead>{t.mobile}</TableHead>
                          <TableHead>{t.verifiedAt}</TableHead>
                          <TableHead>{t.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...approvedProfiles].sort((a, b) => {
                          let comparison = 0
                          if (sortBy === 'name') {
                            comparison = a.fullName.localeCompare(b.fullName)
                          } else if (sortBy === 'date') {
                            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                          } else if (sortBy === 'expiry') {
                            const expiryA = a.membershipExpiry ? new Date(a.membershipExpiry).getTime() : Infinity
                            const expiryB = b.membershipExpiry ? new Date(b.membershipExpiry).getTime() : Infinity
                            comparison = expiryA - expiryB
                          }
                          return sortOrder === 'asc' ? comparison : -comparison
                        }).map((profile) => {
                          const userCred = users?.find(u => u.profileId === profile.id)
                          const isExpired = profile.membershipExpiry && new Date(profile.membershipExpiry) < new Date()
                          const isExpiringSoon = profile.membershipExpiry && 
                            new Date(profile.membershipExpiry) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
                            new Date(profile.membershipExpiry) > new Date()
                          return (
                            <TableRow key={profile.id} className={isExpired ? 'bg-red-50 dark:bg-red-950/20' : isExpiringSoon ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                              <TableCell>
                                {profile.photos && profile.photos.length > 0 ? (
                                  <img 
                                    src={profile.photos[0]} 
                                    alt={profile.fullName}
                                    className="w-10 h-10 object-cover rounded-full border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => openLightbox(profile.photos || [], 0)}
                                    title={language === 'hi' ? 'बड़ा देखें' : 'View larger'}
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-xs">
                                    {profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="font-mono font-semibold">{profile.profileId}</TableCell>
                              <TableCell className="font-medium">{profile.fullName}</TableCell>
                              <TableCell>
                                {profile.relationToProfile || (language === 'hi' ? 'स्वयं' : 'Self')}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {profile.membershipPlan === '6-month' ? t.sixMonthPlan : 
                                   profile.membershipPlan === '1-year' ? t.oneYearPlan : '-'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {profile.membershipExpiry ? (
                                  <span className={isExpired ? 'text-red-600 font-medium' : isExpiringSoon ? 'text-yellow-600 font-medium' : ''}>
                                    {formatDateDDMMYYYY(profile.membershipExpiry)}
                                  </span>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="font-mono text-primary">{userCred?.userId || '-'}</TableCell>
                              <TableCell className="font-mono text-accent">{userCred?.password || '-'}</TableCell>
                              <TableCell className="text-sm">{profile.email}</TableCell>
                              <TableCell className="font-mono text-sm">{profile.mobile}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {profile.verifiedAt ? formatDateDDMMYYYY(profile.verifiedAt) : '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setViewProfileDialog(profile)}
                                    title={language === 'hi' ? 'प्रोफाइल देखें' : 'View Profile'}
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
                                  >
                                    <ChatCircle size={16} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
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
                                    <Pencil size={16} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setReturnToEditDialog(profile)}
                                    title={t.returnToEdit}
                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  >
                                    <CaretDown size={16} weight="bold" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database size={24} weight="fill" />
                      {t.allDatabase}
                    </CardTitle>
                    <CardDescription>
                      {profiles?.length || 0} {language === 'hi' ? 'कुल प्रोफाइल' : 'total profiles'}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(language === 'hi' 
                        ? 'क्या आप वाकई सैंपल डेटा रीसेट करना चाहते हैं? यह मौजूदा डेटा को बदल देगा।' 
                        : 'Are you sure you want to reset to sample data? This will replace existing data.'
                      )) {
                        setProfiles(sampleProfiles)
                        toast.success(t.sampleDataReset)
                      }
                    }}
                    className="gap-2"
                  >
                    <ArrowCounterClockwise size={16} />
                    {t.resetSampleData}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!profiles || profiles.length === 0 ? (
                  <Alert>
                    <Info size={18} />
                    <AlertDescription>
                      {language === 'hi' ? 'कोई प्रोफाइल नहीं मिली।' : 'No profiles found.'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.profileId}</TableHead>
                          <TableHead>{t.name}</TableHead>
                          <TableHead>{t.userId}</TableHead>
                          <TableHead>{t.password}</TableHead>
                          <TableHead>{t.relation}</TableHead>
                          <TableHead>{t.age}</TableHead>
                          <TableHead>{t.location}</TableHead>
                          <TableHead>{t.status}</TableHead>
                          <TableHead>{t.email}</TableHead>
                          <TableHead>{t.mobile}</TableHead>
                          <TableHead>{t.createdAt}</TableHead>
                          <TableHead>{t.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles.map((profile) => {
                          const creds = getUserCredentials(profile.id)
                          return (
                            <TableRow key={profile.id}>
                              <TableCell className="font-mono font-semibold">{profile.profileId}</TableCell>
                              <TableCell className="font-medium">{profile.fullName}</TableCell>
                              <TableCell className="font-mono text-primary">{creds?.userId || '-'}</TableCell>
                              <TableCell className="font-mono text-accent">{creds?.password || '-'}</TableCell>
                              <TableCell className="text-sm">
                                {profile.relationToProfile || (language === 'hi' ? 'स्वयं' : 'Self')}
                              </TableCell>
                              <TableCell>{profile.age}</TableCell>
                              <TableCell className="text-sm">{profile.location}</TableCell>
                              <TableCell>
                              <Badge variant={
                                profile.status === 'verified' ? 'default' :
                                profile.status === 'pending' ? 'secondary' :
                                'destructive'
                              }>
                                {profile.status === 'verified' ? t.verified :
                                 profile.status === 'pending' ? t.pending :
                                 t.rejected}
                              </Badge>
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
                                  className={profile.digilockerVerified ? 'text-green-600 hover:text-green-700' : 'text-blue-600 hover:text-blue-700'}
                                  title={profile.digilockerVerified ? t.digilockerVerified : t.verifyIdProof}
                                >
                                  <ShieldCheck size={16} />
                                </Button>
                                {profile.status !== 'verified' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleApprove(profile.id)}
                                    className="text-teal hover:text-teal"
                                    title={t.approve}
                                  >
                                    <Check size={16} />
                                  </Button>
                                )}
                                {/* View ID Proof button */}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setIdProofViewProfile(profile)
                                    setShowIdProofViewDialog(true)
                                  }}
                                  className={profile.idProofUrl ? (profile.idProofVerified ? 'text-green-600 hover:text-green-700' : 'text-orange-500 hover:text-orange-600') : 'text-gray-400'}
                                  title={profile.idProofUrl ? t.viewIdProof : t.idProofNotUploaded}
                                >
                                  <IdentificationCard size={16} />
                                </Button>
                                {/* Login as User button */}
                                {onLoginAsUser && creds?.userId && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      if (confirm(t.loginAsUserConfirm)) {
                                        onLoginAsUser(creds.userId)
                                        toast.success(t.loginAsUserSuccess, {
                                          description: `${profile.fullName} (${creds.userId})`
                                        })
                                      }
                                    }}
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
                                  onClick={() => handleDeleteProfile(profile.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title={t.deleteProfile}
                                >
                                  <Trash size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deleted Profiles Tab */}
          <TabsContent value="deleted">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash size={24} weight="fill" />
                  {t.deletedProfiles}
                </CardTitle>
                <CardDescription>
                  {profiles?.filter(p => p.isDeleted).length || 0} {language === 'hi' ? 'हटाई गई प्रोफाइल' : 'deleted profiles'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!profiles || profiles.filter(p => p.isDeleted).length === 0 ? (
                  <Alert>
                    <Info size={18} />
                    <AlertDescription>
                      {t.noDeletedProfiles}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.profileId}</TableHead>
                          <TableHead>{t.name}</TableHead>
                          <TableHead>{t.email}</TableHead>
                          <TableHead>{t.mobile}</TableHead>
                          <TableHead>{t.deletedAt}</TableHead>
                          <TableHead>{t.deletedBy}</TableHead>
                          <TableHead>{t.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles.filter(p => p.isDeleted).map(profile => (
                          <TableRow key={profile.id} className="bg-red-50 dark:bg-red-950/20">
                            <TableCell className="font-mono text-sm">
                              <div className="flex items-center gap-2">
                                <Trash size={14} className="text-red-500" weight="fill" />
                                {profile.profileId}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{profile.fullName}</TableCell>
                            <TableCell className="text-sm">{profile.email}</TableCell>
                            <TableCell className="font-mono text-sm">{profile.mobile}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {profile.deletedAt ? new Date(profile.deletedAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {profile.deletedReason || '-'}
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
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleRestoreProfile(profile.id)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title={t.restoreProfile}
                                >
                                  <ArrowCounterClockwise size={16} />
                                  <span className="ml-1 hidden md:inline">{t.restoreProfile}</span>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handlePermanentDelete(profile.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                  title={t.permanentDelete}
                                >
                                  <Trash size={16} weight="fill" />
                                  <span className="ml-1 hidden md:inline">{t.permanentDelete}</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
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

                {/* Transactions Table */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Receipt size={20} />
                    {t.recentTransactions}
                  </h3>
                  
                  {(!paymentTransactions || paymentTransactions.length === 0) ? (
                    <Alert>
                      <Info size={16} />
                      <AlertDescription>{t.noTransactions}</AlertDescription>
                    </Alert>
                  ) : (
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
                          {[...paymentTransactions].reverse().map(tx => (
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
                                <div className="flex gap-1">
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
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
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
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.businessName}</TableHead>
                          <TableHead>{t.category}</TableHead>
                          <TableHead>{t.contactPerson}</TableHead>
                          <TableHead>{t.mobile}</TableHead>
                          <TableHead>{t.city}</TableHead>
                          <TableHead>{t.status}</TableHead>
                          <TableHead>{t.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weddingServices.map((service) => (
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
                  </ScrollArea>
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
                          value={membershipSettings?.sixMonthPrice || 500}
                          onChange={(e) => setMembershipSettings(prev => ({
                            ...prev!,
                            sixMonthPrice: parseInt(e.target.value) || 0
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.duration}</Label>
                        <Input 
                          type="number" 
                          value={membershipSettings?.sixMonthDuration || 6}
                          onChange={(e) => setMembershipSettings(prev => ({
                            ...prev!,
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
                          value={membershipSettings?.oneYearPrice || 900}
                          onChange={(e) => setMembershipSettings(prev => ({
                            ...prev!,
                            oneYearPrice: parseInt(e.target.value) || 0
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.duration}</Label>
                        <Input 
                          type="number" 
                          value={membershipSettings?.oneYearDuration || 12}
                          onChange={(e) => setMembershipSettings(prev => ({
                            ...prev!,
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
                          checked={membershipSettings?.discountEnabled || false}
                          onCheckedChange={(checked) => setMembershipSettings(prev => ({
                            ...prev!,
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
                          value={membershipSettings?.discountPercentage || 0}
                          onChange={(e) => setMembershipSettings(prev => ({
                            ...prev!,
                            discountPercentage: parseInt(e.target.value) || 0
                          }))}
                          disabled={!membershipSettings?.discountEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.discountEndDate}</Label>
                        <Input 
                          type="date" 
                          value={membershipSettings?.discountEndDate || ''}
                          onChange={(e) => setMembershipSettings(prev => ({
                            ...prev!,
                            discountEndDate: e.target.value
                          }))}
                          disabled={!membershipSettings?.discountEnabled}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button 
                      onClick={() => toast.success(t.settingsUpdated)}
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
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.name}</TableHead>
                          <TableHead>{t.profileId}</TableHead>
                          <TableHead>{t.membershipPlan}</TableHead>
                          <TableHead>{t.membershipExpiry}</TableHead>
                          <TableHead>{t.status}</TableHead>
                          <TableHead>{t.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles?.filter(p => p.status === 'verified').map((profile) => {
                          const isExpired = profile.membershipExpiry && new Date(profile.membershipExpiry) < new Date()
                          const isExpiringSoon = profile.membershipExpiry && 
                            new Date(profile.membershipExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
                            new Date(profile.membershipExpiry) > new Date()
                          
                          return (
                            <TableRow key={profile.id}>
                              <TableCell className="font-medium">{profile.fullName}</TableCell>
                              <TableCell className="font-mono text-sm">{profile.profileId}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {profile.membershipPlan === '6-month' ? t.sixMonthPlan : 
                                   profile.membershipPlan === '1-year' ? t.oneYearPlan : '-'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {profile.membershipExpiry ? formatDateDDMMYYYY(profile.membershipExpiry) : '-'}
                              </TableCell>
                              <TableCell>
                                {isExpired ? (
                                  <Badge variant="destructive">{t.expired}</Badge>
                                ) : isExpiringSoon ? (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t.expiringIn30Days}</Badge>
                                ) : (
                                  <Badge variant="default">{language === 'hi' ? 'सक्रिय' : 'Active'}</Badge>
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
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChatCircle size={24} />
              {t.chat} - {selectedProfile?.profileId}
            </DialogTitle>
            <DialogDescription>
              {language === 'hi' ? 'प्रोफाइल धारक को संदेश भेजें' : 'Send message to profile owner'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder={t.typeMessage}
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              rows={5}
            />
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowChatDialog(false)}>
                {t.close}
              </Button>
              <Button onClick={handleSendMessage}>
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
        <DialogContent className="max-w-3xl">
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
              <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed">
                {faceVerificationDialog?.selfieUrl ? (
                  <img 
                    src={faceVerificationDialog.selfieUrl} 
                    alt="Selfie" 
                    className="w-full h-full object-cover"
                  />
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
                     faceVerificationDialog.registrationLocation.country.toLowerCase() !== faceVerificationDialog.country.toLowerCase() && (
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
              <div className="grid grid-cols-2 gap-2">
                {faceVerificationDialog?.photos && faceVerificationDialog.photos.length > 0 ? (
                  faceVerificationDialog.photos.map((photo, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted border">
                      <img 
                        src={photo} 
                        alt={`Photo ${idx + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 aspect-video flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
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
                <div className="font-medium text-sm mb-1">{language === 'hi' ? 'AI विश्लेषण' : 'AI Analysis'}:</div>
                <p className="text-sm text-muted-foreground">{faceVerificationResult.analysis}</p>
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

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setFaceVerificationDialog(null)}>
              {t.close}
            </Button>
            {faceVerificationDialog && (
              <Button 
                onClick={() => handleFaceVerification(faceVerificationDialog)}
                disabled={isVerifyingFace}
                className="gap-2"
              >
                <ScanSmiley size={16} />
                {isVerifyingFace ? t.verifying : t.verifyWithAI}
              </Button>
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
        <DialogContent className="max-w-lg">
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
                  const profile = profiles?.find(p => p.id === val)
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
                let expiryDate = new Date(paymentDate)
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FilePdf size={24} className="text-red-600" />
              {t.paymentReceipt}
            </DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
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
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span>{t.membershipPlan}</span>
                    <Badge>
                      {selectedTransaction.plan === 'free' ? t.freePlan : 
                       selectedTransaction.plan === '6-month' ? t.sixMonthPlan : t.oneYearPlan}
                    </Badge>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>{t.originalAmount}</span>
                    <span>₹{selectedTransaction.amount}</span>
                  </div>
                  {selectedTransaction.discountAmount > 0 && (
                    <div className="flex justify-between mb-2 text-green-600">
                      <span>{language === 'hi' ? 'छूट' : 'Discount'}</span>
                      <span>-₹{selectedTransaction.discountAmount}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t.finalAmount}</span>
                    <span className="text-green-600">₹{selectedTransaction.finalAmount}</span>
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
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              {t.close}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                window.print()
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
        <DialogContent className="max-w-md">
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
        <DialogContent className="sm:max-w-2xl">
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
              {idProofViewProfile.idProofUrl ? (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <Label className="text-sm text-muted-foreground">{t.idProofType}</Label>
                      <Badge variant="secondary" className="mt-1">
                        {idProofViewProfile.idProofType === 'aadhaar' && t.aadhaar}
                        {idProofViewProfile.idProofType === 'pan' && t.pan}
                        {idProofViewProfile.idProofType === 'driving-license' && t.drivingLicense}
                        {idProofViewProfile.idProofType === 'passport' && t.passport}
                        {idProofViewProfile.idProofType === 'voter-id' && t.voterId}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm text-muted-foreground">{language === 'hi' ? 'अपलोड तिथि' : 'Upload Date'}</Label>
                      <p className="text-sm">{idProofViewProfile.idProofUploadedAt ? formatDateDDMMYYYY(idProofViewProfile.idProofUploadedAt) : '-'}</p>
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm text-muted-foreground">{t.status}</Label>
                      <Badge variant={idProofViewProfile.idProofVerified ? 'default' : 'secondary'} className={idProofViewProfile.idProofVerified ? 'bg-green-600' : ''}>
                        {idProofViewProfile.idProofVerified 
                          ? (language === 'hi' ? 'सत्यापित ✓' : 'Verified ✓') 
                          : (language === 'hi' ? 'लंबित' : 'Pending')}
                      </Badge>
                    </div>
                  </div>

                  <div className="border rounded-lg p-2 bg-muted/20">
                    <img 
                      src={idProofViewProfile.idProofUrl} 
                      alt="ID Proof"
                      className="w-full max-h-[400px] object-contain rounded"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(idProofViewProfile.idProofUrl, '_blank')}
                    >
                      <Eye size={16} className="mr-2" />
                      {language === 'hi' ? 'पूर्ण आकार में देखें' : 'View Full Size'}
                    </Button>
                    {!idProofViewProfile.idProofVerified && (
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
                                    idProofVerifiedBy: 'Admin'
                                  } 
                                : p
                            )
                          )
                          setIdProofViewProfile(prev => prev ? {...prev, idProofVerified: true, idProofVerifiedAt: new Date().toISOString()} : null)
                          toast.success(language === 'hi' ? 'पहचान प्रमाण सत्यापित!' : 'ID Proof verified!')
                        }}
                      >
                        <CheckCircle size={16} className="mr-2" />
                        {t.markAsVerified}
                      </Button>
                    )}
                    {idProofViewProfile.idProofVerified && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600"
                        onClick={() => {
                          setProfiles((current) => 
                            (current || []).map(p => 
                              p.id === idProofViewProfile.id 
                                ? { 
                                    ...p, 
                                    idProofVerified: false,
                                    idProofVerifiedAt: undefined,
                                    idProofVerifiedBy: undefined
                                  } 
                                : p
                            )
                          )
                          setIdProofViewProfile(prev => prev ? {...prev, idProofVerified: false, idProofVerifiedAt: undefined} : null)
                          toast.success(language === 'hi' ? 'सत्यापन हटाया गया!' : 'Verification removed!')
                        }}
                      >
                        <XCircle size={16} className="mr-2" />
                        {t.removeVerification}
                      </Button>
                    )}
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
                </>
              ) : (
                <Alert variant="destructive">
                  <XCircle size={18} />
                  <AlertDescription>
                    {t.idProofNotUploaded}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowIdProofViewDialog(false)}>
                  {t.cancel}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
