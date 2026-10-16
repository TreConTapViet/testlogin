import { readJSON, removeKey, writeJSON } from '../lib/storage'
import { AuthError } from './authErrors'

// Chế độ demo khi chưa cấu hình Firebase: tài khoản chỉ lưu trong localStorage của trình duyệt này
const ACCOUNTS_KEY = 'tudo:demo-accounts'
const SESSION_KEY = 'tudo:demo-session'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const createId = () => `demo-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

async function hashPassword(password) {
  // crypto.subtle chỉ có trên localhost/HTTPS; ngoài ra dùng hàm băm đơn giản (chỉ để demo)
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  let hash = 5381
  for (const char of password) hash = (hash * 33 + char.codePointAt(0)) >>> 0
  return `djb2-${hash.toString(16)}`
}

function readAccounts() {
  const accounts = readJSON(ACCOUNTS_KEY, {})
  return accounts && typeof accounts === 'object' ? accounts : {}
}

function startSession(account) {
  const session = {
    uid: account.uid,
    email: account.email,
    nickname: account.nickname,
    photoURL: null,
    avatar: account.avatar ?? null,
    provider: account.provider,
  }
  writeJSON(SESSION_KEY, session)
  return session
}

// Đổi biệt danh / avatar: cập nhật cả phiên đăng nhập lẫn tài khoản đã lưu (để lần sau vẫn giữ)
export function demoUpdateAccount(patch) {
  const session = { ...getDemoSession(), ...patch }
  writeJSON(SESSION_KEY, session)
  const accounts = readAccounts()
  if (Object.hasOwn(accounts, session.email)) {
    writeJSON(ACCOUNTS_KEY, { ...accounts, [session.email]: { ...accounts[session.email], ...patch } })
  }
  return session
}

export function getDemoSession() {
  const session = readJSON(SESSION_KEY, null)
  return session && typeof session.uid === 'string' && typeof session.nickname === 'string' ? session : null
}

export async function demoSignUp({ nickname, email, password }) {
  await wait(500)
  const accounts = readAccounts()
  if (Object.hasOwn(accounts, email)) throw new AuthError('auth/email-already-in-use')
  const account = {
    uid: createId(),
    email,
    nickname,
    provider: 'password',
    passwordHash: await hashPassword(password),
  }
  writeJSON(ACCOUNTS_KEY, { ...accounts, [email]: account })
  return startSession(account)
}

export async function demoSignIn({ email, password }) {
  await wait(500)
  const accounts = readAccounts()
  const account = Object.hasOwn(accounts, email) ? accounts[email] : null
  if (!account || account.passwordHash !== (await hashPassword(password))) {
    throw new AuthError('auth/invalid-credential')
  }
  return startSession(account)
}

export async function demoGoogleSignIn() {
  await wait(600)
  return startSession({ uid: 'demo-google', email: 'khach.google@gmail.com', nickname: 'Khách Google', provider: 'google' })
}

export async function demoResetPassword() {
  await wait(400)
}

export function demoSignOut() {
  removeKey(SESSION_KEY)
}
