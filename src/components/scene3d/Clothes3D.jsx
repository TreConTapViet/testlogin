import { Canvas } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useLiteMode } from '../../hooks/useLiteMode'
import { cn } from '../../lib/cn'
import { cameraDistance } from './camera'
import ClothItem from './ClothItem'
import { computeSideSlots } from './clothSlots'
import { AdaptiveQuality, PixelCamera, StudioLights } from './Stage'
import { usePointerParallax } from './usePointerParallax'

function Scene({ slots, width, height, top, calm, lite }) {
  const pointer = usePointerParallax()
  const distance = cameraDistance(height)
  return slots.map((slot) => (
    <ClothItem
      key={slot.key}
      slot={slot}
      width={width}
      height={height}
      top={top}
      distance={distance}
      // Hiện dần tại chỗ, lần lượt từng món
      start={{ x: slot.x, y: slot.y + 24, z: slot.z, spinX: 0, spinY: 0.6, spinZ: 0, grow: 0, delay: 0.2 + slot.order * 0.03, stiffness: 70, damping: 16 }}
      pointer={pointer}
      interactive
      calm={calm}
      timeScale={lite ? 0.6 : 1}
    />
  ))
}

/**
 * Quần áo 3D lơ lửng hai bên trang chính (three.js), dựng từ đúng các hình quần áo 2D của catalog.
 * clearWidth: khoảng giữa chừa cho nội dung. Bản nhẹ (điện thoại) ít món hơn, trôi chậm hơn.
 */
export default function Clothes3D({ width, height, top, clearWidth = 0, className }) {
  const calm = useReducedMotion()
  const lite = useLiteMode()
  const maxDpr = lite ? 1.25 : 1.5
  const [dpr, setDpr] = useState(maxDpr)

  useEffect(() => () => {
    document.body.style.cursor = ''
  }, [])

  const slots = useMemo(
    () => computeSideSlots({ width, height, top, clearWidth, count: lite ? 8 : 12 }),
    [width, height, top, clearWidth, lite],
  )

  return (
    <div aria-hidden="true" className={cn('pointer-events-auto absolute inset-0', className)}>
      <Canvas dpr={dpr} flat gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
        <AdaptiveQuality max={maxDpr} onChange={setDpr} />
        <PixelCamera />
        <StudioLights />
        <Scene slots={slots} width={width} height={height} top={top} calm={calm} lite={lite} />
      </Canvas>
    </div>
  )
}
