import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import ClothIcon from '../clothes/ClothIcon'
import { CLOTHES } from '../clothes/catalog'

// Số "ngẫu nhiên" cố định theo seed: bố cục giống nhau ở mọi lần render
function seeded(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Rải quần áo thành lưới thưa ở hai bên, chừa khoảng giữa (clearWidth) cho tủ đồ / nội dung
function computeSlots({ width, height, top, clearWidth }) {
  const perSide = Math.ceil(CLOTHES.length / 2)
  const margin = 24
  const bandWidth = Math.max(120, (width - clearWidth) / 2 - margin)
  const cols = bandWidth >= 330 ? 3 : bandWidth >= 150 ? 2 : 1
  const rows = Math.ceil(perSide / cols)
  const areaTop = top + 12
  const areaHeight = Math.max(240, height - areaTop - 28)
  const cellWidth = bandWidth / cols
  const cellHeight = areaHeight / rows
  const base = Math.min(118, Math.max(52, Math.min(cellWidth, cellHeight) * 0.74))

  return CLOTHES.map((item, index) => {
    const onLeft = index % 2 === 0
    const k = Math.floor(index / 2)
    const col = k % cols
    const row = Math.floor(k / cols)
    const fromEdge = margin + (col + 0.5) * cellWidth + (seeded(index + 1) - 0.5) * cellWidth * 0.3
    return {
      x: onLeft ? fromEdge : width - fromEdge,
      y: areaTop + (row + 0.5) * cellHeight + (seeded(index + 11) - 0.5) * cellHeight * 0.3,
      size: Math.round(base * item.size),
      rotate: (seeded(index + 21) - 0.5) * 28,
      depth: 0.4 + seeded(index + 31) * 0.9,
      burstRotate: (seeded(index + 41) - 0.5) * 160,
      burstDelay: seeded(index + 51) * 0.45,
      burstJitterX: (seeded(index + 61) - 0.5) * 70,
      burstJitterY: (seeded(index + 71) - 0.5) * 140,
      stiffness: 55 + seeded(index + 81) * 25,
      driftX: 12 + seeded(index + 91) * 22,
      driftY: 10 + seeded(index + 101) * 18,
      driftDuration: 10 + seeded(index + 111) * 8,
      bobDuration: 6 + seeded(index + 121) * 4,
      wobble: 3 + seeded(index + 131) * 5,
    }
  })
}

function FloatingItem({ item, slot, index, origin, pointerX, pointerY, constraintsRef }) {
  const [spins, setSpins] = useState(0)
  const [dragging, setDragging] = useState(false)
  const draggedRef = useRef(false)
  const parallaxX = useTransform(pointerX, (value) => value * slot.depth * -14)
  const parallaxY = useTransform(pointerY, (value) => value * slot.depth * -10)

  // Bung ra từ tâm tủ, hoặc hiện dần tại chỗ nếu không có màn mở đầu
  const entry = origin
    ? {
        initial: {
          x: origin.x - slot.x + slot.burstJitterX,
          y: origin.y - slot.y + slot.burstJitterY,
          scale: 0.3,
          rotate: slot.burstRotate,
          opacity: 0,
        },
        transition: {
          type: 'spring',
          stiffness: slot.stiffness,
          damping: 12,
          delay: slot.burstDelay,
          opacity: { duration: 0.2, delay: slot.burstDelay },
        },
      }
    : {
        initial: { x: 0, y: 24, scale: 0.85, rotate: slot.rotate, opacity: 0 },
        transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 + index * 0.05 },
      }

  return (
    // Lớp 1: vị trí + kéo thả + hover/nhấn (không có delay để phản hồi tức thì)
    <motion.div
      className={cn(
        'group pointer-events-auto absolute cursor-grab touch-none select-none active:cursor-grabbing',
        dragging ? 'z-20' : 'z-0',
      )}
      style={{ left: slot.x - slot.size / 2, top: slot.y - slot.size / 2, width: slot.size, height: slot.size }}
      drag
      dragConstraints={constraintsRef}
      dragElastic={0.16}
      dragTransition={{ power: 0.25, timeConstant: 260, bounceStiffness: 260, bounceDamping: 24 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      whileDrag={{ scale: 1.12 }}
      onPointerDown={() => {
        draggedRef.current = false
      }}
      onDragStart={() => {
        draggedRef.current = true
        setDragging(true)
      }}
      onDragEnd={() => setDragging(false)}
      onTap={() => {
        // Bấm (không kéo) thì món đồ xoay một vòng
        if (!draggedRef.current) setSpins((count) => count + 1)
      }}
    >
      {/* Lớp 2: bay ra khỏi tủ */}
      <motion.div
        className="h-full w-full"
        initial={entry.initial}
        animate={{ x: 0, y: 0, scale: 1, rotate: slot.rotate, opacity: 1 }}
        transition={entry.transition}
      >
        {/* Lớp 3: lệch nhẹ theo con trỏ chuột tạo chiều sâu */}
        <motion.div className="h-full w-full" style={{ x: parallaxX, y: parallaxY }}>
          {/* Lớp 4: trôi lững lờ quanh vị trí (chu kỳ x/y khác nhau nên đường đi không lặp đơn điệu) */}
          <motion.div
            className="h-full w-full"
            animate={{
              x: [0, slot.driftX, 0, -slot.driftX, 0],
              y: [0, -slot.driftY, 0, slot.driftY, 0],
              rotate: [0, slot.wobble, 0, -slot.wobble, 0],
            }}
            transition={{
              x: { duration: slot.driftDuration, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: slot.bobDuration, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: slot.bobDuration * 1.3, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            {/* Lớp 5: xoay một vòng khi được bấm */}
            <motion.div
              className="h-full w-full"
              animate={{ rotate: spins * 360 }}
              transition={{ type: 'spring', stiffness: 90, damping: 14 }}
            >
              <ClothIcon
                item={item}
                className="h-full w-full"
                style={{ filter: 'drop-shadow(0 12px 14px var(--cloth-shadow))' }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
      <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-bg opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
        {item.label}
      </span>
    </motion.div>
  )
}

/**
 * origin: toạ độ tâm tủ để quần áo bung ra từ đó; null = chỉ hiện dần tại chỗ.
 * Chỉ giá trị lúc gắn (mount) được dùng.
 */
export default function FloatingClothes({ width, height, top, clearWidth, origin, constraintsRef, className }) {
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const smoothX = useSpring(pointerX, { stiffness: 40, damping: 16 })
  const smoothY = useSpring(pointerY, { stiffness: 40, damping: 16 })
  const [startOrigin] = useState(origin)

  useEffect(() => {
    const handlePointerMove = (event) => {
      pointerX.set((event.clientX / window.innerWidth) * 2 - 1)
      pointerY.set((event.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [pointerX, pointerY])

  const slots = useMemo(() => computeSlots({ width, height, top, clearWidth }), [width, height, top, clearWidth])

  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0', className)}>
      {CLOTHES.map((item, index) => (
        <FloatingItem
          key={item.id}
          item={item}
          slot={slots[index]}
          index={index}
          origin={startOrigin}
          pointerX={smoothX}
          pointerY={smoothY}
          constraintsRef={constraintsRef}
        />
      ))}
    </div>
  )
}
