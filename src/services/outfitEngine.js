// Bộ máy gợi ý của phòng thử đồ: lọc + chấm điểm các bộ phối soạn sẵn theo hồ sơ và hoàn cảnh,
// cá nhân hoá (tránh màu/món người dùng không thích) và phối màu nhanh cho cả bộ.

import { COLOR_OPTIONS, GENDER_OPTIONS, STYLE_OPTIONS } from '../data/styleOptions'
import { OUTFITS } from '../data/outfits'
import { COMPANIONS, OCCASIONS, SEASONS, labelOf, occasionFromText } from '../data/outfitContexts'
import { SLOT_CONFLICTS, WARDROBE_BY_ID } from '../data/wardrobe'
import { colorHex, FASHION_COLORS } from '../data/fashionPalette'
import { autoSecondary, hexToHsl, hslToHex, isNeutral, shade } from '../lib/color'
import { bodyBalanceById } from './bodyProfile'

// ---------- Món đang mặc ----------
// worn: { [slot]: { itemId, color, color2, pattern } } — màu luôn là mã hex
export function makePiece(itemId, colorId, extra = {}) {
  const item = WARDROBE_BY_ID[itemId]
  const color = colorHex(colorId ?? item.color)
  const second = extra.color2 ?? item.color2
  return {
    itemId,
    color,
    color2: second ? colorHex(second) : autoSecondary(color),
    pattern: extra.pattern ?? item.pattern,
  }
}

export function wearPiece(worn, piece) {
  const item = WARDROBE_BY_ID[piece.itemId]
  const next = { ...worn }
  for (const slot of SLOT_CONFLICTS[item.slot] ?? []) delete next[slot]
  next[item.slot] = piece
  return next
}

export function outfitToWorn(outfit) {
  return outfit.items.reduce((worn, [itemId, color, extra]) => wearPiece(worn, makePiece(itemId, color, extra)), {})
}

// ---------- Đọc hồ sơ ----------
const normalize = (text) =>
  String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .trim()

const idsFromLabels = (options, labels) =>
  (labels ?? [])
    .map((label) => options.find((option) => normalize(option.label) === normalize(label))?.id)
    .filter(Boolean)

function profileStyles(profile) {
  return new Set([...(profile?.styleInput?.styles ?? []), ...idsFromLabels(STYLE_OPTIONS, profile?.style?.styles)])
}

// Nhóm màu trong hồ sơ → các màu tương ứng trong bảng màu thời trang
const COLOR_FAMILIES = {
  den: ['den'],
  trang: ['trang', 'trang-nga'],
  be: ['be', 'kem', 'kaki'],
  xam: ['xam', 'xam-than'],
  navy: ['navy'],
  'xanh-duong': ['denim', 'denim-sang', 'cobalt', 'xanh-baby'],
  'xanh-la': ['olive', 'forest', 'mint', 'teal', 'xanh-ngoc'],
  do: ['do', 'burgundy'],
  hong: ['hong-pastel', 'fuchsia'],
  vang: ['vang-bo', 'vang-gold'],
  cam: ['cam-dat'],
  tim: ['lavender'],
  nau: ['nau', 'camel'],
  pastel: ['hong-pastel', 'xanh-baby', 'mint', 'lavender', 'vang-bo'],
}

function profileColorSet(profile, key) {
  const ids = new Set([...(profile?.styleInput?.[key] ?? []), ...idsFromLabels(COLOR_OPTIONS, profile?.style?.[key])])
  const hexes = new Set()
  for (const id of ids) for (const paletteId of COLOR_FAMILIES[id] ?? []) hexes.add(colorHex(paletteId).toLowerCase())
  return hexes
}

// Món yêu thích trong hồ sơ (mã của bộ icon cũ) → điều kiện trên danh mục mới
const FAVORITE_RULES = {
  tshirt: (item) => item.id.startsWith('ao-thun'),
  dress: (item) => item.kind === 'dress',
  jacket: (item) => item.category === 'khoac',
  sneaker: (item) => ['sneaker-trang', 'sneaker-retro', 'runner'].includes(item.id),
  hat: (item) => item.slot === 'hat',
  handbag: (item) => ['tui-xach', 'clutch'].includes(item.id),
  sunglasses: (item) => item.id === 'kinh-ram',
  pants: (item) => item.kind === 'pants' && item.shape.length === 'long',
  heel: (item) => ['cao-got', 'slingback'].includes(item.id),
  hoodie: (item) => item.id === 'hoodie',
  scarf: (item) => item.slot === 'scarf',
  boot: (item) => ['chelsea-boot', 'bot-cao-co'].includes(item.id),
  shirt: (item) => item.id.startsWith('so-mi'),
  tote: (item) => item.id === 'tui-tote',
  skirt: (item) => item.kind === 'skirt',
  tie: (item) => item.slot === 'neckwear',
  watch: (item) => item.slot === 'watch',
  shorts: (item) => item.shape?.length === 'short',
}

