export type Gender = 'male' | 'female'
export type MaritalStatus = 'never-married' | 'divorced' | 'widowed'
export type TrustLevel = 1 | 2 | 3 | 4 | 5
export type ProfileStatus = 'pending' | 'verified' | 'rejected'
export type MembershipPlan = '6-month' | '1-year'

export interface Profile {
  id: string
  fullName: string
  dateOfBirth: string
  age: number
  gender: Gender
  religion?: string
  caste?: string
  education: string
  occupation: string
  location: string
  country: string
  maritalStatus: MaritalStatus
  email: string
  mobile: string
  photoUrl?: string
  selfieUrl?: string
  bio?: string
  height?: string
  familyDetails?: string
  status: ProfileStatus
  trustLevel: TrustLevel
  createdAt: string
  verifiedAt?: string
  membershipPlan?: MembershipPlan
  membershipExpiry?: string
}

export interface SearchFilters {
  gender?: Gender
  ageMin?: number
  ageMax?: number
  location?: string
  country?: string
  religion?: string
  caste?: string
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
