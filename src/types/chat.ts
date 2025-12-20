export interface ChatMessage {
  id: string
  fromProfileId: string
  fromUserId?: string
  toProfileId: string
  message: string
  type: 'user' | 'admin' | 'admin-broadcast' | 'admin-to-user' | 'user-to-user'
  timestamp: string
  createdAt: string
  readAt?: string
  read?: boolean
}

export interface ChatThread {
  id: string
  participants: string[]
  createdAt: string
  updatedAt?: string
  timestamp?: string
}

export interface ChatConversation {
  id: string
  participants: string[]
  lastMessage: ChatMessage | string
  lastMessageTime?: string
  unreadCount: number
  createdAt: string
  updatedAt?: string
  timestamp?: string
}
