import { GoogleAIBackend, Schema, getAI, getGenerativeModel } from 'firebase/ai'
import { GENDER_OPTIONS } from '../data/styleOptions'
import { app } from '../lib/firebase'
import { bodyBalanceById } from './bodyProfile'
import { OUTFIT_PICKER_INSTRUCTION, PROFILER_INSTRUCTION, STYLIST_INSTRUCTION } from './stylistKnowledge'

/*
 * Hai cách gọi Gemini:
 * 1. VITE_GEMINI_API_KEY có trong .env  → gọi thẳng Gemini API bằng key đó.
 *    Lưu ý: key nằm trong code trình duyệt, ai mở trang cũng xem được → hãy giới hạn key theo tên miền.
 * 2. Không có key → dùng Firebase AI Logic (key do Firebase giữ phía máy chủ, an toàn hơn).
 */
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash'
// Model dự phòng khi model chính quá tải
const FALLBACK_MODEL = import.meta.env.VITE_GEMINI_FALLBACK_MODEL || 'gemini-flash-latest'
// Lỗi tạm thời đáng thử lại cùng model; 429 (hết hạn mức) thì chuyển ngay sang model dự phòng
const RETRYABLE_STATUS = new Set([500, 503])
const ATTEMPTS_PER_MODEL = 2

export const isStylistAvailable = Boolean(API_KEY || app)

async function geminiError(response) {
  const body = await response.json().catch(() => null)
  const error = new Error(body?.error?.message || `Gemini HTTP ${response.status}`)
  error.status = response.status
  return error
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function timeoutError() {
  const error = new Error('Gemini phản hồi quá lâu')
  error.status = 504
  return error
}

/**
 * Gemini đôi khi quá tải (503) hoặc treo: thử lại 1 lần, rồi chuyển sang model dự phòng,
 * nhưng không vượt quá budgetMs. Trả về { response, abort } để có thể ngắt luồng stream bị đứng.
 */
async function postGemini(action, body, budgetMs) {
  const models = MODEL === FALLBACK_MODEL ? [MODEL] : [MODEL, FALLBACK_MODEL]
  const startedAt = Date.now()
  let lastError = null
  for (const model of models) {
    for (let attempt = 0; attempt < ATTEMPTS_PER_MODEL; attempt += 1) {
      if (attempt > 0) await wait(800 * attempt)
      const remaining = budgetMs - (Date.now() - startedAt)
      if (remaining <= 0) throw lastError ?? timeoutError()
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), remaining)
      let response
      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
          body,
          signal: controller.signal,
        })
      } catch (error) {
        clearTimeout(timer)
        // Hết thời gian: báo lỗi gần nhất (ví dụ quá tải) nếu có, rõ nghĩa hơn "quá lâu"
        throw controller.signal.aborted ? (lastError ?? timeoutError()) : error
      } finally {
        clearTimeout(timer)
      }
      if (response.ok) return { response, abort: () => controller.abort() }
      lastError = await geminiError(response)
      if (response.status === 429) break // hết hạn mức model này → sang model dự phòng
      if (!RETRYABLE_STATUS.has(response.status)) throw lastError
    }
  }
  throw lastError
}

const CHAT_BUDGET_MS = 35000
const PROFILE_BUDGET_MS = 25000
const STREAM_IDLE_MS = 30000

// Bỏ phần "suy nghĩ" nội bộ của model, chỉ lấy chữ trả lời
const textOf = (parts = []) => parts.map((part) => (part.thought ? '' : (part.text ?? ''))).join('')

let firebaseAI = null
function getFirebaseAI() {
  if (!app) throw new Error('Chưa cấu hình Firebase hoặc Gemini API key nên chưa dùng được trợ lý AI.')
  if (!firebaseAI) firebaseAI = getAI(app, { backend: new GoogleAIBackend() })
  return firebaseAI
}

