export async function uploadFile(
  bucket: R2Bucket,
  key: string,
  file: ArrayBuffer | ReadableStream,
  contentType: string
): Promise<string> {
  await bucket.put(key, file, {
    httpMetadata: {
      contentType,
    },
  })
  return key
}

export async function deleteFile(
  bucket: R2Bucket,
  key: string
): Promise<void> {
  await bucket.delete(key)
}

export function getPublicUrl(key: string, publicUrl: string): string {
  const baseUrl = publicUrl.replace(/\/$/, '')
  return `${baseUrl}/${key}`
}