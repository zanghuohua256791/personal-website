'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Album, Photo } from '@/lib/types'
import { Calendar, Image as ImageIcon, X, Lock } from 'lucide-react'
import { DatePicker, ConfigProvider } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import locale from 'antd/locale/zh_CN'
import { R2_PUBLIC_URL } from '@/lib/r2'

dayjs.locale('zh-cn')

function AlbumAuthGate({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/albums-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        sessionStorage.setItem('albums_auth', 'true')
        onAuth()
      } else {
        const data = await res.json()
        setError(data.error || '密码错误')
      }
    } catch {
      setError('验证失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
            <Lock className="h-6 w-6 text-gray-500" />
          </div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">相册</h1>
          <p className="text-sm text-gray-400">请输入密码以访问相册</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-300 focus:border-[#1A1A1A]"
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-[#1A1A1A] py-3 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {loading ? '验证中...' : '进入相册'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AlbumsPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [albums, setAlbums] = useState<Album[]>([])
  const [photos, setPhotos] = useState<Record<string, Photo[]>>({})
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [previewAlbum, setPreviewAlbum] = useState<Album | null>(null)
  const [previewIndex, setPreviewIndex] = useState(0)

  useEffect(() => {
    if (sessionStorage.getItem('albums_auth') === 'true') {
      setAuthenticated(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!authenticated) return
    Promise.all([
      fetch('/api/albums').then((r) => r.json()),
      fetch('/api/photos').then((r) => r.json()),
    ]).then(([albumsData, photosData]) => {
      if (Array.isArray(albumsData)) setAlbums(albumsData)
      if (Array.isArray(photosData)) {
        const grouped: Record<string, Photo[]> = {}
        photosData.forEach((p: Photo) => {
          if (!grouped[p.album_id]) grouped[p.album_id] = []
          grouped[p.album_id].push(p)
        })
        setPhotos(grouped)
      }
      setLoading(false)
    })
  }, [authenticated])

  if (!authenticated) {
    return <AlbumAuthGate onAuth={() => setAuthenticated(true)} />
  }

  const allYears = Array.from(
    new Set(
      albums
        .map((a) => a.created_at?.substring(0, 4))
        .filter(Boolean) as string[]
    )
  ).sort((a, b) => b.localeCompare(a))

  const filtered = albums.filter((a) => {
    if (yearFilter !== 'all' && a.created_at?.substring(0, 4) !== yearFilter) {
      return false
    }
    return true
  })

  const openPreview = (album: Album) => {
    const albumPhotos = photos[album.id] || []
    if (albumPhotos.length > 0) {
      setPreviewAlbum(album)
      setPreviewIndex(0)
    }
  }

  const previewPhotos = previewAlbum ? photos[previewAlbum.id] || [] : []

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A]">相册</h1>
      <p className="text-lg text-gray-500">记录每一个值得珍藏的瞬间</p>

      <div className="flex flex-wrap items-center gap-3 pt-4">
        <Calendar className="h-4 w-4 text-gray-500" />
        <ConfigProvider locale={locale}>
          <DatePicker
            picker="year"
            value={yearFilter === 'all' ? null : dayjs(yearFilter)}
            onChange={(date) =>
              setYearFilter(date ? date.format('YYYY') : 'all')
            }
            className="rounded-lg"
            placeholder="全部年份"
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

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-gray-400">还没有相册 📷</p>
        </div>
      ) : (
        <div className="grid gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((album) => {
            const albumPhotos = photos[album.id] || []
            const coverUrl = album.cover_url || albumPhotos[0]?.url
            return (
              <div
                key={album.id}
                onClick={() => openPreview(album)}
                className="group cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
              >
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={album.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-gray-300">
                      <ImageIcon className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-1.5">
                  <h3 className="font-semibold text-[#1A1A1A] line-clamp-1">
                    {album.title}
                  </h3>
                  {album.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {album.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 pt-1 text-xs text-gray-400">
                    {album.created_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dayjs(album.created_at).format('YYYY-MM-DD')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {albumPhotos.length} 张
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {previewAlbum && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setPreviewAlbum(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setPreviewAlbum(null)
            }}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="w-full max-w-5xl px-4">
            <div className="mb-4 text-center text-white">
              <h2 className="text-2xl font-bold">{previewAlbum.title}</h2>
              {previewAlbum.description && (
                <p className="mt-1 text-sm text-gray-300">
                  {previewAlbum.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {previewPhotos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="aspect-square cursor-pointer overflow-hidden rounded-lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreviewIndex(idx)
                  }}
                >
                  <img
                    src={photo.thumbnail_url || photo.url}
                    alt={photo.caption || ''}
                    className="h-full w-full object-cover transition-transform hover:scale-110"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
