export interface ChatMessage {
  fromProfil
  fromProfileId: string
  toProfileId?: string
  type?: 'user' |
  timestamp: string
  type?: 'user' | 'admin'
  read?: boolean
 

export interface ChatConversation {
  id: string
  createdAt: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  createdAt: string
}

export interface ContactRequest {

  fromUserId: string
  toUserId: string
  status: 'pending' | 'accepted' | 'declined'

}
