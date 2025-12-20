import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/componen
import type { Language } from '@/lib/translations'
const ADMIN_USERNAME = 'rkkhil
const ADMIN_PHONE_NUMBERS = ['+91-7895601505', '+9

  onClose: () => void
  language: Language


  const [password, setPassword] =
  const [genera
  const t = {
    subtitle: language === '
    password: langua
 

    invalidCredentials: language === 'hi' ? 'अमान्य उपयोगकर्ता नाम या पासवर्ड' : 'Invalid username or 
  }
  const handleCredentialsSubmit = () => {
      const otp = Math.floor(100000 + Math.ran
      
        language === 'hi' ? 'OTP भेजा गया' : 'OTP Sent

        }
      
    } else {
    }

    if (otp === generatedOtp) {
      onLoginSuccess()
    } else {
    }

    setStep('credentials')
    setPassword('')
   

  return (
      <DialogContent>
          <DialogTitle>
          </DialogTitle>

          <Card>
              <p className="text-sm text-muted-foregroun
         
              <div className="space-y-2">
                <Input
         
       
      
              <div c
            
                  type="password"
     
   

                {t.continue}
            </CardContent>
        ) : (
            <CardConte
                {t.
            
                  <div key={idx
     
   

                  type="text"
                  value={o
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











