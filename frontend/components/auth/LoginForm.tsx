'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { authApi } from '@/lib/api/auth.api'
import { ApiError } from '@/lib/api/client'
import { loginSchema, type LoginData } from '@/lib/schemas/auth.schema'
import { setTokens } from '@/lib/utils/tokens'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'

export function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const hydrate = useAuthStore((s) => s.hydrate)

  const redirect = searchParams.get('redirect') ?? '/'
  const error = searchParams.get('error')

  React.useEffect(() => {
    if (error === 'session_expired') toast.error('Session expirée. Veuillez vous reconnecter.')
    if (error === 'disabled') toast.error('Votre compte a été désactivé.')
  }, [error])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginData) {
    try {
      const tokens = await authApi.login(data)
      setTokens(tokens.token, tokens.refresh_token)
      hydrate()
      router.push(redirect)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('email', { message: 'Email ou mot de passe incorrect' })
        } else if (err.status === 403) {
          toast.error('Votre compte a été désactivé. Contactez le support.')
        } else {
          toast.error('Une erreur est survenue. Réessayez.')
        }
      } else {
        toast.error('Impossible de contacter le serveur. Vérifiez que le backend est démarré.')
      }
    }
  }

  return (
    <div className="space-y-5">
      <GoogleLoginButton />
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-subtle">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <Input
        label="Adresse email"
        type="email"
        autoComplete="email"
        leftIcon={Mail}
        placeholder="vous@exemple.fr"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Mot de passe"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        leftIcon={Lock}
        placeholder="••••••••"
        error={errors.password?.message}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="text-text-subtle transition-colors hover:text-text-ink"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...register('password')}
      />

      <div className="flex justify-end">
        <Link
          href="/mot-de-passe-oublie"
          className="text-sm text-brand-green transition-colors hover:text-brand-green-dk"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
        Se connecter
      </Button>

      <p className="text-center text-sm text-text-subtle">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="font-medium text-brand-green hover:underline">
          S&apos;inscrire
        </Link>
      </p>
    </form>
    </div>
  )
}
