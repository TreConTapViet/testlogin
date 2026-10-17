import { motion } from 'framer-motion'
import { useEffect, useEffectEvent } from 'react'

/**
 * Bản dự phòng cho áo SGU bay ngang khi máy không chạy được 3D:
 * lớp mờ chuyển cảnh như cũ, gọi onCover/onDone theo cùng nhịp.
 */
export default function IntroVeil({ onCover, onDone }) {
  const handleCover = useEffectEvent(() => onCover?.())
  const handleDone = useEffectEvent(() => onDone?.())

  useEffect(() => {
    const timers = [setTimeout(() => handleCover(), 300), setTimeout(() => handleDone(), 700)]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-40 bg-bg/25 backdrop-blur-[10px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.35 } }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
    />
  )
}
