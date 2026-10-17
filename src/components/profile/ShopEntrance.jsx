import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import { useViewport } from '../../hooks/useViewport'
import { TOP_BAR_HEIGHT } from '../../lib/scene'
import ClothIcon from '../clothes/ClothIcon'
import { CLOTHES_BY_ID } from '../clothes/catalog'
import { HangerIcon } from '../icons'
import { SpeechBubble, StickFigure } from './Characters'
import {
  HIGH_FIVE_POINT,
  RETURNING_OFFSET,
  STAGE_TIMES,
  burstAt,
  doorAngleAt,
  phaseAt,
  staffFrame,
  visitorFrame,
} from './welcomeMotion'

// Khung cảnh vẽ trên sân khấu cố định 760x520 rồi phóng to/thu nhỏ cho vừa màn hình
const STAGE_W = 760
const STAGE_H = 520
const DOOR = { x: 320, y: 230, w: 120, h: 210 }
const DOOR_CENTER = { x: DOOR.x + DOOR.w / 2, y: DOOR.y + DOOR.h / 2 }
const STAFF = { w: 72, h: 144, left: 36 } // vị trí trong khung cửa
const PHASE_NAMES = ['open', 'typing', 'smile', 'zoom']

function Windowpane({ x, items }) {
  return (
    <div
      className="absolute overflow-hidden rounded-t-[60px] rounded-b-lg border-[6px] border-[#9a6b45] dark:border-[#5a3d27]"
      style={{ left: x, top: 236, width: 140, height: 140 }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-[#fff4df] to-[#f3d9b4] dark:from-[#4a3a2a] dark:to-[#2e241b]" />
      <div className="absolute left-1/2 top-6 h-24 w-28 -translate-x-1/2 rounded-full bg-[#fff8e8] opacity-70 blur-xl dark:bg-[#ffcf8a] dark:opacity-25" />
      <div className="absolute left-3 right-3 top-[34px] h-1 rounded-full bg-[#b9b0a3]" />
      {items.map((id, index) => (
        <ClothIcon
          key={id}
          item={CLOTHES_BY_ID[id]}
          className="absolute top-9 aspect-square w-[58px]"
          style={{ left: 10 + index * 60, filter: 'drop-shadow(0 6px 6px rgba(0,0,0,0.15))' }}
        />
      ))}
      {/* Vệt phản chiếu của kính */}
      <div className="absolute -left-6 top-0 h-full w-10 rotate-[20deg] bg-white/30" />
    </div>
  )
}

function Planter({ x }) {
  return (
    <svg viewBox="0 0 40 70" className="absolute w-9" style={{ left: x, top: 380 }} aria-hidden="true">
      <circle cx="12" cy="22" r="11" fill="#7fae74" />
      <circle cx="28" cy="20" r="12" fill="#6a9d63" />
      <circle cx="20" cy="10" r="10" fill="#8cbc80" />
      <path d="M6 34 H34 L30 66 H10 Z" fill="#c98f62" />
      <rect x="4" y="30" width="32" height="7" rx="2" fill="#b57a50" />
    </svg>
  )
}

/**
 * Cảnh trước khi vào hồ sơ: hai người que (khách và nhân viên) chào nhau trước cửa hàng
 * (bong bóng ba chấm → mặt cười), rồi khung hình phóng nhanh vào trong cửa.
 */
export default function ShopEntrance({ nickname, returning, onDone }) {
  const { width, height } = useViewport()
  // Lần quay lại bắt đầu muộn hơn trên cùng dòng thời gian (bỏ đoạn đi bộ đầu)
  const [offset] = useState(returning ? RETURNING_OFFSET : 0)
  const [phase, setPhase] = useState(() => phaseAt(offset)) // approach → open → typing → smile → zoom
  const finish = useEffectEvent(() => onDone())
  const visitorRef = useRef(null)
  const staffRef = useRef(null)
  const visitorBoxRef = useRef(null)
  const staffBoxRef = useRef(null)
  const doorRef = useRef(null)
  const bubbleRef = useRef(null)
  const burstRef = useRef(null)

  // Các mốc bong bóng, lời chào, phóng vào cửa chạy theo cùng dòng thời gian với nhân vật
  useEffect(() => {
    const timers = PHASE_NAMES.map((name) =>
      setTimeout(() => setPhase(name), Math.max(0, STAGE_TIMES[name] - offset) * 1000),
    )
    timers.push(setTimeout(() => finish(), (STAGE_TIMES.done - offset) * 1000))
    return () => timers.forEach(clearTimeout)
  }, [offset])

  // Vẽ từng khung hình: tư thế người que, vị trí, cánh cửa và tia va chạm khi đập tay
  useLayoutEffect(() => {
    const render = (t) => {
      const visitor = visitorFrame(t)
      const staff = staffFrame(t)
      const burst = burstAt(t)
      visitorRef.current?.apply(visitor.pose)
      staffRef.current?.apply(staff.pose)
      if (visitorBoxRef.current) {
        visitorBoxRef.current.style.transform = `translate3d(${visitor.x}px, 0, 0) scale(${visitor.depth})`
        visitorBoxRef.current.style.opacity = String(visitor.opacity)
      }
      if (staffBoxRef.current) {
        staffBoxRef.current.style.transform = `translate3d(${staff.x}px, 0, 0)`
        staffBoxRef.current.style.opacity = String(staff.opacity)
      }
      if (bubbleRef.current) bubbleRef.current.style.transform = `translate3d(${staff.x}px, 0, 0)`
      if (doorRef.current) doorRef.current.style.transform = `rotateY(${doorAngleAt(t)}deg)`
      if (burstRef.current) {
        burstRef.current.style.opacity = String(burst.opacity)
        burstRef.current.style.transform = `scale(${burst.scale})`
      }
    }

    const startedAt = performance.now() - offset * 1000
    let frame = 0
    const tick = (now) => {
      const t = (now - startedAt) / 1000
      render(t)
      if (t < STAGE_TIMES.done) frame = requestAnimationFrame(tick)
    }
    render(offset)
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [offset])

  const fit = Math.min(1.25, (width - 48) / STAGE_W, (height - TOP_BAR_HEIGHT - 150) / STAGE_H)
  const doorOpen = phase !== 'approach'
  const bubbleMood = phase === 'typing' ? 'typing' : 'smile'
  const showBubble = phase === 'typing' || phase === 'smile' || phase === 'zoom'
  const zooming = phase === 'zoom'

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ paddingTop: TOP_BAR_HEIGHT }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.4 } }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
    >
      <div className="flex h-full flex-col items-center justify-center">
        <div style={{ width: STAGE_W * fit, height: STAGE_H * fit }}>
          <motion.div
            className="relative origin-top-left"
            style={{ width: STAGE_W, height: STAGE_H, scale: fit }}
          >
            {/* Phóng nhanh vào trong cửa khi khách bước vào */}
            <motion.div
              className="absolute inset-0"
              style={{ transformOrigin: `${DOOR_CENTER.x}px ${DOOR_CENTER.y}px` }}
              animate={zooming ? { scale: 2.6, opacity: 0 } : { scale: 1, opacity: 1 }}
              transition={zooming ? { duration: 0.55, ease: [0.7, 0, 0.84, 0] } : { duration: 0 }}
              aria-hidden="true"
            >
              {/* Vỉa hè */}
              <div className="absolute inset-x-0 bottom-0 h-[86px] rounded-t-[40px] bg-[#e6ddd2] dark:bg-[#2a2630]" />
              <div className="absolute bottom-[78px] left-[90px] right-[90px] h-3 rounded-full bg-black/10 blur-md" />

              {/* Mặt tiền */}
              <div
                className="absolute rounded-t-2xl bg-[#f6e7d4] shadow-[0_30px_60px_-30px_rgba(60,35,15,0.5)] dark:bg-[#2f2622]"
                style={{ left: 110, top: 80, width: 540, height: 360 }}
              />
              <div className="wood-trim absolute rounded-xl" style={{ left: 98, top: 72, width: 564, height: 18 }} />

              {/* Biển hiệu */}
              <div
                className="wood-trim absolute flex items-center justify-center gap-2.5 rounded-xl text-[#fff7ea] shadow-md"
                style={{ left: 280, top: 100, width: 200, height: 48 }}
              >
                <HangerIcon className="h-6 w-6" />
                <span className="font-display text-[26px] font-semibold tracking-tight">Tủ Đồ</span>
              </div>

              {/* Mái hiên sọc với mép lượn sóng */}
              <svg viewBox="0 0 480 60" className="absolute" style={{ left: 140, top: 160, width: 480, height: 60 }}>
                <rect x="0" y="0" width="480" height="8" rx="3" fill="#8f544b" />
                {Array.from({ length: 10 }, (_, index) => (
                  <g key={index} fill={index % 2 === 0 ? '#c9867a' : '#fdfbf7'}>
                    <rect x={index * 48} y="6" width="48" height="34" />
                    <circle cx={index * 48 + 24} cy="40" r="24" />
                  </g>
                ))}
              </svg>

              <Windowpane x={155} items={['dress', 'shirt']} />
              <Windowpane x={465} items={['jacket', 'skirt']} />
              <Planter x={116} />
              <Planter x={608} />

              {/* Thảm chào khách */}
              <div className="absolute rounded-[50%] bg-[#c9867a]/25" style={{ left: 326, top: 438, width: 108, height: 16 }} />

              {/* Lòng cửa: ánh đèn ấm + nhân viên */}
              <div
                className="absolute overflow-hidden rounded-t-[14px] bg-linear-to-b from-[#fff2d8] to-[#f2cf9c] dark:from-[#5a4430] dark:to-[#3a2b1e]"
                style={{ left: DOOR.x, top: DOOR.y, width: DOOR.w, height: DOOR.h }}
              >
                <div className="absolute inset-x-0 bottom-0 h-8 bg-[#e3c08f] dark:bg-[#4a3826]" />
                {/* Nhân viên (người que màu nhấn, nhìn sang trái) */}
                <div
                  ref={staffBoxRef}
                  className="absolute bottom-0 text-accent"
                  style={{ left: STAFF.left, width: STAFF.w, height: STAFF.h, willChange: 'transform, opacity' }}
                >
                  <StickFigure ref={staffRef} mirrored className="h-full w-full" />
                </div>
              </div>

              {/* Cánh cửa kính mở vào trong */}
              <div
                className="absolute"
                style={{ left: DOOR.x, top: DOOR.y, width: DOOR.w, height: DOOR.h, perspective: 700 }}
              >
                <div
                  ref={doorRef}
                  className="absolute inset-0 rounded-t-[14px] border-[7px] border-[#9a6b45] dark:border-[#5a3d27]"
                  style={{ transformOrigin: 'left center', willChange: 'transform' }}
                >
                  <div className="absolute inset-0 rounded-t-[7px] bg-linear-to-br from-[#d8e9f3]/90 to-[#aac8da]/80 dark:from-[#3a4a58]/90 dark:to-[#26323d]/90" />
                  <div className="absolute -left-4 top-0 h-full w-8 rotate-[18deg] bg-white/35" />
                  <span className="absolute right-2 top-1/2 h-10 w-2 -translate-y-1/2 rounded-full bg-[#d8ad57]" />
                  {/* Biển "Mời vào" treo trên cửa */}
                  <div className="absolute left-1/2 top-6 -translate-x-1/2 text-center">
                    <div className="mx-auto h-4 w-10 border-x border-t border-[#7a5233]/60" />
                    <div className="rounded-md bg-[#fff7ea] px-2 py-1 text-[11px] font-semibold text-[#b06b62] shadow">
                      Mời vào
                    </div>
                  </div>
                </div>
              </div>

              {/* Chuông cửa: rung khi cửa mở */}
              <motion.svg
                viewBox="0 0 20 20"
                className="absolute w-5"
                style={{ left: DOOR_CENTER.x - 10, top: 212, transformOrigin: '50% 0%' }}
                animate={doorOpen ? { rotate: [0, 22, -16, 12, -6, 0] } : { rotate: 0 }}
                transition={{ duration: 0.9 }}
              >
                <path d="M10 1 V4" stroke="#7a5233" strokeWidth="1.5" />
                <path d="M4 15 Q4 5 10 5 Q16 5 16 15 Z" fill="#d8ad57" />
                <circle cx="10" cy="17" r="2" fill="#b8872f" />
              </motion.svg>

              {/* Bong bóng thoại trên đầu nhân viên (đi theo nhân viên) */}
              <div
                ref={bubbleRef}
                className="absolute"
                style={{ left: DOOR.x + STAFF.left + STAFF.w / 2 - 34, top: DOOR.y + DOOR.h - STAFF.h - 50 }}
              >
                <AnimatePresence>
                  {showBubble && (
                    <motion.div
                      key="bubble"
                      initial={{ opacity: 0, y: 10, scale: 0.6 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                    >
                      <SpeechBubble mood={bubbleMood} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Khách (người dùng): người que màu mực, đi tới, đập tay rồi bước vào */}
              <div
                ref={visitorBoxRef}
                className="absolute bottom-[46px] left-0 h-[160px] w-20 text-ink"
                style={{ transformOrigin: '50% 100%', willChange: 'transform, opacity' }}
              >
                <StickFigure ref={visitorRef} className="h-full w-full" />
              </div>

              {/* Tia va chạm nhỏ khi hai bàn tay chạm nhau */}
              <div
                ref={burstRef}
                className="pointer-events-none absolute text-ink"
                style={{ left: HIGH_FIVE_POINT.x - 24, top: HIGH_FIVE_POINT.y - 24, width: 48, height: 48, opacity: 0 }}
              >
                <svg viewBox="0 0 48 48" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  {[0, 60, 120, 180, 240, 300].map((angle) => (
                    <line key={angle} x1="24" y1="9" x2="24" y2="2" transform={`rotate(${angle} 24 24)`} />
                  ))}
                </svg>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Lời chào */}
        <div className="mt-6 h-16 px-6 text-center">
          <AnimatePresence>
            {(phase === 'smile' || zooming) && (
              <motion.div
                key="caption"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <p className="font-display text-2xl">
                  {returning ? `Chào mừng ${nickname} quay lại!` : `Chào mừng ${nickname} đến với Tủ Đồ!`}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {returning ? 'Mời bạn vào xem và cập nhật hồ sơ nhé.' : 'Mời bạn vào cập nhật hồ sơ để mình tư vấn chuẩn hơn nhé.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="glass absolute bottom-7 right-[100px] z-10 cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        Bỏ qua ›
      </button>
    </motion.div>
  )
}
