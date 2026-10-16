// Bảng màu thời trang dùng cho phòng thử đồ.
// Nguồn: nguyên tắc nền trung tính + 1 màu nhấn, quy tắc 60-30-10 (Maison Online, Canifa)
// và các màu xu hướng 2026 (Cloud Dancer, teal, xanh ngọc, fuchsia, kaki, vàng bơ).

export const COLOR_GROUPS = [
  { id: 'trung-tinh', label: 'Trung tính' },
  { id: 'nhan', label: 'Màu nhấn' },
  { id: 'pastel', label: 'Pastel' },
  { id: 'kim-loai', label: 'Kim loại' },
]

export const FASHION_COLORS = [
  { id: 'den', name: 'Đen', hex: '#1f1f23', group: 'trung-tinh' },
  { id: 'trang', name: 'Trắng', hex: '#fbfbf9', group: 'trung-tinh' },
  { id: 'trang-nga', name: 'Trắng ngà (Cloud Dancer)', hex: '#efebe2', group: 'trung-tinh' },
  { id: 'kem', name: 'Kem', hex: '#ece0c8', group: 'trung-tinh' },
  { id: 'be', name: 'Be', hex: '#d6c3a1', group: 'trung-tinh' },
  { id: 'kaki', name: 'Kaki', hex: '#b6a47b', group: 'trung-tinh' },
  { id: 'camel', name: 'Camel', hex: '#b5895a', group: 'trung-tinh' },
  { id: 'nau', name: 'Nâu', hex: '#6e4b33', group: 'trung-tinh' },
  { id: 'xam', name: 'Xám', hex: '#a2a3a6', group: 'trung-tinh' },
  { id: 'xam-than', name: 'Xám than', hex: '#3f4248', group: 'trung-tinh' },
  { id: 'navy', name: 'Xanh navy', hex: '#25334f', group: 'trung-tinh' },
  { id: 'denim', name: 'Xanh denim', hex: '#4b6b96', group: 'nhan' },
  { id: 'denim-sang', name: 'Denim sáng', hex: '#8eaed4', group: 'nhan' },
  { id: 'olive', name: 'Xanh olive', hex: '#6b7046', group: 'nhan' },
  { id: 'forest', name: 'Xanh rêu', hex: '#2f5242', group: 'nhan' },
  { id: 'teal', name: 'Xanh mòng két', hex: '#1f6d72', group: 'nhan' },
  { id: 'xanh-ngoc', name: 'Xanh ngọc', hex: '#3bb3ab', group: 'nhan' },
  { id: 'cobalt', name: 'Xanh cobalt', hex: '#2f56c2', group: 'nhan' },
  { id: 'burgundy', name: 'Đỏ rượu', hex: '#6c2434', group: 'nhan' },
  { id: 'do', name: 'Đỏ', hex: '#c1303b', group: 'nhan' },
  { id: 'cam-dat', name: 'Cam đất', hex: '#c2603f', group: 'nhan' },
  { id: 'fuchsia', name: 'Hồng fuchsia', hex: '#c03c88', group: 'nhan' },
  { id: 'hong-pastel', name: 'Hồng pastel', hex: '#f1c3ce', group: 'pastel' },
  { id: 'xanh-baby', name: 'Xanh baby', hex: '#bad4ec', group: 'pastel' },
  { id: 'mint', name: 'Xanh mint', hex: '#bfe4d2', group: 'pastel' },
  { id: 'lavender', name: 'Tím lavender', hex: '#cbbde4', group: 'pastel' },
  { id: 'vang-bo', name: 'Vàng bơ', hex: '#f2dd98', group: 'pastel' },
  { id: 'vang-gold', name: 'Vàng gold', hex: '#c9a24c', group: 'kim-loai' },
  { id: 'bac', name: 'Bạc', hex: '#c6cad0', group: 'kim-loai' },
]

const BY_ID = Object.fromEntries(FASHION_COLORS.map((color) => [color.id, color]))

// Nhận id trong bảng màu hoặc mã hex, luôn trả về mã hex
export function colorHex(value) {
  if (!value) return '#9a9a9e'
  if (value.startsWith('#')) return value
  return BY_ID[value]?.hex ?? '#9a9a9e'
}

export function colorName(hex) {
  const found = FASHION_COLORS.find((color) => color.hex.toLowerCase() === String(hex).toLowerCase())
  return found?.name ?? 'Màu tự chọn'
}

// Họa tiết vải: kẻ sọc, caro, chấm bi... (màu phụ dùng cho nét họa tiết)
export const PATTERNS = [
  { id: 'solid', name: 'Trơn' },
  { id: 'stripe-h', name: 'Sọc ngang' },
  { id: 'stripe-v', name: 'Sọc dọc' },
  { id: 'caro', name: 'Caro' },
  { id: 'gingham', name: 'Kẻ ô nhỏ' },
  { id: 'dots', name: 'Chấm bi' },
  { id: 'floral', name: 'Hoa nhí' },
  { id: 'denim', name: 'Vân denim' },
  { id: 'knit', name: 'Vân len' },
]

// Phối màu nhanh cho cả bộ (bánh xe màu + quy tắc 60-30-10)
export const COLOR_SCHEMES = [
  { id: 'trung-tinh', name: 'Trung tính + điểm nhấn', hint: 'Nền trung tính, màu đang chọn làm điểm nhấn 10%' },
  { id: 'don-sac', name: 'Đơn sắc', hint: 'Cùng một màu, đậm nhạt khác nhau (tone-sur-tone)' },
  { id: 'tuong-dong', name: 'Tương đồng', hint: 'Các màu cạnh nhau trên bánh xe màu' },
  { id: 'tuong-phan', name: 'Tương phản', hint: 'Màu bổ túc đối diện, tiết chế tỉ lệ' },
  { id: 'pastel', name: 'Pastel nhẹ nhàng', hint: 'Hồng pastel, xanh baby, mint, kem' },
  { id: 'mau-dat', name: 'Tông đất', hint: 'Be, camel, nâu, olive' },
  { id: 'trang-den', name: 'Trắng – đen', hint: 'Cặp màu kinh điển, phụ kiện vàng gold' },
]
