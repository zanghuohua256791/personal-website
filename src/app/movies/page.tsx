'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Movie } from '@/lib/types'
import { Star, Calendar, User, Filter } from 'lucide-react'
import ImagePreview from '@/components/ImagePreview'

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')

  useEffect(() => {
    fetch('/api/movies')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMovies(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const allGenres = Array.from(new Set(movies.flatMap((m) => m.genre || []))).sort()
  const allYears = Array.from(new Set(movies.map((m) => m.year).filter(Boolean) as number[])).sort((a, b) => b - a)

  const filtered = movies.filter((m) => {
    if (selectedGenre !== 'all' && !m.genre?.includes(selectedGenre)) return false
    if (selectedYear !== 'all' && m.year?.toString() !== selectedYear) return false
    return true
  })

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i < rating ? 'fill-accent-400 text-accent-400' : 'text-gray-200'}`}
      />
    ))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A]">电影</h1>
      <p className="text-lg text-gray-500">光影之间，故事流连</p>

      <div className="flex flex-wrap items-center gap-3 pt-4">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 outline-none"
        >
          <option value="all">全部类型</option>
          {allGenres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 outline-none"
        >
          <option value="all">全部年份</option>
          {allYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-gray-400">还没有电影记录 🎬</p>
        </div>
      ) : (
        <div className="grid gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((movie) => (
            <Link
              key={movie.id}
              href={`/movies/${movie.slug}`}
              className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
            >
              <div className="aspect-[2/3] bg-gray-100 overflow-hidden relative">
                {movie.poster_url ? (
                  <ImagePreview
                    src={movie.poster_url}
                    alt={movie.title}
                    className="h-full w-full"
                    aspectRatio="2/3"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    enablePreview={false}
                    hoverScale
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300 text-4xl">
                    🎬
                  </div>
                )}
              </div>
              <div className="p-3 space-y-1.5">
                <h3 className="font-semibold text-[#1A1A1A] group-hover:text-accent-600 transition-colors line-clamp-1">
                  {movie.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {movie.year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {movie.year}
                    </span>
                  )}
                  {movie.director && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {movie.director}
                    </span>
                  )}
                </div>
                {movie.rating && (
                  <div className="flex items-center gap-0.5 pt-0.5">
                    {renderStars(movie.rating)}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
