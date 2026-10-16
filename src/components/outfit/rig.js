// Khung xương 2.5D của ma-nơ-canh người que.
// Tư thế = góc khớp tay (hoặc điểm bàn tay muốn chạm tới) + vị trí bàn chân (chân tự gập gối bằng IK).
// Cả thân xoay quanh trục dọc 0–180° rồi được chiếu vuông góc lên màn hình: quần áo vẽ theo các điểm
// đã chiếu nên khi xoay, cúc áo, túi, cổ áo… trượt quanh thân như vật thể 3D thật.

import { calcBmi } from '../../services/bodyProfile'

export const VIEW = { x: -10, y: -30, w: 260, h: 490 }
export const CX = 120
export const GROUND = 440
export const HEAD_R = 25
export const Y = { head: 78, shoulder: 120, chest: 148, waist: 198, hip: 242 }
export const SEG = { upperArm: 72, foreArm: 64, thigh: 92, shin: 88 }
export const ANKLE_Y = Y.hip + SEG.thigh + SEG.shin
const FOOT_H = GROUND - ANKLE_Y
// Độ dày thân (trước–sau) so với bề ngang: thân là một hình trụ elip
export const DEPTH = 0.6

const RAD = Math.PI / 180
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
export const lerp = (a, b, t) => a + (b - a) * t
export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}
export const r1 = (value) => Math.round(value * 10) / 10

// ---------- Vóc dáng từ hồ sơ ----------
// Nửa bề ngang (đơn vị khung vẽ) ở vai, ngực, eo, hông và khoảng cách khớp háng
const BASE = {
  nam: { shoulder: 33, chest: 29, waist: 25, hip: 26.5, hipJoint: 12 },
  nu: { shoulder: 28.5, chest: 26.5, waist: 20.5, hip: 29.5, hipJoint: 13 },
  khac: { shoulder: 31, chest: 28, waist: 23, hip: 28, hipJoint: 12.5 },
}

/**
 * Chiều cao → tỉ lệ cả người; BMI → độ đầy đặn (vai, ngực, eo, hông, độ dày tay chân).
 * Quần áo lấy các số đo này để may "vừa người" từng vóc dáng.
 */
export function bodyFromProfile(profile) {
  const gender = BASE[profile?.gender] ? profile.gender : 'khac'
  const bmi = profile?.bmi ?? calcBmi(profile?.heightCm, profile?.weightKg) ?? 21.5
  const full = clamp((bmi - 21.5) / 6, -0.6, 1.5)
  const base = BASE[gender]
  return {
    gender,
    full,
    scale: clamp((Number(profile?.heightCm) || 165) / 165, 0.88, 1.08),
    shoulder: base.shoulder + 3 * full,
    chest: base.chest + 6.5 * full,
    waist: base.waist + 10 * full,
    hip: base.hip + 7 * full,
    hipJoint: base.hipJoint + 2.5 * full,
    limb: 1 + 0.22 * full,
  }
}

export const shoulderJoint = (body) => body.shoulder - 4

// Bề ngang (nửa) của thân người ở độ cao y
export function torsoHalf(body, y) {
  const stops = [
    [Y.shoulder - 6, body.shoulder * 0.8],
    [Y.shoulder + 6, body.shoulder * 0.94],
    [Y.chest, body.chest],
    [Y.waist, body.waist],
    [Y.hip, body.hip],
    [Y.hip + 26, body.hip * 0.97],
  ]
  return piecewise(stops, y)
}

// Nội suy mượt giữa các mốc [y, giá trị]
export function piecewise(stops, y) {
  if (y <= stops[0][0]) return stops[0][1]
  for (let index = 1; index < stops.length; index += 1) {
    const [y1, v1] = stops[index]
    if (y <= y1) {
      const [y0, v0] = stops[index - 1]
      return lerp(v0, v1, smoothstep(y0, y1, y))
    }
  }
  return stops[stops.length - 1][1]
}

// ---------- Toán vector 3D (x: phải, y: xuống, z: hướng về người xem) ----------
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const length = (a) => Math.hypot(a[0], a[1], a[2])
const normalize = (a) => {
  const size = length(a)
  return size > 1e-6 ? mul(a, 1 / size) : [0, 0, 0]
}

