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
  const inches = Math.round(totalInches % 12)
  
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

/**
 * Phone Number Filter for Chat
 * Detects and masks phone numbers in various formats to prevent users from sharing contact info
 * This is used in matrimonial apps to enforce the contact request workflow
 */

// Unicode digit ranges that could be used to bypass phone detection
// Maps Unicode digit blocks to their ASCII equivalents
const UNICODE_DIGIT_RANGES: Array<{ start: number; end: number }> = [
  { start: 0x0660, end: 0x0669 }, // Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩)
  { start: 0x06F0, end: 0x06F9 }, // Extended Arabic-Indic (Persian) digits (۰۱۲۳۴۵۶۷۸۹)
  { start: 0x0966, end: 0x096F }, // Devanagari digits (०१२३४५६७८९)
  { start: 0x09E6, end: 0x09EF }, // Bengali digits (০১২৩৪৫৬৭৮৯)
  { start: 0x0A66, end: 0x0A6F }, // Gurmukhi digits (੦੧੨੩੪੫੬੭੮੯)
  { start: 0x0AE6, end: 0x0AEF }, // Gujarati digits (૦૧૨૩૪૫૬૭૮૯)
  { start: 0x0B66, end: 0x0B6F }, // Oriya digits (୦୧୨୩୪୫୬୭୮୯)
  { start: 0x0BE6, end: 0x0BEF }, // Tamil digits (௦௧௨௩௪௫௬௭௮௯)
  { start: 0x0C66, end: 0x0C6F }, // Telugu digits (౦౧౨౩౪౫౬౭౮౯)
  { start: 0x0CE6, end: 0x0CEF }, // Kannada digits (೦೧೨೩೪೫೬೭೮೯)
  { start: 0x0D66, end: 0x0D6F }, // Malayalam digits (൦൧൨൩൪൫൬൭൮൯)
  { start: 0xFF10, end: 0xFF19 }, // Fullwidth digits (０１２３４５６７８９)
]

/**
 * Normalize Unicode digits to ASCII digits
 * Prevents bypass of phone detection using lookalike characters
 * e.g., "۹۸۲۸۵۸۵۳۰۰" -> "9828585300"
 */
function normalizeUnicodeDigits(text: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    let normalized = text[i]
    
    for (const range of UNICODE_DIGIT_RANGES) {
      if (code >= range.start && code <= range.end) {
        // Convert to ASCII digit (0-9)
        normalized = String.fromCharCode(0x30 + (code - range.start))
        break
      }
    }
    result += normalized
  }
  return result
}

// Number words mapping (English)
const ENGLISH_NUMBER_WORDS: Record<string, string> = {
  'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
  'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
  'ten': '10', 'o': '0', 'oh': '0',
}

// Number words mapping (Hindi transliterated)
const HINDI_NUMBER_WORDS: Record<string, string> = {
  'ek': '1', 'do': '2', 'teen': '3', 'char': '4', 'paanch': '5', 'panch': '5',
  'chhe': '6', 'che': '6', 'saat': '7', 'sat': '7', 'aath': '8', 'ath': '8',
  'nau': '9', 'shunya': '0', 'shuny': '0',
  // Alternative spellings
  'eak': '1', 'dho': '2', 'tiin': '3', 'chaar': '4', 'paach': '5',
  'chhah': '6', 'saath': '7', 'aathh': '8', 'nao': '9',
  // Phonetic variations
  'aik': '1', 'doo': '2', 'theen': '3', 'chhar': '4', 'pach': '5',
  'cheh': '6', 'sath': '7', 'aatth': '8', 'nou': '9',
}

// Combined number words
const ALL_NUMBER_WORDS: Record<string, string> = {
  ...ENGLISH_NUMBER_WORDS,
  ...HINDI_NUMBER_WORDS,
}

/**
 * Convert a string with number words to digits
 * e.g., "nine eight two" -> "982"
 */
function convertNumberWordsToDigits(text: string): string {
  let result = text.toLowerCase()
  
  // Sort by length (longest first) to avoid partial replacements
  const sortedWords = Object.keys(ALL_NUMBER_WORDS).sort((a, b) => b.length - a.length)
  
  for (const word of sortedWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    result = result.replace(regex, ALL_NUMBER_WORDS[word])
  }
  
  return result
}

/**
 * Extract digits from text, removing separators
 * e.g., "982-8585-300" -> "9828585300"
 */
function extractDigitsOnly(text: string): string {
  return text.replace(/\D/g, '')
}

/**
 * Check if a string contains a potential phone number pattern
 * Returns true if it looks like someone is trying to share a phone number
 */
