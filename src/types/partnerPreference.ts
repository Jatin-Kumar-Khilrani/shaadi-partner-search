import type { Gender, DietPreference, DrinkingHabit, SmokingHabit, MaritalStatus } from './profile'

export interface PartnerPreference {
  profileId: string
  gender?: Gender
  ageMin?: number
  ageMax?: number
  heightMin?: string
  heightMax?: string
  maritalStatus?: MaritalStatus[]  // Multi-select marital status preference
  religion?: string[]
  caste?: string[]
  community?: string[]
  motherTongue?: string[]
  education?: string[]            // Multi-select education preference
  employmentStatus?: string[]     // Employment status preference
  occupation?: string[]           // Occupation/Profession preference
  livingCountry?: string[]        // Preferred countries partner is living in
  livingState?: string[]          // Preferred states partner is living in
  location?: string[]             // Preferred cities
  country?: string[]              // Preferred countries (native)
  dietPreference?: DietPreference[]
  drinkingHabit?: DrinkingHabit[]
  smokingHabit?: SmokingHabit[]
  manglik?: 'yes' | 'no' | 'doesnt-matter'
  annualIncomeMin?: string        // Minimum annual income preference
  annualIncomeMax?: string        // Maximum annual income preference
  salaryMin?: string              // Deprecated: use annualIncomeMin
  salaryMax?: string              // Deprecated: use annualIncomeMax
}
