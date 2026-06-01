import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('game_sessions')
      .select('*, game:games(*)')
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Database Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Sessions Data:', data)
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Unexpected Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
