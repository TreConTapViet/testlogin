import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { readJSON, writeJSON } from '../lib/storage'

// Hoàn cảnh phối đồ người dùng nhập ở phòng thử (dịp, mùa, đi cùng ai, ghi chú).
// Lưu ở users/{uid}: outfitContext (lần gần nhất) + outfitContextHistory (tối đa 8 lần, mới nhất trước).
const HISTORY_MAX = 8
const demoKey = (uid) => `tudo:outfit-contexts:${uid}`

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')
const id = (value) => (typeof value === 'string' && value ? value : null)

export function normalizeContext(raw) {
  return {
    occasion: id(raw?.occasion),
    occasionText: text(raw?.occasionText, 120),
    season: id(raw?.season),
    companion: id(raw?.companion),
    companionText: text(raw?.companionText, 60),
    note: text(raw?.note, 200),
  }
}

export function isEmptyContext(context) {
  const c = normalizeContext(context)
  return !c.occasion && !c.occasionText && !c.season && !c.companion && !c.companionText && !c.note
}

const sameContext = (a, b) => JSON.stringify(normalizeContext(a)) === JSON.stringify(normalizeContext(b))

function cleanHistory(list) {
  return Array.isArray(list) ? list.filter((entry) => entry && !isEmptyContext(entry)).slice(0, HISTORY_MAX) : []
}

/** { current, history } — current là hoàn cảnh lưu gần nhất (hoặc null). */
export async function loadContexts(uid) {
  if (!isFirebaseConfigured) {
    const saved = readJSON(demoKey(uid), null)
    return { current: saved?.current ?? null, history: cleanHistory(saved?.history) }
  }
  const snapshot = await getDoc(doc(db, 'users', uid))
  const data = snapshot.exists() ? snapshot.data() : {}
  return { current: data.outfitContext ?? null, history: cleanHistory(data.outfitContextHistory) }
}

/** Lưu hoàn cảnh mới lên đầu lịch sử (bỏ bản trùng). Trả về { current, history } mới. */
export async function saveContext(uid, context, previousHistory = []) {
  const entry = { ...normalizeContext(context), savedAt: new Date().toISOString() }
  const history = [entry, ...cleanHistory(previousHistory).filter((item) => !sameContext(item, entry))].slice(0, HISTORY_MAX)
  if (!isFirebaseConfigured) {
    writeJSON(demoKey(uid), { current: entry, history })
    return { current: entry, history }
  }
  // mergeFields: chỉ ghi hai trường này, giữ nguyên hồ sơ, biệt danh… trong cùng tài liệu
  await setDoc(
    doc(db, 'users', uid),
    { outfitContext: { ...entry, updatedAt: serverTimestamp() }, outfitContextHistory: history },
    { mergeFields: ['outfitContext', 'outfitContextHistory'] },
  )
  return { current: entry, history }
}

export function contextErrorMessage(error) {
  const code = error?.code ?? ''
  if (code === 'permission-denied') return 'Firestore chưa cho phép lưu hoàn cảnh. Kiểm tra lại Security Rules (xem README).'
  if (code === 'unavailable') return 'Mất kết nối nên chưa lưu được hoàn cảnh, gợi ý vẫn hiện bình thường.'
  return 'Chưa lưu được hoàn cảnh, gợi ý vẫn hiện bình thường.'
}
