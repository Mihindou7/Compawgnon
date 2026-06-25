'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Camera, Eye, MapPin, PawPrint, Send } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'

import { sellerAnimalsApi } from '@/lib/api/seller_animals.api'
import { resolveUploadUrl } from '@/lib/utils/urls'
import { AnimalForm } from '@/components/seller/AnimalForm'
import { AnimalFormSection } from '@/components/seller/AnimalFormSection'
import { AnimalPhotoGallery } from '@/components/seller/AnimalPhotoGallery'
import { AnimalStatusBanner } from '@/components/seller/AnimalStatusBanner'
import { AnimalStatusBadge } from '@/components/animal/AnimalStatusBadge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatPrice } from '@/lib/utils/formatters'
import type { AnimalFormData } from '@/lib/schemas/animal.schema'

export default function EditAnimalPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['seller-animal', id],
    queryFn: () => sellerAnimalsApi.show(Number(id)),
    enabled: !!id,
    select: (res) => res.data,
  })

  const updateMutation = useMutation({
    mutationFn: (formData: AnimalFormData) =>
      sellerAnimalsApi.update(Number(id), {
        ...formData,
        breed_id: formData.breed_id ?? undefined,
        postal_code: formData.postal_code || undefined,
        birthdate: formData.birthdate || undefined,
        description: formData.description || undefined,
      }),
    onSuccess: () => {
      toast.success('Annonce mise à jour !')
      queryClient.invalidateQueries({ queryKey: ['seller-animal', id] })
      queryClient.invalidateQueries({ queryKey: ['seller-animals'] })
    },
    onError: () => toast.error('Impossible de mettre à jour l\'annonce.'),
  })

  const publishMutation = useMutation({
    mutationFn: () => sellerAnimalsApi.publish(Number(id)),
    onSuccess: () => {
      toast.success('Annonce soumise pour validation.')
      queryClient.invalidateQueries({ queryKey: ['seller-animal', id] })
      queryClient.invalidateQueries({ queryKey: ['seller-dashboard'] })
    },
    onError: () => toast.error('Impossible de publier l\'annonce.'),
  })

  const uploadMediaMutation = useMutation({
    mutationFn: ({ file, isCover }: { file: File; isCover: boolean }) =>
      sellerAnimalsApi.uploadMedia(Number(id), file, isCover),
    onSuccess: () => {
      toast.success('Photo ajoutée !')
      queryClient.invalidateQueries({ queryKey: ['seller-animal', id] })
    },
    onError: () => toast.error('Impossible d\'ajouter la photo.'),
  })

  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: number) => sellerAnimalsApi.deleteMedia(Number(id), mediaId),
    onSuccess: () => {
      toast.success('Photo supprimée.')
      queryClient.invalidateQueries({ queryKey: ['seller-animal', id] })
    },
    onError: () => toast.error('Impossible de supprimer la photo.'),
  })

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <p className="text-text-subtle">Annonce introuvable.</p>
        <Button variant="outline" asChild>
          <Link href="/vendeur/animaux">Retour aux annonces</Link>
        </Button>
      </div>
    )
  }

  const cover = resolveUploadUrl(data.cover_url)
  const canSubmit = data.status === 'draft' || data.status === 'archived'

  const defaultValues: Partial<AnimalFormData> = {
    title:       data.title,
    description: data.description ?? '',
    species_id:  data.species?.id,
    breed_id:    data.breed?.id,
    sex:         data.sex,
    price:       data.price,
    city:        data.city,
    postal_code: data.postal_code ?? '',
    birthdate:   data.birthdate ?? '',
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-text-subtle">
          <Link href="/vendeur/animaux">← Retour aux annonces</Link>
        </Button>
      </div>

      {/* Hero summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand-green-lt/50 to-surface-white"
      >
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-surface-cream ring-2 ring-surface-white sm:h-20 sm:w-20">
            {cover ? (
              <Image src={cover} alt={data.title} fill sizes="96px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <PawPrint className="h-8 w-8 text-brand-green/40" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl text-text-ink">{data.title}</h1>
              <AnimalStatusBadge status={data.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <p className="font-semibold text-brand-green">{formatPrice(data.price)}</p>
              {data.species && (
                <p className="text-sm text-text-subtle">
                  {data.species.name}
                  {data.breed ? ` · ${data.breed.name}` : ''}
                </p>
              )}
              {data.city && (
                <p className="flex items-center gap-1 text-sm text-text-subtle">
                  <MapPin className="h-3.5 w-3.5" />
                  {data.city}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/animaux/${id}`} target="_blank">
                <Eye className="h-3.5 w-3.5" />
                Prévisualiser
              </Link>
            </Button>
            {canSubmit && (
              <Button
                size="sm"
                leftIcon={Send}
                onClick={() => publishMutation.mutate()}
                isLoading={publishMutation.isPending}
              >
                Soumettre
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <AnimalStatusBanner status={data.status} animalId={Number(id)} />

      <div className="space-y-5">
        <AnimalFormSection
          icon={Camera}
          title="Photos"
          description="Gérez la galerie de votre annonce. La photo de couverture apparaît en premier."
          delay={0.05}
        >
          <AnimalPhotoGallery
            media={data.media ?? []}
            isUploading={uploadMediaMutation.isPending}
            onUpload={(files) => {
              files.forEach((file, i) => {
                uploadMediaMutation.mutate({
                  file,
                  isCover: i === 0 && (!data.media || data.media.length === 0),
                })
              })
            }}
            onDelete={(mediaId) => deleteMediaMutation.mutate(mediaId)}
          />
        </AnimalFormSection>

        <AnimalForm
          defaultValues={defaultValues}
          onSubmit={(formData) => updateMutation.mutate(formData)}
          isLoading={updateMutation.isPending}
          submitLabel="Enregistrer les modifications"
        />
      </div>
    </div>
  )
}
