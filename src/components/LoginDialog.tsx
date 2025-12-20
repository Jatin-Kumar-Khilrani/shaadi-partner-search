import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { SignIn, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { LoginCredentials, User } from '@/types/user'

interface LoginDialogProps {
  open: boolean
  onClose: () => void
  onLogin: (userId: string, profileId: string, keepLoggedIn: boolean) => void
  users: User[]
  language: 'hi' | 'en'
}

export function LoginDialog({ open, onClose, onLogin, users, language }: LoginDialogProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    userId: '',
    password: ''
  })
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)

  const t = {
    title: language === 'hi' ? 'लॉगिन करें' : 'Login',
    subtitle: language === 'hi' ? 'अपने यूजर ID और पासवर्ड से लॉगिन करें' : 'Login with your User ID and Password',
    userId: language === 'hi' ? 'यूजर ID' : 'User ID',
    password: language === 'hi' ? 'पासवर्ड' : 'Password',
    loginButton: language === 'hi' ? 'लॉगिन करें' : 'Login',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    loginSuccess: language === 'hi' ? 'लॉगिन सफल!' : 'Login successful!',
    loginError: language === 'hi' ? 'गलत यूजर ID या पासवर्ड' : 'Invalid User ID or Password',
    fillFields: language === 'hi' ? 'कृपया सभी फील्ड भरें' : 'Please fill all fields',
    info: language === 'hi' ? 'पंजीकरण के बाद आपको यूजर ID और पासवर्ड ईमेल और SMS द्वारा भेजा जाता है।' : 'After registration, you receive User ID and Password via email and SMS.',
    keepLoggedIn: language === 'hi' ? 'मुझे लॉगिन रखें' : 'Keep me logged in'
  }

  const handleLogin = () => {
    if (!credentials.userId || !credentials.password) {
      toast.error(t.fillFields)
      return
    }

    const user = users.find(
      u => u.userId === credentials.userId && u.password === credentials.password
    )

    if (user) {
      onLogin(user.userId, user.profileId, keepLoggedIn)
      toast.success(t.loginSuccess)
      setCredentials({ userId: '', password: '' })
      setKeepLoggedIn(false)
      onClose()
    } else {
      toast.error(t.loginError)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <SignIn size={28} weight="bold" />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {t.subtitle}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info size={18} />
          <AlertDescription className="text-sm">
            {t.info}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">{t.userId}</Label>
            <Input
              id="userId"
              placeholder={t.userId}
              value={credentials.userId}
              onChange={(e) => setCredentials({ ...credentials, userId: e.target.value })}
              onKeyPress={handleKeyPress}
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t.password}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t.password}
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              onKeyPress={handleKeyPress}
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="keep-logged-in"
              checked={keepLoggedIn}
              onCheckedChange={(checked) => setKeepLoggedIn(checked === true)}
            />
            <Label 
              htmlFor="keep-logged-in" 
              className="text-sm font-normal cursor-pointer"
            >
              {t.keepLoggedIn}
            </Label>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t.cancel}
          </Button>
          <Button onClick={handleLogin} className="flex-1">
            <SignIn size={20} weight="bold" className="mr-2" />
            {t.loginButton}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
