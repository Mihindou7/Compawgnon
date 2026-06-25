import { z } from 'zod'

export const profileSchema = z.object({
  first_name: z.string().max(100, 'Prénom trop long').optional(),
  last_name:  z.string().max(100, 'Nom trop long').optional(),
  phone:      z.string().regex(/^(\+33|0)[1-9][0-9]{8}$/, 'Numéro de téléphone invalide').optional().or(z.literal('')),
})

export type ProfileData = z.infer<typeof profileSchema>

export const sellerApplicationSchema = z.object({
  name:        z.string().min(2, 'Nom requis').max(100),
  type:        z.enum(['breeder', 'pet_shop'], { message: 'Type requis' }),
  siret:       z.string().length(14, 'SIRET doit contenir 14 chiffres').regex(/^\d{14}$/, 'SIRET invalide'),
  city:        z.string().min(2, 'Ville requise'),
  postal_code: z.string().length(5, 'Code postal invalide').regex(/^\d{5}$/, 'Code postal invalide'),
  address:     z.string().optional(),
  description: z.string().max(1000, 'Description trop longue').optional(),
  latitude:    z.number().optional(),
  longitude:   z.number().optional(),
})

export type SellerApplicationData = z.infer<typeof sellerApplicationSchema>
