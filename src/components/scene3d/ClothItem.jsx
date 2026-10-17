import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { animate, useMotionValue } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { depthFactor } from './camera'
import { getClothAsset } from './clothAssets'

const HOVER_SPRING = { type: 'spring', stiffness: 260, damping: 18 }
const SPIN_SPRING = { type: 'spring', stiffness: 90, damping: 14 }
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * Một món đồ 3D lơ lửng: kéo thả được, bấm thì xoay một vòng, rê chuột hiện tên.
 * Ô (slot.x, slot.y) tính bằng pixel màn hình; món nằm sâu phía sau (z âm) được bù phối cảnh
 * để vẫn hiện đúng chỗ và đúng cỡ pixel.
 * start (chỉ lấy lúc gắn): { x, y, z, peakZ?, spinX, spinY, spinZ, grow, delay, stiffness, damping }
 * — có peakZ thì món đồ vọt về phía camera rồi mới lùi về chỗ (bung ra khỏi tủ).
 */
export default function ClothItem({ slot, width, height, top, distance, start: startProp, pointer, interactive, calm, timeScale = 1 }) {
  const groupRef = useRef(null)
  const dragRef = useRef(null)
  const asset = getClothAsset(slot.item.id)
  const [hovered, setHovered] = useState(false)
  const [start] = useState(startProp)

  // Giá trị chuyển động do framer-motion điều khiển, đọc mỗi khung hình để đặt khối 3D
  const x = useMotionValue(start.x)
  const y = useMotionValue(start.y)
  const z = useMotionValue(start.z)
  const spinX = useMotionValue(start.spinX)
  const spinY = useMotionValue(start.spinY)
  const spinZ = useMotionValue(start.spinZ)
  const grow = useMotionValue(start.grow)
  const hover = useMotionValue(1)

  // Bay về ô của mình (chạy lại khi đổi cỡ màn hình)
  useEffect(() => {
    const spring = { type: 'spring', stiffness: start.stiffness, damping: start.damping, delay: start.delay }
    const controls = [animate(x, slot.x, spring), animate(y, slot.y, spring)]
    return () => controls.forEach((control) => control.stop())
  }, [x, y, slot.x, slot.y, start.stiffness, start.damping, start.delay])

  useEffect(() => {
    const flying = start.peakZ != null && Math.abs(z.get() - start.z) < 1
    const control = flying
      ? animate(z, [start.z, start.peakZ, slot.z], { duration: 1.5, times: [0, 0.3, 1], ease: ['easeOut', 'easeInOut'], delay: start.delay })
      : animate(z, slot.z, { type: 'spring', stiffness: 40, damping: 14, delay: start.delay })
    return () => control.stop()
  }, [z, slot.z, start.z, start.peakZ, start.delay])

  // Hết lộn nhào và lớn dần lên đúng cỡ
  useEffect(() => {
    const spin = { type: 'spring', stiffness: 26, damping: 9, delay: start.delay }
    const controls = [
      animate(spinX, 0, spin),
      animate(spinY, 0, spin),
      animate(spinZ, 0, spin),
      animate(grow, 1, { duration: start.grow > 0 ? 0.35 : 0.9, delay: start.delay, ease: [0.22, 1, 0.36, 1] }),
    ]
    return () => controls.forEach((control) => control.stop())
  }, [spinX, spinY, spinZ, grow, start.delay, start.grow])

  useFrame((state) => {
    const group = groupRef.current
    if (!group) return
    const t = calm ? 0 : state.clock.elapsedTime * timeScale
    const { drift } = slot
    const p = pointer.current
    const floatX = Math.sin(t * drift.speedX + drift.phase) * drift.x
    const floatY = Math.sin(t * drift.speedY + drift.phase * 1.3) * drift.y
    // Lệch nhẹ theo con trỏ chuột: món càng "gần" càng lệch nhiều, tạo chiều sâu
    const screenX = x.get() + floatX - p.x * slot.depth * 14
    const screenY = y.get() + floatY - p.y * slot.depth * 10
    // Bù theo độ sâu lúc nằm yên: khi đang vọt về phía camera, món đồ vẫn to ra và toả rộng như thật
    const k = depthFactor(distance, slot.z)

    group.position.set((screenX - width / 2) * k, (height / 2 - screenY) * k, z.get())
    group.rotation.set(
      slot.tiltX + Math.sin(t * 0.7 + drift.phase) * 0.12 + spinX.get() + p.y * 0.15,
      slot.tiltY + Math.sin(t * 0.5 + drift.phase) * 0.3 + spinY.get() + p.x * 0.25,
      slot.rotate + Math.sin(t * drift.speedY * 0.8 + drift.phase) * drift.wobble + spinZ.get(),
    )
    group.scale.setScalar(slot.size * grow.get() * hover.get() * k)
  })

  if (!asset) return null

  const events = interactive
    ? {
        onPointerOver: (event) => {
          event.stopPropagation()
          setHovered(true)
          animate(hover, 1.12, HOVER_SPRING)
          document.body.style.cursor = 'grab'
        },
        onPointerOut: () => {
          setHovered(false)
          animate(hover, 1, HOVER_SPRING)
          if (!dragRef.current) document.body.style.cursor = ''
        },
        onPointerDown: (event) => {
          event.stopPropagation()
          event.target.setPointerCapture(event.pointerId)
          x.stop()
          y.stop()
          dragRef.current = { px: event.clientX, py: event.clientY, x: x.get(), y: y.get(), moved: false }
          document.body.style.cursor = 'grabbing'
        },
        onPointerMove: (event) => {
          const drag = dragRef.current
          if (!drag) return
          const dx = event.clientX - drag.px
          const dy = event.clientY - drag.py
          if (Math.hypot(dx, dy) > 4) drag.moved = true
          x.set(clamp(drag.x + dx, 0, width))
          y.set(clamp(drag.y + dy, top, height))
        },
        onPointerUp: (event) => {
          const drag = dragRef.current
          dragRef.current = null
          event.target.releasePointerCapture(event.pointerId)
          document.body.style.cursor = hovered ? 'grab' : ''
          // Bấm (không kéo) thì món đồ xoay một vòng quanh trục đứng
          if (drag && !drag.moved) animate(spinY, spinY.get() + Math.PI * 2, SPIN_SPRING)
        },
      }
    : {}

  return (
    <group ref={groupRef} dispose={null} {...events}>
      <mesh geometry={asset.geometry} material={asset.material} />
      {asset.tubes.map((tube, index) => (
        <mesh key={index} geometry={tube.geometry} material={tube.material} />
      ))}
      {hovered && (
        <Html center position={[0, -0.62, 0]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <span className="whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-bg shadow-md">
            {slot.item.label}
          </span>
        </Html>
      )}
    </group>
  )
}
