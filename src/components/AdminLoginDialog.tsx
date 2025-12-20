import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/componen
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShieldCheck, Warning, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AdminLoginDialogProps {
  open: boolean
  onClose: () => void
  onLoginSuccess: () => void
  language: 'hi' | 'en'
c

  const [username, setUsername] = u
  const [selectedPhone, setSe
  const [generatedOtp, setGeneratedOtp] = useState('')

    subtitle: language === 'hi' ? 'सुरक्षित पहुंच के लिए प्रमाणीकरण आवश्यक है' : 'Authentication requi
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    verifyOtp: language === 'hi' ? 'OTP सत्याप
    otpSentTo: language === 'hi' ? 'OTP भेजा ग
    invalidCredentials: language === 'hi' ? 'गलत उपयोगकर
    loginSuccess: language === 'hi' 
    verify: language === 'hi' ? 'सत्यापित करें' : 'Ver

  }
  const handleCredentialsSubmit = () => {
      toast.error(t.invalidCredentials)
    }
  }
  const handlePhoneSubmit = () => {
      toast.error(t.selectPhoneNumber)
    otpSent: language === 'hi' ? 'OTP भेजा गया' : 'OTP Sent',
    otpSentTo: language === 'hi' ? 'OTP भेजा गया:' : 'OTP sent to:',
    resendOtp: language === 'hi' ? 'OTP पुनः भेजें' : 'Resend OTP',
    invalidCredentials: language === 'hi' ? 'गलत उपयोगकर्ता नाम या पासवर्ड' : 'Invalid username or password',
    invalidOtp: language === 'hi' ? 'गलत OTP' : 'Invalid OTP',
    loginSuccess: language === 'hi' ? 'लॉगिन सफल!' : 'Login successful!',
    next: language === 'hi' ? 'आगे बढ़ें' : 'Next',
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    back: language === 'hi' ? 'वापस' : 'Back',
    selectPhoneNumber: language === 'hi' ? 'कृपया फोन नंबर चुनें' : 'Please select a phone number',
    enterOtp: language === 'hi' ? '6 अंकों का OTP दर्ज करें' : 'Enter 6-digit OTP',
  }

  const handleCredentialsSubmit = () => {
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      toast.error(t.invalidCredentials)
      return
    }
    setStep('phone')
  }

  const handlePhoneSubmit = () => {
    if (!selectedPhone) {
      toast.error(t.selectPhoneNumber)
      return
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(otp)
    setStep('otp')
    
    toast.success(t.otpSent, {
      description: `${t.otpSentTo} ${selectedPhone}. ${language === 'hi' ? 'आपका OTP है:' : 'Your OTP is:'} ${otp}`
  }
  c


    <Dialog open={open} onOpenChange={handleClose}>
        <DialogHeader>
    
          </DialogTitle>
        </DialogHeader>
      
   

                  id="admin-usern
                  placeholder={
                  onChange={(e)
            
     

                <Input
                  ty
               
             
   

                onClick={ha
                disabled={
                {t.
            </CardC
        ) : step === 'ph
            <C
                <Label 
   

                    {ADMIN_PH
               
             
   

          
                  variant="outline"
                >
                </Butt
                  onClick={handlePhoneSubmit} 
                  disabled={!selectedPhone}
                  {t.
              </div>
          </Card>
          <Card>

                <AlertDescription>
                

                <Label htmlFor="admin-otp
                  id="admin-otp"
                  plac
                  onChange={(e) => se
                  autoComplet
                  onKeyDown={(e) => e.key 
              </div>
              <Button
                variant="ghost"
                  onKeyDown={(e) => e.key === 'Enter' && handleCredentialsSubmit()}
              >
              </Butt

                  onClick={() => {
                    setOtp('')
                  vari
                >
                  type="password"
                  placeholder={t.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  onKeyDown={(e) => e.key === 'Enter' && handleCredentialsSubmit()}
                />
              </div>

              <Button 
                onClick={handleCredentialsSubmit} 
                className="w-full"
                disabled={!username || !password}
              >
                {t.next}
              </Button>
            </CardContent>
          </Card>
        ) : step === 'phone' ? (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-phone">{t.selectPhone}</Label>
                <Select value={selectedPhone} onValueChange={setSelectedPhone}>
                  <SelectTrigger id="admin-phone">
                    <SelectValue placeholder={t.selectPhoneNumber} />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_PHONES.map((phone) => (
                      <SelectItem key={phone} value={phone}>
                        {phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setStep('credentials')} 
                  variant="outline"
                  className="flex-1"
                >
                  {t.back}
                </Button>
                <Button 
                  onClick={handlePhoneSubmit} 
                  className="flex-1"
                  disabled={!selectedPhone}
                >
                  {t.next}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <Alert className="bg-teal/10 border-teal">
                <CheckCircle size={18} className="text-teal" />
                <AlertDescription>
                  {t.otpSentTo} <span className="font-mono font-semibold">{selectedPhone}</span>
                </AlertDescription>


              <div className="space-y-2">
                <Label htmlFor="admin-otp">{t.enterOtp}</Label>
                <Input
                  id="admin-otp"
                  type="text"
                  placeholder="000000"

                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}


                  className="font-mono text-lg text-center"
                  onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && handleOtpSubmit()}
                />



                onClick={handleResendOtp}
                variant="ghost"

                className="w-full"
              >

              </Button>

              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setStep('phone')
                    setOtp('')
                  }} 
                  variant="outline"
                  className="flex-1"
                >

                </Button>
                <Button 
                  onClick={handleOtpSubmit} 
                  className="flex-1"
                  disabled={otp.length !== 6}

                  {t.verify}

              </div>

          </Card>

      </DialogContent>

  )

