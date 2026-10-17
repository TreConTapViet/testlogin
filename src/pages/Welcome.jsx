import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import AuthPanel from '../components/auth/AuthPanel'
import FloatingClothes from '../components/scene/FloatingClothes'
import IntroVeil from '../components/scene/IntroVeil'
import Preloader from '../components/scene/Preloader'
import Wardrobe from '../components/scene/Wardrobe'
import { LazyIntroScene3D, loadScene3D, loadScene3DModules, supportsWebGL } from '../components/scene3d/loadScene3D'
import { useTheme } from '../context/contexts'
import { useViewport } from '../hooks/useViewport'
import { INTRO, TOP_BAR_HEIGHT, WARDROBE_FRAME, getStageCenter, getWardrobeSize } from '../lib/scene'

const INTRO_PHASES = new Set(['loading', 'appear', 'stuffed', 'burst', 'settle'])
const SKIPPABLE_PHASES = new Set(['appear', 'stuffed', 'burst', 'settle'])
const CLOTHES_PHASES = new Set(['burst', 'settle', 'auth'])
// Các bước tự chuyển theo thời gian; settle → auth khi áo SGU bay xong
const NEXT_PHASE = {
  appear: ['stuffed', INTRO.appearMs],
  stuffed: ['burst', INTRO.stuffedMs],
  burst: ['settle', INTRO.burstMs],
}
const MIN_LOADING_MS = 900
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// ---------- Bản dự phòng (máy không chạy được 3D): tủ CSS + quần áo 2D ----------
const EASE_OUT = [0.22, 1, 0.36, 1]
const FRONT = { scale: 1, y: 0, rotateX: 0, rotateY: 0 }
// "Camera" quanh tủ: hiện dần và xoay về chính diện, tiến lại gần trong lúc tủ rung, giật lùi khi nổ
const CAMERA = {
  loading: { scale: 0.78, y: 50, rotateX: 8, rotateY: -26 },
  appear: { ...FRONT, transition: { duration: INTRO.appearMs / 1000, ease: EASE_OUT } },
  stuffed: { scale: 1.3, y: 70, rotateX: 0, rotateY: -6, transition: { duration: INTRO.stuffedMs / 1000, ease: [0.45, 0, 0.8, 0.4] } },
  burst: { ...FRONT, transition: { type: 'spring', stiffness: 140, damping: 13 } },
  settle: FRONT,
  auth: FRONT,
}
// Độ mờ tách riêng ra lớp ngoài: opacity < 1 làm phẳng 3D nên không đặt cùng lớp đang xoay
const FADE = {
  loading: { opacity: 0 },
  appear: { opacity: 1, transition: { duration: 0.9, ease: 'easeOut' } },
  stuffed: { opacity: 1 },
  burst: { opacity: 1 },
  settle: { opacity: 1 },
  auth: { opacity: 1 },
}

// Vầng sáng mềm lúc tủ 3D nổ
function BurstFlash({ center, size }) {
  return (
    <motion.div
      className="pointer-events-none absolute z-20 rounded-full"
      style={{
        width: size,
        height: size,
        left: center.x - size / 2,
        top: center.y - size / 2,
        background: 'radial-gradient(circle, rgba(255,250,240,0.95) 0%, rgba(255,240,220,0.5) 30%, rgba(255,240,220,0) 65%)',
      }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: [0, 0.85, 0], scale: [0.3, 1.1, 1.4] }}
      transition={{ duration: 0.9, times: [0, 0.25, 1], ease: 'easeOut' }}
      exit={{ opacity: 0 }}
    />
  )
}

/**
 * Màn chào + đăng nhập.
 * Các bước: loading (màn tải %) → appear (tủ gỗ từ từ hiện ra) → stuffed (tủ chật rung dần, camera tiến lại gần)
 *           → burst (nổ, quần áo 3D văng ra) → settle (áo đồng phục SGU bay ngang kéo theo sương mờ)
 *           → auth (sương tan, tủ đã mở sẵn form đăng nhập / đăng ký)
 * Máy có WebGL: tủ, quần áo, áo SGU trong một cảnh three.js; form là DOM đặt khít lòng tủ.
 * Máy không có WebGL: tủ CSS + quần áo 2D như bản cũ.
 * skipIntro: đã xem màn mở đầu trong phiên này (ví dụ vừa đăng xuất) thì vào thẳng form.
 * Máy bật "Giảm chuyển động" cũng vào thẳng form.
 * onReveal(true): báo cho App hiện thanh trên cùng khi vào bước đăng nhập.
 */
