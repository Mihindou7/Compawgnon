'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Copy,
  FileText,
  MapPin,
  MessageSquare,
  PawPrint,
  Share2,
  Shield,
  ShoppingBag,
  Star,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { animalsApi } from '@/lib/api/animals.api'
import { messagesApi } from '@/lib/api/messages.api'
import { reservationsApi } from '@/lib/api/reservations.api'
import { AnimalCard } from '@/components/animal/AnimalCard'
import { AnimalGallery, getCoverFromAnimal } from '@/components/animal/AnimalGallery'
import { AnimalPreviewBanner } from '@/components/animal/AnimalPreviewBanner'
import { AnimalStatusBadge } from '@/components/animal/AnimalStatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { formatAge, formatPrice } from '@/lib/utils/formatters'
import { resolveUploadUrl } from '@/lib/utils/urls'

const SEX_LABELS = { male: 'Mâle', female: 'Femelle', unknown: 'Inconnu' }
const DOC_TYPE_LABELS = {
  vaccine:     'Vaccination',
  certificate: 'Certificat de cession',
  pedigree:    'Pedigree',
  other:       'Document',
}

function ReservationModal({
  animalId,
  animalTitle,
  open,
  onOpenChange,
}: {
  animalId: number
  animalTitle: string
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const router = useRouter()
  const [message, setMessage] = useState('')

  const mutation = useMutation({
    mutationFn: () => reservationsApi.create({ animal_id: animalId, message: message || undefined }),
    onSuccess: () => {
      toast.success('Demande envoyée ! Le vendeur vous contactera bientôt.')
      onOpenChange(false)
      router.push('/compte/reservations')
    },
    onError: () => toast.error('Impossible d\'envoyer la demande. Réessayez.'),
  })

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Contacter le vendeur">
      <div className="space-y-4">
        <p className="text-sm text-text-body">
          Vous êtes intéressé(e) par <span className="font-medium text-text-ink">{animalTitle}</span>.
          Ajoutez un message optionnel pour le vendeur.
        </p>
        <textarea
          placeholder="Message au vendeur (optionnel)…"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-none rounded-xl border border-border bg-surface-cream px-4 py-3 text-sm text-text-ink placeholder:text-text-subtle focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
        />
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button className="flex-1" isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            Envoyer la demande
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 last:border-0">
      <span className="text-sm text-text-subtle">{label}</span>
      <span className="text-right text-sm font-medium text-text-ink">{value}</span>
    </div>
  )
}

