export interface ChatMessage {
  id: string
  fromUserId: string
  fromProfileId: string
  read: boolean

  id: string
  lastMessage: ChatMessage
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

export interface ChatRequest {
  id: string

  fromProfileId: string
  toUserId: string
  toProfileId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string

}