// Món không thích (AI ghi bằng chữ) → nhận diện món trong danh mục
const AVOID_RULES = [
  [/cao got|giay got|slingback/, (item) => ['cao-got', 'slingback'].includes(item.id)],
  [/\bbo\b|om sat|skinny|bo sat/, (item) => item.shape?.fit === 'slim' || item.shape?.skirt === 'bodycon' || item.shape?.shape === 'pencil' || item.id === 'ao-corset'],
  [/hai day|croptop|crop|ho vai|ho bung|tank|ba lo/, (item) => ['ao-hai-day', 'croptop', 'ao-corset', 'dam-lua', 'ao-tank'].includes(item.id)],
  [/chan vay|vay ngan|mini/, (item) => item.kind === 'skirt'],
  [/\bdam\b|vay lien/, (item) => item.kind === 'dress'],
  [/quan short|quan ngan|\bshort\b/, (item) => item.shape?.length === 'short'],
  [/jean|\bbo\b jean|denim/, (item) => item.shape?.style === 'jeans' || item.id === 'ao-khoac-jean' || item.id === 'chan-vay-mini'],
  [/do da|\bda\b/, (item) => ['ao-khoac-da', 'chan-vay-da'].includes(item.id)],
  [/hoodie/, (item) => item.id === 'hoodie'],
  [/sneaker|giay the thao/, (item) => ['sneaker-trang', 'sneaker-retro', 'runner'].includes(item.id)],
  [/\bmu\b|\bnon\b/, (item) => item.slot === 'hat'],
  [/\bkinh\b/, (item) => item.slot === 'glasses'],
]

function avoidPredicate(profile) {
  const labels = (profile?.style?.avoidItems ?? []).map(normalize)
  const rules = AVOID_RULES.filter(([pattern]) => labels.some((label) => pattern.test(label)))
  return (item) => rules.some(([, test]) => test(item))
}

// Món thay thế khi người dùng không thích món trong bộ phối
const SUBSTITUTES = {
  'cao-got': ['giay-bup-be', 'loafer'],
  slingback: ['loafer', 'giay-bup-be'],
  'ao-hai-day': ['ao-co-vuong', 'ao-thun'],
  croptop: ['ao-thun'],
  'ao-corset': ['ao-blouse'],
  'ao-tank': ['ao-thun'],
  'dam-om': ['dam-suong'],
  'dam-lua': ['dam-suong'],
  'chan-vay-but-chi': ['chan-vay-chu-a'],
  'chan-vay-da': ['chan-vay-chu-a'],
  'chan-vay-mini': ['chan-vay-chu-a'],
  'quan-short-kaki': ['quan-kaki'],
  'quan-short-jean': ['quan-jean'],
  'quan-jean': ['quan-kaki', 'quan-tay'],
  'quan-jean-rong': ['quan-tay-rong', 'quan-linen'],
  'ao-khoac-da': ['blazer'],
  'ao-khoac-jean': ['cardigan'],
  hoodie: ['ao-len'],
  'sneaker-trang': ['loafer'],
  'sneaker-retro': ['loafer'],
  runner: ['sneaker-trang'],
  'ao-polo-len': ['ao-polo'],
}

// Màu thay thế an toàn khi người dùng muốn tránh một màu
const NEUTRAL_FALLBACKS = ['navy', 'xam', 'den', 'be', 'trang-nga', 'xam-than', 'nau']

