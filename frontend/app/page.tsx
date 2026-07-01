'use client'

import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, Heart, Search, Shield, Star, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { FloatingPaws } from '@/components/home/FloatingPaws'
import { HeroBackground } from '@/components/home/HeroBackground'
import { RecentAnimalsShowcase } from '@/components/home/RecentAnimalsShowcase'
import { StatsMarquee } from '@/components/home/StatsMarquee'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { speciesApi } from '@/lib/api/species.api'
import { resolveUploadUrl } from '@/lib/utils/urls'

const FEATURES = [
  { icon: Shield, title: 'Éleveurs vérifiés',  desc: 'Chaque vendeur est contrôlé et certifié par notre équipe.' },
  { icon: Search, title: 'Recherche avancée',   desc: 'Filtres précis par espèce, race, âge, prix et localisation.' },
  { icon: Star,   title: 'Avis authentiques',   desc: "Lisez les avis vérifiés d'acheteurs réels avant de décider." },
  { icon: Zap,    title: 'Réponse rapide',      desc: 'Échangez directement avec les vendeurs en quelques clics.' },
]

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' as const },
    viewport: { once: true as const },
  }
}

export default function HomePage() {
  const router = useRouter()
  const [queryText, setQueryText] = useState('')
  const [cityText, setCityText] = useState('')

  const { data: speciesData } = useQuery({
    queryKey: ['species'],
    queryFn: () => speciesApi.list(),
    staleTime: 10 * 60 * 1000,
  })

  const species = speciesData?.data ?? []

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (queryText.trim()) params.set('q', queryText.trim())
    if (cityText.trim()) params.set('ville', cityText.trim())
    const qs = params.toString()
    router.push(`/animaux${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-[#0d1f0f]">
        <HeroBackground />
        <FloatingPaws />

        <div className="relative z-[2] mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="max-w-2xl">
            <motion.div
              {...fadeUp(0)}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
            >
              <CheckCircle className="h-4 w-4 text-brand-green" />
              +2 000 animaux disponibles en France
            </motion.div>

            <motion.h1 {...fadeUp(1)}
              className="font-serif text-5xl leading-tight text-white sm:text-6xl lg:text-7xl"
            >
              Trouvez votre{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-brand-green">compagnon</span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-3 -skew-x-2 bg-brand-green/30"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                />
              </span>{' '}
              idéal
            </motion.h1>

            <motion.p {...fadeUp(2)} className="mt-6 max-w-xl text-lg text-white/80">
              Découvrez des milliers d&apos;animaux auprès d&apos;éleveurs et animaleries certifiés.
              Adoption sécurisée, avis vérifiés.
            </motion.p>

            <motion.form {...fadeUp(3)}
              onSubmit={handleSearch}
              className="mt-10 flex max-w-xl flex-col gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md sm:flex-row"
            >
              <input type="text" name="q" placeholder="Espèce, race..."
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
              />
              <input type="text" name="ville" placeholder="Ville, département..."
                value={cityText}
                onChange={(e) => setCityText(e.target.value)}
                className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
              />
              <Button type="submit" size="lg" className="shrink-0">
                <Search className="h-4 w-4 mr-1" />Rechercher
              </Button>
            </motion.form>

            <motion.p {...fadeUp(4)} className="mt-4 text-sm text-white/50">
              Populaire :{' '}
              {['Golden Retriever', 'Maine Coon', 'Lapin nain'].map((s, i) => (
                <span key={s}>{i > 0 && ' · '}
                  <Link href={`/animaux?q=${encodeURIComponent(s)}`} className="text-brand-green hover:underline">{s}</Link>
                </span>
              ))}
            </motion.p>
          </div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xs text-white/40">Découvrir</span>
            <div className="h-8 w-px bg-gradient-to-b from-white/30 to-transparent" />
          </div>
        </motion.div>
      </section>

      {/* ─── Stats (marquee continu) ─── */}
      <StatsMarquee />

      {/* ─── Espèces populaires ─── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex items-end justify-between">
            <motion.div {...fadeUp(0)}>
              <p className="text-sm font-medium text-brand-green">Toutes espèces</p>
              <h2 className="font-serif text-4xl text-text-ink">Parcourez par espèce</h2>
            </motion.div>
            <Link href="/especes" className="hidden items-center gap-1 text-sm font-medium text-brand-green hover:underline sm:flex">
              Voir tout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(species.length > 0 ? species.slice(0, 8) : Array.from({ length: 8 }, () => null)).map((s, i) => {
              if (!s) return (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-surface-cream" />
              )
              const sp = s as { id: number; name: string; image_url?: string; available_animals_count?: number }
              const imgUrl = resolveUploadUrl(sp.image_url)
              return (
                <motion.div key={sp.id} {...fadeUp(i)}>
                  <Link href={`/animaux?espece=${sp.id}`}
                    className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-surface-cream"
                  >
                    {imgUrl ? (
                      <Image src={imgUrl} alt={sp.name} fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center"><span className="text-4xl">🐾</span></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="font-semibold text-white">{sp.name}</p>
                      <p className="text-xs text-white/70">{sp.available_animals_count ?? 0} annonces</p>
                    </div>
                    <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Annonces récentes ─── */}
      <section className="bg-surface-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex items-end justify-between">
            <motion.div {...fadeUp(0)}>
              <p className="text-sm font-medium text-brand-green">Nouveautés</p>
              <h2 className="font-serif text-4xl text-text-ink">Annonces récentes</h2>
            </motion.div>
            <Link href="/animaux" className="flex items-center gap-1 text-sm font-medium text-brand-green hover:underline">
              Voir toutes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <RecentAnimalsShowcase />
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fadeUp(0)} className="mb-12 text-center">
            <p className="text-sm font-medium text-brand-green">Pourquoi Compawgnon ?</p>
            <h2 className="mt-2 font-serif text-4xl text-text-ink">Une adoption en toute confiance</h2>
          </motion.div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} {...fadeUp(i)}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="cursor-default rounded-2xl border border-border bg-surface-white p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-green-lt">
                  <f.icon className="h-6 w-6 text-brand-green" />
                </div>
                <h3 className="font-serif text-lg text-text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-subtle">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Témoignages ─── */}
      <TestimonialsSection />

      {/* ─── CTA Vendeur ─── */}
      <section className="relative overflow-hidden bg-[#0d1f0f] py-24">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-brand-green blur-[80px]" />
          <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-gold blur-[80px]" />
        </div>
        <motion.div {...fadeUp(0)} className="relative mx-auto max-w-3xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/70">
            <Heart className="h-4 w-4 text-brand-green" />
            Rejoignez notre communauté
          </div>
          <h2 className="font-serif text-4xl text-white sm:text-5xl">Vous êtes éleveur ou animalerie ?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
            Rejoignez Compawgnon et touchez des milliers d&apos;adoptants potentiels partout en France.
            Inscription gratuite, certification rapide.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button variant="outline" size="lg" className="border-white/30 bg-white text-brand-green hover:bg-white/90" asChild>
              <Link href="/compte/devenir-vendeur">Déposer une demande</Link>
            </Button>
            <Button variant="ghost" size="lg" className="text-white hover:bg-white/10" asChild>
              <Link href="/especes">En savoir plus</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
