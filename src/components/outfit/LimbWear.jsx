import { Fabric, Joint, Seam } from './Fabric'
import { BARE_SHOES, SHAFT_SHOES } from './paint'
import { Y, lerp, r1, segmentFrame, tubeEdges, tubePath } from './rig'
import { Shoe } from './Shoes'
import { SkinLimb } from './Skin'
import { seatShape } from './torsoShapes'

const pt = (p) => `${r1(p.x)} ${r1(p.y)}`

// Phần vải nách nối tay áo với thân áo: khi dang tay, tay áo không bị "rời" khỏi thân
function Armhole({ f, arm, ch, w, paint }) {
  if (Math.abs(f.c) < 0.35 || !ch) return null
  const s = arm.shoulder
  const e = arm.elbow
  let nx = -(e.y - s.y)
  let ny = e.x - s.x
  const size = Math.hypot(nx, ny) || 1
  nx /= size
  ny /= size
  const towardBody = f.axisX - s.x
  if (nx * towardBody < 0) {
    nx = -nx
    ny = -ny
  }
  const qx = s.x + (e.x - s.x) * 0.38
  const qy = s.y + (e.y - s.y) * 0.38
  const sideSign = Math.sign(s.x - f.axisX) || arm.side
  const pit = { x: f.axisX + sideSign * ch * f.k, y: Y.chest - 6 + f.lift }
  const d = `M ${pt(s)} L ${r1(qx + nx * w)} ${r1(qy + ny * w)} L ${pt(pit)} Z`
  return <Fabric d={d} paint={paint} outline={false} />
}

// Một lớp tay áo trên cánh tay (đoạn trên + đoạn dưới đã đưa về trục dọc)
function Sleeve({ f, arm, upper, lower, layer, paint, limb, ch }) {
  const extra = (layer.loose ? 2.5 : 0) + (layer.outer ? 2.5 : 0)
  const top = (11 + extra + (layer.puff ? 4 : 0)) * limb
  const elbowW = (9.2 + extra) * limb
  const cuffW = (7.2 + extra * 0.7) * limb
  const long = layer.kind === 'long'
  const upperLen = layer.kind === 'short' ? upper.length * 0.45 : layer.kind === 'elbow' ? upper.length * 0.85 : upper.length
  const hemW = long ? elbowW : lerp(top, elbowW, upperLen / Math.max(upper.length, 1)) + (layer.kind === 'short' ? 1.2 : 0.6)
  const lowerLen = Math.max(lower.length - 1, 1)
  return (
    <g>
      <Armhole f={f} arm={arm} ch={ch} w={lerp(top, elbowW, 0.38) - 0.5} paint={paint} />
      {long && (
        <g transform={upper.transform}>
          <Joint cy={r1(upper.length)} r={r1(elbowW - 0.3)} paint={paint} />
        </g>
      )}
      {long && (
        <g transform={lower.transform}>
          <Fabric d={tubePath(lowerLen, elbowW, cuffW)} edge={tubeEdges(lowerLen, elbowW, cuffW, { hem: true })} paint={paint} />
          <Seam
            d={`M ${r1(-cuffW + 0.4)} ${r1(lower.length - 8)} L ${r1(cuffW - 0.4)} ${r1(lower.length - 8)}`}
            color={paint.dark}
            width={layer.outer ? 0.9 : 1.2}
            opacity={0.6}
          />
        </g>
      )}
      <g transform={upper.transform}>
        <Fabric d={tubePath(upperLen, top, hemW, 7)} edge={tubeEdges(upperLen, top, hemW, { capTop: 7, hem: !long })} paint={paint} />
        {layer.puff && (
          <Seam d={`M ${r1(-top * 0.5)} -3 L ${r1(-top * 0.4)} 5 M 0 -5 L 0 4 M ${r1(top * 0.5)} -3 L ${r1(top * 0.4)} 5`} color={paint.dark} opacity={0.6} />
        )}
        {!long && <Seam d={`M ${r1(-hemW + 0.5)} ${r1(upperLen - 2.5)} L ${r1(hemW - 0.5)} ${r1(upperLen - 2.5)}`} color={paint.dark} opacity={0.5} />}
      </g>
    </g>
  )
}

// Đồng hồ / vòng tay quanh cổ tay (theo hướng cẳng tay)
function WristBand({ lower, paint, kind, half }) {
  if (kind === 'watch') {
    const y = lower.length - 7
    return (
      <g transform={lower.transform}>
        <rect x={r1(-half)} y={r1(y - 3.2)} width={r1(half * 2)} height="6.4" rx="1.6" fill={paint.base} stroke={paint.line} strokeWidth="0.7" />
        <circle cx="0" cy={r1(y)} r="4.4" fill={paint.second ?? '#f6f3ee'} stroke={paint.base} strokeWidth="1.8" />
        <path d={`M 0 ${r1(y)} L 0 ${r1(y - 2.6)} M 0 ${r1(y)} L 1.8 ${r1(y + 0.8)}`} stroke={paint.line} strokeWidth="0.7" strokeLinecap="round" />
      </g>
    )
  }
  const y = lower.length - 4.5
  return (
    <g transform={lower.transform}>
      <rect x={r1(-half)} y={r1(y - 1.7)} width={r1(half * 2)} height="3.4" rx="1.7" fill={paint.base} stroke={paint.line} strokeWidth="0.6" />
      <path d={`M ${r1(-half + 1.5)} ${r1(y - 0.6)} L ${r1(half - 1.5)} ${r1(y - 0.6)}`} stroke="#fff" strokeOpacity="0.55" strokeWidth="0.8" />
    </g>
  )
}

