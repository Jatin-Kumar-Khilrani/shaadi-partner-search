import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/butto
import type { Language } from '@/lib/translat

const ADMIN_PASSWORD = '1234'

  open: boolean

}
export function AdminLoginDia
  const [username, setUsername] = useState('')


    title: lang
    username: languag
    continue: language === '
    otpLabel: langua
 

export function AdminLoginDialog({ open, onClose, onLoginSuccess, language }: AdminLoginDialogProps) {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')

  const t = {
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    subtitle: language === 'hi' ? 'कृपया अपनी क्रेडेंशियल्स दर्ज करें' : 'Please enter your credentials',
    username: language === 'hi' ? 'उपयोगकर्ता नाम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    continue: language === 'hi' ? 'जारी रखें' : 'Continue',
    otpTitle: language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification',
    otpLabel: language === 'hi' ? '6 अंकों का OTP दर्ज करें' : 'Enter 6-digit OTP',
    otpSent: language === 'hi' ? 'OTP भेजा गया:' : 'OTP sent to:',
    onClose()

    <Dialog open={open} onOpenChange={handleClose}>
        <DialogHeader>
            {step === 'credentials' ? t.title : t.otpTitle}
   

            <CardContent className="pt-6 
                {t.subtitle}

            
     

                  placeholder={t.username}
                />

                <L
   

                  placeholder={t.
                />

            
     
    
            <CardContent classNam
                <p>{
                 
   

              <div className=
                <Input
                  t
                  o
              
                />

   

        )}
    </Dialog>
}



































































              <Button onClick={handleOtpSubmit} className="w-full">
                {t.verify}
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
