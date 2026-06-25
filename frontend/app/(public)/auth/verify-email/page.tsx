import { Suspense } from 'react'
import { Loader2, PawPrint } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { VerifyEmailClient } from './VerifyEmailClient'

export const metadata: Metadata = {
  title: 'Vérification de l\'email — Compawgnon',
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-surface-cream px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <span className="font-serif text-2xl text-text-ink">Compawgnon</span>
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-surface-white p-8 shadow-[0_4px_24px_0_rgb(0_0_0/0.06)]">
          <Suspense
            fallback={
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-brand-green" />
                <p className="text-text-subtle">Vérification en cours…</p>
              </div>
            }
          >
            <VerifyEmailClient />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
