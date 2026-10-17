// Áo đồng phục Đại học Sài Gòn (SGU) vẽ trên canvas 1024x1024 để làm vân cho tấm áo bay như lá cờ.
// Polo thân trắng, vai + tay raglan xanh dương, cổ và bo tay xanh đậm viền trắng,
// logo tròn xanh nhạt ở ngực trái, các vệt sóng xanh vắt ngang thân dưới (lấy từ hình sóng của logo).
// Logo vẽ lại theo mẫu; có file thật thì đặt vào public/sgu-logo.png (hoặc .svg) để dùng thay.

export const SHIRT_TEXTURE_SIZE = 1024
const LOGO_SOURCES = ['/sgu-logo.png', '/sgu-logo.svg']

const WHITE = '#fbfcfe'
const BLUE = '#2a59b8'
const BLUE_LIGHT = '#3f72cf'
const NAVY = '#1b3c80'
const LOGO_INK = '#174b7b'

// Nửa trái của áo (x < 512); nửa phải lấy đối xứng
const NECK = [432, 112]
const SHOULDER = [322, 150]
const SLEEVE_TOP = [118, 352]
const SLEEVE_BOTTOM = [214, 462]
const ARMPIT = [302, 392]
const HEM = [292, 952]

const mirror = ([x, y]) => [1024 - x, y]

function seeded(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

let logoPromise = null

/** Tải logo SGU nếu có trong thư mục public; không có thì trả về null (dùng logo vẽ lại). */
export function loadSguLogo() {
  if (!logoPromise) {
    logoPromise = (async () => {
      for (const src of LOGO_SOURCES) {
        const image = await loadImage(src)
        if (image) return image
      }
      return null
    })()
  }
  return logoPromise
}

// ---------- Logo ----------
// Chữ chạy theo cung tròn: phía trên đọc theo chiều kim đồng hồ, phía dưới ngược lại để chữ không bị lộn ngược
function arcText(context, text, cx, cy, radius, top, spacing = 1.08) {
  const chars = [...text]
  const widths = chars.map((char) => context.measureText(char).width * spacing)
  const span = widths.reduce((sum, width) => sum + width, 0) / radius
  const direction = top ? 1 : -1
  let angle = (top ? -Math.PI / 2 : Math.PI / 2) - (direction * span) / 2
  chars.forEach((char, index) => {
    const half = widths[index] / 2 / radius
    angle += direction * half
    context.save()
    context.translate(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle))
    context.rotate(top ? angle + Math.PI / 2 : angle - Math.PI / 2)
    context.fillText(char, 0, 0)
    context.restore()
    angle += direction * half
  })
}

/** Logo SGU vẽ lại: vòng tròn xanh nhạt, "ĐẠI HỌC SÀI GÒN", chữ SGU lớn, sóng trắng, "SAIGON UNIVERSITY". */
export function drawSguLogo(context, cx, cy, r) {
  context.save()
  const disc = new Path2D()
  disc.arc(cx, cy, r, 0, Math.PI * 2)
  const fill = context.createLinearGradient(cx, cy - r, cx, cy + r)
  fill.addColorStop(0, '#a8daf6')
  fill.addColorStop(0.55, '#7cc3ec')
  fill.addColorStop(1, '#5aaee0')
  context.fillStyle = fill
  context.fill(disc)

  // Sóng trắng: từ mép dưới bên trái vút sang phải, nằm dưới chữ SGU
  context.save()
  context.clip(disc)
  context.strokeStyle = '#ffffff'
  context.lineCap = 'round'
  for (const [offset, width] of [
    [0, 0.07],
    [0.11, 0.055],
    [0.2, 0.04],
    [0.28, 0.028],
  ]) {
    context.lineWidth = r * width
    context.beginPath()
    context.moveTo(cx - r * 1.05, cy + r * (0.62 + offset))
    context.bezierCurveTo(cx - r * 0.55, cy + r * (0.28 + offset * 0.8), cx + r * 0.1, cy + r * (0.24 + offset * 0.6), cx + r * 1.05, cy + r * (0.3 + offset * 0.5))
    context.stroke()
  }
  // Vệt bóng nhẹ phía trên
  context.fillStyle = 'rgba(255,255,255,0.22)'
  context.beginPath()
  context.ellipse(cx - r * 0.15, cy - r * 0.55, r * 0.7, r * 0.3, -0.2, 0, Math.PI * 2)
  context.fill()
  context.restore()

  context.lineWidth = r * 0.045
  context.strokeStyle = '#3c8fc7'
  context.stroke(disc)

  context.fillStyle = LOGO_INK
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = `900 ${r * 0.62}px "Arial Black", "Be Vietnam Pro", system-ui, sans-serif`
  context.fillText('SGU', cx, cy - r * 0.02, r * 1.5)
  context.font = `800 ${r * 0.165}px "Be Vietnam Pro", Arial, sans-serif`
  arcText(context, 'ĐẠI HỌC SÀI GÒN', cx, cy, r * 0.73, true)
  context.font = `800 ${r * 0.15}px "Be Vietnam Pro", Arial, sans-serif`
  arcText(context, 'SAIGON UNIVERSITY', cx, cy, r * 0.76, false)
  context.restore()
}

