export interface ChatMessage {
  id: string
  fromUserId: string
  fromProfileId: string
  toProfileId?: string
  message: string
  timestamp: string
  type: 'user' | 'admin' | 'admin-broadcast' | 'admin-to-user' | 'user-to-user'
  read: boolean
}

export interface ChatConversation {
  id: string
  participants: string[]
  lastMessage: ChatMessage
  unreadCount: number
  createdAt: string
  updatedAt: string
}

export interface ContactRequest {
  id: string
  fromUserId: string
  toUserId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
}
