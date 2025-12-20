import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/componen
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

  const [step, setStep] = useState<
  const [password, setPasswor
  const [otp, setOtp] = useState('')

    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    username: language === 'hi' ? 'उपयोगकर्ता नाम' : 'Username',
    selectPhone: language === 'hi' ? 'OTP के ल
    verifyOtp: language === 'hi' ? 'OTP सत्याप
    otpSent: language === 'hi' ? 'OTP भेजा गया' : 'OTP Sent',
    resendOtp: language === 'hi' ? '
    invalidCredentials: language === 'hi' ? 'गलत उपयोग

    back: lan
    selectPhoneNumber: language === 'hi' ? 'कृपया फोन नंबर चु

    if (!username || !password || !selectedPhone) {
      return

      toast.error(t.invalidCredentials)
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toSt
    setStep('otp')
    toast.success(t.otpSent, {
    })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
      description: `${t.otpSentTo} ${selectedPhone}. ${language === 'hi' 
  }
  const handleOtpSubmit = () => {
      toast.error(t.invalidOtp)
    }
   

  }
  const resetForm = () => {
    setUsername('')
    setSelec
    s

    resetForm()
  }
  return (
     

            {t.title}
          <DialogDescrip

    
              <div className="
                <Input
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
        ) : (
            <CardContent className="pt-6 s
                <CheckCircle size=
                  {t.otpSentTo} <span className="font-mono font
              </Alert>
              <div
                <Inp

                  value={otp}
                  maxLength={6}
                  autoComplete="off"
              </div>
              <Button
                onClick={handleRe
                size="sm"
                {t.resendOtp}

                <Button
                  onClick
                    s
                  className=
                  {t.back}
                <Button
                  disabled={otp.lengt
                >
                </Button>
            </CardContent>
        )}
    </Dialog>
}





















































































