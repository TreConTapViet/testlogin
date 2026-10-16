// Tính BMI (ẩn) và "độ cân bằng cơ thể" hiển thị cho người dùng

export const HEIGHT_RANGE = { min: 100, max: 230 }
export const WEIGHT_RANGE = { min: 25, max: 250 }

// Nhận cả "55,5" lẫn "55.5"
export function parseMeasure(value) {
  const text = String(value ?? '').trim().replace(',', '.')
  if (!text) return NaN
  const number = Number(text)
  return Number.isFinite(number) ? number : NaN
}

export const roundTo = (value, digits = 1) => Math.round(value * 10 ** digits) / 10 ** digits

export function calcBmi(heightCm, weightKg) {
  if (!(heightCm > 0) || !(weightKg > 0)) return null
  const meters = heightCm / 100
  return roundTo(weightKg / (meters * meters))
}

// Ngưỡng BMI cho người châu Á (WHO 2000). Lời mô tả hướng về cách chọn đồ, không phán xét ngoại hình.
export const BODY_BALANCE = [
  {
    id: 'manh',
    max: 18.5,
    label: 'Dáng mảnh mai',
    short: 'Mảnh mai',
    color: '#8fbbe6',
    advice: 'Đồ có phom đứng, mặc nhiều lớp và tông màu sáng giúp tổng thể trông cân đối, có sức sống.',
  },
  {
    id: 'can-doi',
    max: 23,
    label: 'Dáng cân đối',
    short: 'Cân đối',
    color: '#83c995',
    advice: 'Cơ thể đang ở trạng thái cân bằng. Bạn mặc hợp hầu hết các kiểu dáng, cứ chọn theo phong cách mình thích.',
  },
  {
    id: 'day-dan',
    max: 25,
    label: 'Dáng hơi đầy đặn',
    short: 'Đầy đặn',
    color: '#efc265',
    advice: 'Chất liệu đứng phom, đường cắt gọn, cạp cao và tông màu trầm giúp tổng thể thanh thoát hơn.',
  },
  {
    id: 'tron-day',
    max: Infinity,
    label: 'Dáng đầy đặn',
    short: 'Tròn đầy',
    color: '#ee9f73',
    advice: 'Phom suông vừa người, cổ chữ V, sọc dọc và chất liệu rủ mềm sẽ tôn dáng và tạo cảm giác thoải mái.',
  },
]

export function bodyBalanceOf(bmi) {
  return bmi == null ? null : BODY_BALANCE.find((level) => bmi < level.max)
}

export function bodyBalanceById(id) {
  return BODY_BALANCE.find((level) => level.id === id) ?? null
}

// Vị trí trên thanh hiển thị (0..1), thang 15 → 32
const GAUGE_MIN = 15
const GAUGE_MAX = 32
export function gaugePosition(value) {
  return Math.min(1, Math.max(0, (value - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)))
}

// Ranh giới giữa các nhóm trên thanh (bỏ nhóm cuối vì là vô cực)
export const GAUGE_STOPS = BODY_BALANCE.slice(0, -1).map((level) => gaugePosition(level.max))
