import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FilePdf, Download, Eye, Lock, CheckCircle, CurrencyInr, Star, Heart, Flower, Sun, Users } from '@phosphor-icons/react'
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

// Gender-specific color themes with universal wedding symbols
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
      symbol: '💐', // Bouquet - universal wedding symbol
      symbolColor: '#ec4899',
      titleSymbol: '💍', // Ring - universal wedding symbol
      watermarkColor: 'rgba(190, 24, 93, 0.12)',
      decorativePattern: 'radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(244, 114, 182, 0.1) 0%, transparent 50%)',
      borderGradient: 'linear-gradient(135deg, #be185d, #d4af37, #be185d)',
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
    symbol: '💐', // Bouquet - universal wedding symbol
    symbolColor: '#3b82f6',
    titleSymbol: '💍', // Ring - universal wedding symbol
    watermarkColor: 'rgba(30, 64, 175, 0.12)',
    decorativePattern: 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(147, 197, 253, 0.1) 0%, transparent 50%)',
    borderGradient: 'linear-gradient(135deg, #1e40af, #d4af37, #1e40af)',
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
    occupation: language === 'hi' ? 'रोजगार स्थिति' : 'Employment Status',
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
    weight: language === 'hi' ? 'वजन' : 'Weight',
    position: language === 'hi' ? 'पद' : 'Position',
    birthTime: language === 'hi' ? 'जन्म समय' : 'Birth Time',
    birthPlace: language === 'hi' ? 'जन्म स्थान' : 'Birth Place',
    horoscopeMatching: language === 'hi' ? 'कुंडली मिलान' : 'Horoscope Matching',
    disability: language === 'hi' ? 'विकलांगता' : 'Disability',
    relationToProfile: language === 'hi' ? 'प्रोफ़ाइल भरने वाला' : 'Profile Created By',
    horoscopeInfo: language === 'hi' ? 'कुंडली जानकारी' : 'Horoscope Information',
    partnerPreferences: language === 'hi' ? 'जीवनसाथी की पसंद' : 'Partner Preferences',
    preferredAge: language === 'hi' ? 'आयु' : 'Age',
    preferredHeight: language === 'hi' ? 'ऊंचाई' : 'Height',
    preferredEducation: language === 'hi' ? 'शिक्षा' : 'Education',
    preferredOccupation: language === 'hi' ? 'पेशा' : 'Occupation',
    preferredLocation: language === 'hi' ? 'स्थान' : 'Location',
    preferredReligion: language === 'hi' ? 'धर्म' : 'Religion',
    preferredCaste: language === 'hi' ? 'जाति' : 'Caste',
    preferredMotherTongue: language === 'hi' ? 'मातृभाषा' : 'Mother Tongue',
    preferredMaritalStatus: language === 'hi' ? 'वैवाहिक स्थिति' : 'Marital Status',
    preferredDiet: language === 'hi' ? 'आहार' : 'Diet',
    preferredManglik: language === 'hi' ? 'मांगलिक' : 'Manglik',
    preferredIncome: language === 'hi' ? 'वार्षिक आय' : 'Annual Income',
    preferredCountry: language === 'hi' ? 'देश' : 'Country',
    anyOrFlexible: language === 'hi' ? 'कोई भी / लचीला' : 'Any / Flexible',
    to: language === 'hi' ? 'से' : 'to',
    years: language === 'hi' ? 'वर्ष' : 'years',
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

  const horoscopeMatchingLabels: Record<string, { hi: string; en: string }> = {
    'mandatory': { hi: 'अनिवार्य', en: 'Mandatory' },
    'not-mandatory': { hi: 'अनिवार्य नहीं', en: 'Not Mandatory' },
    'decide-later': { hi: 'बाद में तय करेंगे', en: 'Decide Later' },
    'preferred': { hi: 'पसंदीदा', en: 'Preferred' },
  }

  const disabilityLabels: Record<string, { hi: string; en: string }> = {
    'no': { hi: 'नहीं', en: 'No' },
    'yes': { hi: 'हां', en: 'Yes' },
  }

  const residentialStatusLabels: Record<string, { hi: string; en: string }> = {
    'citizen': { hi: 'नागरिक', en: 'Citizen' },
    'permanent-resident': { hi: 'स्थायी निवासी', en: 'Permanent Resident' },
    'work-permit': { hi: 'वर्क परमिट', en: 'Work Permit' },
    'student-visa': { hi: 'स्टूडेंट वीसा', en: 'Student Visa' },
    'dependent-visa': { hi: 'डिपेंडेंट वीसा', en: 'Dependent Visa' },
    'temporary-visa': { hi: 'अस्थायी वीसा', en: 'Temporary Visa' },
    'oci': { hi: 'OCI', en: 'OCI' },
    'applied-for-pr': { hi: 'PR के लिए आवेदन', en: 'Applied for PR' },
    'applied-for-citizenship': { hi: 'नागरिकता के लिए आवेदन', en: 'Applied for Citizenship' },
    'tourist-visa': { hi: 'टूरिस्ट वीसा', en: 'Tourist Visa' },
    'other': { hi: 'अन्य', en: 'Other' },
  }

  const manglikPreferenceLabels: Record<string, { hi: string; en: string }> = {
    'yes': { hi: 'हां', en: 'Yes' },
    'no': { hi: 'नहीं', en: 'No' },
    'doesnt-matter': { hi: 'कोई फर्क नहीं', en: "Doesn't Matter" },
  }

  // Helper function to format array values
  const formatArrayValues = (arr: string[] | undefined, fallback?: string): string => {
    if (!arr || arr.length === 0) return fallback || (language === 'hi' ? 'कोई भी' : 'Any')
    return arr.join(', ')
  }

  // Helper to check if partner preferences have any meaningful data
  const hasPartnerPreferences = (): boolean => {
    const pp = profile.partnerPreferences
    if (!pp) return false
    return !!(pp.ageMin || pp.ageMax || pp.heightMin || pp.heightMax || 
              (pp.education && pp.education.length > 0) ||
              (pp.occupation && pp.occupation.length > 0) ||
              (pp.location && pp.location.length > 0) ||
              (pp.livingCountry && pp.livingCountry.length > 0) ||
              (pp.religion && pp.religion.length > 0) ||
              (pp.caste && pp.caste.length > 0) ||
              (pp.motherTongue && pp.motherTongue.length > 0) ||
              (pp.maritalStatus && pp.maritalStatus.length > 0) ||
              (pp.dietPreference && pp.dietPreference.length > 0) ||
              pp.manglik || pp.annualIncomeMin || pp.annualIncomeMax)
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
      
      // Draw elegant wedding header with rings
      ctx.font = '36px Arial'
      ctx.fillStyle = theme.primary
      ctx.textAlign = 'center'
      ctx.fillText('💍 ❤ 💍', canvas.width / 2, 60)
      
      // Draw decorative flourishes around title
      ctx.font = '20px Arial'
      ctx.fillText('✧', canvas.width / 2 - 140, 95)
      ctx.fillText('❀', canvas.width / 2 - 110, 100)
      ctx.fillText('❀', canvas.width / 2 + 110, 100)
      ctx.fillText('✧', canvas.width / 2 + 140, 95)
      
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
      if (profile.weight) {
        drawFieldRow(t.weight, profile.weight)
      }
      drawFieldRow(t.religion, profile.religion || '-', t.caste, profile.caste || '-')
      if (profile.community || profile.motherTongue) {
        drawFieldRow(t.community, profile.community || '-', t.motherTongue, profile.motherTongue || '-')
      }
      drawFieldRow(t.maritalStatus, maritalLabel, t.manglik, getManglikLabel(profile.manglik))
      drawFieldRow(t.location, `${profile.location}${profile.state ? ', ' + profile.state : ''}`, t.country, profile.country || 'India')
      if (profile.residentialStatus) {
        const residentialLabel = residentialStatusLabels[profile.residentialStatus]?.[language] || profile.residentialStatus
        drawFieldRow(t.residentialStatus, residentialLabel)
      }
      if (profile.disability === 'yes') {
        drawFieldRow(t.disability, profile.disabilityDetails || (language === 'hi' ? 'हां' : 'Yes'))
      }
      if (profile.relationToProfile) {
        drawFieldRow(t.relationToProfile, profile.relationToProfile)
      }
      yPos += sectionGap
      
      // Education & Career Section
      drawSectionHeader(t.educationCareer)
      drawFieldRow(t.education, profile.education, t.occupation, profile.occupation)
      if (profile.position) {
        drawFieldRow(t.position, profile.position)
      }
      if (profile.salary) {
        drawFieldRow(t.salary, profile.salary)
      }
      yPos += sectionGap
      
      // Horoscope Information Section (if available)
      if (profile.birthTime || profile.birthPlace || profile.horoscopeMatching) {
        drawSectionHeader(t.horoscopeInfo)
        if (profile.birthTime || profile.birthPlace) {
          drawFieldRow(t.birthTime, profile.birthTime || '-', t.birthPlace, profile.birthPlace || '-')
        }
        if (profile.horoscopeMatching) {
          const horoscopeLabel = horoscopeMatchingLabels[profile.horoscopeMatching]?.[language] || profile.horoscopeMatching
          drawFieldRow(t.horoscopeMatching, horoscopeLabel)
        }
        yPos += sectionGap
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
        yPos += sectionGap + 10
      }
      
      // Partner Preferences Section (if space permits and data exists)
      if (hasPartnerPreferences() && yPos < canvas.height - 180) {
        drawSectionHeader(t.partnerPreferences)
        const pp = profile.partnerPreferences!
        
        // Age Range
        if (pp.ageMin || pp.ageMax) {
          drawFieldRow(t.preferredAge, `${pp.ageMin || '18'} ${t.to} ${pp.ageMax || '60'} ${t.years}`)
        }
        // Height Range
        if (pp.heightMin || pp.heightMax) {
          drawFieldRow(t.preferredHeight, `${pp.heightMin || '-'} ${t.to} ${pp.heightMax || '-'}`)
        }
        // Education
        if (pp.education && pp.education.length > 0 && yPos < canvas.height - 150) {
          drawFieldRow(t.preferredEducation, formatArrayValues(pp.education))
        }
        // Religion & Caste
        if ((pp.religion && pp.religion.length > 0) || (pp.caste && pp.caste.length > 0)) {
          if (yPos < canvas.height - 150) {
            drawFieldRow(
              t.preferredReligion, 
              formatArrayValues(pp.religion), 
              t.preferredCaste, 
              formatArrayValues(pp.caste)
            )
          }
        }
        // Location
        if ((pp.location && pp.location.length > 0) || (pp.livingCountry && pp.livingCountry.length > 0)) {
          if (yPos < canvas.height - 150) {
            const locations = [...(pp.location || []), ...(pp.livingCountry || [])]
            drawFieldRow(t.preferredLocation, formatArrayValues(locations))
          }
        }
        // Marital Status & Diet
        if ((pp.maritalStatus && pp.maritalStatus.length > 0) || (pp.dietPreference && pp.dietPreference.length > 0)) {
          if (yPos < canvas.height - 150) {
            const maritalValues = pp.maritalStatus?.map(s => maritalStatusLabels[s]?.[language] || s).join(', ') || '-'
            const dietValues = pp.dietPreference?.map(d => dietLabels[d]?.[language] || d).join(', ') || '-'
            drawFieldRow(t.preferredMaritalStatus, maritalValues, t.preferredDiet, dietValues)
          }
        }
        // Manglik & Income
        if (pp.manglik || pp.annualIncomeMin || pp.annualIncomeMax) {
          if (yPos < canvas.height - 150) {
            const manglikValue = pp.manglik ? (manglikPreferenceLabels[pp.manglik]?.[language] || pp.manglik) : '-'
            const incomeValue = (pp.annualIncomeMin || pp.annualIncomeMax) ? `${pp.annualIncomeMin || '-'} ${t.to} ${pp.annualIncomeMax || '-'}` : '-'
            drawFieldRow(t.preferredManglik, manglikValue, t.preferredIncome, incomeValue)
          }
        }
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
      
      // Multiple Watermarks across the page for branding
      ctx.save()
      ctx.globalAlpha = 0.06
      ctx.font = 'bold 32px Georgia'
      ctx.fillStyle = theme.primary
      ctx.textAlign = 'center'
      
      // Top-left watermark
      ctx.save()
      ctx.translate(180, 250)
      ctx.rotate(-Math.PI / 6)
      ctx.fillText('Shaadi Partner Search', 0, 0)
      ctx.restore()
      
      // Center watermark
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(-Math.PI / 6)
      ctx.font = 'bold 40px Georgia'
      ctx.globalAlpha = 0.08
      ctx.fillText('Shaadi Partner Search', 0, 0)
      ctx.restore()
      
      // Bottom-right watermark
      ctx.save()
      ctx.translate(canvas.width - 180, canvas.height - 300)
      ctx.rotate(-Math.PI / 6)
      ctx.font = 'bold 32px Georgia'
      ctx.globalAlpha = 0.06
      ctx.fillText('Shaadi Partner Search', 0, 0)
      ctx.restore()
      
      ctx.restore()
      
      // Footer branding - Enhanced with rings
      ctx.font = 'bold 12px Georgia'
      ctx.fillStyle = theme.primary
      ctx.textAlign = 'center'
      ctx.fillText('💍 Shaadi Partner Search 💍', canvas.width / 2, canvas.height - 35)
      
      ctx.font = '10px Arial'
      ctx.fillStyle = '#666'
      ctx.fillText(language === 'hi' ? 'भारत की विश्वसनीय वैवाहिक सेवा' : "India's Trusted Matrimonial Service", canvas.width / 2, canvas.height - 20)
      
      ctx.font = '9px Arial'
      ctx.fillStyle = '#999'
      ctx.fillText('www.shaadipartnersearch.com', canvas.width / 2, canvas.height - 8)
      
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
            className="relative rounded-lg p-4 pb-0 mx-auto max-w-2xl overflow-hidden"
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
            
            {/* Prominent watermark for non-paid users */}
            {!isPaidUser && (
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                <div className="absolute top-[15%] left-[10%] rotate-[-30deg] text-2xl font-bold opacity-30 select-none whitespace-nowrap" style={{ color: theme.primary }}>
                  Shaadi Partner Search
                </div>
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] text-4xl font-bold opacity-40 select-none whitespace-nowrap" style={{ color: theme.primary }}>
                  Shaadi Partner Search
                </div>
                <div className="absolute bottom-[20%] right-[5%] rotate-[-30deg] text-2xl font-bold opacity-30 select-none whitespace-nowrap" style={{ color: theme.primary }}>
                  Shaadi Partner Search
                </div>
              </div>
            )}
            
            {/* Elegant branding watermarks for all users - appears on every page */}
            <div className="absolute inset-0 pointer-events-none z-5 overflow-hidden">
              {/* Top-left watermark */}
              <div 
                className="absolute top-[20%] left-[5%] rotate-[-30deg] text-xl font-serif font-bold select-none whitespace-nowrap"
                style={{ color: theme.watermarkColor }}
              >
                Shaadi Partner Search
              </div>
              {/* Center watermark */}
              <div 
                className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] text-3xl font-serif font-bold select-none whitespace-nowrap"
                style={{ color: theme.watermarkColor }}
              >
                Shaadi Partner Search
              </div>
              {/* Bottom-right watermark */}
              <div 
                className="absolute bottom-[25%] right-[0%] rotate-[-30deg] text-xl font-serif font-bold select-none whitespace-nowrap"
                style={{ color: theme.watermarkColor }}
              >
                Shaadi Partner Search
              </div>
            </div>
            
            {/* Inner decorative border with golden accent */}
            <div 
              className="border-2 rounded p-4 relative"
              style={{ borderColor: '#d4af37' }}
            >
              {/* Elegant Wedding Header - Universal Symbol */}
              <div className="text-center mb-2">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">💍</span>
                  <span 
                    className="text-3xl"
                    style={{ color: theme.primary }}
                  >
                    ❤
                  </span>
                  <span className="text-2xl">💍</span>
                </div>
              </div>
              
              {/* Decorative flourishes */}
              <div className="flex justify-center items-center gap-3 mb-2">
                <span className="text-lg" style={{ color: theme.accent }}>✧</span>
                <span className="text-xl" style={{ color: theme.accent }}>❀</span>
                <span className="text-sm" style={{ color: '#d4af37' }}>⋆</span>
                <span className="text-xl" style={{ color: theme.accent }}>❀</span>
                <span className="text-lg" style={{ color: theme.accent }}>✧</span>
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
                    {profile.weight && <div><span className="font-semibold text-gray-600">{t.weight}:</span> {profile.weight}</div>}
                    <div><span className="font-semibold text-gray-600">{t.religion}:</span> {profile.religion || '-'}</div>
                    <div><span className="font-semibold text-gray-600">{t.caste}:</span> {profile.caste || '-'}</div>
                    {profile.community && <div><span className="font-semibold text-gray-600">{t.community}:</span> {profile.community}</div>}
                    {profile.motherTongue && <div><span className="font-semibold text-gray-600">{t.motherTongue}:</span> {profile.motherTongue}</div>}
                    <div><span className="font-semibold text-gray-600">{t.maritalStatus}:</span> {maritalStatusLabels[profile.maritalStatus]?.[language] || profile.maritalStatus}</div>
                    <div><span className="font-semibold text-gray-600">{t.manglik}:</span> {getManglikLabel(profile.manglik)}</div>
                    <div><span className="font-semibold text-gray-600">{t.location}:</span> {profile.location}{profile.state ? `, ${profile.state}` : ''}</div>
                    <div><span className="font-semibold text-gray-600">{t.country}:</span> {profile.country || 'India'}</div>
                    {profile.residentialStatus && <div><span className="font-semibold text-gray-600">{t.residentialStatus}:</span> {residentialStatusLabels[profile.residentialStatus]?.[language] || profile.residentialStatus}</div>}
                    {profile.disability === 'yes' && <div className="col-span-2"><span className="font-semibold text-gray-600">{t.disability}:</span> {profile.disabilityDetails || (language === 'hi' ? 'हां' : 'Yes')}</div>}
                    {profile.relationToProfile && <div><span className="font-semibold text-gray-600">{t.relationToProfile}:</span> {profile.relationToProfile}</div>}
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
                    {profile.position && <div><span className="font-semibold text-gray-600">{t.position}:</span> {profile.position}</div>}
                    {profile.salary && <div><span className="font-semibold text-gray-600">{t.salary}:</span> {profile.salary}</div>}
                  </div>
                </CardContent>
              </Card>
              
              {/* Horoscope Information */}
              {(profile.birthTime || profile.birthPlace || profile.horoscopeMatching) && (
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
                      ✨ {t.horoscopeInfo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {profile.birthTime && <div><span className="font-semibold text-gray-600">{t.birthTime}:</span> {profile.birthTime}</div>}
                      {profile.birthPlace && <div><span className="font-semibold text-gray-600">{t.birthPlace}:</span> {profile.birthPlace}</div>}
                      {profile.horoscopeMatching && <div><span className="font-semibold text-gray-600">{t.horoscopeMatching}:</span> {horoscopeMatchingLabels[profile.horoscopeMatching]?.[language] || profile.horoscopeMatching}</div>}
                    </div>
                  </CardContent>
                </Card>
              )}
              
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
              
              {/* Partner Preferences */}
              {hasPartnerPreferences() && (
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
                      <Users size={16} weight="fill" />
                      {t.partnerPreferences}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Age Range */}
                      {(profile.partnerPreferences?.ageMin || profile.partnerPreferences?.ageMax) && (
                        <div>
                          <span className="font-semibold text-gray-600">{t.preferredAge}:</span>{' '}
                          {profile.partnerPreferences?.ageMin || '18'} {t.to} {profile.partnerPreferences?.ageMax || '60'} {t.years}
                        </div>
                      )}
                      {/* Height Range */}
                      {(profile.partnerPreferences?.heightMin || profile.partnerPreferences?.heightMax) && (
                        <div>
                          <span className="font-semibold text-gray-600">{t.preferredHeight}:</span>{' '}
                          {profile.partnerPreferences?.heightMin || '-'} {t.to} {profile.partnerPreferences?.heightMax || '-'}
                        </div>
                      )}
                      {/* Education */}
                      {profile.partnerPreferences?.education && profile.partnerPreferences.education.length > 0 && (
                        <div className="col-span-2">
                          <span className="font-semibold text-gray-600">{t.preferredEducation}:</span>{' '}
                          {formatArrayValues(profile.partnerPreferences.education)}
                        </div>
                      )}
                      {/* Occupation */}
                      {profile.partnerPreferences?.occupation && profile.partnerPreferences.occupation.length > 0 && (
                        <div className="col-span-2">
                          <span className="font-semibold text-gray-600">{t.preferredOccupation}:</span>{' '}
                          {formatArrayValues(profile.partnerPreferences.occupation)}
                        </div>
                      )}
                      {/* Location/Country */}
                      {((profile.partnerPreferences?.location && profile.partnerPreferences.location.length > 0) || 
                        (profile.partnerPreferences?.livingCountry && profile.partnerPreferences.livingCountry.length > 0)) && (
                        <div className="col-span-2">
                          <span className="font-semibold text-gray-600">{t.preferredLocation}:</span>{' '}
                          {formatArrayValues([...(profile.partnerPreferences?.location || []), ...(profile.partnerPreferences?.livingCountry || [])])}
                        </div>
                      )}
                      {/* Religion */}
                      {profile.partnerPreferences?.religion && profile.partnerPreferences.religion.length > 0 && (
                        <div>
                          <span className="font-semibold text-gray-600">{t.preferredReligion}:</span>{' '}
                          {formatArrayValues(profile.partnerPreferences.religion)}
                        </div>
                      )}
                      {/* Caste */}
                      {profile.partnerPreferences?.caste && profile.partnerPreferences.caste.length > 0 && (
                        <div>
                          <span className="font-semibold text-gray-600">{t.preferredCaste}:</span>{' '}
                          {formatArrayValues(profile.partnerPreferences.caste)}
                        </div>
                      )}
                      {/* Mother Tongue */}
                      {profile.partnerPreferences?.motherTongue && profile.partnerPreferences.motherTongue.length > 0 && (
                        <div>
                          <span className="font-semibold text-gray-600">{t.preferredMotherTongue}:</span>{' '}
                          {formatArrayValues(profile.partnerPreferences.motherTongue)}
                        </div>
                      )}
                      {/* Marital Status */}
                      {profile.partnerPreferences?.maritalStatus && profile.partnerPreferences.maritalStatus.length > 0 && (
                        <div>
                          <span className="font-semibold text-gray-600">{t.preferredMaritalStatus}:</span>{' '}
                          {profile.partnerPreferences.maritalStatus.map(s => maritalStatusLabels[s]?.[language] || s).join(', ')}
                        </div>
                      )}
                      {/* Diet */}
                      {profile.partnerPreferences?.dietPreference && profile.partnerPreferences.dietPreference.length > 0 && (
                        <div>
                          <span className="font-semibold text-gray-600">{t.preferredDiet}:</span>{' '}
                          {profile.partnerPreferences.dietPreference.map(d => dietLabels[d]?.[language] || d).join(', ')}
                        </div>
                      )}
                      {/* Manglik */}
                      {profile.partnerPreferences?.manglik && (
                        <div>
                          <span className="font-semibold text-gray-600">{t.preferredManglik}:</span>{' '}
                          {manglikPreferenceLabels[profile.partnerPreferences.manglik]?.[language] || profile.partnerPreferences.manglik}
                        </div>
                      )}
                      {/* Income */}
                      {(profile.partnerPreferences?.annualIncomeMin || profile.partnerPreferences?.annualIncomeMax) && (
                        <div className="col-span-2">
                          <span className="font-semibold text-gray-600">{t.preferredIncome}:</span>{' '}
                          {profile.partnerPreferences?.annualIncomeMin || '-'} {t.to} {profile.partnerPreferences?.annualIncomeMax || '-'}
                        </div>
                      )}
                    </div>
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
              
              {/* Footer with Branding - Elegant Design */}
              <div 
                className="mt-4 pt-3 pb-2 border-t-2 rounded-b"
                style={{ 
                  borderColor: theme.accent, 
                  borderStyle: 'dashed',
                  background: `linear-gradient(135deg, ${theme.secondary} 0%, ${theme.gradient2} 100%)`
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-lg">💍</span>
                  <span 
                    className="font-bold text-base font-serif tracking-wide"
                    style={{ color: theme.primary }}
                  >
                    Shaadi Partner Search
                  </span>
                  <span className="text-lg">💍</span>
                </div>
                <p className="text-center text-[10px] text-gray-500 font-medium">
                  {language === 'hi' ? 'भारत की विश्वसनीय वैवाहिक सेवा' : "India's Trusted Matrimonial Service"}
                </p>
                <p className="text-center text-[9px] text-gray-400 mt-0.5 flex items-center justify-center gap-1">
                  <span>📱</span>
                  {language === 'hi' ? 'QR कोड स्कैन करके प्रोफ़ाइल देखें' : 'Scan QR code to view profile'}
                </p>
                <p className="text-center text-[8px] text-gray-300 mt-1">
                  www.shaadipartnersearch.com
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end gap-3 pt-4 border-t bg-white relative z-50">
          <Button variant="outline" onClick={onClose} className="min-w-[100px]">
            {t.close}
          </Button>
          <Button 
            onClick={handleDownload}
            disabled={isGenerating || !isPaidUser}
            className="gap-2 min-w-[130px]"
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
