'use client'

import { CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { authApi } from '@/lib/api/auth.api'
import { ApiError } from '@/lib/api/client'
import { setTokens } from '@/lib/utils/tokens'
import { useAuthStore } from '@/stores/auth.store'

type VerifyState = 'loading' | 'success' | 'expired' | 'error' | 'missing'

export function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hydrate = useAuthStore((s) => s.hydrate)
  const token = searchParams.get('token')

  const [state, setState] = React.useState<VerifyState>(token ? 'loading' : 'missing')

  React.useEffect(() => {
    if (!token) return

    let cancelled = false

    authApi
      .verifyEmail(token)
      .then((res) => {
        if (cancelled) return
        setTokens(res.data.access_token, res.data.refresh_token)
        hydrate()
        setState('success')
        setTimeout(() => router.push('/compte'), 2500)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 410) {
          setState('expired')
        } else {
          setState('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, router, hydrate])

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        <p className="text-text-subtle">Vérification de votre adresse email…</p>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle className="h-14 w-14 text-brand-green" />
        <p className="font-serif text-xl text-text-ink">Email vérifié !</p>
        <p className="text-sm text-text-subtle">
          Votre compte est actif. Redirection vers votre espace…
        </p>
      </div>
    )
  }

  if (state === 'expired') {
    return (
      <div className="flex flex-col items-center gap-5 py-8 text-center">
        <XCircle className="h-14 w-14 text-amber-500" />
        <div className="space-y-1">
          <p className="font-serif text-xl text-text-ink">Lien expiré</p>
          <p className="text-sm text-text-subtle">
            Ce lien de vérification a expiré. Connectez-vous et renvoyez un email depuis
            votre espace personnel.
          </p>
        </div>
        <Link
          href="/connexion"
          className="text-sm font-medium text-brand-green hover:underline"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  if (state === 'missing') {
    return (
      <div className="flex flex-col items-center gap-5 py-8 text-center">
        <XCircle className="h-14 w-14 text-red-400" />
        <div className="space-y-1">
          <p className="font-serif text-xl text-text-ink">Lien invalide</p>
          <p className="text-sm text-text-subtle">
            Ce lien de vérification est incorrect ou incomplet.
          </p>
        </div>
        <Link
          href="/connexion"
          className="text-sm font-medium text-brand-green hover:underline"
        >
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <XCircle className="h-14 w-14 text-red-500" />
      <div className="space-y-1">
        <p className="font-serif text-xl text-text-ink">Une erreur est survenue</p>
        <p className="text-sm text-text-subtle">
          Impossible de vérifier votre email. Réessayez ou contactez le support.
        </p>
      </div>
      <Link
        href="/connexion"
        className="text-sm font-medium text-brand-green hover:underline"
      >
        Retour à la connexion
      </Link>
    </div>
  )
}
