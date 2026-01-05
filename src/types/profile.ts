export type Gender = 'male' | 'female'
export type MaritalStatus = 'never-married' | 'divorced' | 'widowed' | 'awaiting-divorce'
export type ProfileStatus = 'pending' | 'verified' | 'rejected'
export type AccountStatus = 'active' | 'deactivated'  // Active/Deactivated based on inactivity
export type DietPreference = 'veg' | 'non-veg' | 'eggetarian'
export type DrinkingHabit = 'never' | 'occasionally' | 'regularly'
export type SmokingHabit = 'never' | 'occasionally' | 'regularly'
export type MembershipPlan = 'free' | '6-month' | '1-year'
export type Manglik = boolean
export type DisabilityStatus = 'no' | 'yes' | 'none' | 'physical' | 'visual' | 'hearing' | 'speech' | 'intellectual' | 'multiple'
export type ResidentialStatus = 
  | 'citizen' 
  | 'permanent-resident' 
  | 'work-permit' 
  | 'student-visa' 
  | 'dependent-visa' 
  | 'temporary-visa' 
  | 'oci' 
  | 'applied-for-pr' 
  | 'applied-for-citizenship' 
  | 'tourist-visa' 
  | 'other'

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
  position?: string  // Job position/designation
  location: string
  city?: string  // City (alias for location for compatibility)
  state?: string
  country: string
  hobbies?: string[]  // List of hobbies/interests
  residentialStatus?: ResidentialStatus  // Required when living outside India
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
  weight?: string
  disability: DisabilityStatus  // Mandatory field
  disabilityDetails?: string    // Optional details about the disability
  familyDetails?: string
  dietPreference?: DietPreference
  manglik?: Manglik
  drinkingHabit?: DrinkingHabit
  smokingHabit?: SmokingHabit
  // Horoscope fields
  birthTime?: string  // Time of birth for horoscope
  birthPlace?: string // Place of birth for horoscope
  horoscopeMatching?: 'mandatory' | 'not-mandatory' | 'decide-later' | 'preferred'  // Horoscope matching preference
  status: ProfileStatus
  rejectionReason?: string  // Reason for profile rejection
  rejectedAt?: string       // When the profile was rejected
  trustLevel: number
  createdAt: string
  updatedAt?: string
  lastEditedAt?: string
  verifiedAt?: string
  membershipPlan?: MembershipPlan
  membershipExpiry?: string
  membershipEndDate?: string  // Alias for membershipExpiry for backward compatibility
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
  // Account status based on inactivity (deactivated after 1 month of inactivity)
  accountStatus?: AccountStatus  // 'active' | 'deactivated'
  deactivatedAt?: string          // When the account was deactivated
  deactivationReason?: 'inactivity' | 'admin' | 'user-request'  // Reason for deactivation
  lastActivityAt?: string         // Last meaningful activity timestamp
  // Reactivation request (for deactivated users)
  reactivationRequested?: boolean
  reactivationRequestedAt?: string
  reactivationApprovedAt?: string
  reactivationApprovedBy?: string  // Admin who approved
  reactivationRejectedAt?: string
  reactivationRejectionReason?: string
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
  digilockerID?: string  // DigiLocker ID for reference
  digilockerVerifiedName?: string  // Name as per DigiLocker
  digilockerVerifiedDob?: string  // DOB as per DigiLocker
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
  idProofRejected?: boolean  // Whether ID proof was rejected
  idProofRejectedAt?: string  // When ID proof was rejected
  idProofRejectionReason?: string  // Reason for ID proof rejection
  // Photo/Face verification (selfie matches uploaded photos)
  photoVerified?: boolean
  photoVerifiedAt?: string
  photoVerifiedBy?: string  // Admin who verified or 'AI' for automatic verification
  photoVerificationNotes?: string  // Notes about photo verification
  photoVerificationConfidence?: number  // AI confidence score if verified by AI
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
  // Plan-based usage tracking (chat requests and contact views)
  chatRequestsUsed?: string[]     // Profile IDs user has initiated chat with
  contactViewsUsed?: string[]     // Profile IDs user has viewed contact info for
  // Legacy fields (kept for backward compatibility, will migrate to new fields)
  freeViewedProfiles?: string[]  // Profile IDs viewed by free user (deprecated)
  freeChatProfiles?: string[]    // Profile IDs chatted by free user (deprecated)
  // Payment verification for paid plans
  paymentScreenshotUrl?: string  // URL to payment screenshot
  paymentStatus?: 'not-required' | 'pending' | 'verified' | 'rejected'
  paymentAmount?: number  // Amount paid
  paymentVerifiedAt?: string
  paymentVerifiedBy?: string  // Admin who verified
  paymentRejectionReason?: string  // Reason if payment rejected
  paymentUploadedAt?: string
  // Renewal payment (for expired memberships)
  renewalPaymentScreenshotUrl?: string
  renewalPaymentStatus?: 'pending' | 'verified' | 'rejected'
  renewalPaymentAmount?: number
  renewalPaymentUploadedAt?: string
  renewalPaymentVerifiedAt?: string
  renewalPaymentRejectionReason?: string
  
  // Partner Search Readiness data (embedded for quick access)
  selfDiscoveryCompleted?: boolean
  eqAssessmentCompleted?: boolean
  expectationsCompleted?: boolean
  readinessScore?: number         // Overall readiness score 0-100
  readinessLevel?: 'beginner' | 'developing' | 'ready' | 'highly-ready'
  hasReadinessBadge?: boolean     // "Ready for Partnership" badge
  aiGeneratedBioUsed?: boolean    // Whether AI bio is being used
  
  // Partner Preferences (captured during registration)
  partnerPreferences?: {
    ageMin?: number
    ageMax?: number
    heightMin?: string
    heightMax?: string
    education?: string[]            // Preferred education levels
    employmentStatus?: string[]     // Preferred employment status
    occupation?: string[]           // Preferred occupations/professions
    livingCountry?: string[]        // Preferred countries partner is living in
    livingState?: string[]          // Preferred states partner is living in
    location?: string[]             // Preferred cities
    country?: string[]              // Preferred countries (native)
    religion?: string[]             // Preferred religions
    caste?: string[]                // Preferred castes
    motherTongue?: string[]         // Preferred mother tongues
    maritalStatus?: MaritalStatus[] // Preferred marital status
    dietPreference?: DietPreference[]
    drinkingHabit?: DrinkingHabit[]
    smokingHabit?: SmokingHabit[]
    manglik?: 'yes' | 'no' | 'doesnt-matter'
    disability?: DisabilityStatus[] // Accepted disability status
    annualIncomeMin?: string        // Minimum annual income preference
    annualIncomeMax?: string        // Maximum annual income preference
  }
}

