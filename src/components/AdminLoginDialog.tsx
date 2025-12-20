import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Language } from '@/lib/translations'

const ADMIN_USERNAME = 'rkkhilrani'
const ADMIN_PASSWORD = '1234'
const ADMIN_PHONE_NUMBERS = ['+91-7895601505', '+91-9828585300']

interface AdminLoginDialogProps {
  open: boolean
  onClose: () => void
  onLoginSuccess: () => void
  language: Language
}

export function AdminLoginDialog({ open, onClose, onLoginSuccess, language }: AdminLoginDialogProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
  }

  const handleCredentialsSubmit = () => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(otp)
      setStep('otp')
      console.log(`OTP for admin login: ${otp}`)
      toast.success(t.otpSentSuccess)
    } else {
      toast.error(t.invalidCredentials)
    }
  }

  const handleOtpSubmit = () => {
    if (otp === generatedOtp) {
      toast.success(language === 'hi' ? 'लॉगिन सफल' : 'Login successful')
      onLoginSuccess()
      onClose()
      resetForm()
    } else {
      toast.error(t.invalidOtp)
    }
  }

  const resetForm = () => {
    setUsername('')
    setPassword('')
    setOtp('')
    setStep('credentials')
    setGeneratedOtp('')
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) { onClose(); resetForm(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{step === 'credentials' ? t.title : t.otpTitle}</DialogTitle>
        </DialogHeader>
        <Card>
          <CardContent className="pt-6">
            {step === 'credentials' ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">{t.subtitle}</p>
                <div className="space-y-2">
                  <Label htmlFor="admin-username">{t.username}</Label>
                  <Input
                    id="admin-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleCredentialsSubmit()}
                  />
                </div>
                <Button onClick={handleCredentialsSubmit} className="w-full">
                  {t.continue}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-2">{t.otpSent}</p>
                <div className="mb-4">
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
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
