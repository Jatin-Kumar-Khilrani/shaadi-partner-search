import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/componen
import type { Language } from '@/lib/translatio
const ADMIN_USERNAME = 'rkkhilrani'
const ADMIN_PHONES = ['+91-789
interface AdminLoginDialogProps {

  language: Language

  const [step, setStep] = useState<'credentials' | 'otp'>

  const [generatedOtp, setGenerat
  const t = {
    subtitle: languag
    password: language === '
    otpTitle: langua
 

    invalidCredentials: language === 'hi' ? 'अमान्य उपयोगकर्ता नाम या पासवर्ड' : 'Invalid username or 
    invalidOtp: language === 'hi' ? 'अमान्य OTP। कृपया पुनः प्रयास करें।
    bothNumbers: language === 'hi' ? 'दोनों नं

    if (username !== ADMIN_USERNAME 
      return

    setGenera
    
  }
  const handleOtpSubmit = () => {
      toast.error(t.invalidOtp)
    }
    toast.success(t.loginSuccess)
    handleClose()

    const newOtp = Math.floor(100000 + Math.random() * 9000
    toast.success(`${t.otpSent} ${ADMIN_PHONES

    setStep('credentials')
    setPassword('')
    setGeneratedOtp('')
  }
  return (
   

          </DialogTitle>

          <Card>
            
     

                <Input
                  type="
                  
    
              </div>
   

                  type="password"
                  onChange={(e)
                  onKeyDown={(e
            
     

          </Card>
          <Card>
              <di
   

                    <strong key={
                </div>
    setGeneratedOtp(newOtp)
    toast.success(`${t.otpSent} ${ADMIN_PHONES.join(', ')}: ${newOtp}`)
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {step === 'credentials' ? t.title : t.otpTitle}
          </DialogTitle>
        </DialogHeader>

        {step === 'credentials' ? (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                {t.subtitle}
              </p>

              <div className="space-y-2">
                <Label htmlFor="admin-username">{t.username}</Label>
                <Input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.username}
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
                  placeholder={t.password}
                  onKeyDown={(e) => e.key === 'Enter' && handleCredentialsSubmit()}
                />
              </div>

              <Button onClick={handleCredentialsSubmit} className="w-full">
                {t.continue}
              </Button>










































