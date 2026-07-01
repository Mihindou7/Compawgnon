import { Suspense } from 'react'
import type { Metadata } from 'next'

import { CatalogueContent } from './CatalogueContent'

export const metadata: Metadata = {
  title: 'Animaux disponibles — Compawgnon',
  description: "Trouvez votre compagnon idéal parmi des milliers d'animaux d'éleveurs certifiés.",
}

export default function AnimauxPage() {
  return (
    <Suspense>
      <CatalogueContent />
    </Suspense>
  )
}
