import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2, R2_PUBLIC_URL } from '@/lib/r2'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'R2 配置缺失，请检查环境变量：R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY' },
        { status: 500 }
      )
    }

    if (!R2_PUBLIC_URL) {
      return NextResponse.json(
        { error: 'R2 公开访问地址未配置，请检查 NEXT_PUBLIC_R2_PUBLIC_URL 环境变量' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const prefix = formData.get('prefix') as string | null

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await uploadToR2(buffer, file.name, file.type, prefix || undefined)

    return NextResponse.json({
      url: result.url,
      key: result.key,
      file_size: buffer.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
