'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Camera, Trash2, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { usersApi } from '@/lib/api/users.api'
import { profileSchema, type ProfileData } from '@/lib/schemas/profile.schema'
import { resolveUploadUrl } from '@/lib/utils/urls'
import { AccountHeader } from '@/components/account/AccountHeader'
import { DeleteAccountModal } from '@/components/account/DeleteAccountModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

export default function ProfilPage() {
  const { user, setUser } = useAuth()
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    values: {
      first_name: user?.first_name ?? '',
      last_name:  user?.last_name ?? '',
      phone:      user?.phone ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ProfileData) => usersApi.updateProfile(data),
    onSuccess: (res) => {
      setUser(res.data)
      toast.success('Profil mis à jour !')
    },
    onError: () => toast.error('Impossible de mettre à jour le profil.'),
  })

  const avatarMutation = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: (res) => {
      setUser(res.data)
      toast.success('Photo mise à jour !')
    },
    onError: () => toast.error('Impossible de changer la photo.'),
  })

  const initials = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .map((s) => s![0].toUpperCase())
    .join('') || user?.email?.[0]?.toUpperCase() || '?'

  return (
    <div className="max-w-xl space-y-6">
      <AccountHeader
        icon={User}
        title="Mon profil"
        description="Gérez vos informations personnelles et votre photo de profil."
      />

      {/* Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
        className="mb-6 flex items-center gap-5 rounded-2xl border border-border bg-gradient-to-br from-brand-green-lt/60 to-surface-white p-5"
      >
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-green-lt ring-4 ring-surface-white">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveUploadUrl(user.avatar_url) ?? ''} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="font-serif text-2xl font-bold text-brand-green">{initials}</span>
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-surface-white bg-brand-green text-white transition-colors hover:bg-brand-green-dk"
          >
            <Camera className="h-3.5 w-3.5" />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) avatarMutation.mutate(file)
              }}
            />
          </label>
        </div>
        <div>
          <p className="font-medium text-text-ink">
            {user?.first_name && user?.last_name
              ? `${user.first_name} ${user.last_name}`
              : user?.email}
          </p>
          <p className="text-sm text-text-subtle">{user?.email}</p>
          <p className="mt-1 text-xs text-text-subtle">Cliquez sur l&apos;icône pour changer votre photo.</p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="space-y-5 rounded-2xl border border-border bg-surface-white p-6"
      >
        <h2 className="font-serif text-xl text-text-ink">Informations personnelles</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prénom"
            placeholder="Jean"
            error={errors.first_name?.message}
            {...register('first_name')}
          />
          <Input
            label="Nom"
            placeholder="Dupont"
            error={errors.last_name?.message}
            {...register('last_name')}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-ink">Email</label>
          <p className="rounded-xl border border-border bg-surface-cream px-3 py-2.5 text-sm text-text-subtle">
            {user?.email}
          </p>
          <p className="mt-1 text-xs text-text-subtle">L&apos;email ne peut pas être modifié.</p>
        </div>

        <Input
          label="Téléphone"
          placeholder="06 12 34 56 78"
          type="tel"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Button
          type="submit"
          isLoading={mutation.isPending}
          disabled={!isDirty}
        >
          Enregistrer les modifications
        </Button>
      </motion.form>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
        className="rounded-2xl border border-red-200 bg-red-50/50 p-6"
      >
        <h2 className="mb-1 font-serif text-xl text-red-700">Zone de danger</h2>
        <p className="mb-4 text-sm text-red-600/80">
          La suppression de votre compte est irréversible. Vos données personnelles seront anonymisées conformément au RGPD.
        </p>
        <Button
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-100 hover:text-red-700 focus:ring-red-200"
          onClick={() => setDeleteModalOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer mon compte
        </Button>
      </motion.div>

      <DeleteAccountModal open={deleteModalOpen} onOpenChange={setDeleteModalOpen} />
    </div>
  )
}
