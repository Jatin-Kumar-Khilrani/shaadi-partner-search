import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Cookie, X, ShieldCheck } from '@phosphor-icons/react'
import type { Language } from '@/lib/translations'

interface CookieConsentProps {
  language: Language
  onOpenTerms?: () => void
}

const COOKIE_CONSENT_KEY = 'shaadi_cookie_consent'

export function CookieConsent({ language, onOpenTerms }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already given consent
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
      if (!consent) {
        // Small delay to prevent flash on page load
        const timer = setTimeout(() => setShowBanner(true), 500)
        return () => clearTimeout(timer)
      }
    } catch {
      // If localStorage is not available, show banner anyway
      setShowBanner(true)
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
        accepted: true,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }))
    } catch (e) {
      console.warn('Could not save cookie consent:', e)
    }
    setShowBanner(false)
  }

  const handleDecline = () => {
    // Even if declined, we need to remember that choice
    // Note: Some essential cookies/storage may still be used for basic functionality
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
        accepted: false,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }))
    } catch (e) {
      console.warn('Could not save cookie preference:', e)
    }
    setShowBanner(false)
  }

  if (!showBanner) return null

  const t = {
    title: language === 'hi' ? 'कुकीज़ और गोपनीयता' : 'Cookies & Privacy',
    message: language === 'hi' 
      ? 'हम आपके अनुभव को बेहतर बनाने के लिए कुकीज़ और लोकल स्टोरेज का उपयोग करते हैं। इसमें लॉगिन सत्र, आपकी प्राथमिकताएं और सुरक्षा सुविधाएं शामिल हैं। जारी रखकर आप हमारी गोपनीयता नीति से सहमत होते हैं।'
      : 'We use cookies and local storage to enhance your experience. This includes login sessions, your preferences, and security features. By continuing, you agree to our privacy policy.',
    essential: language === 'hi' 
      ? 'आवश्यक कुकीज़: लॉगिन, सुरक्षा'
      : 'Essential: Login, Security',
    preferences: language === 'hi'
      ? 'प्राथमिकताएं: भाषा, थीम'
      : 'Preferences: Language, Theme',
    accept: language === 'hi' ? 'मैं सहमत हूं' : 'I Agree',
    decline: language === 'hi' ? 'केवल आवश्यक' : 'Essential Only',
    learnMore: language === 'hi' ? 'और जानें' : 'Learn More',
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-safe animate-in slide-in-from-bottom-5 duration-300">
      <div className="mx-auto max-w-4xl">
        <div className="bg-background border shadow-lg rounded-lg p-4 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <Cookie size={24} weight="fill" className="text-primary flex-shrink-0" />
                <h3 className="font-semibold text-lg">{t.title}</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleDecline}
                aria-label="Close"
              >
                <X size={18} />
              </Button>
            </div>

            {/* Message */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.message}
            </p>

            {/* Cookie Types Info */}
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-2.5 py-1.5 rounded-full">
                <ShieldCheck size={14} weight="fill" />
                <span>{t.essential}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-1.5 rounded-full">
                <Cookie size={14} />
                <span>{t.preferences}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button 
                onClick={handleAccept}
                className="w-full sm:w-auto"
              >
                {t.accept}
              </Button>
              <Button 
                variant="outline"
                onClick={handleDecline}
                className="w-full sm:w-auto"
              >
                {t.decline}
              </Button>
              {onOpenTerms && (
                <Button
                  variant="link"
                  onClick={onOpenTerms}
                  className="text-sm"
                >
                  {t.learnMore}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
