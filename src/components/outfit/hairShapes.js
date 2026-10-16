// Hình học tóc trên đầu cầu của ma-nơ-canh. Đầu là khối cầu nên khi xoay 0–180°:
// - mũ tóc = viền ngoài (luôn là cung tròn quanh đầu + độ phồng) + đường chân tóc chiếu theo góc xoay
//   → nhìn trước thấy trán, nhìn nghiêng thấy chân tóc chéo từ trán xuống gáy, nhìn sau tóc phủ kín;
// - tóc dài, đuôi ngựa, búi nằm phía sau/hai bên đầu, tự đổi lớp trước/sau theo hướng đang nhìn.
import { HAIRSTYLE_BY_ID } from '../../data/hairstyles'
import { hexToHsl, mix, shade } from '../../lib/color'
import { clamp, r1 } from './rig'
import { SKIN } from './skinTone'

const RAD = Math.PI / 180
const wrap = (deg) => ((((deg + 180) % 360) + 360) % 360) - 180
const FADE_LINE = -9

// Độ lệch dọc của đường chân tóc tại góc phi (nội suy mượt giữa các mốc)
export function hairlineAt(points, phi) {
  const p = wrap(phi)
  for (let index = 1; index < points.length; index += 1) {
    const [p1, d1] = points[index]
    if (p <= p1) {
      const [p0, d0] = points[index - 1]
      const t = p1 === p0 ? 0 : (p - p0) / (p1 - p0)
      return d0 + ((d1 - d0) * (1 - Math.cos(Math.PI * t))) / 2
    }
  }
  return points[points.length - 1][1]
}

export function hairPaint(hex) {
  const lightness = hexToHsl(hex).l
  const dark = lightness < 20
  return {
    base: hex,
    strand: dark ? shade(hex, 9) : shade(hex, -12),
    deep: dark ? shade(hex, -5) : shade(hex, -20),
    sheen: mix(hex, '#ffffff', dark ? 0.3 : 0.42),
    fade: mix(hex, SKIN.base, 0.55),
    shaved: mix(hex, SKIN.base, 0.42),
  }
}

/** Kiểu tóc đã chọn + độ bồng bềnh (0–1) → thông số vẽ. Đội mũ thì tóc đỉnh ép xẹp, ẩn búi trên đỉnh. */
export function resolveHair(hair, { hat = false } = {}) {
  const style = HAIRSTYLE_BY_ID[hair?.styleId]
  if (!style) return null
  // Độ bồng bềnh: 0% ôm gọn (×0.65) → 100% phồng (×1.35)
  const k = 0.65 + clamp(hair.fluff ?? 0.5, 0, 1) * 0.7
  return {
    ...style,
    top: hat ? Math.min(style.top, 2.5) : style.top * k,
    side: style.fade || style.shaved ? style.side : style.side * k,
    quiff: hat ? 0 : (style.quiff ?? 0) * k,
    fluffK: k,
    widthK: 0.82 + 0.18 * k,
    hideTop: hat,
    paint: hairPaint(hair.color),
  }
}

// Đường cong mượt đi qua các điểm (điểm giữa + Q); move = false để nối tiếp path đang vẽ
function curveThrough(points, move = true) {
  const [x0, y0] = points[0]
  let d = move ? `M ${r1(x0)} ${r1(y0)}` : ` L ${r1(x0)} ${r1(y0)}`
  if (points.length < 3) return d + points.slice(1).map(([x, y]) => ` L ${r1(x)} ${r1(y)}`).join('')
  for (let index = 1; index < points.length - 1; index += 1) {
    const [x, y] = points[index]
    const [nx, ny] = points[index + 1]
    d += ` Q ${r1(x)} ${r1(y)} ${r1((x + nx) / 2)} ${r1((y + ny) / 2)}`
  }
  const [lx, ly] = points[points.length - 1]
  return `${d} L ${r1(lx)} ${r1(ly)}`
}

// Độ phồng của tóc theo góc trên màn hình (0 = đỉnh đầu); mái vuốt dựng nhô về phía mặt khi xoay
function volumeAt(f, hair, a) {
  let v = hair.side + (hair.top - hair.side) * Math.max(0, Math.cos(a)) ** 1.5
  if (hair.quiff) v += hair.quiff * Math.exp(-(((a - 52 * RAD * f.s) / (34 * RAD)) ** 2))
  return v
}

