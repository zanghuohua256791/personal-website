'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import ImageUpload from '@/components/ImageUpload'
import type { Movie } from '@/lib/types'
import { Plus, Edit, Trash2, X, Star } from 'lucide-react'

const emptyForm = {
  title: '',
  slug: '',
  year: '',
  director: '',
  genre: '',
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

  const fetchMovies = async () => {
    const res = await fetch('/api/admin/movies')
    const data = await res.json()
    if (Array.isArray(data)) setMovies(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchMovies()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body: Record<string, unknown> = {
      title: form.title,
      slug: form.slug,
      year: form.year ? parseInt(form.year) : null,
      director: form.director || null,
      genre: form.genre.split(',').map((t) => t.trim()).filter(Boolean),
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
      director: movie.director || '',
      genre: movie.genre?.join(', ') || '',
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">片名</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">Slug</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">年份</label>
                <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">导演</label>
                <input value={form.director} onChange={(e) => setForm({ ...form, director: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">类型（逗号分隔）</label>
                <input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="科幻, 冒险" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]" />
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
                <label className="text-sm font-medium text-gray-600">观看日期</label>
                <input type="date" value={form.watched_at} onChange={(e) => setForm({ ...form, watched_at: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]" />
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
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">片名</th>
                <th className="px-6 py-3 font-medium text-gray-500">年份</th>
                <th className="px-6 py-3 font-medium text-gray-500">导演</th>
                <th className="px-6 py-3 font-medium text-gray-500">评分</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {movies.map((movie) => (
                <tr key={movie.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-[#1A1A1A]">{movie.title}</td>
                  <td className="px-6 py-3 text-gray-500">{movie.year || '-'}</td>
                  <td className="px-6 py-3 text-gray-500">{movie.director || '-'}</td>
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
              {movies.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    暂无电影记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
