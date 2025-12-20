import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
const ADMIN_USERNAME = 'rkkhil
import type { Language } from '@/lib/translations'

const ADMIN_USERNAME = 'rkkhilrani'
  onClose: () => void
const ADMIN_PHONE_NUMBERS = ['+91-7895601505', '+91-9828585300']

interface AdminLoginDialogProps {
  const [userna
  onClose: () => void
  onLoginSuccess: () => void
  language: Language
 

export function AdminLoginDialog({ open, onClose, onLoginSuccess, language }: AdminLoginDialogProps) {
  const [username, setUsername] = useState('')
    otpTitle: language === 'hi' ? 'OTP सत्यापन
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')

  const t = {
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    subtitle: language === 'hi' ? 'एडमिन क्रेडेंशियल्स दर्ज करें' : 'Enter admin credentials',
    username: language === 'hi' ? 'यूज़रनेम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    continue: language === 'hi' ? 'जारी रखें' : 'Continue',
    otpTitle: language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification',
    otpSent: language === 'hi' ? 'OTP निम्नलिखित नंबरों पर भेजा गया:' : 'OTP sent to the following numbers:',
    otpLabel: language === 'hi' ? '6-अंकीय OTP दर्ज करें' : 'Enter 6-digit OTP',
    setStep('credentials')
    setGeneratedOtp('')
  }
  return (
   


          <CardContent className="pt-6">
              <div className="space-y-4">
                <div class
                  <I
                    
                    onKey
         
                  <Label htmlFor="admin-password">{t.password}</Label>
                    id="a
         
       
                </div>
            
              </div>
     
   

                    ))}
                </div>
                  <Lab
                   
            
                    maxLength={
     
   

          </CardContent>
      </DialogConte
  )
    setStep('credentials')
    setOtp('')
    setGeneratedOtp('')
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
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">{t.subtitle}</p>
                <div className="space-y-2">
                  <Label htmlFor="admin-username">{t.username}</Label>
                  <Input



















































