import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const ADMIN_PASSWORD = '1234'

  open: boolean

}
export function AdminLoginDia
  const [username, setUsername] = useState('')


    title: lang
    username: languag
    continue: language === '
    otpSent: languag
}

export function AdminLoginDialog({ open, onClose, onLoginSuccess, language }: AdminLoginDialogProps) {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')

  const t = {
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    subtitle: language === 'hi' ? 'कृपया अपने एडमिन क्रेडेंशियल्स दर्ज करें' : 'Please enter your admin credentials',
    username: language === 'hi' ? 'उपयोगकर्ता नाम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    continue: language === 'hi' ? 'जारी रखें' : 'Continue',
    otpTitle: language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification',
    otpSent: language === 'hi' ? 'OTP निम्नलिखित नंबरों पर भेजा गया:' : 'OTP sent to the following numbers:',
    otpLabel: language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP',
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    invalidCredentials: language === 'hi' ? 'अमान्य उपयोगकर्ता नाम या पासवर्ड' : 'Invalid username or password',
    invalidOtp: language === 'hi' ? 'अमान्य OTP' : 'Invalid OTP',
    otpSentSuccess: language === 'hi' ? 'OTP भेजा गया' : 'OTP Sent'
  c

      handleClose()
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(otp)
  const handleClose 
      
    setPassword('')
        language === 'hi' ? 'OTP भेजा गया' : 'OTP Sent',
    onClo
          description: `${language === 'hi' ? 'कंसोल में OTP देखें' : 'Check console for OTP'}: ${otp}`
        }
      )
      console.log(`Admin OTP sent to ${ADMIN_PHONE_NUMBERS.join(', ')}: ${otp}`)
    } else {
          </DialogTitle>
    }
   

              <p className="text-
    if (otp === generatedOtp) {

      handleClose()
            
      toast.error(t.invalidOtp)
     
  }

  const handleClose = () => {
                <Label htm
    setUsername('')
              <Butt
              
          </Card>
      </Dialo
  )













































































