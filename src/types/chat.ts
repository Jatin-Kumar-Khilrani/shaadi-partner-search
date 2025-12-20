export interface ChatMessage {
  id: string
  fromProfileId: string
  toProfileId: string
  type: 'user' | 'admin'
  message: string
  createdAt: string
  readAt?: string
}

export interface ChatConversation {
  id: string
  profileId: string
  lastMessage?: ChatMessage
  unreadCount: number
  updatedAt: string
}
