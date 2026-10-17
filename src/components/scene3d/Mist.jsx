import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { depthFactor } from './camera'
import { shirtLayout } from './shirtLayout'

const LOOK = {
  light: { color: '#ffffff', opacity: 0.9 },
  dark: { color: '#c9cfdd', opacity: 0.34 },
}
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function seeded(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Đám mây mềm: tâm đặc, mép tan dần
function puffTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.62)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

/**
 * Sương mờ kéo theo sau áo SGU: mỗi đám hiện lên đúng lúc áo bay qua chỗ nó, trôi chậm sang trái,
 * rồi tan dần theo fade (1 → 0) để lộ tủ đã mở sẵn form đăng nhập.
 * progress / fade: motion value do cảnh cha điều khiển. z: nằm giữa tủ (z = 0) và áo.
 */
export default function Mist({ width, height, distance, z, progress, fade, count, theme }) {
  const meshes = useRef([])
  const look = LOOK[theme] ?? LOOK.light
  const k = depthFactor(distance, z)
  const texture = useMemo(() => puffTexture(), [])

  const puffs = useMemo(() => {
    const layout = shirtLayout(width, height)
    return Array.from({ length: count }, (_, index) => {
      const x = (width * (index + 0.5)) / count + ((seeded(index + 1) - 0.5) * width) / count
      return {
        x,
        y: height * (0.28 + seeded(index + 11) * 0.48),
        size: height * (0.75 + seeded(index + 21) * 0.5),
        // Tiến độ lúc tâm áo đi ngang qua chỗ này
        passAt: (layout.travel - (x - width / 2)) / (2 * layout.travel),
        drift: 18 + seeded(index + 31) * 26,
        spin: (seeded(index + 41) - 0.5) * 0.6,
      }
    })
  }, [width, height, count])

  const materials = useMemo(
    () => puffs.map(() => new THREE.MeshBasicMaterial({ map: texture, color: look.color, transparent: true, depthWrite: false, opacity: 0 })),
    [puffs, texture, look.color],
  )

  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials])
  useEffect(() => () => texture.dispose(), [texture])

  useFrame((state) => {
    const p = progress.get()
    const f = fade.get()
    const t = state.clock.elapsedTime
    puffs.forEach((puff, index) => {
      const mesh = meshes.current[index]
      if (!mesh) return
      const shown = clamp((p - puff.passAt + 0.06) / 0.16, 0, 1)
      mesh.material.opacity = shown * f * look.opacity
      const spread = 1 - f
      mesh.position.set(
        (puff.x - width / 2 - shown * puff.drift - spread * puff.drift * 2) * k,
        (height / 2 - puff.y) * k,
        z + index * 0.5,
      )
      mesh.scale.setScalar(puff.size * (1 + shown * 0.1 + spread * 0.35) * k)
      mesh.rotation.z = puff.spin + t * 0.05
    })
  })

  return puffs.map((puff, index) => (
    <mesh
      key={index}
      ref={(element) => {
        meshes.current[index] = element
      }}
      material={materials[index]}
      renderOrder={5}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  ))
}
