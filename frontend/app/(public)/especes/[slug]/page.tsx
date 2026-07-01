'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { animalsApi } from '@/lib/api/animals.api'
import { speciesApi } from '@/lib/api/species.api'
import { AnimalCard } from '@/components/animal/AnimalCard'
import { AnimalCardSkeleton } from '@/components/animal/AnimalCardSkeleton'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { PawPrint } from 'lucide-react'

const SPECIES_EMOJIS: Record<string, string> = {
  chien:   '🐕',
  chat:    '🐈',
  lapin:   '🐇',
  oiseau:  '🦜',
  rongeur: '🐹',
  reptile: '🦎',
  poisson: '🐠',
  autre:   '🐾',
}

export default function EspeceDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data: speciesData, isLoading: speciesLoading } = useQuery({
    queryKey: ['species', slug],
    queryFn: () => speciesApi.get(slug),
    enabled: !!slug,
  })

  const { data: breedsData } = useQuery({
    queryKey: ['breeds', 'species_slug', slug],
    queryFn: () => speciesApi.listBreeds({ species_slug: slug }),
    enabled: !!slug,
  })

  const species = speciesData?.data

  const { data: animalsData, isLoading: animalsLoading } = useQuery({
    queryKey: ['animals', 'species_slug', slug],
    queryFn: () => animalsApi.list({ species_slug: slug, limit: 6 }),
    enabled: !!slug,
  })

  const animals = animalsData?.data ?? []
  const breeds = breedsData?.data ?? []

  if (speciesLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-8 h-5 w-48" />
        <Skeleton className="mb-4 h-10 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }

  if (!species) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <p className="text-text-subtle">Espèce introuvable.</p>
        <Button variant="outline" asChild>
          <Link href="/especes">Retour aux espèces</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Espèces', href: '/especes' },
          { label: species.name },
        ]}
        className="mb-8"
      />

      {/* Hero */}
      <div className="mb-10 flex items-start gap-6">
        <span className="shrink-0 text-6xl">{SPECIES_EMOJIS[slug] ?? '🐾'}</span>
        <div>
          <h1 className="font-serif text-4xl text-text-ink">{species.name}</h1>
          {species.description && (
            <p className="mt-2 max-w-2xl text-text-body">{species.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {species.life_span && (
              <Badge variant="gray">Durée de vie : {species.life_span}</Badge>
            )}
            {species.budget && (
              <Badge variant="gray">Budget : {species.budget}</Badge>
            )}
            {species.maintenance_level && (
              <Badge variant="gray">
                {species.maintenance_level === 'low' ? 'Entretien facile' :
                 species.maintenance_level === 'medium' ? 'Entretien moyen' : 'Entretien exigeant'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Breeds */}
      {breeds.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 font-serif text-2xl text-text-ink">
            Races ({breeds.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {breeds.map((breed) => (
              <Link
                key={breed.id}
                href={`/animaux?espece=${species.id}&race=${breed.id}`}
                className="group flex items-center justify-between rounded-xl border border-border bg-surface-white px-4 py-3 transition-all hover:border-brand-green/40 hover:bg-brand-green-lt"
              >
                <div>
                  <p className="text-sm font-medium text-text-ink group-hover:text-brand-green">
                    {breed.name}
                  </p>
                  {breed.available_animals_count !== undefined && breed.available_animals_count > 0 && (
                    <p className="text-xs text-text-subtle">{breed.available_animals_count} dispo</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-text-subtle group-hover:text-brand-green" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Animals */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-serif text-2xl text-text-ink">
            Annonces disponibles
          </h2>
          <Link
            href={`/animaux?espece_slug=${slug}`}
            className="flex items-center gap-1 text-sm font-medium text-brand-green hover:underline"
          >
            Voir tout <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {animalsLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <AnimalCardSkeleton key={i} />)}
          </div>
        ) : animals.length === 0 ? (
          <EmptyState
            icon={PawPrint}
            title="Aucune annonce pour le moment"
            description="Soyez notifié dès qu'un animal de cette espèce est disponible."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {animals.map((a) => (
              <AnimalCard key={a.id} animal={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
