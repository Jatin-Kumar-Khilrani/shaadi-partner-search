export interface ChatMessage {
  id: string
  fromProfileId: string
  toProfileId: string
  message: string
  type: 'user' | 'a
}
export interfac
}

export interface ChatConversation {
  id: string
  participants: string[]
  lastMessage: string
  timestamp: string
  unreadCount: number
  createdAt: string
}

export interface ContactRequest {
  id: string
  fromUserId: string
  toUserId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
}