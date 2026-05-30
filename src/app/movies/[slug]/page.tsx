'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Movie } from '@/lib/types'
import { Star, Calendar, User, ArrowLeft } from 'lucide-react'
import ImagePreview from '@/components/ImagePreview'

export default function MovieDetailPage() {
  const params = useParams()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/movies')
      .then((res) => res.json())
      .then((data) => {
        const found = (data as Movie[]).find((m) => m.slug === params.slug)
        setMovie(found || null)
        setLoading(false)
      })
  }, [params.slug])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]" />
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-400">电影未找到</p>
        <Link href="/movies" className="mt-4 inline-block text-sm text-accent-600 hover:underline">
          返回电影列表
        </Link>
      </div>
    )
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${i < rating ? 'fill-accent-400 text-accent-400' : 'text-gray-200'}`}
      />
    ))
  }

  return (
    <div className="space-y-8">
      <Link
        href="/movies"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-[#1A1A1A]"
      >
        <ArrowLeft className="h-4 w-4" />
        返回电影列表
      </Link>

      <div className="flex flex-col gap-8 sm:flex-row">
        <div className="flex-shrink-0">
            <div className="aspect-[2/3] w-48 overflow-hidden rounded-xl bg-gray-100 sm:w-56 relative">
              {movie.poster_url ? (
                <ImagePreview
                  src={movie.poster_url}
                  alt={movie.title}
                  className="h-full w-full"
                  aspectRatio="2/3"
                  sizes="(max-width: 640px) 192px, 224px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl text-gray-300">
                  🎬
                </div>
              )}
            </div>
          </div>

        <div className="flex-1 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A]">
            {movie.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            {movie.year && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {movie.year}
              </span>
            )}
            {movie.overview && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-700">简介</h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {movie.overview}
                </p>
              </div>
            )}
          </div>

          {movie.rating && (
            <div className="flex items-center gap-1">
              {renderStars(movie.rating)}
            </div>
          )}

          {movie.review && (
            <div className="pt-4 leading-relaxed text-gray-600">
              {movie.review}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