// Đường chân tóc thực tế: mốc của kiểu tóc + răng cưa nhẹ cho mái thưa / tóc tỉa
export function hairline(hair) {
  const zig = hair.fringe === 'wispy' ? 1.7 : hair.fringe === 'forward' || hair.texture === 'textured' ? 1.1 : 0
  return (phi) => {
    const front = Math.max(0, Math.cos(phi * RAD)) ** 2
    return hairlineAt(hair.hairline, phi) + zig * front * Math.sin(phi * 18 * RAD)
  }
}

// Phần tóc giữ màu đậm của kiểu fade: phía trước theo chân tóc, hai bên và gáy dừng ở đường fade
export function fadeTopLine(hair) {
  const line = hairline(hair)
  return (phi) => {
    const front = Math.max(0, Math.cos(phi * RAD)) ** 2
    return front * line(phi) + (1 - front) * Math.min(line(phi), FADE_LINE)
  }
}

/** Mũ tóc: viền ngoài phồng quanh đỉnh đầu + đường chân tóc nhìn thấy (chiếu theo góc xoay). */
export function capPath(f, hair, line) {
  const { x: hx, y: hy, r: R } = f.head
  const ring = (dy) => Math.sqrt(Math.max(0, R * R - dy * dy))
  const phiL = -f.turn - 90
  const phiR = -f.turn + 90
  const dyL = line(phiL)
  const dyR = line(phiR)
  const left = [hx - ring(dyL) - hair.side, hy + dyL]
  const right = [hx + ring(dyR) + hair.side, hy + dyR]
  const aL = Math.atan2(left[0] - hx, -(left[1] - hy))
  const aR = Math.atan2(right[0] - hx, -(right[1] - hy))
  const outer = []
  const steps = 28
  for (let index = 0; index <= steps; index += 1) {
    const a = aL + ((aR - aL) * index) / steps
    const rho = R + volumeAt(f, hair, a)
    outer.push([hx + rho * Math.sin(a), hy - rho * Math.cos(a)])
  }
  outer[0] = left
  outer[steps] = right
  const inner = []
  const lineSteps = 48
  for (let index = 0; index <= lineSteps; index += 1) {
    const phi = phiR - (180 * index) / lineSteps
    const dy = line(phi)
    inner.push([hx + ring(dy) * Math.sin((phi + f.turn) * RAD), hy + dy])
  }
  return `${curveThrough(outer)}${curveThrough(inner, false)} Z`
}

/** Sợi tóc (nét mảnh) chạy từ đỉnh xuống chân tóc, ẩn dần khi quay khuất. */
export function capStrands(f, hair, line) {
  const { x: hx, y: hy, r: R } = f.head
  const ring = (dy) => Math.sqrt(Math.max(0, R * R - dy * dy))
  const partPhi = { left: -38, right: 38, center: 0 }[hair.part] ?? null
  const strands = []
  for (const phi of [-74, -52, -30, -8, 14, 36, 58, 80]) {
    const facing = Math.cos((phi + f.turn) * RAD)
    if (facing < 0.12) continue
    // Tóc vuốt lệch: sợi chạy từ ngôi sang bên kia; có ngôi: toả ra từ ngôi; không ngôi: chụm về đỉnh
    let startPhi = phi * 0.3
    if (partPhi != null) startPhi = hair.sweep ? partPhi : partPhi + (phi - partPhi) * 0.2
    const dyStart = -R * 0.88
    const dyEnd = line(phi) - 1.5
    const start = [hx + (ring(dyStart) + hair.top * 0.4) * Math.sin((startPhi + f.turn) * RAD), hy + dyStart - hair.top * 0.75]
    const end = [hx + ring(dyEnd) * Math.sin((phi + f.turn) * RAD), hy + dyEnd]
    const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
    const push = 0.3 + hair.top * 0.02
    const control = [mid[0] + (mid[0] - hx) * push, mid[1] - hair.top * 0.45 - 2]
    strands.push({
      key: phi,
      d: `M ${r1(start[0])} ${r1(start[1])} Q ${r1(control[0])} ${r1(control[1])} ${r1(end[0])} ${r1(end[1])}`,
      opacity: Math.min(1, facing * 1.5),
    })
  }
  return strands
}