// Hướng của một đoạn chi: dạng ra ngoài (độ) + đưa ra trước (độ). side = -1 bên trái màn hình, 1 bên phải
function direction(side, abduct, forward) {
  const a = abduct * RAD
  const f = forward * RAD
  return [side * Math.sin(a) * Math.cos(f), Math.cos(a) * Math.cos(f), Math.sin(f)]
}

function anglesOf(side, vector) {
  return [Math.atan2(side * vector[0], vector[1]) / RAD, Math.asin(clamp(vector[2], -1, 1)) / RAD]
}

// IK hai đoạn: khớp giữa (khuỷu/gối) gập về phía pole; điểm cuối bị kéo lại nếu với không tới
function twoBone(root, target, upper, lower, pole) {
  const toTarget = sub(target, root)
  const dist = clamp(length(toTarget), Math.abs(upper - lower) + 0.01, upper + lower - 0.001)
  const dir = normalize(toTarget)
  const along = (upper * upper - lower * lower + dist * dist) / (2 * dist)
  const height = Math.sqrt(Math.max(0, upper * upper - along * along))
  const bend = normalize(sub(pole, mul(dir, dot(pole, dir))))
  return { mid: add(add(root, mul(dir, along)), mul(bend, height)), end: add(root, mul(dir, dist)) }
}

// ---------- Tư thế ----------
// Góc tay: [dạng cánh tay trên, đưa trước, dạng cẳng tay, đưa trước] (độ, dạng > 0 là ra ngoài thân)
// Bàn chân: x (ra ngoài), z (ra trước), y (nhấc lên), yaw (mũi chân xoay ra ngoài)
const STAND = {
  lean: 0,
  head: 0,
  shift: 0,
  drop: 0,
  bob: 0,
  arms: { L: [7, 0, 3, 10], R: [7, 0, 3, 10] },
  feet: { L: [13, 2, 0, 12], R: [13, 2, 0, 12] },
}

// Bàn tay chống hông / đút túi / khoanh tay: điểm cổ tay muốn chạm tới, tính theo số đo cơ thể
const HAND_ON_HIP = (body) => ({ target: [body.waist + 3, Y.waist + 15, 3], pole: [1, -0.1, -0.35] })
const HAND_IN_POCKET = (body) => ({ target: [body.hip - 6, Y.hip + 4, body.hip * DEPTH * 0.85], pole: [1, 0, -0.45] })

const POSE_DEFS = [
  { id: 'dung-thang', label: 'Đứng thẳng', ...STAND },
  {
    id: 'chong-hong',
    label: 'Chống hông',
    arms: { L: HAND_ON_HIP, R: HAND_ON_HIP },
    feet: { L: [19, 2, 0, 16], R: [19, 2, 0, 16] },
  },
  {
    id: 'dut-tui',
    label: 'Đút túi',
    shift: 3,
    lean: -1.5,
    head: 2,
    arms: { L: HAND_IN_POCKET, R: HAND_IN_POCKET },
    feet: { L: [16, 3, 0, 18], R: [10, 0, 0, 10] },
  },
  {
    id: 'khoanh-tay',
    label: 'Khoanh tay',
    head: -2,
    arms: {
      L: (body) => ({ target: [-(body.chest - 9), Y.chest + 30, body.chest * DEPTH + 14], pole: [0.8, 0.5, 0.35] }),
      R: (body) => ({ target: [-(body.chest - 9), Y.chest + 34, body.chest * DEPTH + 19], pole: [0.8, 0.5, 0.35] }),
    },
    feet: { L: [16, 2, 0, 14], R: [16, 2, 0, 14] },
  },
  {
    id: 'tao-dang',
    label: 'Tạo dáng',
    shift: 6,
    lean: -3,
    head: 6,
    arms: { L: [12, 14, 4, 30], R: HAND_ON_HIP },
    feet: { L: [5, 12, 7, 30], R: [15, 0, 0, 10] },
  },
  {
    id: 'cham-mu',
    label: 'Chụp ảnh',
    shift: -4,
    lean: 2,
    head: -7,
    arms: {
      L: HAND_ON_HIP,
      R: () => ({ target: [HEAD_R * 0.95, Y.head - 12, 8], pole: [1, -0.6, 0.1] }),
    },
    feet: { L: [15, 0, 0, 12], R: [8, 9, 5, 26] },
  },
  {
    id: 'vay-tay',
    label: 'Vẫy tay',
    loop: (t) => ({
      ...STAND,
      shift: -2,
      head: 3 + 2 * Math.sin(t * 2.4),
      arms: { L: STAND.arms.L, R: [118, 8, 160 + 22 * Math.sin(t * Math.PI * 2 * 1.6), 6] },
    }),
  },
  {
    id: 'catwalk',
    label: 'Catwalk',
    loop: (t) => {
      const phase = (t / 1.1) * Math.PI * 2
      const sway = Math.sin(phase)
      return {
        lean: -2.5 * sway,
        head: 1.2 * sway,
        shift: 6 * sway,
        drop: 3 + 2.5 * Math.abs(Math.cos(phase)),
        bob: 0,
        arms: { L: [8, -16 * sway, 4, 10 - 16 * sway], R: [8, 16 * sway, 4, 10 + 16 * sway] },
        feet: {
          L: [4, 16 * sway, 9 * Math.max(0, Math.cos(phase)), 8],
          R: [4, -16 * sway, 9 * Math.max(0, -Math.cos(phase)), 8],
        },
      }
    },
  },
]