// ---------- Trò chuyện, cách 1: gọi thẳng Gemini API (stream qua Server-Sent Events) ----------
function createDirectChat() {
  const history = []
  return {
    async send(text, onText) {
      const contents = [...history, { role: 'user', parts: [{ text }] }]
      const { response, abort } = await postGemini(
        'streamGenerateContent?alt=sse',
        JSON.stringify({ systemInstruction: { parts: [{ text: STYLIST_INSTRUCTION }] }, contents }),
        CHAT_BUDGET_MS,
      )

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let full = ''
      // Luồng trả lời đứng quá lâu thì ngắt, tránh treo khung chat
      let idleTimer = setTimeout(abort, STREAM_IDLE_MS)
      for (;;) {
        let chunk
        try {
          chunk = await reader.read()
        } catch (error) {
          clearTimeout(idleTimer)
          throw error.name === 'AbortError' ? timeoutError() : error
        }
        clearTimeout(idleTimer)
        idleTimer = setTimeout(abort, STREAM_IDLE_MS)
        const { value, done } = chunk
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split(/\r?\n\r?\n/)
        buffer = events.pop() // phần cuối có thể chưa nhận đủ
        for (const event of events) {
          const data = event
            .split(/\r?\n/)
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim())
            .join('')
          if (!data) continue
          full += textOf(JSON.parse(data).candidates?.[0]?.content?.parts)
          onText(full)
        }
      }

      clearTimeout(idleTimer)
      // Chỉ lưu lượt hỏi–đáp vào lịch sử khi đã trả lời xong
      history.push(contents.at(-1), { role: 'model', parts: [{ text: full }] })
      return full
    },
  }
}

// ---------- Trò chuyện, cách 2: Firebase AI Logic ----------
let chatModel = null

function createFirebaseChat() {
  if (!chatModel) {
    chatModel = getGenerativeModel(getFirebaseAI(), { model: MODEL, systemInstruction: STYLIST_INSTRUCTION })
  }
  const session = chatModel.startChat()
  return {
    async send(text, onText) {
      const result = await session.sendMessageStream(text)
      let full = ''
      for await (const chunk of result.stream) {
        full += chunk.text()
        onText(full)
      }
      return full
    },
  }
}

// Mỗi cuộc trò chuyện là một phiên riêng, nhớ các lượt trước trong phiên
export function createStylistChat() {
  return API_KEY ? createDirectChat() : createFirebaseChat()
}

// ---------- Bối cảnh gửi kèm mỗi tin nhắn ----------
const TIME_FORMAT = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
})

const WEATHER_WORDS = {
  clear: 'trời quang',
  partly: 'ít mây',
  cloud: 'nhiều mây',
  fog: 'sương mù',
  rain: 'mưa',
  storm: 'dông',
  snow: 'tuyết',
}

const joinOr = (items, fallback = 'chưa chọn') => (items?.length ? items.join(', ') : fallback)

function profileLines(nickname, profile) {
  if (!profile) return [`- Người dùng: ${nickname || 'chưa rõ tên'}; chưa có hồ sơ (chưa rõ giới tính, vóc dáng, phong cách).`]
  const gender = GENDER_OPTIONS.find((option) => option.id === profile.gender)?.label ?? 'chưa rõ'
  const balance = bodyBalanceById(profile.bodyBalance)
  const style = profile.style ?? {}
  return [
    `- Người dùng: ${nickname || 'chưa rõ tên'}; giới tính: ${gender}; cao ${profile.heightCm} cm, nặng ${profile.weightKg} kg${balance ? ` (${balance.label.toLowerCase()})` : ''}.`,
    `- Phong cách: ${joinOr(style.styles)}; phom thích: ${style.fit || 'chưa rõ'}.`,
    `- Màu thích: ${joinOr(style.favoriteColors)}; màu tránh: ${joinOr(style.avoidColors, 'không')}.`,
    `- Món hay mặc: ${joinOr(style.favoriteItems)}; món không thích: ${joinOr(style.avoidItems, 'không')}.`,
    ...(style.occasions?.length ? [`- Hoàn cảnh hay gặp: ${style.occasions.join(', ')}.`] : []),
    ...(style.notes ? [`- Ghi chú gu: ${style.notes}`] : []),
  ]
}

function weatherLine(city, weather) {
  if (!weather) return city ? `- Đang ở ${city} (chưa có dữ liệu thời tiết).` : null
  const upcoming = (weather.hours ?? [])
    .map((hour) => `${hour.label} ${hour.temp}° ${WEATHER_WORDS[hour.kind] ?? ''}`.trim())
    .join(', ')
  return (
    `- Thời tiết ${city}: ${weather.temp}°C (cảm giác ${weather.feelsLike}°C), ${weather.text}, độ ẩm ${weather.humidity}%` +
    (upcoming ? `; vài giờ tới: ${upcoming}.` : '.')
  )
}

