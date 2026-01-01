import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeSlash, ArrowRight, ArrowLeft } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Language } from '@/lib/translations'

// Fetch admin credentials from runtime.config.json (same pattern as Azure credentials)
const fetchAdminCredentials = async (): Promise<{ username: string; password: string }> => {
  // Try different paths for GitHub Pages vs local dev
  const paths = [
    './runtime.config.json',
    '/runtime.config.json',
    '/shaadi-partner-search/runtime.config.json'
  ]
  
  for (const path of paths) {
    try {
      const response = await fetch(path)
      if (response.ok) {
        const config = await response.json()
        if (config?.admin?.username && config?.admin?.password) {
          return {
            username: config.admin.username,
            password: config.admin.password
          }
        }
      }
    } catch {
      // Try next path
    }
  }
  
  // Fallback to empty (will show error on login attempt)
  return { username: '', password: '' }
}

interface AdminLoginDialogProps {
  open: boolean
  onClose: () => void
  onLoginSuccess: (keepLoggedIn: boolean) => void
  language: Language
}

export function AdminLoginDialog({
  open,
  onClose,
  onLoginSuccess,
  language
}: AdminLoginDialogProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [step, setStep] = useState<'username' | 'password' | 'otp'>('username')
  const [showPassword, setShowPassword] = useState(false)
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const [adminCredentials, setAdminCredentials] = useState<{ username: string; password: string } | null>(null)

  // Load credentials from runtime.config.json on mount (same as Azure credentials)
  useEffect(() => {
    fetchAdminCredentials().then(setAdminCredentials)
  }, [])

  const t = {
    title: language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login',
    username: language === 'hi' ? 'यूज़रनेम' : 'Username',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    login: language === 'hi' ? 'लॉगिन करें' : 'Login',
    next: language === 'hi' ? 'आगे बढ़ें' : 'Next',
    back: language === 'hi' ? 'वापस जाएं' : 'Back',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    otpTitle: language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification',
    otpLabel: language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP',
    verify: language === 'hi' ? 'सत्यापित करें' : 'Verify',
    invalidCredentials: language === 'hi' ? 'गलत यूज़रनेम या पासवर्ड' : 'Invalid username or password',
    invalidUsername: language === 'hi' ? 'गलत यूज़रनेम' : 'Invalid username',
    invalidPassword: language === 'hi' ? 'गलत पासवर्ड' : 'Invalid password',
    invalidOtp: language === 'hi' ? 'गलत OTP' : 'Invalid OTP',
    keepMeLoggedIn: language === 'hi' ? 'मुझे लॉग इन रखें' : 'Keep me logged in',
    enterUsername: language === 'hi' ? 'पहले अपना यूज़रनेम दर्ज करें' : 'Enter your username first',
    credentialsNotConfigured: language === 'hi' ? 'एडमिन क्रेडेंशियल्स कॉन्फ़िगर नहीं हैं' : 'Admin credentials not configured'
  }

  const handleClose = () => {
    setUsername('')
    setPassword('')
    setOtp('')
    setStep('username')
    setGeneratedOtp('')
    setKeepLoggedIn(false)
    onClose()
  }

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!adminCredentials?.username || !adminCredentials?.password) {
      toast.error(t.credentialsNotConfigured)
      return
    }
    
    if (username === adminCredentials.username) {
      setStep('password')
    } else {
      toast.error(t.invalidUsername)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!adminCredentials?.password) {
      toast.error(t.credentialsNotConfigured)
      return
    }
    
    if (password === adminCredentials.password) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(otp)
      setStep('otp')
      
      toast.info(language === 'hi' ? 'OTP भेजा गया' : 'OTP Sent', {
        description: `OTP: ${otp}`,
        duration: 10000
      })
    } else {
      toast.error(t.invalidPassword)
    }
  }

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (otp === generatedOtp) {
      onLoginSuccess(keepLoggedIn)
      handleClose()
    } else {
      toast.error(t.invalidOtp)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'username' && t.title}
            {step === 'password' && t.title}
            {step === 'otp' && t.otpTitle}
          </DialogTitle>
        </DialogHeader>

        {step === 'username' && (
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-username">{t.username}</Label>
              <Input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder={language === 'hi' ? 'यूज़रनेम दर्ज करें' : 'Enter username'}
              />
              <p className="text-xs text-muted-foreground">{t.enterUsername}</p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t.cancel}
              </Button>
              <Button type="submit" className="gap-1">
                {t.next}
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="px-2 py-1 bg-primary/10 rounded text-primary font-medium">{username}</span>
              </div>
              <Label htmlFor="admin-password">{t.password}</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                  placeholder={language === 'hi' ? 'पासवर्ड दर्ज करें' : 'Enter password'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="keep-logged-in"
                checked={keepLoggedIn}
                onCheckedChange={(checked) => setKeepLoggedIn(checked === true)}
              />
              <Label
                htmlFor="keep-logged-in"
                className="text-sm font-normal cursor-pointer"
              >
                {t.keepMeLoggedIn}
              </Label>
            </div>

            <div className="flex gap-2 justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep('username')} className="gap-1">
                <ArrowLeft size={16} />
                {t.back}
              </Button>
              <Button type="submit">
                {t.login}
              </Button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-otp">{t.otpLabel}</Label>
              <Input
                id="admin-otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                placeholder="000000"
                autoComplete="one-time-code"
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