// ---------- Áo ----------
function silhouette() {
  const path = new Path2D()
  path.moveTo(...NECK)
  path.quadraticCurveTo(372, 124, ...SHOULDER)
  path.lineTo(...SLEEVE_TOP)
  path.lineTo(...SLEEVE_BOTTOM)
  path.lineTo(...ARMPIT)
  path.quadraticCurveTo(310, 680, ...HEM)
  path.quadraticCurveTo(512, 982, ...mirror(HEM))
  path.quadraticCurveTo(714, 680, ...mirror(ARMPIT))
  path.lineTo(...mirror(SLEEVE_BOTTOM))
  path.lineTo(...mirror(SLEEVE_TOP))
  path.lineTo(...mirror(SHOULDER))
  path.quadraticCurveTo(652, 124, ...mirror(NECK))
  path.quadraticCurveTo(512, 168, ...NECK)
  path.closePath()
  return path
}

// Mảng raglan: từ cổ chéo xuống nách, phủ vai và cả tay áo
function raglan(side) {
  const point = side === 'left' ? (p) => p : mirror
  const path = new Path2D()
  path.moveTo(...point(NECK))
  path.quadraticCurveTo(...point([372, 124]), ...point(SHOULDER))
  path.lineTo(...point(SLEEVE_TOP))
  path.lineTo(...point(SLEEVE_BOTTOM))
  path.lineTo(...point(ARMPIT))
  path.quadraticCurveTo(...point([350, 230]), ...point([452, 138]))
  path.closePath()
  return path
}

// Bo tay: dải xanh đậm chạy dọc mép tay áo, có một sọc trắng ở giữa
function drawCuff(context, side) {
  const point = side === 'left' ? (p) => p : mirror
  const [ax, ay] = point(SLEEVE_TOP)
  const [bx, by] = point(SLEEVE_BOTTOM)
  const length = Math.hypot(bx - ax, by - ay)
  const flip = side === 'left' ? 1 : -1
  // Pháp tuyến hướng vào trong (về phía vai)
  const nx = (flip * (by - ay)) / length
  const ny = (flip * -(bx - ax)) / length
  const band = 34
  context.fillStyle = NAVY
  context.beginPath()
  context.moveTo(ax, ay)
  context.lineTo(bx, by)
  context.lineTo(bx + nx * band, by + ny * band)
  context.lineTo(ax + nx * band, ay + ny * band)
  context.closePath()
  context.fill()
  context.strokeStyle = WHITE
  context.lineWidth = 5
  context.beginPath()
  context.moveTo(ax + nx * band * 0.5, ay + ny * band * 0.5)
  context.lineTo(bx + nx * band * 0.5, by + ny * band * 0.5)
  context.stroke()
}

function drawCollar(context) {
  // Nẹp áo trắng viền xanh + cúc
  context.fillStyle = '#f3f6fb'
  context.strokeStyle = BLUE
  context.lineWidth = 4
  context.beginPath()
  context.roundRect(494, 160, 36, 186, 4)
  context.fill()
  context.stroke()
  for (const y of [222, 292]) {
    context.beginPath()
    context.arc(512, y, 7, 0, Math.PI * 2)
    context.fillStyle = '#ffffff'
    context.fill()
    context.strokeStyle = 'rgba(27,60,128,0.5)'
    context.lineWidth = 2
    context.stroke()
  }

  // Bản cổ sau
  context.fillStyle = NAVY
  context.beginPath()
  context.moveTo(424, 112)
  context.quadraticCurveTo(512, 92, 600, 112)
  context.lineTo(606, 128)
  context.quadraticCurveTo(512, 112, 418, 128)
  context.closePath()
  context.fill()

  // Hai vạt cổ polo bẻ xuống, viền hai sọc trắng
  for (const side of ['left', 'right']) {
    const point = side === 'left' ? (p) => p : mirror
    context.fillStyle = NAVY
    context.beginPath()
    context.moveTo(...point([420, 116]))
    context.lineTo(...point([506, 170]))
    context.lineTo(...point([470, 242]))
    context.quadraticCurveTo(...point([420, 200]), ...point([394, 158]))
    context.closePath()
    context.fill()
    context.strokeStyle = WHITE
    for (const [inset, width] of [
      [0, 5],
      [11, 3],
    ]) {
      context.lineWidth = width
      context.beginPath()
      context.moveTo(...point([406 + inset * 0.6, 160 - inset * 0.3]))
      context.quadraticCurveTo(...point([430 + inset * 0.7, 204 - inset * 0.6]), ...point([470 + inset * 0.2, 228 - inset * 0.9]))
      context.stroke()
    }
  }
}