export interface SearchFilters {
  gender?: Gender
  ageMin?: number
  ageMax?: number
  location?: string
  country?: string
  state?: string
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
  status: 'pending' | 'accepted' | 'declined' | 'blocked' | 'revoked'
  message?: string
  createdAt: string
  approvedBy?: string
  declinedAt?: string
  blockedAt?: string
  revokedAt?: string
  // Track who performed the action for UI display
  declinedBy?: 'sender' | 'receiver'  // Who declined the interest
  revokedBy?: 'sender' | 'receiver'   // Who revoked after acceptance
  // Auto-decline linked to this interest
  contactAutoDeclined?: boolean  // True if contact request was auto-declined when interest was declined
}

export type ReportReason = 
  | 'inappropriate-messages' 
  | 'fake-profile' 
  | 'harassment' 
  | 'spam' 
  | 'offensive-content' 
  | 'other'

export interface BlockedProfile {
  id: string
  blockerProfileId: string
  blockedProfileId: string
  createdAt: string
  reason?: string
  // Report details for admin review
  reportedToAdmin?: boolean
  reportReason?: ReportReason
  reportDescription?: string
  // Admin action tracking
  adminReviewed?: boolean
  adminReviewedAt?: string
  adminAction?: 'dismissed' | 'warned' | 'removed'
  adminNotes?: string
  // Undo/Unblock tracking
  unblockedAt?: string
  isUnblocked?: boolean  // Soft unblock - keeps history but restores visibility
}

