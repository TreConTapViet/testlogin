import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { animate, useMotionValue } from 'framer-motion'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { INTRO, WARDROBE_FRAME, wardrobeDepth } from '../../lib/scene'
import { getClothAsset } from './clothAssets'
import { liningTexture, shadowTexture, woodGrainTexture } from './woodTextures'

const F = WARDROBE_FRAME
const OPEN_DEG = 108
const RAD = Math.PI / 180
const EASE_OUT = [0.22, 1, 0.36, 1]
const HANGER_SPOTS = [0.2, 0.4, 0.62, 0.82]

// Màu gỗ theo giao diện (giống các biến --wood-* của bản 2D)
const PALETTE = {
  light: { wood: '#c79b6b', hi: '#ddb88e', lo: '#a5764a', deep: '#7b5331', brass: '#d8ad57', lining: '#f4ebdd', hanger: '#b3aa9d' },
  dark: { wood: '#6c4830', hi: '#82593a', lo: '#553822', deep: '#3a2516', brass: '#c79c47', lining: '#241a13', hanger: '#75695d' },
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const bump = (t, center, width) => Math.max(0, 1 - Math.abs(t - center) / width)
const smoothstep = (from, to, t) => {
  const x = clamp((t - from) / (to - from), 0, 1)
  return x * x * (3 - 2 * x)
}
// Tủ chật rung nhẹ, mạnh dần qua 3 đợt rồi nổ (t: 0 → 1 trong bước "stuffed")
const energyAt = (t) => 0.3 * bump(t, 0.16, 0.12) + 0.6 * bump(t, 0.46, 0.14) + smoothstep(0.66, 1, t)

function useWardrobeMaterials(theme) {
  const materials = useMemo(() => {
    const palette = PALETTE[theme] ?? PALETTE.light
    const grain = woodGrainTexture()
    const wood = (color, roughness = 0.62) => new THREE.MeshStandardMaterial({ color, map: grain, roughness, metalness: 0 })
    return {
      grain,
      frame: wood(palette.wood),
      door: wood(palette.hi),
      trim: wood(palette.lo),
      deep: wood(palette.deep, 0.75),
      brass: new THREE.MeshStandardMaterial({ color: palette.brass, metalness: 0.75, roughness: 0.3 }),
      rail: new THREE.MeshStandardMaterial({ color: '#d9d3c9', metalness: 0.55, roughness: 0.35 }),
      mirror: new THREE.MeshStandardMaterial({ color: '#dfe7ee', metalness: 0.65, roughness: 0.12 }),
      // Lòng tủ không chịu ánh sáng: màu đúng như bản 2D để form đăng nhập đọc rõ
      lining: new THREE.MeshBasicMaterial({ map: liningTexture(palette.lining) }),
      liningSide: new THREE.MeshBasicMaterial({ color: new THREE.Color(palette.lining).multiplyScalar(0.88) }),
      hanger: new THREE.MeshStandardMaterial({ color: palette.hanger, roughness: 0.5 }),
      shadow: new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: theme === 'dark' ? 0.6 : 0.26 }),
      folds: ['#f4c9b5', '#9fb59a', '#6d8fb3'].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8 })),
      peeks: ['#dfe8f3', '#cfa9d6', '#7a5233'].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.75 })),
    }
  }, [theme])

  useEffect(
    () => () => {
      for (const value of Object.values(materials)) {
        if (Array.isArray(value)) value.forEach((material) => material.dispose())
        else {
          value.map?.dispose()
          value.dispose()
        }
      }
    },
    [materials],
  )
  return materials
}

// Móc áo: móc tròn ôm thanh treo + thân tam giác (ống tròn mảnh)
function hangerGeometry() {
  const corners = [
    [0, -7],
    [-17, -21],
    [16, -21],
    [0, -7],
  ].map(([x, y]) => new THREE.Vector3(x, y, 0))
  const outline = new THREE.CurvePath()
  for (let index = 1; index < corners.length; index += 1) outline.add(new THREE.LineCurve3(corners[index - 1], corners[index]))
  const triangle = new THREE.TubeGeometry(outline, 30, 1, 5, false)
  const hook = new THREE.TorusGeometry(3.6, 1, 5, 12, Math.PI * 1.5)
  hook.rotateZ(-Math.PI / 2)
  const stem = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0, -3.6, 0), new THREE.Vector3(0, -7, 0)), 2, 1, 5, false)
  const merged = mergeGeometries([triangle, hook, stem], false)
  triangle.dispose()
  hook.dispose()
  stem.dispose()
  return merged
}

