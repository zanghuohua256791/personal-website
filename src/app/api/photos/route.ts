import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const albumId = searchParams.get('album_id')

  let query = supabaseAdmin
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })

  if (albumId) {
    query = query.eq('album_id', albumId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { album_id, url, thumbnail_url, caption, width, height, file_size } = body

  if (!album_id || !url) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('photos')
    .insert({
      album_id,
      url,
      thumbnail_url: thumbnail_url || null,
      caption: caption || null,
      width: width || null,
      height: height || null,
      file_size: file_size || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabaseAdmin.rpc('increment_photo_count', { album_id_param: album_id })

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()

  if (!id) {
    return NextResponse.json({ error: '缺少 id' }, { status: 400 })
  }

  const { data: photo } = await supabaseAdmin
    .from('photos')
    .select('url, album_id')
    .eq('id', id)
    .single()

  if (photo) {
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

    await supabaseAdmin
      .from('albums')
      .update({ photo_count: photo.album_id ? undefined : 0 })
      .eq('id', photo.album_id)
  }

  const { error } = await supabaseAdmin
    .from('photos')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
