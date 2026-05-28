import { NextRequest, NextResponse } from 'next/server'
import { getSteamAppDetails } from '@/lib/steam'

export async function GET(request: NextRequest) {
  const appidParam = request.nextUrl.searchParams.get('appid')
  if (!appidParam) {
    return NextResponse.json({ error: 'appid is required' }, { status: 400 })
  }

  const appid = parseInt(appidParam, 10)
  if (isNaN(appid)) {
    return NextResponse.json({ error: 'invalid appid' }, { status: 400 })
  }

  const details = await getSteamAppDetails(appid)
  if (!details) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  return NextResponse.json(details)
}