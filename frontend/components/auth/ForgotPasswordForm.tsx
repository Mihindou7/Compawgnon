'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, Mail } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { useForm } from 'react-hook-form'

import { authApi } from '@/lib/api/auth.api'
import { forgotPasswordSchema, type ForgotPasswordData } from '@/lib/schemas/auth.schema'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = React.useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ForgotPasswordData>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(data: ForgotPasswordData) {
    await authApi.forgotPassword(data.email).catch(() => {})
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center animate-slide-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green-lt">
          <CheckCircle className="h-8 w-8 text-brand-green" />
        </div>
        <div>
          <p className="font-medium text-text-ink">Email envoyé !</p>
          <p className="mt-1 text-sm text-text-subtle">
            Si un compte correspond à cette adresse, vous recevrez un lien de réinitialisation.
          </p>
        </div>
        <Link href="/connexion" className="text-sm text-brand-green hover:underline">
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <p className="text-sm text-text-subtle">
        Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </p>

      <Input
        label="Adresse email"
        type="email"
        autoComplete="email"
        leftIcon={Mail}
        placeholder="vous@exemple.fr"
        error={errors.email?.message}
        {...register('email')}
      />

      <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
        Envoyer le lien
      </Button>

      <p className="text-center text-sm text-text-subtle">
        <Link href="/connexion" className="text-brand-green hover:underline">
          ← Retour à la connexion
        </Link>
      </p>
    </form>
  )
}
