import type { CloudflareBindings } from '../types/bindings'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

async function createCloudinarySignature(
  params: Record<string, string>,
  apiSecret: string
): Promise<string> {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  const data = sortedParams + apiSecret
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest(
    'SHA-1',
    encoder.encode(data)
  )
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function uploadImageToCloudinary(
  file: File | { data: ArrayBuffer; name: string; type: string },
  folder: string,
  env: CloudflareBindings
): Promise<{ url: string; publicId: string }> {
  let arrayBuffer: ArrayBuffer
  let fileName: string
  let fileType: string

  if (file instanceof File) {
    arrayBuffer = await file.arrayBuffer()
    fileName = file.name
    fileType = file.type
  } else {
    arrayBuffer = file.data
    fileName = file.name
    fileType = file.type
  }

  if (!ALLOWED_TYPES.includes(fileType)) {
    throw new Error(`Invalid file type: ${fileType}. Allowed: ${ALLOWED_TYPES.join(', ')}`)
  }

  if (arrayBuffer.byteLength > MAX_SIZE) {
    throw new Error('File size exceeds 5MB limit')
  }

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const publicId = `${folder}/${Date.now()}_${fileName.replace(/\.[^.]+$/, '')}`

  const signatureParams: Record<string, string> = {
    public_id: publicId,
    timestamp,
    folder,
  }
  const signature = await createCloudinarySignature(signatureParams, env.CLOUDINARY_API_SECRET)

  const formData = new FormData()
  formData.append('file', new Blob([arrayBuffer], { type: fileType }), fileName)
  formData.append('public_id', publicId)
  formData.append('timestamp', timestamp)
  formData.append('api_key', env.CLOUDINARY_API_KEY)
  formData.append('signature', signature)
  formData.append('folder', folder)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Cloudinary upload failed: ${error}`)
  }

  const result = await response.json() as { url: string; public_id: string }
  return {
    url: result.url,
    publicId: result.public_id,
  }
}

export async function deleteFromCloudinary(
  publicId: string,
  env: CloudflareBindings
): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signatureParams: Record<string, string> = {
    public_id: publicId,
    timestamp,
  }
  const signature = await createCloudinarySignature(signatureParams, env.CLOUDINARY_API_SECRET)

  const formData = new FormData()
  formData.append('public_id', publicId)
  formData.append('timestamp', timestamp)
  formData.append('api_key', env.CLOUDINARY_API_KEY)
  formData.append('signature', signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Cloudinary delete failed: ${error}`)
  }
}