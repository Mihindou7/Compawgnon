'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Briefcase, MapPin, ShieldCheck, Store, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { sellerApplyApi } from '@/lib/api/sellers_apply.api'
import { sellerApplicationSchema, type SellerApplicationData } from '@/lib/schemas/profile.schema'
import { AccountHeader } from '@/components/account/AccountHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Textarea'

const SELLER_TYPE_OPTIONS = [
  { value: 'breeder',  label: 'Éleveur' },
  { value: 'pet_shop', label: 'Animalerie' },
]

const SELLER_TYPE_LABELS: Record<string, string> = {
  breeder: 'Éleveur',
  pet_shop: 'Animalerie',
}

const VERIFIED_BADGE: Record<string, { label: string; variant: 'green' | 'amber' | 'red' }> = {
  approved: { label: 'Certifié', variant: 'green' },
  pending:  { label: 'En attente', variant: 'amber' },
  rejected: { label: 'Refusé', variant: 'red' },
}

export default function SellerProfilPage() {
  const queryClient = useQueryClient()

  const { data: sellerData, isLoading } = useQuery({
    queryKey: ['seller-me'],
    queryFn: () => sellerApplyApi.getMyStore(),
    select: (res) => res.data,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<SellerApplicationData>({
    resolver: zodResolver(sellerApplicationSchema),
    values: sellerData ? {
      name:        sellerData.name,
      type:        sellerData.type,
      siret:       sellerData.siret,
      city:        sellerData.city,
      postal_code: sellerData.postal_code,
      address:     sellerData.address ?? '',
      description: sellerData.description ?? '',
    } : undefined,
  })

  const mutation = useMutation({
    mutationFn: (data: SellerApplicationData) => sellerApplyApi.apply(data),
    onSuccess: () => {
      toast.success('Profil vendeur mis à jour !')
      queryClient.invalidateQueries({ queryKey: ['seller-me'] })
    },
    onError: () => toast.error('Impossible de mettre à jour le profil.'),
  })

  if (isLoading) {
    return (
      <div className="max-w-xl space-y-4">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  const verifiedCfg = sellerData?.verified_status
    ? VERIFIED_BADGE[sellerData.verified_status]
    : null

  return (
    <div className="max-w-xl">
      <AccountHeader
        icon={Store}
        title="Profil vendeur"
        description="Informations de votre boutique visibles par les acheteurs."
      />

      {sellerData && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
          className="mb-6 flex items-start gap-5 rounded-2xl border border-border bg-gradient-to-br from-brand-green-lt/60 to-surface-white p-5"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-green-lt text-brand-green">
            <Briefcase className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-serif text-xl text-text-ink">{sellerData.name}</p>
              {verifiedCfg && (
                <Badge variant={verifiedCfg.variant} className="inline-flex items-center gap-1">
                  {sellerData.verified_status === 'approved' && <ShieldCheck className="h-3 w-3" />}
                  {verifiedCfg.label}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-text-subtle">
              {SELLER_TYPE_LABELS[sellerData.type] ?? sellerData.type}
            </p>
            <p className="mt-1 flex items-center gap-1 text-sm text-text-subtle">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {sellerData.city} ({sellerData.postal_code})
            </p>
            {sellerData.rating != null && (
              <p className="mt-1 text-sm text-text-subtle">
                Note moyenne&nbsp;: <span className="font-medium text-text-ink">{sellerData.rating.toFixed(1)} / 5</span>
                {sellerData.reviews_count != null && ` · ${sellerData.reviews_count} avis`}
              </p>
            )}
          </div>
        </motion.div>
      )}

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="space-y-5 rounded-2xl border border-border bg-surface-white p-6"
      >
        <h2 className="flex items-center gap-2 font-serif text-xl text-text-ink">
          <User className="h-5 w-5 text-brand-green" />
          Informations de la boutique
        </h2>

        <Input
          label="Nom de l'activité"
          error={errors.name?.message}
          {...register('name')}
        />

        <Select
          label="Type d'activité"
          options={SELLER_TYPE_OPTIONS}
          value={watch('type') ?? ''}
          onValueChange={(v) => setValue('type', v as 'breeder' | 'pet_shop', { shouldDirty: true })}
          error={errors.type?.message}
        />

        <Input
          label="SIRET"
          maxLength={14}
          error={errors.siret?.message}
          {...register('siret')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ville"
            error={errors.city?.message}
            {...register('city')}
          />
          <Input
            label="Code postal"
            maxLength={5}
            error={errors.postal_code?.message}
            {...register('postal_code')}
          />
        </div>

        <Input
          label="Adresse (optionnel)"
          error={errors.address?.message}
          {...register('address')}
        />

        <Textarea
          label="Description (optionnel)"
          rows={4}
          maxLength={1000}
          showCount
          error={errors.description?.message}
          {...register('description')}
        />

        <Button type="submit" isLoading={mutation.isPending} disabled={!isDirty}>
          Enregistrer les modifications
        </Button>
      </motion.form>
    </div>
  )
}
