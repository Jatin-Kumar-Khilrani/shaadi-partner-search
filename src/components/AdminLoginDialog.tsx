import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Language } from '@/lib/translations'

}
export function AdminLoginDia
  const [password, setPassword] = useState('')


    title: lang
    password: languag
    submit: language === 'hi
    invalidCredentia
 

    e.preventDefault()
    if (username !== ADMIN_USERNAME || passwor
      return

    setGeneratedOtp(newOtp)
    

    })

    e.preventDefault()
    if (otp !== generatedOtp) {
      return

    onLoginSuccess()
    setUsername('')
    setOtp('')
    setStep('credentials')


    setPassword('')
    setGeneratedOtp(''
  }
  return (
      <DialogContent className="sm:max-
          <D


              <form onSubmit={handleCredentialsSubmit} className="space-y
                  <Label ht
                  
    
                  />

                  <La
      
   

                </div>
                <Butto
    
            ) : (
                <div className=
            
     

                    required
                </di
             
                </B
            )}
        </Card
    </Dialog>
}








































































