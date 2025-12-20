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
import { ShieldCheck, X, Check, Info, ChatCircle, ProhibitInset, Robot, PaperPlaneTilt } from '@phosphor-icons/react'
import type { Profile } from '@/types/profile'
import { toast } from 'sonner'

interface AdminPanelProps {
  profiles: Profile[] | undefined
  setProfiles: (newValue: Profile[] | ((oldValue?: Profile[] | undefined) => Profile[])) => void
  language: 'hi' | 'en'
}

interface BlockedContact {
  email?: string
  mobile?: string
  blockedAt: string
  reason: string
}

export function AdminPanel({ profiles, setProfiles, language }: AdminPanelProps) {
  const [blockedContacts, setBlockedContacts] = useKV<BlockedContact[]>('blockedContacts', [])
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [showChatDialog, setShowChatDialog] = useState(false)
  
  const t = {
    title: language === 'hi' ? 'प्रशासन पैनल' : 'Admin Panel',
    description: language === 'hi' ? 'प्रोफाइल सत्यापन और प्रबंधन' : 'Profile verification and management',
    pendingProfiles: language === 'hi' ? 'लंबित प्रोफाइल' : 'Pending Profiles',
    noPending: language === 'hi' ? 'कोई लंबित प्रोफाइल नहीं।' : 'No pending profiles.',
    approve: language === 'hi' ? 'स्वीकृत करें' : 'Approve',
    reject: language === 'hi' ? 'अस्वीकृत करें' : 'Reject',
    block: language === 'hi' ? 'ब्लॉक करें' : 'Block',
    unblock: language === 'hi' ? 'अनब्लॉक करें' : 'Unblock',
    hold: language === 'hi' ? 'होल्ड पर रखें' : 'Hold',
    chat: language === 'hi' ? 'चैट करें' : 'Chat',
    aiReview: language === 'hi' ? 'AI समीक्षा' : 'AI Review',
    pending: language === 'hi' ? 'लंबित' : 'Pending',
    verified: language === 'hi' ? 'सत्यापित' : 'Verified',
    rejected: language === 'hi' ? 'अस्वीकृत' : 'Rejected',
    blocked: language === 'hi' ? 'ब्लॉक' : 'Blocked',
    age: language === 'hi' ? 'आयु' : 'Age',
    location: language === 'hi' ? 'स्थान' : 'Location',
    education: language === 'hi' ? 'शिक्षा' : 'Education',
    occupation: language === 'hi' ? 'व्यवसाय' : 'Occupation',
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
  }

  const pendingProfiles = profiles?.filter(p => p.status === 'pending') || []

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
    if (!chatMessage.trim()) return
    
    toast.success(t.messageSent)
    setChatMessage('')
    setShowChatDialog(false)
  }

  return (
    <section className="container mx-auto px-4 md:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ShieldCheck size={32} weight="fill" />
            {t.title}
          </h2>
          <p className="text-muted-foreground">{t.description}</p>
        </div>

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
    </section>
  )
}
