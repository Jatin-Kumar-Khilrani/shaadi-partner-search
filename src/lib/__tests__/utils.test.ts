import { describe, it, expect } from 'vitest'
import { 
  cn, 
  formatEducation, 
  formatOccupation, 
  formatDateDDMMYYYY, 
  calculateMatchPercentage,
  formatEducationArray,
  formatOccupationArray,
  hasOnlyNonCriticalChanges,
  CRITICAL_EDIT_FIELDS,
  NON_CRITICAL_EDIT_FIELDS
} from '../utils'
import type { Profile } from '@/types/profile'

describe('cn (className merger)', () => {
  it('should merge class names correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const isHidden = false
    expect(cn('base', isActive && 'active', isHidden && 'hidden')).toBe('base active')
  })

  it('should merge conflicting Tailwind classes', () => {
    // tailwind-merge should keep the last conflicting class
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('should handle arrays and objects', () => {
    expect(cn(['base', 'extra'], { active: true, hidden: false })).toBe('base extra active')
  })

  it('should handle empty inputs', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
    expect(cn(null, undefined, '')).toBe('')
  })
})

describe('formatEducation', () => {
  it('should format education values in English', () => {
    expect(formatEducation('btech-be', 'en')).toBe('B.Tech/B.E.')
    expect(formatEducation('phd', 'en')).toBe('PhD/Doctorate')
    expect(formatEducation('mba', 'en')).toBe('MBA')
    expect(formatEducation('ca', 'en')).toBe('Chartered Accountant (CA)')
  })

  it('should format education values in Hindi', () => {
    expect(formatEducation('btech-be', 'hi')).toBe('बी.टेक/बी.ई.')
    expect(formatEducation('phd', 'hi')).toBe('पीएचडी')
    expect(formatEducation('mba', 'hi')).toBe('एमबीए')
  })

  it('should default to English', () => {
    expect(formatEducation('mba')).toBe('MBA')
  })

  it('should return empty string for undefined/empty', () => {
    expect(formatEducation(undefined)).toBe('')
    expect(formatEducation('')).toBe('')
  })

  it('should return original value for unknown education', () => {
    expect(formatEducation('unknown-degree')).toBe('unknown-degree')
  })
})

describe('formatOccupation', () => {
  it('should format occupation values in English', () => {
    expect(formatOccupation('employed', 'en')).toBe('Employed')
    expect(formatOccupation('self-employed', 'en')).toBe('Self-Employed')
    expect(formatOccupation('govt-employee', 'en')).toBe('Government Employee')
    expect(formatOccupation('business-owner', 'en')).toBe('Business Owner')
  })

  it('should format occupation values in Hindi', () => {
    expect(formatOccupation('employed', 'hi')).toBe('नौकरीपेशा')
    expect(formatOccupation('homemaker', 'hi')).toBe('गृहिणी')
    expect(formatOccupation('student', 'hi')).toBe('विद्यार्थी')
  })

  it('should map legacy occupation values', () => {
    expect(formatOccupation('software-it', 'en')).toBe('Employed')
    expect(formatOccupation('engineer', 'en')).toBe('Employed')
    expect(formatOccupation('civil-services', 'en')).toBe('Government Employee')
  })

  it('should return empty string for undefined/empty', () => {
    expect(formatOccupation(undefined)).toBe('')
    expect(formatOccupation('')).toBe('')
  })
})

describe('formatDateDDMMYYYY', () => {
  it('should format ISO date strings correctly', () => {
    expect(formatDateDDMMYYYY('2024-06-15')).toBe('15/06/2024')
    expect(formatDateDDMMYYYY('2000-01-01')).toBe('01/01/2000')
    expect(formatDateDDMMYYYY('1995-12-31')).toBe('31/12/1995')
  })

  it('should handle ISO datetime strings', () => {
    expect(formatDateDDMMYYYY('2024-06-15T10:30:00Z')).toBe('15/06/2024')
  })

  it('should return empty string for empty input', () => {
    expect(formatDateDDMMYYYY('')).toBe('')
  })

  it('should return empty string for invalid dates', () => {
    expect(formatDateDDMMYYYY('invalid-date')).toBe('')
    expect(formatDateDDMMYYYY('2024-13-45')).toBe('') // Invalid month/day - may vary by browser
  })

  it('should pad single digit days and months', () => {
    expect(formatDateDDMMYYYY('2024-01-05')).toBe('05/01/2024')
    expect(formatDateDDMMYYYY('2024-09-09')).toBe('09/09/2024')
  })
})

