import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const bucket = formData.get('bucket') as string

  if (!file || !bucket) {
    return NextResponse.json({ error: 'Missing file or bucket' }, { status: 400 })
  }

  const allowedBuckets = ['travel-covers', 'travel-photos', 'movie-posters', 'game-covers']
  if (!allowedBuckets.includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const fileName = `${Date.now()}-${cleanFileName}`
  const arrayBuffer = await file.arrayBuffer()

  const { data, error } = await supabaseAdmin
    .storage
    .from(bucket)
    .upload(fileName, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin
    .storage
    .from(bucket)
    .getPublicUrl(fileName)

  return NextResponse.json({ url: urlData.publicUrl, path: data.path })
}
