// Hình dáng các món mặc trên thân, tính theo số đo cơ thể (toạ độ "nhìn từ trước", x tính từ trục giữa).
// Mỗi hàm trả về lệnh path đường viền + hàm bề ngang widthAt(y) để gắn chi tiết lên bề mặt khi xoay.

import { Y, lerp, piecewise, symmetricOutline as symmetric } from './rig'

const ys = Y.shoulder

// Lấy y và x của đỉnh/đáy gấu: nhiều nếp lượn (váy xoè) hoặc cong nhẹ
function hemLine(hw, hemY, waves = 0, depth = 4) {
  if (!waves) return [['Q', 0, hemY + 3, -hw, hemY]]
  const out = []
  for (let index = 1; index <= waves; index += 1) {
    const x0 = hw - ((index - 1) * 2 * hw) / waves
    const x1 = hw - (index * 2 * hw) / waves
    out.push(['Q', (x0 + x1) / 2, hemY + (index % 2 ? depth : -depth * 0.4), x1, hemY])
  }
  return out
}

// ---------- Áo (lớp trong) và áo khoác (layer = 1) ----------
export function topShape(body, shape, layer = 0) {
  const fit = shape.fit ?? 'regular'
  const ease = { slim: 1.5, regular: 3.5, loose: 8 }[fit] + layer * 5 + (shape.extraEase ?? 0)
  const strap = shape.sleeve === 'strap'
  const sleeveless = shape.sleeve === 'none' || shape.sleeveless
  const nw = 10 + (fit === 'loose' ? 1.5 : 0) + layer * 2
  const sh = body.shoulder + (fit === 'loose' ? 4 : 1) + layer * 2.5 - (sleeveless ? 7 : 0)
  const ch = body.chest + ease
  let wa = body.waist + ease + (fit === 'slim' ? 0 : 1.5)
  if (layer && shape.waisted) wa = Math.max(body.waist + ease - 2, ch - 6)
  else if (fit === 'loose' || layer) wa = Math.max(body.waist + ease, ch - 2.5)
  const crop = shape.length === 'crop'
  const hemY = shape.hemY ?? (crop ? Y.waist - 12 : shape.length === 'long' ? Y.hip + 32 : Y.hip + 15)
  const hw =
    shape.hemW ??
    (crop
      ? lerp(ch, wa, (hemY - Y.chest) / (Y.waist - Y.chest))
      : fit === 'loose'
        ? Math.max(ch + 1, body.hip + ease * 0.6)
        : Math.max(wa, body.hip + ease * 0.7))

  const segs = []
  let start
  if (strap) {
    start = [ch - 2, ys + 17]
  } else {
    start = [nw, ys - 8]
    segs.push(['C', nw + 6, ys - 6.5, sh - 7, ys - 3, sh, ys + 1])
    segs.push(['C', sh + 1.5, ys + 9, ch + 1, Y.chest - 18, ch, Y.chest - 6])
  }
  if (crop) {
    segs.push(['C', ch - 0.5, Y.chest + 10, hw, hemY - 14, hw, hemY])
  } else if (hemY > Y.waist + 4) {
    segs.push(['C', ch - 0.5, Y.chest + 18, wa, Y.waist - 18, wa, Y.waist])
    segs.push(['C', wa, Y.waist + 16, hw, hemY - Math.min(20, (hemY - Y.waist) / 2), hw, hemY])
  } else {
    segs.push(['C', ch - 0.5, Y.chest + 18, hw, hemY - 18, hw, hemY])
  }
  const top = strap ? [['Q', 0, ys + 22, start[0], start[1]]] : [['Q', 0, ys - 4.5, start[0], start[1]]]
  const cmds = symmetric(start, segs, hemLine(hw, hemY, shape.waves ?? 0, shape.waveDepth), top)

  const stops = strap ? [[ys + 17, ch - 2], [Y.chest, ch]] : [[ys - 8, nw], [ys + 1, sh * 0.92], [Y.chest - 6, ch]]
  if (!crop && hemY > Y.waist + 4) stops.push([Y.waist, wa])
  stops.push([hemY, hw])
  const widthAt = (y) => piecewise(stops, y)
  return { cmds, widthAt, hemY, nw, sh, ch, wa, hw, strap }
}

