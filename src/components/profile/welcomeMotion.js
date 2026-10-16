// Biên đạo cảnh chào đón: hai người que không mặt, chuyển động kiểu hoạt hình "Animator vs Animation"
// (lấy đà → vượt đà → co giãn, khớp tay chân nối nhau mượt mà).
// Thời gian tính bằng giây. Góc tính bằng độ theo quy ước SVG (dương = xoay theo chiều kim đồng hồ).
// Tư thế được soạn cho nhân vật nhìn sang phải; nhân viên được lật gương để nhìn sang trái.

const EASES = {
  linear: (p) => p,
  inOut: (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2),
  out: (p) => 1 - (1 - p) ** 3,
  in: (p) => p ** 3,
  // Vượt quá đích một chút rồi quay về (cánh cửa bật mở)
  back: (p) => {
    const c = 1.70158
    return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2
  },
}

// Giá trị của một rãnh keyframe [[giây, giá trị, kiểu chuyển?], ...] tại thời điểm t
export function sample(track, t, fallback) {
  if (!track) return fallback
  if (t <= track[0][0]) return track[0][1]
  for (let index = 1; index < track.length; index += 1) {
    const [end, to, ease = 'inOut'] = track[index]
    if (t <= end) {
      const [start, from] = track[index - 1]
      const progress = end === start ? 1 : (t - start) / (end - start)
      return from + (to - from) * EASES[ease](progress)
    }
  }
  return track[track.length - 1][1]
}

// Tư thế đứng nghỉ. A = tay/chân phía trước, B = phía sau.
// ua/fa: cánh tay trên/dưới; th/sh: đùi/cẳng chân; jump: nhún/nhảy (âm = lên trên); sy: co giãn dọc.
const REST = { lean: 0, head: 0, uaA: -6, faA: -12, uaB: 8, faB: -8, thA: -4, shA: 4, thB: 5, shB: 2, jump: 0, sy: 1 }
const JOINTS = Object.keys(REST)

// Một nhịp đi bộ: chân và tay đánh ngược nhau, gối gập khi chân vung lên, thân nhún và hơi đổ về trước
function walkCycle(phase) {
  const s = Math.sin(phase)
  const c = Math.cos(phase)
  return {
    thA: -26 * s,
    shA: 36 * Math.max(0, c),
    thB: 26 * s,
    shB: 36 * Math.max(0, -c),
    uaA: 26 * s,
    faA: -16 * Math.max(0, -s),
    uaB: -26 * s,
    faB: -16 * Math.max(0, s),
    lean: 7,
    head: -2 * Math.sin(2 * phase),
    jump: (-4 * (1 + Math.cos(2 * phase))) / 2,
  }
}

export function poseAt(tracks, t, walkPeriod) {
  const walk = sample(tracks.walk, t, 0)
  const cycle = walk > 0 ? walkCycle((2 * Math.PI * t) / walkPeriod) : null
  const pose = {}
  for (const joint of JOINTS) {
    pose[joint] = sample(tracks[joint], t, REST[joint]) + (cycle ? walk * (cycle[joint] ?? 0) : 0)
  }
  // Thở nhẹ khi đứng yên để nhân vật luôn có sức sống
  pose.sy += (1 - walk) * 0.012 * Math.sin((2 * Math.PI * t) / 1.5)
  // Co giãn giữ thể tích: dẹt xuống thì bè ra, vươn lên thì thon lại
  pose.sx = 1 + (1 - pose.sy) * 0.8
  return pose
}

// ---------- Dòng thời gian ----------
// open: cửa mở · typing: bong bóng ba chấm · smile: mặt cười + lời chào · zoom: phóng vào cửa · done: vào hồ sơ
export const STAGE_TIMES = { open: 0.62, typing: 1.18, smile: 1.6, zoom: 3.0, done: 3.45 }
// Lần quay lại: bỏ qua đoạn đi bộ đầu
export const RETURNING_OFFSET = 0.55
// Chỗ hai bàn tay chạm nhau (toạ độ sân khấu 760x520)
export const HIGH_FIVE_POINT = { x: 351, y: 316 }

