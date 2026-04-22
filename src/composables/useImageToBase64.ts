export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Not an image file'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('File too large (max 5 MB)'))
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target!.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function placeholderSvg(label: string, w = 480, h = 360): string {
  const palettes: [string, string][] = [
    ['#F0E6D6', '#A8784A'],
    ['#D6E8F0', '#4A7EA8'],
    ['#D6F0E0', '#4A9858'],
    ['#F0D6E8', '#A84A7E'],
    ['#EDE6F0', '#7A4AA8'],
    ['#F0EDD6', '#A89A4A'],
    ['#D6EEF0', '#4A9BA8'],
    ['#F0D6D6', '#A84A4A'],
  ]
  const idx = label.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palettes.length
  const [bg, fg] = palettes[idx]
  const lines = Array.from({ length: 14 }, (_, i) => {
    const x1 = -w + i * 70
    const x2 = i * 70
    return `<line x1="${x1}" y1="0" x2="${x2}" y2="${h}" stroke="${fg}" stroke-width="1.5" opacity="0.12"/>`
  }).join('')
  const short = label.length > 22 ? label.slice(0, 22) + '…' : label
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect fill="${bg}" width="100%" height="100%"/>${lines}<text x="50%" y="50%" font-family="Manrope,sans-serif" font-size="13" fill="${fg}" opacity="0.6" text-anchor="middle" dy=".3em">${short}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function formatRub(n: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(n)
}

export function calcDiscount(price: number, salePrice: number | null): number {
  if (!salePrice || salePrice >= price) return 0
  return Math.round((1 - salePrice / price) * 100)
}
