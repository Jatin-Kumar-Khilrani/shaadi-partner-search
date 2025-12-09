import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { UserPlus, CheckCircle, Info, CurrencyInr } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Gender, MaritalStatus, Profile, MembershipPlan } from '@/types/profile'

interface RegistrationDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (profile: Omit<Profile, 'id' | 'status' | 'trustLevel' | 'createdAt'>) => void
}

export function RegistrationDialog({ open, onClose, onSubmit }: RegistrationDialogProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '' as Gender,
    religion: '',
    caste: '',
    education: '',
    occupation: '',
    location: '',
    country: '',
    maritalStatus: '' as MaritalStatus,
    email: '',
    mobile: '',
    height: '',
    bio: '',
    familyDetails: '',
    membershipPlan: '' as MembershipPlan
  })

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleSubmit = () => {
    if (!formData.fullName || !formData.dateOfBirth || !formData.gender || !formData.email || !formData.mobile || !formData.membershipPlan) {
      toast.error('कृपया सभी आवश्यक फ़ील्ड भरें')
      return
    }

    const age = calculateAge(formData.dateOfBirth)
    if (age < 18) {
      toast.error('न्यूनतम आयु 18 वर्ष होनी चाहिए')
      return
    }

    const membershipCost = formData.membershipPlan === '6-month' ? 500 : 900
    const membershipExpiry = new Date()
    membershipExpiry.setMonth(membershipExpiry.getMonth() + (formData.membershipPlan === '6-month' ? 6 : 12))

    const profile: Omit<Profile, 'id' | 'status' | 'trustLevel' | 'createdAt'> = {
      ...formData,
      age,
      photoUrl: undefined,
      membershipExpiry: membershipExpiry.toISOString()
    }

    onSubmit(profile)
    toast.success('प्रोफाइल सबमिट की गई!', {
      description: `सदस्यता शुल्क: ₹${membershipCost}। OTP सत्यापन के लिए ईमेल और SMS भेजा जा रहा है।`
    })
    
    setTimeout(() => {
      toast.info('सत्यापन प्रक्रिया', {
        description: 'स्वयंसेवक द्वारा समीक्षा के बाद आपकी प्रोफाइल सक्रिय की जाएगी।'
      })
    }, 2000)

    setFormData({
      fullName: '',
      dateOfBirth: '',
      gender: '' as Gender,
      religion: '',
      caste: '',
      education: '',
      occupation: '',
      location: '',
      country: '',
      maritalStatus: '' as MaritalStatus,
      email: '',
      mobile: '',
      height: '',
      bio: '',
      familyDetails: '',
      membershipPlan: '' as MembershipPlan
    })
    setStep(1)
    onClose()
  }

  const nextStep = () => {
    if (step === 1 && (!formData.fullName || !formData.dateOfBirth || !formData.gender)) {
      toast.error('कृपया सभी आवश्यक फ़ील्ड भरें')
      return
    }
    if (step === 2 && (!formData.education || !formData.occupation)) {
      toast.error('कृपया शिक्षा और व्यवसाय भरें')
      return
    }
    if (step === 3 && (!formData.location || !formData.country || !formData.email || !formData.mobile)) {
      toast.error('कृपया सभी संपर्क विवरण भरें')
      return
    }
    setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl flex items-center gap-2">
            <UserPlus size={32} weight="bold" />
            प्रोफाइल पंजीकरण
          </DialogTitle>
          <DialogDescription>
            भारतीय मॅट्रिमोनी में अपना प्रोफाइल बनाएं
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                s === step ? 'bg-primary text-primary-foreground scale-110' :
                s < step ? 'bg-teal text-teal-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {s < step ? <CheckCircle size={20} weight="fill" /> : s}
              </div>
              {s < 5 && <div className={`w-12 h-1 ${s < step ? 'bg-teal' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        <Alert className="mb-4">
          <Info size={18} />
          <AlertDescription>
            {step === 1 && 'व्यक्तिगत जानकारी दर्ज करें'}
            {step === 2 && 'शिक्षा और व्यवसाय की जानकारी'}
            {step === 3 && 'संपर्क विवरण और स्थान'}
            {step === 4 && 'अतिरिक्त जानकारी (वैकल्पिक)'}
            {step === 5 && 'सदस्यता योजना चुनें'}
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="pt-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">पूरा नाम / Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="उदाहरण: राज आहूजा"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">जन्म तिथि / Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateField('dateOfBirth', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">लिंग / Gender *</Label>
                    <Select onValueChange={(value: Gender) => updateField('gender', value)} value={formData.gender}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="चुनें" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">पुरुष / Male</SelectItem>
                        <SelectItem value="female">महिला / Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="religion">धर्म / Religion</Label>
                    <Input
                      id="religion"
                      placeholder="उदाहरण: हिंदू, मुस्लिम, सिख, ईसाई"
                      value={formData.religion}
                      onChange={(e) => updateField('religion', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caste">जाति / Caste (वैकल्पिक)</Label>
                    <Input
                      id="caste"
                      placeholder="यदि ज्ञात हो"
                      value={formData.caste}
                      onChange={(e) => updateField('caste', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">वैवाहिक स्थिति / Marital Status</Label>
                    <Select onValueChange={(value: MaritalStatus) => updateField('maritalStatus', value)} value={formData.maritalStatus}>
                      <SelectTrigger id="maritalStatus">
                        <SelectValue placeholder="चुनें" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never-married">अविवाहित / Never Married</SelectItem>
                        <SelectItem value="divorced">तलाकशुदा / Divorced</SelectItem>
                        <SelectItem value="widowed">विधुर/विधवा / Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">ऊंचाई / Height (वैकल्पिक)</Label>
                    <Input
                      id="height"
                      placeholder="उदाहरण: 5'8&quot; या 172 cm"
                      value={formData.height}
                      onChange={(e) => updateField('height', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="education">शिक्षा / Education *</Label>
                  <Input
                    id="education"
                    placeholder="उदाहरण: B.Tech, MBA, M.Com"
                    value={formData.education}
                    onChange={(e) => updateField('education', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">व्यवसाय / Occupation *</Label>
                  <Input
                    id="occupation"
                    placeholder="उदाहरण: सॉफ्टवेयर इंजीनियर, डॉक्टर, व्यवसायी"
                    value={formData.occupation}
                    onChange={(e) => updateField('occupation', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">शहर / City *</Label>
                    <Input
                      id="location"
                      placeholder="उदाहरण: मुंबई, जयपुर"
                      value={formData.location}
                      onChange={(e) => updateField('location', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">देश / Country *</Label>
                    <Input
                      id="country"
                      placeholder="उदाहरण: भारत, USA"
                      value={formData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">ईमेल / Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">मोबाइल / Mobile *</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="+91 98XXXXXXXX"
                    value={formData.mobile}
                    onChange={(e) => updateField('mobile', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">परिचय / About Yourself</Label>
                  <Textarea
                    id="bio"
                    placeholder="अपने बारे में कुछ शब्द लिखें..."
                    value={formData.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="familyDetails">पारिवारिक विवरण / Family Details</Label>
                  <Textarea
                    id="familyDetails"
                    placeholder="परिवार के बारे में जानकारी..."
                    value={formData.familyDetails}
                    onChange={(e) => updateField('familyDetails', e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">सदस्यता योजना चुनें</h3>
                  <p className="text-muted-foreground">किफायती मूल्य पर पूर्ण सुविधाएं</p>
                </div>

                <RadioGroup value={formData.membershipPlan} onValueChange={(value: MembershipPlan) => updateField('membershipPlan', value)}>
                  <div className="space-y-4">
                    <label htmlFor="6-month" className="cursor-pointer">
                      <Card className={`border-2 transition-all ${formData.membershipPlan === '6-month' ? 'border-primary shadow-lg' : 'hover:border-primary/50'}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <RadioGroupItem value="6-month" id="6-month" />
                              <div className="flex-1">
                                <h4 className="font-bold text-xl mb-2">6 महीने की योजना</h4>
                                <div className="flex items-baseline gap-2 mb-3">
                                  <CurrencyInr size={24} weight="bold" className="text-primary" />
                                  <span className="text-3xl font-bold text-primary">500</span>
                                  <span className="text-muted-foreground">/ 6 महीने</span>
                                </div>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    असीमित प्रोफाइल देखें
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    संपर्क जानकारी का उपयोग
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    स्वयंसेवक सहायता
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </label>

                    <label htmlFor="1-year" className="cursor-pointer">
                      <Card className={`border-2 transition-all ${formData.membershipPlan === '1-year' ? 'border-accent shadow-lg' : 'hover:border-accent/50'}`}>
                        <CardContent className="pt-6 relative">
                          <div className="absolute top-0 right-4 -translate-y-1/2">
                            <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold">सबसे लोकप्रिय</span>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <RadioGroupItem value="1-year" id="1-year" />
                              <div className="flex-1">
                                <h4 className="font-bold text-xl mb-2">1 साल की योजना</h4>
                                <div className="flex items-baseline gap-2 mb-3">
                                  <CurrencyInr size={24} weight="bold" className="text-accent" />
                                  <span className="text-3xl font-bold text-accent">900</span>
                                  <span className="text-muted-foreground">/ 1 साल</span>
                                  <span className="text-sm text-teal font-medium ml-2">₹300 की बचत!</span>
                                </div>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    असीमित प्रोफाइल देखें
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    संपर्क जानकारी का उपयोग
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    प्राथमिकता स्वयंसेवक सहायता
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    प्रोफाइल हाइलाइट सुविधा
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </label>
                  </div>
                </RadioGroup>

                <Alert>
                  <Info size={18} />
                  <AlertDescription>
                    आपकी प्रोफाइल स्वयंसेवकों द्वारा सत्यापित की जाएगी। OTP सत्यापन के बाद आपको भुगतान लिंक भेजा जाएगा।
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between gap-4 mt-6">
          {step > 1 && (
            <Button variant="outline" onClick={prevStep}>
              पीछे जाएं
            </Button>
          )}
          {step < 5 ? (
            <Button onClick={nextStep} className="ml-auto">
              आगे बढ़ें
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="ml-auto bg-accent hover:bg-accent/90 text-accent-foreground">
              प्रोफाइल बनाएं
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
