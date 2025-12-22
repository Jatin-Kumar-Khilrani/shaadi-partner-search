export type Gender = 'male' | 'female'
export type MaritalStatus = 'never-married' | 'divorced' | 'widowed'
export type ProfileStatus = 'pending' | 'verified' | 'rejected'
export type DietPreference = 'veg' | 'non-veg' | 'eggetarian'
export type DrinkingHabit = 'never' | 'occasionally' | 'regularly'
export type SmokingHabit = 'never' | 'occasionally' | 'regularly'
export type MembershipPlan = 'free' | '6-month' | '1-year'
export type Manglik = boolean

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
  state?: string
  country: string
  maritalStatus: MaritalStatus
  email: string
  mobile: string
  relationToProfile?: string
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
  trustLevel: number
  createdAt: string
  updatedAt?: string
  lastEditedAt?: string
  verifiedAt?: string
  membershipPlan?: MembershipPlan
  membershipExpiry?: string
  emailVerified: boolean
  mobileVerified: boolean
  isBlocked: boolean
  adminNotes?: string
  // Return to edit feature - allows admin to send profile back for user to edit
  returnedForEdit?: boolean
  editReason?: string
  returnedAt?: string
  // Last login tracking
  lastLoginAt?: string
  // Soft delete feature - profile hidden from everyone but admin
  isDeleted?: boolean
  deletedAt?: string
  deletedReason?: string
  // DigiLocker/Aadhaar verification for identity proof
  digilockerVerified?: boolean
  digilockerVerifiedAt?: string
  digilockerVerifiedBy?: string  // Admin who verified or 'Self' for user verification
  digilockerDocumentType?: 'aadhaar' | 'pan' | 'driving-license' | 'passport'
  digilockerNotes?: string
  // Aadhaar OTP verification data (from registration)
  aadhaarVerified?: boolean
  aadhaarVerifiedAt?: string
  aadhaarLastFour?: string  // Last 4 digits for reference
  aadhaarVerifiedName?: string  // Name as per Aadhaar
  aadhaarVerifiedDob?: string   // DOB as per Aadhaar
  // Government ID proof for name/DOB verification (mandatory at registration)
  idProofUrl?: string  // URL to uploaded ID proof image
  idProofType?: 'aadhaar' | 'pan' | 'driving-license' | 'passport' | 'voter-id'
  idProofUploadedAt?: string
  idProofVerified?: boolean
  idProofVerifiedAt?: string
  idProofVerifiedBy?: string  // Admin who verified
  idProofNotes?: string  // Admin notes about ID verification
  // Geolocation data captured during registration
  registrationLocation?: {
    latitude: number
    longitude: number
    accuracy: number
    city?: string
    region?: string
    country?: string
    capturedAt: string
  }
  // Free user view/chat limits
  freeViewedProfiles?: string[]  // Profile IDs viewed by free user (max 2)
  freeChatProfiles?: string[]    // Profile IDs chatted by free user (max 2)
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
  occupation?: string
  manglik?: Manglik
  dietPreference?: DietPreference
  drinkingHabit?: DrinkingHabit
  smokingHabit?: SmokingHabit
}

export interface Interest {
  id: string
  fromProfileId: string
  toProfileId: string
  status: 'pending' | 'accepted' | 'declined' | 'blocked'
  message?: string
  createdAt: string
  approvedBy?: string
  declinedAt?: string
  blockedAt?: string
}

export interface BlockedProfile {
  id: string
  blockerProfileId: string
  blockedProfileId: string
  createdAt: string
  reason?: string
}

export interface ContactRequest {
  id: string
  fromUserId: string
  toUserId: string
  fromProfileId: string
  toProfileId?: string
  status: 'pending' | 'approved' | 'declined'
  createdAt: string
}

export interface PartnerPreferenceData {
  profileId: string
  gender?: Gender
  ageMin?: number
  ageMax?: number
  heightMin?: string
  heightMax?: string
  caste?: string[]
  community?: string[]
  motherTongue?: string[]
  education?: string
  occupation?: string
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

export interface PaymentTransaction {
  id: string
  transactionId: string // Manual entry by admin
  profileId: string
  profileName: string
  profileMobile: string
  profileEmail: string
  plan: MembershipPlan
  amount: number
  discountAmount: number
  finalAmount: number
  paymentMode: 'cash' | 'upi' | 'card' | 'netbanking' | 'cheque' | 'other'
  paymentDate: string
  expiryDate: string
  receiptNumber: string
  notes?: string
  createdAt: string
  createdBy: string // Admin who recorded this
  // Refund tracking
  isRefunded?: boolean
  refundAmount?: number
  refundDate?: string
  refundReason?: string
  refundTransactionId?: string
  refundedBy?: string
}
