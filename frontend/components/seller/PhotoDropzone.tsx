'use client'

import { ImagePlus, Star, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

import { cn } from '@/lib/utils/cn'

interface PhotoPreview {
  file: File
  previewUrl: string
}

interface PhotoDropzoneProps {
  photos: PhotoPreview[]
  onChange: (photos: PhotoPreview[]) => void
  error?: string
  maxPhotos?: number
}

export type { PhotoPreview }

export function PhotoDropzone({ photos, onChange, error, maxPhotos = 8 }: PhotoDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addFiles(files: FileList | null) {
    if (!files) return
    const remaining = maxPhotos - photos.length
    const accepted = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remaining)
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))

    if (accepted.length) onChange([...photos, ...accepted])
  }

  function remove(index: number) {
    URL.revokeObjectURL(photos[index].previewUrl)
    onChange(photos.filter((_, i) => i !== index))
  }

  function setCover(index: number) {
    const reordered = [...photos]
    const [item] = reordered.splice(index, 1)
    reordered.unshift(item)
    onChange(reordered)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const canAdd = photos.length < maxPhotos

  return (
    <div className="space-y-3">
      {/* Drop zone — visible only if no photos yet or if can add more */}
      {photos.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-12 transition-all duration-200',
            dragging
              ? 'border-brand-green bg-brand-green-lt'
              : error
              ? 'border-red-400 bg-red-50 hover:border-red-400'
              : 'border-border hover:border-brand-green/50 hover:bg-surface-cream',
          )}
        >
          <div className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl',
            error ? 'bg-red-100' : 'bg-brand-green-lt',
          )}>
            <Upload className={cn('h-6 w-6', error ? 'text-red-500' : 'text-brand-green')} />
          </div>
          <div className="text-center">
            <p className={cn('font-medium', error ? 'text-red-600' : 'text-text-ink')}>
              Glissez vos photos ici
            </p>
            <p className="mt-0.5 text-sm text-text-subtle">
              ou <span className="text-brand-green underline underline-offset-2">cliquez pour sélectionner</span>
            </p>
            <p className="mt-1.5 text-xs text-text-subtle">JPEG, PNG, WebP — max {maxPhotos} photos</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo, i) => (
            <div key={photo.previewUrl} className="group relative aspect-square overflow-hidden rounded-xl bg-surface-cream">
              <Image src={photo.previewUrl} alt="" fill sizes="160px" className="object-cover" />

              {/* Cover badge */}
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded bg-brand-green px-1.5 py-0.5 text-[10px] font-bold text-white">
                  <Star className="h-2.5 w-2.5 fill-white" />
                  Cover
                </span>
              )}

              {/* Hover actions */}
              <div className="absolute inset-0 flex items-end justify-between gap-1 bg-black/40 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => setCover(i)}
                    className="flex items-center gap-0.5 rounded-lg bg-white/90 px-1.5 py-1 text-[10px] font-medium text-text-ink hover:bg-white"
                    title="Définir comme cover"
                  >
                    <Star className="h-2.5 w-2.5" /> Cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="ml-auto flex h-6 w-6 items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Add more */}
          {canAdd && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition-all',
                dragging ? 'border-brand-green bg-brand-green-lt' : 'border-border text-text-subtle hover:border-brand-green/50 hover:bg-surface-cream hover:text-brand-green',
              )}
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px] font-medium">Ajouter</span>
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
      />

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-red-600">
          <span className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white leading-none">!</span>
          {error}
        </p>
      )}

      {photos.length > 0 && (
        <p className="text-xs text-text-subtle">
          {photos.length} photo{photos.length > 1 ? 's' : ''} sélectionnée{photos.length > 1 ? 's' : ''} · La première est la photo de couverture
        </p>
      )}
    </div>
  )
}
