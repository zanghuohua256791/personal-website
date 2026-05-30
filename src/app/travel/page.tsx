import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { Travel } from '@/lib/types'
import { Calendar, MapPin } from 'lucide-react'
import ImagePreview from '@/components/ImagePreview'

// export const revalidate = 3600

async function getTravels(): Promise<Travel[]> {
  const { data } = await supabase
    .from('travels')
    .select('*')
    .order('travel_date', { ascending: false })
  return (data as Travel[]) || []
}

function groupByYear(travels: Travel[]): Map<number, Travel[]> {
  const map = new Map<number, Travel[]>()
  travels.forEach((t) => {
    const year = new Date(t.travel_date).getFullYear()
    if (!map.has(year)) map.set(year, [])
    map.get(year)!.push(t)
  })
  return map
}

export default async function TravelPage() {
  const travels = await getTravels()
  const grouped = groupByYear(travels)

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A]">旅行</h1>
      <p className="text-lg text-gray-500">走过的路，看过的风景</p>

      {travels.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-gray-400">还没有旅行记录，先去探索世界吧 ✈️</p>
        </div>
      ) : (
        <div className="space-y-16 pt-8">
          {Array.from(grouped.entries()).map(([year, yearTravels]) => (
            <section key={year} className="space-y-6">
              <h2 className="text-2xl font-bold text-[#1A1A1A]">{year}</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {yearTravels.map((travel) => (
                  <Link
                    key={travel.id}
                    href={`/travel/${travel.slug}`}
                    className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
                  >
                    <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                      {travel.cover_url ? (
                        <ImagePreview
                          src={travel.cover_url}
                          alt={travel.title}
                          className="h-full w-full"
                          aspectRatio="4/3"
                          enablePreview={false}
                          hoverScale
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300">
                          ✈️
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-[#1A1A1A] group-hover:text-accent-600 transition-colors">
                        {travel.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {travel.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(travel.travel_date).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      {travel.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {travel.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
