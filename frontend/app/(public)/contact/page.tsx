import { Clock, HelpCircle, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { ContactForm } from '@/components/contact/ContactForm'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Une question, une suggestion ou un signalement ? Contactez l\'équipe Compawgnon, nous vous répondons sous 48 heures.',
}

const CHANNELS = [
  {
    icon: Mail,
    title: 'Email',
    value: 'contact@compawgnon.fr',
    href: 'mailto:contact@compawgnon.fr',
  },
  {
    icon: Phone,
    title: 'Téléphone',
    value: '+33 1 23 45 67 89',
    href: 'tel:+33123456789',
  },
  {
    icon: MapPin,
    title: 'Adresse',
    value: '12 rue des Compagnons, 75011 Paris',
  },
  {
    icon: Clock,
    title: 'Horaires',
    value: 'Lun – Ven · 9h – 18h',
  },
]

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Breadcrumb
        items={[{ label: 'Accueil', href: '/' }, { label: 'Contact' }]}
        className="mb-8"
      />

      <header className="mb-10 max-w-2xl">
        <p className="text-sm font-medium text-brand-green">Nous écrire</p>
        <h1 className="mt-1 font-serif text-4xl text-text-ink">Contactez-nous</h1>
        <p className="mt-3 text-text-body">
          Une question sur une annonce, votre compte ou pour devenir vendeur ? Notre équipe est là pour vous aider et
          vous répond généralement sous 48 heures ouvrées.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        {/* Formulaire */}
        <div className="order-2 rounded-2xl border border-border bg-surface-white p-6 shadow-card sm:p-8 lg:order-1">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-green-lt">
              <MessageCircle className="h-4.5 w-4.5 text-brand-green" />
            </div>
            <h2 className="font-serif text-xl text-text-ink">Envoyez-nous un message</h2>
          </div>
          <ContactForm />
        </div>

        {/* Coordonnées */}
        <aside className="order-1 space-y-4 lg:order-2">
          <div className="rounded-2xl border border-border bg-surface-white p-6 shadow-card">
            <h2 className="mb-4 font-serif text-lg text-text-ink">Nos coordonnées</h2>
            <ul className="space-y-4">
              {CHANNELS.map(({ icon: Icon, title, value, href }) => (
                <li key={title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-cream">
                    <Icon className="h-4 w-4 text-brand-green" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">{title}</p>
                    {href ? (
                      <a href={href} className="text-sm text-text-ink transition-colors hover:text-brand-green">
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm text-text-ink">{value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-brand-green/20 bg-brand-green-lt p-6">
            <div className="flex items-center gap-2.5">
              <HelpCircle className="h-5 w-5 text-brand-green" />
              <h2 className="font-serif text-lg text-text-ink">Besoin d&apos;aide rapidement ?</h2>
            </div>
            <p className="mt-2 text-sm text-text-body">
              Consultez nos conditions d&apos;utilisation et notre politique de confidentialité pour les questions
              fréquentes.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/cgu"
                className="rounded-lg bg-surface-white px-3 py-1.5 text-sm font-medium text-brand-green ring-1 ring-brand-green/20 transition-colors hover:bg-white"
              >
                CGU
              </Link>
              <Link
                href="/confidentialite"
                className="rounded-lg bg-surface-white px-3 py-1.5 text-sm font-medium text-brand-green ring-1 ring-brand-green/20 transition-colors hover:bg-white"
              >
                Vie privée
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
