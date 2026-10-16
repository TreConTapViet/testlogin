import { Fabric, Seam, Surface } from './Fabric'
import { DEPTH, Y, onSurface, outlinePath, r1, shoulderJoint, surfacePath } from './rig'

// Phụ kiện trên thân: dây chuyền, cà vạt/nơ, khăn, túi đeo vai, túi đeo chéo, ba lô.
// widthAt: bề ngang lớp áo đang nằm dưới phụ kiện (để phụ kiện bám theo bề mặt khi xoay).
const ys = Y.shoulder

function SurfaceFabric({ f, cmds, widthAt, paint, back = false }) {
  const { d, vis } = surfacePath(f, cmds, widthAt, back)
  return (
    <Surface vis={vis}>
      <Fabric d={d} paint={paint} />
    </Surface>
  )
}

export function NecklaceWear({ f, item, paint, widthAt }) {
  const a = [-11, ys - 8]
  const c = [0, ys + 34]
  const b = [11, ys - 8]
  const at = (t) => [
    (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
    (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
  ]
  if (item.shape.type === 'pearl') {
    const beads = []
    for (let t = 0.06; t <= 0.95; t += 0.073) {
      const [x, y] = at(t)
      const p = onSurface(f, x, y, widthAt(y))
      if (p.vis > 0.05) beads.push(<circle key={t} cx={r1(p.x)} cy={r1(p.y)} r="1.9" fill={paint.base} stroke={paint.line} strokeWidth="0.4" opacity={Math.min(1, p.vis * 3)} />)
    }
    return <g>{beads}</g>
  }
  const chain = surfacePath(f, [['M', ...a], ['Q', ...c, ...b]], widthAt)
  const [px, py] = at(0.5)
  const pendant = onSurface(f, px, py + 2.5, widthAt(py))
  return (
    <Surface vis={chain.vis}>
      <path d={chain.d} fill="none" stroke={paint.base} strokeWidth="1.2" />
      {pendant.vis > 0.05 && <circle cx={r1(pendant.x)} cy={r1(pendant.y)} r="2.6" fill={paint.base} stroke={paint.line} strokeWidth="0.5" />}
    </Surface>
  )
}

export function TieWear({ f, item, paint, widthAt }) {
  if (item.shape.type === 'bowtie') {
    return (
      <g>
        <SurfaceFabric f={f} cmds={[['M', 0, ys - 3], ['L', -10, ys - 8.5], ['L', -10, ys + 3.5], ['Z']]} widthAt={widthAt} paint={paint} />
        <SurfaceFabric f={f} cmds={[['M', 0, ys - 3], ['L', 10, ys - 8.5], ['L', 10, ys + 3.5], ['Z']]} widthAt={widthAt} paint={paint} />
        <SurfaceFabric f={f} cmds={[['M', -2.6, ys - 6], ['L', 2.6, ys - 6], ['L', 2.6, ys], ['L', -2.6, ys], ['Z']]} widthAt={widthAt} paint={paint} />
      </g>
    )
  }
  return (
    <g>
      <SurfaceFabric
        f={f}
        cmds={[['M', -3, ys + 1], ['L', 3, ys + 1], ['L', 6.5, Y.waist - 6], ['L', 0, Y.waist + 2], ['L', -6.5, Y.waist - 6], ['Z']]}
        widthAt={widthAt}
        paint={paint}
      />
      <SurfaceFabric f={f} cmds={[['M', -4.5, ys - 8], ['L', 4.5, ys - 8], ['L', 3, ys + 1.5], ['L', -3, ys + 1.5], ['Z']]} widthAt={widthAt} paint={paint} />
    </g>
  )
}

export function ScarfWear({ f, item, paint, widthAt }) {
  if (item.shape.type === 'neckerchief') {
    return (
      <g>
        <SurfaceFabric f={f} cmds={[['M', -11, ys - 7], ['L', 11, ys - 7], ['L', 0, ys + 12], ['Z']]} widthAt={widthAt} paint={paint} />
        <SurfaceFabric f={f} cmds={[['M', 5, ys - 5], ['L', 13, ys + 6], ['L', 9.5, ys + 8], ['Z']]} widthAt={widthAt} paint={paint} />
        <SurfaceFabric f={f} cmds={[['M', 2, ys - 7], ['L', 8, ys - 7], ['L', 8, ys - 1], ['L', 2, ys - 1], ['Z']]} widthAt={widthAt} paint={paint} />
      </g>
    )
  }
  // Khăn quàng: vòng quanh cổ + hai vạt thả trước ngực (tua rua ở đầu khăn)
  const ring = outlinePath(f, [['M', -22, ys - 13], ['Q', 0, ys + 15, 22, ys - 13], ['L', 13, ys - 16], ['Q', 0, ys - 1, -13, ys - 16], ['Z']])
  const fringe = (x0, x1, y) =>
    surfacePath(f, [0, 1, 2, 3, 4].flatMap((index) => {
      const x = x0 + ((x1 - x0) * index) / 4
      return [['M', x, y], ['L', x, y + 5]]
    }), widthAt)
  const fringeA = fringe(-16, -7, ys + 71)
  const fringeB = fringe(-8, 0, ys + 63)
  return (
    <g>
      <SurfaceFabric f={f} cmds={[['M', -20, ys - 12], ['Q', 0, ys - 2, 20, ys - 12], ['L', 20, ys - 5], ['Q', 0, ys + 6, -20, ys - 5], ['Z']]} widthAt={widthAt} paint={paint} back />
      <SurfaceFabric f={f} cmds={[['M', -13, ys - 2], ['L', -4, ys + 2], ['L', -6, ys + 71], ['L', -17, ys + 70], ['Z']]} widthAt={widthAt} paint={paint} />
      <SurfaceFabric f={f} cmds={[['M', -6, ys + 1], ['L', 3, ys + 3], ['L', 0.5, ys + 63], ['L', -8.5, ys + 63], ['Z']]} widthAt={widthAt} paint={paint} />
      <Surface vis={fringeA.vis}>
        <Seam d={fringeA.d} color={paint.base} width={1.4} opacity={1} />
        <Seam d={fringeB.d} color={paint.base} width={1.4} opacity={1} />
      </Surface>
      <Fabric d={ring} paint={paint} />
    </g>
  )
}

/** Túi tote đeo vai trái màn hình (vai phải của người mặc), quai vắt qua vai. */
export function ToteBag({ f, paint }) {
  const { body } = f
  const x3 = -(body.hip + 9)
  const z3 = 3
  const cx = f.axisX + x3 * f.c + z3 * f.s
  const top = Y.hip - 20 + f.lift
  const squash = Math.sqrt(f.c * f.c + (0.3 * f.s) ** 2)
  const sx = -shoulderJoint(body)
  const shoulder = { x: f.axisX + sx * f.c, y: ys - 3 + f.lift }
  return (
    <g>
      <path
        d={`M ${r1(cx - 9 * squash)} ${r1(top + 1)} L ${r1(shoulder.x - 3)} ${r1(shoulder.y)} M ${r1(cx + 9 * squash)} ${r1(top + 1)} L ${r1(shoulder.x + 3)} ${r1(shoulder.y)}`}
        stroke={paint.dark}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <g transform={`translate(${r1(cx)} ${r1(top)}) scale(${r1(squash * 100) / 100} 1)`}>
        <path d="M -17 0 L 17 0 L 19 50 L -19 50 Z" fill={paint.fill} stroke={paint.line} strokeWidth="0.9" strokeLinejoin="round" />
        <path d="M -17 0 L 17 0 L 19 50 L -19 50 Z" fill={paint.shadeH} />
        <path d="M -17 5 L 17 5" stroke={paint.dark} strokeWidth="0.8" opacity="0.6" />
      </g>
    </g>
  )
}

/** Túi đeo chéo: dây từ vai phải màn hình chéo xuống hông trái, túi nhỏ ở hông. */
export function CrossbodyBag({ f, paint, widthAt }) {
  const hipW = widthAt(Y.hip - 12)
  const front = surfacePath(f, [['M', 14, ys - 7], ['C', 8, ys + 30, -10, Y.waist - 10, -(hipW - 4), Y.hip - 12]], widthAt)
  const back = surfacePath(f, [['M', -14, ys - 7], ['C', -8, ys + 30, 10, Y.waist - 10, hipW - 4, Y.hip - 12]], widthAt, true)
  const bag = onSurface(f, -(hipW - 3), Y.hip - 4, hipW + 3)
  const squash = Math.max(0.3, Math.min(1, bag.vis + 0.35))
  return (
    <g>
      {[front, back].map((strap, index) => (
        <Surface key={index} vis={strap.vis}>
          <path d={strap.d} fill="none" stroke={paint.line} strokeWidth="3.6" strokeLinecap="round" />
          <path d={strap.d} fill="none" stroke={paint.dark} strokeWidth="2.4" strokeLinecap="round" />
        </Surface>
      ))}
      {bag.vis > -0.2 && (
        <g transform={`translate(${r1(bag.x)} ${r1(bag.y)}) scale(${r1(squash * 100) / 100} 1)`}>
          <rect x="-12" y="-9" width="24" height="18" rx="3" fill={paint.fill} stroke={paint.line} strokeWidth="0.9" />
          <rect x="-12" y="-9" width="24" height="18" rx="3" fill={paint.shadeH} />
          <path d="M -12 -3 Q 0 3 12 -3" fill="none" stroke={paint.line} strokeWidth="0.8" />
          <circle cx="0" cy="1" r="1.5" fill="#d8b25e" />
        </g>
      )}
    </g>
  )
}

// Ba lô: quai trước ngực (theo bề mặt), thân ba lô là khối hộp sau lưng
export function BackpackStraps({ f, paint, widthAt, chest }) {
  return [-1, 1].map((side) => {
    const strap = surfacePath(f, [['M', side * 11, ys - 8], ['C', side * 16, ys + 8, side * (chest - 8), Y.chest + 6, side * (chest - 4), Y.chest + 22]], widthAt)
    return (
      <Surface key={side} vis={strap.vis}>
        <path d={strap.d} fill="none" stroke={paint.line} strokeWidth="5.2" strokeLinecap="round" />
        <path d={strap.d} fill="none" stroke={paint.dark} strokeWidth="4" strokeLinecap="round" />
      </Surface>
    )
  })
}

export function BackpackPack({ f, paint }) {
  const pw = f.body.chest - 6
  const near = -(f.body.chest * DEPTH)
  const far = near - 14
  const xs = [-pw, pw].flatMap((x) => [near, far].map((z) => f.axisX + x * f.c + z * f.s))
  const left = Math.min(...xs)
  const right = Math.max(...xs)
  const top = ys + 2 + f.lift
  const bottom = Y.waist + 22 + f.lift
  const faceX = f.axisX + far * f.s
  const pocket = Math.abs(f.c) * (pw - 6)
  return (
    <g>
      <rect x={r1(left)} y={r1(top)} width={r1(right - left)} height={r1(bottom - top)} rx="9" fill={paint.fill} stroke={paint.line} strokeWidth="0.9" />
      <rect x={r1(left)} y={r1(top)} width={r1(right - left)} height={r1(bottom - top)} rx="9" fill={paint.shadeH} />
      {f.c < -0.2 && (
        <g>
          <rect x={r1(faceX - pocket)} y={r1(top + 38)} width={r1(pocket * 2)} height="26" rx="5" fill={paint.dark} stroke={paint.line} strokeWidth="0.8" />
          <path d={`M ${r1(faceX - pocket + 3)} ${r1(top + 44)} L ${r1(faceX + pocket - 3)} ${r1(top + 44)}`} stroke={paint.light} strokeWidth="0.8" />
        </g>
      )}
    </g>
  )
}
