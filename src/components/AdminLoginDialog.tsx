import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/butto
import type { Language } from '@/lib/translat
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Language } from '@/lib/translations'

}
export function AdminLoginDialog(

  language 
  const [usernam
  const [otp, setOtp] 
  const [generatedOtp, setGen
  const t = {
 

    otpTitle: language === 'hi' ? '
    veri
    invalid

    setUser
    setOtp('')
    onClose()

    e.preventDefault()
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setGeneratedOtp(otp)

        descr
      })
    username: language === 'hi' ? 'यूज़रनेम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    login: language === 'hi' ? 'लॉगिन करें' : 'Login',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    otpTitle: language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification',
    otpLabel: language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP',
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    invalidCredentials: language === 'hi' ? 'गलत यूज़रनेम या पासवर्ड' : 'Invalid username or password',
    invalidOtp: language === 'hi' ? 'गलत OTP' : 'Invalid OTP'
  }

  const handleClose = () => {
    setUsername('')
    setPassword('')
    setOtp('')
    setStep('credentials')
    onClose()
  }

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(otp)
      setStep('otp')
      
      toast.info(language === 'hi' ? 'OTP भेजा गया' : 'OTP Sent', {
        description: `OTP: ${otp}`,
        duration: 10000
      })
    } else {
                placeholder="000000"
     
   

                {t.cancel}
              <Button 
    
          </form>
      </DialogContent>
  )










































































