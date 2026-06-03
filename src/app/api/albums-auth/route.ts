import { NextRequest, NextResponse } from 'next/server'

const ALBUMS_PASSWORD = process.env.ALBUMS_PASSWORD

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (!ALBUMS_PASSWORD) {
    return NextResponse.json({ error: '未配置 ALBUMS_PASSWORD 环境变量' }, { status: 500 })
  }

  if (!password) {
    return NextResponse.json({ error: '请输入密码' }, { status: 400 })
  }

  if (password !== ALBUMS_PASSWORD) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 })
  }

  return NextResponse.json({ success: true })
}