// Sóng xanh vắt ngang thân dưới: từ hông trái vút lên sườn phải, đậm dần ra nhạt (giống sóng trong logo)
function drawWaves(context) {
  const waves = [
    { offset: 0, width: 30, color: BLUE },
    { offset: 42, width: 22, color: BLUE_LIGHT },
    { offset: 76, width: 15, color: '#6f9be2' },
    { offset: 102, width: 9, color: '#a8c4ef' },
  ]
  context.lineCap = 'round'
  for (const { offset, width, color } of waves) {
    context.strokeStyle = color
    context.lineWidth = width
    context.beginPath()
    context.moveTo(270, 820 + offset * 0.5)
    context.bezierCurveTo(420, 720 + offset, 560, 600 + offset * 0.85, 760, 560 + offset * 0.7)
    context.stroke()
  }
}

/** Vẽ áo SGU lên canvas (nền trong suốt ngoài dáng áo). logo: ảnh logo thật nếu có, không thì vẽ lại. */
export function drawSguShirt(logo) {
  const canvas = document.createElement('canvas')
  canvas.width = SHIRT_TEXTURE_SIZE
  canvas.height = SHIRT_TEXTURE_SIZE
  const context = canvas.getContext('2d')
  const body = silhouette()

  context.save()
  context.clip(body)

  // Thân trắng, hai bên hông hơi tối cho có khối
  const shade = context.createLinearGradient(280, 0, 744, 0)
  shade.addColorStop(0, '#e3e8f0')
  shade.addColorStop(0.28, WHITE)
  shade.addColorStop(0.72, WHITE)
  shade.addColorStop(1, '#e1e6ef')
  context.fillStyle = shade
  context.fill(body)

  drawWaves(context)

  const sleeve = context.createLinearGradient(0, 120, 0, 470)
  sleeve.addColorStop(0, BLUE_LIGHT)
  sleeve.addColorStop(1, BLUE)
  context.fillStyle = sleeve
  context.fill(raglan('left'))
  context.fill(raglan('right'))
  drawCuff(context, 'left')
  drawCuff(context, 'right')

  // Nếp vải mềm
  context.strokeStyle = 'rgba(30,50,90,0.06)'
  context.lineCap = 'round'
  for (const [x1, y1, x2, y2, width] of [
    [360, 470, 390, 900, 26],
    [650, 480, 630, 910, 22],
    [470, 720, 520, 940, 18],
  ]) {
    context.lineWidth = width
    context.beginPath()
    context.moveTo(x1, y1)
    context.quadraticCurveTo((x1 + x2) / 2 + 20, (y1 + y2) / 2, x2, y2)
    context.stroke()
  }

  // Đường may raglan + gấu áo
  context.setLineDash([7, 6])
  context.lineWidth = 2
  context.strokeStyle = 'rgba(27,60,128,0.35)'
  context.beginPath()
  context.moveTo(...ARMPIT)
  context.quadraticCurveTo(350, 230, 452, 138)
  context.moveTo(...mirror(ARMPIT))
  context.quadraticCurveTo(674, 230, 572, 138)
  context.moveTo(300, 930)
  context.quadraticCurveTo(512, 958, 724, 930)
  context.stroke()
  context.setLineDash([])

  // Vải cá sấu (piqué): chấm li ti
  for (let i = 0; i < 9000; i += 1) {
    context.fillStyle = seeded(i) > 0.5 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.06)'
    context.fillRect(seeded(i + 0.5) * 1024, seeded(i + 0.25) * 1024, 2, 2)
  }
  context.restore()

  drawCollar(context)

  // Logo ở ngực trái người mặc (bên phải khi nhìn)
  const logoX = 628
  const logoY = 300
  const logoR = 58
  if (logo) {
    const scale = Math.min((logoR * 2) / logo.width, (logoR * 2) / logo.height)
    context.drawImage(logo, logoX - (logo.width * scale) / 2, logoY - (logo.height * scale) / 2, logo.width * scale, logo.height * scale)
  } else {
    drawSguLogo(context, logoX, logoY, logoR)
  }

  context.lineWidth = 3
  context.strokeStyle = 'rgba(27,60,128,0.22)'
  context.stroke(body)
  return canvas
}
