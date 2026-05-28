'use client'

import { useState, useEffect, useCallback } from 'react'
import { Upload, Trash2, GripVertical } from 'lucide-react'

interface TravelPhoto {
  id?: string
  url: string
  caption: string
  sort_order: number
}

interface TravelPhotoUploadProps {
  travelId: string
  initialPhotos: TravelPhoto[]
  onUpdate: (photos: TravelPhoto[]) => void
}

export default function TravelPhotoUpload({ travelId, initialPhotos, onUpdate }: TravelPhotoUploadProps) {
  const [photos, setPhotos] = useState<TravelPhoto[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)

  const fetchPhotos = useCallback(async () => {
    const res = await fetch(`/api/admin/travel-photos?travel_id=${travelId}`)
    const data = await res.json()
    if (Array.isArray(data)) {
      setPhotos(data)
      onUpdate(data)
    }
  }, [travelId, onUpdate])

  useEffect(() => {
    if (travelId && travelId !== 'new') {
      fetchPhotos()
    }
  }, [travelId, fetchPhotos])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const newPhotos: TravelPhoto[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', 'travel-photos')

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()

        if (data.url) {
          const photo = {
            id: data.id || `temp_${Date.now()}_${i}`,
            url: data.url,
            caption: '',
            sort_order: photos.length + i,
          }
          newPhotos.push(photo)
        }
      }

      const updatedPhotos = [...photos, ...newPhotos]
      setPhotos(updatedPhotos)
      onUpdate(updatedPhotos)

      if (travelId && travelId !== 'new') {
        for (const photo of newPhotos) {
          await fetch('/api/admin/travel-photos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              travel_id: travelId,
              url: photo.url,
              caption: photo.caption,
              sort_order: photo.sort_order,
            }),
          })
        }
      }
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  const handleCaptionChange = async (index: number, caption: string) => {
    const updatedPhotos = [...photos]
    updatedPhotos[index] = { ...updatedPhotos[index], caption }
    setPhotos(updatedPhotos)
    onUpdate(updatedPhotos)

    if (updatedPhotos[index].id && !updatedPhotos[index].id.startsWith('temp_')) {
      await fetch('/api/admin/travel-photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updatedPhotos[index].id,
          caption,
        }),
      })
    }
  }

  const handleDelete = async (index: number) => {
    const photoToDelete = photos[index]
    const updatedPhotos = photos.filter((_, i) => i !== index)
    setPhotos(updatedPhotos)
    onUpdate(updatedPhotos)

    if (photoToDelete.id && !photoToDelete.id.startsWith('temp_')) {
      await fetch('/api/admin/travel-photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: photoToDelete.id }),
      })
    }
  }

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 transition-colors hover:border-gray-300">
        <Upload className="h-8 w-8 text-gray-300" />
        <span className="text-sm text-gray-400">
          {uploading ? '上传中...' : '点击上传相册图片（可多选）'}
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {photos.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <div key={photo.id || index} className="group relative rounded-lg border border-gray-200 bg-white">
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <img src={photo.url} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
              </div>
              <div className="p-2">
                <input
                  type="text"
                  value={photo.caption}
                  onChange={(e) => handleCaptionChange(index, e.target.value)}
                  placeholder="添加描述..."
                  className="w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-[#1A1A1A]"
                />
              </div>
              <button
                onClick={() => handleDelete(index)}
                className="absolute right-2 top-2 rounded-lg bg-red-500 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <div className="absolute left-2 top-2 rounded-lg bg-black/50 p-1.5 text-white">
                <GripVertical className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}