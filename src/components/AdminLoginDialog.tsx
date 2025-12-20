import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Language } from '@/lib/translat

const ADMIN_PASSWORD = 'admin123'
interface AdminLoginDialogProps {
  onClose: () => void

const ADMIN_USERNAME = 'rkkhilrani'
const ADMIN_PASSWORD = 'admin123'

interface AdminLoginDialogProps {
  open: boolean
  onClose: () => void
  onLoginSuccess: () => void
  language: Language
}


    e.preventDefault()
    if (username !== ADMIN_USERNAME || passwor
      return

    setGeneratedOtp(newOtp)

      descrip
    })

    e.preventDefault()
    if (otp !== generatedOtp) {
      return

    handleClose()

    setUsername('')
    setOtp('')
   

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      toast.error(t.invalidCredentials)
      return
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(newOtp)
    setStep('otp')
    
    toast.info(t.otpSent, {
      description: `OTP: ${newOtp}`,
      duration: 10000
    })
  }

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (otp !== generatedOtp) {
      toast.error(t.invalidOtp)
      return
    }

    onLoginSuccess()
    handleClose()
  }

              </form>
          </CardCon
      </DialogConte
  )









































              </form>
























            )}
          </CardContent>

      </DialogContent>

  )

