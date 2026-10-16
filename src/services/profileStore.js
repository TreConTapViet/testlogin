import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { readJSON, writeJSON } from '../lib/storage'

// Hồ sơ nằm ở users/{uid}.profile — chỉ chủ tài khoản đọc/ghi được (xem rules trong README)
const demoKey = (uid) => `tudo:demo-profile:${uid}`

export async function loadProfile(uid) {
  if (!isFirebaseConfigured) return readJSON(demoKey(uid), null)
  const snapshot = await getDoc(doc(db, 'users', uid))
  return snapshot.exists() ? (snapshot.data().profile ?? null) : null
}

export async function saveProfileData(uid, profile) {
  if (!isFirebaseConfigured) {
    writeJSON(demoKey(uid), { ...profile, updatedAt: new Date().toISOString() })
    return
  }
  // mergeFields: chỉ thay trường "profile", giữ nguyên biệt danh, email... đã lưu lúc đăng ký
  await setDoc(doc(db, 'users', uid), { profile: { ...profile, updatedAt: serverTimestamp() } }, { mergeFields: ['profile'] })
}

export function profileErrorMessage(error) {
  const code = error?.code ?? ''
  if (code === 'permission-denied') return 'Firestore chưa cho phép ghi hồ sơ. Kiểm tra lại Security Rules (xem README).'
  if (code === 'unavailable') return 'Mất kết nối tới máy chủ. Kiểm tra Internet rồi thử lại.'
  return 'Chưa lưu được hồ sơ. Bạn thử lại nhé.'
}

// updatedAt có thể là Timestamp của Firestore, chuỗi ISO (demo) hoặc Date
export function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
