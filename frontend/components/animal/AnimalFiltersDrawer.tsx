'use client'

import { Drawer } from '@/components/ui/Drawer'
import { AnimalFilters } from './AnimalFilters'

interface AnimalFiltersDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnimalFiltersDrawer({ open, onOpenChange }: AnimalFiltersDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Filtres" side="left">
      <AnimalFilters />
    </Drawer>
  )
}
