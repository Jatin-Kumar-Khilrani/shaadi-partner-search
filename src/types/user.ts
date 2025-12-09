export interface User {
  userId: string
  password: string
  profileId: string
  createdAt: string
}

export interface LoginCredentials {
  userId: string
  password: string
}