export const POSES = POSE_DEFS.map(({ id, label, loop }) => ({ id, label, loop: Boolean(loop) }))
const POSE_BY_ID = Object.fromEntries(POSE_DEFS.map((pose) => [pose.id, pose]))

// Đổi điểm cổ tay muốn chạm thành góc khớp cho đúng vóc dáng hiện tại
function armAngles(body, side, spec) {
  // Tay buông: người đầy đặn hơi dang tay ra để không cắt vào thân
  const spread = 5 * Math.max(0, body.full)
  if (Array.isArray(spec)) return [spec[0] + spread, spec[1], spec[2] + spread * 0.8, spec[3]]
  const { target, pole } = spec(body)
  const shoulder = [side * shoulderJoint(body), Y.shoulder, 0]
  const { mid, end } = twoBone(
    shoulder,
    [side * target[0], target[1], target[2]],
    SEG.upperArm,
    SEG.foreArm,
    [side * pole[0], pole[1], pole[2]],
  )
  return [...anglesOf(side, normalize(sub(mid, shoulder))), ...anglesOf(side, normalize(sub(end, mid)))]
}

const flatten = (body, def) => {
  const arms = def.arms ?? STAND.arms
  const feet = def.feet ?? STAND.feet
  const [uaLa, uaLf, faLa, faLf] = armAngles(body, -1, arms.L)
  const [uaRa, uaRf, faRa, faRf] = armAngles(body, 1, arms.R)
  return {
    lean: def.lean ?? 0,
    head: def.head ?? 0,
    shift: def.shift ?? 0,
    drop: def.drop ?? 0,
    bob: def.bob ?? 0,
    uaLa, uaLf, faLa, faLf, uaRa, uaRf, faRa, faRf,
    fLx: feet.L[0], fLz: feet.L[1], fLy: feet.L[2], fLyaw: feet.L[3],
    fRx: feet.R[0], fRz: feet.R[1], fRy: feet.R[2], fRyaw: feet.R[3],
  }
}

/** Tư thế (dạng số phẳng) tại thời điểm t giây — tư thế lặp như vẫy tay, catwalk thay đổi theo t. */
export function poseValues(id, body, t = 0) {
  const def = POSE_BY_ID[id] ?? POSE_BY_ID['dung-thang']
  return flatten(body, def.loop ? def.loop(t) : def)
}

export const isLoopPose = (id) => Boolean(POSE_BY_ID[id]?.loop)

export function blendPose(from, to, t) {
  if (!from) return to
  const out = {}
  for (const key of Object.keys(to)) out[key] = lerp(from[key] ?? to[key], to[key], t)
  return out
}

// ---------- Khung hình: chiếu khung xương xuống màn hình ----------
/**
 * turnDeg: 0 = nhìn thẳng, 90 = quay nghiêng sang phải màn hình, 180 = quay lưng.
 * Trả về các khớp đã chiếu (x, y màn hình; z: càng lớn càng gần người xem) và thông số vẽ thân.
 * Thân trên nghiêng (lean) và đầu nghiêng (tilt) được áp bằng transform của nhóm SVG khi vẽ.
 */