describe('calculateMatchPercentage', () => {
  const createProfile = (overrides: Partial<Profile> = {}): Profile => ({
    id: '1',
    profileId: 'TEST001',
    fullName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    mobile: '+91 9876543210',
    gender: 'male',
    dateOfBirth: '1995-01-01',
    age: 30,
    maritalStatus: 'never-married',
    membershipPlan: 'free',
    status: 'verified',
    createdAt: new Date().toISOString(),
    trustLevel: 1,
    ...overrides,
  } as Profile)

  it('should return 0 when viewer has no partner preferences', () => {
    const viewer = createProfile({ partnerPreferences: undefined })
    const target = createProfile({ age: 28, religion: 'Hindu' })
    expect(calculateMatchPercentage(viewer, target)).toBe(0)
  })

  it('should match age preferences exactly', () => {
    const viewer = createProfile({
      partnerPreferences: { ageMin: 25, ageMax: 35 }
    })
    const target = createProfile({ age: 30 })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should partially match age within 2 years of range', () => {
    const viewer = createProfile({
      partnerPreferences: { ageMin: 25, ageMax: 30 }
    })
    const target = createProfile({ age: 32 }) // 2 years above max
    expect(calculateMatchPercentage(viewer, target)).toBe(50)
  })

  it('should not match age outside 2 years range', () => {
    const viewer = createProfile({
      partnerPreferences: { ageMin: 25, ageMax: 30 }
    })
    const target = createProfile({ age: 35 }) // 5 years above max
    expect(calculateMatchPercentage(viewer, target)).toBe(0)
  })

  it('should match religion preferences', () => {
    const viewer = createProfile({
      partnerPreferences: { religion: ['Hindu', 'Jain'] }
    })
    const target = createProfile({ religion: 'Hindu' })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should not match non-preferred religion', () => {
    const viewer = createProfile({
      partnerPreferences: { religion: ['Hindu'] }
    })
    const target = createProfile({ religion: 'Christian' })
    expect(calculateMatchPercentage(viewer, target)).toBe(0)
  })

  it('should match caste preferences', () => {
    const viewer = createProfile({
      partnerPreferences: { caste: ['Brahmin', 'Rajput'] }
    })
    const target = createProfile({ caste: 'Brahmin' })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should match mother tongue preferences', () => {
    const viewer = createProfile({
      partnerPreferences: { motherTongue: ['Hindi', 'Punjabi'] }
    })
    const target = createProfile({ motherTongue: 'Hindi' })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should match education preferences', () => {
    const viewer = createProfile({
      partnerPreferences: { education: ['btech-be', 'mba'] }
    })
    const target = createProfile({ education: 'mba' })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should match employment status preferences', () => {
    const viewer = createProfile({
      partnerPreferences: { employmentStatus: ['employed', 'self-employed'] }
    })
    const target = createProfile({ occupation: 'employed' })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should match living country preferences', () => {
    const viewer = createProfile({
      partnerPreferences: { livingCountry: ['India', 'USA'] }
    })
    const target = createProfile({ country: 'India' })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should match living state preferences', () => {
    const viewer = createProfile({
      partnerPreferences: { livingState: ['Maharashtra', 'Gujarat'] }
    })
    const target = createProfile({ state: 'Maharashtra' })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should match marital status preferences', () => {
    const viewer = createProfile({
      partnerPreferences: { maritalStatus: ['never-married', 'divorced'] }
    })
    const target = createProfile({ maritalStatus: 'never-married' })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should match diet preferences', () => {
    const viewer = createProfile({
      partnerPreferences: { dietPreference: ['veg', 'eggetarian'] }
    })
    const target = createProfile({ dietPreference: 'veg' })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should match drinking habit preferences', () => {
    const viewer = createProfile({
      partnerPreferences: { drinkingHabit: ['never', 'occasionally'] }
    })
    const target = createProfile({ drinkingHabit: 'never' })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should match smoking habit preferences', () => {
    const viewer = createProfile({
      partnerPreferences: { smokingHabit: ['never'] }
    })
    const target = createProfile({ smokingHabit: 'never' })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should match manglik preferences (yes)', () => {
    const viewer = createProfile({
      partnerPreferences: { manglik: 'yes' }
    })
    const target = createProfile({ manglik: true })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should match manglik preferences (no)', () => {
    const viewer = createProfile({
      partnerPreferences: { manglik: 'no' }
    })
    const target = createProfile({ manglik: false })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should ignore manglik if doesnt-matter', () => {
    const viewer = createProfile({
      partnerPreferences: { manglik: 'doesnt-matter', religion: ['Hindu'] }
    })
    const target = createProfile({ manglik: true, religion: 'Hindu' })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should match disability preferences', () => {
    const viewer = createProfile({
      partnerPreferences: { disability: ['none'] }
    })
    const target = createProfile({ disability: 'none' })
    expect(calculateMatchPercentage(viewer, target)).toBe(100)
  })

  it('should calculate weighted match for multiple criteria', () => {
    const viewer = createProfile({
      partnerPreferences: {
        ageMin: 25,
        ageMax: 35,
        religion: ['Hindu'],
        caste: ['Brahmin'],
        education: ['mba'],
      }
    })
    const target = createProfile({
      age: 30,
      religion: 'Hindu',
      caste: 'Rajput', // Non-matching
      education: 'mba',
    })
    // Age: 2/2, Religion: 2/2, Caste: 0/1, Education: 1.5/1.5
    // Total: 5.5/6.5 = ~85%
    const result = calculateMatchPercentage(viewer, target)
    expect(result).toBeGreaterThan(80)
    expect(result).toBeLessThan(90)
  })

  it('should handle partial age match below minimum', () => {
    const viewer = createProfile({
      partnerPreferences: { ageMin: 30, ageMax: 40 }
    })
    const target = createProfile({ age: 28 }) // 2 years below min
    expect(calculateMatchPercentage(viewer, target)).toBe(50)
  })

  it('should return 0 when no criteria set', () => {
    const viewer = createProfile({
      partnerPreferences: {}
    })
    const target = createProfile({ age: 30 })
    expect(calculateMatchPercentage(viewer, target)).toBe(0)
  })
})

