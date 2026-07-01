import { z } from 'zod'

const passwordRules = z
  .string()
  .min(8, 'Minimum 8 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[0-9]/, 'Au moins un chiffre')

export const loginSchema = z.object({
  email:    z.string().min(1, 'Email requis').email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export const registerSchema = z.object({
  email:         z.string().min(1, 'Email requis').email('Email invalide'),
  password:      passwordRules,
  firstName:     z.string().optional(),
  lastName:      z.string().optional(),
  termsAccepted: z.literal(true, { message: 'Vous devez accepter les CGU' }),
})

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
})

export const resetPasswordSchema = z
  .object({
    password:        passwordRules,
    passwordConfirm: z.string().min(1, 'Confirmation requise'),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['passwordConfirm'],
  })

export type LoginData         = z.infer<typeof loginSchema>
export type RegisterData      = z.infer<typeof registerSchema>
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>
