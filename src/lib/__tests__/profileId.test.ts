import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateProfileId, validateProfileIdFormat } from '../profileId'

describe('profileId utilities', () => {
  describe('generateProfileId', () => {
    beforeEach(() => {
      // Mock Math.random to get predictable results
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
    })

    it('generates profile ID with correct format', () => {
      const profileId = generateProfileId('John', 'Doe', '1990-05-15')
      
      // Should be 8 characters: 2 letters + 4 digits + 2 year digits
      expect(profileId).toHaveLength(8)
      expect(profileId).toMatch(/^[A-Z]{2}\d{6}$/)
    })

    it('uses first letter of first name and last name', () => {
      const profileId = generateProfileId('Amit', 'Kumar', '1985-03-20')
      
      expect(profileId).toMatch(/^AK/)
    })

    it('handles lowercase names correctly', () => {
      const profileId = generateProfileId('priya', 'sharma', '1992-07-10')
      
      expect(profileId).toMatch(/^PS/)
    })

    it('extracts last two digits of birth year', () => {
      const profileId = generateProfileId('Test', 'User', '1995-01-01')
      
      expect(profileId).toMatch(/95$/)
    })

    it('handles different birth years', () => {
      const profileId2000 = generateProfileId('A', 'B', '2000-06-15')
      const profileId1988 = generateProfileId('C', 'D', '1988-12-25')
      
      expect(profileId2000).toMatch(/00$/)
      expect(profileId1988).toMatch(/88$/)
    })

    it('includes random digits in the middle', () => {
      // With Math.random mocked to 0.5: 0.5 * 9000 + 1000 = 5500
      const profileId = generateProfileId('John', 'Doe', '1990-05-15')
      
      expect(profileId).toContain('5500')
    })
  })

  describe('validateProfileIdFormat', () => {
    it('returns true for valid profile ID format', () => {
      expect(validateProfileIdFormat('AB123456')).toBe(true)
      expect(validateProfileIdFormat('JD550095')).toBe(true)
      expect(validateProfileIdFormat('XY999999')).toBe(true)
    })

    it('returns false for invalid formats', () => {
      // Too short
      expect(validateProfileIdFormat('AB12345')).toBe(false)
      
      // Too long
      expect(validateProfileIdFormat('AB1234567')).toBe(false)
      
      // Lowercase letters
      expect(validateProfileIdFormat('ab123456')).toBe(false)
      
      // Letters in wrong position
      expect(validateProfileIdFormat('A1234567')).toBe(false)
      expect(validateProfileIdFormat('123456AB')).toBe(false)
      
      // Special characters
      expect(validateProfileIdFormat('AB-12345')).toBe(false)
      
      // Empty string
      expect(validateProfileIdFormat('')).toBe(false)
    })

    it('returns false for null/undefined-like inputs', () => {
      // @ts-expect-error - testing invalid input
      expect(validateProfileIdFormat(null)).toBe(false)
      // @ts-expect-error - testing invalid input
      expect(validateProfileIdFormat(undefined)).toBe(false)
    })
  })
})
