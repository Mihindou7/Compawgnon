import { Suspense } from 'react'
import { PawPrint } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Connexion — Compawgnon',
}

export default function ConnexionPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-cream px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <span className="font-serif text-2xl text-text-ink">Compawgnon</span>
          </Link>
          <h1 className="font-serif text-3xl text-text-ink">Bon retour !</h1>
          <p className="text-sm text-text-subtle">Connectez-vous à votre espace</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-surface-white p-8 shadow-[0_4px_24px_0_rgb(0_0_0/0.06)]">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
