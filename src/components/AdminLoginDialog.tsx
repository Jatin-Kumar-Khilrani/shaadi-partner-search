import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/componen
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ShieldCheck, CheckCircle } from '@phosphor-icons/react'
const ADMIN_PHONES = ['+91-789

  open: boolean
const ADMIN_PASSWORD = '1234'
const ADMIN_PHONES = ['+91-7895601505', '+91-9828585300']

export function AdminLoginDialog(
  open: boolean
    username: languag
    selectPhone: language ==
    otpSentTo: language
 

    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    selectPhoneNumber: language === 'hi' ? 'कृपया फोन नंबर चुनें' : 'Please select
  }
  const handleCredentialsSubmit = () => {
      toast.error(t.invalidCredentials)
    }
  }

      toast.e
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    setStep('otp')
    toast.success(t.otpSent, {
      duration: 10000
  }
  const handleOtpSubmit = () => {
      toast.error(t.invalidOtp)
    }
    toast.success(t.loginSuccess)
    handleClose()

    const otp = Math.floor(100000 + Math.random() * 900000)
    setOtp('')
    toast.success(t.otpSent, {
      duration: 10000
  }

    setUsername('')
    setSelectedPhone('')
    setGeneratedOtp('')
  }
  ret
      <DialogContent
   

          <p className="text-sm tex

          <Card>
            
     

                  value={username}
                  autoCo
              </di
    
                  id="admin-pa
                  placeholder={t.password}
                  onC
      
   

          </Card>
          <Card>
              <div className="s
            
     
    
                      <SelectItem
                    
                 
   

                  onClick={() => 
                >
                </Button
              
    
                </Button>
            </CardContent>
        ) : (
      
   

                <Label htmlFo
                  id="admi
                  p
                  o
                />
              
                onClick
             
   

          
                    setOtp('')
                  className="flex-1"
                  {t.b
                <Button 
                  className="flex-1"
                  {t.verify}
              </
          </Card>
      </DialogContent>




















































































































