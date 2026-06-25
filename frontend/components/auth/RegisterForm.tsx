'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { authApi } from '@/lib/api/auth.api'
import { ApiError } from '@/lib/api/client'
import { registerSchema, type RegisterData } from '@/lib/schemas/auth.schema'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils/cn'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    password.length >= 12,
  ]
  const score = checks.filter(Boolean).length

  const label = ['', 'Faible', 'Moyen', 'Fort', 'Très fort'][score] ?? ''
  const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-brand-green', 'bg-brand-green'][score]

  if (!password) return null

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn('h-1.5 flex-1 rounded-full transition-all duration-300', i <= score ? colors : 'bg-gray-200')}
          />
        ))}
      </div>
      <p className={cn('text-xs font-medium', score <= 1 ? 'text-red-500' : score === 2 ? 'text-amber-600' : 'text-brand-green')}>
        {label}
      </p>
    </div>
  )
}

export function RegisterForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [password, setPassword] = React.useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterData) {
    try {
      await authApi.register({ ...data, termsAccepted: true })
      toast.success('Compte créé ! Vérifiez votre boîte mail.')
      router.push('/connexion')
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError('email', { message: 'Cette adresse email est déjà utilisée' })
        } else {
          toast.error('Une erreur est survenue. Réessayez.')
        }
      }
    }
  }

  const { onChange: onPasswordChange, ...passwordRest } = register('password')

  return (
    <div className="space-y-4">
      <GoogleLoginButton label="S'inscrire avec Google" />
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-subtle">ou avec un email</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Prénom"
          autoComplete="given-name"
          leftIcon={User}
          placeholder="Jean"
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <Input
          label="Nom"
          autoComplete="family-name"
          placeholder="Dupont"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>

      <Input
        label="Adresse email"
        type="email"
        autoComplete="email"
        leftIcon={Mail}
        placeholder="vous@exemple.fr"
        error={errors.email?.message}
        {...register('email')}
      />

      <div>
        <Input
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          leftIcon={Lock}
          placeholder="Min. 8 caractères, 1 maj., 1 chiffre"
          error={errors.password?.message}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-text-subtle transition-colors hover:text-text-ink"
              aria-label={showPassword ? 'Masquer' : 'Afficher'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          {...passwordRest}
          onChange={(e) => {
            setPassword(e.target.value)
            onPasswordChange(e)
          }}
        />
        <PasswordStrength password={password} />
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-border accent-brand-green"
          {...register('termsAccepted')}
        />
        <span className="text-sm text-text-body">
          J&apos;accepte les{' '}
          <Link href="/cgu" className="text-brand-green hover:underline" target="_blank">
            Conditions Générales d&apos;Utilisation
          </Link>
        </span>
      </label>
      {errors.termsAccepted && (
        <p className="text-xs text-red-600">{errors.termsAccepted.message}</p>
      )}

      <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
        Créer mon compte
      </Button>

      <p className="text-center text-sm text-text-subtle">
        Déjà un compte ?{' '}
        <Link href="/connexion" className="font-medium text-brand-green hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
    </div>
  )
}
