import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Language } from '@/lib/translations'

const ADMIN_PHONE_NUMBERS = ['+91-7
interface AdminLoginDialogPro
  onClose: () => void


  const [userna
  const [otp, setOtp]
  const [step, setStep] = us
  const t = {
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
        {
   

      )
      setTimeout(() => {
          language === 'hi' ? 'परीक्षण के लिए OTP' : 'OTP for Testing',
            description: l
              : `You
      
      }, 500)
      toast.error(t.invalidCredentials)
  }
  const handleOtpSubmit = () => {
      toast.success(language === 'hi' ? 'लॉगिन सफल!' : 'Login successful!')
      onClose()
      setPassword('')
      set
    } e


    onClose()
    setPassword('')
    setGene
  }
  return (
      <DialogContent className="sm:max-w-md">
          <DialogTitle>{t.t
        <Ca
         
             
            
                    type="text"
     
   

                  <Input
                    type="passw
                    onChange={(e) => setPassword(e.target.value)}
                  />
               
                </But
            ) : (
                
                  <Input
                    type="te
            
                    onKeyDown={
     
   

            )}
        </Car
    </Dialog>
}
































































