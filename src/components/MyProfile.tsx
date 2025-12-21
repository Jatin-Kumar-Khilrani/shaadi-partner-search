import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  User, MapPin, Briefcase, GraduationCap, Heart, House, PencilSimple,
  ChatCircle, Envelope, Phone, Calendar, Warning, FilePdf, Trash
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Profile } from '@/types/profile'
import type { Language } from '@/lib/translations'
import { BiodataGenerator } from './BiodataGenerator'

interface MyProfileProps {
  profile: Profile | null
  language: Language
  onEdit?: () => void
  onDeleteProfile?: (profileId: string) => void
}

export function MyProfile({ profile, language, onEdit, onDeleteProfile }: MyProfileProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showBiodataGenerator, setShowBiodataGenerator] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditConfirmDialog, setShowEditConfirmDialog] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'otp'>('confirm')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [enteredOtp, setEnteredOtp] = useState('')

  const t = {
    title: language === 'hi' ? 'मेरी प्रोफाइल' : 'My Profile',
    edit: language === 'hi' ? 'संपादित करें' : 'Edit Profile',
    profileId: language === 'hi' ? 'प्रोफाइल ID' : 'Profile ID',
    personalInfo: language === 'hi' ? 'व्यक्तिगत जानकारी' : 'Personal Information',
    familyInfo: language === 'hi' ? 'पारिवारिक जानकारी' : 'Family Information',
    contactInfo: language === 'hi' ? 'संपर्क जानकारी' : 'Contact Information',
    age: language === 'hi' ? 'आयु' : 'Age',
    years: language === 'hi' ? 'वर्ष' : 'years',
    height: language === 'hi' ? 'ऊंचाई' : 'Height',
    education: language === 'hi' ? 'शिक्षा' : 'Education',
    occupation: language === 'hi' ? 'व्यवसाय' : 'Occupation',
    location: language === 'hi' ? 'स्थान' : 'Location',
    religion: language === 'hi' ? 'धर्म' : 'Religion',
    caste: language === 'hi' ? 'जाति' : 'Caste',
    maritalStatus: language === 'hi' ? 'वैवाहिक स्थिति' : 'Marital Status',
    aboutMe: language === 'hi' ? 'मेरे बारे में' : 'About Me',
    familyDetails: language === 'hi' ? 'पारिवारिक विवरण' : 'Family Details',
    email: language === 'hi' ? 'ईमेल' : 'Email',
    mobile: language === 'hi' ? 'मोबाइल' : 'Mobile',
    verified: language === 'hi' ? 'सत्यापित' : 'Verified',
    pending: language === 'hi' ? 'लंबित' : 'Pending',
    level: language === 'hi' ? 'स्तर' : 'Level',
    trustLevel: language === 'hi' ? 'विश्वास स्तर' : 'Trust Level',
    digilockerVerified: language === 'hi' ? 'डिजिलॉकर सत्यापित' : 'DigiLocker Verified',
    idProofVerified: language === 'hi' ? 'पहचान सत्यापित' : 'ID Verified',
    returnedForEdit: language === 'hi' ? 'संपादन आवश्यक' : 'Edit Required',
    returnedForEditDesc: language === 'hi' ? 'एडमिन ने आपकी प्रोफाइल संपादन के लिए वापस भेजी है' : 'Admin has returned your profile for editing',
    adminReason: language === 'hi' ? 'एडमिन संदेश' : 'Admin Message',
    generateBiodata: language === 'hi' ? 'बायोडाटा बनाएं' : 'Generate Biodata',
    deleteProfile: language === 'hi' ? 'प्रोफाइल हटाएं' : 'Delete Profile',
    deleteConfirmTitle: language === 'hi' ? 'क्या आप वाकई प्रोफाइल हटाना चाहते हैं?' : 'Are you sure you want to delete your profile?',
    deleteConfirmDesc: language === 'hi' ? 'यह क्रिया आपकी प्रोफाइल को सभी उपयोगकर्ताओं से छुपा देगी। आप बाद में एडमिन से संपर्क करके इसे पुनः सक्रिय कर सकते हैं।' : 'This action will hide your profile from all users. You can contact admin later to reactivate it.',
    sendOtp: language === 'hi' ? 'OTP भेजें' : 'Send OTP',
    enterOtp: language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP',
    otpSent: language === 'hi' ? 'OTP आपके मोबाइल पर भेजा गया' : 'OTP sent to your mobile',
    confirmDelete: language === 'hi' ? 'हटाने की पुष्टि करें' : 'Confirm Delete',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    profileDeleted: language === 'hi' ? 'प्रोफाइल सफलतापूर्वक हटाई गई' : 'Profile deleted successfully',
    invalidOtp: language === 'hi' ? 'गलत OTP' : 'Invalid OTP',
    editConfirmTitle: language === 'hi' ? 'प्रोफ़ाइल संपादित करें?' : 'Edit Profile?',
    editConfirmDesc: language === 'hi' ? 'संपादन के बाद आपकी प्रोफ़ाइल को एडमिन द्वारा पुनः स्वीकृत करना होगा। स्वीकृति तक आपकी प्रोफ़ाइल अन्य उपयोगकर्ताओं को दिखाई नहीं देगी।' : 'After editing, your profile will need to be re-approved by admin. Your profile will not be visible to other users until approved.',
    confirmEdit: language === 'hi' ? 'संपादित करें' : 'Proceed to Edit',
    pendingApproval: language === 'hi' ? 'स्वीकृति लंबित' : 'Pending Approval',
    pendingApprovalDesc: language === 'hi' ? 'आपकी प्रोफ़ाइल एडमिन द्वारा समीक्षा के लिए लंबित है। स्वीकृति तक अन्य उपयोगकर्ताओं को दिखाई नहीं देगी।' : 'Your profile is pending review by admin. It will not be visible to other users until approved.',
  }

  const handleEditClick = () => {
    // If profile is returned for edit, go directly to edit
    if (profile?.returnedForEdit) {
      onEdit?.()
    } else {
      // Show confirmation dialog for regular edits
      setShowEditConfirmDialog(true)
    }
  }

  const handleConfirmEdit = () => {
    setShowEditConfirmDialog(false)
    onEdit?.()
  }

  const handleDeleteRequest = () => {
    setShowDeleteDialog(true)
    setDeleteStep('confirm')
    setEnteredOtp('')
  }

  const handleSendOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(otp)
    setDeleteStep('otp')
    toast.info(t.otpSent, {
      description: `OTP: ${otp}`,
      duration: 10000
    })
  }

  const handleConfirmDelete = () => {
    if (enteredOtp !== generatedOtp) {
      toast.error(t.invalidOtp)
      return
    }
    
    if (onDeleteProfile && profile) {
      onDeleteProfile(profile.profileId)
      toast.success(t.profileDeleted)
      setShowDeleteDialog(false)
      setDeleteStep('confirm')
      setEnteredOtp('')
      setGeneratedOtp('')
    }
  }

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false)
    setDeleteStep('confirm')
    setEnteredOtp('')
    setGeneratedOtp('')
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-8">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {language === 'hi' ? 'प्रोफाइल नहीं मिली' : 'Profile not found'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const photos = profile.photos?.length > 0 ? profile.photos : []
  const isPaidUser = !!profile.membershipPlan && profile.membershipExpiry && new Date(profile.membershipExpiry) > new Date()
  const isFreePlan = profile.membershipPlan === 'free'
  const canAccessBiodata = isPaidUser && !isFreePlan

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                if (!canAccessBiodata) {
                  toast.error(
                    language === 'hi' 
                      ? 'बायोडाटा जनरेटर मुफ्त योजना पर उपलब्ध नहीं है। कृपया प्रीमियम में अपग्रेड करें।' 
                      : 'Biodata generator is not available on Free Plan. Please upgrade to Premium.'
                  )
                  return
                }
                setShowBiodataGenerator(true)
              }} 
              variant="outline"
              className={`gap-2 ${canAccessBiodata ? 'text-red-600 border-red-300 hover:bg-red-50' : 'text-muted-foreground border-muted'}`}
            >
              <FilePdf size={20} weight="fill" />
              {t.generateBiodata}
              {!canAccessBiodata && <Badge variant="outline" className="ml-1 text-xs">Premium</Badge>}
            </Button>
            {onEdit && (
              <Button onClick={handleEditClick} className="gap-2">
                <PencilSimple size={20} />
                {t.edit}
              </Button>
            )}
            {onDeleteProfile && (
              <Button 
                onClick={handleDeleteRequest} 
                variant="destructive"
                className="gap-2"
              >
                <Trash size={20} />
                {t.deleteProfile}
              </Button>
            )}
          </div>
        </div>

        {/* Delete Profile Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={handleCloseDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash size={24} />
                {t.deleteConfirmTitle}
              </DialogTitle>
              <DialogDescription>
                {t.deleteConfirmDesc}
              </DialogDescription>
            </DialogHeader>
            
            {deleteStep === 'confirm' ? (
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={handleCloseDeleteDialog} className="flex-1">
                  {t.cancel}
                </Button>
                <Button variant="destructive" onClick={handleSendOtp} className="flex-1">
                  {t.sendOtp}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="delete-otp">{t.enterOtp}</Label>
                  <Input
                    id="delete-otp"
                    type="text"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    maxLength={6}
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleCloseDeleteDialog} className="flex-1">
                    {t.cancel}
                  </Button>
                  <Button variant="destructive" onClick={handleConfirmDelete} className="flex-1">
                    {t.confirmDelete}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Confirmation Dialog */}
        <Dialog open={showEditConfirmDialog} onOpenChange={setShowEditConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <Warning size={24} weight="fill" />
                {t.editConfirmTitle}
              </DialogTitle>
              <DialogDescription>
                {t.editConfirmDesc}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowEditConfirmDialog(false)} className="flex-1">
                {t.cancel}
              </Button>
              <Button onClick={handleConfirmEdit} className="flex-1 bg-amber-600 hover:bg-amber-700">
                {t.confirmEdit}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Biodata Generator Dialog */}
        <BiodataGenerator
          profile={profile}
          language={language}
          isPaidUser={isPaidUser}
          open={showBiodataGenerator}
          onClose={() => setShowBiodataGenerator(false)}
        />

        {/* Returned for Edit Alert */}
        {profile.returnedForEdit && (
          <Alert className="mb-6 bg-amber-50 border-amber-400 dark:bg-amber-950/30 dark:border-amber-700">
            <Warning size={20} weight="fill" className="text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200 font-semibold">
              {t.returnedForEdit}
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              {t.returnedForEditDesc}
              {profile.editReason && (
                <div className="mt-2 p-3 bg-white/50 dark:bg-black/20 rounded-md border border-amber-300">
                  <span className="font-semibold">{t.adminReason}:</span>{' '}
                  {profile.editReason}
                </div>
              )}
              {profile.returnedAt && (
                <p className="text-sm mt-2 text-amber-600 dark:text-amber-400">
                  {new Date(profile.returnedAt).toLocaleDateString()}
                </p>
              )}
              {onEdit && (
                <Button 
                  onClick={onEdit} 
                  className="mt-4 gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <PencilSimple size={20} weight="bold" />
                  {t.edit}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Approval Alert (when profile is pending and not returned for edit) */}
        {profile.status === 'pending' && !profile.returnedForEdit && (
          <Alert className="mb-6 bg-blue-50 border-blue-400 dark:bg-blue-950/30 dark:border-blue-700">
            <Warning size={20} weight="fill" className="text-blue-600" />
            <AlertTitle className="text-blue-800 dark:text-blue-200 font-semibold">
              {t.pendingApproval}
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              {t.pendingApprovalDesc}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {photos.length > 0 ? (
                    <div className="space-y-3">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={photos[currentPhotoIndex]} 
                          alt={profile.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {photos.length > 1 && (
                        <div className="grid grid-cols-5 gap-2">
                          {photos.map((photo, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentPhotoIndex(index)}
                              className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                                currentPhotoIndex === index ? 'border-primary' : 'border-transparent'
                              }`}
                            >
                              <img 
                                src={photo} 
                                alt={`Photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                      <User size={64} className="text-muted-foreground" />
                    </div>
                  )}

                  <div className="text-center pt-4">
                    <h2 className="text-2xl font-bold">{profile.fullName}</h2>
                    <p className="text-muted-foreground">
                      {profile.age} {t.years}
                    </p>
                    <div className="mt-2">
                      <Badge variant="secondary">
                        {t.profileId}: {profile.profileId}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Badge variant={profile.status === 'verified' ? 'default' : 'secondary'}>
                        {profile.status === 'verified' ? t.verified : t.pending}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline">
                        {t.trustLevel} {profile.trustLevel}
                      </Badge>
                    </div>
                    {profile.digilockerVerified && (
                      <div className="mt-2">
                        <Badge className="bg-green-600 hover:bg-green-700">
                          {t.digilockerVerified}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Tabs defaultValue="personal" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">{t.personalInfo}</TabsTrigger>
                <TabsTrigger value="family">{t.familyInfo}</TabsTrigger>
                <TabsTrigger value="contact">{t.contactInfo}</TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.personalInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.bio && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Heart size={18} />
                          {t.aboutMe}
                        </h4>
                        <p className="text-muted-foreground">{profile.bio}</p>
                      </div>
                    )}
                    
                    <Separator />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.age}</p>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar size={16} />
                          {profile.age} {t.years}
                        </p>
                      </div>

                      {profile.height && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.height}</p>
                          <p className="font-medium">{profile.height}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground">{t.education}</p>
                        <p className="font-medium flex items-center gap-2">
                          <GraduationCap size={16} />
                          {profile.education}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">{t.occupation}</p>
                        <p className="font-medium flex items-center gap-2">
                          <Briefcase size={16} />
                          {profile.occupation}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">{t.location}</p>
                        <p className="font-medium flex items-center gap-2">
                          <MapPin size={16} />
                          {profile.location}, {profile.country}
                        </p>
                      </div>

                      {profile.religion && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.religion}</p>
                          <p className="font-medium">{profile.religion}</p>
                        </div>
                      )}

                      {profile.caste && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.caste}</p>
                          <p className="font-medium">{profile.caste}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground">{t.maritalStatus}</p>
                        <p className="font-medium">{profile.maritalStatus}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="family">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.familyInfo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.familyDetails ? (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <House size={18} />
                          {t.familyDetails}
                        </h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{profile.familyDetails}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        {language === 'hi' ? 'कोई पारिवारिक जानकारी नहीं' : 'No family information'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contact">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.contactInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t.email}</p>
                      <p className="font-medium flex items-center gap-2">
                        <Envelope size={18} />
                        {profile.hideEmail ? 'XXX@XXX.com' : profile.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t.mobile}</p>
                      <p className="font-medium flex items-center gap-2">
                        <Phone size={18} />
                        {profile.hideMobile ? '+91 XXXXXXXXXX' : profile.mobile}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="mt-6">
          <Card>
            <CardContent className="py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="gap-2" disabled>
                  <Heart size={20} weight="fill" />
                  {language === 'hi' ? 'मुखपृष्ठ' : 'Home'}
                </Button>
                <Button variant="outline" className="gap-2" disabled>
                  <User size={20} />
                  {language === 'hi' ? 'मेरी गतिविधि' : 'My Activity'}
                </Button>
                <Button variant="outline" className="gap-2" disabled>
                  <Envelope size={20} />
                  {language === 'hi' ? 'इनबॉक्स' : 'Inbox'}
                </Button>
                <Button variant="outline" className="gap-2" disabled>
                  <ChatCircle size={20} />
                  {language === 'hi' ? 'चैट' : 'Chat'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
