import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShieldCheck, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

const ADMIN_USERNAME = 'rkkhilrani'
const ADMIN_PASSWORD = '1234'
const ADMIN_PHONES = ['+91-7895601505', '+91-9828585300']

interface AdminLoginDialogProps {
  open: boolean
  onClose: () => void
  onLoginSuccess: () => void
  language: 'hi' | 'en'
}

export function AdminLoginDialog({ open, onClose, onLoginSuccess, language }: AdminLoginDialogProps) {
  const [step, setStep] = useState<'credentials' | 'phone' | 'otp'>('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selectedPhone, setSelectedPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')

  const t = {
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
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
                  onKeyDown={(e) => e.key === 'Enter' && handleCredentialsSubmit()}
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
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Alert className="bg-teal/10 border-teal">
                <CheckCircle size={18} className="text-teal" />
                <AlertDescription>
                  {t.otpSentTo} <span className="font-mono font-semibold">{selectedPhone}</span>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="admin-otp">{t.enterOtp}</Label>
                <Input
                  id="admin-otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="font-mono text-lg text-center"
                  onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && handleOtpSubmit()}
                />
              </div>

              <Button
                onClick={handleResendOtp}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                {t.resendOtp}
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
                  {t.back}
                </Button>
                <Button 
                  onClick={handleOtpSubmit} 
                  className="flex-1"
                  disabled={otp.length !== 6}
                >
                  {t.verify}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
