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
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')

  const t = {
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    username: language === 'hi' ? 'यूज़रनेम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    enterOtp: language === 'hi' ? '6-अंकीय OTP दर्ज करें' : 'Enter 6-digit OTP',
    submit: language === 'hi' ? 'जारी रखें' : 'Continue',
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
      
      toast.success(
        language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification',
        {
          description: language === 'hi' 
            ? `OTP निम्नलिखित नंबरों पर भेजा गया: ${ADMIN_PHONE_NUMBERS.join(' और ')} 6-अंकीय OTP दर्ज करें`
            : `OTP sent to the following numbers: ${ADMIN_PHONE_NUMBERS.join(' and ')} Enter 6-digit OTP`,
          duration: 8000
        }
      )

      setTimeout(() => {
        toast.info(
          language === 'hi' ? 'परीक्षण के लिए OTP' : 'OTP for Testing',
          {
            description: language === 'hi' 
              ? `आपका 6-अंकीय OTP है: ${otp}`
              : `Your 6-digit OTP is: ${otp}`,
            duration: 15000
          }
        )
      }, 500)
    } else {
      toast.error(t.invalidCredentials)
    }
  }

  const handleOtpSubmit = () => {
    if (otp === generatedOtp) {
      toast.success(language === 'hi' ? 'लॉगिन सफल!' : 'Login successful!')
      onLoginSuccess()
      onClose()
      setUsername('')
      setPassword('')
      setOtp('')
      setGeneratedOtp('')
      setStep('credentials')
    } else {
      toast.error(t.invalidOtp)
    }
  }

  const handleClose = () => {
    onClose()
    setUsername('')
    setPassword('')
    setOtp('')
    setGeneratedOtp('')
    setStep('credentials')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>
        <Card>
          <CardContent className="pt-6">
            {step === 'credentials' ? (
              <div className="space-y-4">
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
                  {t.submit}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-otp">{t.enterOtp}</Label>
                  <Input
                    id="admin-otp"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && handleOtpSubmit()}
                    placeholder="000000"
                  />
                </div>
                <Button onClick={handleOtpSubmit} className="w-full">
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