/** Đường ngôi tóc (lộ da đầu) — chỉ hiện khi ngôi quay về phía người xem. */
export function partPath(f, hair, line) {
  const phi = { left: -38, right: 38, center: 0 }[hair.part]
  if (phi == null) return null
  const facing = Math.cos((phi + f.turn) * RAD)
  if (facing < 0.15) return null
  const { x: hx, y: hy, r: R } = f.head
  const points = []
  for (let index = 0; index <= 5; index += 1) {
    const t = index / 5
    const dy = line(phi) - 1 + (-R * 0.9 - line(phi) + 1) * t
    const ring = Math.sqrt(Math.max(0, R * R - dy * dy)) + hair.top * 0.45 * t
    points.push([hx + ring * Math.sin((phi + f.turn) * RAD), hy + dy - hair.top * 0.7 * t])
  }
  return { d: curveThrough(points), opacity: Math.min(1, facing * 1.6) }
}

/** Vệt bóng sáng trên mái tóc (ánh sáng chiếu từ trên bên trái). */
export function sheenPath(f, hair) {
  const { x: hx, y: hy, r: R } = f.head
  const points = []
  for (let deg = -64; deg <= -16; deg += 8) {
    const a = deg * RAD
    const rho = R + volumeAt(f, hair, a) - 2.6
    points.push([hx + rho * Math.sin(a), hy - rho * Math.cos(a)])
  }
  return curveThrough(points)
}

// ---------- Tóc dài phía sau ----------
// Tấm tóc rủ sau gáy (z âm): nhìn trước thấy hai bên cổ/vai, nhìn nghiêng thành dải sau đầu, nhìn sau phủ lưng.
export function longHairPath(f, hair) {
  const L = hair.long
  const { x: hx, y: hy, r: R } = f.head
  const k = hair.fluffK
  const centerX = hx - R * 0.5 * f.s
  const thick = 7 + 4 * k + L.wave * 4
  // Bắt đầu ngang tâm đầu, góc trên giấu dưới mũ tóc → mọc ra liền với mũ tóc, không lộ khe
  const top = -4
  const headW = Math.sqrt(R * R - top * top) + hair.side - 3
  const left = []
  const right = []
  const steps = 18
  const amp = L.wave * k * 3.4
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps
    const y = hy + top + (L.length - top) * t
    let w = headW + (L.width * hair.widthK - headW) * (1 - (1 - Math.min(1, t * 1.6)) ** 2)
    if (L.ends === 'layer') w -= t > 0.72 ? 6 : t > 0.45 ? 3 : 0
    if (L.ends === 'c') w -= 4 * t * t
    const half = w * Math.abs(f.c) + thick * Math.abs(f.s)
    const waveIn = Math.min(1, t * 5) // sát chân tóc thì chưa gợn sóng
    left.push([centerX - half - amp * waveIn * Math.sin(t * Math.PI * 4.6 + 0.5), y])
    right.push([centerX + half + amp * waveIn * Math.sin(t * Math.PI * 4.6 + 2.3), y])
  }
  const bottomY = hy + L.length
  const [lx] = left[steps]
  const [rx] = right[steps]
  // Ngọn tóc đi từ mép trái sang mép phải rồi vòng lên theo mép phải
  const bottom = []
  if (L.ends === 'curl') {
    // Đuôi uốn cong ra ngoài
    bottom.push([lx - 4 * k, bottomY - 5], [lx - 2, bottomY + 4], [lx + 6, bottomY + 2])
    for (let index = 1; index < 4; index += 1) bottom.push([lx + ((rx - lx) * index) / 4, bottomY + (index % 2 ? 3 : 0)])
    bottom.push([rx - 6, bottomY + 2], [rx + 2, bottomY + 4], [rx + 4 * k, bottomY - 5])
  } else if (L.ends === 'c') {
    // Đuôi chữ C cụp vào trong
    bottom.push([lx + 2, bottomY + 3], [(lx + rx) / 2 - 6, bottomY + 1], [(lx + rx) / 2 + 6, bottomY + 1], [rx - 2, bottomY + 3])
  } else {
    // Ngọn tóc tỉa: răng cưa nhẹ
    const tips = 6
    for (let index = 0; index <= tips; index += 1) bottom.push([lx + ((rx - lx) * index) / tips, bottomY + (index % 2 ? 4 : 0)])
  }
  // edge: viền không có cạnh trên (cạnh trên nằm dưới mũ tóc nên không kẻ)
  const edge = curveThrough([...left, ...bottom, ...[...right].reverse()])
  return { d: `${edge} Z`, edge }
}

