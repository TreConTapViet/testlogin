import { motion } from 'framer-motion'
import {
  capPath,
  capStrands,
  fadeTopLine,
  hairline,
  longHairPath,
  longHairStrands,
  partPath,
  sheenPath,
  tiePieces,
} from './hairShapes'
import { r1 } from './rig'
import { SKIN } from './skinTone'

// Tóc "bồng bềnh": phần tóc rủ lay nhẹ quanh mép trên, mái tóc phồng nhẹ như đang thở
const SWAY = { rotate: [0, 1.3, 0, -1.3, 0] }
const SWAY_TIMING = { duration: 5.5, repeat: Infinity, ease: 'easeInOut' }
const BREATHE = { scale: [1, 1.018, 1] }
const BREATHE_TIMING = { duration: 4.2, repeat: Infinity, ease: 'easeInOut' }

function Sway({ still, children }) {
  if (still) return <g>{children}</g>
  return (
    <motion.g style={{ originX: 0.5, originY: 0 }} animate={SWAY} transition={SWAY_TIMING}>
      {children}
    </motion.g>
  )
}

/** Mũ tóc phủ đầu (kèm mái, ngôi, sợi tóc, vệt bóng). still: không chuyển động (icon). */
export function HairCap({ f, hair, still = false }) {
  const { paint } = hair
  const line = hairline(hair)
  const d = capPath(f, hair, line)
  if (hair.shaved) {
    return <path d={d} fill={paint.shaved} stroke={paint.deep} strokeWidth="0.6" strokeOpacity="0.45" />
  }
  const topLine = hair.fade ? fadeTopLine(hair) : line
  const part = partPath(f, hair, topLine)
  const content = (
    <>
      {hair.fade ? (
        <>
          <path d={d} fill={paint.fade} />
          <path d={capPath(f, hair, topLine)} fill={paint.base} stroke={paint.deep} strokeWidth="0.9" strokeLinejoin="round" />
        </>
      ) : (
        <path d={d} fill={paint.base} stroke={paint.deep} strokeWidth="0.9" strokeLinejoin="round" />
      )}
      {capStrands(f, hair, topLine).map((strand) => (
        <path
          key={strand.key}
          d={strand.d}
          fill="none"
          stroke={paint.strand}
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity={0.55 * strand.opacity}
        />
      ))}
      {part && <path d={part.d} fill="none" stroke={SKIN.base} strokeWidth="1.2" strokeLinecap="round" opacity={0.7 * part.opacity} />}
      <path d={sheenPath(f, hair)} fill="none" stroke={paint.sheen} strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
    </>
  )
  if (still) return <g>{content}</g>
  return (
    <motion.g style={{ originX: 0.5, originY: 1 }} animate={BREATHE} transition={BREATHE_TIMING}>
      {content}
    </motion.g>
  )
}

function Bun({ bun, paint }) {
  const { x, y, r } = bun
  return (
    <g>
      <circle cx={r1(x)} cy={r1(y)} r={r1(r)} fill={paint.base} stroke={paint.deep} strokeWidth="0.9" />
      {bun.messy ? (
        <path
          d={`M ${r1(x - r * 0.7)} ${r1(y)} q ${r1(r * 0.4)} ${r1(-r * 0.9)} ${r1(r * 0.95)} ${r1(-r * 0.35)} M ${r1(x - r * 0.2)} ${r1(y + r * 0.55)} q ${r1(r * 0.55)} ${r1(-r * 0.2)} ${r1(r * 0.75)} ${r1(-r * 0.85)} M ${r1(x + r * 0.55)} ${r1(y - r * 0.75)} q ${r1(r * 0.45)} ${r1(-r * 0.4)} ${r1(r * 0.5)} ${r1(-r * 0.05)}`}
          fill="none"
          stroke={paint.strand}
          strokeWidth="1"
          strokeLinecap="round"
        />
      ) : (
        <path d={`M ${r1(x - r * 0.6)} ${r1(y + r * 0.2)} q ${r1(r * 0.6)} ${r1(-r)} ${r1(r * 1.2)} 0`} fill="none" stroke={paint.strand} strokeWidth="0.9" />
      )}
      <circle cx={r1(x - r * 0.3)} cy={r1(y - r * 0.35)} r={r1(r * 0.28)} fill={paint.sheen} opacity="0.35" />
    </g>
  )
}

function Tail({ piece, paint }) {
  return (
    <g>
      {piece.start && <circle cx={r1(piece.start.x)} cy={r1(piece.start.y)} r={r1(piece.start.r)} fill={paint.base} />}
      <path d={piece.d} fill={paint.base} />
      <path d={piece.edge} fill="none" stroke={paint.deep} strokeWidth="0.9" strokeLinejoin="round" />
      {/* Tết: các mắt tết xen kẽ dọc theo đuôi */}
      {piece.braid?.slice(1, -1).map((p, index) => {
        const next = piece.braid[index + 2]
        const angle = (Math.atan2(next.y - p.y, next.x - p.x) * 180) / Math.PI
        return (
          <ellipse
            key={index}
            cx={r1(p.x)}
            cy={r1(p.y)}
            rx="5.2"
            ry="3"
            transform={`rotate(${r1(angle + (index % 2 ? 28 : -28))} ${r1(p.x)} ${r1(p.y)})`}
            fill={paint.base}
            stroke={paint.deep}
            strokeWidth="0.7"
          />
        )
      })}
      {piece.band && <ellipse cx={r1(piece.band.x)} cy={r1(piece.band.y)} rx="3.4" ry="2.4" fill={paint.deep} />}
    </g>
  )
}

/**
 * Tóc dài, đuôi ngựa, tết, búi, buộc lệch vai. layer 'behind': phần nằm sau đầu/thân (vẽ trước thân),
 * 'front': phần quay về phía người xem (vẽ sau mũ tóc). Mỗi phần tự chọn lớp theo góc xoay.
 */
export function HairPieces({ f, hair, layer, still = false }) {
  const front = layer === 'front'
  const { paint } = hair
  const out = []
  if (hair.long && (-f.head.r * 0.5 * f.c >= 0) === front) {
    const sheet = longHairPath(f, hair)
    out.push(
      <Sway key="long" still={still}>
        <path d={sheet.d} fill={paint.base} />
        <path d={sheet.edge} fill="none" stroke={paint.deep} strokeWidth="0.9" strokeLinejoin="round" />
        {longHairStrands(f, hair).map((strand) => (
          <path key={strand.key} d={strand.d} fill="none" stroke={paint.strand} strokeWidth="0.9" strokeLinecap="round" opacity="0.45" />
        ))}
      </Sway>,
    )
  }
  for (const piece of tiePieces(f, hair)) {
    if ((piece.z >= 0) !== front) continue
    if (piece.bun) out.push(<Bun key={piece.key} bun={piece.bun} paint={paint} />)
    else
      out.push(
        <Sway key={piece.key} still={still || !piece.sway}>
          <Tail piece={piece} paint={paint} />
        </Sway>,
      )
  }
  return out
}
