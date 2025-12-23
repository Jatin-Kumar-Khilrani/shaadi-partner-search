import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FilePdf, Download, Eye, Lock, CheckCircle, CurrencyInr, Star } from '@phosphor-icons/react'
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

export function BiodataGenerator({ profile, language, isPaidUser, onClose, open }: BiodataGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const biodataRef = useRef<HTMLDivElement>(null)
  
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
            dark: '#b91c1c',
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
  }, [open, profile.profileId])
  
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
    name: language === 'hi' ? 'नाम' : 'Name',
    dob: language === 'hi' ? 'जन्म तिथि' : 'Date of Birth',
    age: language === 'hi' ? 'आयु' : 'Age',
    height: language === 'hi' ? 'ऊंचाई' : 'Height',
    religion: language === 'hi' ? 'धर्म' : 'Religion',
    caste: language === 'hi' ? 'जाति' : 'Caste',
    location: language === 'hi' ? 'स्थान' : 'Location',
    education: language === 'hi' ? 'शिक्षा' : 'Education',
    occupation: language === 'hi' ? 'व्यवसाय' : 'Occupation',
    email: language === 'hi' ? 'ईमेल' : 'Email',
    mobile: language === 'hi' ? 'मोबाइल' : 'Mobile',
    aboutMe: language === 'hi' ? 'मेरे बारे में' : 'About Me',
    maritalStatus: language === 'hi' ? 'वैवाहिक स्थिति' : 'Marital Status',
    diet: language === 'hi' ? 'आहार' : 'Diet',
    generating: language === 'hi' ? 'जनरेट हो रहा है...' : 'Generating...',
    close: language === 'hi' ? 'बंद करें' : 'Close',
  }

  const maritalStatusLabels: Record<string, { hi: string; en: string }> = {
    'never-married': { hi: 'अविवाहित', en: 'Never Married' },
    'divorced': { hi: 'तलाकशुदा', en: 'Divorced' },
    'widowed': { hi: 'विधवा/विधुर', en: 'Widowed' },
    'separated': { hi: 'अलग', en: 'Separated' }
  }

  const handleDownload = async () => {
    if (!isPaidUser) {
      toast.error(language === 'hi' ? 'कृपया डाउनलोड के लिए सदस्यता लें' : 'Please subscribe to download')
      return
    }
    
    setIsGenerating(true)
    
    try {
      // Create a canvas from the biodata content
      const biodataElement = biodataRef.current
      if (!biodataElement) return
      
      // Create a temporary canvas for download
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // Set canvas dimensions (A4 ratio approximately)
      canvas.width = 800
      canvas.height = 1132
      
      // Draw background
      ctx.fillStyle = '#fff8f0'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw decorative border
      ctx.strokeStyle = '#b91c1c'
      ctx.lineWidth = 4
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)
      
      // Draw inner decorative border
      ctx.strokeStyle = '#fcd34d'
      ctx.lineWidth = 2
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60)
      
      // Draw ॐ symbol at top
      ctx.font = 'bold 48px Arial'
      ctx.fillStyle = '#b91c1c'
      ctx.textAlign = 'center'
      ctx.fillText('ॐ', canvas.width / 2, 80)
      
      // Draw title
      ctx.font = 'bold 32px Arial'
      ctx.fillStyle = '#1a1a1a'
      ctx.fillText(language === 'hi' ? 'बायोडाटा' : 'BIODATA', canvas.width / 2, 130)
      
      // Draw profile photo placeholder or actual photo
      const photoSize = 150
      const photoX = canvas.width / 2 - photoSize / 2
      const photoY = 160
      
      if (profile.photos && profile.photos.length > 0) {
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = profile.photos![0]
          })
          
          // Draw circular clipping path
          ctx.save()
          ctx.beginPath()
          ctx.arc(canvas.width / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2)
          ctx.closePath()
          ctx.clip()
          
          ctx.drawImage(img, photoX, photoY, photoSize, photoSize)
          ctx.restore()
          
          // Draw border around photo
          ctx.strokeStyle = '#b91c1c'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(canvas.width / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2)
          ctx.stroke()
        } catch {
          // Draw placeholder if image fails
          ctx.fillStyle = '#f3f4f6'
          ctx.beginPath()
          ctx.arc(canvas.width / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#b91c1c'
          ctx.lineWidth = 3
          ctx.stroke()
        }
      }
      
      // Draw profile info
      let yPos = 350
      const leftMargin = 60
      const rightColumn = 420
      const lineHeight = 28
      
      ctx.font = 'bold 18px Arial'
      ctx.fillStyle = '#b91c1c'
      ctx.textAlign = 'left'
      ctx.fillText(t.personalInfo, leftMargin, yPos)
      yPos += lineHeight + 5
      
      ctx.font = '16px Arial'
      ctx.fillStyle = '#1a1a1a'
      
      const drawField = (label: string, value: string, x: number) => {
        ctx.font = 'bold 14px Arial'
        ctx.fillStyle = '#666'
        ctx.fillText(label + ':', x, yPos)
        ctx.font = '14px Arial'
        ctx.fillStyle = '#1a1a1a'
        ctx.fillText(value || '-', x + 100, yPos)
      }
      
      drawField(t.name, profile.fullName, leftMargin)
      drawField(t.age, `${profile.age} ${language === 'hi' ? 'वर्ष' : 'years'}`, rightColumn)
      yPos += lineHeight
      
      drawField(t.dob, profile.dateOfBirth ? formatDateDDMMYYYY(profile.dateOfBirth) : '-', leftMargin)
      drawField(t.height, profile.height || '-', rightColumn)
      yPos += lineHeight
      
      drawField(t.religion, profile.religion || '-', leftMargin)
      drawField(t.caste, profile.caste || '-', rightColumn)
      yPos += lineHeight
      
      const maritalLabel = maritalStatusLabels[profile.maritalStatus]
      drawField(t.maritalStatus, maritalLabel ? maritalLabel[language] : profile.maritalStatus, leftMargin)
      drawField(t.location, profile.location || '-', rightColumn)
      yPos += lineHeight * 2
      
      // Education & Career section
      ctx.font = 'bold 18px Arial'
      ctx.fillStyle = '#b91c1c'
      ctx.fillText(t.educationCareer, leftMargin, yPos)
      yPos += lineHeight + 5
      
      drawField(t.education, profile.education, leftMargin)
      yPos += lineHeight
      drawField(t.occupation, profile.occupation, leftMargin)
      yPos += lineHeight * 2
      
      // Family info section
      ctx.font = 'bold 18px Arial'
      ctx.fillStyle = '#b91c1c'
      ctx.fillText(t.familyInfo, leftMargin, yPos)
      yPos += lineHeight + 5
      
      ctx.font = '14px Arial'
      ctx.fillStyle = '#1a1a1a'
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
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, leftMargin, yPos)
      yPos += lineHeight * 2
      
      // About Me section
      if (profile.bio) {
        ctx.font = 'bold 18px Arial'
        ctx.fillStyle = '#b91c1c'
        ctx.fillText(t.aboutMe, leftMargin, yPos)
        yPos += lineHeight + 5
        
        ctx.font = '14px Arial'
        ctx.fillStyle = '#1a1a1a'
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
        yPos += lineHeight * 2
      }
      
      // Contact info section
      ctx.font = 'bold 18px Arial'
      ctx.fillStyle = '#b91c1c'
      ctx.fillText(t.contactInfo, leftMargin, canvas.height - 100)
      
      ctx.font = '14px Arial'
      ctx.fillStyle = '#1a1a1a'
      ctx.fillText(`${t.email}: ${profile.email}`, leftMargin, canvas.height - 120)
      ctx.fillText(`${t.mobile}: ${profile.mobile}`, leftMargin, canvas.height - 95)
      
      // Draw QR code on the right side
      if (qrCodeDataUrl) {
        try {
          const qrImg = new Image()
          await new Promise((resolve, reject) => {
            qrImg.onload = resolve
            qrImg.onerror = reject
            qrImg.src = qrCodeDataUrl
          })
          const qrSize = 80
          const qrX = canvas.width - qrSize - 50
          const qrY = canvas.height - 130
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
          
          // Add "Scan to view profile" text
          ctx.font = '10px Arial'
          ctx.fillStyle = '#666'
          ctx.textAlign = 'center'
          ctx.fillText(language === 'hi' ? 'स्कैन करें' : 'Scan to view', qrX + qrSize / 2, qrY + qrSize + 12)
        } catch {
          // QR code failed to load
        }
      }
      
      // Draw ShaadiPartnerSearch branding watermark (subtle, in corner)
      ctx.save()
      ctx.globalAlpha = 0.15
      ctx.font = 'bold 60px Arial'
      ctx.fillStyle = '#b91c1c'
      ctx.textAlign = 'center'
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(-Math.PI / 6) // -30 degrees
      ctx.fillText('ShaadiPartnerSearch', 0, 0)
      ctx.restore()
      
      // Draw footer with branding
      ctx.font = 'bold 14px Arial'
      ctx.fillStyle = '#b91c1c'
      ctx.textAlign = 'center'
      ctx.fillText('ShaadiPartnerSearch.com', canvas.width / 2, canvas.height - 35)
      
      ctx.font = '11px Arial'
      ctx.fillStyle = '#666'
      ctx.fillText(language === 'hi' ? 'भारत की विश्वसनीय वैवाहिक सेवा' : "India's Trusted Matrimonial Service", canvas.width / 2, canvas.height - 18)
      
      // Download the canvas as image
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
            <FilePdf size={24} weight="fill" className="text-red-600" />
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
          
          {/* Biodata Preview */}
          <div 
            ref={biodataRef}
            className="relative bg-[#fff8f0] border-4 border-red-700 rounded-lg p-6 mx-auto max-w-2xl"
            style={{ minHeight: '800px' }}
          >
            {/* Watermark for non-paid users */}
            {!isPaidUser && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="rotate-[-30deg] text-4xl font-bold text-red-300 opacity-40 select-none whitespace-nowrap">
                  ShaadiPartnerSearch.com
                </div>
              </div>
            )}
            
            {/* Subtle branding watermark for all users */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-5">
              <div className="rotate-[-30deg] text-3xl font-bold text-red-100 opacity-20 select-none whitespace-nowrap">
                ShaadiPartnerSearch
              </div>
            </div>
            
            {/* Inner decorative border */}
            <div className="border-2 border-amber-400 rounded p-4">
              {/* Om Symbol */}
              <div className="text-center mb-4">
                <span className="text-5xl text-red-700 font-bold">ॐ</span>
              </div>
              
              {/* Title */}
              <h2 className="text-center text-3xl font-bold text-gray-900 mb-6">
                {language === 'hi' ? 'बायोडाटा' : 'BIODATA'}
              </h2>
              
              {/* Photo */}
              <div className="flex justify-center mb-6">
                {profile.photos && profile.photos.length > 0 ? (
                  <div className="w-32 h-32 rounded-full border-4 border-red-700 overflow-hidden">
                    <img 
                      src={profile.photos[0]} 
                      alt={profile.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-red-700 bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
                    {profile.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>
              
              {/* Personal Info */}
              <Card className="mb-4 border-red-200">
                <CardHeader className="py-2 bg-red-50">
                  <CardTitle className="text-lg text-red-700">{t.personalInfo}</CardTitle>
                </CardHeader>
                <CardContent className="py-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="font-semibold">{t.name}:</span> {profile.fullName}</div>
                    <div><span className="font-semibold">{t.age}:</span> {profile.age} {language === 'hi' ? 'वर्ष' : 'years'}</div>
                    <div><span className="font-semibold">{t.dob}:</span> {profile.dateOfBirth ? formatDateDDMMYYYY(profile.dateOfBirth) : '-'}</div>
                    <div><span className="font-semibold">{t.height}:</span> {profile.height || '-'}</div>
                    <div><span className="font-semibold">{t.religion}:</span> {profile.religion || '-'}</div>
                    <div><span className="font-semibold">{t.caste}:</span> {profile.caste || '-'}</div>
                    <div><span className="font-semibold">{t.maritalStatus}:</span> {maritalStatusLabels[profile.maritalStatus]?.[language] || profile.maritalStatus}</div>
                    <div><span className="font-semibold">{t.location}:</span> {profile.location}</div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Education & Career */}
              <Card className="mb-4 border-red-200">
                <CardHeader className="py-2 bg-red-50">
                  <CardTitle className="text-lg text-red-700">{t.educationCareer}</CardTitle>
                </CardHeader>
                <CardContent className="py-3">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div><span className="font-semibold">{t.education}:</span> {profile.education}</div>
                    <div><span className="font-semibold">{t.occupation}:</span> {profile.occupation}</div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Family Info */}
              <Card className="mb-4 border-red-200">
                <CardHeader className="py-2 bg-red-50">
                  <CardTitle className="text-lg text-red-700">{t.familyInfo}</CardTitle>
                </CardHeader>
                <CardContent className="py-3">
                  <p className="text-sm">
                    {profile.familyDetails || (language === 'hi' ? 'परिवार का विवरण उपलब्ध नहीं' : 'Family details not available')}
                  </p>
                </CardContent>
              </Card>
              
              {/* About Me */}
              {profile.bio && (
                <Card className="mb-4 border-red-200">
                  <CardHeader className="py-2 bg-red-50">
                    <CardTitle className="text-lg text-red-700">{t.aboutMe}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <p className="text-sm">{profile.bio}</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Contact Info with QR Code */}
              <Card className="border-red-200">
                <CardHeader className="py-2 bg-red-50">
                  <CardTitle className="text-lg text-red-700">{t.contactInfo}</CardTitle>
                </CardHeader>
                <CardContent className="py-3">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div><span className="font-semibold">{t.email}:</span> {profile.email}</div>
                      <div><span className="font-semibold">{t.mobile}:</span> {profile.mobile}</div>
                    </div>
                    {/* QR Code */}
                    {qrCodeDataUrl && (
                      <div className="flex flex-col items-center">
                        <img src={qrCodeDataUrl} alt="Profile QR Code" className="w-20 h-20" />
                        <span className="text-[10px] text-gray-500 mt-1">
                          {language === 'hi' ? 'प्रोफाइल देखें' : 'View Profile'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Footer with Branding */}
              <div className="mt-6 pt-4 border-t border-red-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">💒</span>
                  <span className="font-bold text-lg text-red-700">ShaadiPartnerSearch.com</span>
                </div>
                <p className="text-center text-xs text-gray-500">
                  {language === 'hi' ? 'भारत की विश्वसनीय वैवाहिक सेवा' : "India's Trusted Matrimonial Service"}
                </p>
                <p className="text-center text-[10px] text-gray-400 mt-1">
                  {language === 'hi' ? 'इस बायोडाटा में QR कोड स्कैन करके प्रोफ़ाइल देखें' : 'Scan QR code to view profile on ShaadiPartnerSearch'}
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
            className="gap-2 bg-red-600 hover:bg-red-700"
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
