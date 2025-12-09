import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldCheck, X, Check, Info } from '@phosphor-icons/react'
import type { Profile } from '@/types/profile'
import { toast } from 'sonner'

interface AdminPanelProps {
  profiles: Profile[] | undefined
  setProfiles: (newValue: Profile[] | ((oldValue?: Profile[] | undefined) => Profile[])) => void
  language: 'hi' | 'en'
}

export function AdminPanel({ profiles, setProfiles, language }: AdminPanelProps) {
  const t = {
    title: language === 'hi' ? 'प्रशासन पैनल' : 'Admin Panel',
    description: language === 'hi' ? 'प्रोफाइल सत्यापन और प्रबंधन' : 'Profile verification and management',
    pendingProfiles: language === 'hi' ? 'लंबित प्रोफाइल' : 'Pending Profiles',
    noPending: language === 'hi' ? 'कोई लंबित प्रोफाइल नहीं।' : 'No pending profiles.',
    approve: language === 'hi' ? 'स्वीकृत करें' : 'Approve',
    reject: language === 'hi' ? 'अस्वीकृत करें' : 'Reject',
    pending: language === 'hi' ? 'लंबित' : 'Pending',
    verified: language === 'hi' ? 'सत्यापित' : 'Verified',
    rejected: language === 'hi' ? 'अस्वीकृत' : 'Rejected',
    age: language === 'hi' ? 'आयु' : 'Age',
    location: language === 'hi' ? 'स्थान' : 'Location',
    education: language === 'hi' ? 'शिक्षा' : 'Education',
    occupation: language === 'hi' ? 'व्यवसाय' : 'Occupation',
    approveSuccess: language === 'hi' ? 'प्रोफाइल स्वीकृत की गई!' : 'Profile approved!',
    rejectSuccess: language === 'hi' ? 'प्रोफाइल अस्वीकृत की गई!' : 'Profile rejected!'
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
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg">{profile.fullName}</h3>
                            <Badge variant="secondary">{t.pending}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div>{t.age}: {profile.age}</div>
                            <div>{profile.gender === 'male' ? (language === 'hi' ? 'पुरुष' : 'Male') : (language === 'hi' ? 'महिला' : 'Female')}</div>
                            <div>{t.location}: {profile.location}</div>
                            <div>{t.education}: {profile.education}</div>
                            <div className="col-span-2">{t.occupation}: {profile.occupation}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleApprove(profile.id)}
                            className="bg-teal hover:bg-teal/90"
                          >
                            <Check size={16} weight="bold" className="mr-1" />
                            {t.approve}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleReject(profile.id)}
                          >
                            <X size={16} weight="bold" className="mr-1" />
                            {t.reject}
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
    </section>
  )
}