describe('formatEducationArray', () => {
  it('should format multiple education values', () => {
    expect(formatEducationArray(['mba', 'btech-be'], 'en')).toBe('MBA, B.Tech/B.E.')
  })

  it('should return "Any" for empty array', () => {
    expect(formatEducationArray([], 'en')).toBe('Any')
    expect(formatEducationArray(undefined, 'en')).toBe('Any')
  })

  it('should return Hindi "Any" for empty array in Hindi', () => {
    expect(formatEducationArray([], 'hi')).toBe('कोई भी')
    expect(formatEducationArray(undefined, 'hi')).toBe('कोई भी')
  })

  it('should format single value', () => {
    expect(formatEducationArray(['phd'], 'en')).toBe('PhD/Doctorate')
  })
})

describe('formatOccupationArray', () => {
  it('should format multiple occupation values', () => {
    expect(formatOccupationArray(['employed', 'self-employed'], 'en')).toBe('Employed, Self-Employed')
  })

  it('should return "Any" for empty array', () => {
    expect(formatOccupationArray([], 'en')).toBe('Any')
    expect(formatOccupationArray(undefined, 'en')).toBe('Any')
  })

  it('should return Hindi "Any" for empty array in Hindi', () => {
    expect(formatOccupationArray([], 'hi')).toBe('कोई भी')
    expect(formatOccupationArray(undefined, 'hi')).toBe('कोई भी')
  })

  it('should format single value', () => {
    expect(formatOccupationArray(['homemaker'], 'en')).toBe('Homemaker')
  })
})