// Vài lọn tóc dọc theo tấm tóc dài (lượn theo sóng)
export function longHairStrands(f, hair) {
  const L = hair.long
  const { x: hx, y: hy, r: R } = f.head
  const centerX = hx - R * 0.5 * f.s
  const amp = L.wave * hair.fluffK * 3.4
  return [-0.55, -0.15, 0.25, 0.6].map((u) => {
    const points = []
    for (let index = 0; index <= 8; index += 1) {
      const t = 0.12 + (index / 8) * 0.8
      const headW = Math.sqrt(R * R - 4) + hair.side
      const w = (headW + (L.width * hair.widthK - headW) * (1 - (1 - Math.min(1, t * 1.6)) ** 2)) * Math.abs(f.c)
      points.push([centerX + u * w + amp * Math.sin(t * Math.PI * 4.6 + 1.4 + u), hy + 2 + (L.length - 2) * t])
    }
    return { key: u, d: curveThrough(points) }
  })
}

// ---------- Đuôi ngựa, tết, búi, buộc lệch vai ----------
// Chiếu một điểm 3D quanh đầu (x phải, y xuống, z về phía người xem) ra màn hình
function project(f, [x, y, z]) {
  return { x: f.head.x + x * f.c + z * f.s, y: f.head.y + y, z: -x * f.s + z * f.c }
}

// Dải tóc thuôn dọc theo đường tâm (đuôi ngựa, tết, buộc lệch)
function ribbon(points, w0, w1, wave = 0) {
  const left = []
  const right = []
  points.forEach((p, index) => {
    const next = points[Math.min(index + 1, points.length - 1)]
    const prev = points[Math.max(index - 1, 0)]
    let dx = next.x - prev.x
    let dy = next.y - prev.y
    const size = Math.hypot(dx, dy) || 1
    dx /= size
    dy /= size
    const t = index / (points.length - 1)
    const w = w0 + (w1 - w0) * t
    const bump = wave * Math.sin(t * Math.PI * 5)
    left.push([p.x - dy * (w + bump), p.y + dx * (w + bump)])
    right.push([p.x + dy * (w - bump), p.y - dx * (w - bump)])
  })
  const tip = points[points.length - 1]
  const edge = `${curveThrough([...left, [tip.x, tip.y + w1 * 0.8]])}${curveThrough([...right].reverse(), false)}`
  return { d: `${edge} Z`, edge, start: { x: points[0].x, y: points[0].y, r: w0 } }
}

/** Các phần tóc buộc/búi: trả về danh sách phần kèm chiều sâu z (âm = sau đầu) để chia lớp trước/sau. */
export function tiePieces(f, hair) {
  const tie = hair.tie
  if (!tie) return []
  const R = f.head.r
  const k = hair.fluffK
  const pieces = []
  if (tie.type === 'ponytail' || tie.type === 'braid') {
    const high = tie.type === 'ponytail'
    const baseY = high ? -13 : -2
    const center = []
    for (let index = 0; index <= 14; index += 1) {
      const t = index / 14
      center.push(project(f, [6 * t * t, baseY + 4 + t * tie.length, -R - 3 - 12 * Math.sin(t * Math.PI * 0.5)]))
    }
    const base = project(f, [0, baseY, -R - 1])
    pieces.push({
      key: 'tail',
      z: base.z,
      sway: true,
      ...ribbon(center, (high ? 7.5 : 6) * k, high ? 3.2 : 3, high ? 0.6 * k : 0),
      braid: high ? null : center,
      band: base,
    })
  }
  if (tie.type === 'top-bun' && !hair.hideTop) {
    const c = project(f, [0, -R - 6, -5])
    pieces.push({ key: 'top-bun', z: 99, bun: { x: c.x, y: c.y, r: 10 * k, messy: true } })
  }
  if (tie.type === 'half-bun') {
    const c = project(f, [0, -R * 0.62, -R - 3])
    pieces.push({ key: 'half-bun', z: c.z, bun: { x: c.x, y: c.y, r: 7.5 * k, messy: false } })
  }
  if (tie.type === 'side-pony') {
    const center = []
    for (let index = 0; index <= 14; index += 1) {
      const t = index / 14
      center.push(project(f, [R * 0.82 + 7 * t, 6 + t * tie.length, R * 0.32 + 10 * Math.sin(t * Math.PI * 0.5)]))
    }
    pieces.push({ key: 'side-pony', z: center[4].z, sway: true, ...ribbon(center, 9 * k, 5, 1.6 * k), band: center[0] })
  }
  return pieces
}
