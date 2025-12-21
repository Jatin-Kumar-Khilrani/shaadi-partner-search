export interface User {
  userId: string
  password: string
  profileId: string
  createdAt: string
  // Password management
  firstLogin?: boolean // True if user has never logged in
  passwordChangedAt?: string // Last password change timestamp
  passwordResetOtp?: string // OTP for password reset
  passwordResetExpiry?: string // OTP expiry timestamp
}

export interface LoginCredentials {
  userId: string
  password: string
}
