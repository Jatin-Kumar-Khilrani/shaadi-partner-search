import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FilePdf, Download, Eye, Lock, CheckCircle, CurrencyInr, Star, Heart, Flower, Sun } from '@phosphor-icons/react'
import { toast } from 'sonner'
import QRCode from 'qrcode'
import type { Profile } from '@/types/profile'
import { formatDateDDMMYYYY } from '@/lib/utils'

interface BiodataGeneratorProps {
  profile: Profile
  language: 'hi' | 'en'
  isPaidUser: boolean
  onClose: () => void
  open: boolean
}

// Gender-specific color themes
const getGenderTheme = (gender: 'male' | 'female') => {
  if (gender === 'female') {
    return {
      primary: '#be185d', // Pink-700
      secondary: '#fce7f3', // Pink-100
      accent: '#f9a8d4', // Pink-300
      border: '#ec4899', // Pink-500
      gradient1: '#fdf2f8', // Pink-50
      gradient2: '#fbcfe8', // Pink-200
      headerBg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
      cardBg: '#fff1f2',
      symbol: '🌸', // Lotus flower for female
      symbolColor: '#ec4899',
      omColor: '#be185d',
      watermarkColor: '#f472b6',
      decorativePattern: 'radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(244, 114, 182, 0.1) 0%, transparent 50%)',
    }
  }
  return {
    primary: '#1e40af', // Blue-800
    secondary: '#dbeafe', // Blue-100
    accent: '#93c5fd', // Blue-300
    border: '#3b82f6', // Blue-500
    gradient1: '#eff6ff', // Blue-50
    gradient2: '#bfdbfe', // Blue-200
    headerBg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    cardBg: '#f0f9ff',
    symbol: '🪷', // Lotus for male
    symbolColor: '#3b82f6',
    omColor: '#1e40af',
    watermarkColor: '#60a5fa',
    decorativePattern: 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(147, 197, 253, 0.1) 0%, transparent 50%)',
  }
}

