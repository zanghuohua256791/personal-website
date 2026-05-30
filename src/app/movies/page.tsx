'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Movie } from '@/lib/types'
import { Star, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import ImagePreview from '@/components/ImagePreview'
import { DatePicker, ConfigProvider } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import locale from 'antd/locale/zh_CN'

dayjs.locale('zh-cn')

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetch('/api/movies')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMovies(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = movies.filter((m) => {
    if (yearFilter !== 'all') {
      const watchedMatch = m.watched_at?.startsWith(yearFilter)
      if (!watchedMatch) return false
    }
    if (monthFilter !== 'all') {
      const fullMonthFilter = `${yearFilter}-${monthFilter}`
      const watchedMatch = m.watched_at?.startsWith(fullMonthFilter)
      if (!watchedMatch) return false
    }
    return true
  })

  const ITEMS_PER_PAGE = 12
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedMovies = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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

      <div className="flex flex-wrap items-center gap-4 pt-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <ConfigProvider locale={locale}>
            <DatePicker
              picker="year"
              value={yearFilter === 'all' ? null : dayjs(yearFilter)}
              onChange={(date) => {
                setYearFilter(date ? date.format('YYYY') : 'all')
                setCurrentPage(1)
              }}
              className="rounded-lg"
              placeholder="选择年份"
              allowClear
            />
          </ConfigProvider>
          {yearFilter !== 'all' && (
            <button
              onClick={() => { setYearFilter('all'); setCurrentPage(1) }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              清除
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ConfigProvider locale={locale}>
            <DatePicker
              picker="month"
              value={monthFilter === 'all' ? null : dayjs(`${yearFilter}-${monthFilter}`)}
              onChange={(date) => {
                setMonthFilter(date ? date.format('MM') : 'all')
                setCurrentPage(1)
              }}
              className="rounded-lg"
              placeholder="选择月份"
              format="MM"
            />
          </ConfigProvider>
          {monthFilter !== 'all' && (
            <button
              onClick={() => setMonthFilter('all')}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              清除
            </button>
          )}
        </div>
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
        <>
          <div className="grid gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            {paginatedMovies.map((movie) => (
            <Link
              key={movie.id}
              href={`/movies/${movie.slug || movie.id}`}
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
                  {movie.overview && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {movie.overview}
                    </p>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <p className="text-center text-sm text-gray-400 pt-4">
            共 {filtered.length} 部电影，显示 {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} 部
          </p>
        </>
      )}
    </div>
  )
}
