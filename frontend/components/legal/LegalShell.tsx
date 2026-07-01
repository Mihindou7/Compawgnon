import type { ReactNode } from 'react'

import { Breadcrumb } from '@/components/ui/Breadcrumb'

export interface LegalSection {
  id: string
  title: string
  content: ReactNode
}

interface LegalShellProps {
  eyebrow?: string
  title: string
  intro?: string
  updatedAt?: string
  sections: LegalSection[]
}

export function LegalShell({ eyebrow = 'Informations légales', title, intro, updatedAt, sections }: LegalShellProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Breadcrumb
        items={[{ label: 'Accueil', href: '/' }, { label: title }]}
        className="mb-8"
      />

      {/* Header */}
      <header className="mb-10 max-w-3xl">
        <p className="text-sm font-medium text-brand-green">{eyebrow}</p>
        <h1 className="mt-1 font-serif text-4xl text-text-ink">{title}</h1>
        {intro && <p className="mt-3 text-text-body">{intro}</p>}
        {updatedAt && (
          <p className="mt-4 inline-flex items-center rounded-full bg-surface-white px-3 py-1 text-xs font-medium text-text-subtle ring-1 ring-border">
            Dernière mise à jour : {updatedAt}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        {/* Sommaire */}
        <aside className="hidden lg:block">
          <nav aria-label="Sommaire" className="sticky top-24">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-subtle">
              Sommaire
            </p>
            <ol className="space-y-2 border-l border-border">
              {sections.map((section, i) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px block border-l-2 border-transparent py-1 pl-4 text-sm text-text-subtle transition-colors hover:border-brand-green hover:text-brand-green"
                  >
                    {i + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        {/* Contenu */}
        <article className="max-w-3xl space-y-10">
          {sections.map((section, i) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="mb-3 font-serif text-2xl text-text-ink">
                <span className="text-brand-green">{i + 1}.</span> {section.title}
              </h2>
              <div className="space-y-3 leading-relaxed text-text-body [&_a]:text-brand-green [&_a]:underline [&_a:hover]:text-brand-green-dk [&_li]:ml-1 [&_strong]:text-text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                {section.content}
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  )
}
