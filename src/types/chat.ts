export interface ChatMessage {
  fromProfil
  fromProfileId: string
  toProfileId: string
  type: 'user' | 
  createdAt: string
}
export interfac
  createdAt: string
  updatedAt?: string
}

export interface ChatConversation {
  id: string
  participants: string[]
  lastMessage: string

  unreadCount: number

}
