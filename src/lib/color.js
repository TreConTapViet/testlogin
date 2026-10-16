// Tiện ích màu: chuyển hex ↔ HSL, làm đậm/nhạt, trộn màu, xét sáng/tối

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export function hexToRgb(hex) {
  let value = String(hex).replace('#', '')
  if (value.length === 3) value = value.split('').map((char) => char + char).join('')
  const number = parseInt(value, 16)
  if (Number.isNaN(number)) return { r: 128, g: 128, b: 128 }
  return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 }
}

export function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0')).join('')}`
}

export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex)
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return { h: h * 60, s: s * 100, l: l * 100 }
}

export function hslToHex({ h, s, l }) {
  const hue = (((h % 360) + 360) % 360) / 360
  const sat = clamp(s, 0, 100) / 100
  const lig = clamp(l, 0, 100) / 100
  if (sat === 0) return rgbToHex({ r: lig * 255, g: lig * 255, b: lig * 255 })
  const q = lig < 0.5 ? lig * (1 + sat) : lig + sat - lig * sat
  const p = 2 * lig - q
  const channel = (t) => {
    let x = t
    if (x < 0) x += 1
    if (x > 1) x -= 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  return rgbToHex({ r: channel(hue + 1 / 3) * 255, g: channel(hue) * 255, b: channel(hue - 1 / 3) * 255 })
}

// amount âm = đậm hơn, dương = nhạt hơn (theo điểm L của HSL)
export function shade(hex, amount) {
  const hsl = hexToHsl(hex)
  return hslToHex({ ...hsl, l: hsl.l + amount })
}

export function mix(a, b, t = 0.5) {
  const x = hexToRgb(a)
  const y = hexToRgb(b)
  return rgbToHex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t })
}

export function isLight(hex) {
  const { r, g, b } = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
}

// Màu phụ tự động cho họa tiết: tương phản vừa phải với màu chính
export function autoSecondary(hex) {
  return isLight(hex) ? shade(hex, -32) : shade(hex, 26)
}

// Màu "ít bão hoà" → coi là trung tính
export function isNeutral(hex) {
  return hexToHsl(hex).s < 18
}