function personalize(outfit, profile, avoids, avoidHexes) {
  const changes = []
  const items = []
  let blocked = false
  for (const [itemId, color, extra] of outfit.items) {
    let id = itemId
    const original = WARDROBE_BY_ID[itemId]
    if (avoids(original)) {
      const swap = (SUBSTITUTES[itemId] ?? []).find((candidate) => !avoids(WARDROBE_BY_ID[candidate]))
      if (swap) {
        id = swap
        changes.push(`Đổi ${original.name.toLowerCase()} → ${WARDROBE_BY_ID[swap].name.toLowerCase()}`)
      } else if (['top', 'bottom', 'dress', 'shoes'].includes(original.slot)) {
        blocked = true
      } else {
        changes.push(`Bỏ ${original.name.toLowerCase()}`)
        continue
      }
    }
    let colorId = color
    if (avoidHexes.has(colorHex(color).toLowerCase())) {
      const replacement = NEUTRAL_FALLBACKS.find((candidate) => !avoidHexes.has(colorHex(candidate).toLowerCase()))
      if (replacement) {
        changes.push(`Đổi màu ${FASHION_COLORS.find((c) => c.id === color)?.name.toLowerCase() ?? 'tự chọn'} → ${FASHION_COLORS.find((c) => c.id === replacement)?.name.toLowerCase()}`)
        colorId = replacement
      }
    }
    items.push([id, colorId, extra])
  }
  return { ...outfit, items, changes: [...new Set(changes)], blocked }
}

// ---------- Chấm điểm ----------
const RELATED_OCCASIONS = {
  'di-lam': ['phong-van'],
  'phong-van': ['di-lam'],
  'dam-cuoi': ['tiec', 'le-tet'],
  tiec: ['dam-cuoi', 'hen-ho'],
  'hen-ho': ['dao-pho', 'tiec'],
  'dao-pho': ['di-hoc', 'hen-ho', 'du-lich'],
  'di-hoc': ['dao-pho'],
  'du-lich': ['dao-pho'],
  'the-thao': ['dao-pho'],
  'le-tet': ['dam-cuoi'],
}

// Độ trang trọng phù hợp với người đi cùng
const COMPANION_FORMALITY = {
  'sep-doi-tac': [4, 5],
  'dong-nghiep': [3, 4],
  'nguoi-yeu': [2, 4],
  'gia-dinh': [2, 4],
  'ban-be': [1, 3],
  'mot-minh': [1, 3],
}

const OCCASION_ORDER = Object.fromEntries(OCCASIONS.map((occasion, index) => [occasion.id, index]))

export function resolveOccasion(context) {
  return context?.occasion || occasionFromText(context?.occasionText) || occasionFromText(context?.note) || null
}

// Phép lịch sự theo dịp: khách dự cưới tránh đầm/áo dài trắng và trắng toàn thân; đi chùa, lễ Tết kín đáo;
// phỏng vấn, đi làm tránh đồ quá xuề xoà; lễ Tết tránh đen toàn thân
const WHITES = new Set(['trang', 'trang-nga', 'kem'].map((id) => colorHex(id).toLowerCase()))
const BLACK = colorHex('den').toLowerCase()
const isRevealing = (item) =>
  ['strap', 'none'].includes(item.shape?.sleeve) ||
  item.shape?.bodice === 'strap' ||
  ['crop', 'short', 'mini'].includes(item.shape?.length)
const isTooCasual = (item) =>
  item.shape?.length === 'short' || ['dep-da', 'ao-tank', 'hoodie', 'ao-thun-graphic', 'quan-jogger'].includes(item.id)

function etiquettePenalty(outfit, occasion) {
  const pieces = outfit.items.map(([id, color]) => ({ item: WARDROBE_BY_ID[id], hex: colorHex(color).toLowerCase() }))
  const of = (slot) => pieces.find(({ item }) => item.slot === slot)
  const main = of('dress') ?? of('top')
  const bottom = of('bottom')
  const covered = Boolean(of('outer'))
  let penalty = 0
  if (occasion === 'dam-cuoi' && main && WHITES.has(main.hex) && (main.item.slot === 'dress' || (bottom && WHITES.has(bottom.hex)))) penalty += 45
  if (occasion === 'le-tet' && !covered && pieces.some(({ item }) => isRevealing(item))) penalty += 40
  if ((occasion === 'phong-van' || occasion === 'di-lam') && pieces.some(({ item }) => isTooCasual(item))) penalty += 30
  if (occasion === 'le-tet' && main?.hex === BLACK && (!bottom || bottom.hex === BLACK)) penalty += 20
  return penalty
}

