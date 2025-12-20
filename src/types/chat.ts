export interface ChatMessage {
  id: string
  fromProfileId: string
  toProfileId?: string
  message: string
  type: 'user' | 'admin' | 'admin-broadcast' | 'admin-to-user' | 'user-to-user'
  timestamp: string
  read: boolean
  fromUserId?: string
  toUserId?: string
}

export interface ChatConversation {
  id: string
  participants: string[]
  lastMessage: ChatMessage
  timestamp?: string
  unreadCount: number
  createdAt: string
  updatedAt?: string
}

export interface ContactRequest {
  id: string
  fromUserId: string
  toUserId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
}