export type Gender = 'male' | 'female'
export type MaritalStatus = 'never-married' | 'divorced' | 'widowed'
export type TrustLevel = 1 | 2 | 3 | 4 | 5
export type ProfileStatus = 'pending' | 'verified' | 'rejected'

export interface Profile {
  id: string
  fullName: string
  dateOfBirth: string
  age: number
  gender: Gender
  gotra: string
  education: string
  occupation: string
  location: string
  country: string
  maritalStatus: MaritalStatus
  email: string
  mobile: string
  photoUrl?: string
  bio?: string
  height?: string
  familyDetails?: string
  status: ProfileStatus
  trustLevel: TrustLevel
  createdAt: string
  verifiedAt?: string
}

export interface SearchFilters {
  gender?: Gender
  ageMin?: number
  ageMax?: number
  location?: string
  country?: string
  gotra?: string
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
