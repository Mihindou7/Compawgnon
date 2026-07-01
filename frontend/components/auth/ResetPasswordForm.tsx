'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { authApi } from '@/lib/api/auth.api'
import { ApiError } from '@/lib/api/client'
import { resetPasswordSchema, type ResetPasswordData } from '@/lib/schemas/auth.schema'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ResetPasswordData>({ resolver: zodResolver(resetPasswordSchema) })

  async function onSubmit(data: ResetPasswordData) {
    if (!token) return
    try {
      await authApi.resetPassword({ ...data, token })
      toast.success('Mot de passe modifié avec succès !')
      router.push('/connexion')
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) {
        toast.error('Ce lien a expiré. Demandez un nouveau lien.')
      } else {
        toast.error('Une erreur est survenue.')
      }
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-subtle">Lien invalide ou expiré.</p>
        <Link href="/mot-de-passe-oublie" className="text-brand-green hover:underline text-sm">
          Demander un nouveau lien
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <Input
        label="Nouveau mot de passe"
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        leftIcon={Lock}
        placeholder="Min. 8 caractères, 1 maj., 1 chiffre"
        error={errors.password?.message}
        rightElement={
          <button type="button" onClick={() => setShowPassword(s => !s)} className="text-text-subtle hover:text-text-ink" aria-label="Afficher">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...register('password')}
      />

      <Input
        label="Confirmer le mot de passe"
        type={showConfirm ? 'text' : 'password'}
        autoComplete="new-password"
        leftIcon={Lock}
        placeholder="••••••••"
        error={errors.passwordConfirm?.message}
        rightElement={
          <button type="button" onClick={() => setShowConfirm(s => !s)} className="text-text-subtle hover:text-text-ink" aria-label="Afficher">
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...register('passwordConfirm')}
      />

      <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
        Réinitialiser le mot de passe
      </Button>
    </form>
  )
}