// ---------- Cổ áo (mặt trước): inner = phần lòng áo nhìn thấy, trim = viền bo cổ ----------
export function neckline(neck, nw) {
  const back = ['Q', 0, ys - 4.5]
  switch (neck) {
    case 'v':
      return {
        inner: [['M', -nw, ys - 8], ['L', 0, ys + 20], ['L', nw, ys - 8], [...back, -nw, ys - 8], ['Z']],
        trim: [['M', -nw - 0.5, ys - 7], ['L', 0, ys + 22], ['L', nw + 0.5, ys - 7]],
      }
    case 'square':
      return {
        inner: [['M', -nw - 1.5, ys - 7], ['L', -nw - 1.5, ys + 8], ['L', nw + 1.5, ys + 8], ['L', nw + 1.5, ys - 7], [...back, -nw - 1.5, ys - 7], ['Z']],
        trim: [['M', -nw - 1.5, ys - 7], ['L', -nw - 1.5, ys + 8], ['L', nw + 1.5, ys + 8], ['L', nw + 1.5, ys - 7]],
      }
    case 'collar':
    case 'polo':
    case 'cuban': {
      const depth = neck === 'cuban' ? 28 : neck === 'polo' ? 4 : 11
      const spread = neck === 'cuban' ? 1 : -1
      return {
        inner: [['M', -nw - spread, ys - 8], ['L', 0, ys + depth], ['L', nw + spread, ys - 8], [...back, -nw - spread, ys - 8], ['Z']],
        trim: null,
        collar: collarLeaves(neck, nw, depth),
      }
    }
    case 'henley':
    case 'hood':
    case 'round':
    default:
      return {
        inner: [['M', -nw, ys - 8], ['Q', 0, ys + 9, nw, ys - 8], [...back, -nw, ys - 8], ['Z']],
        trim: [['M', -nw - 0.5, ys - 7], ['Q', 0, ys + 11, nw + 0.5, ys - 7]],
      }
  }
}

// Hai lá cổ áo sơ mi / polo / cổ Cuba (nửa trái rồi lật gương)
function collarLeaves(neck, nw, depth) {
  const tipY = neck === 'polo' ? ys + 11 : neck === 'cuban' ? ys + 14 : ys + 15
  const tipX = neck === 'cuban' ? -nw - 8 : -nw + 1
  const left = [
    ['M', -nw - 1.5, ys - 10],
    ['L', -1.5, ys + depth - 2],
    ['L', tipX, tipY],
    ['Q', -nw - (neck === 'cuban' ? 10 : 6), ys + 1, -nw - 1.5, ys - 10],
    ['Z'],
  ]
  return [left, mirrorCmds(left)]
}

export function mirrorCmds(cmds) {
  return cmds.map(([op, ...nums]) => [op, ...nums.map((value, index) => (index % 2 === 0 ? -value : value))])
}

// ---------- Áo khoác ----------
const OUTER_SPECS = {
  blazer: { hem: 20, ease: 0, waisted: true, open: 'lapel', bp: Y.waist - 4 },
  denim: { hem: 2, ease: 2, boxy: true, open: 'straight', collar: true },
  leather: { hem: 0, ease: 0.5, open: 'straight', collar: true },
  bomber: { hem: 4, ease: 4, open: 'zip', rib: true },
  cardigan: { hem: 22, ease: 0, open: 'v', vy: Y.chest + 30 },
  overshirt: { hem: 18, ease: 3, boxy: true, open: 'straight', collar: true },
  trench: { hem: 112, ease: 2, flare: 18, open: 'lapel', bp: Y.chest + 8, closed: true, belt: true },
  coat: { hem: 104, ease: 2, flare: 13, open: 'lapel', bp: Y.chest + 14, closed: true },
  puffer: { hem: 10, ease: 3, open: 'closed', quilt: true },
  utility: { hem: 16, ease: 3, boxy: true, open: 'straight', collar: true },
  vest: { hem: 6, ease: -0.5, open: 'v', vy: Y.waist - 8, sleeveless: true, points: true },
}

export const outerSpec = (style) => OUTER_SPECS[style] ?? OUTER_SPECS.blazer

export function outerShape(body, style) {
  const spec = outerSpec(style)
  const fit = spec.boxy || spec.rib || spec.quilt ? 'loose' : 'regular'
  const ch = body.chest + (fit === 'loose' ? 8 : 3.5) + 5 + spec.ease
  const hemY = Y.hip + spec.hem
  let hw
  if (spec.flare) hw = body.hip + spec.flare
  else if (spec.boxy) hw = ch - 1
  else if (spec.rib) hw = ch - 5
  else hw = Math.max(ch - 3, body.hip + 5)
  const shaped = topShape(
    body,
    {
      fit,
      sleeve: spec.sleeveless ? 'none' : 'long',
      length: 'regular',
      hemY,
      hemW: hw,
      extraEase: spec.ease,
      waisted: spec.waisted,
    },
    1,
  )
  return { ...shaped, spec }
}

