export type Gender = 'male' | 'female'
export type MaritalStatus = 'never-married' | 'divorced' | 'widowed'
export type ProfileStatus = 'pending' | 'v
export type DietPreference = 'veg' | 'non-veg' | 'eggetarian'
export type DrinkingHabit = 'never' | 'occasional

  id: string
  firstName: string
export type SmokingHabit = 'never' | 'occasionally' | 'regularly'

export interface Profile {
  id: string
  profileId: string
  firstName: string
  lastName: string
  fullName: string
  education: string
  salary?: st
  country: strin
  email: string
  relationToProf
  hideMobile: boolea
  selfieUrl?: string
  height?: string
  dietPreference?: D
  drinkingHabit?:
  status: ProfileS
  createdAt: stri
  membershipPlan?: MembershipP
  emailVerified
  isBlocked: boo
  adminNotes?: string

  gender?: Gender
  ageMax?: number
  country?: string
  caste?: stri
  motherTongue?: 
  manglik?: Manglik
  drinkingHabit?: DrinkingHabit
}
export interface Interest {
  fromProfileId: string
  status: 'pending' | '
  message?: string

  id: string
  toProfileId: string
  createdAt: string
  approvedBy?: string

  id: string
  toUserId: string
  toProfileId?: strin
 


  profileId: stri
  ageMax?: number
  heightMax?: str
  caste?: string[]
  motherTongue?: s
  occupation?: stri
  manglik?: Mang
  education?: string
}

export interface Volunteer {
  id: string
  name: string
  city: string
  mobile: string
  role: string
}

export interface Resource {
  id: string
  title: string
  description: string
  category: 'traditions' | 'gotra' | 'advice' | 'safety'
  content: string
}

export interface WeddingService {
  id: string
  category: 'venue' | 'caterer' | 'photographer' | 'decorator' | 'mehandi' | 'makeup' | 'dj' | 'priest' | 'card-designer' | 'choreographer' | 'other'
  businessName: string
  contactPerson: string
  mobile: string
  email: string
  address: string
  city: string
  state: string
  description: string
  priceRange: string
  photos?: string[]
  rating?: number
  reviewCount?: number
  verificationStatus: 'pending' | 'verified' | 'rejected'
  createdAt: string
  consultationFee: number
}
  dietPreference?: DietPreference[]
  drinkingHabit?: DrinkingHabit[]
  smokingHabit?: SmokingHabit[]
}

export interface Volunteer {
  id: string
  name: string
  city: string
  mobile: string
  role: string
}

export interface Resource {
  id: string
  title: string
  description: string
  category: 'traditions' | 'gotra' | 'advice' | 'safety'
  content: string
}

export interface WeddingService {
  id: string
  category: 'venue' | 'caterer' | 'photographer' | 'decorator' | 'mehandi' | 'makeup' | 'dj' | 'priest' | 'card-designer' | 'choreographer' | 'other'
  businessName: string
  contactPerson: string
  mobile: string
  email: string
  address: string
  city: string
  state: string
  description: string
  priceRange: string
  photos?: string[]
  rating?: number
  reviewCount?: number
  verificationStatus: 'pending' | 'verified' | 'rejected'
  createdAt: string
  consultationFee: number
}