function ClothAsset({ id, size, ...props }) {
  const asset = getClothAsset(id)
  if (!asset) return null
  return (
    <group scale={size} dispose={null} {...props}>
      <mesh geometry={asset.geometry} material={asset.material} />
      {asset.tubes.map((tube, index) => (
        <mesh key={index} geometry={tube.geometry} material={tube.material} />
      ))}
    </group>
  )
}

function Door({ width, height, side, m }) {
  // Cánh trái mở ra từ bản lề bên trái (kéo dài về +x), cánh phải ngược lại
  const dir = side === 'left' ? 1 : -1
  const cx = (dir * width) / 2
  const box = { radius: 3, smoothness: 2, bevelSegments: 1 }
  return (
    <group>
      <RoundedBox args={[width - 1.5, height - 1, 12]} position={[cx, 0, -6]} material={m.door} {...box} />
      {/* Hai ô panô nổi */}
      <RoundedBox args={[width * 0.7, height * 0.58, 3]} position={[cx, height * 0.15, 1]} material={m.frame} {...box} />
      <RoundedBox args={[width * 0.7, height * 0.22, 3]} position={[cx, -height * 0.33, 1]} material={m.frame} {...box} />
      {/* Tay nắm đồng sát mép giữa hai cánh */}
      <mesh position={[dir * (width - 13), 0, 4.5]} material={m.brass}>
        <capsuleGeometry args={[3.2, 50, 4, 8]} />
      </mesh>
      {/* Mặt trong: cánh trái gắn gương */}
      {side === 'left' && (
        <mesh position={[cx, 0, -12.2]} rotation={[0, Math.PI, 0]} material={m.mirror}>
          <planeGeometry args={[width * 0.76, height * 0.8]} />
        </mesh>
      )}
    </group>
  )
}

/**
 * Tủ gỗ 3D khối phồng (cùng kích thước bản 2D). Mặt trước nằm ở z = 0 nên khi đứng yên,
 * lòng tủ trùng khít vị trí pixel của form đăng nhập (DOM) đặt phía trên.
 * phase: 'loading' | 'appear' | 'stuffed' | 'burst' | 'settle' | 'auth'
 * playIntro = false: tủ hiện sẵn ở trạng thái mở (vd. vừa đăng xuất).
 */
