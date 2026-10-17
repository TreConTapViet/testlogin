import { CLOTHES } from '../clothes/catalog'

// Số "ngẫu nhiên" cố định theo seed: bố cục giống nhau ở mọi lần render
function seeded(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// Tư thế nghỉ, cách trôi lơ lửng và cách bung ra khỏi tủ của từng món (góc tính bằng radian)
function motionFor(index) {
  const s = (offset) => seeded(index + offset)
  return {
    rotate: (s(21) - 0.5) * 0.5,
    tiltX: (s(141) - 0.5) * 0.5,
    tiltY: (s(151) - 0.5) * 0.9,
    depth: 0.4 + s(31) * 0.9,
    drift: {
      x: 10 + s(91) * 18,
      y: 8 + s(101) * 14,
      speedX: (Math.PI * 2) / (10 + s(111) * 8),
      speedY: (Math.PI * 2) / (6 + s(121) * 4),
      phase: s(171) * Math.PI * 2,
      wobble: 0.05 + s(131) * 0.08,
    },
    burst: {
      jitterX: (s(61) - 0.5) * 60,
      jitterY: (s(71) - 0.5) * 120,
      peakZ: 260 + s(181) * 220,
      spinX: (s(191) - 0.5) * Math.PI * 4,
      spinY: (s(201) - 0.5) * Math.PI * 4,
      spinZ: (s(41) - 0.5) * Math.PI * 1.8,
      delay: s(51) * 0.4,
      stiffness: 55 + s(81) * 25,
    },
  }
}

/**
 * Màn chào: count món phủ đều màn hình (kể cả phía sau tủ), mỗi món một loại khác nhau.
 * Lưới vừa đủ ô; thừa ô thì bỏ những ô sát tâm vì chúng khuất hẳn sau tủ.
 * minZ: các món nằm sau lưng tủ (z âm hơn chiều sâu tủ) để không lọt vào lòng tủ khi cửa mở.
 */
export function computeIntroSlots({ width, height, top, count, minZ }) {
  const areaTop = top + 10
  const areaHeight = Math.max(240, height - areaTop - 10)
  const cols = Math.max(2, Math.round(Math.sqrt((count * width) / areaHeight)))
  const rows = Math.ceil(count / cols)
  const cellWidth = width / cols
  const cellHeight = areaHeight / rows
  const base = clamp(Math.min(cellWidth, cellHeight) * 0.58, 64, 150)
  const centerX = width / 2
  const centerY = areaTop + areaHeight / 2

  const cells = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      cells.push({ row, col, x: (col + 0.5) * cellWidth, y: areaTop + (row + 0.5) * cellHeight })
    }
  }
  const distance = (cell) => Math.hypot((cell.x - centerX) / width, (cell.y - centerY) / areaHeight)
  const kept = cells
    .sort((a, b) => distance(b) - distance(a))
    .slice(0, count)
    .sort((a, b) => a.row - b.row || a.col - b.col)

  return kept.map((cell, index) => {
    const item = CLOTHES[index % CLOTHES.length]
    return {
      key: item.id,
      item,
      x: cell.x + (seeded(index + 1) - 0.5) * cellWidth * 0.3,
      y: cell.y + (seeded(index + 11) - 0.5) * cellHeight * 0.3,
      z: minZ - seeded(index + 161) * 110,
      size: Math.round(base * item.size),
      order: index,
      ...motionFor(index),
    }
  })
}

/** Rải thành lưới thưa ở hai bên, chừa khoảng giữa (clearWidth) cho nội dung. count: số món dùng. */
export function computeSideSlots({ width, height, top, clearWidth, count = CLOTHES.length }) {
  const items = CLOTHES.slice(0, count)
  const perSide = Math.ceil(items.length / 2)
  const margin = 24
  const bandWidth = Math.max(120, (width - clearWidth) / 2 - margin)
  const cols = bandWidth >= 330 ? 3 : bandWidth >= 150 ? 2 : 1
  const rows = Math.ceil(perSide / cols)
  const areaTop = top + 12
  const areaHeight = Math.max(240, height - areaTop - 28)
  const cellWidth = bandWidth / cols
  const cellHeight = areaHeight / rows
  const base = Math.min(118, Math.max(52, Math.min(cellWidth, cellHeight) * 0.74))

  return items.map((item, index) => {
    const onLeft = index % 2 === 0
    const k = Math.floor(index / 2)
    const col = k % cols
    const row = Math.floor(k / cols)
    const fromEdge = margin + (col + 0.5) * cellWidth + (seeded(index + 1) - 0.5) * cellWidth * 0.3
    return {
      key: item.id,
      item,
      x: onLeft ? fromEdge : width - fromEdge,
      y: areaTop + (row + 0.5) * cellHeight + (seeded(index + 11) - 0.5) * cellHeight * 0.3,
      z: (seeded(index + 161) - 0.6) * 160,
      size: Math.round(base * item.size),
      order: index,
      ...motionFor(index),
    }
  })
}
