import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

const R2_ENDPOINT = process.env.R2_ENDPOINT || ''
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
const R2_BUCKET = process.env.R2_BUCKET || 'photo-album'
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('[R2] Missing required environment variables:', {
    endpoint: !!R2_ENDPOINT,
    endpointValue: R2_ENDPOINT,
    accessKey: !!R2_ACCESS_KEY_ID,
    secretKey: !!R2_SECRET_ACCESS_KEY,
  })
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT || undefined,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
})

export interface UploadResult {
  url: string
  key: string
}

export async function uploadToR2(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  prefix?: string
): Promise<UploadResult> {
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = prefix ? `${prefix}/${Date.now()}-${cleanFileName}` : `${Date.now()}-${cleanFileName}`

  const upload = new Upload({
    client: r2Client,
    params: {
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    },
  })

  await upload.done()

  return {
    url: `${R2_PUBLIC_URL}/${key}`,
    key,
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
  const { r2Client } = await import('./r2')
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  )
}

export function getKeyFromUrl(url: string): string | null {
  if (!R2_PUBLIC_URL || !url.startsWith(R2_PUBLIC_URL)) return null
  return url.replace(R2_PUBLIC_URL + '/', '')
}
