import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { uploadToR2, R2_PUBLIC_URL } from '@/lib/r2'

export const dynamic = 'force-dynamic'

async function downloadAndUpload(
  url: string,
  prefix?: string
): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`[Migrate] Download failed: ${url} - ${response.status}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileName = url.split('/').pop() || 'photo.jpg'
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    const result = await uploadToR2(buffer, fileName, contentType, prefix)
    return result.url
  } catch (err) {
    console.error(`[Migrate] Error processing ${url}:`, err)
    return null
  }
}

async function migrateRecords<T extends { id: string; url?: string | null }>(
  records: T[],
  urlField: keyof T,
  table: string,
  prefix?: string
): Promise<{ total: number; migrated: number; failed: number }> {
  let total = 0
  let migrated = 0
  let failed = 0

  const toMigrate = records.filter((r) => {
    const url = r[urlField]
    return typeof url === 'string' && !url.startsWith(R2_PUBLIC_URL)
  })
  total = toMigrate.length

  for (const record of toMigrate) {
    const url = record[urlField] as string
    const newUrl = await downloadAndUpload(url, prefix)
    if (newUrl) {
      await supabaseAdmin
        .from(table)
        .update({ [urlField]: newUrl })
        .eq('id', record.id)
      migrated++
    } else {
      failed++
    }
  }

  return { total, migrated, failed }
}

export async function GET() {
  const results: Record<string, { total: number; migrated: number; failed: number }> = {}

  const { data: photos, error: photosError } = await supabaseAdmin
    .from('photos')
    .select('id, url, thumbnail_url')

  if (!photosError && photos) {
    const photoResults = { total: 0, migrated: 0, failed: 0 }
    const photoRecords = photos.filter((p) => !p.url.startsWith(R2_PUBLIC_URL))
    photoResults.total = photoRecords.length

    for (const photo of photoRecords) {
      const newUrl = await downloadAndUpload(photo.url)
      if (newUrl) {
        let thumbnailUrl: string | null = null
        if (photo.thumbnail_url && !photo.thumbnail_url.startsWith(R2_PUBLIC_URL)) {
          thumbnailUrl = await downloadAndUpload(photo.thumbnail_url)
        }

        const updateData: Record<string, string | null> = { url: newUrl }
        if (thumbnailUrl) updateData.thumbnail_url = thumbnailUrl

        await supabaseAdmin.from('photos').update(updateData).eq('id', photo.id)
        photoResults.migrated++
      } else {
        photoResults.failed++
      }
    }
    results.photos = photoResults
  }

  const { data: travelPhotos, error: travelError } = await supabaseAdmin
    .from('travel_photos')
    .select('id, url')

  if (!travelError && travelPhotos) {
    results.travel_photos = await migrateRecords(travelPhotos, 'url', 'travel_photos', 'travel')
  }

  const { data: travels } = await supabaseAdmin
    .from('travels')
    .select('id, cover_url')

  if (travels) {
    results.travels_cover = await migrateRecords(travels, 'cover_url', 'travels')
  }

  const { data: albums } = await supabaseAdmin
    .from('albums')
    .select('id, cover_url')

  if (albums) {
    results.albums_cover = await migrateRecords(albums, 'cover_url', 'albums')
  }

  const { data: movies } = await supabaseAdmin
    .from('movies')
    .select('id, poster_url')

  if (movies) {
    results.movies_poster = await migrateRecords(movies, 'poster_url', 'movies')
  }

  const { data: games } = await supabaseAdmin
    .from('games')
    .select('id, cover_url')

  if (games) {
    results.games_cover = await migrateRecords(games, 'cover_url', 'games')
  }

  return NextResponse.json({ success: true, results })
}
