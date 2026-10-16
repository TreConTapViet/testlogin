import { HAIRSTYLE_BY_ID, defaultHair } from '../data/hairstyles'
import { readJSON, writeJSON } from '../lib/storage'

// Kiểu tóc người dùng chọn cho ma-nơ-canh (lưu trên trình duyệt, theo từng tài khoản)
const key = (uid) => `tudo:hair:${uid}`

/** { hair, saved } — saved = false nghĩa là chưa từng chọn (đang dùng kiểu mặc định theo giới tính). */
export function loadHair(uid, gender) {
  const stored = readJSON(key(uid), null)
  if (stored && HAIRSTYLE_BY_ID[stored.styleId] && typeof stored.color === 'string') {
    return { hair: { styleId: stored.styleId, color: stored.color, fluff: Number(stored.fluff ?? 0.5) }, saved: true }
  }
  return { hair: defaultHair(gender), saved: false }
}

export function saveHair(uid, hair) {
  writeJSON(key(uid), hair)
}
