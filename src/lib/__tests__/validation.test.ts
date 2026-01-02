import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  isValidPhoneLength,
  getPhoneLengthInfo,
  calculateAge,
  parseHeightToCm,
  formatHeightFromCm,
  isWithinAgeRange,
  isWithinHeightRange,
  validateMarriageAge,
  isMembershipActive,
  getMembershipDaysRemaining,
  generateProfileId,
  isValidProfileId,
  calculateBasicMatchScore,
} from '../validation'

describe('Email Validation', () => {
  it('should validate correct email formats', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.co.in')).toBe(true)
    expect(isValidEmail('user+tag@gmail.com')).toBe(true)
  })

  it('should reject invalid email formats', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('invalid@')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
    expect(isValidEmail('user@.com')).toBe(false)
    expect(isValidEmail('user name@domain.com')).toBe(false)
  })

  it('should handle edge cases', () => {
    expect(isValidEmail(null as unknown as string)).toBe(false)
    expect(isValidEmail(undefined as unknown as string)).toBe(false)
    expect(isValidEmail('  test@example.com  ')).toBe(true) // trims whitespace
  })
})

describe('Phone Validation', () => {
  describe('getPhoneLengthInfo', () => {
    it('should return correct length info for known country codes', () => {
      expect(getPhoneLengthInfo('+91')).toEqual({ min: 10, max: 10, display: '10' })
      expect(getPhoneLengthInfo('+1')).toEqual({ min: 10, max: 10, display: '10' })
      expect(getPhoneLengthInfo('+971')).toEqual({ min: 9, max: 9, display: '9' })
    })

    it('should return default for unknown country codes', () => {
      expect(getPhoneLengthInfo('+999')).toEqual({ min: 7, max: 15, display: '7-15' })
    })
  })

  describe('isValidPhoneLength', () => {
    it('should validate Indian phone numbers correctly', () => {
      expect(isValidPhoneLength('9876543210', '+91')).toBe(true)
      expect(isValidPhoneLength('987654321', '+91')).toBe(false) // 9 digits
      expect(isValidPhoneLength('98765432101', '+91')).toBe(false) // 11 digits
    })

    it('should validate US phone numbers correctly', () => {
      expect(isValidPhoneLength('2025551234', '+1')).toBe(true)
      expect(isValidPhoneLength('202555123', '+1')).toBe(false)
    })

    it('should validate UAE phone numbers correctly', () => {
      expect(isValidPhoneLength('501234567', '+971')).toBe(true)
      expect(isValidPhoneLength('5012345678', '+971')).toBe(false)
    })

    it('should handle empty and invalid input', () => {
      expect(isValidPhoneLength('', '+91')).toBe(false)
      expect(isValidPhoneLength(null as unknown as string, '+91')).toBe(false)
    })
  })
})

describe('Age Calculation', () => {
  it('should calculate age correctly', () => {
    const referenceDate = new Date('2024-06-15')
    expect(calculateAge('2000-06-15', referenceDate)).toBe(24)
    expect(calculateAge('2000-06-16', referenceDate)).toBe(23) // birthday tomorrow
    expect(calculateAge('2000-01-01', referenceDate)).toBe(24)
    expect(calculateAge('2000-12-31', referenceDate)).toBe(23)
  })

  it('should handle Date objects', () => {
    const referenceDate = new Date('2024-06-15')
    const birthDate = new Date('2000-06-15')
    expect(calculateAge(birthDate, referenceDate)).toBe(24)
  })

  it('should handle invalid dates', () => {
    expect(calculateAge('')).toBe(0)
    expect(calculateAge('invalid-date')).toBe(0)
  })
})

describe('Height Parsing', () => {
  describe('parseHeightToCm', () => {
    it('should parse feet-inches format', () => {
      expect(parseHeightToCm("5'6")).toBe(168) // 5 feet 6 inches ≈ 167.64 cm
      expect(parseHeightToCm("5'0")).toBe(152) // 5 feet ≈ 152.4 cm
      expect(parseHeightToCm("6'2")).toBe(188) // 6 feet 2 inches ≈ 187.96 cm
    })

    it('should parse cm format', () => {
      expect(parseHeightToCm('170cm')).toBe(170)
      expect(parseHeightToCm('170')).toBe(170)
      expect(parseHeightToCm('165 cm')).toBe(165)
    })

    it('should handle invalid input', () => {
      expect(parseHeightToCm('')).toBe(0)
      expect(parseHeightToCm('invalid')).toBe(0)
    })
  })

  describe('formatHeightFromCm', () => {
    it('should format cm to feet-inches', () => {
      expect(formatHeightFromCm(168)).toBe("5'6")
      expect(formatHeightFromCm(152)).toBe("5'0")
      expect(formatHeightFromCm(188)).toBe("6'2")
    })

    it('should handle edge cases', () => {
      expect(formatHeightFromCm(0)).toBe('')
      expect(formatHeightFromCm(-1)).toBe('')
    })
  })
})

describe('Age Range Matching', () => {
  it('should match when within range', () => {
    expect(isWithinAgeRange(25, 21, 30)).toBe(true)
    expect(isWithinAgeRange(21, 21, 30)).toBe(true) // at min
    expect(isWithinAgeRange(30, 21, 30)).toBe(true) // at max
  })

  it('should not match when outside range', () => {
    expect(isWithinAgeRange(20, 21, 30)).toBe(false)
    expect(isWithinAgeRange(31, 21, 30)).toBe(false)
  })

  it('should handle undefined bounds', () => {
    expect(isWithinAgeRange(25, undefined, 30)).toBe(true)
    expect(isWithinAgeRange(25, 21, undefined)).toBe(true)
    expect(isWithinAgeRange(25, undefined, undefined)).toBe(true)
  })
})