export function computeFrame(body, pose, turnDeg) {
  const turn = turnDeg * RAD
  const c = Math.cos(turn)
  const s = Math.sin(turn)
  const lift = pose.drop + pose.bob
  const project = (p) => ({ x: CX + p[0] * c + p[2] * s, y: p[1], z: -p[0] * s + p[2] * c })
  const sj = shoulderJoint(body)

  const arm = (side, key) => {
    const shoulder = [pose.shift + side * sj, Y.shoulder + lift, 0]
    const elbow = add(shoulder, mul(direction(side, pose[`ua${key}a`], pose[`ua${key}f`]), SEG.upperArm))
    const wrist = add(elbow, mul(direction(side, pose[`fa${key}a`], pose[`fa${key}f`]), SEG.foreArm))
    const joints = { side, shoulder: project(shoulder), elbow: project(elbow), wrist: project(wrist) }
    return { ...joints, depth: (joints.shoulder.z + joints.elbow.z + joints.wrist.z) / 3 }
  }

  const leg = (side, key) => {
    const hip = [pose.shift + side * body.hipJoint, Y.hip + lift, 0]
    const foot = [side * pose[`f${key}x`], ANKLE_Y + pose.bob - pose[`f${key}y`], pose[`f${key}z`]]
    const { mid, end } = twoBone(hip, foot, SEG.thigh, SEG.shin, [side * 0.18, 0, 1])
    const yaw = pose[`f${key}yaw`] * RAD
    const joints = { side, hip: project(hip), knee: project(mid), ankle: project(end) }
    return {
      ...joints,
      depth: (joints.hip.z + joints.knee.z + joints.ankle.z) / 3,
      ground: end[1] + FOOT_H,
      // Hướng mũi chân và bề ngang bàn chân sau khi chiếu (dùng để vẽ giày)
      fx: side * Math.sin(yaw) * c + Math.cos(yaw) * s,
      fz: -side * Math.sin(yaw) * s + Math.cos(yaw) * c,
      lx: Math.cos(yaw) * c - side * Math.sin(yaw) * s,
    }
  }

  const axisX = CX + pose.shift * c
  return {
    turn: turnDeg,
    c,
    s,
    // Thân trụ elip: bề ngang nhìn thấy co lại khi xoay nghiêng
    k: Math.sqrt(c * c + (DEPTH * s) ** 2),
    body,
    lift,
    axisX,
    hipY: Y.hip + lift,
    lean: pose.lean * c,
    tilt: pose.head * c,
    neck: { x: axisX, y: Y.shoulder + lift },
    head: { x: axisX, y: Y.head + lift, r: HEAD_R },
    arms: { L: arm(-1, 'L'), R: arm(1, 'R') },
    legs: { L: leg(-1, 'L'), R: leg(1, 'R') },
  }
}

// Transform nghiêng thân trên quanh hông (dùng cho nhóm thân, tay, đầu)
export const leanTransform = (f) => (Math.abs(f.lean) > 0.01 ? `rotate(${r1(f.lean)} ${r1(f.axisX)} ${r1(f.hipY)})` : undefined)
export const tiltTransform = (f) => (Math.abs(f.tilt) > 0.01 ? `rotate(${r1(f.tilt)} ${r1(f.neck.x)} ${r1(f.neck.y)})` : undefined)

// ---------- Ánh xạ điểm trên thân ----------
// Đường viền (nhìn từ trước) → màn hình: co ngang theo k. flare: phần váy xoè dưới hông gần tròn hơn thân.
export function toScreen(f, x, y, flare = false) {
  let k = f.k
  if (flare && y > Y.hip) {
    const ratio = lerp(DEPTH, 0.9, smoothstep(Y.hip, Y.hip + 90, y))
    k = Math.sqrt(f.c * f.c + (ratio * f.s) ** 2)
  }
  return [f.axisX + x * k, y + f.lift]
}

/**
 * Điểm nằm trên bề mặt thân (mặt trước, hoặc mặt sau khi back = true) → màn hình.
 * w: nửa bề ngang của lớp vải ở độ cao đó. vis > 0: đang quay về phía người xem (1 = chính diện).
 */