export default function Welcome({ skipIntro, onReveal }) {
  const stageRef = useRef(null)
  const { width, height } = useViewport()
  const { theme } = useTheme()
  const reduceMotion = useReducedMotion()
  const [playIntro] = useState(!skipIntro && !reduceMotion)
  const [phase, setPhase] = useState(playIntro ? 'loading' : 'auth')
  const [loadTarget, setLoadTarget] = useState(8)
  // 'pending' → '3d' khi tải xong phần three.js, hoặc 'classic' nếu máy không chạy được 3D
  const [mode, setMode] = useState(() => (supportsWebGL() ? 'pending' : 'classic'))
  // Bản dự phòng: lúc bung, quần áo 2D bay phía trước tủ; khi lớp mờ che kín màn hình thì lùi ra sau
  const [clothesBehind, setClothesBehind] = useState(!playIntro)

  useEffect(() => {
    if (mode !== 'pending') return undefined
    let alive = true
    loadScene3D().then((modules) => {
      if (alive) setMode(modules ? '3d' : 'classic')
    })
    return () => {
      alive = false
    }
  }, [mode])

  // Không chạy màn mở đầu (giảm chuyển động) thì hiện thanh trên cùng ngay
  useEffect(() => {
    if (!playIntro) onReveal(true)
  }, [playIntro, onReveal])

  // Màn tải chạy theo tiến độ tải phần 3D thật (mã three.js, hình khối + vân quần áo, logo)
  useEffect(() => {
    if (!playIntro) return undefined
    let alive = true
    loadScene3DModules().then(() => {
      if (alive) setLoadTarget((current) => Math.max(current, 64))
    })
    Promise.all([loadScene3D(), wait(MIN_LOADING_MS)]).then(() => {
      if (alive) setLoadTarget(100)
    })
    return () => {
      alive = false
    }
  }, [playIntro])

  useEffect(() => {
    const step = NEXT_PHASE[phase]
    if (!step) return undefined
    const [to, after] = step
    // Chỉ chuyển khi vẫn đang ở đúng bước: bấm "Bỏ qua" sẽ không bị hẹn giờ ghi đè
    const timer = setTimeout(() => setPhase((current) => (current === phase ? to : current)), after)
    return () => clearTimeout(timer)
  }, [phase])

  const finishIntro = useCallback(() => {
    setPhase((current) => (INTRO_PHASES.has(current) ? 'auth' : current))
    setClothesBehind(true)
    onReveal(true)
  }, [onReveal])

  const wardrobe = getWardrobeSize(width, height)
  const center = getStageCenter(width, height)
  const lining = {
    left: center.x - wardrobe.width / 2 + WARDROBE_FRAME,
    top: center.y - wardrobe.height / 2 + WARDROBE_FRAME,
    width: wardrobe.width - 2 * WARDROBE_FRAME,
    height: wardrobe.height - 2 * WARDROBE_FRAME,
  }

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
      {mode === '3d' && (
        <Suspense fallback={null}>
          <LazyIntroScene3D
            phase={phase}
            playIntro={playIntro}
            width={width}
            height={height}
            top={TOP_BAR_HEIGHT}
            wardrobe={wardrobe}
            center={center}
            theme={theme}
            sweepDuration={INTRO.sweepMs / 1000}
            onSweepDone={finishIntro}
          />
        </Suspense>
      )}

      {/* Form đăng nhập đặt khít lòng tủ 3D; hiện khi sương tan và cửa đã mở */}
      {mode !== 'classic' && (
        <AnimatePresence>
          {phase === 'auth' && (
            <motion.div
              key="form"
              className="pointer-events-auto absolute z-10 overflow-hidden rounded-[12px]"
              style={lining}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: playIntro ? 0.9 : 0.25, duration: 0.5 } }}
              exit={{ opacity: 0 }}
            >
              <div className="thin-scroll absolute inset-0 flex flex-col overflow-y-auto px-6 pb-5 pt-14">
                <AuthPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {mode === '3d' && <AnimatePresence>{phase === 'burst' && <BurstFlash key="flash" center={center} size={Math.max(wardrobe.width, wardrobe.height) * 1.5} />}</AnimatePresence>}

      {mode === 'classic' && (
        <>
          {CLOTHES_PHASES.has(phase) && (
            <FloatingClothes
              width={width}
              height={height}
              top={TOP_BAR_HEIGHT}
              // Chừa chỗ cho hai cánh cửa khi mở (mỗi cánh thò ra ngoài thân tủ khoảng 90px)
              clearWidth={wardrobe.width + 260}
              origin={playIntro ? center : null}
              constraintsRef={stageRef}
              className={clothesBehind ? 'z-0' : 'z-30'}
            />
          )}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center"
            style={{ top: TOP_BAR_HEIGHT }}
          >
            <motion.div variants={FADE} initial={playIntro ? 'loading' : false} animate={phase} style={{ perspective: 1600 }}>
              <motion.div variants={CAMERA} initial={playIntro ? 'loading' : false} animate={phase} style={{ transformStyle: 'preserve-3d' }}>
                <Wardrobe phase={phase} animateIntro={playIntro} width={wardrobe.width} height={wardrobe.height}>
                  <AnimatePresence mode="wait">{phase === 'auth' && <AuthPanel key="auth" />}</AnimatePresence>
                </Wardrobe>
              </motion.div>
            </motion.div>
          </div>
          <AnimatePresence>
            {phase === 'settle' && <IntroVeil key="veil" onCover={() => setClothesBehind(true)} onDone={finishIntro} />}
          </AnimatePresence>
        </>
      )}

      <AnimatePresence>
        {phase === 'stuffed' && (
          <motion.p
            key="caption"
            className="pointer-events-none absolute inset-x-0 top-7 z-20 text-center text-sm font-medium tracking-wide text-muted"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.6 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            Ối… tủ đồ chật cứng rồi!
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {SKIPPABLE_PHASES.has(phase) && (
          <motion.button
            key="skip"
            type="button"
            onClick={finishIntro}
            className="glass absolute bottom-6 right-6 z-[56] cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.8 } }}
            exit={{ opacity: 0 }}
          >
            Bỏ qua ›
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'loading' && (
          <Preloader
            key="preloader"
            target={loadTarget}
            onDone={() => setPhase((current) => (current === 'loading' ? 'appear' : current))}
          />
        )}
      </AnimatePresence>
    </motion.main>
  )
}