// Khách: đi tới → phanh → nhún lấy đà, bật lên đập tay → bước vào cửa
const VISITOR = {
  x: [[0, 108], [0.7, 208, 'linear'], [1.02, 248, 'out'], [1.56, 248], [1.76, 278, 'out'], [2.12, 278], [2.32, 270], [2.62, 270], [2.8, 282, 'in'], [3.3, 344, 'linear']],
  depth: [[2.62, 1], [3.3, 0.86, 'in']],
  opacity: [[0, 0], [0.18, 1, 'out'], [3.12, 1], [3.34, 0, 'in']],
  walk: [[0, 1], [0.86, 1], [1.04, 0, 'out'], [2.62, 0], [2.76, 1, 'out']],
  jump: [[1.56, 0], [1.66, 4, 'out'], [1.78, -18, 'out'], [1.94, 0, 'in']],
  sy: [[0.92, 1], [1.04, 0.92, 'out'], [1.22, 1.03, 'out'], [1.36, 1], [1.56, 1], [1.66, 0.88, 'out'], [1.78, 1.08, 'out'], [1.94, 0.93, 'in'], [2.08, 1, 'out']],
  lean: [[0.9, 0], [1.06, -9, 'out'], [1.3, 0], [1.6, 0], [1.76, 10, 'out'], [1.98, 8], [2.16, -5, 'out'], [2.36, 0]],
  head: [[1.6, 0], [1.76, -8, 'out'], [2.1, 0]],
  uaA: [[1.56, -6], [1.76, -150, 'out'], [1.98, -150], [2.28, -6]],
  faA: [[1.56, -12], [1.76, 0, 'out'], [2.0, 0], [2.28, -12]],
  uaB: [[1.6, 8], [1.78, 46, 'out'], [2.0, 30], [2.3, 8]],
  faB: [[1.6, -8], [1.78, -30, 'out'], [2.3, -8]],
  thA: [[1.56, -4], [1.66, -18, 'out'], [1.78, 2, 'out'], [1.94, -10, 'in'], [2.1, -4, 'out']],
  shA: [[1.56, 4], [1.66, 34, 'out'], [1.78, 0, 'out'], [1.94, 18, 'in'], [2.1, 4, 'out']],
  thB: [[1.56, 5], [1.66, 16, 'out'], [1.78, -6, 'out'], [1.94, 10, 'in'], [2.1, 5, 'out']],
  shB: [[1.56, 2], [1.66, 26, 'out'], [1.78, 8, 'out'], [1.94, 14, 'in'], [2.1, 2, 'out']],
}

// Nhân viên: mở cửa → nhảy ra bậc cửa → đập tay → nép sang bên, cúi chào, đưa tay mời vào
const STAFF = {
  x: [[1.06, 30], [1.32, 0, 'out'], [2.32, 0], [2.6, 20]],
  opacity: [[0.66, 0], [0.86, 1, 'out']],
  walk: [[2.3, 0], [2.36, 0.7, 'out'], [2.54, 0.7], [2.62, 0, 'out']],
  jump: [[1.04, 0], [1.12, 3, 'out'], [1.22, -12, 'out'], [1.34, 0, 'in']],
  sy: [[1.02, 1], [1.12, 0.88, 'out'], [1.22, 1.09, 'out'], [1.34, 0.92, 'in'], [1.48, 1, 'out']],
  lean: [[1.54, 0], [1.72, 9, 'out'], [1.98, 9], [2.16, -5, 'out'], [2.36, 0], [2.62, 0], [2.82, 18, 'out'], [3.05, 16], [3.3, 4]],
  head: [[2.62, 0], [2.82, 10, 'out'], [3.1, 2]],
  uaA: [[1.5, -6], [1.72, -122, 'out'], [1.98, -122], [2.2, -60], [2.62, -60], [2.82, -88, 'out'], [3.02, -40]],
  faA: [[1.5, -12], [1.72, 0, 'out'], [1.98, 0], [2.2, -20], [2.82, -10], [3.02, -30]],
  uaB: [[1.56, 8], [1.74, 30, 'out'], [2.2, 8]],
  faB: [[1.56, -8], [1.74, -24, 'out'], [2.2, -8]],
  thA: [[1.04, -4], [1.12, -16, 'out'], [1.22, 2, 'out'], [1.34, -8, 'in'], [1.48, -4]],
  shA: [[1.04, 4], [1.12, 30, 'out'], [1.22, 0, 'out'], [1.34, 14, 'in'], [1.48, 4]],
  thB: [[1.04, 5], [1.12, 14, 'out'], [1.22, -4, 'out'], [1.34, 8, 'in'], [1.48, 5]],
  shB: [[1.04, 2], [1.12, 24, 'out'], [1.22, 6, 'out'], [1.34, 12, 'in'], [1.48, 2]],
}

const DOOR_ANGLE = [[0.62, 0], [0.98, 82, 'back']]
const BURST = {
  opacity: [[1.72, 0], [1.75, 1, 'out'], [2.02, 0, 'in']],
  scale: [[1.72, 0.4], [2.02, 1.3, 'out']],
}

export function visitorFrame(t) {
  return {
    x: sample(VISITOR.x, t, 0),
    depth: sample(VISITOR.depth, t, 1),
    opacity: sample(VISITOR.opacity, t, 1),
    pose: poseAt(VISITOR, t, 0.5),
  }
}

export function staffFrame(t) {
  return {
    x: sample(STAFF.x, t, 30),
    opacity: sample(STAFF.opacity, t, 0),
    pose: poseAt(STAFF, t, 0.4),
  }
}

export const doorAngleAt = (t) => sample(DOOR_ANGLE, t, 0)

export function burstAt(t) {
  return { opacity: sample(BURST.opacity, t, 0), scale: sample(BURST.scale, t, 0.4) }
}

export function phaseAt(t) {
  if (t >= STAGE_TIMES.zoom) return 'zoom'
  if (t >= STAGE_TIMES.smile) return 'smile'
  if (t >= STAGE_TIMES.typing) return 'typing'
  if (t >= STAGE_TIMES.open) return 'open'
  return 'approach'
}