// Track declined profiles for undo/reconsider feature
export interface DeclinedProfile {
  id: string
  declinerProfileId: string  // Who did the declining
  declinedProfileId: string  // Who was declined
  type: 'interest' | 'contact'  // What was declined
  declinedAt: string
  reason?: string
  // Reconsider/Undo tracking
  reconsideredAt?: string
  isReconsidered?: boolean  // If user wants to reconsider this profile
}

export interface ContactRequest {
  id: string
  fromUserId: string
  toUserId: string
  fromProfileId: string
  toProfileId?: string
  status: 'pending' | 'approved' | 'declined' | 'revoked'
  createdAt: string
  approvedAt?: string
  declinedAt?: string
  revokedAt?: string
  // Track who performed the action for UI display
  declinedBy?: 'sender' | 'receiver'  // Who declined the contact request
  revokedBy?: 'sender' | 'receiver'   // Who revoked after approval
  // Auto-decline linked to interest decline
  autoDeclinedDueToInterest?: boolean  // True if auto-declined when interest was declined
}

export interface PartnerPreferenceData {
  profileId: string
  gender?: Gender
  ageMin?: number
  ageMax?: number
  heightMin?: string
  heightMax?: string
  maritalStatus?: MaritalStatus[]      // Multi-select marital status preference
  religion?: string[]           // Multi-select religion preference
  caste?: string[]
  community?: string[]
  motherTongue?: string[]       // Multi-select mother tongue preference
  education?: string[]          // Multi-select education preference
  employmentStatus?: string[]   // Multi-select employment status preference
  occupation?: string[]         // Multi-select occupation preference
  livingCountry?: string[]      // Multi-select living country preference
  livingState?: string[]        // Multi-select living state preference
  manglik?: 'yes' | 'no' | 'doesnt-matter'
  dietPreference?: DietPreference[]  // Multi-select diet preference
  drinkingHabit?: DrinkingHabit[]
  smokingHabit?: SmokingHabit[]
  annualIncomeMin?: string      // Minimum annual income preference
  annualIncomeMax?: string      // Maximum annual income preference
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

// ============================================
// Partner Search Readiness System Types
// ============================================

// Personality type (Big Five inspired)
export type PersonalityDimension = 'introvert' | 'balanced' | 'extrovert'
export type ValuesOrientation = 'traditional' | 'moderate' | 'progressive'
export type LifestylePace = 'relaxed' | 'balanced' | 'ambitious'
export type FamilyOrientation = 'joint-family' | 'nuclear-flexible' | 'nuclear-preferred'
export type ConflictStyle = 'avoidant' | 'collaborative' | 'direct'

// EQ Assessment types
export type EQLevel = 'developing' | 'moderate' | 'high'

// Self-Discovery Questionnaire responses
export interface SelfDiscoveryData {
  // Core values
  topValues: ('family' | 'career' | 'spirituality' | 'adventure' | 'stability' | 'growth' | 'creativity' | 'service')[]
  coreValues?: string[]  // Additional core values as free text
  
  // Personality traits
  personalityType: PersonalityDimension
  valuesOrientation: ValuesOrientation
  lifestylePace: LifestylePace
  familyOrientation: FamilyOrientation
  conflictStyle: ConflictStyle
  
  // Lifestyle preferences
  morningPerson: boolean
  socialFrequency: 'rarely' | 'sometimes' | 'often'
  hobbies: string[]
  fitnessImportance: 'low' | 'medium' | 'high'
  travelInterest: 'low' | 'medium' | 'high'
  
  // Growth areas (self-identified)
  growthAreas: ('patience' | 'communication' | 'finance' | 'emotional-control' | 'time-management' | 'flexibility' | 'assertiveness')[]
  
  completedAt: string
}

// Emotional Intelligence Assessment
export interface EQAssessmentData {
  // Situational responses (1-5 scale)
  disagreementHandling: number    // How do you handle disagreements?
  empathyScore: number            // Understanding others' feelings
  emotionalAwareness: number      // Recognizing own emotions
  boundaryRespect: number         // Respecting personal boundaries
  perfectionExpectation: number   // Accepting imperfection
  stressManagement: number        // Handling stress in relationships
  
  // Calculated overall EQ level
  overallEQ: EQLevel
  eqScore: number  // 0-100
  
