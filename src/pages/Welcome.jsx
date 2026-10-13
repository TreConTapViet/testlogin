import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import AuthPanel from '../components/auth/AuthPanel'
import Greeting from '../components/auth/Greeting'
import FloatingClothes from '../components/scene/FloatingClothes'
import Wardrobe from '../components/scene/Wardrobe'
import { useViewport } from '../hooks/useViewport'
import { INTRO, TOP_BAR_HEIGHT, getStageCenter, getWardrobeSize } from '../lib/scene'

const INTRO_PHASES = new Set(['stuffed', 'burst', 'settle'])

/**
 * Màn chào + đăng nhập.
 * Các bước: stuffed (tủ chật, rung dần) → burst (nổ, quần áo văng ra) → settle (mờ chuyển cảnh)
 *           → open (cửa mở, lời chào) → auth (form đăng nhập / đăng ký)
 * skipIntro: đã xem màn mở đầu trong phiên này (ví dụ vừa đăng xuất) thì vào thẳng form.
 * onReveal(true): báo cho App hiện thanh trên cùng khi cửa tủ mở.
 */
export default function Welcome({ skipIntro, onReveal }) {
  const stageRef = useRef(null)
  const { width, height } = useViewport()
  const [playIntro] = useState(!skipIntro)
  const [phase, setPhase] = useState(playIntro ? 'stuffed' : 'auth')

  useEffect(() => {
    if (!playIntro) return undefined
    // Chỉ chuyển bước khi đang ở đúng bước trước: bấm "Bỏ qua" sẽ không bị hẹn giờ ghi đè
    const advance = (from, to) => () => setPhase((current) => (current === from ? to : current))
    const timers = [
      setTimeout(advance('stuffed', 'burst'), INTRO.burstAt),
      setTimeout(advance('burst', 'settle'), INTRO.settleAt),
      setTimeout(() => {
        setPhase((current) => (current === 'settle' ? 'open' : current))
        onReveal(true)
      }, INTRO.openAt),
    ]
    return () => timers.forEach(clearTimeout)
  }, [playIntro, onReveal])

  const skipIntroNow = () => {
    setPhase((current) => (INTRO_PHASES.has(current) ? 'open' : current))
    onReveal(true)
  }

  const wardrobe = getWardrobeSize(width, height)
  const center = getStageCenter(width, height)

  return (
    <motion.main
      ref={stageRef}
      className="absolute inset-0 overflow-hidden"
      style={{ transformOrigin: `${center.x}px ${center.y}px` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6 } }}
      // Đăng nhập xong: phóng to vào lòng tủ như "bước vào" tủ đồ
      exit={{ opacity: 0, scale: 1.45, filter: 'blur(12px)', transition: { duration: 0.75, ease: [0.7, 0, 0.84, 0] } }}
    >
      {phase !== 'stuffed' && (
        <FloatingClothes
          width={width}
          height={height}
          top={TOP_BAR_HEIGHT}
          // Chừa chỗ cho hai cánh cửa khi mở (mỗi cánh thò ra ngoài thân tủ khoảng 90px)
          clearWidth={wardrobe.width + 260}
          origin={playIntro ? center : null}
          constraintsRef={stageRef}
          // Lúc bung thì bay phía trước tủ, sau đó lùi ra sau để không che form
          className={phase === 'burst' ? 'z-30' : 'z-0'}
        />
      )}

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center"
        style={{ top: TOP_BAR_HEIGHT }}
      >
        <Wardrobe phase={phase} animateIntro={playIntro} width={wardrobe.width} height={wardrobe.height}>
          <AnimatePresence mode="wait">
            {phase === 'open' && <Greeting key="greeting" onContinue={() => setPhase('auth')} />}
            {phase === 'auth' && <AuthPanel key="auth" />}
          </AnimatePresence>
        </Wardrobe>
      </div>

      <AnimatePresence>
        {phase === 'stuffed' && (
          <motion.p
            key="caption"
            className="pointer-events-none absolute inset-x-0 top-7 z-20 text-center text-sm font-medium tracking-wide text-muted"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.6 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            Ối… tủ đồ chật cứng rồi!
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(phase === 'stuffed' || phase === 'burst') && (
          <motion.button
            key="skip"
            type="button"
            onClick={skipIntroNow}
            className="glass absolute bottom-6 right-6 z-50 cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.8 } }}
            exit={{ opacity: 0 }}
          >
            Bỏ qua ›
          </motion.button>
        )}
      </AnimatePresence>

      {/* Lớp mờ chuyển cảnh giữa lúc nổ và lúc cửa mở */}
      <AnimatePresence>
        {phase === 'settle' && (
          <motion.div
            key="veil"
            className="pointer-events-none absolute inset-0 z-40 bg-bg/25 backdrop-blur-[10px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.35 } }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
          />
        )}
      </AnimatePresence>
    </motion.main>
  )
}
