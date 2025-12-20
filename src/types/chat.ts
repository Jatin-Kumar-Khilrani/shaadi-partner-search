export interface ChatMessage {
  id: string
  fromProfileId: string
  fromUserId?: string
  toProfileId: string
  type: 'user' | 'admin' | 'admin-broadcast' | 'admin-to-user' | 'user-to-user'
  message: string
  createdAt: string
  timestamp: string
  readAt?: string
  read?: boolean
}

export interface ChatConversation {
  id: string
  profileId?: string
  participants?: string[]
  lastMessage?: ChatMessage
  unreadCount: number
  updatedAt: string
  timestamp?: string
  createdAt?: string
}
