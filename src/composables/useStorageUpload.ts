import { useSupabase } from '@/composables/useSupabase'

const BUCKET = 'Alwib-store'
const MAX_INPUT_BYTES = 5 * 1024 * 1024 // 5 MB hard limit
const TARGET_BYTES = 2.5 * 1024 * 1024 // compress down to ~2.5 MB

const { supabase } = useSupabase()

async function compressImage(file: File): Promise<Blob> {
  if (file.size <= TARGET_BYTES) return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { naturalWidth: w, naturalHeight: h } = img
      const MAX_DIM = 2048
      if (w > MAX_DIM || h > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / w, MAX_DIM / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)

      // PNG uses lossless compression — resize is the only lever
      // For everything else compress as JPEG
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      let quality = 0.85

      const attempt = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Ошибка сжатия изображения'))
              return
            }
            if (blob.size <= TARGET_BYTES || quality <= 0.3) {
              resolve(blob)
            } else {
              quality -= 0.15
              attempt()
            }
          },
          outputType,
          quality,
        )
      }
      attempt()
    }

    img.onerror = () => reject(new Error('Не удалось прочитать изображение'))
    img.src = objectUrl
  })
}

export async function uploadPhoto(
  file: File,
  userId: string,
  prefix: 'store' | 'product',
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Допустимы только изображения (JPG, PNG, WebP и др.)')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Размер файла превышает 5 МБ')
  }

  const compressed = await compressImage(file)
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/${prefix}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, { contentType: file.type, upsert: false })

  if (error) throw new Error(error.message)

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
