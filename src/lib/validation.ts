/**
 * Validation utility functions
 * Extracted for testability and reuse across the application
 */

// Country phone length configurations
export const COUNTRY_PHONE_LENGTHS: Record<string, { min: number; max: number; display: string }> = {
  '+91': { min: 10, max: 10, display: '10' },  // India
  '+1': { min: 10, max: 10, display: '10' },   // USA/Canada
  '+44': { min: 10, max: 10, display: '10' },  // UK
  '+971': { min: 9, max: 9, display: '9' },    // UAE
  '+974': { min: 8, max: 8, display: '8' },    // Qatar
  '+966': { min: 9, max: 9, display: '9' },    // Saudi Arabia
  '+65': { min: 8, max: 8, display: '8' },     // Singapore
  '+61': { min: 9, max: 9, display: '9' },     // Australia
  '+49': { min: 10, max: 11, display: '10-11' }, // Germany
  '+33': { min: 9, max: 9, display: '9' },     // France
  '+81': { min: 10, max: 10, display: '10' },  // Japan
}

/**
 * Get phone length info for a country code
 */
export function getPhoneLengthInfo(countryCode: string): { min: number; max: number; display: string } {
  return COUNTRY_PHONE_LENGTHS[countryCode] || { min: 7, max: 15, display: '7-15' }
}

/**
 * Validate phone number length based on country code
 */
