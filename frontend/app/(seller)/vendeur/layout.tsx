'use client'

import { usePathname } from 'next/navigation'

import { Breadcrumb } from '@/components/ui/Breadcrumb'

function buildBreadcrumb(pathname: string) {
  const items: { label: string; href?: string }[] = [
    { label: 'Accueil', href: '/' },
    { label: 'Espace vendeur', href: '/vendeur' },
  ]

  if (pathname === '/vendeur') {
    items[1] = { label: 'Espace vendeur' }
    return items
  }

  if (pathname.startsWith('/vendeur/animaux')) {
    items.push({ label: 'Mes annonces', href: '/vendeur/animaux' })
    if (pathname === '/vendeur/animaux/nouvelle') {
      items.push({ label: 'Nouvelle annonce' })
    } else if (/\/vendeur\/animaux\/\d+/.test(pathname)) {
      items.push({ label: 'Modifier l\'annonce' })
    }
    return items
  }

  if (pathname.startsWith('/vendeur/reservations')) {
    items.push({ label: 'Réservations' })
    return items
  }

  if (pathname.startsWith('/vendeur/profil')) {
    items.push({ label: 'Mon profil' })
    return items
  }

  return items
}

export default function VendeurLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="mx-auto max-w-5xl">
      <Breadcrumb items={buildBreadcrumb(pathname)} className="mb-6" />
      {children}
    </div>
  )
}
