import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShieldCheck, X, Check, Info, ChatCircle, ProhibitInset, Robot, PaperPlaneTilt, Eye, Database, Key, Storefront, Plus, Trash, Pencil } from '@phosphor-icons/react'
import type { Profile, WeddingService } from '@/types/profile'
import type { User } from '@/types/user'
import type { ChatMessage } from '@/types/chat'
import { Chat } from '@/components/Chat'
import { toast } from 'sonner'

interface AdminPanelProps {
  profiles: Profile[] | undefined
  setProfiles: (newValue: Profile[] | ((oldValue?: Profile[] | undefined) => Profile[])) => void
  users: User[] | undefined
  language: 'hi' | 'en'
}

interface BlockedContact {
  email?: string
  mobile?: string
  blockedAt: string
  reason: string
}

export function AdminPanel({ profiles, setProfiles, users, language }: AdminPanelProps) {
  const [blockedContacts, setBlockedContacts] = useKV<BlockedContact[]>('blockedContacts', [])
  const [messages, setMessages] = useKV<ChatMessage[]>('chatMessages', [])
  const [weddingServices, setWeddingServices] = useKV<WeddingService[]>('weddingServices', [])
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [showChatDialog, setShowChatDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [editingService, setEditingService] = useState<WeddingService | null>(null)
  const [serviceFormData, setServiceFormData] = useState<Partial<WeddingService>>({
    category: 'venue',
    verificationStatus: 'verified',
    consultationFee: 200
  })
  
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
  }

  const pendingProfiles = profiles?.filter(p => p.status === 'pending') || []
  const approvedProfiles = profiles?.filter(p => p.status === 'verified') || []

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

  const handleGetAISuggestions = async (profile: Profile) => {
    setIsLoadingAI(true)
    setSelectedProfile(profile)
    try {
      const profileText = `Name: ${profile.fullName}, Age: ${profile.age}, Gender: ${profile.gender}, Education: ${profile.education}, Occupation: ${profile.occupation}, Location: ${profile.location}, Bio: ${profile.bio || 'Not provided'}, Family Details: ${profile.familyDetails || 'Not provided'}`
      
      const prompt = `You are a matrimony profile reviewer. Review this profile and provide 3-5 specific suggestions for improvements or issues to address:\n\nProfile Details:\n${profileText}\n\nProvide suggestions in a numbered list format. Focus on:\n1. Missing information\n2. Suspicious or incomplete details\n3. Photo verification\n4. Profile completeness\n\nKeep suggestions brief.`

      const response = await window.spark.llm(prompt, 'gpt-4o-mini')
      const suggestions = response.split('\n').filter(line => line.trim().length > 0 && /^\d/.test(line.trim()))
      setAiSuggestions(suggestions.length > 0 ? suggestions : [response])
    } catch (error) {
      toast.error('Failed to get AI suggestions')
      setAiSuggestions([])
    } finally {
      setIsLoadingAI(false)
    }
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
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ShieldCheck size={32} weight="fill" />
            {t.title}
          </h2>
          <p className="text-muted-foreground">{t.description}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-4xl">
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
                <CardTitle>{t.pendingProfiles}</CardTitle>
                <CardDescription>
                  {pendingProfiles.length} {t.pending.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingProfiles.length === 0 ? (
                  <Alert>
                    <Info size={18} />
                    <AlertDescription>{t.noPending}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {pendingProfiles.map((profile) => (
                      <Card key={profile.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-bold text-lg">{profile.fullName}</h3>
                                  <Badge variant="secondary">{t.pending}</Badge>
                                  {profile.isBlocked && <Badge variant="destructive">{t.blocked}</Badge>}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                  <div>{t.age}: {profile.age}</div>
                                  <div>{profile.gender === 'male' ? (language === 'hi' ? 'पुरुष' : 'Male') : (language === 'hi' ? 'महिला' : 'Female')}</div>
                                  <div>{t.location}: {profile.location}</div>
                                  <div>{t.education}: {profile.education}</div>
                                  <div className="col-span-2">{t.occupation}: {profile.occupation}</div>
                                  <div className="col-span-2">{t.email}: {profile.email}</div>
                                  <div className="col-span-2">{t.mobile}: {profile.mobile}</div>
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
                                onClick={() => handleApprove(profile.id)} 
                                variant="default"
                                size="sm"
                                className="bg-teal hover:bg-teal/90"
                              >
                                <Check size={16} className="mr-1" />
                                {t.approve}
                              </Button>
                              <Button 
                                onClick={() => handleReject(profile.id)} 
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key size={24} weight="fill" />
                  {t.approvedProfiles} - {t.loginCredentials}
                </CardTitle>
                <CardDescription>
                  {approvedProfiles.length} {language === 'hi' ? 'स्वीकृत प्रोफाइल और उनके लॉगिन विवरण' : 'approved profiles with login credentials'}
                </CardDescription>
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
                          <TableHead>{t.profileId}</TableHead>
                          <TableHead>{t.name}</TableHead>
                          <TableHead>{t.relation}</TableHead>
                          <TableHead>{t.userId}</TableHead>
                          <TableHead>{t.password}</TableHead>
                          <TableHead>{t.email}</TableHead>
                          <TableHead>{t.mobile}</TableHead>
                          <TableHead>{t.verifiedAt}</TableHead>
                          <TableHead>{t.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedProfiles.map((profile) => {
                          const userCred = users?.find(u => u.profileId === profile.id)
                          return (
                            <TableRow key={profile.id}>
                              <TableCell className="font-mono font-semibold">{profile.profileId}</TableCell>
                              <TableCell className="font-medium">{profile.fullName}</TableCell>
                              <TableCell className="text-sm">
                                {profile.relationToProfile && profile.relationToProfile !== 'Self' 
                                  ? profile.relationToProfile 
                                  : '-'}
                              </TableCell>
                              <TableCell className="font-mono text-primary">{userCred?.userId || '-'}</TableCell>
                              <TableCell className="font-mono text-accent">{userCred?.password || '-'}</TableCell>
                              <TableCell className="text-sm">{profile.email}</TableCell>
                              <TableCell className="font-mono text-sm">{profile.mobile}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {profile.verifiedAt ? new Date(profile.verifiedAt).toLocaleDateString() : '-'}
                              </TableCell>
                              <TableCell>
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
                <CardTitle className="flex items-center gap-2">
                  <Database size={24} weight="fill" />
                  {t.allDatabase}
                </CardTitle>
                <CardDescription>
                  {profiles?.length || 0} {language === 'hi' ? 'कुल प्रोफाइल' : 'total profiles'}
                </CardDescription>
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
                        {profiles.map((profile) => (
                          <TableRow key={profile.id}>
                            <TableCell className="font-mono font-semibold">{profile.profileId}</TableCell>
                            <TableCell className="font-medium">{profile.fullName}</TableCell>
                            <TableCell className="text-sm">
                              {profile.relationToProfile && profile.relationToProfile !== 'Self' 
                                ? profile.relationToProfile 
                                : '-'}
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
                              {new Date(profile.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProfile(profile)
                                    setShowChatDialog(true)
                                  }}
                                >
                                  <Eye size={16} />
                                </Button>
                                {profile.status !== 'verified' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleApprove(profile.id)}
                                    className="text-teal hover:text-teal"
                                  >
                                    <Check size={16} />
                                  </Button>
                                )}
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
                <Chat 
                  currentUserProfile={adminProfile}
                  profiles={profiles || []}
                  language={language}
                  isAdmin={true}
                />
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
    </section>
  )
}
