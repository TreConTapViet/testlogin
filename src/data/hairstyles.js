// Kiểu tóc cho ma-nơ-canh. Nam theo Liêm Barber Shop (https://liembarbershop.com/141996/),
// nữ theo Thế Giới Nệm (https://thegioinem.com/20-kieu-toc-nu-phu-hop-voi-moi-khuon-mat.html).
// Mỗi kiểu là bộ thông số hình dáng (đơn vị = khung vẽ ma-nơ-canh, đầu bán kính 25):
// - hairline: đường chân tóc theo góc quanh đầu [[góc, độ lệch dọc]] (0° = trán, 180° = gáy; dương = thấp xuống)
// - top/side: độ dày tóc trên đỉnh / hai bên; quiff: phần tóc vuốt dựng phía trước
// - part: ngôi tóc ('left' | 'right' | 'center'); fade: hai bên cạo/fade; shaved: cắt sát (buzz)
// - long: tóc dài phía sau { length, width, wave, ends: 'straight' | 'curl' | 'c' | 'layer' }
// - tie: buộc/búi { type: 'ponytail' | 'braid' | 'top-bun' | 'half-bun' | 'side-pony' }

// Đường chân tóc mẫu (nửa phải, lật gương cho nửa trái)
const mirror = (points) => {
  const right = points.filter(([phi]) => phi > 0)
  return [...right.map(([phi, dy]) => [-phi, dy]).reverse(), ...points.filter(([phi]) => phi === 0), ...right]
}
// Nam: thái dương hơi lõm vào, tóc mai xuống ngang tai
const MALE_LINE = mirror([[0, -12], [28, -11.5], [48, -9], [64, -4], [80, 5], [90, 8], [104, 3], [130, 9], [180, 18]])
const FEMALE_LINE = mirror([[0, -10], [35, -8], [75, 3], [100, 8], [140, 18], [180, 22]])

const male = (id, name, face, shape) => ({ id, name, face, gender: 'nam', hairline: MALE_LINE, ...shape })
const female = (id, name, face, shape) => ({ id, name, face, gender: 'nu', hairline: FEMALE_LINE, ...shape })

