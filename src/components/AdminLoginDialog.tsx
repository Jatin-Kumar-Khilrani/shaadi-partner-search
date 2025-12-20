import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/componen
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Language } from '@/lib/translations'

  open: boolean
  onLoginSuccess: () => void
}

  const [password, setPassword] =
  const [otp, s

    title: language === 'hi'
    username: langua
 

    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    invalidOtp: language === 'hi' ? 'अमान्य OT
  }
  const handleCredentialsSubmit = () => {
      const otp = Math.floor(100000 
      setStep('otp')

        langu
          description: language === 'hi' 
            : `OTP sent to the following numbers: ${ADMIN_PHONE_NUMBERS.join(' ')} Enter 6-dig
        }

        toast.info(
          {
              ? `आपका 6-अंकीय OTP है: ${otp}`
            duration: 15000
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    invalidCredentials: language === 'hi' ? 'अमान्य यूज़रनेम या पासवर्ड' : 'Invalid username or password',
    invalidOtp: language === 'hi' ? 'अमान्य OTP' : 'Invalid OTP',
    otpSentSuccess: language === 'hi' ? 'OTP दोनों नंबरों पर भेजा गया' : 'OTP sent to both numbers'
  }

  const handleCredentialsSubmit = () => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(otp)
      setStep('otp')
      console.log(`OTP for admin login: ${otp}`)
      
      toast.success(
        language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification',
        {
          description: language === 'hi' 
            ? `OTP निम्नलिखित नंबरों पर भेजा गया: ${ADMIN_PHONE_NUMBERS.join(' ')} 6-अंकीय OTP दर्ज करें`
            : `OTP sent to the following numbers: ${ADMIN_PHONE_NUMBERS.join(' ')} Enter 6-digit OTP`,
          duration: 8000
        }
      )

      setTimeout(() => {
        toast.info(
          language === 'hi' ? 'परीक्षण के लिए OTP' : 'OTP for Testing',
          {
            description: language === 'hi' 
              ? `आपका 6-अंकीय OTP है: ${otp}`
              : `Your 6-digit OTP is: ${otp}`,
            duration: 15000
          }
        )
      }, 500)
    } else {
      toast.error(t.invalidCredentials)
     
   

                    value={userna
                    onKeyDown={
                </div>
                  <Lab
               
                 
            
                </div>
     
   

                  {language
                   
                <di
              
                    type="
                    onC
   

          
                </Button>
            )}
        </Card>
    </Dialog>
}






























































