'use client'

import { Heart, PawPrint, ShieldCheck, Sparkles, Star, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Stat {
  icon: LucideIcon
  value: string
  label: string
}

const STATS: Stat[] = [
  { icon: PawPrint,    value: '2 000+', label: 'Animaux disponibles' },
  { icon: ShieldCheck, value: '500+',   label: 'Éleveurs certifiés' },
  { icon: Star,        value: '98%',    label: 'Avis positifs' },
  { icon: Heart,       value: '15k+',   label: 'Adoptions réussies' },
  { icon: Users,       value: '40k+',   label: 'Membres actifs' },
  { icon: Sparkles,    value: '24/7',   label: 'Accompagnement' },
]

function StatItem({ icon: Icon, value, label }: Stat) {
  return (
    <div className="flex items-center gap-3 px-8">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-serif text-2xl font-bold text-white">{value}</span>
        <span className="text-sm text-white/70">{label}</span>
      </span>
      <PawPrint className="ml-6 h-4 w-4 text-white/25" />
    </div>
  )
}

export function StatsMarquee() {
  const items = [...STATS, ...STATS]
  return (
    <section className="bg-brand-green py-10">
      <div className="pause-on-hover relative flex overflow-hidden">
        {/* Fondus latéraux */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-brand-green to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-brand-green to-transparent" />

        <div className="animate-marquee flex min-w-max items-center">
          {items.map((stat, i) => (
            <StatItem key={i} {...stat} />
          ))}
        </div>
      </div>
    </section>
  )
}