export function onSurface(f, xf, y, w, back = false, ratio = DEPTH) {
  const half = Math.max(w, 1)
  const sinP = clamp(xf / half, -1, 1)
  const cosP = Math.sqrt(1 - sinP * sinP)
  const sign = back ? -1 : 1
  const x3 = sign * half * sinP
  const z3 = sign * half * ratio * cosP
  return { x: f.axisX + x3 * f.c + z3 * f.s, y: y + f.lift, vis: (-x3 * f.s + z3 * f.c) / (half * ratio) }
}

// Chuỗi path từ danh sách lệnh [['M', x, y], ['L', x, y], ['Q', ...], ['C', ...], ['Z']] qua một hàm ánh xạ điểm
export function pathFrom(cmds, map) {
  let out = ''
  for (const [op, ...nums] of cmds) {
    out += op
    for (let index = 0; index < nums.length; index += 2) {
      const [x, y] = map(nums[index], nums[index + 1])
      out += ` ${r1(x)} ${r1(y)}`
    }
    out += ' '
  }
  return out.trim()
}

export const outlinePath = (f, cmds, flare = false) => pathFrom(cmds, (x, y) => toScreen(f, x, y, flare))

// Path trên bề mặt thân + độ "quay mặt" trung bình (để ẩn/hiện chi tiết mượt mà)
export function surfacePath(f, cmds, widthAt, back = false, ratio = DEPTH) {
  let vis = 0
  let count = 0
  const d = pathFrom(cmds, (x, y) => {
    const point = onSurface(f, x, y, widthAt(y), back, ratio)
    vis += point.vis
    count += 1
    return [point.x, point.y]
  })
  return { d, vis: count ? vis / count : 0 }
}

/**
 * Đường viền đối xứng: segs là nửa phải (x ≥ 0) đi từ start xuống tới góc gấu áo,
 * bottom đi từ góc phải sang góc trái, top đi từ điểm đầu bên trái về start (ví dụ cổ sau).
 */
export function symmetricOutline(start, segs, bottom, top) {
  const cmds = [['M', start[0], start[1]], ...segs, ...bottom]
  const points = [start, ...segs.map((seg) => seg.slice(-2))]
  for (let index = segs.length - 1; index >= 0; index -= 1) {
    const seg = segs[index]
    const from = points[index]
    if (seg[0] === 'L') cmds.push(['L', -from[0], from[1]])
    else if (seg[0] === 'Q') cmds.push(['Q', -seg[1], seg[2], -from[0], from[1]])
    else cmds.push(['C', -seg[3], seg[4], -seg[1], seg[2], -from[0], from[1]])
  }
  cmds.push(...top, ['Z'])
  return cmds
}

// Đoạn chi a → b: transform đưa hệ toạ độ về dọc trục +y (dùng để vẽ ống tay, ống quần)
export function segmentFrame(a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return {
    transform: `translate(${r1(a.x)} ${r1(a.y)}) rotate(${r1(Math.atan2(-dx, dy) / RAD)})`,
    length: Math.hypot(dx, dy),
  }
}

// Viền của ống vải: hai mép dọc (+ chỏm vai, + mép gấu nếu là đoạn cuối) — không kẻ ngang ở khớp nối
export function tubeEdges(len, w0, w1, { capTop = 0, hem = false, off = 0 } = {}) {
  const top = capTop ? `M ${r1(-w0 + off)} 0 Q ${r1(off)} ${r1(-capTop)} ${r1(w0 + off)} 0 ` : ''
  const sides = `M ${r1(-w0 + off)} 0 L ${r1(-w1)} ${r1(len)} M ${r1(w0 + off)} 0 L ${r1(w1)} ${r1(len)}`
  return `${top}${sides}${hem ? ` M ${r1(-w1)} ${r1(len)} L ${r1(w1)} ${r1(len)}` : ''}`
}

// Ống vải thuôn từ nửa bề ngang w0 (đầu trên) tới w1 (đầu dưới), có thể bo tròn hai đầu
export function tubePath(len, w0, w1, capTop = 0, capBottom = 0) {
  const top = capTop ? ` Q 0 ${r1(-capTop)} ${r1(-w0)} 0` : ''
  const bottom = capBottom ? `Q 0 ${r1(len + capBottom)} ${r1(w1)} ${r1(len)}` : `L ${r1(w1)} ${r1(len)}`
  return `M ${r1(-w0)} 0 L ${r1(-w1)} ${r1(len)} ${bottom} L ${r1(w0)} 0${top} Z`
}
