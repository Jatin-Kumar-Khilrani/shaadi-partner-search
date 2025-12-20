export type Gender = 'male' | 'female'
export type MaritalStatus = 'never-married' | 'divorced' | 'widowed'
export type TrustLevel = 1 | 2 | 3 | 4 | 5
export type ProfileStatus = 'pending' | 'verified' | 'rejected' | 'hold'
export type MembershipPlan = '6-month' | '1-year'
export type DietPreference = 'veg' | 'non-veg' | 'eggetarian'
export type Manglik = 'yes' | 'no' | 'anshik' | 'not-sure'
export type DrinkingHabit = 'never' | 'occasionally' | 'regularly'
export type SmokingHabit = 'never' | 'occasionally' | 'regularly'

export interface Profile {
  id: string
  profileId: string
  firstName: string
  lastName: string
  fullName: string
  dateOfBirth: string
  age: number
  gender: Gender
  religion?: string
  caste?: string
  community?: string
  motherTongue?: string
  education: string
  occupation: string
  salary?: string
  location: string
  country: string
  maritalStatus: MaritalStatus
  email: string
  mobile: string
  relationToProfile: string
  hideEmail: boolean
  hideMobile: boolean
  photos: string[]
  selfieUrl?: string
  bio?: string
  height?: string
  familyDetails?: string
  dietPreference?: DietPreference
  manglik?: Manglik
  drinkingHabit?: DrinkingHabit
  smokingHabit?: SmokingHabit
  status: ProfileStatus
  trustLevel: TrustLevel
  createdAt: string
  verifiedAt?: string
  membershipPlan?: MembershipPlan
  membershipExpiry?: string
  emailVerified: boolean
  mobileVerified: boolean
  isBlocked: boolean
  blockedReason?: string
  adminNotes?: string
}

export interface SearchFilters {
  gender?: Gender
  ageMin?: number
  ageMax?: number
  location?: string
  country?: string
  religion?: string
  caste?: string
  community?: string
  motherTongue?: string
  education?: string
  manglik?: Manglik
  dietPreference?: DietPreference
  drinkingHabit?: DrinkingHabit
  smokingHabit?: SmokingHabit
}

export interface Interest {
  id: string
  fromProfileId: string
  toProfileId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  message?: string
}

export interface ContactRequest {
  id: string
  fromProfileId: string
  toProfileId: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  approvedAt?: string
  approvedBy?: string
}

export interface ChatMessage {
  id: string
  fromUserId: string
  toUserId: string
  fromProfileId?: string
  toProfileId?: string
  message: string
  timestamp: string
  read: boolean
  type: 'admin-to-user' | 'user-to-user' | 'admin-broadcast'
}

export interface PartnerPreferences {
  profileId: string
  ageMin?: number
  ageMax?: number
  heightMin?: string
  heightMax?: string
  religion?: string[]
  caste?: string[]
  community?: string[]
  motherTongue?: string[]
  education?: string[]
  occupation?: string[]
  location?: string[]
  manglik?: Manglik
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
