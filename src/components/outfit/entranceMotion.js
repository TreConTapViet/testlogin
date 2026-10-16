// Biên đạo cảnh vào phòng thử đồ: khách (người que) đứng trong cửa hàng, nhìn giá đồ suy nghĩ,
// nảy ra ý tưởng, quay sang phòng thử, bước vào; rèm kéo ra rồi khép lại, khung hình phóng vào phòng thử.
// Dùng chung bộ khớp/nhịp đi với cảnh chào ở trang hồ sơ (welcomeMotion).
import { poseAt, sample } from '../profile/welcomeMotion'

// think: bong bóng ba chấm · idea: bóng đèn ý tưởng · go: quay sang phòng thử · zoom: phóng vào · done: vào phòng
export const ENTRANCE_TIMES = { think: 0.55, idea: 1.75, go: 2.3, zoom: 3.55, done: 4.05 }
// Lần sau vào lại: bỏ bớt đoạn suy nghĩ
export const RETURNING_OFFSET = 1.5

// Tư thế soạn cho nhân vật nhìn sang phải; lúc đầu khách quay sang trái (nhìn giá đồ) nên được lật gương
const CUSTOMER = {
  x: [[0, 300], [2.25, 300], [3.15, 548, 'linear'], [3.45, 562, 'out']],
  dir: [[2.06, -1], [2.24, 1]],
  depth: [[3.1, 1], [3.45, 0.88, 'in']],
  opacity: [[0, 0], [0.2, 1, 'out'], [3.2, 1], [3.45, 0, 'in']],
  walk: [[2.22, 0], [2.32, 1, 'out'], [3.1, 1], [3.3, 0.6]],
  // Tay trước đưa lên cằm, tay sau đỡ khuỷu tay → "trầm ngâm"
  uaA: [[0.25, -6], [0.6, -75, 'out'], [1.78, -75], [1.92, -150, 'out'], [2.05, -150], [2.3, -6]],
  faA: [[0.25, -12], [0.6, -158, 'out'], [1.0, -158], [1.1, -150], [1.2, -158], [1.3, -150], [1.4, -158], [1.78, -158], [1.92, 0, 'out'], [2.3, -12]],
  uaB: [[0.3, 8], [0.62, -20, 'out'], [1.78, -20], [1.95, 30, 'out'], [2.3, 8]],
  faB: [[0.3, -8], [0.62, -95, 'out'], [1.78, -95], [1.95, -20, 'out'], [2.3, -8]],
  // Ngước nhìn kệ túi/mũ rồi cúi nhìn giá đồ, nghiêng đầu suy nghĩ
  head: [[0.3, 0], [0.7, -10], [1.05, -10], [1.3, 6], [1.6, 6], [1.8, -4, 'out'], [2.1, 0]],
  lean: [[0.3, 0], [0.7, -3], [1.3, 2], [1.75, 0], [1.9, -6, 'out'], [2.1, 2], [2.25, 0]],
  // Nảy ra ý tưởng: nhún lấy đà, bật lên rồi tiếp đất (co giãn)
  jump: [[1.78, 0], [1.86, 3, 'out'], [1.98, -16, 'out'], [2.12, 0, 'in']],
  sy: [[1.76, 1], [1.86, 0.9, 'out'], [1.98, 1.08, 'out'], [2.12, 0.93, 'in'], [2.24, 1, 'out']],
  thA: [[1.78, -4], [1.86, -16, 'out'], [1.98, 2, 'out'], [2.12, -10, 'in'], [2.24, -4]],
  shA: [[1.78, 4], [1.86, 28, 'out'], [1.98, 0, 'out'], [2.12, 16, 'in'], [2.24, 4]],
  thB: [[1.78, 5], [1.86, 14, 'out'], [1.98, -5, 'out'], [2.12, 9, 'in'], [2.24, 5]],
  shB: [[1.78, 2], [1.86, 22, 'out'], [1.98, 6, 'out'], [2.12, 12, 'in'], [2.24, 2]],
}

// Rèm phòng thử: 0 = khép, 1 = mở
const CURTAIN = [[2.7, 0], [3.05, 1, 'out'], [3.45, 1], [3.72, 0]]

export function customerFrame(t) {
  return {
    x: sample(CUSTOMER.x, t, 300),
    dir: sample(CUSTOMER.dir, t, -1),
    depth: sample(CUSTOMER.depth, t, 1),
    opacity: sample(CUSTOMER.opacity, t, 1),
    pose: poseAt(CUSTOMER, t, 0.48),
  }
}

export const curtainAt = (t) => sample(CURTAIN, t, 0)

export function entrancePhase(t) {
  if (t >= ENTRANCE_TIMES.zoom) return 'zoom'
  if (t >= ENTRANCE_TIMES.go) return 'go'
  if (t >= ENTRANCE_TIMES.idea) return 'idea'
  if (t >= ENTRANCE_TIMES.think) return 'think'
  return 'start'
}