export function BiodataGenerator({ profile, language, isPaidUser, onClose, open }: BiodataGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const biodataRef = useRef<HTMLDivElement>(null)
  
  // Get gender-specific theme
  const theme = getGenderTheme(profile.gender)
  
  // Generate QR code on mount or when profile changes
  useEffect(() => {
    const generateQR = async () => {
      try {
        // Use production URL for the profile link
        const profileUrl = `https://shaadipartnersearch.com/profile/${profile.profileId}`
        const qrDataUrl = await QRCode.toDataURL(profileUrl, {
          width: 100,
          margin: 1,
          color: {
            dark: theme.primary,
            light: '#ffffff'
          }
        })
        setQrCodeDataUrl(qrDataUrl)
      } catch (error) {
        console.error('Failed to generate QR code:', error)
      }
    }
    
    if (open && profile.profileId) {
      generateQR()
    }
  }, [open, profile.profileId, theme.primary])
  
  const t = {
    title: language === 'hi' ? 'बायोडाटा जनरेटर' : 'Biodata Generator',
    description: language === 'hi' ? 'अपना विवाह बायोडाटा बनाएं और डाउनलोड करें' : 'Create and download your marriage biodata',
    preview: language === 'hi' ? 'पूर्वावलोकन' : 'Preview',
    download: language === 'hi' ? 'डाउनलोड करें' : 'Download',
    premiumFeature: language === 'hi' ? 'प्रीमियम सुविधा' : 'Premium Feature',
    upgradeToDownload: language === 'hi' ? 'डाउनलोड करने के लिए सदस्यता लें' : 'Subscribe to download',
    watermarkNotice: language === 'hi' ? 'पूर्वावलोकन में वॉटरमार्क है। भुगतान उपयोगकर्ता बिना वॉटरमार्क के डाउनलोड कर सकते हैं।' : 'Preview has watermark. Paid users can download without watermark.',
    freeForRegistered: language === 'hi' ? 'पंजीकृत उपयोगकर्ताओं के लिए मुफ्त!' : 'Free for registered users!',
    personalInfo: language === 'hi' ? 'व्यक्तिगत जानकारी' : 'Personal Information',
    familyInfo: language === 'hi' ? 'पारिवारिक जानकारी' : 'Family Information',
    educationCareer: language === 'hi' ? 'शिक्षा और करियर' : 'Education & Career',
    contactInfo: language === 'hi' ? 'संपर्क जानकारी' : 'Contact Information',
    lifestyleInfo: language === 'hi' ? 'जीवनशैली' : 'Lifestyle',
    name: language === 'hi' ? 'नाम' : 'Name',
    dob: language === 'hi' ? 'जन्म तिथि' : 'Date of Birth',
    age: language === 'hi' ? 'आयु' : 'Age',
    height: language === 'hi' ? 'ऊंचाई' : 'Height',
    religion: language === 'hi' ? 'धर्म' : 'Religion',
    caste: language === 'hi' ? 'जाति' : 'Caste',
    community: language === 'hi' ? 'समुदाय' : 'Community',
    motherTongue: language === 'hi' ? 'मातृभाषा' : 'Mother Tongue',
    location: language === 'hi' ? 'स्थान' : 'Location',
    country: language === 'hi' ? 'देश' : 'Country',
    residentialStatus: language === 'hi' ? 'आवासीय स्थिति' : 'Residential Status',
    education: language === 'hi' ? 'शिक्षा' : 'Education',
    occupation: language === 'hi' ? 'व्यवसाय' : 'Occupation',
    salary: language === 'hi' ? 'वार्षिक आय' : 'Annual Income',
    email: language === 'hi' ? 'ईमेल' : 'Email',
    mobile: language === 'hi' ? 'मोबाइल' : 'Mobile',
    aboutMe: language === 'hi' ? 'मेरे बारे में' : 'About Me',
    maritalStatus: language === 'hi' ? 'वैवाहिक स्थिति' : 'Marital Status',
    manglik: language === 'hi' ? 'मांगलिक' : 'Manglik',
    diet: language === 'hi' ? 'आहार' : 'Diet',
    drinking: language === 'hi' ? 'शराब' : 'Drinking',
    smoking: language === 'hi' ? 'धूम्रपान' : 'Smoking',
    generating: language === 'hi' ? 'जनरेट हो रहा है...' : 'Generating...',
    close: language === 'hi' ? 'बंद करें' : 'Close',
    biodataTitle: language === 'hi' ? 'विवाह बायोडाटा' : 'Marriage Biodata',
    profileId: language === 'hi' ? 'प्रोफाइल ID' : 'Profile ID',
  }

  const maritalStatusLabels: Record<string, { hi: string; en: string }> = {
    'never-married': { hi: 'अविवाहित', en: 'Never Married' },
    'divorced': { hi: 'तलाकशुदा', en: 'Divorced' },
    'widowed': { hi: 'विधवा/विधुर', en: 'Widowed' },
    'separated': { hi: 'अलग', en: 'Separated' }
  }

  const dietLabels: Record<string, { hi: string; en: string }> = {
    'veg': { hi: 'शाकाहारी', en: 'Vegetarian' },
    'non-veg': { hi: 'मांसाहारी', en: 'Non-Vegetarian' },
    'eggetarian': { hi: 'अंडाहारी', en: 'Eggetarian' },
  }

  const habitLabels: Record<string, { hi: string; en: string }> = {
    'never': { hi: 'कभी नहीं', en: 'Never' },
    'occasionally': { hi: 'कभी-कभी', en: 'Occasionally' },
    'regularly': { hi: 'नियमित', en: 'Regularly' },
  }

  const getManglikLabel = (manglik: boolean | undefined) => {
    if (manglik === undefined) return '-'
    return manglik ? (language === 'hi' ? 'हां' : 'Yes') : (language === 'hi' ? 'नहीं' : 'No')
  }

  const handleDownload = async () => {
    if (!isPaidUser) {
      toast.error(language === 'hi' ? 'कृपया डाउनलोड के लिए सदस्यता लें' : 'Please subscribe to download')
      return
    }
    
    setIsGenerating(true)
    
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // Set canvas dimensions (A4 ratio)
      canvas.width = 800
      canvas.height = 1132
      
      // Draw gradient background based on gender
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, theme.gradient1)
      gradient.addColorStop(1, theme.gradient2)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw decorative corner patterns (paisley-like)
      ctx.save()
      ctx.globalAlpha = 0.1
      ctx.fillStyle = theme.primary
      // Top-left corner decoration
      ctx.beginPath()
      ctx.arc(0, 0, 150, 0, Math.PI / 2)
      ctx.fill()
      // Bottom-right corner decoration
      ctx.beginPath()
      ctx.arc(canvas.width, canvas.height, 150, Math.PI, Math.PI * 1.5)
      ctx.fill()
      ctx.restore()
      
      // Draw outer decorative border
      ctx.strokeStyle = theme.primary
      ctx.lineWidth = 6
      ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30)
      
      // Draw inner golden border
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 2
      ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50)
      
      // Draw ॐ symbol or flower at top
      ctx.font = 'bold 48px Arial'
      ctx.fillStyle = theme.omColor
      ctx.textAlign = 'center'
      ctx.fillText(profile.gender === 'female' ? '॥ श्री ॥' : 'ॐ', canvas.width / 2, 65)
      
      // Draw decorative elements around title
      ctx.font = '24px Arial'
      ctx.fillText('✿', canvas.width / 2 - 120, 100)
      ctx.fillText('✿', canvas.width / 2 + 120, 100)
      
      // Draw title with decorative style
      ctx.font = 'bold 28px Georgia'
      ctx.fillStyle = theme.primary
      ctx.fillText(t.biodataTitle, canvas.width / 2, 105)
      
      // Draw profile photo
      const photoSize = 130
      const photoX = canvas.width / 2 - photoSize / 2
      const photoY = 130
      
      // Draw decorative frame around photo
      ctx.strokeStyle = theme.primary
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(canvas.width / 2, photoY + photoSize / 2, photoSize / 2 + 8, 0, Math.PI * 2)
      ctx.stroke()
      
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(canvas.width / 2, photoY + photoSize / 2, photoSize / 2 + 12, 0, Math.PI * 2)
      ctx.stroke()
      
      if (profile.photos && profile.photos.length > 0) {
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = profile.photos![0]
          })
          
          ctx.save()
          ctx.beginPath()
          ctx.arc(canvas.width / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2)
          ctx.closePath()
          ctx.clip()
          ctx.drawImage(img, photoX, photoY, photoSize, photoSize)
          ctx.restore()
        } catch {
          ctx.fillStyle = theme.secondary
          ctx.beginPath()
          ctx.arc(canvas.width / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2)
          ctx.fill()
          
          // Draw initials
          ctx.font = 'bold 40px Georgia'
          ctx.fillStyle = theme.primary
          ctx.textAlign = 'center'
          ctx.fillText(profile.fullName.split(' ').map(n => n[0]).join(''), canvas.width / 2, photoY + photoSize / 2 + 15)
        }
      } else {
        ctx.fillStyle = theme.secondary
        ctx.beginPath()
        ctx.arc(canvas.width / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.font = 'bold 40px Georgia'
        ctx.fillStyle = theme.primary
        ctx.textAlign = 'center'
        ctx.fillText(profile.fullName.split(' ').map(n => n[0]).join(''), canvas.width / 2, photoY + photoSize / 2 + 15)
      }
      
      // Draw name below photo
      ctx.font = 'bold 22px Georgia'
      ctx.fillStyle = theme.primary
      ctx.textAlign = 'center'
      ctx.fillText(profile.fullName, canvas.width / 2, photoY + photoSize + 30)
      
      // Draw profile ID
      ctx.font = '12px Arial'
      ctx.fillStyle = '#666'
      ctx.fillText(`${t.profileId}: ${profile.profileId}`, canvas.width / 2, photoY + photoSize + 48)
      
      // Content area
      let yPos = 330
      const leftMargin = 50
      const rightCol = 410
      const lineHeight = 22
      const sectionGap = 15
      
      const drawSectionHeader = (title: string) => {
        ctx.fillStyle = theme.primary
        ctx.fillRect(leftMargin - 10, yPos - 12, canvas.width - (leftMargin - 10) * 2, 20)
        ctx.font = 'bold 13px Arial'
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'left'
        ctx.fillText(title, leftMargin, yPos)
        yPos += lineHeight + 5
      }
      
      const drawFieldRow = (label1: string, value1: string, label2?: string, value2?: string) => {
        ctx.font = 'bold 11px Arial'
        ctx.fillStyle = '#555'
        ctx.textAlign = 'left'
        ctx.fillText(label1 + ':', leftMargin, yPos)
        ctx.font = '12px Arial'
        ctx.fillStyle = '#1a1a1a'
        ctx.fillText(value1 || '-', leftMargin + 90, yPos)
        
        if (label2 && value2 !== undefined) {
          ctx.font = 'bold 11px Arial'
          ctx.fillStyle = '#555'
          ctx.fillText(label2 + ':', rightCol, yPos)
          ctx.font = '12px Arial'
          ctx.fillStyle = '#1a1a1a'
          ctx.fillText(value2 || '-', rightCol + 90, yPos)
        }
        yPos += lineHeight
      }
      
      // Personal Information Section
      drawSectionHeader(t.personalInfo)
      const maritalLabel = maritalStatusLabels[profile.maritalStatus]?.[language] || profile.maritalStatus
      drawFieldRow(t.name, profile.fullName, t.age, `${profile.age} ${language === 'hi' ? 'वर्ष' : 'years'}`)
      drawFieldRow(t.dob, profile.dateOfBirth ? formatDateDDMMYYYY(profile.dateOfBirth) : '-', t.height, profile.height || '-')
      drawFieldRow(t.religion, profile.religion || '-', t.caste, profile.caste || '-')
      if (profile.community || profile.motherTongue) {
        drawFieldRow(t.community, profile.community || '-', t.motherTongue, profile.motherTongue || '-')
      }
      drawFieldRow(t.maritalStatus, maritalLabel, t.manglik, getManglikLabel(profile.manglik))
      drawFieldRow(t.location, `${profile.location}${profile.state ? ', ' + profile.state : ''}`, t.country, profile.country || 'India')
      yPos += sectionGap
      
      // Education & Career Section
      drawSectionHeader(t.educationCareer)
      drawFieldRow(t.education, profile.education, t.occupation, profile.occupation)
      if (profile.salary) {
        drawFieldRow(t.salary, profile.salary)
      }
      yPos += sectionGap
      
      // Lifestyle Section
      drawSectionHeader(t.lifestyleInfo)
      const dietLabel = profile.dietPreference ? (dietLabels[profile.dietPreference]?.[language] || profile.dietPreference) : '-'
      const drinkLabel = profile.drinkingHabit ? (habitLabels[profile.drinkingHabit]?.[language] || profile.drinkingHabit) : '-'
      const smokeLabel = profile.smokingHabit ? (habitLabels[profile.smokingHabit]?.[language] || profile.smokingHabit) : '-'
      drawFieldRow(t.diet, dietLabel, t.drinking, drinkLabel)
      drawFieldRow(t.smoking, smokeLabel)
      yPos += sectionGap
      
      // Family Information Section
      drawSectionHeader(t.familyInfo)
      ctx.font = '12px Arial'
      ctx.fillStyle = '#1a1a1a'
      ctx.textAlign = 'left'
      const familyText = profile.familyDetails || (language === 'hi' ? 'परिवार का विवरण उपलब्ध नहीं' : 'Family details not available')
      const maxWidth = canvas.width - leftMargin * 2
      const words = familyText.split(' ')
      let line = ''
      for (const word of words) {
        const testLine = line + word + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line, leftMargin, yPos)
          line = word + ' '
          yPos += lineHeight
          if (yPos > canvas.height - 180) break
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, leftMargin, yPos)
      yPos += sectionGap + 10
      
      // About Me Section (if space permits)
      if (profile.bio && yPos < canvas.height - 200) {
        drawSectionHeader(t.aboutMe)
        const bioWords = profile.bio.split(' ')
        line = ''
        for (const word of bioWords) {
          const testLine = line + word + ' '
          const metrics = ctx.measureText(testLine)
          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, leftMargin, yPos)
            line = word + ' '
            yPos += lineHeight
            if (yPos > canvas.height - 150) break
          } else {
            line = testLine
          }
        }
        ctx.fillText(line, leftMargin, yPos)
      }
      
      // Contact Section at bottom
      const contactY = canvas.height - 100
      ctx.fillStyle = theme.primary
      ctx.fillRect(leftMargin - 10, contactY - 12, 250, 20)
      ctx.font = 'bold 13px Arial'
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'left'
      ctx.fillText(t.contactInfo, leftMargin, contactY)
      
      ctx.font = '12px Arial'
      ctx.fillStyle = '#1a1a1a'
      ctx.fillText(`${t.email}: ${profile.email}`, leftMargin, contactY + 20)
      ctx.fillText(`${t.mobile}: ${profile.mobile}`, leftMargin, contactY + 38)
      
      // QR Code
      if (qrCodeDataUrl) {
        try {
          const qrImg = new Image()
          await new Promise((resolve, reject) => {
            qrImg.onload = resolve
            qrImg.onerror = reject
            qrImg.src = qrCodeDataUrl
          })
          const qrSize = 70
          const qrX = canvas.width - qrSize - 50
          const qrY = contactY - 10
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
          
          ctx.font = '9px Arial'
          ctx.fillStyle = '#666'
          ctx.textAlign = 'center'
          ctx.fillText(language === 'hi' ? 'प्रोफाइल देखें' : 'View Profile', qrX + qrSize / 2, qrY + qrSize + 10)
        } catch {
          // QR code failed
        }
      }
      
      // Watermark
      ctx.save()
      ctx.globalAlpha = 0.08
      ctx.font = 'bold 50px Arial'
      ctx.fillStyle = theme.watermarkColor
      ctx.textAlign = 'center'
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(-Math.PI / 6)
      ctx.fillText('ShaadiPartnerSearch', 0, 0)
      ctx.restore()
      
      // Footer branding
      ctx.font = 'bold 12px Arial'
      ctx.fillStyle = theme.primary
      ctx.textAlign = 'center'
      ctx.fillText('💒 ShaadiPartnerSearch.com', canvas.width / 2, canvas.height - 30)
      
      ctx.font = '10px Arial'
      ctx.fillStyle = '#666'
      ctx.fillText(language === 'hi' ? 'भारत की विश्वसनीय वैवाहिक सेवा' : "India's Trusted Matrimonial Service", canvas.width / 2, canvas.height - 15)
      
      // Download
      const link = document.createElement('a')
      link.download = `${profile.fullName.replace(/\s+/g, '_')}_Biodata.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      
      toast.success(language === 'hi' ? 'बायोडाटा डाउनलोड हो गया!' : 'Biodata downloaded!')
    } catch (error) {
      toast.error(language === 'hi' ? 'डाउनलोड विफल' : 'Download failed')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePdf size={24} weight="fill" style={{ color: theme.primary }} />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh]">
          {/* Preview Notice */}
          {!isPaidUser && (
            <Alert className="mb-4 bg-amber-50 border-amber-300">
              <Lock size={18} className="text-amber-600" />
              <AlertDescription className="flex items-center justify-between">
                <span>{t.watermarkNotice}</span>
                <Badge variant="outline" className="ml-2 text-amber-700 border-amber-400">
                  <CurrencyInr size={14} className="mr-1" />
                  {t.premiumFeature}
                </Badge>
              </AlertDescription>
            </Alert>
          )}
          
          {isPaidUser && (
            <Alert className="mb-4 bg-green-50 border-green-300">
              <CheckCircle size={18} className="text-green-600" />
              <AlertDescription>
                {t.freeForRegistered}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Biodata Preview - Gender-specific styling */}
          <div 
            ref={biodataRef}
            className="relative rounded-lg p-6 mx-auto max-w-2xl"
            style={{ 
              minHeight: '800px',
              background: `linear-gradient(135deg, ${theme.gradient1} 0%, ${theme.gradient2} 100%)`,
              border: `4px solid ${theme.primary}`,
            }}
          >
            {/* Decorative corner patterns */}
            <div 
              className="absolute top-0 left-0 w-32 h-32 rounded-br-full opacity-10"
              style={{ background: theme.primary }}
            />
            <div 
              className="absolute bottom-0 right-0 w-32 h-32 rounded-tl-full opacity-10"
              style={{ background: theme.primary }}
            />
            
            {/* Watermark for non-paid users */}
            {!isPaidUser && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div 
                  className="rotate-[-30deg] text-4xl font-bold opacity-40 select-none whitespace-nowrap"
                  style={{ color: theme.watermarkColor }}
                >
                  ShaadiPartnerSearch.com
                </div>
              </div>
            )}
            
            {/* Subtle branding watermark for all users */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-5">
              <div 
                className="rotate-[-30deg] text-3xl font-bold opacity-10 select-none whitespace-nowrap"
                style={{ color: theme.watermarkColor }}
              >
                ShaadiPartnerSearch
              </div>
            </div>
            
            {/* Inner decorative border with golden accent */}
            <div 
              className="border-2 rounded p-4 relative"
              style={{ borderColor: '#d4af37' }}
            >
              {/* Religious Symbol */}
              <div className="text-center mb-3">
                <span 
                  className="text-4xl font-bold"
                  style={{ color: theme.omColor }}
                >
                  {profile.gender === 'female' ? '॥ श्री ॥' : 'ॐ'}
                </span>
              </div>
              
              {/* Decorative flowers */}
              <div className="flex justify-center gap-4 mb-2">
                <span className="text-xl" style={{ color: theme.accent }}>✿</span>
                <span className="text-xl" style={{ color: theme.accent }}>✿</span>
                <span className="text-xl" style={{ color: theme.accent }}>✿</span>
              </div>
              
              {/* Title */}
              <h2 
                className="text-center text-2xl font-serif font-bold mb-4"
                style={{ color: theme.primary }}
              >
                {t.biodataTitle}
              </h2>
              
              {/* Photo with decorative frame */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  {/* Outer decorative ring */}
                  <div 
                    className="absolute -inset-3 rounded-full"
                    style={{ 
                      border: `3px solid ${theme.primary}`,
                      opacity: 0.3
                    }}
                  />
                  <div 
                    className="absolute -inset-1 rounded-full"
                    style={{ border: `2px solid #d4af37` }}
                  />
                  {profile.photos && profile.photos.length > 0 ? (
                    <div 
                      className="w-28 h-28 rounded-full overflow-hidden"
                      style={{ border: `3px solid ${theme.primary}` }}
                    >
                      <img 
                        src={profile.photos[0]} 
                        alt={profile.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-28 h-28 rounded-full flex items-center justify-center text-2xl font-bold"
                      style={{ 
                        border: `3px solid ${theme.primary}`,
                        background: theme.secondary,
                        color: theme.primary
                      }}
                    >
                      {profile.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Name and Profile ID */}
              <div className="text-center mb-4">
                <h3 
                  className="text-xl font-bold font-serif"
                  style={{ color: theme.primary }}
                >
                  {profile.fullName}
                </h3>
                <p className="text-xs text-gray-500">{t.profileId}: {profile.profileId}</p>
              </div>
              
              {/* Personal Info */}
              <Card 
                className="mb-3 shadow-sm"
                style={{ borderColor: theme.accent }}
              >
                <CardHeader 
                  className="py-2"
                  style={{ background: theme.secondary }}
                >
                  <CardTitle 
                    className="text-sm font-bold flex items-center gap-2"
                    style={{ color: theme.primary }}
                  >
                    <Heart size={16} weight="fill" />
                    {t.personalInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="font-semibold text-gray-600">{t.name}:</span> {profile.fullName}</div>
                    <div><span className="font-semibold text-gray-600">{t.age}:</span> {profile.age} {language === 'hi' ? 'वर्ष' : 'years'}</div>
                    <div><span className="font-semibold text-gray-600">{t.dob}:</span> {profile.dateOfBirth ? formatDateDDMMYYYY(profile.dateOfBirth) : '-'}</div>
                    <div><span className="font-semibold text-gray-600">{t.height}:</span> {profile.height || '-'}</div>
                    <div><span className="font-semibold text-gray-600">{t.religion}:</span> {profile.religion || '-'}</div>
                    <div><span className="font-semibold text-gray-600">{t.caste}:</span> {profile.caste || '-'}</div>
                    {profile.community && <div><span className="font-semibold text-gray-600">{t.community}:</span> {profile.community}</div>}
                    {profile.motherTongue && <div><span className="font-semibold text-gray-600">{t.motherTongue}:</span> {profile.motherTongue}</div>}
                    <div><span className="font-semibold text-gray-600">{t.maritalStatus}:</span> {maritalStatusLabels[profile.maritalStatus]?.[language] || profile.maritalStatus}</div>
                    <div><span className="font-semibold text-gray-600">{t.manglik}:</span> {getManglikLabel(profile.manglik)}</div>
                    <div><span className="font-semibold text-gray-600">{t.location}:</span> {profile.location}{profile.state ? `, ${profile.state}` : ''}</div>
                    <div><span className="font-semibold text-gray-600">{t.country}:</span> {profile.country || 'India'}</div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Education & Career */}
              <Card 
                className="mb-3 shadow-sm"
                style={{ borderColor: theme.accent }}
              >
                <CardHeader 
                  className="py-2"
                  style={{ background: theme.secondary }}
                >
                  <CardTitle 
                    className="text-sm font-bold flex items-center gap-2"
                    style={{ color: theme.primary }}
                  >
                    <Star size={16} weight="fill" />
                    {t.educationCareer}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="font-semibold text-gray-600">{t.education}:</span> {profile.education}</div>
                    <div><span className="font-semibold text-gray-600">{t.occupation}:</span> {profile.occupation}</div>
                    {profile.salary && <div className="col-span-2"><span className="font-semibold text-gray-600">{t.salary}:</span> {profile.salary}</div>}
                  </div>
                </CardContent>
              </Card>
              
              {/* Lifestyle */}
              <Card 
                className="mb-3 shadow-sm"
                style={{ borderColor: theme.accent }}
              >
                <CardHeader 
                  className="py-2"
                  style={{ background: theme.secondary }}
                >
                  <CardTitle 
                    className="text-sm font-bold flex items-center gap-2"
                    style={{ color: theme.primary }}
                  >
                    <Sun size={16} weight="fill" />
                    {t.lifestyleInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="font-semibold text-gray-600">{t.diet}:</span> {profile.dietPreference ? (dietLabels[profile.dietPreference]?.[language] || profile.dietPreference) : '-'}</div>
                    <div><span className="font-semibold text-gray-600">{t.drinking}:</span> {profile.drinkingHabit ? (habitLabels[profile.drinkingHabit]?.[language] || profile.drinkingHabit) : '-'}</div>
                    <div><span className="font-semibold text-gray-600">{t.smoking}:</span> {profile.smokingHabit ? (habitLabels[profile.smokingHabit]?.[language] || profile.smokingHabit) : '-'}</div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Family Info */}
              <Card 
                className="mb-3 shadow-sm"
                style={{ borderColor: theme.accent }}
              >
                <CardHeader 
                  className="py-2"
                  style={{ background: theme.secondary }}
                >
                  <CardTitle 
                    className="text-sm font-bold flex items-center gap-2"
                    style={{ color: theme.primary }}
                  >
                    <Flower size={16} weight="fill" />
                    {t.familyInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-xs">
                    {profile.familyDetails || (language === 'hi' ? 'परिवार का विवरण उपलब्ध नहीं' : 'Family details not available')}
                  </p>
                </CardContent>
              </Card>
              
              {/* About Me */}
              {profile.bio && (
                <Card 
                  className="mb-3 shadow-sm"
                  style={{ borderColor: theme.accent }}
                >
                  <CardHeader 
                    className="py-2"
                    style={{ background: theme.secondary }}
                  >
                    <CardTitle 
                      className="text-sm font-bold"
                      style={{ color: theme.primary }}
                    >
                      {t.aboutMe}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-xs">{profile.bio}</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Contact Info with QR Code */}
              <Card 
                className="shadow-sm"
                style={{ borderColor: theme.accent }}
              >
                <CardHeader 
                  className="py-2"
                  style={{ background: theme.secondary }}
                >
                  <CardTitle 
                    className="text-sm font-bold"
                    style={{ color: theme.primary }}
                  >
                    {t.contactInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      <div><span className="font-semibold text-gray-600">{t.email}:</span> {profile.email}</div>
                      <div><span className="font-semibold text-gray-600">{t.mobile}:</span> {profile.mobile}</div>
                    </div>
                    {/* QR Code */}
                    {qrCodeDataUrl && (
                      <div className="flex flex-col items-center">
                        <img src={qrCodeDataUrl} alt="Profile QR Code" className="w-16 h-16" />
                        <span className="text-[9px] text-gray-500 mt-1">
                          {language === 'hi' ? 'प्रोफाइल देखें' : 'View Profile'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Footer with Branding */}
              <div 
                className="mt-4 pt-3 border-t"
                style={{ borderColor: theme.accent }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl">{profile.gender === 'female' ? '🌸' : '💒'}</span>
                  <span 
                    className="font-bold text-base"
                    style={{ color: theme.primary }}
                  >
                    ShaadiPartnerSearch.com
                  </span>
                </div>
                <p className="text-center text-[10px] text-gray-500">
                  {language === 'hi' ? 'भारत की विश्वसनीय वैवाहिक सेवा' : "India's Trusted Matrimonial Service"}
                </p>
                <p className="text-center text-[9px] text-gray-400 mt-0.5">
                  {language === 'hi' ? 'QR कोड स्कैन करके प्रोफ़ाइल देखें' : 'Scan QR code to view profile'}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t.close}
          </Button>
          <Button 
            onClick={handleDownload}
            disabled={isGenerating || !isPaidUser}
            className="gap-2"
            style={{ 
              background: theme.primary,
              color: 'white'
            }}
          >
            {isGenerating ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Download size={18} />
            )}
            {isGenerating ? t.generating : t.download}
            {!isPaidUser && <Lock size={14} />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