  completedAt: string
}

// Partner expectations and dealbreakers
export interface PartnerExpectationsData {
  profileId: string
  
  // Must-have qualities (pick 3-5)
  mustHaveQualities: ('respectful' | 'family-oriented' | 'financially-responsible' | 'honest' | 'caring' | 'ambitious' | 'spiritual' | 'educated' | 'supportive' | 'humorous' | 'loyal' | 'patient')[]
  
  // Dealbreakers (pick 3-5)
  dealbreakers: ('smoking' | 'drinking' | 'dishonesty' | 'aggression' | 'irresponsibility' | 'disrespectful' | 'short-tempered' | 'unrealistic-expectations' | 'no-family-values' | 'workaholic' | 'controlling' | 'laziness')[]
  
  // Future expectations
  livingPreference: 'with-parents' | 'nearby-parents' | 'independent' | 'flexible'
  workAfterMarriage: 'must-work' | 'prefer-work' | 'flexible' | 'prefer-homemaker' | 'flexible-homemaker'
  childrenPreference: 'soon' | 'after-few-years' | 'flexible' | 'no-children'
  financialPartnership: 'joint' | 'separate' | 'flexible'
  relocateWillingness: 'willing' | 'prefer-not' | 'not-willing'
  
  // Relationship vision
  relationshipVision: string  // Free text - how do you envision your marriage?
  
  completedAt: string
}

// Readiness score calculation
export interface ReadinessScore {
  profileId: string
  
  // Component scores (0-100)
  selfAwarenessScore: number
  eqScore: number
  expectationClarityScore: number
  communicationScore: number  // Based on activity and chat quality
  safetyScore: number         // Based on verification level
  
  // Overall readiness
  overallScore: number
  readinessLevel: 'beginner' | 'developing' | 'ready' | 'highly-ready'
  hasBadge: boolean           // "Ready for Partnership" badge
  
  // Learning progress
  articlesRead: string[]      // Learning hub article IDs
  videosWatched: string[]     // Learning hub video IDs
  
  lastCalculatedAt: string
}

// AI-generated bio
export interface AIGeneratedBio {
  profileId: string
  generatedBio: string
  generatedStrengths: string[]
  generatedValues: string[]
  generatedHobbies: string[]
  isUsed: boolean             // Whether user chose to use this bio
  generatedAt: string
}

// Compatibility calculation between two profiles
export interface CompatibilityResult {
  profile1Id: string
  profile2Id: string
  
  // Component scores (0-100)
  valuesAlignment: number
  lifestyleCompatibility: number
  emotionalCompatibility: number
  expectationsAlignment: number
  basicMatchScore: number      // Traditional matching (religion, location, etc.)
  
  // Overall
  overallCompatibility: number
  compatibilityLevel: 'low' | 'moderate' | 'good' | 'excellent'
  
  // Insights
  strengths: string[]          // What makes this match good
  considerations: string[]     // Areas to discuss
  
  calculatedAt: string
}

// Learning Hub content
export interface LearningContent {
  id: string
  type: 'article' | 'video' | 'infographic'
  category: 'self-awareness' | 'communication' | 'expectations' | 'safety' | 'family-discussions' | 'relationship-basics'
  title: string
  titleHi: string
  description: string
  descriptionHi: string
  content?: string             // For articles
  contentHi?: string
  videoUrl?: string            // For videos
  imageUrl?: string            // For infographics
  duration?: string            // e.g., "5 min read" or "2:30"
  order: number
  isPublished: boolean
  createdAt: string
}

// Smart conversation starters
export interface ConversationStarter {
  id: string
  category: 'introduction' | 'values' | 'lifestyle' | 'future' | 'family' | 'interests'
  text: string
  textHi: string
  isDefault: boolean
}

// User notification for in-app notifications (stored per profile)
export interface UserNotification {
  id: string
  recipientProfileId: string
  type: 'interest_received' | 'interest_accepted' | 'interest_declined' | 'contact_request_received' | 'contact_accepted' | 'contact_declined' | 'message_received' | 'profile_viewed'
  title: string
  titleHi: string
  description: string
  descriptionHi: string
  senderProfileId?: string
  senderName?: string
  isRead: boolean
  createdAt: string
}
