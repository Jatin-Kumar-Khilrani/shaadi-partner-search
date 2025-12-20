import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Language } from '@/lib/translations'

const ADMIN_USERNAME = 'rkkhilrani'
const ADMIN_PASSWORD = 'admin123'

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
    username: language === 'hi' ? 'उपयोगकर्ता नाम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    enterOtp: language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP',
    login: language === 'hi' ? 'लॉगिन करें' : 'Login',
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    invalidCredentials: language === 'hi' ? 'गलत उपयोगकर्ता नाम या पासवर्ड' : 'Invalid username or password',
    invalidOtp: language === 'hi' ? 'गलत OTP' : 'Invalid OTP',
    otpSent: language === 'hi' ? 'OTP भेजा गया' : 'OTP Sent',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel'
  }

  const handleClose = () => {
    setUsername('')
    setPassword('')
    setOtp('')
    setGeneratedOtp('')
    setStep('credentials')
    onClose()
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
      duration: 10000
    })
  }

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (otp !== generatedOtp) {
      toast.error(t.invalidOtp)
      return
    }

    onLoginSuccess()
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
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
              <Button type="submit">{t.login}</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-otp">{t.enterOtp}</Label>
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
              <Button type="submit">{t.verify}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
