import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import type { Language } from '@/lib/translations'
import { toast } from 'sonner'

const ADMIN_USERNAME = 'rkkhilrani'
const ADMIN_PASSWORD = '1234'
const OTP_PHONE_NUMBERS = ['+91-7895601505', '+91-9828585300']

interface AdminLoginDialogProps {
  open: boolean
  onClose: () => void
  onLoginSuccess: () => void
  language: Language
}

export function AdminLoginDialog({ open, onClose, onLoginSuccess, language }: AdminLoginDialogProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')

  const t = {
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    username: language === 'hi' ? 'यूज़रनेम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    submit: language === 'hi' ? 'सबमिट करें' : 'Submit',
    otpTitle: language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification',
    otpLabel: language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP',
    otpSent: language === 'hi' ? 'OTP भेजा गया' : 'OTP Sent',
    invalidCredentials: language === 'hi' ? 'गलत यूज़रनेम या पासवर्ड' : 'Invalid username or password',
    invalidOtp: language === 'hi' ? 'गलत OTP' : 'Invalid OTP',
    back: language === 'hi' ? 'पीछे जाएं' : 'Go Back'
  }

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      toast.error(t.invalidCredentials)
      return
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(newOtp)
    setStep('otp')
    
    toast.info(t.otpSent, {
      description: `OTP: ${newOtp}`,
      duration: 15000
    })
  }

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp !== generatedOtp) {
      toast.error(t.invalidOtp)
      return
    }

    onLoginSuccess()
    setUsername('')
    setPassword('')
    setOtp('')
    setGeneratedOtp('')
    setStep('credentials')
  }

  const handleClose = () => {
    setUsername('')
    setPassword('')
    setOtp('')
    setGeneratedOtp('')
    setStep('credentials')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{step === 'credentials' ? t.title : t.otpTitle}</DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardContent className="pt-6">
            {step === 'credentials' ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username">{t.username}</Label>
                  <Input
                    id="admin-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">{t.password}</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  {t.submit}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-otp">{t.otpLabel}</Label>
                  <Input
                    id="admin-otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep('credentials')} className="flex-1">
                    {t.back}
                  </Button>
                  <Button type="submit" className="flex-1">
                    {t.submit}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
