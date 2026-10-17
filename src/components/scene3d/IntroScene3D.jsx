import { Canvas } from '@react-three/fiber'
import { animate, useMotionValue, useReducedMotion } from 'framer-motion'
import { Suspense, useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useLiteMode } from '../../hooks/useLiteMode'
import { wardrobeDepth } from '../../lib/scene'
import { cameraDistance } from './camera'
import ClothItem from './ClothItem'
import { computeIntroSlots } from './clothSlots'
import Mist from './Mist'
import { AdaptiveQuality, PixelCamera, StudioLights } from './Stage'
import { usePointerParallax } from './usePointerParallax'
import Wardrobe3D from './Wardrobe3D'
import WavingShirt from './WavingShirt'

const CLOTHES_PHASES = new Set(['burst', 'settle', 'auth'])
const SHIRT_Z = 220 // áo SGU bay phía trước tủ
const MIST_Z = 120 // sương nằm giữa tủ và áo

function IntroClothes({ slots, width, height, top, origin, calm, lite }) {
  const pointer = usePointerParallax()
  const distance = cameraDistance(height)
  // Chỉ lấy điểm bung lúc gắn: bung từ trong lòng tủ, vọt về phía camera rồi lùi ra sau tủ
  const [startOrigin] = useState(origin)
  return slots.map((slot) => (
    <ClothItem
      key={slot.key}
      slot={slot}
      width={width}
      height={height}
      top={top}
      distance={distance}
      start={
        startOrigin
          ? {
              x: startOrigin.x + slot.burst.jitterX,
              y: startOrigin.y + slot.burst.jitterY,
              z: -70,
              peakZ: slot.burst.peakZ,
              spinX: slot.burst.spinX,
              spinY: slot.burst.spinY,
              spinZ: slot.burst.spinZ,
              grow: 0.35,
              delay: slot.burst.delay,
              stiffness: slot.burst.stiffness,
              damping: 12,
            }
          : { x: slot.x, y: slot.y + 24, z: slot.z, spinX: 0, spinY: 0.6, spinZ: 0, grow: 0, delay: 0.2 + slot.order * 0.03, stiffness: 70, damping: 16 }
      }
      pointer={pointer}
      interactive
      calm={calm}
      timeScale={lite ? 0.6 : 1}
    />
  ))
}

/**
 * Cả cảnh mở đầu trong MỘT canvas: tủ gỗ 3D, quần áo 3D bung ra, áo SGU bay ngang và sương mờ.
 * Chiều sâu 3D tự xử lý chuyện quần áo bay trước tủ rồi lùi ra sau; form đăng nhập là DOM đặt đè lên lòng tủ.
 * onSweepDone: áo SGU bay xong (cảnh cha chuyển sang bước đăng nhập, sương tan dần).
 */
export default function IntroScene3D({ phase, playIntro, width, height, top, wardrobe, center, theme, sweepDuration, onSweepDone }) {
  const lite = useLiteMode()
  const calm = useReducedMotion()
  const maxDpr = lite ? 1.25 : 1.5
  const [dpr, setDpr] = useState(maxDpr)
  const distance = cameraDistance(height)
  const depth = wardrobeDepth(wardrobe.width)

  const slots = useMemo(
    () => computeIntroSlots({ width, height, top, count: lite ? 7 : 14, minZ: -(depth + 50) }),
    [width, height, top, lite, depth],
  )

  // Tiến độ áo SGU bay (0 → 1) và độ đậm sương (1 → 0 khi tan): framer-motion điều khiển, three.js đọc mỗi khung hình
  const sweep = useMotionValue(0)
  const mistFade = useMotionValue(1)
  const [mistLingering, setMistLingering] = useState(false)
  const handleSweepDone = useEffectEvent(() => onSweepDone())

  useEffect(() => {
    if (phase !== 'settle') return undefined
    sweep.set(0)
    mistFade.set(1)
    // Lao vào, lướt chậm qua giữa màn hình (đủ lâu để thấy logo), rồi tăng tốc bay ra
    const control = animate(sweep, [0, 0.4, 0.6, 1], {
      duration: sweepDuration,
      times: [0, 0.32, 0.66, 1],
      ease: ['easeOut', 'linear', 'easeIn'],
      onComplete: () => {
        setMistLingering(true)
        handleSweepDone()
      },
    })
    return () => control.stop()
  }, [phase, sweep, mistFade, sweepDuration])

  useEffect(() => {
    if (phase !== 'auth') return undefined
    const control = animate(mistFade, 0, { duration: 1.4, delay: 0.15, ease: 'easeInOut', onComplete: () => setMistLingering(false) })
    return () => control.stop()
  }, [phase, mistFade])

  useEffect(() => () => {
    document.body.style.cursor = ''
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-auto absolute inset-0">
      <Canvas dpr={dpr} flat gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
        <AdaptiveQuality max={maxDpr} onChange={setDpr} />
        <PixelCamera />
        <StudioLights />
        <Wardrobe3D
          phase={phase}
          playIntro={playIntro}
          width={wardrobe.width}
          height={wardrobe.height}
          center={center}
          viewport={{ width, height }}
          theme={theme}
        />
        {CLOTHES_PHASES.has(phase) && (
          <IntroClothes
            slots={slots}
            width={width}
            height={height}
            top={top}
            origin={playIntro ? center : null}
            calm={calm}
            lite={lite}
          />
        )}
        {(phase === 'settle' || mistLingering) && (
          <Mist
            width={width}
            height={height}
            distance={distance}
            z={MIST_Z}
            progress={sweep}
            fade={mistFade}
            count={lite ? 4 : 7}
            theme={theme}
          />
        )}
        {phase === 'settle' && (
          // Suspense riêng: lúc chờ logo chỉ áo chưa hiện, cả cảnh không bị ẩn theo
          <Suspense fallback={null}>
            <WavingShirt width={width} height={height} distance={distance} z={SHIRT_Z} progress={sweep} segments={lite ? 36 : 56} />
          </Suspense>
        )}
      </Canvas>
    </div>
  )
}
