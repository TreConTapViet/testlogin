import { Fabric, Seam } from './Fabric'
import { HairCap, HairPieces } from './Hair'
import { r1, tiltTransform } from './rig'
import { SkinHead } from './Skin'

// Đầu tròn đặc (người que không mặt) + mũ, kính, khuyên tai. Đầu là khối cầu nên xoay chỉ làm
// trượt các chi tiết nằm trên mặt (kính, lưỡi trai) và đổi trước/sau cho khuyên tai.

const RAD = Math.PI / 180

// Điểm trên mặt cầu của đầu: góc ngang phi (0 = chính diện), lệch dọc dy so với tâm
function onHead(f, phi, dy) {
  const { x, y, r } = f.head
  const ring = Math.sqrt(Math.max(0, r * r - dy * dy))
  const a = phi * RAD
  const x3 = ring * Math.sin(a)
  const z3 = ring * Math.cos(a)
  return { x: x + x3 * f.c + z3 * f.s, y: y + dy, z: -x3 * f.s + z3 * f.c, ring }
}

function Hat({ f, item, paint }) {
  const { x, y, r } = f.head
  const type = item.shape.type
  const band = paint.second ?? paint.deep
  const at = (cmds) => cmds.replace(/(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/g, (_, px, __, py) => `${r1(x + Number(px))} ${r1(y + Number(py))}`)
  switch (type) {
    case 'cap': {
      // Lưỡi trai: nửa đĩa nằm ngang phía trước, chiếu theo góc xoay
      const points = [-80, -40, 0, 40, 80].map((deg) => onHead(f, deg, -3))
      const brim = [-80, -40, 0, 40, 80].map((deg) => {
        const reach = r + 15 * Math.cos(deg * RAD)
        const a = deg * RAD
        return x + reach * Math.sin(a) * f.c + reach * Math.cos(a) * f.s
      })
      const xs = [...brim, ...points.map((p) => p.x)]
      const left = Math.min(...xs)
      const right = Math.max(...xs)
      const front = f.c > -0.15
      const brimShape = (
        <ellipse key="brim" cx={r1((left + right) / 2)} cy={r1(y - 3)} rx={r1((right - left) / 2)} ry="4" fill={paint.dark} stroke={paint.line} strokeWidth="0.8" />
      )
      return (
        <g>
          {!front && brimShape}
          <Fabric d={at('M -26,-2 C -27,-36 27,-36 26,-2 Q 0,-6 -26,-2 Z')} paint={paint} />
          <Seam d={at('M 0,-31 L 0,-4 M -14,-27 Q -10,-14 -12,-3 M 14,-27 Q 10,-14 12,-3')} color={paint.dark} opacity={0.5} />
          <circle cx={r1(x)} cy={r1(y - 31)} r="2" fill={paint.dark} />
          {front && brimShape}
        </g>
      )
    }
    case 'bucket':
      return (
        <g>
          <Fabric d={at('M -21,-12 C -22,-36 22,-36 21,-12 Z')} paint={paint} />
          <Fabric d={at('M -22,-14 L 22,-14 L 36,-1 Q 0,6 -36,-1 Z')} paint={paint} />
          <Seam d={at('M -30,-4 Q 0,2 30,-4')} color={paint.dark} opacity={0.5} dash="2 2" />
        </g>
      )
    case 'wide':
      return (
        <g>
          <Fabric d={at('M -19,-15 C -21,-40 21,-40 19,-15 Z')} paint={paint} />
          <path d={at('M -19.5,-18 L 19.5,-18 L 19.8,-13 L -19.8,-13 Z')} fill={band} />
          <Fabric d={at('M -50,-13 Q 0,-23 50,-13 Q 0,-2 -50,-13 Z')} paint={paint} />
        </g>
      )
    case 'beret':
      return (
        <g transform={`rotate(-10 ${r1(x)} ${r1(y)})`}>
          <Fabric d={at('M -27,-15 C -30,-38 30,-40 29,-17 Q 0,-10 -27,-15 Z')} paint={paint} />
          <path d={at('M 1,-36 L 2,-41')} stroke={paint.dark} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      )
    case 'beanie':
      return (
        <g>
          <Fabric d={at('M -26,-4 C -28,-40 28,-40 26,-4 Z')} paint={paint} />
          <Fabric d={at('M -26.5,-13 L 26.5,-13 L 26.5,-2 Q 0,1 -26.5,-2 Z')} paint={paint} />
          <Seam d={at('M -18,-12 L -18,-3 M -9,-12 L -9,-1.5 M 0,-12 L 0,-1 M 9,-12 L 9,-1.5 M 18,-12 L 18,-3')} color={paint.dark} opacity={0.55} />
        </g>
      )
    case 'fedora':
      return (
        <g>
          <Fabric d={at('M -19,-15 C -21,-34 -12,-38 0,-33 C 12,-38 21,-34 19,-15 Z')} paint={paint} />
          <path d={at('M -19.4,-19 L 19.4,-19 L 19.6,-14 L -19.6,-14 Z')} fill={band} />
          <Fabric d={at('M -40,-13 Q 0,-21 40,-13 Q 0,-6 -40,-13 Z')} paint={paint} />
        </g>
      )
    case 'conical':
      return (
        <g>
          <Fabric d={at('M -46,-8 L 0,-54 L 46,-8 Q 0,1 -46,-8 Z')} paint={paint} />
          <Seam d={at('M -34,-19 Q 0,-12 34,-19 M -22,-31 Q 0,-26 22,-31 M -11,-42 Q 0,-39 11,-42')} color={paint.dark} opacity={0.5} />
          <path d={at('M -24,-2 Q -18,30 0,30 Q 18,30 24,-2')} fill="none" stroke={band} strokeWidth="1" opacity="0.7" />
        </g>
      )
    default:
      return null
  }
}

// Kính: hai mắt kính nằm trên mặt trước của đầu, gọng tai hiện khi xoay nghiêng
function Glasses({ f, item, paint }) {
  const type = item.shape.type
  const lenses = [-22, 22].map((deg) => onHead(f, deg, -2))
  if (lenses.every((lens) => lens.z < 0)) return null
  const frame = paint.base
  const lensFill = type === 'sun' ? '#24232b' : '#ffffff'
  const lensOpacity = type === 'sun' ? 0.92 : 0.28
  const shapeAt = (lens) => {
    const sx = Math.max(0.15, Math.cos(Math.asin(Math.min(1, Math.abs(lens.x - f.head.x) / f.head.r))))
    const w = 7.5 * sx
    if (type === 'round') return <ellipse cx={r1(lens.x)} cy={r1(lens.y)} rx={r1(6.2 * sx)} ry="6.2" />
    if (type === 'cateye')
      return <path d={`M ${r1(lens.x - w)} ${r1(lens.y - 3)} Q ${r1(lens.x)} ${r1(lens.y - 6)} ${r1(lens.x + w + 1.5 * sx)} ${r1(lens.y - 6)} Q ${r1(lens.x + w)} ${r1(lens.y + 6)} ${r1(lens.x)} ${r1(lens.y + 5)} Q ${r1(lens.x - w)} ${r1(lens.y + 4)} ${r1(lens.x - w)} ${r1(lens.y - 3)} Z`} />
    return <rect x={r1(lens.x - w)} y={r1(lens.y - 5)} width={r1(w * 2)} height="10" rx="3.5" />
  }
  const ears = [-90, 90].map((deg) => onHead(f, deg, 0))
  return (
    <g>
      {lenses.map((lens, index) =>
        lens.z > -2 && ears[index].z > -6 && Math.abs(f.s) > 0.25 ? (
          <path key={`arm-${index}`} d={`M ${r1(lens.x)} ${r1(lens.y - 2)} L ${r1(ears[index].x)} ${r1(ears[index].y - 1)}`} stroke={frame} strokeWidth="1.6" strokeLinecap="round" />
        ) : null,
      )}
      <g fill={lensFill} fillOpacity={lensOpacity} stroke={frame} strokeWidth="1.8">
        {lenses.map((lens, index) => (lens.z > 0 ? <g key={index}>{shapeAt(lens)}</g> : null))}
      </g>
      {lenses[0].z > 0 && lenses[1].z > 0 && (
        <path
          d={`M ${r1(lenses[0].x + 4)} ${r1(lenses[0].y - 3)} Q ${r1((lenses[0].x + lenses[1].x) / 2)} ${r1(lenses[0].y - 6)} ${r1(lenses[1].x - 4)} ${r1(lenses[1].y - 3)}`}
          fill="none"
          stroke={frame}
          strokeWidth="1.6"
        />
      )}
    </g>
  )
}

function Earring({ point, paint }) {
  return (
    <g>
      <path d={`M ${r1(point.x)} ${r1(point.y)} L ${r1(point.x)} ${r1(point.y + 7)}`} stroke={paint.base} strokeWidth="1.2" />
      <path d={`M ${r1(point.x)} ${r1(point.y + 6)} l -3 5 l 3 5 l 3 -5 Z`} fill={paint.base} stroke={paint.line} strokeWidth="0.5" />
    </g>
  )
}

/** Đầu (màu da) + tóc + phụ kiện trên đầu, nghiêng theo cổ. */
export function HeadFigure({ f, hat, glasses, earrings, hair, uid, ghost = false }) {
  const ears = earrings ? [-90, 90].map((deg) => onHead(f, deg, 6)) : []
  return (
    <g transform={tiltTransform(f)}>
      {ears.map((point, index) => (point.z < 0 ? <Earring key={index} point={point} paint={earrings.paint} /> : null))}
      {!ghost && <SkinHead x={r1(f.head.x)} y={r1(f.head.y)} r={f.head.r} uid={uid} />}
      {hair && <HairCap f={f} hair={hair} />}
      {hair && <HairPieces f={f} hair={hair} layer="front" />}
      {ears.map((point, index) => (point.z >= 0 ? <Earring key={index} point={point} paint={earrings.paint} /> : null))}
      {glasses && <Glasses f={f} item={glasses.item} paint={glasses.paint} />}
      {hat && <Hat f={f} item={hat.item} paint={hat.paint} />}
    </g>
  )
}
