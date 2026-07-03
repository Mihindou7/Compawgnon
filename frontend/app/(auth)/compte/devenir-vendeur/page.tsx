'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Clock, Loader2, Mail, PartyPopper, Search, Shield } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { sellerApplyApi } from '@/lib/api/sellers_apply.api'
import { sellerApplicationSchema, type SellerApplicationData } from '@/lib/schemas/profile.schema'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/hooks/useAuth'

interface SiretResult {
  nom_complet?: string
  siege?: {
    adresse?: string
    code_postal?: string
    libelle_commune?: string
    latitude?: string
    longitude?: string
  }
}

async function lookupSiret(siret: string): Promise<SiretResult | null> {
  try {
    const res = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${siret}&per_page=1`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.results?.[0] ?? null
  } catch {
    return null
  }
}

const SELLER_TYPE_OPTIONS = [
  { value: 'breeder',  label: 'Éleveur particulier / professionnel' },
  { value: 'pet_shop', label: 'Animalerie' },
]

const PERKS = [
  'Publiez des annonces visibles par des milliers d\'acheteurs',
  'Tableau de bord vendeur avec statistiques',
  'Gestion des réservations et échanges sécurisés',
  'Badge "Certifié" après vérification de votre activité',
]

export default function DevenirVendeurPage() {
  const { sellerStatus } = useAuth()
  const queryClient = useQueryClient()
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [siretLoading, setSiretLoading] = useState(false)
  const [siretFound, setSiretFound] = useState<boolean | null>(null)

  const { data: myStore } = useQuery({
    queryKey: ['seller-me'],
    queryFn: () => sellerApplyApi.getMyStore(),
    retry: false,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SellerApplicationData>({
    resolver: zodResolver(sellerApplicationSchema),
  })

  async function handleSiretLookup() {
    const siret = watch('siret')
    if (!/^\d{14}$/.test(siret ?? '')) return
    setSiretLoading(true)
    setSiretFound(null)
    const result = await lookupSiret(siret)
    setSiretLoading(false)
    if (!result) { setSiretFound(false); return }
    setSiretFound(true)
    if (result.nom_complet) setValue('name', result.nom_complet)
    if (result.siege?.adresse) setValue('address', result.siege.adresse)
    if (result.siege?.libelle_commune) setValue('city', result.siege.libelle_commune)
    if (result.siege?.code_postal) setValue('postal_code', result.siege.code_postal)
    if (result.siege?.latitude)  setValue('latitude',  parseFloat(result.siege.latitude))
    if (result.siege?.longitude) setValue('longitude', parseFloat(result.siege.longitude))
  }

  const mutation = useMutation({
    mutationFn: (data: SellerApplicationData) => sellerApplyApi.apply(data),
    onSuccess: () => {
      toast.success('Demande envoyée ! Notre équipe vous contactera sous 48h.')
      setJustSubmitted(true)
      queryClient.invalidateQueries({ queryKey: ['seller-me'] })
    },
    onError: () => toast.error('Impossible d\'envoyer la demande. Réessayez.'),
  })

  if (sellerStatus === 'approved') {
    return (
      <div className="max-w-lg">
        <div className="rounded-2xl border border-brand-green/30 bg-brand-green-lt p-6 text-center">
          <Shield className="mx-auto mb-3 h-12 w-12 text-brand-green" />
          <h2 className="mb-2 font-serif text-2xl text-text-ink">Vous êtes vendeur certifié</h2>
          <p className="text-sm text-text-body">
            Votre compte vendeur est actif. Gérez vos annonces depuis votre espace vendeur.
          </p>
          <Button className="mt-4" asChild>
            <a href="/vendeur">Accéder à mon espace vendeur</a>
          </Button>
        </div>
      </div>
    )
  }

  if (justSubmitted || sellerStatus === 'pending' || myStore?.data) {
    const steps = [
      { icon: CheckCircle, title: 'Demande reçue', desc: 'Votre dossier nous est bien parvenu.', done: true },
      { icon: Clock,       title: 'Examen par notre équipe', desc: 'Nous vérifions vos informations sous 48h ouvrables.', done: false },
      { icon: Shield,      title: 'Activation de votre espace vendeur', desc: 'Vous pourrez publier vos annonces dès la validation.', done: false },
    ]

    return (
      <div className="mx-auto max-w-xl">
        <div className="overflow-hidden rounded-3xl border border-border bg-surface-white shadow-[0_8px_40px_-12px_rgb(0_0_0/0.12)]">
          {/* Header */}
          <div className="relative flex flex-col items-center gap-4 bg-gradient-to-b from-brand-green-lt to-surface-white px-6 pb-8 pt-10 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-brand-green text-white shadow-lg">
              <PartyPopper className="h-9 w-9" />
              <span className="absolute inset-0 animate-ping rounded-full bg-brand-green/30" />
            </div>
            <div>
              <Badge variant="amber" className="mb-3">En attente de validation</Badge>
              <h1 className="font-serif text-3xl text-text-ink">Votre demande a bien été envoyée&nbsp;!</h1>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-6 px-6 pb-8 sm:px-8">
            <p className="text-center text-text-body leading-relaxed">
              Merci pour votre confiance et bienvenue dans l&apos;aventure Compawgnon&nbsp;!
              Nous avons hâte de découvrir votre activité. Notre équipe va étudier votre dossier
              avec le plus grand soin et reviendra vers vous{' '}
              <span className="font-medium text-text-ink">dans les plus brefs délais</span>.
              Pas besoin de renvoyer votre demande&nbsp;: tout est entre de bonnes mains.
            </p>

            {/* Timeline */}
            <div className="rounded-2xl border border-border bg-surface-cream/50 p-5">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
                Les prochaines étapes
              </p>
              <ol className="space-y-4">
                {steps.map((step, i) => (
                  <li key={step.title} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <span
                        className={
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full ' +
                          (step.done
                            ? 'bg-brand-green text-white'
                            : 'border border-border bg-surface-white text-text-subtle')
                        }
                      >
                        <step.icon className="h-4 w-4" />
                      </span>
                      {i < steps.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-border" />}
                    </div>
                    <div className="pb-1">
                      <p className="font-medium text-text-ink">{step.title}</p>
                      <p className="text-sm text-text-subtle">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Email note */}
            <div className="flex items-start gap-3 rounded-xl bg-brand-green-lt p-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
              <p className="text-sm text-brand-green">
                Vous recevrez un email dès que votre compte vendeur sera validé. Pensez à vérifier
                vos spams au cas où&nbsp;!
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="primary" className="flex-1">
                <Link href="/compte">Retour à mon compte</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/animaux">Découvrir les annonces</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 font-serif text-3xl text-text-ink">Devenir vendeur</h1>
      <p className="mb-8 text-text-body">
        Rejoignez notre réseau d&apos;éleveurs et animaleries certifiés.
      </p>

      {/* Perks */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PERKS.map((perk) => (
          <div key={perk} className="flex items-start gap-2.5 rounded-xl bg-brand-green-lt p-3">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
            <p className="text-sm text-brand-green">{perk}</p>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="space-y-5 rounded-2xl border border-border bg-surface-white p-6"
      >
        <h2 className="font-serif text-xl text-text-ink">Informations de votre activité</h2>

        <Input
          label="Nom de votre activité"
          placeholder="Élevage du Moulin, Animalerie Centrale…"
          error={errors.name?.message}
          {...register('name')}
        />

        <Select
          label="Type d'activité"
          options={SELLER_TYPE_OPTIONS}
          value={watch('type')}
          onValueChange={(v) => setValue('type', v as 'breeder' | 'pet_shop')}
          error={errors.type?.message}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-ink">
            Numéro SIRET
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="12345678901234"
                maxLength={14}
                error={errors.siret?.message}
                {...register('siret')}
              />
            </div>
            <button
              type="button"
              onClick={handleSiretLookup}
              disabled={siretLoading || !/^\d{14}$/.test(watch('siret') ?? '')}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface-white px-3 text-sm font-medium text-text-body transition-all hover:border-brand-green/40 hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-40"
              title="Rechercher l'entreprise"
            >
              {siretLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Search className="h-4 w-4" />}
              <span className="hidden sm:inline">Rechercher</span>
            </button>
          </div>
          {siretFound === true && (
            <p className="mt-1 flex items-center gap-1 text-xs text-brand-green">
              <CheckCircle className="h-3 w-3" /> Entreprise trouvée — informations pré-remplies
            </p>
          )}
          {siretFound === false && (
            <p className="mt-1 text-xs text-red-500">Aucune entreprise trouvée pour ce SIRET.</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Ville"
            placeholder="Paris"
            error={errors.city?.message}
            {...register('city')}
          />
          <Input
            label="Code postal"
            placeholder="75001"
            maxLength={5}
            error={errors.postal_code?.message}
            {...register('postal_code')}
          />
        </div>

        <Input
          label="Adresse (optionnel)"
          placeholder="12 rue de la Paix"
          error={errors.address?.message}
          {...register('address')}
        />

        <Textarea
          label="Description de votre activité (optionnel)"
          placeholder="Décrivez votre élevage, vos pratiques, vos espèces…"
          rows={4}
          maxLength={1000}
          showCount
          error={errors.description?.message}
          {...register('description')}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={mutation.isPending}
        >
          Envoyer ma demande
        </Button>

        <p className="text-center text-xs text-text-subtle">
          Votre demande sera examinée sous 48h ouvrables. Vous recevrez un email de confirmation.
        </p>
      </form>
    </div>
  )
}
