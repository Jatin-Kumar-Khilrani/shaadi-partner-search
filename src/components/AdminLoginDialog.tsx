import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Language } from '@/lib/translations'

}
export function AdminLoginDialog({ 

  const [generatedOtp, setGenerat

    title: language =
    password: language === '
    login: language 
 

  }
  const handleClose = () => {
    setUsername('')
    setOtp('')
    setStep('credentials')


    if (usern
      setGeneratedOtp(otp)
      
        description: `OTP: ${otp}`,
      })
      toast.error(t.invalidCredentials)
  }
  const handleOtpSubmit = (e: React.FormEvent) => {
    
      onLoginSuccess()
    } else {
   

    <Dialog open={open} onOpe
        <Dial
        </DialogHea
        {step === '
            <d
              <Input
                type="text
   


              <Label h
    
                value={password}
                required
            </div>
            <div cla
      
              <Button type="subm
              </Button>
          </form>
        
            
                id="admin-otp"
     
   

            </div>
            <div class
    
              <Button type="sub
              </Button
          </form>
      </Dial
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
