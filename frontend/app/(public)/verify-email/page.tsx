import { PawPrint } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'

import { VerifyEmailContent } from './VerifyEmailContent'

export const metadata: Metadata = {
  title: 'Vérification email — Compawgnon',
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-cream px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <span className="font-serif text-2xl text-text-ink">Compawgnon</span>
          </Link>
          <h1 className="font-serif text-3xl text-text-ink">Vérification email</h1>
          <p className="text-sm text-text-subtle">Confirmation de votre adresse email</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-white p-8 shadow-[0_4px_24px_0_rgb(0_0_0/0.06)]">
          <Suspense
            fallback={
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
                <p className="text-text-subtle">Chargement…</p>
              </div>
            }
          >
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
