import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { Language } from '@/lib/translatio
const ADMIN_USERNAME = 'rkkhilrani'

  open: boolean

}
export function AdminLoginDialog(

  const [generatedOtp, setGenerat

    title: language =
    password: language === '
    login: language 
}

export function AdminLoginDialog({ open, onClose, onLoginSuccess, language }: AdminLoginDialogProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')

  const t = {
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    username: language === 'hi' ? 'उपयोगकर्ता नाम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    enterOtp: language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP',
    login: language === 'hi' ? 'लॉगिन करें' : 'Login',
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',

    e.preventDefault()
    if (otp !== generatedOtp) {
      return



    <Dialog open={o
        <DialogHead
        </Dial
        {step === 'cred
            <div className
             
   

              />

    
                id="admin-password"
                value={password}
            
     

                {t.cancel}
              <Button type=
          </form>
    
              <Label htmlFo
                id="admin-otp"
                value
      
   

            <div className="flex gap-2 justify-end"
                {t.can
    
          </form>
      </DialogContent>
  )







































































