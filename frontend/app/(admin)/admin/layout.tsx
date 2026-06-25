'use client'

import { usePathname } from 'next/navigation'

import { Breadcrumb } from '@/components/ui/Breadcrumb'

function buildBreadcrumb(pathname: string) {
  const items: { label: string; href?: string }[] = [
    { label: 'Accueil', href: '/' },
    { label: 'Administration', href: '/admin' },
  ]

  if (pathname === '/admin') {
    items[1] = { label: 'Administration' }
    return items
  }

  const routes: Record<string, string> = {
    '/admin/utilisateurs': 'Utilisateurs',
    '/admin/vendeurs':     'Vendeurs',
    '/admin/annonces':     'Annonces',
    '/admin/avis':         'Avis',
    '/admin/contacts':     'Contacts',
    '/admin/especes':      'Espèces',
    '/admin/audit':        'Journal d\'audit',
  }

  const label = routes[pathname]
  if (label) items.push({ label })

  return items
}

export default function AdminNestedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="mx-auto max-w-6xl">
      <Breadcrumb items={buildBreadcrumb(pathname)} className="mb-6" />
      {children}
    </div>
  )
}
