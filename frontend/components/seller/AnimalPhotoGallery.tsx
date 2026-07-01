'use client'

import { ImagePlus, Star, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'
import { useRef } from 'react'

import { resolveUploadUrl } from '@/lib/utils/urls'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import type { AnimalMedia } from '@/lib/types/api.types'

interface AnimalPhotoGalleryProps {
  media: AnimalMedia[]
  onUpload: (files: File[]) => void
  onDelete: (mediaId: number) => void
  isUploading?: boolean
  className?: string
}

export function AnimalPhotoGallery({
  media,
  onUpload,
  onDelete,
  isUploading,
  className,
}: AnimalPhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files?.length) return
    onUpload(Array.from(files))
  }

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-text-subtle">
          {media.length > 0
            ? `${media.length} photo${media.length > 1 ? 's' : ''} · La couverture est affichée en premier`
            : 'Ajoutez au moins une photo pour rendre votre annonce attractive.'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={Upload}
          isLoading={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          Ajouter
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {media.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border py-12 transition-all duration-200 hover:border-brand-green/50 hover:bg-surface-cream"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green-lt">
            <ImagePlus className="h-6 w-6 text-brand-green" />
          </span>
          <div className="text-center">
            <p className="font-medium text-text-ink">Glissez ou cliquez pour ajouter des photos</p>
            <p className="mt-0.5 text-sm text-text-subtle">JPEG, PNG, WebP — max 8 photos</p>
          </div>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {media.map((m) => {
            const url = resolveUploadUrl(m.file_url)
            return (
              <div
                key={m.id}
                className="group relative aspect-square overflow-hidden rounded-xl bg-surface-cream ring-1 ring-border/60"
              >
                {url ? (
                  <Image src={url} alt="" fill sizes="160px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">🐾</div>
                )}
                {m.is_cover && (
                  <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-brand-green px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    <Star className="h-2.5 w-2.5 fill-white" />
                    Couverture
                  </span>
                )}
                <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/50 via-transparent to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onDelete(m.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600"
                    aria-label="Supprimer la photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-text-subtle transition-all hover:border-brand-green/50 hover:bg-brand-green-lt/30 hover:text-brand-green',
              isUploading && 'pointer-events-none opacity-60',
            )}
          >
            <Upload className="h-5 w-5" />
            <span className="text-[10px] font-medium">Ajouter</span>
          </button>
        </div>
      )}
    </div>
  )
}
