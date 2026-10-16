// Các lựa chọn trong form hồ sơ. Lưu id trong form, gửi nhãn tiếng Việt cho AI.

export const GENDER_OPTIONS = [
  { id: 'nam', label: 'Nam' },
  { id: 'nu', label: 'Nữ' },
  { id: 'khac', label: 'Khác' },
]

export const STYLE_OPTIONS = [
  { id: 'toi-gian', label: 'Tối giản' },
  { id: 'thanh-lich', label: 'Thanh lịch' },
  { id: 'cong-so', label: 'Công sở' },
  { id: 'duong-pho', label: 'Đường phố' },
  { id: 'nang-dong', label: 'Năng động' },
  { id: 'co-dien', label: 'Cổ điển' },
  { id: 'nu-tinh', label: 'Nữ tính' },
  { id: 'ca-tinh', label: 'Cá tính' },
  { id: 'han-quoc', label: 'Hàn Quốc' },
  { id: 'boho', label: 'Boho' },
]

export const COLOR_OPTIONS = [
  { id: 'den', label: 'Đen', swatch: '#1f1f22' },
  { id: 'trang', label: 'Trắng', swatch: '#ffffff' },
  { id: 'be', label: 'Be / Kem', swatch: '#e9dcc4' },
  { id: 'xam', label: 'Xám', swatch: '#9b9b9b' },
  { id: 'navy', label: 'Xanh navy', swatch: '#26365a' },
  { id: 'xanh-duong', label: 'Xanh dương', swatch: '#4f8fd6' },
  { id: 'xanh-la', label: 'Xanh lá', swatch: '#6aa36f' },
  { id: 'do', label: 'Đỏ', swatch: '#c8343e' },
  { id: 'hong', label: 'Hồng', swatch: '#ec9fb6' },
  { id: 'vang', label: 'Vàng', swatch: '#f1cb4f' },
  { id: 'cam', label: 'Cam', swatch: '#ec8a3f' },
  { id: 'tim', label: 'Tím', swatch: '#9b7bc8' },
  { id: 'nau', label: 'Nâu', swatch: '#8a5a3b' },
  { id: 'pastel', label: 'Pastel', swatch: 'linear-gradient(135deg, #f6c6d6, #c9e4f6 50%, #d9f2c9)' },
]

export const labelsOf = (options, ids) =>
  ids.map((id) => options.find((option) => option.id === id)?.label).filter(Boolean)
