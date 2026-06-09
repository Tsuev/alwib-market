import { useSupabase } from '@/composables/useSupabase'
import heic2any from 'heic2any'

const BUCKET = 'Alwib-store'
const MAX_INPUT_BYTES = 20 * 1024 * 1024
const TARGET_BYTES = 1.1 * 1024 * 1024
const HEIC_TYPES = new Set(['image/heic', 'image/heif'])

const { supabase } = useSupabase()

function isHeicFile(file: File) {
  return HEIC_TYPES.has(file.type) || /\.hei[cf]$/i.test(file.name)
}

function isSupportedImage(file: File) {
  return file.type.startsWith('image/') || isHeicFile(file)
}

function replaceExtension(name: string, ext: string) {
  return (name.includes('.') ? name.replace(/\.[^.]+$/, '') : name) + `.${ext}`
}

async function normalizeImage(file: File): Promise<File> {
  if (!isHeicFile(file)) return file

  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.9,
  })

  const blob = Array.isArray(result) ? result[0] : result

  if (!(blob instanceof Blob)) {
    throw new Error('Не удалось конвертировать HEIC в JPEG')
  }

  return new File([blob], replaceExtension(file.name, 'jpg'), {
    type: 'image/jpeg',
  })
}

async function compressImage(file: File): Promise<Blob> {
  if (file.size <= TARGET_BYTES) return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { naturalWidth: w, naturalHeight: h } = img
      const MAX_DIM = 1600
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
      let quality = 0.82

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
              quality -= 0.1
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

export async function preparePhotoForUpload(file: File): Promise<File> {
  if (!isSupportedImage(file)) {
    throw new Error('Допустимы только изображения (JPG, PNG, WebP, HEIC и др.)')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Размер исходного файла превышает 20 МБ')
  }

  const normalized = await normalizeImage(file)
  const compressed = await compressImage(normalized)
  const contentType = compressed.type || normalized.type || 'image/jpeg'
  const ext =
    contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'

  return new File([compressed], replaceExtension(normalized.name, ext), {
    type: contentType,
    lastModified: Date.now(),
  })
}

export async function uploadPhoto(
  file: File,
  userId: string,
  prefix: 'store' | 'product',
): Promise<string> {
  const prepared = await preparePhotoForUpload(file)
  const contentType = prepared.type || 'image/jpeg'
  const ext =
    contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/${prefix}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, prepared, { contentType, upsert: false })

  if (error) throw new Error(error.message)

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
