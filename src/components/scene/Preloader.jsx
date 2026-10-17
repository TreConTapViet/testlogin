import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useEffectEvent } from 'react'

const EASE_CURTAIN = [0.76, 0, 0.24, 1]

function noteFor(target) {
  if (target >= 100) return 'Sẵn sàng rồi!'
  if (target >= 60) return 'Đang gấp quần áo 3D…'
  return 'Đang mở tủ đồ…'
}

/**
 * Màn tải đầu trang: móc áo tự vẽ nét, số phần trăm chạy mượt tới mức đã tải (target, 0–100),
 * chạm 100% thì báo onDone; khi gỡ ra, tấm màn kéo lên để lộ cảnh phía sau.
 */
export default function Preloader({ target, onDone }) {
  const value = useMotionValue(0)
  const percent = useTransform(value, (v) => `${Math.floor(v)}%`)
  const fill = useTransform(value, (v) => v / 100)
  const handleDone = useEffectEvent(() => onDone())

  useEffect(() => {
    const finishing = target >= 100
    const controls = animate(value, target, {
      duration: finishing ? 0.55 : 1.4,
      ease: finishing ? [0.33, 1, 0.68, 1] : 'easeOut',
      onComplete: finishing ? () => handleDone() : undefined,
    })
    return () => controls.stop()
  }, [value, target])

  return (
    <motion.div
      role="progressbar"
      aria-label="Đang tải trang"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(target)}
      className="app-bg absolute inset-0 z-[55] grid place-items-center"
      exit={{ y: '-100%', transition: { duration: 0.9, ease: EASE_CURTAIN, delay: 0.15 } }}
    >
      <motion.div
        className="flex w-56 flex-col items-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
        exit={{ opacity: 0, y: -18, transition: { duration: 0.3 } }}
      >
        <div className="glass grid h-20 w-20 place-items-center rounded-full">
          <svg viewBox="0 0 24 24" className="h-9 w-9 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <motion.path
              d="M10 5a2 2 0 1 1 3.2 1.6c-.8.6-1.2 1.1-1.2 2v.9"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 1, 0] }}
              transition={{ duration: 2.4, times: [0, 0.35, 0.8, 1], repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
              d="M12 9.5 3.6 15.4a1.2 1.2 0 0 0 .7 2.2h15.4a1.2 1.2 0 0 0 .7-2.2L12 9.5Z"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 0, 1, 1, 0] }}
              transition={{ duration: 2.4, times: [0, 0.2, 0.55, 0.85, 1], repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </div>
        <motion.span className="mt-6 font-display text-5xl tabular-nums">{percent}</motion.span>
        <span className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-line">
          <motion.span className="block h-full origin-left rounded-full bg-accent" style={{ scaleX: fill }} />
        </span>
        <span className="mt-3 text-xs font-medium tracking-wide text-muted">{noteFor(target)}</span>
      </motion.div>
    </motion.div>
  )
}
