import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Language } from '@/lib/translations'

}
export function AdminLoginDia
  const [password, setPassword] = useState('')


    title: lang
    password: languag
    submit: language === 'hi
    invalidCredentia
}

export function AdminLoginDialog({ open, onClose, onLoginSuccess, language }: AdminLoginDialogProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')

  const t = {
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    username: language === 'hi' ? 'यूज़रनेम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    enterOtp: language === 'hi' ? '6-अंकीय OTP दर्ज करें' : 'Enter 6-digit OTP',
    submit: language === 'hi' ? 'जारी रखें' : 'Continue',
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    invalidCredentials: language === 'hi' ? 'अमान्य यूज़रनेम या पासवर्ड' : 'Invalid username or password',
    invalidOtp: language === 'hi' ? 'अमान्य OTP' : 'Invalid OTP',
  return (
   

        <Card>
            {step === 'credentials' ? (
                <div className="space-y-2">
                  <Input
                    
      
                  />
                <div className="space-y-2">
                  <Inpu
        
            
                  />
     
   

                <div className="s
                  <Input
                    ty
                   
            
                  />
     
   

        </Card>
    </Dialog>
}

































































