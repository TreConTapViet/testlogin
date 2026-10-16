import { animate, useMotionValue } from 'framer-motion'
import { memo, useEffect, useId, useState } from 'react'
import MannequinFigure from './MannequinFigure'
import { bodyFromProfile, computeFrame, poseValues } from './rig'

// Icon món đồ vẽ bằng chính bộ vẽ ma-nơ-canh ở chế độ "ma-nơ-canh vô hình" (giống ảnh sản phẩm),
// cắt khung quanh vị trí của món đó. Rê chuột: món đồ xoay nhẹ trong không gian 3D.
const ICON_BODY = bodyFromProfile({ gender: 'khac', heightCm: 165, bmi: 21.5 })
const ICON_POSE = { ...poseValues('dung-thang', ICON_BODY, 0), uaLa: 12, uaRa: 12, faLa: 8, faRa: 8 }

// Khung cắt [x, y, rộng, cao] trong hệ toạ độ ma-nơ-canh; góc xoay gốc và biên độ khi rê chuột
function viewFor(item) {
  const { slot, kind, shape } = item
  switch (slot) {
    case 'top':
      return { box: [42, 84, 156, shape.length === 'crop' ? 125 : 190], turn: 0 }
    case 'outer':
      return shape.style === 'trench' || shape.style === 'coat'
        ? { box: [10, 82, 220, 290], turn: 0 }
        : { box: [36, 84, 168, 190], turn: 0 }
    case 'dress':
      return kind === 'aodai' ? { box: [10, 80, 220, 360], turn: 0 } : { box: [10, 86, 220, 340], turn: 0 }
    case 'bottom': {
      if (kind === 'skirt') {
        const tall = { mini: 104, knee: 150, midi: 186, maxi: 230 }[shape.length] ?? 186
        return { box: [120 - tall * 0.52, 192, tall * 1.04, tall], turn: 0 }
      }
      return shape.length === 'short' ? { box: [52, 194, 136, 112], turn: 0 } : { box: [44, 192, 152, 260], turn: 0 }
    }
    case 'shoes':
      if (shape.type === 'tallboot') return { box: [84, 336, 86, 108], turn: 90, swing: -28 }
      if (shape.type === 'chelsea') return { box: [100, 388, 58, 58], turn: 90, swing: -28 }
      return { box: [102, 398, 50, 50], turn: 90, swing: -28 }
    case 'bag':
      if (shape.type === 'backpack') return { box: [56, 104, 128, 140], turn: 180 }
      if (shape.type === 'tote') return { box: [44, 104, 74, 172], turn: 0 }
      if (shape.type === 'crossbody') return { box: [60, 100, 110, 160], turn: 0 }
      return { box: [44, 236, 70, 70], turn: 0 }
    case 'hat':
      return { box: [62, 16, 116, 82], turn: 0 }
    case 'glasses':
      return { box: [92, 60, 56, 36], turn: 0, swing: 30 }
    case 'earrings':
      return { box: [84, 66, 72, 56], turn: 0 }
    case 'watch':
      return { box: [139, 226, 42, 42], turn: 0 }
    case 'bracelet':
      return { box: [59, 230, 42, 42], turn: 0 }
    case 'necklace':
      return { box: [88, 104, 64, 56], turn: 0 }
    case 'scarf':
      return { box: [80, 92, 80, 112], turn: 0 }
    case 'belt':
      return { box: [76, 192, 88, 36], turn: 0 }
    case 'neckwear':
      return shape.type === 'bowtie' ? { box: [96, 104, 48, 34], turn: 0 } : { box: [92, 104, 56, 116], turn: 0 }
    default:
      return { box: [0, 0, 240, 440], turn: 0 }
  }
}

/** Icon động của một món đồ. piece: { itemId, color, color2, pattern } (màu đang chọn hoặc màu gốc). */
function ItemIconBase({ item, piece, active = false, className }) {
  const uid = `ic${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const view = viewFor(item)
  const turn = useMotionValue(view.turn)
  const [angle, setAngle] = useState(view.turn)

  useEffect(() => turn.on('change', (value) => setAngle(value)), [turn])

  // Đang rê chuột: xoay qua lại một nhịp để thấy khối 3D; rời chuột thì quay về góc gốc
  useEffect(() => {
    if (!active) {
      const back = animate(turn, view.turn, { duration: 0.35, ease: 'easeOut' })
      return () => back.stop()
    }
    const swing = view.swing ?? 32
    const controls = animate(turn, [view.turn, view.turn + swing, view.turn - swing * 0.4, view.turn], {
      duration: 1.6,
      ease: 'easeInOut',
    })
    return () => controls.stop()
  }, [active, turn, view.turn, view.swing])

  const frame = computeFrame(ICON_BODY, ICON_POSE, angle)
  const [x, y, w, h] = view.box
  return (
    <svg viewBox={`${x} ${y} ${w} ${h}`} className={className} aria-hidden="true" focusable="false">
      <MannequinFigure f={frame} worn={{ [item.slot]: piece }} uid={uid} ghost />
    </svg>
  )
}

const ItemIcon = memo(ItemIconBase)
export default ItemIcon
