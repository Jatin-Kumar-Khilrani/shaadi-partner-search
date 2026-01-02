import { describe, it, expect } from 'vitest'
import { cn, formatEducation, formatOccupation, formatDateDDMMYYYY } from '../utils'

describe('cn (className merger)', () => {
  it('should merge class names correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active', false && 'hidden')).toBe('base active')
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
