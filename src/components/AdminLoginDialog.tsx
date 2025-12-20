import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Language } from '@/lib/translations'
import { toast } from 'sonner'

const ADMIN_USERNAME = 'rkkhilrani'
const ADMIN_PASSWORD = '1234'
const ADMIN_PHONES = ['+91-7895601505', '+91-9828585300']

interface AdminLoginDialogProps {
  open: boolean
  onClose: () => void
  onLoginSuccess: () => void
  language: Language
}

export function AdminLoginDialog({ open, onClose, onLoginSuccess, language }: AdminLoginDialogProps) {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')

  const t = {
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    subtitle: language === 'hi' ? 'कृपया अपनी क्रेडेंशियल्स दर्ज करें' : 'Please enter your credentials',
    username: language === 'hi' ? 'उपयोगकर्ता नाम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    continue: language === 'hi' ? 'जारी रखें' : 'Continue',
    otpTitle: language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification',
    otpLabel: language === 'hi' ? '6 अंकों का OTP दर्ज करें' : 'Enter 6-digit OTP',
    otpSent: language === 'hi' ? 'OTP भेजा गया:' : 'OTP sent to:',
    bothNumbers: language === 'hi' ? 'दोनों नंबरों पर' : 'both numbers',
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    invalidCredentials: language === 'hi' ? 'अमान्य उपयोगकर्ता नाम या पासवर्ड' : 'Invalid username or password',
    invalidOtp: language === 'hi' ? 'अमान्य OTP। कृपया पुनः प्रयास करें।' : 'Invalid OTP. Please try again.',
    loginSuccess: language === 'hi' ? 'एडमिन लॉगिन सफल!' : 'Admin login successful!'
  }

  const handleCredentialsSubmit = () => {
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      toast.error(t.invalidCredentials)
      return
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(newOtp)
    toast.success(`${t.otpSent} ${ADMIN_PHONES.join(', ')}: ${newOtp}`)
    setStep('otp')
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

  const handleClose = () => {
    setStep('credentials')
    setUsername('')
    setPassword('')
    setOtp('')
    setGeneratedOtp('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {step === 'credentials' ? t.title : t.otpTitle}
          </DialogTitle>
        </DialogHeader>

        {step === 'credentials' ? (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                {t.subtitle}
              </p>

              <div className="space-y-2">
                <Label htmlFor="admin-username">{t.username}</Label>
                <Input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.username}
                  onKeyDown={(e) => e.key === 'Enter' && handleCredentialsSubmit()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">{t.password}</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.password}
                  onKeyDown={(e) => e.key === 'Enter' && handleCredentialsSubmit()}
                />
              </div>

              <Button onClick={handleCredentialsSubmit} className="w-full">
                {t.continue}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="text-sm text-center text-muted-foreground mb-4">
                <p>{t.otpSent}</p>
                <div className="font-medium text-foreground mt-2">
                  {ADMIN_PHONES.map((phone, idx) => (
                    <div key={idx}>{phone}</div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-otp">{t.otpLabel}</Label>
                <Input
                  id="admin-otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && handleOtpSubmit()}
                />
              </div>

              <Button onClick={handleOtpSubmit} className="w-full">
                {t.verify}
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
