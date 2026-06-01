import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { Travel, TravelPhoto } from '@/lib/types'
import { Calendar, MapPin, ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ImagePreview from '@/components/ImagePreview'

// export const revalidate = 3600

async function getTravel(slug: string): Promise<Travel | null> {
  const { data } = await supabase
    .from('travels')
    .select('*')
    .eq('slug', slug)
    .single()
  return data as Travel | null
}

async function getTravelPhotos(travelId: string): Promise<TravelPhoto[]> {
  const { data, error } = await supabase
    .from('travel_photos')
    .select('*')
    .eq('travel_id', travelId)
    .order('sort_order', { ascending: true })
  
  if (error) {
    console.error('Error fetching travel photos:', error)
    return []
  }
  
  return (data as TravelPhoto[]) || []
}

export default async function TravelDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const travel = await getTravel(params.slug)

  if (!travel) {
    notFound()
  }

  const photos = await getTravelPhotos(travel.id)

  return (
    <div className="space-y-8">
      <Link
        href="/travel"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-[#1A1A1A]"
      >
        <ArrowLeft className="h-4 w-4" />
        返回旅行列表
      </Link>

      {travel.cover_url && (
        <div className="aspect-[21/9] overflow-hidden rounded-2xl bg-gray-100 relative">
          <ImagePreview
            src={travel.cover_url}
            alt={travel.title}
            className="h-full w-full"
            aspectRatio="21/9"
            sizes="100vw"
            priority
          />
        </div>
      )}

      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A]">
          {travel.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {travel.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(travel.travel_date).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        {travel.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {travel.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {travel.content && (
        <div className="prose-custom pt-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {travel.content}
          </ReactMarkdown>
        </div>
      )}

      {photos.length > 0 ? (
        <div className="pt-8 space-y-4">
          <h2 className="text-2xl font-bold text-[#1A1A1A]">相册</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="overflow-hidden rounded-xl bg-gray-100"
              >
                <ImagePreview
                  src={photo.url}
                  alt={photo.caption || ''}
                  className="aspect-[4/3]"
                  aspectRatio="4/3"
                />
                {photo.caption && (
                  <p className="p-3 text-sm text-gray-500">{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-8">
          <h2 className="text-2xl font-bold text-[#1A1A1A]">相册</h2>
          <p className="mt-4 text-gray-400">暂无相册图片</p>
        </div>
      )}
    </div>
  )
}
