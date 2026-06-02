'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '@/components/AdminLayout'
import type { Album, Photo } from '@/lib/types'
import { Plus, Edit, Trash2, X, Calendar, Image as ImageIcon, Upload, X as XIcon, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react'
import { DatePicker, ConfigProvider } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import locale from 'antd/locale/zh_CN'
import { R2_PUBLIC_URL } from '@/lib/r2'

dayjs.locale('zh-cn')

const emptyForm = {
  title: '',
  description: '',
  cover_url: '',
}

export default function AlbumAdminPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [photos, setPhotos] = useState<Record<string, Photo[]>>({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Album | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [managing, setManaging] = useState<Album | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ total: number; done: number; errors: string[] } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [migrating, setMigrating] = useState(false)

  const fetchData = async () => {
    const [albumsRes, photosRes] = await Promise.all([
      fetch('/api/admin/albums', { headers: { Cookie: 'admin_token=authenticated' } }).then(r => r.json()),
      fetch('/api/photos').then(r => r.json()),
    ])
    if (Array.isArray(albumsRes)) setAlbums(albumsRes)
    if (Array.isArray(photosRes)) {
      const grouped: Record<string, Photo[]> = {}
      photosRes.forEach((p: Photo) => {
        if (!grouped[p.album_id]) grouped[p.album_id] = []
        grouped[p.album_id].push(p)
      })
      setPhotos(grouped)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = albums.filter((a) => {
    if (yearFilter !== 'all' && a.created_at?.substring(0, 4) !== yearFilter) {
      return false
    }
    return true
  })

  const ITEMS_PER_PAGE = 12
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [yearFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body: Record<string, string> = { ...form }
    if (editing) body.id = editing.id

    const res = await fetch('/api/admin/albums', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'admin_token=authenticated' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setForm(emptyForm)
      setEditing(null)
      setShowForm(false)
      fetchData()
    } else {
      const err = await res.json()
      alert(err.error || '保存失败')
    }
  }

  const handleEdit = (album: Album) => {
    setEditing(album)
    setForm({
      title: album.title,
      description: album.description || '',
      cover_url: album.cover_url || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个相册吗？该相册下的所有照片也会被删除。')) return
    await fetch('/api/admin/albums', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Cookie: 'admin_token=authenticated' },
      body: JSON.stringify({ id }),
    })
    fetchData()
  }

  const handleMigrate = async () => {
    if (!confirm('确定要开始迁移历史照片到 Cloudflare R2 吗？该过程可能需要一些时间。')) return
    setMigrating(true)
    try {
      const res = await fetch('/api/admin/migrate-to-r2')
      const data = await res.json()
      if (data.success) {
        const r = data.results
        const lines: string[] = []
        if (r.photos) lines.push(`相册照片：${r.photos.migrated}/${r.photos.total}`)
        if (r.travel_photos) lines.push(`旅游照片：${r.travel_photos.migrated}/${r.travel_photos.total}`)
        if (r.travels_cover) lines.push(`旅游封面：${r.travels_cover.migrated}/${r.travels_cover.total}`)
        if (r.albums_cover) lines.push(`相册封面：${r.albums_cover.migrated}/${r.albums_cover.total}`)
        if (r.movies_poster) lines.push(`电影海报：${r.movies_poster.migrated}/${r.movies_poster.total}`)
        if (r.games_cover) lines.push(`游戏封面：${r.games_cover.migrated}/${r.games_cover.total}`)
        alert(`迁移完成！\n${lines.join('\n')}`)
        fetchData()
      } else {
        alert('迁移失败：' + (data.error || '未知错误'))
      }
    } catch (err) {
      alert('迁移出错，请重试')
    } finally {
      setMigrating(false)
    }
  }

  const handleUploadPhoto = useCallback(async (files: FileList | File[]) => {
    if (!managing) return
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    setUploading(true)
    setUploadProgress({ total: fileArray.length, done: 0, errors: [] })

    let done = 0
    const errors: string[] = []

    for (const file of fileArray) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const uploadRes = await fetch('/api/admin/upload-r2', {
          method: 'POST',
          headers: { Cookie: 'admin_token=authenticated' },
          body: formData,
        })
        if (!uploadRes.ok) {
          errors.push(file.name)
          continue
        }
        const uploadData = await uploadRes.json()
        await fetch('/api/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            album_id: managing.id,
            url: uploadData.url,
            file_size: uploadData.file_size,
          }),
        })
      } catch {
        errors.push(file.name)
      }
      done++
      setUploadProgress({ total: fileArray.length, done, errors: [...errors] })
    }

    setUploadProgress(null)
    setUploading(false)
    fetchData()
  }, [managing])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleUploadPhoto(e.dataTransfer.files)
    }
  }, [handleUploadPhoto])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('确定删除这张照片吗？')) return
    await fetch('/api/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: photoId }),
    })
    fetchData()
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">相册管理</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="hidden items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${migrating ? 'animate-spin' : ''}`} />
            {migrating ? '迁移中...' : '迁移到 R2'}
          </button>
          <button
            onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }}
            className="flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
          >
            <Plus className="h-4 w-4" />
            新增相册
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 py-4">
        <Calendar className="h-4 w-4 text-gray-500" />
        <ConfigProvider locale={locale}>
          <DatePicker
            picker="year"
            value={yearFilter === 'all' ? null : dayjs(yearFilter)}
            onChange={(date) => setYearFilter(date ? date.format('YYYY') : 'all')}
            className="rounded-lg"
            placeholder="全部年份"
            allowClear
          />
        </ConfigProvider>
      </div>

      {showForm && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editing ? '编辑相册' : '新增相册'}
            </h2>
            <button
              onClick={() => { setShowForm(false); setEditing(null) }}
              className="text-gray-400 hover:text-[#1A1A1A]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">相册标题</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">描述</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A] resize-none"
              />
            </div>
            <button type="submit" className="rounded-lg bg-[#1A1A1A] px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80">
              {editing ? '保存修改' : '创建相册'}
            </button>
          </form>
        </div>
      )}

      {managing && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">管理照片 - {managing.title}</h2>
            <button onClick={() => setManaging(null)} className="text-gray-400 hover:text-[#1A1A1A]">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div
            className={`mb-4 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              dragOver
                ? 'border-[#1A1A1A] bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleUploadPhoto(e.target.files)}
              className="hidden"
            />
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              {dragOver ? '松开鼠标上传' : '拖拽图片到此处，或'}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {uploading ? '上传中...' : '选择图片'}
            </button>
          </div>

          {uploadProgress && (
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  上传中 {uploadProgress.done}/{uploadProgress.total}
                </span>
                {uploadProgress.errors.length > 0 && (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {uploadProgress.errors.length} 个失败
                  </span>
                )}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-[#1A1A1A] transition-all duration-300"
                  style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                />
              </div>
              {uploadProgress.errors.length > 0 && (
                <p className="mt-2 text-xs text-red-400">
                  失败文件：{uploadProgress.errors.join('、')}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {(photos[managing.id] || []).map((photo) => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg">
                <img src={photo.url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((album) => {
              const count = photos[album.id]?.length || 0
              return (
                <div key={album.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                    {album.cover_url || photos[album.id]?.[0]?.url ? (
                      <img
                        src={album.cover_url || photos[album.id][0].url}
                        alt={album.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <ImageIcon className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[#1A1A1A]">{album.title}</h3>
                    <p className="mt-1 text-xs text-gray-400">
                      {count} 张照片
                      {album.created_at && ` · ${dayjs(album.created_at).format('YYYY-MM-DD')}`}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setManaging(album)}
                        className="flex-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                      >
                        管理照片
                      </button>
                      <button
                        onClick={() => handleEdit(album)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1A1A1A]"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(album.id)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
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
                    onClick={() => setCurrentPage(page)}
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
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}
