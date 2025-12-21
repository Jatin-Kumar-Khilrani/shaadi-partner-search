import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { SignIn, Info, Eye, EyeSlash, Key, ArrowLeft, SpinnerGap, ShieldCheck, LockKey } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { User } from '@/types/user'
import type { Profile } from '@/types/profile'

interface LoginDialogProps {
  open: boolean
  onClose: () => void
  onLogin: (userId: string, profileId: string, keepLoggedIn: boolean) => void
  onUpdatePassword: (userId: string, newPassword: string) => void
  users: User[]
  profiles: Profile[]
  language: 'hi' | 'en'
}

type LoginMode = 'login' | 'forgot-password' | 'reset-password' | 'first-time-reset'

export function LoginDialog({ open, onClose, onLogin, onUpdatePassword, users, profiles, language }: LoginDialogProps) {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Password reset states
  const [mode, setMode] = useState<LoginMode>('login')
  const [resetIdentifier, setResetIdentifier] = useState('') // Email or Mobile
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [enteredOtp, setEnteredOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resetUserId, setResetUserId] = useState('')
  
  // First-time login states
  const [pendingFirstTimeUser, setPendingFirstTimeUser] = useState<User | null>(null)

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
    keepLoggedIn: language === 'hi' ? 'मुझे लॉगिन रखें' : 'Keep me logged in',
    forgotPassword: language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?',
    resetPassword: language === 'hi' ? 'पासवर्ड रीसेट करें' : 'Reset Password',
    enterEmailOrMobile: language === 'hi' ? 'पंजीकृत ईमेल या मोबाइल नंबर दर्ज करें' : 'Enter registered Email or Mobile number',
    sendOtp: language === 'hi' ? 'OTP भेजें' : 'Send OTP',
    enterOtp: language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP',
    verifyOtp: language === 'hi' ? 'OTP सत्यापित करें' : 'Verify OTP',
    newPassword: language === 'hi' ? 'नया पासवर्ड' : 'New Password',
    confirmPassword: language === 'hi' ? 'पासवर्ड पुष्टि करें' : 'Confirm Password',
    setNewPassword: language === 'hi' ? 'नया पासवर्ड सेट करें' : 'Set New Password',
    back: language === 'hi' ? 'वापस' : 'Back',
    otpSentSuccess: language === 'hi' ? 'OTP भेजा गया!' : 'OTP Sent!',
    otpVerifiedSuccess: language === 'hi' ? 'OTP सत्यापित!' : 'OTP Verified!',
    passwordUpdated: language === 'hi' ? 'पासवर्ड अपडेट हो गया!' : 'Password Updated!',
    passwordMismatch: language === 'hi' ? 'पासवर्ड मेल नहीं खाते' : 'Passwords do not match',
    invalidOtp: language === 'hi' ? 'गलत OTP' : 'Invalid OTP',
    userNotFound: language === 'hi' ? 'यह ईमेल/मोबाइल पंजीकृत नहीं है' : 'This Email/Mobile is not registered',
    passwordMinLength: language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए' : 'Password must be at least 6 characters',
    firstTimeLogin: language === 'hi' ? 'पहली बार लॉगिन' : 'First Time Login',
    firstTimeLoginInfo: language === 'hi' ? 'सुरक्षा के लिए कृपया अपना पासवर्ड बदलें' : 'Please change your password for security',
    changePassword: language === 'hi' ? 'पासवर्ड बदलें' : 'Change Password'
  }

  const resetState = () => {
    setUserId('')
    setPassword('')
    setKeepLoggedIn(false)
    setShowPassword(false)
    setMode('login')
    setResetIdentifier('')
    setGeneratedOtp('')
    setEnteredOtp('')
    setOtpSent(false)
    setOtpVerified(false)
    setNewPassword('')
    setConfirmPassword('')
    setShowNewPassword(false)
    setIsLoading(false)
    setResetUserId('')
    setPendingFirstTimeUser(null)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleLogin = () => {
    if (!userId || !password) {
      toast.error(t.fillFields)
      return
    }

    const user = users.find(
      u => u.userId === userId && u.password === password
    )

    if (user) {
      // Check if first-time login (password never changed)
      if (user.firstLogin !== false && !user.passwordChangedAt) {
        // Prompt user to change password
        setPendingFirstTimeUser(user)
        setMode('first-time-reset')
        toast.info(
          language === 'hi' ? 'पहली बार लॉगिन' : 'First Time Login',
          {
            description: language === 'hi' 
              ? 'सुरक्षा के लिए कृपया अपना पासवर्ड बदलें'
              : 'Please change your password for security'
          }
        )
        return
      }
      
      onLogin(user.userId, user.profileId, keepLoggedIn)
      toast.success(t.loginSuccess)
      resetState()
    } else {
      toast.error(t.loginError)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'login') {
        handleLogin()
      } else if (mode === 'forgot-password' && !otpSent) {
        handleSendOtp()
      } else if (mode === 'forgot-password' && otpSent && !otpVerified) {
        handleVerifyOtp()
      } else if (mode === 'reset-password' || mode === 'first-time-reset') {
        handleSetNewPassword()
      }
    }
  }

  const findUserByEmailOrMobile = (identifier: string): User | null => {
    // Find profile with matching email or mobile
    const cleanIdentifier = identifier.trim().toLowerCase()
    
    for (const profile of profiles) {
      const email = profile.email?.toLowerCase()
      const mobile = profile.mobile?.replace(/\D/g, '')
      const cleanMobile = cleanIdentifier.replace(/\D/g, '')
      
      if (email === cleanIdentifier || mobile === cleanMobile || mobile?.endsWith(cleanMobile)) {
        // Find corresponding user
        const user = users.find(u => u.profileId === profile.profileId || u.profileId === profile.id)
        if (user) return user
      }
    }
    return null
  }

  const handleSendOtp = () => {
    if (!resetIdentifier.trim()) {
      toast.error(language === 'hi' ? 'कृपया ईमेल या मोबाइल नंबर दर्ज करें' : 'Please enter email or mobile number')
      return
    }

    const user = findUserByEmailOrMobile(resetIdentifier)
    if (!user) {
      toast.error(t.userNotFound)
      return
    }

    setIsLoading(true)
    
    // Simulate OTP sending
    setTimeout(() => {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(otp)
      setOtpSent(true)
      setResetUserId(user.userId)
      setIsLoading(false)
      
      toast.success(t.otpSentSuccess, {
        description: `Demo OTP: ${otp}`,
        duration: 10000
      })
    }, 1500)
  }

  const handleVerifyOtp = () => {
    if (enteredOtp !== generatedOtp) {
      toast.error(t.invalidOtp)
      return
    }

    setOtpVerified(true)
    setMode('reset-password')
    toast.success(t.otpVerifiedSuccess)
  }

  const handleSetNewPassword = () => {
    if (newPassword.length < 6) {
      toast.error(t.passwordMinLength)
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error(t.passwordMismatch)
      return
    }

    setIsLoading(true)
    
    setTimeout(() => {
      // Update password
      const targetUserId = mode === 'first-time-reset' ? pendingFirstTimeUser?.userId : resetUserId
      
      if (targetUserId) {
        onUpdatePassword(targetUserId, newPassword)
        
        toast.success(t.passwordUpdated, {
          description: language === 'hi' 
            ? 'अब आप नए पासवर्ड से लॉगिन कर सकते हैं'
            : 'You can now login with your new password'
        })
        
        // If first-time reset, also log them in
        if (mode === 'first-time-reset' && pendingFirstTimeUser) {
          onLogin(pendingFirstTimeUser.userId, pendingFirstTimeUser.profileId, keepLoggedIn)
        }
        
        resetState()
        onClose()
      }
      
      setIsLoading(false)
    }, 1000)
  }

  const handleSkipFirstTimeReset = () => {
    // Allow user to skip password change for now
    if (pendingFirstTimeUser) {
      onLogin(pendingFirstTimeUser.userId, pendingFirstTimeUser.profileId, keepLoggedIn)
      toast.success(t.loginSuccess, {
        description: language === 'hi' 
          ? 'आप बाद में सेटिंग्स से पासवर्ड बदल सकते हैं'
          : 'You can change your password later from Settings'
      })
      resetState()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {mode === 'login' && <SignIn size={28} weight="bold" />}
            {mode === 'forgot-password' && <Key size={28} weight="bold" />}
            {mode === 'reset-password' && <LockKey size={28} weight="bold" />}
            {mode === 'first-time-reset' && <ShieldCheck size={28} weight="bold" />}
            {mode === 'login' && t.title}
            {mode === 'forgot-password' && t.forgotPassword}
            {mode === 'reset-password' && t.resetPassword}
            {mode === 'first-time-reset' && t.firstTimeLogin}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login' && t.subtitle}
            {mode === 'forgot-password' && t.enterEmailOrMobile}
            {mode === 'reset-password' && t.setNewPassword}
            {mode === 'first-time-reset' && t.firstTimeLoginInfo}
          </DialogDescription>
        </DialogHeader>

        {mode === 'login' && (
          <>
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
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.password}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    autoComplete="current-password"
                    className="pr-10"
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

              <div className="flex items-center justify-between">
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
                <Button 
                  variant="link" 
                  className="text-sm p-0 h-auto text-primary"
                  onClick={() => setMode('forgot-password')}
                >
                  {t.forgotPassword}
                </Button>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                {t.cancel}
              </Button>
              <Button onClick={handleLogin} className="flex-1">
                <SignIn size={20} weight="bold" className="mr-2" />
                {t.loginButton}
              </Button>
            </div>
          </>
        )}

        {mode === 'forgot-password' && (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
              <Info size={18} className="text-blue-600" />
              <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
                {language === 'hi' 
                  ? 'अपने पंजीकृत ईमेल या मोबाइल नंबर पर OTP प्राप्त करें'
                  : 'Receive OTP on your registered email or mobile number'}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>{language === 'hi' ? 'ईमेल या मोबाइल नंबर' : 'Email or Mobile Number'}</Label>
              <Input
                placeholder={language === 'hi' ? 'example@email.com या 9876543210' : 'example@email.com or 9876543210'}
                value={resetIdentifier}
                onChange={(e) => setResetIdentifier(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={otpSent}
              />
            </div>

            {otpSent && (
              <div className="space-y-2">
                <Label>{t.enterOtp}</Label>
                <Input
                  placeholder="XXXXXX"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyPress={handleKeyPress}
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'hi' 
                    ? `OTP आपके पंजीकृत ${resetIdentifier.includes('@') ? 'ईमेल' : 'मोबाइल'} पर भेजा गया है`
                    : `OTP sent to your registered ${resetIdentifier.includes('@') ? 'email' : 'mobile'}`}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setMode('login')
                  setResetIdentifier('')
                  setOtpSent(false)
                  setEnteredOtp('')
                }} 
                className="flex-1"
              >
                <ArrowLeft size={18} className="mr-2" />
                {t.back}
              </Button>
              
              {!otpSent ? (
                <Button 
                  onClick={handleSendOtp} 
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <SpinnerGap size={18} className="mr-2 animate-spin" />
                      {language === 'hi' ? 'भेज रहा है...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Key size={18} className="mr-2" />
                      {t.sendOtp}
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleVerifyOtp} 
                  className="flex-1"
                  disabled={enteredOtp.length !== 6}
                >
                  <ShieldCheck size={18} className="mr-2" />
                  {t.verifyOtp}
                </Button>
              )}
            </div>
          </div>
        )}

        {(mode === 'reset-password' || mode === 'first-time-reset') && (
          <div className="space-y-4">
            {mode === 'first-time-reset' && (
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                <ShieldCheck size={18} className="text-amber-600" />
                <AlertDescription className="text-sm text-amber-700 dark:text-amber-300">
                  {language === 'hi' 
                    ? 'यह आपका पहला लॉगिन है। सुरक्षा के लिए कृपया अपना पासवर्ड बदलें।'
                    : 'This is your first login. Please change your password for security.'}
                </AlertDescription>
              </Alert>
            )}

            {mode === 'reset-password' && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800">
                <ShieldCheck size={18} className="text-green-600" />
                <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                  {language === 'hi' 
                    ? 'OTP सत्यापित। अब अपना नया पासवर्ड सेट करें।'
                    : 'OTP verified. Now set your new password.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>{t.newPassword}</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder={language === 'hi' ? 'कम से कम 6 अक्षर' : 'At least 6 characters'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.confirmPassword}</Label>
              <Input
                type="password"
                placeholder={t.confirmPassword}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">{t.passwordMismatch}</p>
              )}
            </div>

            <div className="flex gap-3">
              {mode === 'first-time-reset' ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleSkipFirstTimeReset} 
                    className="flex-1"
                  >
                    {language === 'hi' ? 'बाद में करें' : 'Skip for now'}
                  </Button>
                  <Button 
                    onClick={handleSetNewPassword} 
                    className="flex-1"
                    disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                  >
                    {isLoading ? (
                      <>
                        <SpinnerGap size={18} className="mr-2 animate-spin" />
                        {language === 'hi' ? 'सेट हो रहा है...' : 'Setting...'}
                      </>
                    ) : (
                      <>
                        <LockKey size={18} className="mr-2" />
                        {t.changePassword}
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setMode('forgot-password')
                      setNewPassword('')
                      setConfirmPassword('')
                    }} 
                    className="flex-1"
                  >
                    <ArrowLeft size={18} className="mr-2" />
                    {t.back}
                  </Button>
                  <Button 
                    onClick={handleSetNewPassword} 
                    className="flex-1"
                    disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                  >
                    {isLoading ? (
                      <>
                        <SpinnerGap size={18} className="mr-2 animate-spin" />
                        {language === 'hi' ? 'सेट हो रहा है...' : 'Setting...'}
                      </>
                    ) : (
                      <>
                        <LockKey size={18} className="mr-2" />
                        {t.setNewPassword}
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
