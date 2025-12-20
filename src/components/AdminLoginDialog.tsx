import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ShieldCheck, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Language } from '@/lib/translations'

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
  const [selectedPhone, setSelectedPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')

  const t = {
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    subtitle: language === 'hi' ? 'सिस्टम तक पहुंचने के लिए अपनी साख दर्ज करें' : 'Enter your credentials to access the system',
    username: language === 'hi' ? 'उपयोगकर्ता नाम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    selectPhone: language === 'hi' ? 'OTP के लिए फोन नंबर चुनें' : 'Select Phone for OTP',
    selectPhoneNumber: language === 'hi' ? 'कृपया फोन नंबर चुनें' : 'Please select phone number',
    continue: language === 'hi' ? 'जारी रखें' : 'Continue',
    otpTitle: language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification',
    otpSentTo: language === 'hi' ? 'OTP भेजा गया' : 'OTP sent to',
    enterOtp: language === 'hi' ? '6 अंकों का OTP दर्ज करें' : 'Enter 6-digit OTP',
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    back: language === 'hi' ? 'वापस' : 'Back',
    resend: language === 'hi' ? 'फिर से भेजें' : 'Resend OTP',
    invalidCredentials: language === 'hi' ? 'अमान्य उपयोगकर्ता नाम या पासवर्ड' : 'Invalid username or password',
    selectPhoneError: language === 'hi' ? 'कृपया OTP के लिए एक फोन नंबर चुनें' : 'Please select a phone number for OTP',
    otpSent: language === 'hi' ? 'OTP भेजा गया। कृपया अपना फोन जांचें।' : 'OTP sent. Please check your phone.',
    invalidOtp: language === 'hi' ? 'अमान्य OTP। कृपया पुनः प्रयास करें।' : 'Invalid OTP. Please try again.',
    loginSuccess: language === 'hi' ? 'लॉगिन सफल!' : 'Login successful!'
  }

  const handleCredentialsSubmit = () => {
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      toast.error(t.invalidCredentials)
      return
    }

    if (!selectedPhone) {
      toast.error(t.selectPhoneError)
      return
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(otp)
    setStep('otp')
    toast.success(t.otpSent, {
      description: `OTP: ${otp}`,
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
      description: `OTP: ${otp}`,
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
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={32} weight="fill" className="text-primary" />
            <DialogTitle className="text-2xl">{t.title}</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {step === 'credentials' ? t.subtitle : `${t.otpSentTo} ${selectedPhone}`}
          </p>
        </DialogHeader>

        {step === 'credentials' ? (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username">{t.username}</Label>
                <Input
                  id="admin-username"
                  placeholder={t.username}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">{t.password}</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder={t.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

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

              <Button
                onClick={handleCredentialsSubmit}
                className="w-full"
              >
                {t.continue}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-otp">{t.enterOtp}</Label>
                <Input
                  id="admin-otp"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('credentials')
                    setOtp('')
                  }}
                  className="flex-1"
                >
                  {t.back}
                </Button>
                <Button 
                  onClick={handleOtpSubmit}
                  className="flex-1"
                >
                  <CheckCircle size={20} weight="fill" className="mr-2" />
                  {t.verify}
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={handleResendOtp}
                className="w-full"
              >
                {t.resend}
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
