import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ADMIN_PASSWORD = '1234'

  open: boolean

const ADMIN_USERNAME = 'rkkhilrani'
const ADMIN_PASSWORD = '1234'
const ADMIN_PHONE_NUMBERS = ['+91-7895601505', '+91-9828585300']

interface AdminLoginDialogProps {
  open: boolean
  onClose: () => void
  onLoginSuccess: () => void
  language: Language
 

  }
  const handleCredentialsSubmit = () => {
      const otp = Math.floor(100000 + Math.ran
      setStep('otp')
        t.otpSentSuccess,
          description: `${language === 'hi' ? 'कंसोल म

    } else {
    }

    if (otp === generatedOtp) {
      handleClose()
      toast.error(t.invalidOtp)
  }
  const handleClose = () => {
    setUsername('')
    setOtp('')
    onClose()

    <Dialog open={open} onOpenChange={handleClose}>
   

        <Card>
            {step === 'credentials' ? (
                <p className="text-sm text-muted-foreground mb-4">{t.sub
                  <Label h
                    
                    
                  />
         
                  <Input
         
       
                  />
            
                </Button>
     
   

                      <li key={in
                  </ul>
                <div c
                  <
            
                    onKeyDown={
     
   

            )}
        </Card>
    </Dialog>
}
    setOtp('')
    setGeneratedOtp('')
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
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">{t.subtitle}</p>
                <div className="space-y-2">
                  <Label htmlFor="admin-username">{t.username}</Label>
                  <Input
                    id="admin-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCredentialsSubmit()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">{t.password}</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCredentialsSubmit()}
                  />
                </div>
                <Button onClick={handleCredentialsSubmit} className="w-full">
                  {t.continue}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t.otpSent}</p>
                  <ul className="text-sm font-medium space-y-1">
                    {ADMIN_PHONE_NUMBERS.map((phone, index) => (
                      <li key={index}>{phone}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-otp">{t.otpLabel}</Label>
                  <Input
                    id="admin-otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleOtpSubmit()}
                    maxLength={6}
                  />
                </div>
                <Button onClick={handleOtpSubmit} className="w-full">
                  {t.verify}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
