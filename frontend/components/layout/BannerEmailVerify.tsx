'use client'

import { AlertTriangle, X } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { authApi } from '@/lib/api/auth.api'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth.store'

export function BannerEmailVerify() {
  const { isVerified, isAuthenticated } = useAuth()
  const hydrate = useAuthStore((s) => s.hydrate)
  const [dismissed, setDismissed] = React.useState(false)
  const [sending, setSending] = React.useState(false)

  if (!isAuthenticated || isVerified || dismissed) return null

  async function handleResend() {
    setSending(true)
    try {
      const res = await authApi.resendVerification()
      if (res.data.already_verified) {
        toast.info('Votre email est déjà vérifié !')
        hydrate()
        setDismissed(true)
      } else {
        toast.success('Email de vérification renvoyé !')
      }
    } catch {
      toast.error('Erreur lors de l\'envoi. Réessayez.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
        <span>
          Vérifiez votre adresse email pour accéder à toutes les fonctionnalités.{' '}
          <button
            onClick={handleResend}
            disabled={sending}
            className="font-medium underline hover:no-underline disabled:opacity-50"
          >
            {sending ? 'Envoi…' : 'Renvoyer l\'email'}
          </button>
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="rounded p-0.5 hover:bg-amber-100"
        aria-label="Fermer la bannière"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
