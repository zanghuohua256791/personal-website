'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'

interface ImageUploadProps {
  bucket: string
  onUpload: (url: string) => void
  preview?: string | null
}

export default function ImageUpload({ bucket, onUpload, preview }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', bucket)

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        onUpload(data.url)
      }
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 transition-colors hover:border-gray-300">
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-40 rounded-lg object-cover" />
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-300" />
            <span className="text-sm text-gray-400">
              {uploading ? '上传中...' : '点击上传图片'}
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  )
}
