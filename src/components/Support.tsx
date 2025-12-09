import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { HandHeart, User, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useState } from 'react'

export function Support() {
  const [volunteerForm, setVolunteerForm] = useState({
    name: '',
    email: '',
    mobile: '',
    city: '',
    role: ''
  })

  const handleVolunteerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('धन्यवाद!', {
      description: 'आपकी स्वयंसेवक आवेदन प्राप्त हुआ। हम जल्द ही संपर्क करेंगे।'
    })
    setVolunteerForm({ name: '', email: '', mobile: '', city: '', role: '' })
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            सहयोग करें
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            समुदाय सेवा में योगदान दें — स्वयंसेवक बनें या दान करें
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <User size={28} weight="fill" />
                स्वयंसेवक बनें
              </CardTitle>
              <CardDescription>
                तकनीकी सहायता, परिवारों से संवाद, या इवेंट आयोजन में मदद करें
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVolunteerSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="v-name">नाम / Name</Label>
                  <Input
                    id="v-name"
                    value={volunteerForm.name}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="v-email">ईमेल / Email</Label>
                  <Input
                    id="v-email"
                    type="email"
                    value={volunteerForm.email}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="v-mobile">मोबाइल / Mobile</Label>
                  <Input
                    id="v-mobile"
                    type="tel"
                    value={volunteerForm.mobile}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, mobile: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="v-city">शहर / City</Label>
                  <Input
                    id="v-city"
                    value={volunteerForm.city}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="v-role">आप कैसे मदद कर सकते हैं? / How can you help?</Label>
                  <Textarea
                    id="v-role"
                    placeholder="उदाहरण: प्रोफाइल सत्यापन, परिवार परामर्श, तकनीकी सहायता..."
                    value={volunteerForm.role}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, role: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  आवेदन भेजें
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-2 border-accent/20">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <HandHeart size={28} weight="fill" />
                दान करें
              </CardTitle>
              <CardDescription>
                वेबसाइट होस्टिंग, सामूहिक कार्यक्रम और तकनीकी रखरखाव में सहयोग करें
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info size={18} />
                <AlertDescription>
                  ShaadiPartnerSearch किफायती सदस्यता शुल्क पर चलती है। अतिरिक्त दान से हम सेवा बेहतर बना सकते हैं।
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-bold mb-2">UPI ID:</h4>
                  <p className="font-mono text-sm mb-2">shaadi@matrimony</p>
                  <Button variant="outline" size="sm" className="w-full">
                    QR कोड देखें
                  </Button>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-bold mb-2">बैंक विवरण:</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>खाता नाम:</strong> Shaadi Partner Search</p>
                    <p><strong>खाता संख्या:</strong> XXXX-XXXX-XXXX</p>
                    <p><strong>IFSC:</strong> XXXX0000XXX</p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-2">आपका दान किसमें उपयोग होगा:</p>
                  <ul className="space-y-1">
                    <li>• वेबसाइट और ऐप होस्टिंग</li>
                    <li>• सामूहिक परिचय कार्यक्रम</li>
                    <li>• स्वयंसेवक प्रशिक्षण</li>
                    <li>• तकनीकी सुरक्षा और रखरखाव</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h3 className="font-bold text-xl mb-4 text-center">💝 हमारे मिशन को आगे बढ़ाएं</h3>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto">
              हर स्वयंसेवक और दानकर्ता समाज के लिए एक पवित्र बंधन बनाने में योगदान देता है। 
              साथ मिलकर, हम विवाह को व्यापार नहीं बल्कि संस्कार बनाए रखते हैं।
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
