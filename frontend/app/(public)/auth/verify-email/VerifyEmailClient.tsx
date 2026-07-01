'use client'

import { CheckCircle2, Loader2, MailX } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { authApi } from '@/lib/api/auth.api'
import { ApiError } from '@/lib/api/client'
import { getRefreshToken, setTokens } from '@/lib/utils/tokens'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/Button'

type Status = 'loading' | 'success' | 'error' | 'resent'

export function VerifyEmailClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const hydrate = useAuthStore((s) => s.hydrate)
  const [resending, setResending] = React.useState(false)
  const token = searchParams.get('token')
  const [status, setStatus] = React.useState<Status>(() => (token ? 'loading' : 'error'))

  React.useEffect(() => {
    if (!token) return

    authApi
      .verifyEmail(token)
      .then((res) => {
        const accessToken = res.data.access_token
        const refreshToken = res.data.refresh_token ?? getRefreshToken() ?? ''
        setTokens(accessToken, refreshToken)
        hydrate()
        setStatus('success')
        setTimeout(() => router.push('/'), 3000)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 410) {
          toast.error('Ce lien a expiré ou est invalide.')
        }
        setStatus('error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleResend() {
    setResending(true)
    try {
      const res = await authApi.resendVerification()
      if (res.data.already_verified) {
        setStatus('success')
        toast.info('Votre email est déjà vérifié !')
        setTimeout(() => router.push('/'), 2000)
      } else {
        setStatus('resent')
        toast.success('Un nouvel email de vérification a été envoyé !')
      }
    } catch {
      toast.error('Impossible de renvoyer l\'email. Reconnectez-vous et réessayez.')
    } finally {
      setResending(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-green" />
        <p className="text-text-subtle">Vérification de votre email en cours…</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-lt">
          <CheckCircle2 className="h-8 w-8 text-brand-green" />
        </div>
        <div>
          <h1 className="font-serif text-2xl text-text-ink">Email vérifié !</h1>
          <p className="mt-1 text-sm text-text-subtle">
            Votre adresse email a bien été vérifiée. Vous allez être redirigé dans quelques secondes…
          </p>
        </div>
        <Button asChild variant="primary" className="mt-2">
          <Link href="/">Continuer</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <MailX className="h-8 w-8 text-red-500" />
      </div>
      <div>
        <h1 className="font-serif text-2xl text-text-ink">
          {status === 'resent' ? 'Email renvoyé' : 'Lien invalide ou expiré'}
        </h1>
        <p className="mt-1 text-sm text-text-subtle">
          {status === 'resent'
            ? 'Consultez votre boîte mail et cliquez sur le nouveau lien de vérification.'
            : 'Ce lien de vérification n\'est plus valide. Vous pouvez en demander un nouveau.'}
        </p>
      </div>
      {status === 'error' && (
        <div className="mt-2 flex w-full flex-col gap-3">
          <Button onClick={handleResend} isLoading={resending} variant="primary" className="w-full">
            Renvoyer l&apos;email de vérification
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/connexion">Retour à la connexion</Link>
          </Button>
        </div>
      )}
      {status === 'resent' && (
        <Button asChild variant="ghost">
          <Link href="/connexion">Retour à la connexion</Link>
        </Button>
      )}
    </div>
  )
}
