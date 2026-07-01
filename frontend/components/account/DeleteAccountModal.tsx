'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { usersApi } from '@/lib/api/users.api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface DeleteAccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteAccountModal({ open, onOpenChange }: DeleteAccountModalProps) {
  const { logout } = useAuth()
  const router = useRouter()
  const [password, setPassword] = React.useState('')
  const [passwordError, setPasswordError] = React.useState<string | undefined>()

  const mutation = useMutation({
    mutationFn: () => usersApi.deleteAccount(password ? { password } : undefined),
    onSuccess: async () => {
      toast.success('Votre compte a été supprimé.')
      await logout()
      router.push('/')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      const msg = err?.response?.data?.message ?? ''
      if (msg.toLowerCase().includes('password')) {
        setPasswordError('Mot de passe incorrect.')
      } else {
        toast.error('Impossible de supprimer le compte. Réessayez.')
      }
    },
  })

  function handleClose(open: boolean) {
    if (!open) {
      setPassword('')
      setPasswordError(undefined)
    }
    onOpenChange(open)
  }

  function handleConfirm() {
    setPasswordError(undefined)
    mutation.mutate()
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface-white p-6 shadow-xl data-[state=open]:animate-scale-in">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-xl text-text-subtle transition-colors hover:bg-surface-cream hover:text-text-ink">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <Dialog.Title className="mb-2 font-serif text-xl text-text-ink">
            Supprimer mon compte
          </Dialog.Title>

          <Dialog.Description asChild>
            <div className="space-y-3 text-sm text-text-body">
              <p>
                Cette action est <strong>irréversible</strong>. Vos données personnelles seront anonymisées conformément au RGPD :
              </p>
              <ul className="list-inside list-disc space-y-1 text-text-subtle">
                <li>Votre adresse email sera remplacée par un identifiant anonyme</li>
                <li>Vos informations personnelles seront effacées</li>
                <li>Vos annonces seront archivées</li>
                <li>Vous serez déconnecté immédiatement</li>
              </ul>
            </div>
          </Dialog.Description>

          <div className="mt-5 space-y-4">
            <Input
              label="Mot de passe pour confirmer"
              type="password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(undefined) }}
              error={passwordError}
              hint="Si vous utilisez Google pour vous connecter, laissez ce champ vide."
              autoComplete="current-password"
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleClose(false)}
                disabled={mutation.isPending}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 bg-red-600 text-white hover:bg-red-700 focus:ring-red-300"
                onClick={handleConfirm}
                isLoading={mutation.isPending}
              >
                Supprimer mon compte
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
