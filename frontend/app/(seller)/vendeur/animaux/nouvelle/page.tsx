'use client'

import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Camera, PawPrint } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { sellerAnimalsApi } from '@/lib/api/seller_animals.api'
import { ApiError } from '@/lib/api/client'
import { AccountHeader } from '@/components/account/AccountHeader'
import { AnimalForm } from '@/components/seller/AnimalForm'
import { AnimalFormSection } from '@/components/seller/AnimalFormSection'
import { PhotoDropzone, type PhotoPreview } from '@/components/seller/PhotoDropzone'
import { Button } from '@/components/ui/Button'
import type { AnimalFormData } from '@/lib/schemas/animal.schema'

export default function NouvelleAnnoncePage() {
  const router = useRouter()
  const [photos, setPhotos] = React.useState<PhotoPreview[]>([])
  const [photoError, setPhotoError] = React.useState<string | undefined>()
  const [isUploading, setIsUploading] = React.useState(false)

  const createMutation = useMutation({
    mutationFn: (data: AnimalFormData) =>
      sellerAnimalsApi.create({
        ...data,
        breed_id:        data.breed_id ?? undefined,
        postal_code:     data.postal_code || undefined,
        birthdate:       data.birthdate || undefined,
        description:     data.description || undefined,
        latitude:        data.latitude ?? undefined,
        longitude:       data.longitude ?? undefined,
        region:          data.region ?? undefined,
        department:      data.department ?? undefined,
        department_code: data.department_code ?? undefined,
      }),
  })

  async function handleSubmit(data: AnimalFormData) {
    if (photos.length === 0) {
      setPhotoError('Ajoutez au moins une photo avant de publier.')
      document.getElementById('photos-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setPhotoError(undefined)

    try {
      const res = await createMutation.mutateAsync(data)
      const animalId = res.data.id

      setIsUploading(true)
      for (let i = 0; i < photos.length; i++) {
        await sellerAnimalsApi.uploadMedia(animalId, photos[i].file, i === 0)
      }

      toast.success('Annonce créée avec succès !')
      router.push(`/vendeur/animaux/${animalId}`)
    } catch (err) {
      setIsUploading(false)
      if (!createMutation.isSuccess) {
        if (err instanceof ApiError && err.status === 422) {
          toast.error("Formulaire invalide. Vérifiez les champs en rouge.")
        } else if (err instanceof ApiError && err.status === 403) {
          toast.error("Votre compte vendeur n'est pas encore approuvé.")
        } else {
          toast.error("Impossible de créer l'annonce. Réessayez.")
        }
      } else {
        toast.error("Annonce créée mais une photo n'a pas pu être uploadée.")
        router.push('/vendeur/animaux')
      }
    }
  }

  const isLoading = createMutation.isPending || isUploading

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-text-subtle">
          <Link href="/vendeur/animaux">← Retour aux annonces</Link>
        </Button>
      </div>

      <AccountHeader
        icon={PawPrint}
        title="Nouvelle annonce"
        description="Ajoutez des photos puis renseignez les informations de l'animal. L'annonce sera soumise à validation."
        className="mb-6"
      />

      {/* Steps indicator */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="mb-6 flex items-center gap-2 text-sm"
      >
        <span className="flex items-center gap-1.5 rounded-full bg-brand-green-lt px-3 py-1 font-medium text-brand-green">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">1</span>
          Photos
        </span>
        <span className="h-px flex-1 bg-border" />
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface-white px-3 py-1 text-text-subtle">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-cream text-xs font-bold">2</span>
          Informations
        </span>
      </motion.div>

      <div className="space-y-5">
        <AnimalFormSection
          id="photos-section"
          icon={Camera}
          title="Photos"
          description="La première photo sera la couverture de votre annonce. Minimum 1 photo requise."
          badge={
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
              Obligatoire
            </span>
          }
        >
          <PhotoDropzone
            photos={photos}
            onChange={(p) => { setPhotos(p); if (p.length > 0) setPhotoError(undefined) }}
            error={photoError}
          />
        </AnimalFormSection>

        <AnimalForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel={isUploading ? 'Upload en cours…' : 'Créer l\'annonce'}
        />
      </div>
    </div>
  )
}