export const HAIRSTYLES = [
  // ---------- Nam (Liêm Barber Shop) ----------
  male('undercut', 'Undercut gọn gàng', 'Hợp mặt vuông, dài, trái xoan', { top: 9, side: 1, quiff: 3, fade: true, sweep: 1 }),
  male('side-part', 'Side Part (rẽ ngôi lệch)', 'Hợp mặt tròn, trái xoan, vuông', { top: 6, side: 3, part: 'left', sweep: 1 }),
  male('short-layers', 'Layer cắt ngắn', 'Hợp mặt tròn, vuông, dài', {
    top: 8,
    side: 4.5,
    texture: 'wavy',
    hairline: mirror([[0, -6], [20, -7], [45, -8], [75, -1], [95, 5], [140, 15], [180, 19]]),
    fringe: 'wispy',
  }),
  male('quiff', 'Quiff ngắn', 'Hợp mặt vuông, trái xoan, tròn', { top: 9, side: 1.5, quiff: 6, fade: true }),
  male('buzz', 'Buzz Cut', 'Hợp mặt vuông, góc cạnh, trái xoan', { top: 1.5, side: 1, shaved: true }),
  male('ivy-league', 'Ivy League', 'Hợp mặt vuông, trái xoan, tròn', { top: 5, side: 2, quiff: 2, part: 'left', fade: true, sweep: 1 }),
  male('french-crop', 'French Crop', 'Hợp mặt vuông, tròn', {
    top: 4.5,
    side: 1.5,
    fade: true,
    texture: 'textured',
    hairline: mirror([[0, -7], [30, -7], [50, -6], [75, -1], [95, 5], [140, 15], [180, 18]]),
    fringe: 'forward',
  }),
  male('caesar', 'Caesar Cut', 'Hợp mặt vuông, tròn', {
    top: 3.5,
    side: 2,
    hairline: mirror([[0, -8], [30, -8], [55, -6], [80, 0], [100, 5], [140, 15], [180, 18]]),
    fringe: 'forward',
  }),
  male('crew-cut', 'Crew Cut', 'Hợp mặt vuông, tròn, trái xoan', { top: 3, side: 1.2, quiff: 1, fade: true }),
  male('pompadour', 'Pompadour ngắn', 'Hợp mặt vuông, trái xoan, dài', { top: 11, side: 1.5, quiff: 8, fade: true }),

  // ---------- Nữ (Thế Giới Nệm) ----------
  female('dai-thang', 'Tóc dài thẳng không mái', 'Hợp mặt trái xoan', { top: 4, side: 4, part: 'center', long: { length: 100, width: 31, wave: 0, ends: 'straight' } }),
  female('dai-song', 'Tóc dài xoăn gợn sóng', 'Hợp mặt vuông, trái xoan', {
    top: 5,
    side: 7,
    part: 'center',
    texture: 'wavy',
    long: { length: 102, width: 38, wave: 1, ends: 'curl' },
  }),
  female('dai-uon-duoi', 'Tóc dài uốn đuôi', 'Hợp mặt trái xoan', { top: 4.5, side: 5, part: 'left', long: { length: 96, width: 34, wave: 0.25, ends: 'curl' } }),
  female('dai-mai-che-doi', 'Tóc dài mái chẻ đôi', 'Hợp mặt tròn', {
    top: 4.5,
    side: 5,
    part: 'center',
    hairline: mirror([[0, -12], [12, -7], [30, -1], [50, 0], [75, 4], [100, 8], [140, 18], [180, 22]]),
    long: { length: 96, width: 32, wave: 0.15, ends: 'straight' },
  }),
  female('re-ngoi-lech', 'Tóc rẽ ngôi lệch, mái dài', 'Hợp mặt trái tim, vuông, tròn', {
    top: 5,
    side: 5,
    part: 'left',
    hairline: [[-180, 22], [-140, 18], [-100, 8], [-60, -4], [-38, -11], [-10, -6], [20, 1], [45, 4], [75, 5], [100, 8], [140, 18], [180, 22]],
    long: { length: 92, width: 32, wave: 0.2, ends: 'straight' },
  }),
  female('layer-ngang-vai', 'Tóc layer ngang vai', 'Hợp mặt trái tim, vuông', { top: 6, side: 7, part: 'left', long: { length: 52, width: 34, wave: 0.3, ends: 'layer' } }),
  female('ngang-vai-chu-c', 'Tóc ngang vai uốn chữ C', 'Hợp mặt kim cương', { top: 5, side: 6, part: 'center', long: { length: 50, width: 31, wave: 0, ends: 'c' } }),
  female('mai-bang-ngang-vai', 'Tóc mái bằng ngang vai', 'Hợp mặt kim cương', {
    top: 5,
    side: 5,
    hairline: mirror([[0, -1], [35, -1], [52, 0], [75, 4], [100, 8], [140, 18], [180, 22]]),
    fringe: 'blunt',
    long: { length: 48, width: 30, wave: 0, ends: 'straight' },
  }),
  female('lob', 'Tóc lob ngang vai', 'Hợp mặt kim cương, tròn', { top: 5, side: 6, part: 'left', texture: 'wavy', long: { length: 44, width: 33, wave: 0.45, ends: 'straight' } }),
  female('bob-om-mat', 'Tóc bob ngắn ôm mặt', 'Hợp mặt trái tim', { top: 5, side: 6, part: 'left', long: { length: 26, width: 30, wave: 0, ends: 'c' } }),
  female('bob-phong', 'Tóc bob uốn phồng', 'Hợp mặt kim cương', { top: 8, side: 9, part: 'center', texture: 'wavy', long: { length: 28, width: 37, wave: 0.7, ends: 'curl' } }),
  female('tem-mai-ngo', 'Tóc tém mái ngố', 'Hợp mặt dài', {
    top: 6,
    side: 3,
    hairline: mirror([[0, -4], [30, -4], [50, -3], [75, 2], [100, 6], [140, 14], [180, 16]]),
    fringe: 'blunt',
    texture: 'textured',
  }),
  female('duoi-ngua', 'Tóc thắt đuôi ngựa', 'Hợp hầu hết khuôn mặt', { top: 3, side: 2.5, tie: { type: 'ponytail', length: 66 } }),
  female('tet-duoi-sam', 'Tóc buộc đuôi sam (tết)', 'Hợp hầu hết khuôn mặt', { top: 3, side: 2.5, part: 'center', tie: { type: 'braid', length: 84 } }),
  female('bui-roi', 'Tóc búi rối', 'Hợp mặt trái tim', { top: 3.5, side: 3, tie: { type: 'top-bun' } }),
  female('bui-nua-dau', 'Tóc búi nửa đầu (half bun)', 'Hợp mặt trái xoan, tròn', {
    top: 4,
    side: 5,
    tie: { type: 'half-bun' },
    long: { length: 84, width: 31, wave: 0.35, ends: 'straight' },
  }),
  female('xoan-buoc-lech', 'Tóc xoăn buộc lệch vai, mái dài', 'Hợp mặt trái tim', {
    top: 4.5,
    side: 4,
    part: 'left',
    texture: 'wavy',
    hairline: [[-180, 22], [-140, 18], [-100, 8], [-60, -4], [-38, -11], [-10, -5], [20, 1], [45, 4], [75, 5], [100, 8], [140, 18], [180, 22]],
    tie: { type: 'side-pony', length: 70 },
  }),
]

export const HAIRSTYLE_BY_ID = Object.fromEntries(HAIRSTYLES.map((style) => [style.id, style]))

// Màu tóc phổ biến ở Việt Nam + vài màu nhuộm thời thượng
export const HAIR_COLORS = [
  { id: 'den', name: 'Đen tự nhiên', hex: '#1d1915' },
  { id: 'nau-den', name: 'Nâu đen', hex: '#3a2a22' },
  { id: 'nau-hat-de', name: 'Nâu hạt dẻ', hex: '#5d3a27' },
  { id: 'nau-tay', name: 'Nâu tây', hex: '#7a5038' },
  { id: 'caramel', name: 'Nâu caramel', hex: '#9c6b43' },
  { id: 'nau-khoi', name: 'Nâu khói lạnh', hex: '#5a5150' },
  { id: 'do-ruou', name: 'Đỏ rượu vang', hex: '#5b2433' },
  { id: 'xanh-den', name: 'Xanh đen', hex: '#1f2a3b' },
  { id: 'vang-tro', name: 'Vàng tro', hex: '#b6a07c' },
  { id: 'bach-kim', name: 'Bạch kim', hex: '#d8d2c6' },
]

// Kiểu tóc mặc định theo giới tính (người dùng đổi trong phòng thử, không cần khai báo ở hồ sơ)
export function defaultHair(gender) {
  if (gender === 'nam') return { styleId: 'side-part', color: '#1d1915', fluff: 0.5 }
  if (gender === 'nu') return { styleId: 'dai-thang', color: '#3a2a22', fluff: 0.5 }
  return { styleId: 'lob', color: '#3a2a22', fluff: 0.5 }
}
