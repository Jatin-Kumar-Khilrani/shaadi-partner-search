import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Input } from '@/components/ui/input'

const ADMIN_PASSWORD = 'admin123'
interface AdminLoginDialogProp
  onClose: () => void

const ADMIN_USERNAME = 'rkkhilrani'
const ADMIN_PASSWORD = 'admin123'

interface AdminLoginDialogProps {
  open: boolean
  onClose: () => void
  onLoginSuccess: () => void
  language: Language
}

export function AdminLoginDialog({ open, onClose, onLoginSuccess, language }: AdminLoginDialogProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')

  const handl
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    username: language === 'hi' ? 'उपयोगकर्ता नाम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    enterOtp: language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP',
    login: language === 'hi' ? 'लॉगिन करें' : 'Login',
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    invalidCredentials: language === 'hi' ? 'गलत उपयोगकर्ता नाम या पासवर्ड' : 'Invalid username or password',
    invalidOtp: language === 'hi' ? 'गलत OTP' : 'Invalid OTP',
    otpSent: language === 'hi' ? 'OTP भेजा गया' : 'OTP Sent',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel'
  }

  const handleClose = () => {
    toast.info(t.ot
    setPassword('')
    })
    setGeneratedOtp('')
  const handleOtpSubmit = 
    onClose()
   

    }
    e.preventDefault()
    
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      toast.error(t.invalidCredentials)
      return
     

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(newOtp)
              <for
    
                  <Input
      description: `OTP: ${newOtp}`,
                    v
    })
   

                  <Label htmlFor="admin-password">{
    e.preventDefault()
    
    if (otp !== generatedOtp) {
                    required
      return
     

    onLoginSuccess()
    handleClose()
  }






































































