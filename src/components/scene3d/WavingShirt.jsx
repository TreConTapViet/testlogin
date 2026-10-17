import { useFrame } from '@react-three/fiber'
import { use, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { depthFactor } from './camera'
import { drawSguShirt, loadSguLogo } from './sguShirt'
import { shirtLayout, shirtOffsetX } from './shirtLayout'

const lerp = (from, to, t) => from + (to - from) * t

/**
 * Áo đồng phục SGU cỡ tràn màn hình bay từ phải sang trái, gợn sóng như lá cờ.
 * progress: motion value 0 → 1 (do cảnh cha điều khiển bằng framer-motion). z: độ sâu (trước tủ đồ).
 */
export default function WavingShirt({ width, height, distance, z, progress, segments }) {
  const meshRef = useRef(null)
  const logo = use(loadSguLogo())
  const layout = shirtLayout(width, height)
  const k = depthFactor(distance, z)

  const texture = useMemo(() => {
    const map = new THREE.CanvasTexture(drawSguShirt(logo))
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 8
    return map
  }, [logo])

  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1, 1, segments, segments)
    plane.userData.base = Float32Array.from(plane.attributes.position.array)
    return plane
  }, [segments])

  useEffect(
    () => () => {
      texture.dispose()
      geometry.dispose()
    },
    [texture, geometry],
  )

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return
    const p = progress.get()
    const t = state.clock.elapsedTime

    mesh.position.set(shirtOffsetX(layout, p) * k, (layout.centerY + Math.sin(p * Math.PI) * height * 0.02) * k, z)
    mesh.rotation.set(0.06 * Math.sin(t * 1.4), lerp(-0.32, 0.32, p), lerp(0.1, -0.06, p))
    mesh.scale.setScalar(layout.size * k)

    // Sóng chạy từ mép trước (bên trái, hướng bay) ra mép sau, mép sau bay mạnh hơn như đuôi cờ
    const position = mesh.geometry.attributes.position
    const base = mesh.geometry.userData.base
    for (let i = 0; i < position.count; i += 1) {
      const u = base[i * 3] + 0.5
      const v = base[i * 3 + 1] + 0.5
      const amplitude = 0.04 + 0.07 * u
      const wave = Math.sin(u * 9 - t * 7) * amplitude + Math.sin(v * 5 + t * 4 + u * 3) * 0.012
      position.setZ(i, wave)
      position.setY(i, base[i * 3 + 1] + Math.sin(u * 7 - t * 6) * 0.008 * u)
    }
    position.needsUpdate = true
    mesh.geometry.computeVertexNormals()
  })

  return (
    <mesh ref={meshRef} geometry={geometry} renderOrder={10}>
      <meshStandardMaterial
        map={texture}
        side={THREE.DoubleSide}
        alphaTest={0.5}
        alphaToCoverage
        roughness={0.82}
        metalness={0}
      />
    </mesh>
  )
}
