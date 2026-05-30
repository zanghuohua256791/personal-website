'use client'

import { useState, useCallback, useMemo, memo } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

interface ImagePreviewProps {
  src: string
  alt: string
  aspectRatio?: string
  className?: string
  priority?: boolean
  sizes?: string
  enablePreview?: boolean
  hoverScale?: boolean
  unoptimized?: boolean
}

const EXTERNAL_CDN_PATTERNS = [
  'steamstatic.com',
  'image.tmdb.org',
]

const ImagePreview = memo(function ImagePreview({ src, alt, aspectRatio, className, priority = false, sizes, enablePreview = true, hoverScale = false, unoptimized }: ImagePreviewProps) {
  const [open, setOpen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const shouldUnoptimized = useMemo(() => {
    if (unoptimized !== undefined) return unoptimized
    return EXTERNAL_CDN_PATTERNS.some((pattern) => src.includes(pattern))
  }, [src, unoptimized])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!enablePreview) return
    e.stopPropagation()
    e.preventDefault()
    setOpen(true)
  }, [enablePreview])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  return (
    <>
      <div
        className={`relative overflow-hidden ${className || ''} ${hoverScale ? 'group' : ''}`}
        onClick={handleClick}
        style={{ aspectRatio: aspectRatio || undefined, cursor: enablePreview ? 'pointer' : undefined }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-cover${hoverScale ? ' transition-transform duration-500 group-hover:scale-105' : ''}${imageLoaded ? ' opacity-100' : ' opacity-0'}`}
          sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
          priority={priority}
          unoptimized={shouldUnoptimized}
          onLoad={handleImageLoad}
          loading={priority ? 'eager' : 'lazy'}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
})

export default ImagePreview