export default function Wardrobe3D({ phase, playIntro, width: W, height: H, center, viewport, theme }) {
  const D = wardrobeDepth(W)
  const DW = (W - 2 * F) / 2
  const DH = H - 2 * F
  const m = useWardrobeMaterials(theme)
  const hanger = useMemo(() => hangerGeometry(), [])
  useEffect(() => () => hanger.dispose(), [hanger])

  const rootRef = useRef(null)
  const leftDoorRef = useRef(null)
  const rightDoorRef = useRef(null)
  const pileRef = useRef(null)
  const peeksRef = useRef(null)
  const hangersRef = useRef([])
  const phaseStart = useRef(0)

  // "Camera" quanh tủ + cánh cửa: giá trị do framer-motion điều khiển, đọc trong useFrame
  const atRest = !playIntro
  const scale = useMotionValue(atRest ? 1 : 0.78)
  const offsetY = useMotionValue(atRest ? 0 : -50)
  const rotY = useMotionValue(atRest ? 0 : -26)
  const rotX = useMotionValue(atRest ? 0 : 8)
  const door = useMotionValue(atRest ? OPEN_DEG : 0)
  const pileFly = useMotionValue(atRest ? 1 : 0)
  const peek = useMotionValue(atRest ? 0 : 1)

  useEffect(() => {
    phaseStart.current = performance.now()
    const controls = []
    const run = (value, target, options) => controls.push(animate(value, target, options))
    const rest = (options) => {
      run(scale, 1, options)
      run(offsetY, 0, options)
      run(rotY, 0, options)
      run(rotX, 0, options)
    }
    if (phase === 'appear') {
      // Tủ từ từ hiện ra, xoay về chính diện
      rest({ duration: INTRO.appearMs / 1000, ease: EASE_OUT })
    } else if (phase === 'stuffed') {
      // Camera tiến lại gần trong lúc tủ rung; tủ hạ thấp để chồng đồ trên nóc không đè lên dòng chữ
      const zoom = { duration: INTRO.stuffedMs / 1000, ease: [0.45, 0, 0.8, 0.4] }
      run(scale, 1.3, zoom)
      run(offsetY, -70, zoom)
      run(rotY, -6, zoom)
    } else if (phase === 'burst') {
      // Nổ: giật lùi, cánh bật tung rồi đập lại, đồ trên nóc văng đi
      rest({ type: 'spring', stiffness: 140, damping: 13 })
      run(door, [door.get(), 74, 74, 0, 5, 0], {
        duration: 1.1,
        times: [0, 0.13, 0.42, 0.72, 0.86, 1],
        ease: ['easeOut', 'linear', 'easeIn', 'easeOut', 'easeIn'],
      })
      run(pileFly, 1, { duration: 0.9, ease: 'easeOut' })
      run(peek, 0, { duration: 0.2 })
    } else if (phase === 'settle') {
      rest({ duration: 0.3 })
      run(door, 0, { duration: 0.3 })
    } else if (phase === 'auth') {
      // Cửa mở ra lòng tủ (nơi đặt form đăng nhập)
      rest({ type: 'spring', stiffness: 120, damping: 16 })
      run(door, OPEN_DEG, { duration: 1.5, ease: [0.65, 0, 0.35, 1] })
      run(pileFly, 1, { duration: 0.4 })
      run(peek, 0, { duration: 0.2 })
    }
    return () => controls.forEach((control) => control.stop())
  }, [phase, scale, offsetY, rotY, rotX, door, pileFly, peek])

  useFrame((state) => {
    const root = rootRef.current
    if (!root) return
    const now = performance.now()
    const time = state.clock.elapsedTime
    const stuffing = phase === 'stuffed'
    const t = stuffing ? clamp((now - phaseStart.current) / INTRO.stuffedMs, 0, 1) : 0
    const energy = stuffing ? energyAt(t) : 0
    const s = scale.get()

    root.position.set(center.x - viewport.width / 2 + Math.sin(now * 0.09) * energy * 2.6, viewport.height / 2 - center.y + offsetY.get(), 0)
    root.rotation.set(rotX.get() * RAD, rotY.get() * RAD, Math.sin(t * Math.PI * 10) * energy * 0.6 * RAD)
    root.scale.set(s, s * (1 + energy * 0.012), s)

    // Cánh cửa bị đồ bên trong đẩy hé ra từng nhịp
    const push = stuffing ? 1.2 + energy * 7 + Math.max(0, Math.sin(t * Math.PI * 12)) * energy * 6 : 0
    leftDoorRef.current.rotation.y = -(door.get() + push) * RAD
    rightDoorRef.current.rotation.y = (door.get() + push * 0.9) * RAD

    const fly = pileFly.get()
    const pile = pileRef.current
    pile.visible = fly < 0.999
    pile.position.set(fly * 40, H / 2 + 17 + fly * 260, fly * 160)
    pile.rotation.z = Math.sin(time * 7) * 0.012 * (1 + energy * 4) - fly * 0.7
    pile.scale.setScalar(1 - fly * 0.7)

    const peekScale = peek.get()
    const peeks = peeksRef.current
    peeks.visible = peekScale > 0.01
    peeks.scale.setScalar(Math.max(peekScale, 0.001))
    peeks.children.forEach((child, index) => {
      child.rotation.z = child.userData.tilt + Math.sin(time * (5 + index) + index) * 0.06 * (1 + energy * 3)
    })

    hangersRef.current.forEach((item, index) => {
      if (item) item.rotation.z = Math.sin(time * (2.6 - index * 0.3) + index) * 4 * RAD
    })
  })

  const liningW = W - 2 * F
  const railY = H / 2 - F - 24
  const box = { smoothness: 3, bevelSegments: 2 }

  return (
    <group ref={rootRef}>
      {/* Bóng đổ dưới chân */}
      <mesh position={[0, -H / 2 - 30, -D / 2]} material={m.shadow} renderOrder={-1}>
        <planeGeometry args={[W * 1.4, 64]} />
      </mesh>

      {/* Thân tủ: hai vách, nóc, đáy, hậu */}
      <RoundedBox args={[F, H, D]} radius={4} position={[-W / 2 + F / 2, 0, -D / 2]} material={m.frame} {...box} />
      <RoundedBox args={[F, H, D]} radius={4} position={[W / 2 - F / 2, 0, -D / 2]} material={m.frame} {...box} />
      <RoundedBox args={[W, F, D]} radius={4} position={[0, H / 2 - F / 2, -D / 2]} material={m.frame} {...box} />
      <RoundedBox args={[W, F, D]} radius={4} position={[0, -H / 2 + F / 2, -D / 2]} material={m.frame} {...box} />
      <mesh position={[0, 0, -D + 3]} material={m.deep}>
        <boxGeometry args={[W - 4, H - 4, 6]} />
      </mesh>

      {/* Lòng tủ */}
      <mesh position={[0, 0, -D + 6.5]} material={m.lining}>
        <planeGeometry args={[liningW, DH]} />
      </mesh>
      <mesh position={[-W / 2 + F + 0.5, 0, -D / 2 + 3]} rotation={[0, Math.PI / 2, 0]} material={m.liningSide}>
        <planeGeometry args={[D - 6, DH]} />
      </mesh>
      <mesh position={[W / 2 - F - 0.5, 0, -D / 2 + 3]} rotation={[0, -Math.PI / 2, 0]} material={m.liningSide}>
        <planeGeometry args={[D - 6, DH]} />
      </mesh>
      <mesh position={[0, H / 2 - F - 0.5, -D / 2 + 3]} rotation={[Math.PI / 2, 0, 0]} material={m.liningSide}>
        <planeGeometry args={[liningW, D - 6]} />
      </mesh>
      <mesh position={[0, -H / 2 + F + 0.5, -D / 2 + 3]} rotation={[-Math.PI / 2, 0, 0]} material={m.liningSide}>
        <planeGeometry args={[liningW, D - 6]} />
      </mesh>

      {/* Thanh treo + móc áo đung đưa */}
      <mesh position={[0, railY, -D * 0.5]} rotation={[0, 0, Math.PI / 2]} material={m.rail}>
        <cylinderGeometry args={[2.6, 2.6, liningW - 36, 10]} />
      </mesh>
      {HANGER_SPOTS.map((spot, index) => (
        <group
          key={spot}
          ref={(element) => {
            hangersRef.current[index] = element
          }}
          position={[-liningW / 2 + spot * liningW, railY, -D * 0.5]}
        >
          <mesh geometry={hanger} material={m.hanger} />
        </group>
      ))}

      {/* Nóc tủ, đế, chân */}
      <RoundedBox args={[W + 24, 22, D + 18]} radius={8} position={[0, H / 2 + 6, -D / 2 + 2]} material={m.trim} {...box} />
      <RoundedBox args={[W + 16, 18, D + 10]} radius={6} position={[0, -H / 2 - 3, -D / 2 + 1]} material={m.trim} {...box} />
      {[-1, 1].map((side) => (
        <RoundedBox key={side} args={[28, 16, 26]} radius={5} position={[side * (W / 2 - 40), -H / 2 - 19, -20]} material={m.deep} {...box} />
      ))}

      {/* Hai cánh cửa xoay quanh bản lề */}
      <group ref={leftDoorRef} position={[-W / 2 + F, 0, 2]}>
        <Door width={DW} height={DH} side="left" m={m} />
      </group>
      <group ref={rightDoorRef} position={[W / 2 - F, 0, 2]}>
        <Door width={DW} height={DH} side="right" m={m} />
      </group>

      {/* Đồ chất đống trên nóc tủ */}
      <group ref={pileRef}>
        <group position={[-W * 0.17, 0, -D * 0.25]}>
          {m.folds.map((material, index) => (
            <RoundedBox
              key={index}
              args={[W * (0.42 - index * 0.04), 15, 54]}
              radius={6}
              position={[0, 8 + index * 16, 0]}
              rotation={[0, 0, [0.07, -0.05, 0.03][index]]}
              material={material}
              smoothness={2}
              bevelSegments={1}
            />
          ))}
          <ClothAsset id="hat" size={70} position={[0, 60, 4]} rotation={[0, 0, 0.14]} />
        </group>
        <ClothAsset id="sneaker" size={58} position={[W * 0.27, 18, -D * 0.2]} rotation={[0, -0.4, -0.14]} />
      </group>

      {/* Tay áo, khăn, dây lưng bị kẹt thò ra khe cửa */}
      <group ref={peeksRef} position={[0, 0, 4]}>
        <RoundedBox args={[12, 66, 5]} radius={2} position={[5, H / 2 - H * 0.26 - 33, 0]} material={m.peeks[0]} userData={{ tilt: 0.17 }} smoothness={2} bevelSegments={1} />
        <RoundedBox args={[12, 72, 4]} radius={2} position={[-4, H / 2 - H * 0.54 - 36, 0]} material={m.peeks[1]} userData={{ tilt: -0.08 }} smoothness={2} bevelSegments={1} />
        <RoundedBox args={[7, 42, 4]} radius={2} position={[3, H / 2 - H * 0.77 - 21, 0]} material={m.peeks[2]} userData={{ tilt: 0.06 }} smoothness={2} bevelSegments={1} />
      </group>
    </group>
  )
}
