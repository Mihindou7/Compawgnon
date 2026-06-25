import { Skeleton } from '@/components/ui/Skeleton'

export function AnimalCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface-white overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-3 w-1/5" />
        </div>
      </div>
    </div>
  )
}
