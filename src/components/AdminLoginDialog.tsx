import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/componen
import type { Language } from '@/lib/translations'
const ADMIN_USERNAME = 'rkkhil
const OTP_PHONE_NUMBERS = ['+91-7895601505', '+91-

  onClose: () => void
  language: Language


  const [otp, setOtp] = useState(
  const [step, 
  const t = {
    username: language === '
    submit: language
 

    invalidOtp: language === 'hi' ? 'गलत OTP' : 'Invalid OTP',
    back: language === 'hi' ? 'पीछे जाएं' : 'G

    e.preventDefault()
      toast.error(t.invalidCredentials)
    }

    setStep('
    toast.info(t.otpSent, {
      duration: 15000
  }
  const handleOtpSubmit = (e: React.FormEvent) => {
    if (otp !== generatedOtp) {
      return

    setUsername('')
    setOtp('')
    setStep('credentials')

    setUsername('')
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
      duration: 15000
    })
  }

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp !== generatedOtp) {
      toast.error(t.invalidOtp)
      return
    }

    onLoginSuccess()
    setUsername('')
    setPassword('')
    setOtp('')
    setGeneratedOtp('')
    setStep('credentials')
  }

  const handleClose = () => {
    setUsername('')
    setPassword('')
    setOtp('')
    setGeneratedOtp('')
    setStep('credentials')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{step === 'credentials' ? t.title : t.otpTitle}</DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardContent className="pt-6">
            {step === 'credentials' ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username">{t.username}</Label>
                  <Input
                    id="admin-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  </Button>
                    
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




