describe('hasOnlyNonCriticalChanges', () => {
  it('should return true when only non-critical fields change', () => {
    const oldProfile = { fullName: 'John Doe', religion: 'Hindu' }
    const newProfile = { fullName: 'John Doe', religion: 'Jain' }
    expect(hasOnlyNonCriticalChanges(oldProfile, newProfile)).toBe(true)
  })

  it('should return false when critical field fullName changes', () => {
    const oldProfile = { fullName: 'John Doe', religion: 'Hindu' }
    const newProfile = { fullName: 'Jane Doe', religion: 'Hindu' }
    expect(hasOnlyNonCriticalChanges(oldProfile, newProfile)).toBe(false)
  })

  it('should return false when critical field email changes', () => {
    const oldProfile = { email: 'old@test.com', occupation: 'employed' }
    const newProfile = { email: 'new@test.com', occupation: 'employed' }
    expect(hasOnlyNonCriticalChanges(oldProfile, newProfile)).toBe(false)
  })

  it('should return false when critical field mobile changes', () => {
    const oldProfile = { mobile: '+91 1234567890', education: 'mba' }
    const newProfile = { mobile: '+91 9876543210', education: 'mba' }
    expect(hasOnlyNonCriticalChanges(oldProfile, newProfile)).toBe(false)
  })

  it('should return false when critical field dateOfBirth changes', () => {
    const oldProfile = { dateOfBirth: '1995-01-01', caste: 'Brahmin' }
    const newProfile = { dateOfBirth: '1996-02-02', caste: 'Brahmin' }
    expect(hasOnlyNonCriticalChanges(oldProfile, newProfile)).toBe(false)
  })

  it('should return false when critical field gender changes', () => {
    const oldProfile: Partial<Profile> = { gender: 'male', height: '5.8' }
    const newProfile: Partial<Profile> = { gender: 'female', height: '5.8' }
    expect(hasOnlyNonCriticalChanges(oldProfile, newProfile)).toBe(false)
  })

  it('should return false when photos array changes (different length)', () => {
    const oldProfile = { photos: ['photo1.jpg'], occupation: 'employed' }
    const newProfile = { photos: ['photo1.jpg', 'photo2.jpg'], occupation: 'employed' }
    expect(hasOnlyNonCriticalChanges(oldProfile, newProfile)).toBe(false)
  })

  it('should return false when photos array changes (different content)', () => {
    const oldProfile = { photos: ['photo1.jpg'], religion: 'Hindu' }
    const newProfile = { photos: ['photo2.jpg'], religion: 'Hindu' }
    expect(hasOnlyNonCriticalChanges(oldProfile, newProfile)).toBe(false)
  })

  it('should return true when photos are the same', () => {
    const oldProfile = { photos: ['photo1.jpg'], religion: 'Hindu' }
    const newProfile = { photos: ['photo1.jpg'], religion: 'Jain' }
    expect(hasOnlyNonCriticalChanges(oldProfile, newProfile)).toBe(true)
  })

  it('should return true when no fields change', () => {
    const oldProfile = { fullName: 'John Doe', email: 'test@test.com' }
    const newProfile = { fullName: 'John Doe', email: 'test@test.com' }
    expect(hasOnlyNonCriticalChanges(oldProfile, newProfile)).toBe(true)
  })

  it('should handle undefined to empty string as no change', () => {
    const oldProfile = { fullName: undefined, religion: 'Hindu' }
    const newProfile = { fullName: '', religion: 'Jain' }
    expect(hasOnlyNonCriticalChanges(oldProfile, newProfile)).toBe(true)
  })

  it('should handle empty arrays correctly', () => {
    const oldProfile = { photos: [], religion: 'Hindu' }
    const newProfile = { photos: [], religion: 'Jain' }
    expect(hasOnlyNonCriticalChanges(oldProfile, newProfile)).toBe(true)
  })

  it('should return false when selfieUrl changes', () => {
    const oldProfile = { selfieUrl: 'old-selfie.jpg' }
    const newProfile = { selfieUrl: 'new-selfie.jpg' }
    expect(hasOnlyNonCriticalChanges(oldProfile, newProfile)).toBe(false)
  })

  it('should return false when idProofUrl changes', () => {
    const oldProfile = { idProofUrl: 'old-id.jpg' }
    const newProfile = { idProofUrl: 'new-id.jpg' }
    expect(hasOnlyNonCriticalChanges(oldProfile, newProfile)).toBe(false)
  })
})

describe('Field Constants', () => {
  it('should have CRITICAL_EDIT_FIELDS defined', () => {
    expect(CRITICAL_EDIT_FIELDS).toBeDefined()
    expect(Array.isArray(CRITICAL_EDIT_FIELDS)).toBe(true)
    expect(CRITICAL_EDIT_FIELDS).toContain('fullName')
    expect(CRITICAL_EDIT_FIELDS).toContain('email')
    expect(CRITICAL_EDIT_FIELDS).toContain('mobile')
    expect(CRITICAL_EDIT_FIELDS).toContain('photos')
  })

  it('should have NON_CRITICAL_EDIT_FIELDS defined', () => {
    expect(NON_CRITICAL_EDIT_FIELDS).toBeDefined()
    expect(Array.isArray(NON_CRITICAL_EDIT_FIELDS)).toBe(true)
    expect(NON_CRITICAL_EDIT_FIELDS).toContain('religion')
    expect(NON_CRITICAL_EDIT_FIELDS).toContain('education')
    expect(NON_CRITICAL_EDIT_FIELDS).toContain('occupation')
  })

  it('should have no overlap between critical and non-critical fields', () => {
    const overlap = CRITICAL_EDIT_FIELDS.filter(f => 
      NON_CRITICAL_EDIT_FIELDS.includes(f as any)
    )
    expect(overlap).toHaveLength(0)
  })
})