describe('Height Range Matching', () => {
  it('should match when within range', () => {
    expect(isWithinHeightRange("5'6", "5'0", "6'0")).toBe(true)
    expect(isWithinHeightRange('170cm', '150cm', '180cm')).toBe(true)
  })

  it('should not match when outside range', () => {
    expect(isWithinHeightRange("4'10", "5'0", "6'0")).toBe(false)
    expect(isWithinHeightRange("6'2", "5'0", "6'0")).toBe(false)
  })

  it('should handle undefined bounds', () => {
    expect(isWithinHeightRange("5'6", undefined, "6'0")).toBe(true)
    expect(isWithinHeightRange("5'6", "5'0", undefined)).toBe(true)
  })
})

describe('Marriage Age Validation', () => {
  it('should validate male minimum age of 21', () => {
    const referenceYear = new Date().getFullYear()
    const validDob = `${referenceYear - 22}-01-01`
    const invalidDob = `${referenceYear - 20}-01-01`

    expect(validateMarriageAge(validDob, 'male').isValid).toBe(true)
    expect(validateMarriageAge(invalidDob, 'male').isValid).toBe(false)
    expect(validateMarriageAge(invalidDob, 'male').minAge).toBe(21)
  })

  it('should validate female minimum age of 18', () => {
    const referenceYear = new Date().getFullYear()
    const validDob = `${referenceYear - 19}-01-01`
    const invalidDob = `${referenceYear - 17}-01-01`

    expect(validateMarriageAge(validDob, 'female').isValid).toBe(true)
    expect(validateMarriageAge(invalidDob, 'female').isValid).toBe(false)
    expect(validateMarriageAge(invalidDob, 'female').minAge).toBe(18)
  })
})

describe('Membership Validation', () => {
  describe('isMembershipActive', () => {
    it('should return true for future end date', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      expect(isMembershipActive(futureDate.toISOString())).toBe(true)
    })

    it('should return true for end date today', () => {
      const today = new Date()
      expect(isMembershipActive(today.toISOString())).toBe(true)
    })

    it('should return false for past end date', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      expect(isMembershipActive(pastDate.toISOString())).toBe(false)
    })

    it('should return false for undefined/null', () => {
      expect(isMembershipActive(undefined)).toBe(false)
      expect(isMembershipActive(null)).toBe(false)
    })
  })

  describe('getMembershipDaysRemaining', () => {
    it('should calculate days correctly', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      expect(getMembershipDaysRemaining(futureDate.toISOString())).toBe(30)
    })

    it('should return 0 for expired membership', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 5)
      expect(getMembershipDaysRemaining(pastDate.toISOString())).toBe(0)
    })
  })
})

describe('Profile ID Generation', () => {
  describe('generateProfileId', () => {
    it('should generate ID in correct format', () => {
      const createdAt = new Date('2024-06-15')
      const id = generateProfileId(createdAt)
      
      expect(id).toMatch(/^SS240615\d{3}$/)
    })

    it('should generate unique IDs', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateProfileId())
      }
      // Should have mostly unique IDs (small chance of collision with 900 possible values)
      expect(ids.size).toBeGreaterThan(85)
    })
  })

  describe('isValidProfileId', () => {
    it('should validate correct profile IDs', () => {
      expect(isValidProfileId('SS240615123')).toBe(true)
      expect(isValidProfileId('SS990101999')).toBe(true)
    })

    it('should reject invalid profile IDs', () => {
      expect(isValidProfileId('')).toBe(false)
      expect(isValidProfileId('SS12345678')).toBe(false) // too short
      expect(isValidProfileId('SS1234567890')).toBe(false) // too long
      expect(isValidProfileId('XX240615123')).toBe(false) // wrong prefix
      expect(isValidProfileId('SS24061512A')).toBe(false) // non-digit
    })
  })
})

describe('Match Score Calculation', () => {
  const baseProfile = {
    religion: 'Hindu',
    caste: 'Brahmin',
    motherTongue: 'Hindi',
    education: 'btech-be',
    occupation: 'employed',
    state: 'Maharashtra',
    city: 'Mumbai',
    age: 28,
    height: "5'8",
  }

  it('should return 100 when all preferences match', () => {
    const preferences = {
      religion: ['Hindu'],
      caste: ['Brahmin'],
      motherTongue: ['Hindi'],
      education: ['btech-be'],
      occupation: ['employed'],
      location: ['Maharashtra', 'Mumbai'],
      ageMin: 25,
      ageMax: 32,
      heightMin: "5'6",
      heightMax: "6'0",
    }

    expect(calculateBasicMatchScore(baseProfile, preferences)).toBe(100)
  })

  it('should return 0 when no preferences match', () => {
    const preferences = {
      religion: ['Muslim'],
      caste: ['Other'],
      motherTongue: ['Tamil'],
      education: ['phd'],
      occupation: ['business-owner'],
      location: ['Delhi'],
      ageMin: 35,
      ageMax: 40,
      heightMin: "6'2",
      heightMax: "6'6",
    }

    expect(calculateBasicMatchScore(baseProfile, preferences)).toBe(0)
  })

  it('should return 100 when no preferences are set', () => {
    expect(calculateBasicMatchScore(baseProfile, {})).toBe(100)
  })

  it('should calculate partial match correctly', () => {
    const preferences = {
      religion: ['Hindu'],     // matches
      caste: ['Other'],        // doesn't match
      motherTongue: ['Hindi'], // matches
    }

    // Religion: 20 points, Mother tongue: 10 points = 30 out of 45
    const score = calculateBasicMatchScore(baseProfile, preferences)
    expect(score).toBeGreaterThan(60)
    expect(score).toBeLessThan(70)
  })
})
