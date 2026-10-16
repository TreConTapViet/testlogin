import { motion } from 'framer-motion'
import { useEffect, useEffectEvent, useState } from 'react'
import { THEME_REVEAL_EASE, THEME_REVEAL_MS } from '../lib/themeTransition'

// Lớp hiệu ứng khi đổi giao diện, chạy cùng nhịp với màn lật từ phải sang trái:
// - sang tối: viền đêm, sao lấp lánh hiện dần theo mép lật, sao chổi bay ngang, trăng khuyết;
// - sang sáng: dải ánh sáng quét qua kèm tia nắng, hào quang ấm rồi tan dần.
const REVEAL = THEME_REVEAL_MS / 1000
const TOTAL = REVEAL + 0.65
const EDGE = { duration: REVEAL, ease: THEME_REVEAL_EASE }

// Số ngẫu nhiên có hạt giống: mỗi lần đổi giao diện một bầu trời khác nhưng vẫn là hàm thuần
function seeded(seed) {
  let state = (Math.abs(Math.floor(seed)) % 2147483646) + 1
  return () => {
    state = (state * 16807) % 2147483647
    return state / 2147483647
  }
}

// Nghịch đảo của đường cong lật màn (xấp xỉ easeInOutCubic): mép lật đi qua vị trí p lúc nào
const invEase = (p) => (p < 0.5 ? Math.cbrt(p / 4) : 1 - Math.cbrt(2 * (1 - p)) / 2)

function NightFx({ width, height, seed }) {
  const [sky] = useState(() => {
    const random = seeded(seed)
    const stars = Array.from({ length: 70 }, (_, id) => {
      const x = random() * width
      return { id, x, y: random() * height * 0.9, size: 1 + random() * 2.2, delay: invEase(1 - x / width) * REVEAL }
    })
    const comets = Array.from({ length: 5 }, (_, id) => ({
      id,
      y: height * (0.06 + random() * 0.45),
      delay: 0.04 + id * 0.15 + random() * 0.1,
      duration: 0.8 + random() * 0.4,
      length: 120 + random() * 90,
    }))
    return { stars, comets }
  })
  const drop = (width + 300) * Math.tan((10 * Math.PI) / 180)
  return (
    <>
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{
          width: 320,
          background:
            'linear-gradient(90deg, rgba(10,12,32,0) 0%, rgba(16,18,46,0.5) 40%, rgba(150,170,255,0.5) 50%, rgba(16,18,46,0.35) 58%, rgba(10,12,32,0) 100%)',
        }}
        initial={{ x: width - 160 }}
        animate={{ x: -160, opacity: [1, 1, 0] }}
        transition={{ x: EDGE, opacity: { duration: REVEAL + 0.25, times: [0, 0.85, 1] } }}
      />
      {sky.stars.map((star) => (
        <motion.span
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{ left: star.x, top: star.y, width: star.size, height: star.size, boxShadow: '0 0 6px rgba(205,218,255,0.9)' }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 1, 0.45, 1, 0], scale: [0.3, 1, 0.8, 1, 0.6] }}
          transition={{ delay: star.delay, duration: Math.max(0.4, TOTAL - star.delay), times: [0, 0.18, 0.45, 0.7, 1] }}
        />
      ))}
      {sky.comets.map((comet) => (
        <motion.span
          key={comet.id}
          className="absolute left-0 top-0 h-[2px] rounded-full"
          style={{
            width: comet.length,
            rotate: -10,
            background: 'linear-gradient(90deg, #ffffff 0%, rgba(190,205,255,0.75) 18%, rgba(190,205,255,0) 100%)',
            boxShadow: '0 0 10px rgba(210,220,255,0.8)',
          }}
          initial={{ x: width + 40, y: comet.y, opacity: 0 }}
          animate={{ x: -comet.length - 60, y: comet.y + drop, opacity: [0, 1, 1, 0] }}
          transition={{ delay: comet.delay, duration: comet.duration, ease: 'easeIn', times: [0, 0.1, 0.8, 1] }}
        />
      ))}
      <motion.span
        className="absolute right-[12%] top-[14%] h-12 w-12 rounded-full"
        style={{ boxShadow: 'inset -11px 7px 0 0 #f4ecd2', filter: 'drop-shadow(0 0 12px rgba(244,236,210,0.55))' }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: [0, 0.95, 0.95, 0], scale: [0.7, 1, 1, 1] }}
        transition={{ duration: TOTAL, times: [0, 0.35, 0.75, 1] }}
      />
    </>
  )
}

function DayFx({ width }) {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 100% 0%, rgba(255,226,168,0.5), rgba(255,240,210,0.14) 45%, transparent 70%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: TOTAL, times: [0, 0.35, 1] }}
      />
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{
          width: 340,
          background:
            'linear-gradient(90deg, rgba(255,248,230,0) 0%, rgba(255,238,200,0.5) 38%, rgba(255,255,255,0.95) 50%, rgba(255,232,186,0.45) 62%, rgba(255,248,230,0) 100%)',
        }}
        initial={{ x: width - 170 }}
        animate={{ x: -170, opacity: [1, 1, 0] }}
        transition={{ x: EDGE, opacity: { duration: REVEAL + 0.25, times: [0, 0.85, 1] } }}
      >
        {/* Tia nắng toả về phía trước mép sáng */}
        {[-14, -5, 6, 15].map((deg, index) => (
          <span
            key={deg}
            className="absolute right-1/2 h-24 origin-right"
            style={{
              top: `${16 + index * 20}%`,
              width: Math.min(560, width * 0.4),
              transform: `rotate(${deg}deg)`,
              background: 'linear-gradient(270deg, rgba(255,240,200,0.3), rgba(255,240,200,0))',
              // Viền trên/dưới của tia mờ dần để tia trông như ánh nắng, không phải dải màu cứng
              maskImage: 'linear-gradient(180deg, transparent, #000 35%, #000 65%, transparent)',
              WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 35%, #000 65%, transparent)',
            }}
          />
        ))}
      </motion.div>
      <motion.span
        className="absolute right-[10%] top-[10%] h-16 w-16 rounded-full"
        style={{ background: 'radial-gradient(circle, #fff6d6 0%, #ffd77a 45%, rgba(255,200,90,0) 72%)' }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.15, 1, 1] }}
        transition={{ duration: TOTAL, times: [0, 0.3, 0.7, 1] }}
      />
    </>
  )
}

function FxLayer({ fx, onDone }) {
  const finish = useEffectEvent(() => onDone())
  const [size] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))

  useEffect(() => {
    const timer = setTimeout(() => finish(), TOTAL * 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      // Tên riêng trong View Transition: lớp này nằm trên ảnh chụp giao diện và vẫn chuyển động trực tiếp
      style={{ viewTransitionName: 'theme-fx' }}
    >
      {fx.to === 'dark' ? <NightFx width={size.width} height={size.height} seed={fx.id} /> : <DayFx width={size.width} />}
    </div>
  )
}

/** Hiệu ứng chuyển sáng/tối; fx = { id, to } hoặc null. */
export default function ThemeTransitionFx({ fx, onDone }) {
  if (!fx) return null
  return <FxLayer key={fx.id} fx={fx} onDone={onDone} />
}