function scoreOutfit(outfit, context, profile, styles, favoriteHexes, weatherSeason) {
  const matches = []
  let score = 0
  const occasion = resolveOccasion(context)
  if (occasion) score -= etiquettePenalty(outfit, occasion)
  if (occasion) {
    if (outfit.occasions.includes(occasion)) {
      score += 50
      matches.push(`Hợp dịp ${OCCASIONS.find((o) => o.id === occasion)?.label.toLowerCase()}`)
    } else if (outfit.occasions.some((o) => RELATED_OCCASIONS[occasion]?.includes(o))) {
      score += 18
    } else {
      score -= 30
    }
  }
  if (context?.season) {
    if (outfit.seasons.includes(context.season)) {
      score += 25
      matches.push('Đúng mùa')
    } else score -= 12
  } else if (weatherSeason && outfit.seasons.includes(weatherSeason)) {
    score += 8
  }
  const range = COMPANION_FORMALITY[context?.companion]
  if (range) {
    if (outfit.formality >= range[0] && outfit.formality <= range[1]) score += 12
    else score -= 8 * Math.min(Math.abs(outfit.formality - range[0]), Math.abs(outfit.formality - range[1]))
  }
  const styleHits = outfit.styles.filter((style) => styles.has(style))
  if (styleHits.length) {
    score += 9 * styleHits.length
    matches.push(`Đúng gu ${STYLE_OPTIONS.find((s) => s.id === styleHits[0])?.label.toLowerCase()}`)
  }
  const favoriteRules = (profile?.styleInput?.favoriteItems ?? []).map((id) => FAVORITE_RULES[id]).filter(Boolean)
  const items = outfit.items.map(([id]) => WARDROBE_BY_ID[id])
  if (favoriteRules.some((rule) => items.some(rule))) {
    score += 6
    matches.push('Có món bạn hay mặc')
  }
  if (outfit.items.some(([, color]) => favoriteHexes.has(colorHex(color).toLowerCase()))) score += 5
  // Vóc dáng: dáng mảnh hợp layer nhiều lớp; dáng đầy đặn hợp phom suông, ống đứng/rộng
  const balance = profile?.bodyBalance
  if (balance === 'manh' && items.some((item) => item.slot === 'outer')) score += 5
  if ((balance === 'day-dan' || balance === 'tron-day') && items.some((item) => ['straight', 'wide'].includes(item.shape?.fit) || ['shift', 'a-line'].includes(item.shape?.skirt ?? item.shape?.shape))) score += 5
  if (outfit.blocked) score -= 60
  return { score, matches }
}

/**
 * mode 'context': lọc theo hoàn cảnh đã nhập. mode 'all': mọi hoàn cảnh và mùa (người dùng bấm "Gợi ý ngay").
 * Trả về các bộ đã cá nhân hoá, kèm điểm, lý do phù hợp và các thay đổi theo sở thích.
 */
export function suggestOutfits({ profile, context, mode = 'context', weatherSeason = null }) {
  const gender = profile?.gender ?? 'khac'
  const avoids = avoidPredicate(profile)
  const avoidHexes = profileColorSet(profile, 'avoidColors')
  const favoriteHexes = profileColorSet(profile, 'favoriteColors')
  const styles = profileStyles(profile)

  const pool = OUTFITS.filter((outfit) => gender === 'khac' || outfit.gender === 'unisex' || outfit.gender === gender)
    .map((outfit) => personalize(outfit, profile, avoids, avoidHexes))
    .filter((outfit) => !outfit.blocked)

  if (mode === 'all') {
    return pool
      .map((outfit) => ({ ...outfit, score: null, matches: [] }))
      .sort((a, b) => (OCCASION_ORDER[a.occasions[0]] ?? 99) - (OCCASION_ORDER[b.occasions[0]] ?? 99) || a.formality - b.formality)
  }

  return pool
    .map((outfit) => ({ ...outfit, ...scoreOutfit(outfit, context, profile, styles, favoriteHexes, weatherSeason) }))
    .filter((outfit) => outfit.score > 0)
    .sort((a, b) => b.score - a.score)
}

// ---------- Phối màu nhanh cho cả bộ ----------
const ROLE_OF_SLOT = {
  dress: 'main',
  top: 'main',
  outer: 'outer',
  bottom: 'second',
  shoes: 'accent',
  bag: 'accent',
  hat: 'accent',
  belt: 'accent',
  scarf: 'accent',
  neckwear: 'accent',
}

