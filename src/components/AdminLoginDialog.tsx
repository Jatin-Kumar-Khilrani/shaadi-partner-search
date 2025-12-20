import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/componen
import type { Language } from '@/lib/translatio
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import type { Language } from '@/lib/translations'
import { toast } from 'sonner'

}
export function AdminLoginDia
  const [password, setPassword] = useState('')


    title: lang
    password: languag
    otpTitle: language === '
    otpSent: languag
 

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    if (username !== ADMIN_USERNAME || passwor
      return

    setGeneratedOtp(newOtp)
    

    })

    e.preventDefault()
      toast.error(t.invalidOtp)
    }
    onLoginSuccess()
    setPassword('')
    setGeneratedOtp('')
  }
  const handleClose = () => {
    setPassword('')
   


    <Dialog open={open
        <DialogHeader>
        </DialogHeader>
        <Car
     

                  <Input
                    type="t
                  
    

                  <Label htmlFor="ad
                    i
      
   

                <Button type="submit" className="w-
                </Butt
            ) : (
                <div className=
            
     

                    
                  /

              
                  </But
                    {t.sub
   

  const handleClose = () => {
    setUsername('')
    setPassword('')
    setOtp('')
    setGeneratedOtp('')
    setStep('credentials')
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
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username">{t.username}</Label>
                  <Input
                    id="admin-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">{t.password}</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  {t.submit}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-otp">{t.otpLabel}</Label>
                  <Input
                    id="admin-otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep('credentials')} className="flex-1">
                    {t.back}
                  </Button>
                  <Button type="submit" className="flex-1">
                    {t.submit}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>

      </DialogContent>

  )

