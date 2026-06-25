import { z } from 'zod'

export const CONTACT_SUBJECTS = [
  { value: 'general', label: 'Question générale' },
  { value: 'compte', label: 'Mon compte' },
  { value: 'annonce', label: 'Une annonce' },
  { value: 'vendeur', label: 'Devenir vendeur' },
  { value: 'signalement', label: 'Signalement / abus' },
  { value: 'autre', label: 'Autre' },
] as const

export const contactSchema = z.object({
  name:    z.string().min(2, 'Veuillez indiquer votre nom').max(80, 'Nom trop long'),
  email:   z.string().min(1, 'Email requis').email('Email invalide'),
  subject: z.enum(
    CONTACT_SUBJECTS.map((s) => s.value) as [string, ...string[]],
    { message: 'Veuillez choisir un sujet' },
  ),
  message: z.string().min(20, 'Votre message doit faire au moins 20 caractères').max(2000, 'Message trop long'),
})

export type ContactData = z.infer<typeof contactSchema>
