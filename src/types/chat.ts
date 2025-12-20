export interface ChatMessage {
  id: string
  fromProfileId: string
  fromUserId?: string
  toProfileId: string
  toUserId?: string
  message: string
  timestamp: string
  type: 'user' | 'admin' | 'admin-broadcast' | 'admin-to-user' | 'user-to-user'
  read: boolean
  createdAt: string
  updatedAt?: string
}

export interface ChatConversation {
  id: string
  participants: string[]
  lastMessage: string | ChatMessage
  timestamp: string
  unreadCount: number
  createdAt: string
  updatedAt?: string
}
