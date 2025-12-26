import { useState, useEffect } from 'react'
import { useKV } from '@/hooks/useKV'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Gear, Heart, Phone, Info, FileText, ShieldCheck } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { PartnerPreferenceData } from '@/types/profile'
import type { Language } from '@/lib/translations'

interface SettingsProps {
  open: boolean
  onClose: () => void
  profileId: string
  language: Language
}

export function Settings({ open, onClose, profileId, language }: SettingsProps) {
  const [preferences, setPreferences] = useKV<PartnerPreferenceData[]>('partnerPreferences', [])
  
  const currentPreference = preferences?.find(p => p.profileId === profileId)
  
  const [formData, setFormData] = useState<Partial<PartnerPreferenceData>>({
    profileId,
    ageMin: undefined,
    ageMax: undefined,
    heightMin: '',
    heightMax: '',
  })

  // Sync form data when currentPreference changes or dialog opens
  useEffect(() => {
    if (open) {
      if (currentPreference) {
        setFormData(currentPreference)
      } else {
        setFormData({
          profileId,
          ageMin: undefined,
          ageMax: undefined,
          heightMin: '',
          heightMax: '',
        })
      }
    }
  }, [open, currentPreference, profileId])

  const t = {
    title: language === 'hi' ? 'सेटिंग्स' : 'Settings',
    partnerPreferences: language === 'hi' ? 'साथी प्राथमिकताएं' : 'Partner Preferences',
    contact: language === 'hi' ? 'संपर्क' : 'Contact',
    help: language === 'hi' ? 'सहायता' : 'Help',
    termsConditions: language === 'hi' ? 'नियम और शर्तें' : 'Terms & Conditions',
    safetyTips: language === 'hi' ? 'सुरक्षा सुझाव' : 'Safety Tips',
    save: language === 'hi' ? 'सहेजें' : 'Save',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    ageRange: language === 'hi' ? 'आयु सीमा' : 'Age Range',
    heightRange: language === 'hi' ? 'ऊंचाई सीमा' : 'Height Range',
    minAge: language === 'hi' ? 'न्यूनतम आयु' : 'Min Age',
    maxAge: language === 'hi' ? 'अधिकतम आयु' : 'Max Age',
    minHeight: language === 'hi' ? 'न्यूनतम ऊंचाई' : 'Min Height',
    maxHeight: language === 'hi' ? 'अधिकतम ऊंचाई' : 'Max Height',
    preferencesSaved: language === 'hi' ? 'प्राथमिकताएं सहेजी गईं' : 'Preferences saved',
    helpline: language === 'hi' ? 'हेल्पलाइन' : 'Helpline',
    email: language === 'hi' ? 'ईमेल' : 'Email',
    
    termsContent: language === 'hi' ? `
नियम और शर्तें

1. सामान्य नियम
- यह सेवा केवल वैवाहिक उद्देश्यों के लिए है।
- आपको 18 वर्ष (महिला) या 21 वर्ष (पुरुष) से अधिक आयु का होना चाहिए।
- प्रोफाइल में सभी जानकारी सत्य और सही होनी चाहिए।

2. गोपनीयता
- आपकी व्यक्तिगत जानकारी सुरक्षित रहेगी।
- संपर्क विवरण केवल स्वीकृत उपयोगकर्ताओं के साथ साझा किया जाएगा।
- आपके डेटा को तीसरे पक्ष को नहीं बेचा जाएगा।

3. सदस्यता
- सदस्यता शुल्क वापसी योग्य नहीं है।
- सदस्यता अवधि के दौरान सभी सुविधाएं उपलब्ध हैं।

4. प्रोफाइल सत्यापन
- सभी प्रोफाइल स्वयंसेवकों द्वारा सत्यापित किए जाते हैं।
- गलत या अपमानजनक प्रोफाइल को हटा दिया जाएगा।

5. दायित्व
- यह सेवा केवल परिचय प्रदान करती है।
- विवाह का निर्णय पूरी तरह से परिवारों का है।
- प्लेटफॉर्म किसी भी विवाद के लिए जिम्मेदार नहीं है।
    ` : `
Terms and Conditions

1. General Rules
- This service is for matrimonial purposes only.
- You must be 18+ (female) or 21+ (male) years of age.
- All information in profile must be true and accurate.

2. Privacy
- Your personal information will be kept secure.
- Contact details shared only with approved users.
- Your data will not be sold to third parties.

3. Membership
- Membership fees are non-refundable.
- All features available during membership period.

4. Profile Verification
- All profiles are verified by experienced professionals.
- False or offensive profiles will be removed.

5. Liability
- This service only provides introductions.
- Marriage decision is entirely of families.
- Platform not responsible for any disputes.
    `,

    safetyContent: language === 'hi' ? `
ऑनलाइन सुरक्षा सुझाव

1. व्यक्तिगत जानकारी सुरक्षित रखें
- अपना पूरा पता, वित्तीय जानकारी न दें।
- पहली मुलाकात से पहले बैंक विवरण साझा न करें।

2. पहली मुलाकात
- सार्वजनिक स्थान पर मिलें।
- परिवार या दोस्तों को बताएं कि आप कहां हैं।
- अपने वाहन में जाएं।

3. लाल झंडे पहचानें
- जो व्यक्ति पैसे मांगता है।
- जो वीडियो कॉल से बचता है।
- जो जल्दबाजी में विवाह करना चाहता है।

4. सत्यापन
- हमेशा सत्यापित प्रोफाइल से संपर्क करें।
- वीडियो कॉल पर मिलें।
- परिवार से मिलें।
- परिवार, व्यापार/सेवा स्थान, आय और आय के स्रोत की जानकारी प्राप्त करें।

5. रिपोर्ट करें
- संदिग्ध गतिविधि की रिपोर्ट करें।
- अनुचित संदेश ब्लॉक करें।
- हमारे स्वयंसेवकों से संपर्क करें।
    ` : `
Online Safety Tips

1. Keep Personal Information Safe
- Don't share full address, financial information.
- Don't share bank details before first meeting.

2. First Meeting
- Meet in public place.
- Tell family or friends where you are.
- Go in your own vehicle.

3. Recognize Red Flags
- Person who asks for money.
- Person who avoids video calls.
- Person who rushes marriage.

4. Verification
- Always contact verified profiles.
- Meet on video call.
- Meet the family.
- Verify family details, business/service place, income and source of income.

5. Report
- Report suspicious activity.
- Block inappropriate messages.
- Contact our experienced professionals.
    `
  }

  const handleSave = () => {
    setPreferences(current => {
      const existing = current?.findIndex(p => p.profileId === profileId)
      if (existing !== undefined && existing >= 0) {
        const updated = [...(current || [])]
        updated[existing] = formData as PartnerPreferenceData
        return updated
      } else {
        return [...(current || []), formData as PartnerPreferenceData]
      }
    })
    toast.success(t.preferencesSaved)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Gear size={28} weight="bold" />
            {t.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preferences" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="preferences" className="text-xs md:text-sm">
              <Heart size={16} className="mr-1" />
              {language === 'hi' ? 'प्राथमिकता' : 'Preferences'}
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs md:text-sm">
              <Phone size={16} className="mr-1" />
              {language === 'hi' ? 'संपर्क' : 'Contact'}
            </TabsTrigger>
            <TabsTrigger value="help" className="text-xs md:text-sm">
              <Info size={16} className="mr-1" />
              {language === 'hi' ? 'सहायता' : 'Help'}
            </TabsTrigger>
            <TabsTrigger value="terms" className="text-xs md:text-sm">
              <FileText size={16} className="mr-1" />
              {language === 'hi' ? 'नियम' : 'T&C'}
            </TabsTrigger>
            <TabsTrigger value="safety" className="text-xs md:text-sm">
              <ShieldCheck size={16} className="mr-1" />
              {language === 'hi' ? 'सुरक्षा' : 'Safety'}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t.partnerPreferences}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t.minAge}</Label>
                      <Input
                        type="number"
                        placeholder={t.minAge}
                        value={formData.ageMin || ''}
                        onChange={(e) => setFormData({ ...formData, ageMin: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.maxAge}</Label>
                      <Input
                        type="number"
                        placeholder={t.maxAge}
                        value={formData.ageMax || ''}
                        onChange={(e) => setFormData({ ...formData, ageMax: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t.minHeight}</Label>
                      <Input
                        placeholder={t.minHeight}
                        value={formData.heightMin || ''}
                        onChange={(e) => setFormData({ ...formData, heightMin: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.maxHeight}</Label>
                      <Input
                        placeholder={t.maxHeight}
                        value={formData.heightMax || ''}
                        onChange={(e) => setFormData({ ...formData, heightMax: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button onClick={handleSave} className="w-full">
                    {t.save}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t.contact}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t.helpline}</p>
                    <p className="font-medium">+91 98765 43210</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t.email}</p>
                    <p className="font-medium">support@shaadipartnersearch.com</p>
                  </div>
                  <Separator />
                  <Alert>
                    <Info size={18} />
                    <AlertDescription>
                      {language === 'hi' 
                        ? 'हमारे अनुभवी पेशेवर सोमवार से शनिवार, सुबह 10 बजे से शाम 6 बजे तक उपलब्ध हैं।'
                        : 'Our experienced professionals are available Monday to Saturday, 10 AM to 6 PM.'}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="help" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t.help}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        {language === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <details className="p-3 rounded-lg bg-muted">
                          <summary className="cursor-pointer font-medium">
                            {language === 'hi' ? 'मैं अपनी प्रोफाइल कैसे संपादित करूं?' : 'How do I edit my profile?'}
                          </summary>
                          <p className="mt-2 text-muted-foreground">
                            {language === 'hi' 
                              ? 'मेरी प्रोफाइल पेज पर जाएं और "संपादित करें" बटन पर क्लिक करें।'
                              : 'Go to My Profile page and click the "Edit" button.'}
                          </p>
                        </details>
                        <details className="p-3 rounded-lg bg-muted">
                          <summary className="cursor-pointer font-medium">
                            {language === 'hi' ? 'सत्यापन में कितना समय लगता है?' : 'How long does verification take?'}
                          </summary>
                          <p className="mt-2 text-muted-foreground">
                            {language === 'hi' 
                              ? 'सत्यापन में आमतौर पर 24-48 घंटे लगते हैं।'
                              : 'Verification usually takes 24-48 hours.'}
                          </p>
                        </details>
                        <details className="p-3 rounded-lg bg-muted">
                          <summary className="cursor-pointer font-medium">
                            {language === 'hi' ? 'मैं किसी को कैसे ब्लॉक करूं?' : 'How do I block someone?'}
                          </summary>
                          <p className="mt-2 text-muted-foreground">
                            {language === 'hi' 
                              ? 'प्रोफाइल पर जाएं और रिपोर्ट/ब्लॉक विकल्प चुनें।'
                              : 'Go to the profile and select Report/Block option.'}
                          </p>
                        </details>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="terms">
              <Card>
                <CardHeader>
                  <CardTitle>{t.termsConditions}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{t.termsContent}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="safety">
              <Card>
                <CardHeader>
                  <CardTitle>{t.safetyTips}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{t.safetyContent}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            {t.cancel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
