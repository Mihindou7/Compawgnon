import { z } from 'zod'

export const animalSchema = z.object({
  title:           z.string().min(3, 'Titre requis (min. 3 caractères)').max(180, 'Titre trop long (max. 180 caractères)'),
  description:     z.string().min(80, 'La description doit faire au moins 80 caractères').max(2000, 'Description trop longue'),
  species_id:      z.number({ message: 'Espèce requise' }).positive('Espèce requise'),
  breed_id:        z.number().positive().optional(),
  sex:             z.enum(['male', 'female', 'unknown'], { message: 'Sexe requis' }),
  price:           z.number({ message: 'Prix requis' }).nonnegative('Le prix ne peut pas être négatif').max(100000, 'Prix trop élevé'),
  city:            z.string().min(2, 'Ville requise').max(100),
  postal_code:     z.string().regex(/^\d{5}$/, 'Sélectionnez une ville dans la liste pour obtenir le code postal'),
  birthdate:       z.string().optional(),
  latitude:        z.number().optional(),
  longitude:       z.number().optional(),
  region:          z.string().optional(),
  department:      z.string().optional(),
  department_code: z.string().optional(),
})

export type AnimalFormData = z.infer<typeof animalSchema>