const pick = (id) => colorHex(id)

function schemeColors(schemeId, base) {
  const hsl = hexToHsl(base)
  const tone = (dh, s, l) => hslToHex({ h: hsl.h + dh, s, l })
  switch (schemeId) {
    case 'don-sac':
      return { main: base, second: shade(base, hsl.l > 55 ? -28 : 24), outer: shade(base, hsl.l > 45 ? -16 : 14), accent: shade(base, -38) }
    case 'tuong-dong':
      return { main: base, second: tone(30, Math.max(25, hsl.s * 0.8), Math.min(70, hsl.l + 8)), outer: tone(-30, Math.max(20, hsl.s * 0.7), hsl.l - 6), accent: tone(-20, hsl.s, Math.max(18, hsl.l - 30)) }
    case 'tuong-phan':
      return { main: base, second: tone(180, Math.max(25, hsl.s * 0.6), hsl.l > 50 ? 30 : 72), outer: pick('xam-than'), accent: pick('den') }
    case 'pastel':
      return { main: tone(0, 55, 85), second: pick('trang-nga'), outer: tone(150, 40, 86), accent: pick('trang') }
    case 'mau-dat':
      return { main: pick('be'), second: pick('nau'), outer: pick('olive'), accent: pick('camel') }
    case 'trang-den':
      return { main: pick('trang'), second: pick('den'), outer: pick('den'), accent: pick('den'), metal: pick('vang-gold') }
    case 'trung-tinh':
    default: {
      const accent = isNeutral(base) ? pick('cam-dat') : base
      return { main: pick('trang-nga'), second: pick('navy'), outer: pick('be'), accent }
    }
  }
}

export function applyColorScheme(worn, schemeId, baseHex) {
  const colors = schemeColors(schemeId, baseHex)
  const next = {}
  for (const [slot, piece] of Object.entries(worn)) {
    const role = ROLE_OF_SLOT[slot]
    let color = piece.color
    if (role) color = colors[role]
    else if (colors.metal && ['watch', 'bracelet', 'necklace', 'earrings'].includes(slot)) color = colors.metal
    next[slot] = { ...piece, color, color2: piece.pattern === 'solid' ? autoSecondary(color) : piece.color2 === piece.color ? autoSecondary(color) : piece.color2 }
  }
  return next
}

// ---------- Dữ liệu gửi AI chọn bộ phối (nhãn tiếng Việt, không gửi số đo) ----------
const colorLabel = (id) => FASHION_COLORS.find((color) => color.id === id)?.name ?? 'màu tự chọn'

export function aiPickerInput({ profile, context, candidates, weather, city }) {
  const style = profile?.style ?? {}
  const occasion = resolveOccasion(context)
  const joined = (...parts) => parts.filter(Boolean).join(' — ')
  return {
    nguoiDung: {
      gioiTinh: GENDER_OPTIONS.find((option) => option.id === profile?.gender)?.label ?? 'Chưa rõ',
      dangNguoi: bodyBalanceById(profile?.bodyBalance)?.label ?? 'Chưa rõ',
      phongCach: style.styles ?? [],
      mauThich: style.favoriteColors ?? [],
      mauTranh: style.avoidColors ?? [],
      monKhongThich: style.avoidItems ?? [],
    },
    hoanCanh: {
      dip: joined(labelOf(OCCASIONS, occasion), context?.occasionText) || 'chưa nói',
      mua: labelOf(SEASONS, context?.season) || 'chưa nói',
      diCung: joined(labelOf(COMPANIONS, context?.companion), context?.companionText) || 'chưa nói',
      ghiChu: context?.note ?? '',
    },
    thoiTiet: weather ? `${city ?? ''} ${weather.temp}°C, ${weather.text}`.trim() : '',
    ungVien: candidates.map((outfit) => ({
      id: outfit.id,
      ten: outfit.name,
      dip: outfit.occasions.map((id) => labelOf(OCCASIONS, id)),
      mua: outfit.seasons.map((id) => labelOf(SEASONS, id)),
      trangTrong: outfit.formality,
      mon: outfit.items.map(([itemId, color]) => `${WARDROBE_BY_ID[itemId].name} (${colorLabel(color)})`),
      quyTac: outfit.note,
    })),
  }
}
