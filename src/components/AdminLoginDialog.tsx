import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/componen
import { Select, SelectContent, SelectItem, Sel
import { toast } from 'sonner'

const ADMIN_PASSWORD = '1234'

import { toast } from 'sonner'
import type { Language } from '@/lib/translations'

const ADMIN_USERNAME = 'rkkhilrani'
const ADMIN_PASSWORD = '1234'
const ADMIN_PHONES = ['+91-7895601505', '+91-9828585300']

interface AdminLoginDialogProps {
  const [userna
  onClose: () => void
  const [otp, setOtp] = useS
  language: Language
}

export function AdminLoginDialog({ open, onClose, onLoginSuccess, language }: AdminLoginDialogProps) {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
    otpSentTo: language === 'hi' ? 'OTP भेजा गया' : 'OTP
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')

    selectPho
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    subtitle: language === 'hi' ? 'सिस्टम तक पहुंचने के लिए अपनी साख दर्ज करें' : 'Enter your credentials to access the system',
    username: language === 'hi' ? 'उपयोगकर्ता नाम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    selectPhone: language === 'hi' ? 'OTP के लिए फोन नंबर चुनें' : 'Select Phone for OTP',
    selectPhoneNumber: language === 'hi' ? 'कृपया फोन नंबर चुनें' : 'Please select phone number',
    continue: language === 'hi' ? 'जारी रखें' : 'Continue',
    otpTitle: language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification',
    otpSentTo: language === 'hi' ? 'OTP भेजा गया' : 'OTP sent to',
    enterOtp: language === 'hi' ? '6 अंकों का OTP दर्ज करें' : 'Enter 6-digit OTP',
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    back: language === 'hi' ? 'वापस' : 'Back',
    resend: language === 'hi' ? 'फिर से भेजें' : 'Resend OTP',
    invalidCredentials: language === 'hi' ? 'अमान्य उपयोगकर्ता नाम या पासवर्ड' : 'Invalid username or password',
    selectPhoneError: language === 'hi' ? 'कृपया OTP के लिए एक फोन नंबर चुनें' : 'Please select a phone number for OTP',
    otpSent: language === 'hi' ? 'OTP भेजा गया। कृपया अपना फोन जांचें।' : 'OTP sent. Please check your phone.',
    invalidOtp: language === 'hi' ? 'अमान्य OTP। कृपया पुनः प्रयास करें।' : 'Invalid OTP. Please try again.',
    loginSuccess: language === 'hi' ? 'लॉगिन सफल!' : 'Login successful!'
  }

  const handleCredentialsSubmit = () => {
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      toast.error(t.invalidCredentials)

    s

    if (!selectedPhone) {
      toast.error(t.selectPhoneError)
      return
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(otp)

                <Label htmlFor
                  id="admin-passw
                  pla
      
   

                <Label>{t.selectP
                  <SelectTrigge
                  </SelectTrigg
            
     

                </Select>

                {
   

            <CardContent classNam
                <Label htmlFor="admin-otp">{t.enterOtp}</Label>
                  id="ad
              
                  value={otp}
                  className="text
              </div>
      
   

                </Button>

                {t.
            </CardC
        )}
    </Dialog>
}


































































