export default function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const reduce = useReducedMotion()
  const [reservationOpen, setReservationOpen] = useState(false)

  const startConvMutation = useMutation({
    mutationFn: () => messagesApi.start(Number(id)),
    onSuccess: (res) => router.push(`/compte/messages/${res.data.id}`),
    onError: () => toast.error('Impossible de démarrer la conversation.'),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['animal', id],
    queryFn: () => animalsApi.get(Number(id)),
    enabled: !!id,
  })

  const animal = data?.data

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: animal?.title, url })
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Lien copié dans le presse-papier.')
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-5 w-48" />
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <Skeleton className="aspect-[4/3] rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!animal) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green-lt">
          <PawPrint className="h-8 w-8 text-brand-green" />
        </div>
        <p className="font-serif text-xl text-text-ink">Annonce introuvable</p>
        <p className="max-w-sm text-center text-sm text-text-subtle">
          Cette annonce n&apos;existe pas ou n&apos;est pas accessible. Si c&apos;est la vôtre, connectez-vous pour la prévisualiser.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/animaux">Retour au catalogue</Link>
          </Button>
          {!user && (
            <Button asChild>
              <Link href={`/connexion?redirect=/animaux/${id}`}>Se connecter</Link>
            </Button>
          )}
        </div>
      </div>
    )
  }

  const breadcrumbs = [
    { label: 'Accueil', href: '/' },
    { label: 'Animaux', href: '/animaux' },
    ...(animal.species ? [{ label: animal.species.name, href: `/especes/${animal.species.slug}` }] : []),
    { label: animal.title },
  ]

  const isOwnListing = !!(user && animal.seller?.user_id === user.id)
  const isPreview = isOwnListing && animal.status !== 'published' && animal.status !== 'reserved'
  const canInteract = user && animal.status === 'published' && !isOwnListing
  const publicDocs = (animal.documents ?? []).filter((d) => d.is_public)
  const coverUrl = getCoverFromAnimal(animal.cover_url, animal.media)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Breadcrumb items={breadcrumbs} className="hidden sm:flex" />
        <Button variant="ghost" size="sm" asChild className="-ml-2 shrink-0 text-text-subtle sm:ml-0">
          <Link href="/animaux">
            <ArrowLeft className="h-4 w-4" />
            Retour au catalogue
          </Link>
        </Button>
      </div>

      {isPreview && <AnimalPreviewBanner status={animal.status} animalId={animal.id} />}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
        {/* Left — gallery & content */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="space-y-8"
        >
          <AnimalGallery cover={coverUrl} media={animal.media} title={animal.title} />

          {/* Mobile title block */}
          <div className="lg:hidden">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <AnimalStatusBadge status={animal.status} />
              {animal.sex !== 'unknown' && <Badge variant="gray">{SEX_LABELS[animal.sex]}</Badge>}
            </div>
            <h1 className="font-serif text-3xl text-text-ink">{animal.title}</h1>
            <p className="mt-2 text-2xl font-bold text-brand-green">{formatPrice(animal.price)}</p>
          </div>

          {/* Description */}
          {animal.description && (
            <section className="rounded-2xl border border-border bg-surface-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-green-lt text-brand-green">
                  <FileText className="h-4 w-4" />
                </span>
                <h2 className="font-serif text-xl text-text-ink">À propos</h2>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-text-body">{animal.description}</p>
            </section>
          )}

          {/* Specs — mobile */}
          <section className="rounded-2xl border border-border bg-surface-white p-6 lg:hidden">
            <h2 className="mb-1 font-serif text-xl text-text-ink">Caractéristiques</h2>
            <SpecRow
              label="Espèce"
              value={animal.species ? (
                <Link href={`/especes/${animal.species.slug}`} className="text-brand-green hover:underline">
                  {animal.species.name}
                </Link>
              ) : null}
            />
            <SpecRow label="Race" value={animal.breed?.name} />
            <SpecRow label="Sexe" value={animal.sex !== 'unknown' ? SEX_LABELS[animal.sex] : null} />
            <SpecRow label="Âge" value={animal.birthdate ? formatAge(animal.birthdate) : null} />
            <SpecRow
              label="Localisation"
              value={animal.city ? `${animal.city}${animal.postal_code ? ` (${animal.postal_code.slice(0, 2)})` : ''}` : null}
            />
          </section>

          {/* Documents */}
          {publicDocs.length > 0 && (
            <section className="rounded-2xl border border-border bg-surface-white p-6">
              <h2 className="mb-4 font-serif text-xl text-text-ink">Documents</h2>
              <div className="space-y-2">
                {publicDocs.map((doc) => (
                  <a
                    key={doc.id}
                    href={resolveUploadUrl(doc.file_url) ?? doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-border bg-surface-cream/50 px-4 py-3 transition-colors hover:border-brand-green/40 hover:bg-brand-green-lt"
                  >
                    <span className="text-sm font-medium text-text-ink">
                      {DOC_TYPE_LABELS[doc.type as keyof typeof DOC_TYPE_LABELS] ?? doc.original_name}
                    </span>
                    <span className="text-xs font-medium text-brand-green">Voir →</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Similar */}
          {animal.similar_animals && animal.similar_animals.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-xl text-text-ink">Annonces similaires</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {animal.similar_animals.slice(0, 4).map((a) => (
                  <AnimalCard key={a.id} animal={a} showFavoriteButton={false} />
                ))}
              </div>
            </section>
          )}
        </motion.div>

        {/* Right — sticky sidebar */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
          className="space-y-4"
        >
          <div className="lg:sticky lg:top-24 lg:space-y-4">
            {/* Main info card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-surface-white shadow-[0_4px_24px_0_rgb(0_0_0/0.05)]">
              <div className="border-b border-border bg-gradient-to-br from-brand-green-lt/40 to-surface-white px-5 py-4">
                <div className="hidden lg:block">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <AnimalStatusBadge status={animal.status} />
                    {animal.sex !== 'unknown' && <Badge variant="gray">{SEX_LABELS[animal.sex]}</Badge>}
                    {animal.birthdate && (
                      <Badge variant="gray" className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatAge(animal.birthdate)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <h1 className="font-serif text-2xl leading-tight text-text-ink">{animal.title}</h1>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="shrink-0 rounded-lg p-2 text-text-subtle transition-colors hover:bg-surface-cream hover:text-text-ink"
                      aria-label="Partager"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="font-serif text-3xl font-bold text-brand-green">{formatPrice(animal.price)}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-text-subtle">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {animal.city}
                  {animal.postal_code ? ` (${animal.postal_code.slice(0, 2)})` : ''}
                </p>
              </div>

              <div className="hidden px-5 lg:block">
                <SpecRow
                  label="Espèce"
                  value={animal.species ? (
                    <Link href={`/especes/${animal.species.slug}`} className="text-brand-green hover:underline">
                      {animal.species.name}
                    </Link>
                  ) : null}
                />
                <SpecRow label="Race" value={animal.breed?.name} />
              </div>

              <div className="space-y-2.5 p-5 pt-4">
                {canInteract ? (
                  <>
                    <Button className="w-full" size="lg" leftIcon={ShoppingBag} onClick={() => setReservationOpen(true)}>
                      Faire une demande
                    </Button>
                    <Button
                      className="w-full"
                      size="lg"
                      variant="outline"
                      leftIcon={MessageSquare}
                      isLoading={startConvMutation.isPending}
                      onClick={() => startConvMutation.mutate()}
                    >
                      Envoyer un message
                    </Button>
                  </>
                ) : !user ? (
                  <Button className="w-full" size="lg" asChild>
                    <Link href={`/connexion?redirect=/animaux/${animal.id}`}>
                      Se connecter pour contacter
                    </Link>
                  </Button>
                ) : isOwnListing ? (
                  <Button className="w-full" size="lg" variant="outline" asChild>
                    <Link href={`/vendeur/animaux/${animal.id}`}>
                      Modifier l&apos;annonce
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" disabled>
                    {animal.status === 'reserved' ? 'Réservé' : 'Indisponible'}
                  </Button>
                )}
              </div>
            </div>

            {/* Seller */}
            {animal.seller && (
              <div className="rounded-2xl border border-border bg-surface-white p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-subtle">Vendeur</p>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-green-lt font-serif text-lg font-bold text-brand-green">
                      {animal.seller.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-text-ink">{animal.seller.name}</p>
                      <p className="text-xs capitalize text-text-subtle">
                        {animal.seller.type === 'breeder' ? 'Éleveur' : 'Animalerie'}
                      </p>
                    </div>
                  </div>
                  {animal.seller.verified_status === 'approved' && (
                    <div className="flex items-center gap-1 rounded-full bg-brand-green-lt px-2 py-1 text-xs font-medium text-brand-green">
                      <Shield className="h-3.5 w-3.5" />
                      Certifié
                    </div>
                  )}
                </div>

                {animal.seller.rating != null && (
                  <div className="mb-3 flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-gold text-gold" />
                    <span className="text-sm font-semibold text-text-ink">{animal.seller.rating.toFixed(1)}</span>
                    {animal.seller.reviews_count != null && (
                      <span className="text-xs text-text-subtle">({animal.seller.reviews_count} avis)</span>
                    )}
                  </div>
                )}

                <p className="mb-4 flex items-center gap-1.5 text-sm text-text-subtle">
                  <MapPin className="h-3.5 w-3.5" />
                  {animal.seller.city}
                </p>

                {!isOwnListing && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/vendeurs/${animal.seller.id}`}>Voir le profil vendeur</Link>
                  </Button>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-brand-green/20 bg-brand-green-lt/60 px-4 py-3.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                <p className="text-xs leading-relaxed text-brand-green">
                  Échange sécurisé via Compawgnon. Ne payez jamais en dehors de la plateforme.
                </p>
              </div>
            </div>

            {/* Share mobile */}
            <Button variant="outline" size="sm" className="w-full lg:hidden" leftIcon={Copy} onClick={handleShare}>
              Partager l&apos;annonce
            </Button>
          </div>
        </motion.div>
      </div>

      <ReservationModal
        animalId={animal.id}
        animalTitle={animal.title}
        open={reservationOpen}
        onOpenChange={setReservationOpen}
      />
    </div>
  )
}
