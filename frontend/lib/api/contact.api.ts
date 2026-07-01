import { api } from './client'
import type { ContactData } from '@/lib/schemas/contact.schema'

export const contactApi = {
  submit: (data: ContactData) =>
    api.post<{ data: { id: number; message: string } }>('/api/contact', data),
}
