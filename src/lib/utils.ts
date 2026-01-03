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
    'graduate': { hi: 'स्नातक', en: 'Graduate' },
    'btech-be': { hi: 'बी.टेक/बी.ई.', en: 'B.Tech/B.E.' },
    'bba': { hi: 'बीबीए', en: 'BBA' },
    'bca': { hi: 'बीसीए', en: 'BCA' },
    'bsc': { hi: 'बी.एससी', en: 'B.Sc' },
    'bcom': { hi: 'बी.कॉम', en: 'B.Com' },
    'ba': { hi: 'बी.ए.', en: 'B.A.' },
    'llb': { hi: 'एलएलबी', en: 'LLB' },
    'post-graduate': { hi: 'परास्नातक', en: 'Post Graduate' },
    'mtech-me': { hi: 'एम.टेक/एम.ई.', en: 'M.Tech/M.E.' },
    'mba': { hi: 'एमबीए', en: 'MBA' },
    'mca': { hi: 'एमसीए', en: 'MCA' },
    'msc': { hi: 'एम.एससी', en: 'M.Sc' },
    'mcom': { hi: 'एम.कॉम', en: 'M.Com' },
    'ma': { hi: 'एम.ए.', en: 'M.A.' },
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
 * Format an array of education values to human-readable labels
 */
export function formatEducationArray(values: string[] | undefined, language: 'hi' | 'en' = 'en'): string {
  if (!values || values.length === 0) return language === 'hi' ? 'कोई भी' : 'Any'
  return values.map(v => formatEducation(v, language)).join(', ')
}

/**
 * Format an array of occupation values to human-readable labels
 */
export function formatOccupationArray(values: string[] | undefined, language: 'hi' | 'en' = 'en'): string {
  if (!values || values.length === 0) return language === 'hi' ? 'कोई भी' : 'Any'
  return values.map(v => formatOccupation(v, language)).join(', ')
}

/**
 * Format employment status value to human-readable label
 */
export function formatOccupation(value: string | undefined, language: 'hi' | 'en' = 'en'): string {
  if (!value) return ''
  const occupationLabels: Record<string, { hi: string; en: string }> = {
    'employed': { hi: 'नौकरीपेशा', en: 'Employed' },
    'self-employed': { hi: 'स्व-रोजगार', en: 'Self-Employed' },
    'business-owner': { hi: 'व्यापारी/उद्यमी', en: 'Business Owner' },
    'govt-employee': { hi: 'सरकारी कर्मचारी', en: 'Government Employee' },
    'student': { hi: 'विद्यार्थी', en: 'Student' },
    'homemaker': { hi: 'गृहिणी', en: 'Homemaker' },
    'retired': { hi: 'सेवानिवृत्त', en: 'Retired' },
    'not-working': { hi: 'कार्यरत नहीं', en: 'Not Working' },
    // Legacy values mapping for backward compatibility
    'software-it': { hi: 'नौकरीपेशा', en: 'Employed' },
    'engineer': { hi: 'नौकरीपेशा', en: 'Employed' },
    'doctor': { hi: 'नौकरीपेशा', en: 'Employed' },
    'teacher-professor': { hi: 'नौकरीपेशा', en: 'Employed' },
    'private-job': { hi: 'नौकरीपेशा', en: 'Employed' },
    'banker': { hi: 'नौकरीपेशा', en: 'Employed' },
    'ca-accountant': { hi: 'नौकरीपेशा', en: 'Employed' },
    'lawyer': { hi: 'नौकरीपेशा', en: 'Employed' },
    'civil-services': { hi: 'सरकारी कर्मचारी', en: 'Government Employee' },
    'defense': { hi: 'सरकारी कर्मचारी', en: 'Government Employee' },
    'scientist': { hi: 'नौकरीपेशा', en: 'Employed' },
    'architect': { hi: 'नौकरीपेशा', en: 'Employed' },
    'pilot': { hi: 'नौकरीपेशा', en: 'Employed' },
    'media-journalist': { hi: 'नौकरीपेशा', en: 'Employed' },
    'artist-designer': { hi: 'नौकरीपेशा', en: 'Employed' },
    'healthcare': { hi: 'नौकरीपेशा', en: 'Employed' },
    'consultant': { hi: 'स्व-रोजगार', en: 'Self-Employed' },
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
