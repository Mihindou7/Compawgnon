import { api } from './client'

export interface ConversationSummary {
  id: number
  animal: { id: number; title: string; cover_url: string | null }
  interlocutor: { id: number; name: string }
  is_buyer: boolean
  unread_count: number
  last_message: { content: string; created_at: string } | null
  last_message_at: string | null
  created_at: string
}

export interface ChatMessage {
  id: number
  content: string
  sender_id: number
  is_mine: boolean
  read: boolean
  created_at: string
}

export interface ConversationDetail {
  conversation: ConversationSummary
  messages: ChatMessage[]
}

export const messagesApi = {
  unreadCount: () =>
    api.get<{ data: { unread: number } }>('/api/conversations/unread-count'),

  start: (animalId: number) =>
    api.post<{ data: ConversationSummary }>('/api/conversations', { animal_id: animalId }),

  list: () =>
    api.get<{ data: ConversationSummary[] }>('/api/conversations'),

  get: (id: number) =>
    api.get<{ data: ConversationDetail }>(`/api/conversations/${id}`),

  send: (id: number, content: string) =>
    api.post<{ data: ChatMessage }>(`/api/conversations/${id}/messages`, { content }),

  markRead: (id: number) =>
    api.patch(`/api/conversations/${id}/read`, {}),
}