function buildContext({ nickname, city, weather, profile, now }) {
  const lines = [
    now ? `- Thời gian hiện tại: ${TIME_FORMAT.format(now)} (giờ Việt Nam).` : null,
    ...profileLines(nickname, profile),
    weatherLine(city, weather),
  ].filter(Boolean)
  return `[Bối cảnh]\n${lines.join('\n')}\n[Hết bối cảnh]\n`
}

/** Gửi tin nhắn, nhận câu trả lời dần dần qua onText(toàn bộ chữ đã nhận). */
export function sendToStylist(chat, text, context, onText) {
  return chat.send(`${buildContext(context)}${text}`, onText)
}

// ---------- AI chuẩn hoá hồ sơ phong cách thành JSON ----------
const LIST_FIELDS = ['styles', 'favoriteColors', 'avoidColors', 'favoriteItems', 'avoidItems', 'occasions']
const FIT_VALUES = ['ôm', 'vừa vặn', 'rộng rãi', 'chưa rõ']

const REST_SCHEMA = {
  type: 'OBJECT',
  properties: {
    ...Object.fromEntries(LIST_FIELDS.map((field) => [field, { type: 'ARRAY', items: { type: 'STRING' } }])),
    fit: { type: 'STRING', enum: FIT_VALUES },
    notes: { type: 'STRING' },
  },
  required: [...LIST_FIELDS, 'fit', 'notes'],
}

let profilerModel = null
function getProfilerModel() {
  if (!profilerModel) {
    const listSchema = () => Schema.array({ items: Schema.string() })
    profilerModel = getGenerativeModel(getFirebaseAI(), {
      model: MODEL,
      systemInstruction: PROFILER_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: Schema.object({
          properties: {
            ...Object.fromEntries(LIST_FIELDS.map((field) => [field, listSchema()])),
            fit: Schema.enumString({ enum: FIT_VALUES }),
            notes: Schema.string(),
          },
        }),
      },
    })
  }
  return profilerModel
}

function cleanList(value) {
  if (!Array.isArray(value)) return []
  const items = value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim().slice(0, 40))
    .filter(Boolean)
  return [...new Set(items)].slice(0, 12)
}

// Luôn trả về đúng cấu trúc dù AI trả thiếu/thừa trường
export function normalizeStyleProfile(raw) {
  return {
    ...Object.fromEntries(LIST_FIELDS.map((field) => [field, cleanList(raw?.[field])])),
    fit: FIT_VALUES.includes(raw?.fit) ? raw.fit : 'chưa rõ',
    notes: typeof raw?.notes === 'string' ? raw.notes.trim().slice(0, 300) : '',
  }
}

// Dùng khi AI lỗi: vẫn lưu đúng những gì người dùng đã chọn
export function fallbackStyleProfile(input) {
  return normalizeStyleProfile({
    styles: input.styles,
    favoriteColors: input.favoriteColors,
    avoidColors: input.avoidColors,
    favoriteItems: input.favoriteItems,
    avoidItems: [],
    occasions: [],
    fit: 'chưa rõ',
    notes: input.description,
  })
}

/**
 * input: { gender, styles, favoriteColors, avoidColors, favoriteItems, description } (nhãn tiếng Việt)
 * Trả về JSON phong cách đã chuẩn hoá để lưu vào Firestore.
 */
export async function generateStyleProfile(input) {
  const payload = JSON.stringify(input)
  if (API_KEY) {
    const { response } = await postGemini(
      'generateContent',
      JSON.stringify({
        systemInstruction: { parts: [{ text: PROFILER_INSTRUCTION }] },
        contents: [{ role: 'user', parts: [{ text: payload }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: REST_SCHEMA },
      }),
      PROFILE_BUDGET_MS,
    )
    const data = await response.json()
    return normalizeStyleProfile(JSON.parse(textOf(data.candidates?.[0]?.content?.parts)))
  }
  const result = await getProfilerModel().generateContent(payload)
  return normalizeStyleProfile(JSON.parse(result.response.text()))
}

// ---------- AI chọn bộ phối trong phòng thử đồ (chỉ chọn trong danh sách ứng viên) ----------
const PICKER_BUDGET_MS = 15000
const PICKS_MAX = 5
const PICKER_SCHEMA = {
  type: 'OBJECT',
  properties: {
    picks: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { id: { type: 'STRING' }, reason: { type: 'STRING' } },
        required: ['id', 'reason'],
      },
    },
  },
  required: ['picks'],
}

