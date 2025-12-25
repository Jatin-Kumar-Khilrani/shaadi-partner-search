import type { Gender, DietPreference, DrinkingHabit, SmokingHabit, Manglik } from './profile'

export interface PartnerPreference {
  profileId: string
  gender?: Gender
  ageMin?: number
  ageMax?: number
  heightMin?: string
  heightMax?: string
  maritalStatus?: string[]
  religion?: string[]
  caste?: string[]
  community?: string[]
  motherTongue?: string[]
  education?: string[]
  employmentStatus?: string[]     // Employment status preference
  occupation?: string[]           // Occupation/Profession preference
  livingCountry?: string[]        // Preferred countries partner is living in
  livingState?: string[]          // Preferred states partner is living in
  location?: string[]             // Preferred cities
  country?: string[]              // Preferred countries (native)
  dietPreference?: DietPreference[]
  drinkingHabit?: DrinkingHabit[]
  smokingHabit?: SmokingHabit[]
  manglik?: Manglik[]
  annualIncomeMin?: string        // Minimum annual income preference
  annualIncomeMax?: string        // Maximum annual income preference
  salaryMin?: string              // Deprecated: use annualIncomeMin
  salaryMax?: string              // Deprecated: use annualIncomeMax
}
