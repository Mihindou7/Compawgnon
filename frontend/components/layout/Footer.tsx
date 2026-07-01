import { Globe, Mail, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const COLUMNS = [
  {
    title: 'Découvrir',
    links: [
      { href: '/animaux',   label: 'Tous les animaux' },
      { href: '/especes',   label: 'Espèces & races' },
    ],
  },
  {
    title: 'Mon espace',
    links: [
      { href: '/connexion',         label: 'Se connecter' },
      { href: '/inscription',        label: 'Créer un compte' },
      { href: '/compte/devenir-vendeur', label: 'Devenir vendeur' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { href: '/cgu',           label: 'CGU' },
      { href: '/confidentialite', label: 'Vie privée' },
      { href: '/contact',       label: 'Contact' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-surface-night text-white/80">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-green">
                <span className="text-base">🐾</span>
              </div>
              <span className="font-serif text-xl text-white">Compawgnon</span>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              La plateforme de référence pour trouver votre compagnon idéal auprès d&apos;éleveurs certifiés.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Globe,        href: '#', label: 'Site' },
                { icon: ExternalLink,href: '#', label: 'Blog' },
                { icon: Mail,        href: '#', label: 'Email' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-colors hover:bg-brand-green hover:text-white"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Compawgnon — Tous droits réservés
          </p>
          <p className="text-xs text-white/40">
            Fait avec ♥ pour les animaux de compagnie
          </p>
        </div>
      </div>
    </footer>
  )
}