let pickerModel = null
function getPickerModel() {
  if (!pickerModel) {
    pickerModel = getGenerativeModel(getFirebaseAI(), {
      model: MODEL,
      systemInstruction: OUTFIT_PICKER_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: Schema.object({
          properties: {
            picks: Schema.array({ items: Schema.object({ properties: { id: Schema.string(), reason: Schema.string() } }) }),
          },
        }),
      },
    })
  }
  return pickerModel
}

// Chỉ giữ id có trong danh sách ứng viên, không trùng, tối đa 5 bộ
export function normalizePicks(raw, candidateIds) {
  const allowed = new Set(candidateIds)
  const seen = new Set()
  const picks = []
  for (const pick of Array.isArray(raw?.picks) ? raw.picks : []) {
    if (!allowed.has(pick?.id) || seen.has(pick.id)) continue
    seen.add(pick.id)
    picks.push({ id: pick.id, reason: typeof pick.reason === 'string' ? pick.reason.trim().slice(0, 180) : '' })
    if (picks.length === PICKS_MAX) break
  }
  return picks
}

/**
 * input: { nguoiDung, hoanCanh, thoiTiet, ungVien: [{ id, ... }] } (nhãn tiếng Việt).
 * Trả về [{ id, reason }] theo thứ tự AI xếp; lỗi thì ném ra để nơi gọi dùng gợi ý theo quy tắc.
 */
export async function pickOutfitsWithAI(input) {
  const payload = JSON.stringify(input)
  const ids = input.ungVien.map((candidate) => candidate.id)
  if (API_KEY) {
    const { response } = await postGemini(
      'generateContent',
      JSON.stringify({
        systemInstruction: { parts: [{ text: OUTFIT_PICKER_INSTRUCTION }] },
        contents: [{ role: 'user', parts: [{ text: payload }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: PICKER_SCHEMA },
      }),
      PICKER_BUDGET_MS,
    )
    const data = await response.json()
    return normalizePicks(JSON.parse(textOf(data.candidates?.[0]?.content?.parts)), ids)
  }
  const result = await getPickerModel().generateContent(payload)
  return normalizePicks(JSON.parse(result.response.text()), ids)
}

export function stylistErrorMessage(error) {
  const code = error?.code ?? ''
  const message = error?.message ?? ''
  if (code.includes('api-not-enabled') || message.includes('api-not-enabled'))
    return 'Firebase AI Logic chưa được bật cho dự án. Hãy bật trong Firebase Console rồi thử lại.'
  if (error?.status === 504) return 'Gemini phản hồi quá lâu. Bạn bấm "Thử lại" nhé.'
  if (/exceeded your current quota/i.test(message))
    return 'Gemini API key đã hết hạn mức sử dụng. Đợi hạn mức được làm mới hoặc nâng gói trong Google AI Studio.'
  if (error?.status === 503 || /high demand|overloaded|UNAVAILABLE/i.test(message))
    return 'Gemini đang quá tải, bạn đợi một lát rồi bấm "Thử lại" nhé.'
  if (error?.status === 400 || error?.status === 403 || /API key/i.test(message))
    return 'Gemini API key không hợp lệ hoặc bị giới hạn. Kiểm tra lại key trong file .env.'
  if (error?.status === 429 || /quota|429|RESOURCE_EXHAUSTED/i.test(message))
    return 'Trợ lý đang quá tải, bạn thử lại sau ít phút nhé.'
  if (/network|fetch/i.test(message)) return 'Mất kết nối mạng. Kiểm tra Internet rồi thử lại.'
  return 'Trợ lý chưa trả lời được. Bạn thử lại nhé.'
}
