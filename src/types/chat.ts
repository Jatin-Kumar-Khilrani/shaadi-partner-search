export interface ChatMessage {
  id: string
  fromUserId: string
  fromProfileId: string
  toProfileId?: string
  message: string
  timestamp: string
  read: boolean
  type?: 'user' | 'admin' | 'admin-broadcast' | 'admin-to-user' | 'user-to-user'
}

export interface ChatConversation {
  id: string
  participants: string[]
  lastMessage: ChatMessage
  unreadCount: number
  createdAt: string
  updatedAt: string
}

export interface ChatRequest {
  id: string
  fromUserId: string
  fromProfileId: string
  toUserId: string
  toProfileId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
}