// Túi cầm tay / ví clutch treo ở cổ tay, luôn rủ thẳng xuống theo trọng lực
function HeldBag({ f, arm, item, paint }) {
  const squash = Math.sqrt(f.c * f.c + (0.35 * f.s) ** 2)
  const { x, y } = arm.wrist
  if (item.shape.type === 'clutch') {
    return (
      <g transform={`translate(${r1(x)} ${r1(y + 4)}) scale(${r1(squash * 100) / 100} 1)`}>
        <rect x="-15" y="-6" width="30" height="13" rx="2.5" fill={paint.fill} stroke={paint.line} strokeWidth="0.9" />
        <rect x="-15" y="-6" width="30" height="13" rx="2.5" fill={paint.shadeH} />
        <path d="M-15 -5 L0 2 L15 -5" fill="none" stroke={paint.line} strokeWidth="0.9" />
        <circle cx="0" cy="2" r="1.6" fill="#d8b25e" />
      </g>
    )
  }
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) scale(${r1(squash * 100) / 100} 1)`}>
      <path d="M -8 7 Q -8 -5 0 -5 Q 8 -5 8 7" fill="none" stroke={paint.deep} strokeWidth="2.4" />
      <path d="M -13 6 L 13 6 L 16 29 Q 16 32 13 32 L -13 32 Q -16 32 -16 29 Z" fill={paint.fill} stroke={paint.line} strokeWidth="0.9" />
      <path d="M -13 6 L 13 6 L 16 29 Q 16 32 13 32 L -13 32 Q -16 32 -16 29 Z" fill={paint.shadeH} />
      <path d="M -13 6 L 13 6 L 13.8 15 Q 0 19 -13.8 15 Z" fill={paint.dark} stroke={paint.line} strokeWidth="0.7" />
      <circle cx="0" cy="16.5" r="1.8" fill="#d8b25e" />
    </g>
  )
}

/** Cánh tay người que + các lớp tay áo + đồng hồ, vòng tay, túi cầm tay. */
export function ArmFigure({ f, arm, sleeves, watch, bracelet, held, ghost = false }) {
  const upper = segmentFrame(arm.shoulder, arm.elbow)
  const lower = segmentFrame(arm.elbow, arm.wrist)
  const { limb } = f.body
  const longest = sleeves.filter(({ layer }) => layer.kind === 'long').at(-1)
  const bandHalf = longest ? (7.2 + (longest.layer.outer ? 3.5 : longest.layer.loose ? 1.8 : 0)) * limb + 0.8 : 5.8 * limb
  return (
    <g>
      {!ghost && <SkinLimb d={`M ${pt(arm.shoulder)} L ${pt(arm.elbow)} L ${pt(arm.wrist)}`} width={10} />}
      {sleeves.map(({ layer, paint, ch }) => (
        <Sleeve key={layer.slot} f={f} arm={arm} upper={upper} lower={lower} layer={layer} paint={paint} limb={limb} ch={ch} />
      ))}
      {bracelet && <WristBand lower={lower} paint={bracelet} kind="bracelet" half={bandHalf} />}
      {watch && <WristBand lower={lower} paint={watch} kind="watch" half={bandHalf} />}
      {held && <HeldBag f={f} arm={arm} item={held.item} paint={held.paint} />}
    </g>
  )
}

// Ống đùi: mép ngoài theo hông quần, mép trong chạm đường giữa (hai ống không chồng lên nhau)
const thighPath = (len, w0, w1, off) =>
  `M ${r1(-w0 + off)} -4 L ${r1(-w1)} ${r1(len)} L ${r1(w1)} ${r1(len)} L ${r1(w0 + off)} -4 Z`
const thighEdges = (len, w0, w1, off, hem = false) =>
  `M ${r1(-w0 + off)} -4 L ${r1(-w1)} ${r1(len)} M ${r1(w0 + off)} -4 L ${r1(w1)} ${r1(len)}` +
  (hem ? ` M ${r1(-w1)} ${r1(len)} L ${r1(w1)} ${r1(len)}` : '')

// Ống quần: đùi + cẳng chân, phom theo kiểu quần và vóc dáng
function PantLeg({ f, leg, thigh, shin, item, paint }) {
  const { shape } = item
  const { limb } = f.body
  const seat = seatShape(f.body, item)
  const topW = seat.hip / 2 + 1
  const kneeW = ({ slim: 9.5, straight: 11.5, wide: 15.5, jogger: 10.5 }[shape.fit] ?? 11.5) * limb
  const hemW = ({ slim: 8, straight: 11, wide: 19, jogger: 7.5 }[shape.fit] ?? 11) * limb
  const outer = leg.side * (f.c >= 0 ? 1 : -1)
  const off = outer * (seat.hip / 2 - f.body.hipJoint) * Math.abs(f.c)
  const crease = shape.style === 'trousers' || shape.style === 'chino'

  if (shape.length === 'short') {
    const len = thigh.length * 0.55
    const w1 = lerp(topW, kneeW, 0.55) + 2
    return (
      <g transform={thigh.transform}>
        <Fabric d={thighPath(len, topW, w1, off)} edge={thighEdges(len, topW, w1, off, true)} paint={paint} />
        <Seam d={`M ${r1(-w1 + 0.5)} ${r1(len - 3)} L ${r1(w1 - 0.5)} ${r1(len - 3)}`} color={paint.dark} opacity={0.55} />
      </g>
    )
  }

  const shinLen = shape.length === 'cropped' ? shin.length * 0.72 : shin.length + (shape.fit === 'jogger' ? 2 : 7)
  const pocketW = lerp(topW, kneeW, 0.6)
  return (
    <g>
      <g transform={thigh.transform}>
        <Joint cy={r1(thigh.length)} r={r1(kneeW - 0.3)} paint={paint} />
      </g>
      <g transform={shin.transform}>
        <Fabric d={tubePath(shinLen, kneeW, hemW)} edge={tubeEdges(shinLen, kneeW, hemW, { hem: true })} paint={paint} />
        {crease && <Seam d={`M 0 2 L 0 ${r1(shinLen - 2)}`} color={paint.dark} opacity={0.35} />}
        {shape.fit === 'jogger' ? (
          <rect x={r1(-hemW)} y={r1(shinLen - 6)} width={r1(hemW * 2)} height="6" rx="2" fill={paint.dark} opacity="0.4" />
        ) : (
          <Seam d={`M ${r1(-hemW + 0.5)} ${r1(shinLen - 3)} L ${r1(hemW - 0.5)} ${r1(shinLen - 3)}`} color={paint.dark} opacity={0.45} />
        )}
      </g>
      <g transform={thigh.transform}>
        <Fabric d={thighPath(thigh.length, topW, kneeW, off)} edge={thighEdges(thigh.length, topW, kneeW, off)} paint={paint} />
        {crease && <Seam d={`M 0 8 L 0 ${r1(thigh.length + 4)}`} color={paint.dark} opacity={0.35} />}
        {shape.style === 'cargo' && (
          <Seam
            d={`M ${r1(outer * (pocketW - 11))} ${r1(thigh.length * 0.42)} L ${r1(outer * (pocketW - 1.5))} ${r1(thigh.length * 0.42)} L ${r1(outer * (pocketW - 1.5))} ${r1(thigh.length * 0.74)} L ${r1(outer * (pocketW - 11))} ${r1(thigh.length * 0.74)} Z M ${r1(outer * (pocketW - 11))} ${r1(thigh.length * 0.5)} L ${r1(outer * (pocketW - 1.5))} ${r1(thigh.length * 0.5)}`}
            color={paint.line}
            opacity={0.7}
          />
        )}
      </g>
    </g>
  )
}

// Ống bốt cao cổ bọc ngoài cẳng chân
function BootShaft({ shin, paint, limb }) {
  const from = shin.length * 0.22
  return (
    <g transform={shin.transform}>
      <g transform={`translate(0 ${r1(from)})`}>
        <Fabric d={tubePath(shin.length - from + 3, 10.2 * limb, 8.6 * limb)} paint={paint} />
        <Seam d={`M ${r1(-10 * limb)} 3 L ${r1(10 * limb)} 3`} color={paint.dark} opacity={0.5} />
      </g>
    </g>
  )
}

/** Chân người que + giày + ống quần (bốt cao cổ thì ống bốt bọc ngoài quần). */
export function LegFigure({ f, leg, pants, shoe, ghost = false }) {
  const thigh = segmentFrame(leg.hip, leg.knee)
  const shin = segmentFrame(leg.knee, leg.ankle)
  const type = shoe?.item.shape.type
  const bare = !shoe || BARE_SHOES.has(type)
  const shaft = Boolean(shoe) && SHAFT_SHOES.has(type)
  return (
    <g>
      {!ghost && <SkinLimb d={`M ${pt(leg.hip)} L ${pt(leg.knee)} L ${pt(leg.ankle)}`} width={10.5} />}
      {bare && !ghost && <SkinLimb d={`M ${pt(leg.ankle)} L ${r1(leg.ankle.x + 12 * leg.fx)} ${r1(leg.ground - 2)}`} width={7} />}
      {shoe && !shaft && <Shoe leg={leg} item={shoe.item} paint={shoe.paint} />}
      {pants && <PantLeg f={f} leg={leg} thigh={thigh} shin={shin} item={pants.item} paint={pants.paint} />}
      {shaft && (
        <>
          <Shoe leg={leg} item={shoe.item} paint={shoe.paint} />
          <BootShaft shin={shin} paint={shoe.paint} limb={f.body.limb} />
        </>
      )}
    </g>
  )
}
