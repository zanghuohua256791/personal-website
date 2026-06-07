import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const formatDateField = (value: string | null | undefined): string | null => {
  if (!value) return null
  if (value.includes('-') && value.split('-').length === 2) {
    return `${value}-01`
  }
  return value
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sort = searchParams.get('sort')

  let query = supabaseAdmin.from('games').select('*')

  if (sort === 'completed') {
    query = query.order('completed_at', { ascending: false }).order('updated_at', { ascending: false })
  } else if (sort === 'started') {
    query = query.order('started_at', { ascending: false }).order('updated_at', { ascending: false })
  } else {
    query = query.order('updated_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  let body = await request.json()
  
  body = {
    ...body,
    started_at: formatDateField(body.started_at),
    completed_at: formatDateField(body.completed_at),
  }

  const { data, error } = await supabaseAdmin
    .from('games')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  let { id, ...body } = await request.json()
  
  body = {
    ...body,
    started_at: formatDateField(body.started_at),
    completed_at: formatDateField(body.completed_at),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin
    .from('games')
    .update(body)
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
  const { error } = await supabaseAdmin
    .from('games')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
