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
  occupation?: string[]
  location?: string[]
  country?: string[]
  dietPreference?: DietPreference[]
  drinkingHabit?: DrinkingHabit[]
  smokingHabit?: SmokingHabit[]
  manglik?: Manglik[]
  salaryMin?: string
  salaryMax?: string
}
