import type { Metadata } from 'next'
import { Crimson_Pro, DM_Sans } from 'next/font/google'
import { Toaster } from 'sonner'

import { Providers } from './providers'
import './globals.css'

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-crimson',
  display: 'swap',
  weight: ['400', '600', '700'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Compawgnon — Trouvez votre compagnon idéal',
    template: '%s — Compawgnon',
  },
  description: 'La plateforme de référence pour trouver votre animal de compagnie auprès d\'éleveurs et animaleries certifiés.',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Compawgnon',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${crimsonPro.variable} ${dmSans.variable} h-full`} data-scroll-behavior="smooth">
      <body className="min-h-full font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { borderRadius: '12px', fontFamily: 'var(--font-dm-sans)' },
          }}
          richColors
        />
      </body>
    </html>
  )
}
