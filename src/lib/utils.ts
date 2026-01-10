import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Profile } from '@/types/profile'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate match percentage between a viewer's partner preferences and a target profile
 * Returns a percentage (0-100) indicating how well the target matches preferences
 */
export function calculateMatchPercentage(viewerProfile: Profile, targetProfile: Profile): number {
  const prefs = viewerProfile.partnerPreferences
  if (!prefs) return 0
  
  let totalCriteria = 0
  let matchedCriteria = 0
  
  // Age match (weight: 2)
  if (prefs.ageMin || prefs.ageMax) {
    totalCriteria += 2
    const age = targetProfile.age || 0
    const ageMin = prefs.ageMin || 0
    const ageMax = prefs.ageMax || 100
    if (age >= ageMin && age <= ageMax) {
      matchedCriteria += 2
    } else if (age < ageMin && ageMin - age <= 2) {
      matchedCriteria += 1 // Partial match if within 2 years
    } else if (age > ageMax && age - ageMax <= 2) {
      matchedCriteria += 1
    }
  }
  
  // Religion match (weight: 2)
  if (prefs.religion && prefs.religion.length > 0) {
    totalCriteria += 2
    if (targetProfile.religion && prefs.religion.includes(targetProfile.religion)) {
      matchedCriteria += 2
    }
  }
  
  // Caste match (weight: 1)
  if (prefs.caste && prefs.caste.length > 0) {
    totalCriteria += 1
    if (targetProfile.caste && prefs.caste.includes(targetProfile.caste)) {
      matchedCriteria += 1
    }
  }
  
  // Mother tongue match (weight: 1)
  if (prefs.motherTongue && prefs.motherTongue.length > 0) {
    totalCriteria += 1
    if (targetProfile.motherTongue && prefs.motherTongue.includes(targetProfile.motherTongue)) {
      matchedCriteria += 1
    }
  }
  
  // Education match (weight: 1.5)
  if (prefs.education && prefs.education.length > 0) {
    totalCriteria += 1.5
    if (targetProfile.education && prefs.education.includes(targetProfile.education)) {
      matchedCriteria += 1.5
    }
  }
  
  // Employment/Occupation match (weight: 1)
  if (prefs.employmentStatus && prefs.employmentStatus.length > 0) {
    totalCriteria += 1
    if (targetProfile.occupation && prefs.employmentStatus.includes(targetProfile.occupation)) {
      matchedCriteria += 1
    }
  }
  
  // Location (Country) match (weight: 1.5)
  if (prefs.livingCountry && prefs.livingCountry.length > 0) {
    totalCriteria += 1.5
    if (targetProfile.country && prefs.livingCountry.includes(targetProfile.country)) {
      matchedCriteria += 1.5
    }
  }
  
  // State match (weight: 1)
  if (prefs.livingState && prefs.livingState.length > 0) {
    totalCriteria += 1
    if (targetProfile.state && prefs.livingState.includes(targetProfile.state)) {
      matchedCriteria += 1
    }
  }
  
  // Marital status match (weight: 1.5)
  if (prefs.maritalStatus && prefs.maritalStatus.length > 0) {
    totalCriteria += 1.5
    if (targetProfile.maritalStatus && prefs.maritalStatus.includes(targetProfile.maritalStatus)) {
      matchedCriteria += 1.5
    }
  }
  
  // Diet match (weight: 1)
  if (prefs.dietPreference && prefs.dietPreference.length > 0) {
    totalCriteria += 1
    if (targetProfile.dietPreference && prefs.dietPreference.includes(targetProfile.dietPreference)) {
      matchedCriteria += 1
    }
  }
  
  // Drinking habit match (weight: 0.5)
  if (prefs.drinkingHabit && prefs.drinkingHabit.length > 0) {
    totalCriteria += 0.5
    if (targetProfile.drinkingHabit && prefs.drinkingHabit.includes(targetProfile.drinkingHabit)) {
      matchedCriteria += 0.5
    }
  }
  
  // Smoking habit match (weight: 0.5)
  if (prefs.smokingHabit && prefs.smokingHabit.length > 0) {
    totalCriteria += 0.5
    if (targetProfile.smokingHabit && prefs.smokingHabit.includes(targetProfile.smokingHabit)) {
      matchedCriteria += 0.5
    }
  }
  
  // Manglik match (weight: 1)
  if (prefs.manglik && prefs.manglik !== 'doesnt-matter') {
    totalCriteria += 1
    const targetManglik = targetProfile.manglik ? 'yes' : 'no'
    if (prefs.manglik === targetManglik) {
      matchedCriteria += 1
    }
  }
  
  // Disability match (weight: 1)
  if (prefs.disability && prefs.disability.length > 0) {
    totalCriteria += 1
    if (targetProfile.disability && prefs.disability.includes(targetProfile.disability)) {
      matchedCriteria += 1
    }
  }
  
  if (totalCriteria === 0) return 0
  
  return Math.round((matchedCriteria / totalCriteria) * 100)
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
