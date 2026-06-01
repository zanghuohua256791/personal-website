'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import ImageUpload from '@/components/ImageUpload'
import TravelPhotoUpload from '@/components/TravelPhotoUpload'
import type { Travel } from '@/lib/types'
import { Plus, Edit, Trash2, X, Image as ImageIcon } from 'lucide-react'
import { DatePicker, ConfigProvider } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import locale from 'antd/locale/zh_CN'

dayjs.locale('zh-cn')

const emptyForm = {
  title: '',
  slug: '',
  location: '',
  travel_date: '',
  tags: '',
  content: '',
  cover_url: '',
}

interface TravelPhoto {
  id?: string
  url: string
  caption: string
  sort_order: number
}

export default function TravelAdminPage() {
  const [travels, setTravels] = useState<Travel[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Travel | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [photos, setPhotos] = useState<TravelPhoto[]>([])
  const [showPhotos, setShowPhotos] = useState(false)
  const [selectedTravelId, setSelectedTravelId] = useState<string | null>(null)

  const fetchTravels = async () => {
    const res = await fetch('/api/admin/travels')
    const data = await res.json()
    if (Array.isArray(data)) setTravels(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchTravels()
  }, [])

  const fetchPhotos = async (travelId: string) => {
    const res = await fetch(`/api/admin/travel-photos?travel_id=${travelId}`)
    const data = await res.json()
    if (Array.isArray(data)) {
      setPhotos(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body: Record<string, unknown> = {
      title: form.title,
      slug: form.slug,
      location: form.location,
      travel_date: form.travel_date,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      content: form.content,
      cover_url: form.cover_url || null,
    }

    const url = '/api/admin/travels'
    const method = editing ? 'PUT' : 'POST'
    if (editing) body.id = editing.id

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
       if (editing?.id) {
         for (const photo of photos) {
           if (!photo.id || photo.id.startsWith('temp_')) {
             await fetch('/api/admin/travel-photos', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 travel_id: editing.id,
                 url: photo.url,
                 caption: photo.caption,
                 sort_order: photo.sort_order,
               }),
             })
           }
         }
       }
       
       setForm(emptyForm)
       setEditing(null)
       setShowForm(false)
       setPhotos([])
       fetchTravels()
     }
  }

  const handleEdit = (travel: Travel) => {
    setEditing(travel)
    setForm({
      title: travel.title,
      slug: travel.slug,
      location: travel.location,
      travel_date: travel.travel_date,
      tags: travel.tags.join(', '),
      content: travel.content || '',
      cover_url: travel.cover_url || '',
    })
    setPhotos([])
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return
    await fetch('/api/admin/travels', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchTravels()
  }

  const handleNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setPhotos([])
    setShowForm(true)
  }

  const openPhotoManager = (travel: Travel) => {
    setSelectedTravelId(travel.id)
    fetchPhotos(travel.id)
    setShowPhotos(true)
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">旅行管理</h1>
        <button
          onClick={handleNew}
          className="flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
        >
          <Plus className="h-4 w-4" />
          新增旅行
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editing ? '编辑旅行' : '新增旅行'}
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
                <label className="text-sm font-medium text-gray-600">标题</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">目的地</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">旅行日期</label>
                <ConfigProvider locale={locale}>
                  <DatePicker
                    value={form.travel_date ? dayjs(form.travel_date) : null}
                    onChange={(date) => setForm({ ...form, travel_date: date ? date.format('YYYY-MM-DD') : '' })}
                    className="w-full"
                    required
                  />
                </ConfigProvider>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">标签（逗号分隔）</label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="城市, 美食, 樱花"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">封面图片</label>
              <ImageUpload
                bucket="travel-covers"
                onUpload={(url) => setForm({ ...form, cover_url: url })}
                preview={form.cover_url}
              />
            </div>
            {editing && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">相册图片</label>
                <TravelPhotoUpload
                  travelId={editing.id}
                  initialPhotos={photos}
                  onUpdate={setPhotos}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">正文（Markdown）</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={12}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A] font-mono"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#1A1A1A] px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
            >
              {editing ? '保存修改' : '创建旅行'}
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
                <th className="px-6 py-3 font-medium text-gray-500">标题</th>
                <th className="px-6 py-3 font-medium text-gray-500">目的地</th>
                <th className="px-6 py-3 font-medium text-gray-500">日期</th>
                <th className="px-6 py-3 font-medium text-gray-500">标签</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {travels.map((travel) => (
                <tr key={travel.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-[#1A1A1A]">{travel.title}</td>
                  <td className="px-6 py-3 text-gray-500">{travel.location}</td>
                  <td className="px-6 py-3 text-gray-500">{travel.travel_date}</td>
                  <td className="px-6 py-3 text-gray-400">
                    {travel.tags.slice(0, 2).join(', ')}
                    {travel.tags.length > 2 && '...'}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openPhotoManager(travel)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1A1A1A]"
                        title="相册管理"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(travel)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1A1A1A]"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(travel.id)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {travels.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    暂无旅行记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showPhotos && selectedTravelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">相册管理</h2>
              <button
                onClick={() => {
                  setShowPhotos(false)
                  setSelectedTravelId(null)
                  setPhotos([])
                }}
                className="text-gray-400 hover:text-[#1A1A1A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <TravelPhotoUpload
              travelId={selectedTravelId}
              initialPhotos={photos}
              onUpdate={setPhotos}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