// Phần mở phía trước của áo khoác (để lộ áo bên trong) — vẽ bằng mask
export function outerOpening(shape) {
  const { spec, nw, hemY } = shape
  switch (spec.open) {
    case 'lapel':
      return spec.closed
        ? [['M', -nw - 1, ys - 9], ['L', nw + 1, ys - 9], ['L', 0, spec.bp], ['Z']]
        : [
            ['M', -nw - 1, ys - 9],
            ['L', nw + 1, ys - 9],
            ['L', 0.5, spec.bp],
            ['Q', 4, hemY - 10, 14, hemY + 4],
            ['L', -14, hemY + 4],
            ['Q', -4, hemY - 10, -0.5, spec.bp],
            ['Z'],
          ]
    case 'straight':
      return [['M', -nw - 1, ys - 9], ['L', nw + 1, ys - 9], ['L', 5, hemY + 4], ['L', -5, hemY + 4], ['Z']]
    case 'zip':
      return [['M', -nw, ys - 9], ['L', nw, ys - 9], ['L', 3, hemY + 4], ['L', -3, hemY + 4], ['Z']]
    case 'v': {
      const v = [['M', -nw - 1, ys - 9], ['L', nw + 1, ys - 9], ['L', 0, spec.vy], ['Z']]
      return spec.points ? [...v, ['M', -10, hemY + 5], ['L', 0, hemY - 6], ['L', 10, hemY + 5], ['Z']] : v
    }
    default:
      return null
  }
}

// Ve áo (blazer, măng tô, áo dạ): nửa phải, lật gương cho nửa trái
export function lapels(shape) {
  const { nw, spec } = shape
  const notchY = ys + (spec.closed ? 12 : 16)
  const right = [
    ['M', nw + 1, ys - 9],
    ['L', nw + 13, notchY],
    ['L', nw + 8.5, notchY + 4],
    ['L', 1.5, spec.bp - 1],
    ['Z'],
  ]
  return [right, mirrorCmds(right)]
}

// ---------- Đầm ----------
const DRESS_FLARE = { shift: 0.1, bodycon: -0.02, flare: 0.3, flowy: 0.18, 'a-line': 0.2, bias: 0.12 }
const DRESS_HEM = { mini: 50, knee: 94, midi: 130, maxi: 176 }

export function dressShape(body, shape) {
  const fitted = shape.skirt !== 'shift'
  const strap = shape.bodice === 'strap'
  const nw = 10
  const sh = body.shoulder + 0.5 - (shape.bodice === 'none' ? 6 : 0)
  const ch = body.chest + (fitted ? 2.5 : 5)
  const wa = fitted ? body.waist + 2 : Math.max(body.waist + 6, ch - 1)
  const hip = shape.skirt === 'bodycon' ? body.hip + 1.5 : body.hip + (fitted ? 4 : 5)
  const hemY = Y.hip + (DRESS_HEM[shape.length] ?? 94)
  const hw = Math.max(hip - 4, hip + (hemY - Y.hip) * (DRESS_FLARE[shape.skirt] ?? 0.15))

  const segs = []
  let start
  if (strap) {
    start = [ch - 2, ys + 15]
    segs.push(['C', ch - 1, Y.chest + 10, wa, Y.waist - 18, wa, Y.waist])
  } else {
    start = [nw, ys - 8]
    segs.push(['C', nw + 6, ys - 6.5, sh - 7, ys - 3, sh, ys + 1])
    segs.push(['C', sh + 1.5, ys + 9, ch + 1, Y.chest - 18, ch, Y.chest - 6])
    segs.push(['C', ch - 0.5, Y.chest + 18, wa, Y.waist - 18, wa, Y.waist])
  }
  segs.push(['C', wa + 1, Y.waist + 14, hip, Y.hip - 16, hip, Y.hip])
  segs.push(['C', hip + (hw - hip) * 0.25, Y.hip + 24, hw, hemY - 36, hw, hemY])
  const waves = shape.skirt === 'flare' || shape.skirt === 'flowy' ? 6 : 0
  let top
  if (!strap) top = [['Q', 0, ys - 4.5, start[0], start[1]]]
  else if (shape.neck === 'v') top = [['L', 0, ys + 27], ['L', start[0], start[1]]]
  else top = [['Q', 0, ys + 24, start[0], start[1]]]
  const cmds = symmetric(start, segs, hemLine(hw, hemY, waves, 4.5), top)
  const stops = strap
    ? [[ys + 15, ch - 2], [Y.chest, ch], [Y.waist, wa], [Y.hip, hip], [hemY, hw]]
    : [[ys - 8, nw], [ys + 1, sh * 0.92], [Y.chest - 6, ch], [Y.waist, wa], [Y.hip, hip], [hemY, hw]]
  return { cmds, widthAt: (y) => piecewise(stops, y), hemY, nw, ch, wa, hip, hw, strap }
}

