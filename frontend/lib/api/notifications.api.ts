import { api } from './client'

export interface Notification {
  id: number
  type: string
  payload: Record<string, unknown>
  read: boolean
  created_at: string
}

export interface NotificationCount {
  unread: number
}

export const notificationsApi = {
  list: () =>
    api.get<{ data: Notification[] }>('/api/notifications'),

  count: () =>
    api.get<{ data: NotificationCount }>('/api/notifications/count'),

  markRead: (id: number) =>
    api.patch(`/api/notifications/${id}/read`, {}),

  markAllRead: () =>
    api.patch('/api/notifications/read-all', {}),
}
