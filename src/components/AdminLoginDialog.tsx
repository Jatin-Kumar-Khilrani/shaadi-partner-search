import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/componen
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ShieldCheck, CheckCircle } from '@phosphor-icons/react'
const ADMIN_PASSWORD = '1234'
import type { Language } from '@/lib/translations'

const ADMIN_USERNAME = 'rkkhilrani'
  onLoginSuccess: () => void
const ADMIN_PHONES = ['+91-7895601505', '+91-9828585300']

interface AdminLoginDialogProps {
  const [userna
  onClose: () => void
  const [otp, setOtp] = useS
  language: Language
}

export function AdminLoginDialog({ open, onClose, onLoginSuccess, language }: AdminLoginDialogProps) {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
    otpSentTo: language === 'hi' ? 'OTP भेजा गया' : 'OTP
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')

    selectPho
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

    s

    if (!selectedPhone) {
      toast.error(t.selectPhoneError)
      return
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(otp)
    setSelectedPho
    toast.success(t.otpSent, {
    onClose()
      duration: 10000
  retu
  }

  const handleOtpSubmit = () => {
            <DialogTitle classN
      toast.error(t.invalidOtp)
            
    }

    toast.success(t.loginSuccess)
            <CardCon
    handleClose()
   

                  value={username
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
                />
    setOtp('')
              <div className="
      description: `OTP: ${otp}`,
                  id=
    })
   

                />
    setStep('credentials')
              <div 
    setPassword('')
                  <Selec
    setOtp('')
    setGeneratedOtp('')
    onClose()
  }

          
    <Dialog open={open} onOpenChange={handleClose}>

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
                
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username">{t.username}</Label>
                <Input
                  id="admin-username"
                  placeholder={t.username}
                  value={username}
                  }}
                  autoComplete="username"
























































































