import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/componen
import { toast } from 'sonner'
const ADMIN_USERNAME = 'rkkhilrani'
const ADMIN_PHONE_NUMBERS = ['

  onClose: () => void
  language: Language


  const [password, setPassword] =
  const [genera
  const t = {
    subtitle: language === '
    password: langua
 

    invalidCredentials: language === 'hi' ? 'अमान्य उपयोगकर्ता नाम या पासवर्ड' : 'Invalid username or 
    otpSentSuccess: language === 'hi' ? 'OTP भेजा गया' : 'OTP Sent'

    if (username === ADMIN_USERNAME && passwor
      setGeneratedOtp(otp)
      

          des
      )
    } else {
    }

    if (otp === generatedOtp) {
      handleClose()
      toast.error(t.invalidOtp)
  }
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    invalidCredentials: language === 'hi' ? 'अमान्य उपयोगकर्ता नाम या पासवर्ड' : 'Invalid username or password',
    invalidOtp: language === 'hi' ? 'अमान्य OTP' : 'Invalid OTP',
    otpSentSuccess: language === 'hi' ? 'OTP भेजा गया' : 'OTP Sent'
  }

  const handleCredentialsSubmit = () => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(otp)
      setStep('otp')
      
      toast.success(
        language === 'hi' ? 'OTP भेजा गया' : 'OTP Sent',
        {
          description: `${language === 'hi' ? 'कंसोल में OTP देखें' : 'Check console for OTP'}: ${otp}`
        }
      )
      console.log(`Admin OTP sent to ${ADMIN_PHONE_NUMBERS.join(', ')}: ${otp}`)
    } else {
      toast.error(t.invalidCredentials)
    }
  }

  const handleOtpSubmit = () => {
    if (otp === generatedOtp) {
      onLoginSuccess()
      handleClose()
    } else {
      toast.error(t.invalidOtp)
    }
  }

  const handleClose = () => {
    setStep('credentials')
    setUsername('')
    setPassword('')
    setOtp('')
    setGeneratedOtp('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === 'credentials' ? t.title : t.otpTitle}
          </DialogTitle>
        </DialogHeader>

        {step === 'credentials' ? (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                {t.subtitle}
              </p>

              <div className="space-y-2">
                <Label htmlFor="admin-username">{t.username}</Label>
                <Input
                  id="admin-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.username}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">{t.password}</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.password}
                />
              </div>

              <Button onClick={handleCredentialsSubmit} className="w-full">
                {t.continue}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t.otpSent}
              </p>
              <div className="text-sm font-medium space-y-1">
                {ADMIN_PHONE_NUMBERS.map((phone, idx) => (
                  <div key={idx}>{phone}</div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-otp">{t.otpLabel}</Label>
                <Input
                  id="admin-otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                />
              </div>

              <Button onClick={handleOtpSubmit} className="w-full">
                {t.verify}
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}

  const handleClose = () => {
    setStep('credentials')
    setUsername('')
    setPassword('')
    setOtp('')
    setGeneratedOtp('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === 'credentials' ? t.title : t.otpTitle}
          </DialogTitle>
        </DialogHeader>

        {step === 'credentials' ? (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                {t.subtitle}
              </p>

              <div className="space-y-2">
                <Label htmlFor="admin-username">{t.username}</Label>
                <Input
                  id="admin-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.username}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">{t.password}</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.password}
                />
              </div>

              <Button onClick={handleCredentialsSubmit} className="w-full">
                {t.continue}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t.otpSent}
              </p>
              <div className="text-sm font-medium space-y-1">
                {ADMIN_PHONE_NUMBERS.map((phone, idx) => (
                  <div key={idx}>{phone}</div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-otp">{t.otpLabel}</Label>
                <Input
                  id="admin-otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                />
              </div>

              <Button onClick={handleOtpSubmit} className="w-full">
                {t.verify}
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
