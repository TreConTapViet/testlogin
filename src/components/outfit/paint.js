// Màu vẽ cho từng món đang mặc và các quy tắc mặc chồng lớp (tay áo, sơ vin)
import { WARDROBE_BY_ID } from '../../data/wardrobe'
import { hexToHsl, mix, shade } from '../../lib/color'

export const itemOf = (piece) => (piece ? WARDROBE_BY_ID[piece.itemId] : null)

/**
 * fill: màu trơn hoặc họa tiết; line: viền; dark: nếp gấp; deep: mặt trong (cổ áo, lót);
 * shadeH/shadeV: lớp đổ bóng trong suốt phủ lên để vải trông có khối.
 */
export function paintOf(uid, slot, piece) {
  const base = piece.color
  const lightness = hexToHsl(base).l
  const veryDark = lightness < 20
  return {
    base,
    fill: piece.pattern && piece.pattern !== 'solid' ? `url(#${uid}-p-${slot})` : base,
    line: veryDark ? shade(base, 18) : mix(base, '#1d1a17', 0.36),
    dark: veryDark ? shade(base, 10) : shade(base, -12),
    deep: veryDark ? shade(base, 5) : shade(base, -26),
    light: lightness > 86 ? shade(base, -3) : shade(base, 9),
    second: piece.color2,
    shadeH: `url(#${uid}-sh)`,
    shadeV: `url(#${uid}-sv)`,
  }
}

// Màu trơn từ một mã màu (quần lụa của áo dài, đế giày, quai túi…)
export const solidPaint = (uid, color) => paintOf(uid, 'solid', { color, pattern: 'solid' })

// Áo bỏ trong quần khi có thắt lưng (trừ áo croptop, hoodie, áo thun oversize)
export function isTucked(worn) {
  const top = itemOf(worn.top)
  if (!top || !worn.bottom || !worn.belt) return false
  return top.shape.length === 'regular' && top.shape.neck !== 'hood'
}

/**
 * Các lớp tay áo từ trong ra ngoài: áo/đầm/áo dài rồi tới áo khoác.
 * kind: 'short' | 'elbow' | 'long'; puff: tay bồng; loose: tay rộng.
 */
export function sleeveLayers(worn) {
  const layers = []
  const top = itemOf(worn.top)
  if (top && ['short', 'elbow', 'long'].includes(top.shape.sleeve)) {
    layers.push({ slot: 'top', kind: top.shape.sleeve, puff: Boolean(top.shape.puff), loose: top.shape.fit === 'loose' })
  }
  const dress = itemOf(worn.dress)
  if (dress?.kind === 'dress' && dress.shape.bodice === 'short') {
    layers.push({ slot: 'dress', kind: 'short', puff: Boolean(dress.shape.puff), loose: dress.shape.skirt === 'shift' })
  }
  if (dress?.kind === 'aodai') layers.push({ slot: 'dress', kind: 'long', puff: false, loose: false })
  const outer = itemOf(worn.outer)
  if (outer && !outer.shape.sleeveless) {
    layers.push({ slot: 'outer', kind: 'long', puff: false, loose: true, outer: outer.shape.style })
  }
  return layers
}

// Giày hở (thấy bàn chân) và bốt cao cổ (ống bốt bọc ngoài ống quần)
export const BARE_SHOES = new Set(['sandal', 'wedge', 'slide'])
export const SHAFT_SHOES = new Set(['tallboot'])
