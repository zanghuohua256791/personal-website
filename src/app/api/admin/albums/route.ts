import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('albums')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, description, cover_url } = body

  if (!title) {
    return NextResponse.json({ error: '请填写相册标题' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('albums')
    .insert({
      title,
      description: description || null,
      cover_url: cover_url || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, title, description, cover_url } = body

  if (!id) {
    return NextResponse.json({ error: '缺少 id' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('albums')
    .update({
      title,
      description: description || null,
      cover_url: cover_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()

  if (!id) {
    return NextResponse.json({ error: '缺少 id' }, { status: 400 })
  }

  const { data: photos } = await supabaseAdmin
    .from('photos')
    .select('url')
    .eq('album_id', id)

  if (photos && photos.length > 0) {
    for (const photo of photos) {
      try {
        const key = photo.url.split('/').pop()
        if (key) {
          const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
          const { r2Client } = await import('@/lib/r2')
          await r2Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET || 'photo-album',
              Key: key,
            })
          )
        }
      } catch (err) {
        console.error('Delete R2 file error:', err)
      }
    }
  }

  const { error } = await supabaseAdmin
    .from('albums')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
