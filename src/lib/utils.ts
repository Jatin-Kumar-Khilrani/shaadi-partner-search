import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format education value to human-readable label
 */
export function formatEducation(value: string | undefined, language: 'hi' | 'en' = 'en'): string {
  if (!value) return ''
  const educationLabels: Record<string, { hi: string; en: string }> = {
    '10th': { hi: '10वीं पास', en: '10th Pass' },
    '12th': { hi: '12वीं पास', en: '12th Pass' },
    'diploma': { hi: 'डिप्लोमा', en: 'Diploma' },
    'graduate': { hi: 'स्नातक (B.A./B.Sc/B.Com)', en: 'Graduate (B.A./B.Sc/B.Com)' },
    'btech-be': { hi: 'बी.टेक/बी.ई.', en: 'B.Tech/B.E.' },
    'bba': { hi: 'बीबीए', en: 'BBA' },
    'bca': { hi: 'बीसीए', en: 'BCA' },
    'llb': { hi: 'एलएलबी', en: 'LLB' },
    'post-graduate': { hi: 'परास्नातक (M.A./M.Sc/M.Com)', en: 'Post Graduate (M.A./M.Sc/M.Com)' },
    'mtech-me': { hi: 'एम.टेक/एम.ई.', en: 'M.Tech/M.E.' },
    'mba': { hi: 'एमबीए', en: 'MBA' },
    'mca': { hi: 'एमसीए', en: 'MCA' },
    'llm': { hi: 'एलएलएम', en: 'LLM' },
    'phd': { hi: 'पीएचडी', en: 'PhD/Doctorate' },
    'mbbs': { hi: 'एमबीबीएस', en: 'MBBS' },
    'md-ms': { hi: 'एमडी/एमएस', en: 'MD/MS' },
    'bds': { hi: 'बीडीएस', en: 'BDS' },
    'bams-bhms': { hi: 'बीएएमएस/बीएचएमएस', en: 'BAMS/BHMS' },
    'ca': { hi: 'चार्टर्ड अकाउंटेंट (CA)', en: 'Chartered Accountant (CA)' },
    'cs': { hi: 'कंपनी सेक्रेटरी (CS)', en: 'Company Secretary (CS)' },
    'cfa': { hi: 'सीएफए', en: 'CFA' },
    'b-pharma': { hi: 'बी.फार्मा', en: 'B.Pharma' },
    'm-pharma': { hi: 'एम.फार्मा', en: 'M.Pharma' },
    'b-ed': { hi: 'बी.एड', en: 'B.Ed' },
    'other': { hi: 'अन्य', en: 'Other' }
  }
  const label = educationLabels[value]
  return label ? label[language] : value
}

/**
 * Format occupation value to human-readable label
 */
export function formatOccupation(value: string | undefined, language: 'hi' | 'en' = 'en'): string {
  if (!value) return ''
  const occupationLabels: Record<string, { hi: string; en: string }> = {
    'software-it': { hi: 'सॉफ्टवेयर/IT प्रोफेशनल', en: 'Software/IT Professional' },
    'engineer': { hi: 'इंजीनियर', en: 'Engineer' },
    'doctor': { hi: 'डॉक्टर/मेडिकल प्रोफेशनल', en: 'Doctor/Medical Professional' },
    'teacher-professor': { hi: 'शिक्षक/प्रोफेसर', en: 'Teacher/Professor' },
    'govt-employee': { hi: 'सरकारी कर्मचारी', en: 'Government Employee' },
    'private-job': { hi: 'प्राइवेट नौकरी', en: 'Private Job' },
    'business-owner': { hi: 'व्यापारी/उद्यमी', en: 'Business Owner/Entrepreneur' },
    'self-employed': { hi: 'स्व-रोजगार', en: 'Self Employed' },
    'banker': { hi: 'बैंकिंग प्रोफेशनल', en: 'Banking Professional' },
    'ca-accountant': { hi: 'सीए/अकाउंटेंट', en: 'CA/Accountant' },
    'lawyer': { hi: 'वकील', en: 'Lawyer' },
    'civil-services': { hi: 'सिविल सर्विसेज (IAS/IPS/IFS)', en: 'Civil Services (IAS/IPS/IFS)' },
    'defense': { hi: 'रक्षा सेवा', en: 'Defense/Armed Forces' },
    'scientist': { hi: 'वैज्ञानिक/शोधकर्ता', en: 'Scientist/Researcher' },
    'architect': { hi: 'आर्किटेक्ट', en: 'Architect' },
    'pilot': { hi: 'पायलट', en: 'Pilot' },
    'media-journalist': { hi: 'मीडिया/पत्रकार', en: 'Media/Journalist' },
    'artist-designer': { hi: 'कलाकार/डिज़ाइनर', en: 'Artist/Designer' },
    'student': { hi: 'विद्यार्थी', en: 'Student' },
    'homemaker': { hi: 'गृहिणी', en: 'Homemaker' },
    'not-working': { hi: 'कार्यरत नहीं', en: 'Not Working' },
    'other': { hi: 'अन्य', en: 'Other' }
  }
  const label = occupationLabels[value]
  return label ? label[language] : value
}

/**
 * Format date to DD/MM/YYYY format
 */
export function formatDateDDMMYYYY(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}