// ---------- Chân váy ----------
const SKIRT_FLARE = { 'a-line': 0.28, pencil: -0.035, pleated: 0.22, flowy: 0.2 }
const SKIRT_HEM = { mini: 46, knee: 92, midi: 128, maxi: 172 }

export function skirtShape(body, shape) {
  const top = Y.waist + 2
  const wb = body.waist + 3
  const hip = body.hip + 3
  const hemY = Y.hip + (SKIRT_HEM[shape.length] ?? 92)
  const hw = hip + (hemY - Y.hip) * (SKIRT_FLARE[shape.shape] ?? 0.2)
  const segs = [
    ['C', wb + 1, top + 16, hip, Y.hip - 16, hip, Y.hip],
    ['C', hip + (hw - hip) * 0.3, Y.hip + 20, hw, hemY - 26, hw, hemY],
  ]
  const waves = shape.shape === 'flowy' ? 6 : shape.shape === 'pleated' ? 10 : 0
  const cmds = symmetric([wb, top], segs, hemLine(hw, hemY, waves, shape.shape === 'pleated' ? 1.6 : 4), [['L', wb, top]])
  const stops = [[top, wb], [Y.hip, hip], [hemY, hw]]
  return { cmds, widthAt: (y) => piecewise(stops, y), top, wb, hip, hemY, hw }
}

// ---------- Phần hông của quần (cạp → đáy quần); ống quần vẽ theo chân ----------
export function seatShape(body, item) {
  const { shape } = item
  const high = shape.fit === 'wide' && shape.style === 'trousers'
  const top = high ? Y.waist : Y.waist + 8
  const ease = { slim: 1.5, straight: 2.5, wide: 4, jogger: 3 }[shape.fit] ?? 2.5
  const wb = lerp(body.waist, body.hip, (top - Y.waist) / (Y.hip - Y.waist)) + 2.5
  const hip = body.hip + ease
  const crotch = Y.hip + 22
  const cmds = symmetric(
    [wb, top],
    [['C', wb + 0.5, top + 14, hip, Y.hip - 14, hip, Y.hip], ['L', hip - 0.6, Y.hip + 12]],
    [['Q', hip * 0.5, crotch + 4, 0, crotch - 2], ['Q', -hip * 0.5, crotch + 4, -(hip - 0.6), Y.hip + 12]],
    [['L', wb, top]],
  )
  const stops = [[top, wb], [Y.hip, hip], [crotch, hip - 1]]
  return { cmds, widthAt: (y) => piecewise(stops, y), top, wb, hip, crotch, ease }
}

// ---------- Áo dài: thân áo + tà trước (một mảnh), tà sau vẽ riêng ----------
export function aoDaiShape(body, gender) {
  const nw = 9
  const sh = body.shoulder + 0.5
  const ch = body.chest + 2
  const wa = body.waist + 1.5
  const hemY = gender === 'nam' ? Y.hip + 104 : Y.hip + 150
  const pw = body.hip - 1
  const slitY = Y.waist + 8
  const segs = [
    ['C', nw + 6, ys - 6.5, sh - 7, ys - 3, sh, ys + 1],
    ['C', sh + 1.5, ys + 9, ch + 1, Y.chest - 18, ch, Y.chest - 6],
    ['C', ch - 0.5, Y.chest + 18, wa, Y.waist - 18, wa, Y.waist],
    ['C', wa + 0.6, Y.waist + 4, wa, slitY - 1, wa - 1, slitY + 2],
    ['C', wa - 1.5, slitY + 60, pw - 2, hemY - 60, pw, hemY],
  ]
  const cmds = symmetric([nw, ys - 8], segs, [['Q', 0, hemY + 4, -pw, hemY]], [['Q', 0, ys - 4.5, nw, ys - 8]])
  const panel = symmetric(
    [wa - 1, slitY - 4],
    [['C', wa - 1.5, slitY + 60, pw - 2, hemY - 60, pw, hemY]],
    [['Q', 0, hemY + 4, -pw, hemY]],
    [['L', wa - 1, slitY - 4]],
  )
  const stops = [[ys - 8, nw], [ys + 1, sh * 0.92], [Y.chest - 6, ch], [Y.waist, wa], [hemY, pw]]
  return { cmds, panel, widthAt: (y) => piecewise(stops, y), nw, ch, wa, pw, hemY, slitY }
}