export function isValidPhoneLength(phone: string, countryCode: string): boolean {
  if (!phone || typeof phone !== 'string') return false
  // Remove any non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '')
  const lengthInfo = getPhoneLengthInfo(countryCode)
  return digitsOnly.length >= lengthInfo.min && digitsOnly.length <= lengthInfo.max
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Calculate age from date of birth
 * @param dob - Date of birth in ISO format (YYYY-MM-DD) or Date object
 * @param referenceDate - Optional reference date for calculation (defaults to today)
 * @returns Age in years
 */
export function calculateAge(dob: string | Date, referenceDate: Date = new Date()): number {
  if (!dob) return 0
  
  const birthDate = typeof dob === 'string' ? new Date(dob) : dob
  
  if (isNaN(birthDate.getTime())) return 0
  
  let age = referenceDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

/**
 * Parse height string to centimeters
 * @param height - Height string in format like "5'6" (feet'inches) or "170cm" or "170"
 * @returns Height in centimeters
 */
export function parseHeightToCm(height: string): number {
  if (!height) return 0
  
  // If already in cm format (e.g., "170cm" or "170")
  if (/^\d+(\s*cm)?$/i.test(height.trim())) {
    return parseInt(height.replace(/cm/i, ''), 10)
  }
  
  // Parse feet'inches format (e.g., "5'6" or "5'6\"")
  const feetInchesMatch = height.match(/(\d+)'(\d+)?/)
  if (feetInchesMatch) {
    const feet = parseInt(feetInchesMatch[1], 10)
    const inches = parseInt(feetInchesMatch[2] || '0', 10)
    return Math.round((feet * 30.48) + (inches * 2.54))
  }
  
  return 0
}

/**
 * Format height from centimeters to feet'inches format
 * @param cm - Height in centimeters
 * @returns Height string in format "X'Y"
 */
export function formatHeightFromCm(cm: number): string {
  if (!cm || cm <= 0) return ''
  
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  let inches = Math.round(totalInches % 12)
  
  // Handle rounding to 12 inches - should be next foot
  if (inches === 12) {
    return `${feet + 1}'0`
  }
  
  return `${feet}'${inches}`
}

/**
 * Check if a profile is within age range preference
 */
export function isWithinAgeRange(
  profileAge: number,
  minAge: number | undefined,
  maxAge: number | undefined
): boolean {
  if (minAge !== undefined && profileAge < minAge) return false
  if (maxAge !== undefined && profileAge > maxAge) return false
  return true
}

/**
 * Check if a profile is within height range preference
 * @param profileHeight - Height string (e.g., "5'6" or "170cm")
 * @param minHeight - Minimum height string
 * @param maxHeight - Maximum height string
 */
export function isWithinHeightRange(
  profileHeight: string,
  minHeight: string | undefined,
  maxHeight: string | undefined
): boolean {
  const heightCm = parseHeightToCm(profileHeight)
  if (heightCm === 0) return true // Can't validate, assume matches
  
  if (minHeight) {
    const minCm = parseHeightToCm(minHeight)
    if (minCm > 0 && heightCm < minCm) return false
  }
  
  if (maxHeight) {
    const maxCm = parseHeightToCm(maxHeight)
    if (maxCm > 0 && heightCm > maxCm) return false
  }
  
  return true
}

/**
 * Validate that user meets minimum age requirement for marriage
 * @param dob - Date of birth
 * @param gender - Gender of the user
 * @returns Object with isValid and minimum age requirement
 */
export function validateMarriageAge(
  dob: string,
  gender: 'male' | 'female' | 'other'
): { isValid: boolean; minAge: number; actualAge: number } {
  const minAge = gender === 'male' ? 21 : 18
  const actualAge = calculateAge(dob)
  return {
    isValid: actualAge >= minAge,
    minAge,
    actualAge
  }
}

/**
 * Check if membership is active
 * @param membershipEndDate - End date of membership
 * @returns true if membership is active
 */
export function isMembershipActive(membershipEndDate: string | undefined | null): boolean {
  if (!membershipEndDate) return false
  
  const endDate = new Date(membershipEndDate)
  if (isNaN(endDate.getTime())) return false
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  
  return endDate >= today
}

/**
 * Calculate days remaining in membership
 */
export function getMembershipDaysRemaining(membershipEndDate: string | undefined | null): number {
  if (!membershipEndDate) return 0
  
  const endDate = new Date(membershipEndDate)
  if (isNaN(endDate.getTime())) return 0
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  
  const diffTime = endDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

/**
 * Generate a profile ID in the format SS + YYMMDD + random 3 digits
 */
export function generateProfileId(createdAt: Date = new Date()): string {
  const year = createdAt.getFullYear().toString().slice(-2)
  const month = (createdAt.getMonth() + 1).toString().padStart(2, '0')
  const day = createdAt.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 900 + 100) // 100-999
  
  return `SS${year}${month}${day}${random}`
}

/**
 * Validate profile ID format
 */
export function isValidProfileId(profileId: string): boolean {
  if (!profileId) return false
  // SS + 6 digits (YYMMDD) + 3 digits (random)
  return /^SS\d{9}$/.test(profileId)
}

/**
 * Calculate match score between two profiles based on preferences
 * Returns a score from 0-100
 */
export function calculateBasicMatchScore(
  profile: {
    religion?: string
    caste?: string
    motherTongue?: string
    education?: string
    occupation?: string
    state?: string
    city?: string
    age?: number
    height?: string
  },
  preferences: {
    religion?: string[]
    caste?: string[]
    motherTongue?: string[]
    education?: string[]
    occupation?: string[]
    location?: string[]
    ageMin?: number
    ageMax?: number
    heightMin?: string
    heightMax?: string
  }
): number {
  let score = 0
  let weightTotal = 0

  // Religion match (weight: 20)
  if (preferences.religion?.length) {
    weightTotal += 20
    if (profile.religion && preferences.religion.includes(profile.religion)) {
      score += 20
    }
  }

  // Caste match (weight: 15)
  if (preferences.caste?.length) {
    weightTotal += 15
    if (profile.caste && preferences.caste.includes(profile.caste)) {
      score += 15
    }
  }

  // Mother tongue match (weight: 10)
  if (preferences.motherTongue?.length) {
    weightTotal += 10
    if (profile.motherTongue && preferences.motherTongue.includes(profile.motherTongue)) {
      score += 10
    }
  }

  // Education match (weight: 15)
  if (preferences.education?.length) {
    weightTotal += 15
    if (profile.education && preferences.education.includes(profile.education)) {
      score += 15
    }
  }

  // Occupation match (weight: 10)
  if (preferences.occupation?.length) {
    weightTotal += 10
    if (profile.occupation && preferences.occupation.includes(profile.occupation)) {
      score += 10
    }
  }

  // Location match (weight: 10)
  if (preferences.location?.length) {
    weightTotal += 10
    const profileLocation = [profile.state, profile.city].filter(Boolean)
    if (profileLocation.some(loc => loc && preferences.location?.includes(loc))) {
      score += 10
    }
  }

  // Age range match (weight: 10)
  if (preferences.ageMin !== undefined || preferences.ageMax !== undefined) {
    weightTotal += 10
    if (profile.age && isWithinAgeRange(profile.age, preferences.ageMin, preferences.ageMax)) {
      score += 10
    }
  }

  // Height range match (weight: 10)
  if (preferences.heightMin || preferences.heightMax) {
    weightTotal += 10
    if (profile.height && isWithinHeightRange(profile.height, preferences.heightMin, preferences.heightMax)) {
      score += 10
    }
  }

  // Return normalized score (0-100)
  if (weightTotal === 0) return 100 // No preferences = everyone matches
  return Math.round((score / weightTotal) * 100)
}
