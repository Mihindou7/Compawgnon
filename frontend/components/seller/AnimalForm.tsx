'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Euro, FileText, PawPrint } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { speciesApi } from '@/lib/api/species.api'
import { animalSchema, type AnimalFormData } from '@/lib/schemas/animal.schema'
import { AnimalFormSection } from '@/components/seller/AnimalFormSection'
import { Button } from '@/components/ui/Button'
import { CityAutocomplete } from '@/components/ui/CityAutocomplete'
import { DatePicker } from '@/components/ui/DatePicker'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'

const SEX_OPTIONS = [
  { value: 'male',    label: 'Mâle' },
  { value: 'female',  label: 'Femelle' },
  { value: 'unknown', label: 'Non précisé' },
]

interface AnimalFormProps {
  defaultValues?: Partial<AnimalFormData>
  isLoading?: boolean
  onSubmit: (data: AnimalFormData) => void
  submitLabel?: string
  showSections?: boolean
}

export function AnimalForm({
  defaultValues,
  isLoading,
  onSubmit,
  submitLabel = 'Enregistrer',
  showSections = true,
}: AnimalFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<AnimalFormData>({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      sex: 'unknown',
      ...defaultValues,
    },
  })

  const speciesId = watch('species_id')

  const { data: speciesData } = useQuery({
    queryKey: ['species'],
    queryFn: () => speciesApi.list(),
    staleTime: 10 * 60 * 1000,
  })

  const { data: breedsData } = useQuery({
    queryKey: ['breeds', speciesId],
    queryFn: () => speciesApi.listBreeds({ species_id: speciesId }),
    enabled: !!speciesId && speciesId > 0,
  })

  const speciesOptions = (speciesData?.data ?? []).map((s) => ({ value: String(s.id), label: s.name }))

  const breedOptions = [
    { value: '__none__', label: 'Aucune race précise' },
    ...(breedsData?.data ?? []).map((b) => ({ value: String(b.id), label: b.name })),
  ]

  const identityFields = (
    <div className="space-y-4">
      <Input
        label="Titre de l'annonce"
        placeholder="Ex: Chiot Golden Retriever LOF disponible…"
        error={errors.title?.message}
        {...register('title')}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Espèce"
          placeholder="Choisir une espèce…"
          options={speciesOptions}
          value={speciesId ? String(speciesId) : undefined}
          onValueChange={(v) => {
            setValue('species_id', Number(v), { shouldDirty: true })
            setValue('breed_id', undefined, { shouldDirty: true })
          }}
          error={errors.species_id?.message}
        />
        <Select
          label="Race (optionnel)"
          placeholder="Aucune race précise"
          options={breedOptions}
          value={watch('breed_id') ? String(watch('breed_id')) : '__none__'}
          onValueChange={(v) => setValue('breed_id', v === '__none__' ? undefined : Number(v), { shouldDirty: true })}
          disabled={!speciesId}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Sexe"
          options={SEX_OPTIONS}
          value={watch('sex') ?? 'unknown'}
          onValueChange={(v) => setValue('sex', v as AnimalFormData['sex'], { shouldDirty: true })}
          error={errors.sex?.message}
        />
        <DatePicker
          label="Date de naissance (optionnel)"
          placeholder="Sélectionner une date"
          value={watch('birthdate') ?? undefined}
          onChange={(v) => setValue('birthdate', v, { shouldDirty: true })}
          maxDate={new Date()}
          error={errors.birthdate?.message}
        />
      </div>
    </div>
  )

  const priceField = (
    <Input
      label="Prix (€)"
      type="number"
      placeholder="0"
      min={0}
      error={errors.price?.message}
      {...register('price', { valueAsNumber: true })}
    />
  )

  const locationField = (
    <CityAutocomplete
      label="Ville"
      placeholder="Rechercher une ville…"
      value={watch('city') ?? ''}
      error={errors.city?.message}
      onChange={(option) => {
        if (option) {
          setValue('city', option.city, { shouldDirty: true })
          setValue('postal_code', option.postalCode, { shouldDirty: true })
          setValue('latitude', option.lat, { shouldDirty: true })
          setValue('longitude', option.lng, { shouldDirty: true })
          setValue('region', option.region, { shouldDirty: true })
          setValue('department', option.department, { shouldDirty: true })
          setValue('department_code', option.departmentCode, { shouldDirty: true })
        } else {
          setValue('city', '', { shouldDirty: true })
          setValue('postal_code', '', { shouldDirty: true })
          setValue('latitude', undefined, { shouldDirty: true })
          setValue('longitude', undefined, { shouldDirty: true })
          setValue('region', undefined, { shouldDirty: true })
          setValue('department', undefined, { shouldDirty: true })
          setValue('department_code', undefined, { shouldDirty: true })
        }
      }}
    />
  )

  const descriptionField = (
    <Textarea
      label="Description"
      placeholder="Décrivez l'animal, son caractère, ses habitudes, son élevage… (min. 80 caractères)"
      rows={5}
      maxLength={2000}
      showCount
      error={errors.description?.message}
      {...register('description')}
    />
  )

  const submitButton = (
    <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
      {defaultValues && (
        <p className="text-xs text-text-subtle">
          {isDirty ? 'Modifications non enregistrées' : 'Toutes les modifications sont enregistrées'}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        isLoading={isLoading}
        disabled={!!defaultValues && !isDirty && !isLoading}
        className={defaultValues ? 'sm:ml-auto' : 'w-full sm:w-auto'}
      >
        {submitLabel}
      </Button>
    </div>
  )

  if (!showSections) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {identityFields}
        {priceField}
        {locationField}
        {descriptionField}
        {submitButton}
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <AnimalFormSection
        icon={PawPrint}
        title="Identité de l'animal"
        description="Espèce, race, sexe et date de naissance."
        delay={0.05}
      >
        {identityFields}
      </AnimalFormSection>

      <AnimalFormSection
        icon={Euro}
        title="Tarif & localisation"
        description="Prix de vente et ville où se trouve l'animal."
        delay={0.1}
      >
        <div className="space-y-4">
          {priceField}
          {locationField}
        </div>
      </AnimalFormSection>

      <AnimalFormSection
        icon={FileText}
        title="Description"
        description="Mettez en valeur l'animal pour attirer les acheteurs."
        delay={0.15}
      >
        {descriptionField}
        {submitButton}
      </AnimalFormSection>
    </form>
  )
}
