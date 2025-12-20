import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/componen
import { Select, SelectContent, SelectItem, SelectTrigge
import { toast } from 'sonner'
const ADMIN_USERNAME = 'rkkhilrani'
const ADMIN_PHONES = ['+91-7895601505', '+91-9828585300']
interface AdminLoginDialogProp

  language: 'hi' | 'en'

  const [step, setStep] = useState<'credentials' | 'phone

  const [otp, setOtp] = useState(

    title: language =
    username: language === '
    selectPhone: langua
 

    loginSuccess: language === 'hi' ? 'लॉगिन सफल!' : 'Login successful!',
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    selectPhoneNumber: language === 'hi' ? 'कृ
  }
  const handleCredentialsSubmit = () => {
      toast.error(t.invalidCredentia
    }

  const handl
      toast.error(t.selectPhoneNumber)
    subtitle: language === 'hi' ? 'सुरक्षित पहुंच के लिए प्रमाणीकरण आवश्यक है' : 'Authentication required for secure access',
    username: language === 'hi' ? 'उपयोगकर्ता नाम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    selectPhone: language === 'hi' ? 'फोन नंबर चुनें' : 'Select Phone Number',
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
      description: `${t.otpSentTo} ${selectedPhone}. ${language === 'hi' ? 'आपका OTP है:' : 'Your OTP is:'} ${otp}`,
      duration: 10000
    })
  }

  const handleOtpSubmit = () => {
    if (otp !== generatedOtp) {
      toast.error(t.invalidOtp)
      return
    }
    
    toast.success(t.loginSuccess)
    onLoginSuccess()
    handleClose()
  }

  const handleResendOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(otp)
    setOtp('')
    
    toast.success(t.otpSent, {
      description: `${t.otpSentTo} ${selectedPhone}. ${language === 'hi' ? 'आपका OTP है:' : 'Your OTP is:'} ${otp}`,
      duration: 10000
    })
  }

  const handleClose = () => {
    setStep('credentials')
    setUsername('')
    setPassword('')
    setSelectedPhone('')
    setOtp('')
    setGeneratedOtp('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 justify-center">
            <ShieldCheck size={28} weight="fill" className="text-primary" />
            <DialogTitle className="text-2xl">{t.title}</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground text-center">{t.subtitle}</p>
        </DialogHeader>

        {step === 'credentials' ? (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username">{t.username}</Label>
                <Input
                  id="admin-username"
                  type="text"
                  placeholder={t.username}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
              <div className="space-y-2">
                <S
                    

                      <SelectItem key={ph
                      </SelectItem>
                  </Se
              </div>
              <div className="fle
                  onClick={() => setStep('
                  className="flex-
                  {t.back}
                <Button 
                  className="flex-1"
                >
                </Bu

        ) : (
            <CardContent className="pt-6 space-y-4
                <CheckCircle size=
                  {t.otpSentTo} <span className="
              <
              <div class
                <Input
                  type="te
                 
                  maxLength={6}
                
              </div>
              <Button
                variant="ghost"
                className="w-full"
                {t.resendOtp}

                <Button 
                    setStep('phon
                  }} 
                  className="flex-1"
                  {t.back}
                <Button 
                  class
                >
                </Button>
            </CardCo

    </Dialog>
}











































































