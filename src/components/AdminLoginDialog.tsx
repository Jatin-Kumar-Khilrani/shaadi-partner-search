import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Language } from '@/lib/translations'

const ADMIN_USERNAME = 'rkkhilrani'
const ADMIN_PASSWORD = 'admin123'

interface AdminLoginDialogProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  language: Language;
}

export function AdminLoginDialog({ 
  open, 
  onClose, 
  onLoginSuccess,
  language 
}: AdminLoginDialogProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [generatedOtp, setGeneratedOtp] = useState('')

  const t = {
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    username: language === 'hi' ? 'यूज़रनेम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    login: language === 'hi' ? 'लॉगिन करें' : 'Login',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    otpTitle: language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification',
    otpLabel: language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP',
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    invalidCredentials: language === 'hi' ? 'गलत यूज़रनेम या पासवर्ड' : 'Invalid username or password',
    invalidOtp: language === 'hi' ? 'गलत OTP' : 'Invalid OTP'
  }

  const handleClose = () => {
    setUsername('')
    setPassword('')
    setOtp('')
    setStep('credentials')
    onClose()
  }

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(otp)
      setStep('otp')
      
      toast.info(language === 'hi' ? 'OTP भेजा गया' : 'OTP Sent', {
        description: `OTP: ${otp}`,
        duration: 10000
      })
    } else {
      toast.error(t.invalidCredentials)
    }
  }

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (otp === generatedOtp) {
      onLoginSuccess()
      handleClose()
    } else {
      toast.error(t.invalidOtp)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === 'credentials' ? t.title : t.otpTitle}</DialogTitle>
        </DialogHeader>
        
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

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t.cancel}
              </Button>
              <Button type="submit">
                {t.login}
              </Button>
            </div>
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

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t.cancel}
              </Button>
              <Button type="submit">
                {t.verify}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
