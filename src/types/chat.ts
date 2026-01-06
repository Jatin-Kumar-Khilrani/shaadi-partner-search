export interface ChatMessage {
  id: string
  fromProfileId: string
  fromUserId?: string
  toProfileId: string
  type: 'user' | 'admin' | 'admin-broadcast' | 'admin-to-user' | 'user-to-user'
  message: string
  content?: string  // Backward compatibility - some old messages use content instead of message
  createdAt: string
  timestamp: string
  readAt?: string
  read?: boolean
  delivered?: boolean
  deliveredAt?: string
  status?: 'sent' | 'delivered' | 'read'
  isSystemMessage?: boolean // Flag for system-generated messages (e.g., interest accepted notification)
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
