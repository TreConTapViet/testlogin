// Các lựa chọn nhanh cho câu hỏi hoàn cảnh trong phòng thử đồ

export const OCCASIONS = [
  { id: 'di-lam', label: 'Đi làm' },
  { id: 'hen-ho', label: 'Hẹn hò' },
  { id: 'dam-cuoi', label: 'Đám cưới' },
  { id: 'tiec', label: 'Dự tiệc, sự kiện' },
  { id: 'dao-pho', label: 'Dạo phố, cà phê' },
  { id: 'di-hoc', label: 'Đi học' },
  { id: 'phong-van', label: 'Phỏng vấn' },
  { id: 'du-lich', label: 'Du lịch, đi biển' },
  { id: 'the-thao', label: 'Thể thao, vận động' },
  { id: 'le-tet', label: 'Lễ Tết, đi chùa' },
]

export const SEASONS = [
  { id: 'xuan', label: 'Xuân', hint: 'mát, ẩm' },
  { id: 'ha', label: 'Hạ', hint: 'nóng' },
  { id: 'thu', label: 'Thu', hint: 'se lạnh' },
  { id: 'dong', label: 'Đông', hint: 'lạnh' },
]

export const COMPANIONS = [
  { id: 'mot-minh', label: 'Một mình' },
  { id: 'nguoi-yeu', label: 'Người yêu' },
  { id: 'ban-be', label: 'Bạn bè' },
  { id: 'gia-dinh', label: 'Gia đình' },
  { id: 'dong-nghiep', label: 'Đồng nghiệp' },
  { id: 'sep-doi-tac', label: 'Sếp, đối tác' },
]

export const labelOf = (options, id) => options.find((option) => option.id === id)?.label ?? ''

// Mùa gợi ý theo nhiệt độ hôm nay (ưu tiên) hoặc theo tháng
export function seasonFromWeather(temp, date = new Date()) {
  if (typeof temp === 'number') {
    if (temp >= 30) return 'ha'
    if (temp <= 18) return 'dong'
  }
  const month = date.getMonth() + 1
  if (month >= 2 && month <= 4) return 'xuan'
  if (month >= 5 && month <= 7) return 'ha'
  if (month >= 8 && month <= 10) return 'thu'
  return 'dong'
}

// Hoàn cảnh tự gõ → dịp gần nhất (để vẫn lọc được gợi ý)
const OCCASION_KEYWORDS = [
  ['dam-cuoi', ['cưới', 'đám hỏi', 'wedding']],
  ['phong-van', ['phỏng vấn', 'interview']],
  ['di-lam', ['đi làm', 'công sở', 'văn phòng', 'công ty', 'họp', 'meeting']],
  ['hen-ho', ['hẹn hò', 'người yêu', 'date', 'crush', 'kỷ niệm']],
  ['tiec', ['tiệc', 'sinh nhật', 'sự kiện', 'event', 'party', 'gala', 'dạ hội']],
  ['du-lich', ['du lịch', 'biển', 'nghỉ dưỡng', 'travel', 'resort', 'đi chơi xa']],
  ['the-thao', ['thể thao', 'gym', 'chạy', 'đá bóng', 'yoga', 'tập']],
  ['le-tet', ['tết', 'chùa', 'lễ', 'đền', 'nhà thờ']],
  ['di-hoc', ['đi học', 'trường', 'lớp', 'đại học']],
  ['dao-pho', ['cà phê', 'cafe', 'dạo', 'đi chơi', 'mua sắm', 'xem phim']],
]

export function occasionFromText(text) {
  const normalized = String(text ?? '').toLowerCase()
  if (!normalized.trim()) return null
  return OCCASION_KEYWORDS.find(([, words]) => words.some((word) => normalized.includes(word)))?.[0] ?? null
}

// Tóm tắt một hoàn cảnh thành một dòng ngắn: "Đám cưới · Hạ · Gia đình"
export function contextSummary(context) {
  return [
    labelOf(OCCASIONS, context?.occasion) || context?.occasionText,
    labelOf(SEASONS, context?.season),
    labelOf(COMPANIONS, context?.companion) || context?.companionText,
  ]
    .filter(Boolean)
    .join(' · ')
}
