'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '@/components/AdminLayout'
import ImageUpload from '@/components/ImageUpload'
import type { Movie } from '@/lib/types'
import { Plus, Edit, Trash2, X, Star, Search, Film, Check, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { DatePicker, ConfigProvider } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import locale from 'antd/locale/zh_CN'
import { searchTMDBMovies, getTMDBPosterUrl, type TMDBSearchResult } from '@/lib/tmdb'

dayjs.locale('zh-cn')

const emptyForm = {
  title: '',
  slug: '',
  year: '',
  overview: '',
  rating: '0',
  review: '',
  poster_url: '',
  watched_at: '',
}

export default function MovieAdminPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Movie | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TMDBSearchResult[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const [yearFilter, setYearFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const generateSlug = (text: string) => {
    // \u5982\u679c\u662f\u4e2d\u6587\uff0c\u4f7f\u7528\u65f6\u95f4\u6233+\u968f\u673a\u6570\u751f\u6210 slug
    if (/[\u4e00-\u9fa5]/.test(text)) {
      return `movie-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    }
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
  }

  const fetchMovies = async () => {
    const res = await fetch('/api/admin/movies')
    const data = await res.json()
    if (Array.isArray(data)) setMovies(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchMovies()
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

  useEffect(() => {
    setCurrentPage(1)
  }, [yearFilter, monthFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearchMovie = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (query.length < 2) {
      setSearchResults([])
      setShowSearchDropdown(false)
      return
    }

    setSearching(true)
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchTMDBMovies(query)
        setSearchResults(results.slice(0, 8))
        setShowSearchDropdown(results.length > 0)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }, [])

  const handleSelectMovie = (movie: TMDBSearchResult) => {
    const posterUrl = getTMDBPosterUrl(movie.poster_path, 'w500')
    const year = movie.release_date ? movie.release_date.substring(0, 4) : ''
    
    setForm(prev => ({
      ...prev,
      title: movie.title,
      slug: generateSlug(movie.title),
      year: year,
      poster_url: posterUrl || '',
      overview: movie.overview || '',
    }))
    
    setSearchQuery('')
    setSearchResults([])
    setShowSearchDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body: Record<string, unknown> = {
      title: form.title,
      slug: form.slug,
      year: form.year ? parseInt(form.year) : null,
      overview: form.overview || null,
      rating: parseInt(form.rating) || null,
      review: form.review || null,
      poster_url: form.poster_url || null,
      watched_at: form.watched_at || null,
    }

    const url = '/api/admin/movies'
    const method = editing ? 'PUT' : 'POST'
    if (editing) body.id = editing.id

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setForm(emptyForm)
      setEditing(null)
      setShowForm(false)
      fetchMovies()
    }
  }

  const handleEdit = (movie: Movie) => {
    setEditing(movie)
    setForm({
      title: movie.title,
      slug: movie.slug,
      year: movie.year?.toString() || '',
      overview: movie.overview || '',
      rating: movie.rating?.toString() || '0',
      review: movie.review || '',
      poster_url: movie.poster_url || '',
      watched_at: movie.watched_at || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return
    await fetch('/api/admin/movies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchMovies()
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">电影管理</h1>
        <button
          onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }}
          className="flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
        >
          <Plus className="h-4 w-4" />
          新增电影
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <ConfigProvider locale={locale}>
            <DatePicker
              picker="year"
              value={yearFilter === 'all' ? null : dayjs(yearFilter)}
              onChange={(date) => setYearFilter(date ? date.format('YYYY') : 'all')}
              className="rounded-lg"
              placeholder="选择年份"
              allowClear
            />
          </ConfigProvider>
          {yearFilter !== 'all' && (
            <button
              onClick={() => setYearFilter('all')}
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
              onChange={(date) => setMonthFilter(date ? date.format('MM') : 'all')}
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

      {showForm && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editing ? '编辑电影' : '新增电影'}
            </h2>
            <button
              onClick={() => { setShowForm(false); setEditing(null) }}
              className="text-gray-400 hover:text-[#1A1A1A]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
             {!editing && (<div className="rounded-lg border-2 border-dashed border-gray-200 p-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Film className="h-4 w-4" />
                  搜索电影（TMDB）
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchMovie(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                    placeholder="输入电影名称搜索..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-9 text-sm outline-none focus:border-accent-500"
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  {searching && (
                    <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-gray-300 border-t-accent-500" />
                  )}
                </div>
                
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-96 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {searchResults.map((movie) => (
                      <button
                        key={movie.id}
                        type="button"
                        onClick={() => handleSelectMovie(movie)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50"
                      >
                        {movie.poster_path ? (
                          <img
                            src={getTMDBPosterUrl(movie.poster_path, 'w92') || ''}
                            alt={movie.title}
                            className="h-15 w-10 rounded object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-15 w-10 items-center justify-center rounded bg-gray-200 text-gray-400">
                            <Film className="h-6 w-6" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{movie.title}</p>
                          <p className="text-xs text-gray-500">
                            {movie.release_date?.substring(0, 4) || '未知年份'}
                            {movie.vote_average > 0 && ` · ⭐${movie.vote_average.toFixed(1)}`}
                          </p>
                        </div>
                        <Check className="h-4 w-4 flex-shrink-0 text-accent-500" />
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  选择电影后自动填充片名、海报等信息，你也可以手动修改
                </p>
              </div>)}
            
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">片名</label>
                <input 
                  value={form.title} 
                  onChange={(e) => setForm((prev) => ({ 
                    ...prev, 
                    title: e.target.value,
                    slug: generateSlug(e.target.value)
                  }))} 
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]" 
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">Slug（自动生成）</label>
                <input 
                  value={form.slug} 
                  onChange={(e) => setForm({ ...form, slug: e.target.value })} 
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 outline-none cursor-not-allowed" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">年份</label>
                <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]" />
              </div>
               <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">观看日期</label>
                <ConfigProvider locale={locale}>
                  <DatePicker
                    value={form.watched_at ? dayjs(form.watched_at) : null}
                    onChange={(date) => setForm({ ...form, watched_at: date ? date.format('YYYY-MM-DD') : '' })}
                    className="w-full"
                  />
                </ConfigProvider>
              </div>
             
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">评分 (1-5)</label>
                <select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n === 0 ? '未评分' : '⭐'.repeat(n)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">简介</label>
                <textarea value={form.overview} onChange={(e) => setForm({ ...form, overview: e.target.value })} rows={3} placeholder="电影简介..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A] resize-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">海报</label>
              <ImageUpload bucket="movie-posters" onUpload={(url) => setForm({ ...form, poster_url: url })} preview={form.poster_url} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">短评</label>
              <textarea value={form.review} onChange={(e) => setForm({ ...form, review: e.target.value })} rows={6} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]" />
            </div>
            <button type="submit" className="rounded-lg bg-[#1A1A1A] px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80">
              {editing ? '保存修改' : '创建电影'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]" />
        </div>
      ) : (
        <>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">片名</th>
                <th className="px-6 py-3 font-medium text-gray-500">上映年份</th>
                <th className="px-6 py-3 font-medium text-gray-500">观看日期</th>
                <th className="px-6 py-3 font-medium text-gray-500">简介</th>
                <th className="px-6 py-3 font-medium text-gray-500">评分</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedMovies.map((movie) => (
                <tr key={movie.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-[#1A1A1A]">{movie.title}</td>
                  <td className="px-6 py-3 text-gray-500">{movie.year || '-'}</td>
                  <td className="px-6 py-3 text-gray-500">{movie.watched_at || '-'}</td>
                  <td className="px-6 py-3 text-gray-500 max-w-xs truncate" title={movie.overview || ''}>{movie.overview || '-'}</td>
                  <td className="px-6 py-3">
                    {movie.rating ? (
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: movie.rating }, (_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
                        ))}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(movie)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1A1A1A]">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(movie.id)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    暂无电影记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
    </AdminLayout>
  )
}
