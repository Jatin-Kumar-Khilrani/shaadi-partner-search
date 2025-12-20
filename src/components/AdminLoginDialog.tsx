import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Language } from '@/lib/translations'

}
export function AdminLoginDialog(

  const [generatedOtp, setGenerat

    title: language =
    password: language === '
    login: language 
 

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

    onClose()
    setPassword('')
    setGeneratedOtp('')
  }
  c

    setOtp('')
    setStep('credentia

    <Dialog open={open} onOpenChange={handleClose}>
        <DialogHeader>
        </Di
     

              <Input
                type="te
                on
    
            
              <Label htmlFor="adm
                id="a
      
   

            <div className="flex gap-2 justify-end"
                {t.can
    
              </Button>
          </form>
          <f
     

                valu
             
                req
            </div>
            <d
                {t.canc
              <Button type
   

      </DialogContent>
  )






















































                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t.cancel}
              </Button>
              <Button type="submit">
                {t.verify}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
