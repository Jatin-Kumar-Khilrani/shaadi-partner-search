import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldCheck, Warning, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AdminLoginDialogProps {
  open: boolean
  onClose: () => void
  onLoginSuccess: () => void
  language: 'hi' | 'en'
}

const ADMIN_USERNAME = 'rkkhilrani'
const ADMIN_PASSWORD = '1234'
const ADMIN_PHONES = ['+91-7895601505', '+91-9828585300']

export function AdminLoginDialog({ open, onClose, onLoginSuccess, language }: AdminLoginDialogProps) {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selectedPhone, setSelectedPhone] = useState<string>('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')

  const t = {
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    subtitle: language === 'hi' ? 'केवल अधिकृत प्रशासकों के लिए' : 'For authorized administrators only',
    username: language === 'hi' ? 'उपयोगकर्ता नाम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    selectPhone: language === 'hi' ? 'OTP के लिए फोन नंबर चुनें' : 'Select phone for OTP',
    next: language === 'hi' ? 'आगे बढ़ें' : 'Next',
    verifyOtp: language === 'hi' ? 'OTP सत्यापित करें' : 'Verify OTP',
    enterOtp: language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP',
    otpSent: language === 'hi' ? 'OTP भेजा गया' : 'OTP Sent',
    otpSentTo: language === 'hi' ? 'को OTP भेजा गया है' : 'OTP has been sent to',
    resendOtp: language === 'hi' ? 'OTP पुनः भेजें' : 'Resend OTP',
    login: language === 'hi' ? 'लॉगिन करें' : 'Login',
    invalidCredentials: language === 'hi' ? 'गलत उपयोगकर्ता नाम या पासवर्ड' : 'Invalid username or password',
    invalidOtp: language === 'hi' ? 'गलत OTP' : 'Invalid OTP',
    loginSuccess: language === 'hi' ? 'लॉगिन सफल!' : 'Login successful!',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    back: language === 'hi' ? 'वापस' : 'Back',
    fillAllFields: language === 'hi' ? 'कृपया सभी फ़ील्ड भरें' : 'Please fill all fields',
    selectPhoneNumber: language === 'hi' ? 'कृपया फोन नंबर चुनें' : 'Please select a phone number'
  }

  const handleCredentialsSubmit = () => {
    if (!username || !password || !selectedPhone) {
      toast.error(!selectedPhone ? t.selectPhoneNumber : t.fillAllFields)
      return
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      toast.error(t.invalidCredentials)
      return
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(otp)
    setStep('otp')
    
    toast.success(t.otpSent, {
      description: `${t.otpSentTo} ${selectedPhone}. ${language === 'hi' ? 'आपका OTP है:' : 'Your OTP is:'} ${otp}`
    })
  }

  const handleResendOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(otp)
    
    toast.success(t.otpSent, {
      description: `${t.otpSentTo} ${selectedPhone}. ${language === 'hi' ? 'आपका OTP है:' : 'Your OTP is:'} ${otp}`
    })
  }

  const handleOtpSubmit = () => {
    if (otp !== generatedOtp) {
      toast.error(t.invalidOtp)
      return
    }

    toast.success(t.loginSuccess)
    onLoginSuccess()
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setStep('credentials')
    setUsername('')
    setPassword('')
    setSelectedPhone('')
    setOtp('')
    setGeneratedOtp('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <ShieldCheck size={28} weight="fill" className="text-primary" />
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.subtitle}</DialogDescription>
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
                <Label>{t.selectPhone}</Label>
                <div className="space-y-2">
                  {ADMIN_PHONES.map((phone) => (
                    <label
                      key={phone}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPhone === phone
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="phone"
                        value={phone}
                        checked={selectedPhone === phone}
                        onChange={(e) => setSelectedPhone(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="font-mono text-sm">{phone}</span>
                      {selectedPhone === phone && (
                        <CheckCircle size={20} weight="fill" className="text-primary ml-auto" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <Alert>
                <Warning size={18} />
                <AlertDescription className="text-xs">
                  {language === 'hi'
                    ? 'सही क्रेडेंशियल दर्ज करने के बाद चयनित नंबर पर OTP भेजा जाएगा।'
                    : 'OTP will be sent to selected number after entering correct credentials.'}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  {t.cancel}
                </Button>
                <Button onClick={handleCredentialsSubmit} className="flex-1">
                  {t.next}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Alert className="bg-teal/10 border-teal">
                <CheckCircle size={18} weight="fill" className="text-teal" />
                <AlertDescription>
                  {t.otpSentTo} <span className="font-mono font-semibold">{selectedPhone}</span>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="admin-otp">{t.enterOtp}</Label>
                <Input
                  id="admin-otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  autoComplete="off"
                />
              </div>

              <Button
                variant="ghost"
                onClick={handleResendOtp}
                className="w-full"
                size="sm"
              >
                {t.resendOtp}
              </Button>

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
                  disabled={otp.length !== 6}
                  className="flex-1"
                >
                  {t.verifyOtp}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
