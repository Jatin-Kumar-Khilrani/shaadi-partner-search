import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/butto
import { Button } from '@/components/ui/button'

const ADMIN_PASSWORD = '1234'

  open: boolean

const ADMIN_USERNAME = 'rkkhilrani'
const ADMIN_PASSWORD = '1234'
const ADMIN_PHONE_NUMBERS = ['+91-7895601505', '+91-9828585300']

interface AdminLoginDialogProps {
  open: boolean
  onClose: () => void
  onLoginSuccess: () => void
  language: Language
 

export function AdminLoginDialog({ open, onClose, onLoginSuccess, language }: AdminLoginDialogProps) {
  const [username, setUsername] = useState('')
    otpTitle: language === 'hi' ? 'OTP सत्यापन
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')

  const t = {
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    subtitle: language === 'hi' ? 'एडमिन क्रेडेंशियल्स दर्ज करें' : 'Enter admin credentials',
    username: language === 'hi' ? 'यूज़रनेम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    continue: language === 'hi' ? 'जारी रखें' : 'Continue',
    otpTitle: language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification',
    otpSent: language === 'hi' ? 'OTP निम्नलिखित नंबरों पर भेजा गया:' : 'OTP sent to the following numbers:',
    otpLabel: language === 'hi' ? '6-अंकीय OTP दर्ज करें' : 'Enter 6-digit OTP',
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    invalidCredentials: language === 'hi' ? 'अमान्य यूज़रनेम या पासवर्ड' : 'Invalid username or password',
    invalidOtp: language === 'hi' ? 'अमान्य OTP' : 'Invalid OTP',
    otpSentSuccess: language === 'hi' ? 'OTP दोनों नंबरों पर भेजा गया' : 'OTP sent to both numbers'
   


    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(otp)
    setGeneratedOtp(
      console.log(`OTP for admin login: ${otp}`)
      toast.success(t.otpSentSuccess)
    } else {
      <DialogContent className="sm:max-
    }
  }

  const handleOtpSubmit = () => {
    if (otp === generatedOtp) {
      toast.success(language === 'hi' ? 'लॉगिन सफल' : 'Login successful')
      onLoginSuccess()
                  <
    } else {
                    value={user
    }
   

                  <Label html
    setUsername('')
                   
    setStep('credentials')
              
    setGeneratedOtp('')
             
  }

  return (
                <p className="text-sm text-muted-fo
      <DialogContent className="sm:max-w-md">
                    <p
          <DialogTitle>{step === 'credentials' ? t.title : t.otpTitle}</DialogTitle>
                  ))}

        <Card>
          <CardContent className="pt-6">
            {step === 'credentials' ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">{t.subtitle}</p>
                <div className="space-y-2">
                  <Label htmlFor="admin-username">{t.username}</Label>
                  <Input
                  {t.verify}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCredentialsSubmit()}
                  />
}
                <div className="space-y-2">
                  <Label htmlFor="admin-password">{t.password}</Label>
                  <Input
                    id="admin-password"
                    type="password"

                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCredentialsSubmit()}
                  />
                </div>
                <Button onClick={handleCredentialsSubmit} className="w-full">
                  {t.continue}
                </Button>

            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-2">{t.otpSent}</p>

                  {ADMIN_PHONE_NUMBERS.map((number) => (
                    <p key={number} className="text-sm font-medium">
                      {number}
                    </p>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-otp">{t.otpLabel}</Label>
                  <Input
                    id="admin-otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && handleOtpSubmit()}
                    maxLength={6}
                    placeholder="000000"
                  />
                </div>
                <Button onClick={handleOtpSubmit} className="w-full" disabled={otp.length !== 6}>
                  {t.verify}
                </Button>

            )}
          </CardContent>
        </Card>

    </Dialog>

}
