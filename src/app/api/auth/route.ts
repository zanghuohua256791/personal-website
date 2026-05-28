import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (!password) {
    return NextResponse.json({ error: '请输入密码' }, { status: 400 })
  }

  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    return NextResponse.json({ error: '未配置 ADMIN_PASSWORD 环境变量' }, { status: 500 })
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_token', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return response
}