export function containsPhoneNumber(message: string): {
  detected: boolean
  patterns: string[]
  reason: string
} {
  const patterns: string[] = []
  let detected = false
  let reason = ''

  // Normalize Unicode digits to ASCII to prevent bypass with lookalike characters
  const normalizedMessage = normalizeUnicodeDigits(message)

  // 1. Direct 10+ digit sequences (with or without separators)
  // Matches: 9828585300, 982-8585-300, 982 8585 300, 982.8585.300, +91-9828585300
  const phoneWithSeparators = /(?:\+?\d{1,3}[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}[-.\s]?\d{2,5}/g
  const separatorMatches = normalizedMessage.match(phoneWithSeparators)
  if (separatorMatches) {
    for (const match of separatorMatches) {
      const digits = extractDigitsOnly(match)
      // Indian mobile numbers are 10 digits, with country code it's 12-13
      if (digits.length >= 10 && digits.length <= 13) {
        // Check if it starts with valid Indian mobile prefix (6-9)
        const checkDigits = digits.length > 10 ? digits.slice(-10) : digits
        if (/^[6-9]/.test(checkDigits)) {
          patterns.push(match)
          detected = true
          reason = 'Phone number with separators detected'
        }
      }
    }
  }

  // 2. Spaced out digits: 9 8 2 8 5 8 5 3 0 0
  const spacedDigits = /(?:\d\s+){9,}\d/g
  const spacedMatches = normalizedMessage.match(spacedDigits)
  if (spacedMatches) {
    for (const match of spacedMatches) {
      const digits = extractDigitsOnly(match)
      if (digits.length >= 10) {
        patterns.push(match)
        detected = true
        reason = 'Spaced-out phone number detected'
      }
    }
  }

  // 3. Number words (English/Hindi): "nine eight two eight five eight five three zero zero"
  // Convert words to digits, remove spaces, then check for sequences
  const convertedText = convertNumberWordsToDigits(normalizedMessage)
  const convertedNoSpaces = convertedText.replace(/\s+/g, '')
  const convertedDigits = extractDigitsOnly(convertedNoSpaces)
  
  // Check if we have 10+ consecutive digits after conversion
  if (convertedDigits.length >= 10 && !detected) {
    // Look for valid Indian mobile number pattern (starts with 6-9)
    for (let i = 0; i <= convertedDigits.length - 10; i++) {
      const seq = convertedDigits.substring(i, i + 10)
      if (/^[6-9]/.test(seq)) {
        patterns.push(`Number words detected: ${seq}`)
        detected = true
        reason = 'Phone number written in words detected'
        break
      }
    }
  }

  // 4. Mixed patterns: "98two8585300" or "9 8 two 8 5 8 5 3 0 0"
  // First convert words to digits, then extract all digits
  const mixedConverted = convertNumberWordsToDigits(normalizedMessage.replace(/\s+/g, ''))
  const mixedDigits = extractDigitsOnly(mixedConverted)
  if (mixedDigits.length >= 10 && !detected) {
    // Check for a 10-digit sequence starting with 6-9
    for (let i = 0; i <= mixedDigits.length - 10; i++) {
      const substring = mixedDigits.substring(i, i + 10)
      if (/^[6-9]/.test(substring)) {
        // Verify this isn't just random numbers (e.g., birth date + random)
        // by checking if it forms a valid mobile pattern
        patterns.push(`Mixed pattern: ${substring}`)
        detected = true
        reason = 'Mixed number pattern detected'
        break
      }
    }
  }

  // 5. Partially obfuscated: "call me at 98XXXXXXXX" or "whatsapp 98*****300"
  const obfuscatedPattern = /(?:\d{2,}[xX*]+\d{2,})|(?:\d+[xX*]{3,}\d+)/gi
  const obfuscatedMatches = normalizedMessage.match(obfuscatedPattern)
  if (obfuscatedMatches) {
    patterns.push(...obfuscatedMatches)
    detected = true
    reason = 'Partially hidden phone number detected'
  }

  // 6. Check for keywords + numbers combo
  const phoneKeywords = /(?:call|phone|mobile|number|whatsapp|contact|reach|msg|message|dial)\s*(?:me\s*)?(?:at|on|@)?\s*:?\s*[\d\s\-.()]{8,}/gi
  const keywordMatches = normalizedMessage.match(phoneKeywords)
  if (keywordMatches) {
    for (const match of keywordMatches) {
      const digits = extractDigitsOnly(match)
      if (digits.length >= 8) {
        patterns.push(match)
        detected = true
        reason = 'Phone number with keyword detected'
      }
    }
  }

  return { detected, patterns, reason }
}

/**
 * Mask phone numbers in a message
 * Replaces detected phone numbers with asterisks
 * Also handles Unicode digit lookalikes
 */
export function maskPhoneNumbers(message: string): string {
  // First, check if Unicode digits are present and normalize for detection
  const normalizedMessage = normalizeUnicodeDigits(message)
  
  // If the message contains Unicode digits that form a phone number, mask them
  // by replacing any sequence of Unicode digits with asterisks
  let masked = message
  
  // Check if normalized version contains phone numbers that original doesn't
  // This indicates Unicode digit bypass attempt
  const unicodeDigitPattern = /[\u0660-\u0669\u06F0-\u06F9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\uFF10-\uFF19]+/g
  masked = masked.replace(unicodeDigitPattern, (match) => {
    // Mask any sequence of Unicode digits
    return '*'.repeat(match.length)
  })

  // 1. Mask direct phone patterns with separators
  masked = masked.replace(
    /(?:\+?\d{1,3}[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}[-.\s]?\d{2,5}/g,
    (match) => {
      const digits = extractDigitsOnly(match)
      if (digits.length >= 10 && digits.length <= 13) {
        const checkDigits = digits.length > 10 ? digits.slice(-10) : digits
        if (/^[6-9]/.test(checkDigits)) {
          return '**********'
        }
      }
      return match
    }
  )

  // 2. Mask spaced out digits
  masked = masked.replace(
    /(?:\d\s+){9,}\d/g,
    '**********'
  )

  // 3. Mask number words (convert and check, then mask original)
  // This is tricky - we need to find sequences of number words
  
  // Find all positions of number words
  const wordMatches: { start: number; end: number; value: string }[] = []
  let wordMatch
  const tempText = message.toLowerCase()
  const numberWordRegex = new RegExp(
    `\\b(${Object.keys(ALL_NUMBER_WORDS).join('|')})\\b`,
    'gi'
  )
  
  while ((wordMatch = numberWordRegex.exec(tempText)) !== null) {
    wordMatches.push({
      start: wordMatch.index,
      end: wordMatch.index + wordMatch[0].length,
      value: ALL_NUMBER_WORDS[wordMatch[0].toLowerCase()] || wordMatch[0]
    })
  }

  // Check for consecutive number words (with allowed gaps)
  if (wordMatches.length >= 8) {
    // Group consecutive matches (within 10 chars of each other)
    const groups: typeof wordMatches[] = []
    let currentGroup: typeof wordMatches = []
    
    for (let i = 0; i < wordMatches.length; i++) {
      if (currentGroup.length === 0) {
        currentGroup.push(wordMatches[i])
      } else {
        const lastMatch = currentGroup[currentGroup.length - 1]
        if (wordMatches[i].start - lastMatch.end <= 10) {
          currentGroup.push(wordMatches[i])
        } else {
          if (currentGroup.length >= 8) groups.push(currentGroup)
          currentGroup = [wordMatches[i]]
        }
      }
    }
    if (currentGroup.length >= 8) groups.push(currentGroup)

    // Mask groups that form phone numbers
    for (const group of groups) {
      const digits = group.map(m => m.value).join('')
      if (/^[6-9]/.test(digits) && digits.length >= 10) {
        // Replace the entire span with asterisks
        const start = group[0].start
        const end = group[group.length - 1].end
        const originalSpan = message.substring(start, end)
        masked = masked.replace(originalSpan, '**********')
      }
    }
  }

  return masked
}

/**
 * Validate and sanitize chat message
 * Returns sanitized message or null if message should be blocked entirely
 */
export function sanitizeChatMessage(
  message: string,
  options: {
    allowPhoneNumbers?: boolean
    isAdminChat?: boolean
    language?: 'en' | 'hi'
  } = {}
): {
  sanitized: string
  blocked: boolean
  warning: string | null
  originalContainedPhone: boolean
} {
  const { allowPhoneNumbers = false, isAdminChat = false, language = 'en' } = options

  // Admin chats are not filtered
  if (isAdminChat || allowPhoneNumbers) {
    return {
      sanitized: message,
      blocked: false,
      warning: null,
      originalContainedPhone: false
    }
  }

  const detection = containsPhoneNumber(message)
  
  if (detection.detected) {
    const maskedMessage = maskPhoneNumbers(message)
    const warning = language === 'hi'
      ? 'मोबाइल नंबर शेयर करना प्रतिबंधित है। कृपया कॉन्टैक्ट रिक्वेस्ट का उपयोग करें।'
      : 'Sharing mobile numbers is not allowed. Please use Contact Request feature.'

    return {
      sanitized: maskedMessage,
      blocked: false, // We mask instead of blocking
      warning,
      originalContainedPhone: true
    }
  }

  return {
    sanitized: message,
    blocked: false,
    warning: null,
    originalContainedPhone: false
  }
}
