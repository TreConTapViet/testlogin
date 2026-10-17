import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import { useViewport } from '../../hooks/useViewport'
import { TOP_BAR_HEIGHT } from '../../lib/scene'
import ClothIcon from '../clothes/ClothIcon'
import { CLOTHES_BY_ID } from '../clothes/catalog'
import { HangerIcon } from '../icons'
import { StickFigure } from '../profile/Characters'
import { ENTRANCE_TIMES, RETURNING_OFFSET, curtainAt, customerFrame, entrancePhase } from './entranceMotion'

// Cảnh vẽ trên sân khấu cố định 760x520 rồi co giãn cho vừa màn hình (giống cảnh chào ở trang hồ sơ)
const STAGE_W = 760
const STAGE_H = 520
const BOOTH = { x: 524, y: 122, w: 196, h: 324 }
const BOOTH_CENTER = { x: BOOTH.x + BOOTH.w / 2, y: BOOTH.y + BOOTH.h / 2 }
const PHASES = ['think', 'idea', 'go', 'zoom']
const RACK = ['dress', 'shirt', 'jacket', 'skirt', 'hoodie']

// Móc treo + món đồ đung đưa nhẹ trên giá
function HangingCloth({ id, x, index }) {
  return (
    <motion.div
      className="absolute"
      style={{ left: x, top: 160, width: 58, transformOrigin: '50% 0%' }}
      animate={{ rotate: [0, 2.2, -1.6, 0] }}
      transition={{ duration: 4 + index * 0.4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
    >
      <svg viewBox="0 0 58 22" className="block w-full" aria-hidden="true">
        <path d="M29 2 a4 4 0 1 1 4 4 v3 L52 20 H6 L25 9" fill="none" stroke="#9a8f84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <ClothIcon item={CLOTHES_BY_ID[id]} className="-mt-2 block aspect-square w-full" style={{ filter: 'drop-shadow(0 6px 6px rgba(0,0,0,0.14))' }} />
    </motion.div>
  )
}

// Bong bóng suy nghĩ: ba chấm → bóng đèn ý tưởng
function ThoughtBubble({ mood }) {
  return (
    <div className="relative">
      <div className="rounded-[22px] bg-white px-3.5 py-2.5 shadow-lg dark:bg-[#2c2a38]">
        <AnimatePresence mode="wait" initial={false}>
          {mood === 'think' ? (
            <motion.span
              key="think"
              className="flex h-7 items-center gap-1.5 px-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.18 }}
            >
              {[0, 1, 2].map((index) => (
                <motion.span
                  key={index}
                  className="h-2 w-2 rounded-full bg-[#9a8f84]"
                  animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: index * 0.15 }}
                />
              ))}
            </motion.span>
          ) : (
            <motion.svg
              key="idea"
              viewBox="0 0 40 40"
              className="h-7 w-7"
              initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              aria-hidden="true"
            >
              <path d="M20 5 a11 11 0 0 1 6.5 19.8 c-1.3 1-2 2.2-2 3.7 V30 h-9 v-1.5 c0-1.5-.7-2.7-2-3.7 A11 11 0 0 1 20 5 Z" fill="#ffd36e" />
              <path d="M15.5 33 h9 M16.5 36.5 h7" stroke="#9a8f84" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M20 2 V0 M6 8 L4.5 6.5 M34 8 l1.5-1.5 M3 20 H1 M37 20 h2" stroke="#ffb547" strokeWidth="2" strokeLinecap="round" />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>
      {/* Hai bong bóng nhỏ dẫn xuống đầu */}
      <span className="absolute -bottom-3 left-[38%] h-3 w-3 rounded-full bg-white shadow dark:bg-[#2c2a38]" />
      <span className="absolute -bottom-6 left-[30%] h-2 w-2 rounded-full bg-white shadow dark:bg-[#2c2a38]" />
    </div>
  )
}

/**
 * Cảnh vào phòng thử: khách đứng trong cửa hàng trầm ngâm trước giá đồ, kệ túi, mũ, giày;
 * nảy ra ý tưởng rồi bước vào phòng thử, khung hình phóng vào trong.
 */
export default function OutfitEntrance({ nickname, returning, onDone }) {
  const { width, height } = useViewport()
  const [offset] = useState(returning ? RETURNING_OFFSET : 0)
  const [phase, setPhase] = useState(() => entrancePhase(offset))
  const finish = useEffectEvent(() => onDone())
  const figureRef = useRef(null)
  const boxRef = useRef(null)
  const bubbleRef = useRef(null)
  const curtainRef = useRef(null)

  useEffect(() => {
    const timers = PHASES.map((name) => setTimeout(() => setPhase(name), Math.max(0, ENTRANCE_TIMES[name] - offset) * 1000))
    timers.push(setTimeout(() => finish(), (ENTRANCE_TIMES.done - offset) * 1000))
    return () => timers.forEach(clearTimeout)
  }, [offset])

  // Mỗi khung hình: tư thế người que, vị trí, hướng nhìn, rèm phòng thử
  useLayoutEffect(() => {
    const render = (t) => {
      const customer = customerFrame(t)
      figureRef.current?.apply(customer.pose)
      if (boxRef.current) {
        boxRef.current.style.transform = `translate3d(${customer.x}px, 0, 0) scale(${customer.dir * customer.depth}, ${customer.depth})`
        boxRef.current.style.opacity = String(customer.opacity)
      }
      // Bong bóng đi theo đầu, lệch về phía đang nhìn
      if (bubbleRef.current) bubbleRef.current.style.transform = `translate3d(${customer.x + (customer.dir < 0 ? -34 : 30)}px, 0, 0)`
      if (curtainRef.current) curtainRef.current.style.transform = `scaleX(${1 - 0.78 * curtainAt(t)})`
    }
    const startedAt = performance.now() - offset * 1000
    let frame = 0
    const tick = (now) => {
      const t = (now - startedAt) / 1000
      render(t)
      if (t < ENTRANCE_TIMES.done) frame = requestAnimationFrame(tick)
    }
    render(offset)
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [offset])

  const fit = Math.min(1.25, (width - 48) / STAGE_W, (height - TOP_BAR_HEIGHT - 150) / STAGE_H)
  const showBubble = phase === 'think' || phase === 'idea'
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
          <motion.div className="relative origin-top-left" style={{ width: STAGE_W, height: STAGE_H, scale: fit }}>
            {/* Phóng nhanh vào phòng thử khi khách bước vào */}
            <motion.div
              className="absolute inset-0"
              style={{ transformOrigin: `${BOOTH_CENTER.x}px ${BOOTH_CENTER.y}px` }}
              animate={zooming ? { scale: 2.6, opacity: 0 } : { scale: 1, opacity: 1 }}
              transition={zooming ? { duration: 0.5, ease: [0.7, 0, 0.84, 0] } : { duration: 0 }}
              aria-hidden="true"
            >
              {/* Tường và sàn gỗ trong cửa hàng */}
              <div className="absolute inset-x-6 top-6 bottom-[60px] rounded-t-[32px] bg-[#f6e7d4] shadow-[inset_0_-30px_60px_-40px_rgba(60,35,15,0.35)] dark:bg-[#2f2622]" />
              <div className="absolute inset-x-6 bottom-6 h-[68px] overflow-hidden rounded-b-[24px] bg-linear-to-b from-[#dcbf98] to-[#c9a074] dark:from-[#4a3828] dark:to-[#3a2b1e]">
                <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 96px)' }} />
              </div>
              <div className="wood-trim absolute inset-x-6 h-2.5" style={{ top: 452 }} />

              {/* Kệ treo tường: túi xách, mũ, túi tote, kính */}
              <div className="wood-trim absolute rounded-md shadow-md" style={{ left: 64, top: 112, width: 252, height: 10 }} />
              <ClothIcon item={CLOTHES_BY_ID.handbag} className="absolute aspect-square w-[48px]" style={{ left: 78, top: 66 }} />
              <ClothIcon item={CLOTHES_BY_ID.hat} className="absolute aspect-square w-[56px]" style={{ left: 136, top: 62 }} />
              <ClothIcon item={CLOTHES_BY_ID.tote} className="absolute aspect-square w-[48px]" style={{ left: 204, top: 66 }} />
              <ClothIcon item={CLOTHES_BY_ID.sunglasses} className="absolute aspect-square w-[38px]" style={{ left: 262, top: 78 }} />

              {/* Giá treo quần áo */}
              <div className="absolute rounded-full bg-[#b9b0a3]" style={{ left: 56, top: 158, width: 268, height: 6 }} />
              <div className="absolute rounded-full bg-[#b9b0a3]" style={{ left: 64, top: 160, width: 6, height: 290 }} />
              <div className="absolute rounded-full bg-[#b9b0a3]" style={{ left: 310, top: 160, width: 6, height: 290 }} />
              {RACK.map((id, index) => (
                <HangingCloth key={id} id={id} x={80 + index * 46} index={index} />
              ))}

              {/* Kệ giày dưới giá */}
              <div className="wood-trim absolute rounded-md shadow-md" style={{ left: 74, top: 416, width: 232, height: 9 }} />
              <ClothIcon item={CLOTHES_BY_ID.sneaker} className="absolute aspect-square w-[44px]" style={{ left: 92, top: 376 }} />
              <ClothIcon item={CLOTHES_BY_ID.heel} className="absolute aspect-square w-[42px]" style={{ left: 166, top: 378 }} />
              <ClothIcon item={CLOTHES_BY_ID.boot} className="absolute aspect-square w-[44px]" style={{ left: 236, top: 374 }} />

              {/* Phòng thử: khung gỗ, lòng phòng sáng ấm, gương, rèm kéo */}
              <div
                className="absolute overflow-hidden rounded-t-[18px] bg-linear-to-b from-[#fff2d8] to-[#f2cf9c] dark:from-[#5a4430] dark:to-[#3a2b1e]"
                style={{ left: BOOTH.x, top: BOOTH.y, width: BOOTH.w, height: BOOTH.h }}
              >
                <div className="absolute rounded-t-[40px] border-4 border-[#d8ad57]/70 bg-linear-to-br from-[#e8f1f6] to-[#c5d9e4] dark:from-[#3a4a58] dark:to-[#26323d]" style={{ left: 58, top: 46, width: 80, height: 210 }}>
                  <div className="absolute -left-3 top-0 h-full w-8 rotate-[16deg] bg-white/40" />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-7 bg-[#e3c08f] dark:bg-[#4a3826]" />
              </div>
              <div
                ref={curtainRef}
                className="absolute rounded-b-md shadow-[inset_0_-12px_18px_-10px_rgba(0,0,0,0.3)]"
                style={{
                  left: BOOTH.x + 8,
                  top: BOOTH.y + 12,
                  width: BOOTH.w - 16,
                  height: BOOTH.h - 18,
                  transformOrigin: '100% 50%',
                  background:
                    'repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0 6px, rgba(255,255,255,0.08) 6px 14px, rgba(0,0,0,0.04) 14px 22px), linear-gradient(180deg, #c9867a, #a8655c)',
                  willChange: 'transform',
                }}
              />
              <div className="wood-trim absolute rounded-full" style={{ left: BOOTH.x - 6, top: BOOTH.y, width: BOOTH.w + 12, height: 12 }} />
              <div className="wood-frame absolute rounded-md" style={{ left: BOOTH.x - 6, top: BOOTH.y, width: 12, height: BOOTH.h + 6 }} />
              <div className="wood-frame absolute rounded-md" style={{ left: BOOTH.x + BOOTH.w - 6, top: BOOTH.y, width: 12, height: BOOTH.h + 6 }} />
              <div
                className="wood-trim absolute flex items-center justify-center gap-2 rounded-xl text-[#fff7ea] shadow-md"
                style={{ left: BOOTH.x + 18, top: BOOTH.y - 52, width: BOOTH.w - 36, height: 40 }}
              >
                <HangerIcon className="h-5 w-5" />
                <span className="font-display text-[19px] font-semibold tracking-tight">Phòng thử đồ</span>
              </div>

              {/* Chậu cây cạnh phòng thử */}
              <svg viewBox="0 0 40 70" className="absolute w-10" style={{ left: 466, top: 384 }} aria-hidden="true">
                <circle cx="12" cy="22" r="11" fill="#7fae74" />
                <circle cx="28" cy="20" r="12" fill="#6a9d63" />
                <circle cx="20" cy="10" r="10" fill="#8cbc80" />
                <path d="M6 34 H34 L30 66 H10 Z" fill="#c98f62" />
                <rect x="4" y="30" width="32" height="7" rx="2" fill="#b57a50" />
              </svg>

              {/* Bong bóng suy nghĩ đi theo khách */}
              <div ref={bubbleRef} className="absolute" style={{ left: 0, top: 254 }}>
                <AnimatePresence>
                  {showBubble && (
                    <motion.div
                      key="bubble"
                      initial={{ opacity: 0, y: 10, scale: 0.6 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                    >
                      <ThoughtBubble mood={phase === 'think' ? 'think' : 'idea'} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Khách (người dùng): người que màu mực */}
              <div
                ref={boxRef}
                className="absolute bottom-[46px] left-0 h-[160px] w-20 text-ink"
                style={{ transformOrigin: '50% 100%', willChange: 'transform, opacity' }}
              >
                <StickFigure ref={figureRef} className="h-full w-full" />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Lời dẫn */}
        <div className="mt-6 h-16 px-6 text-center">
          <AnimatePresence mode="wait">
            {phase !== 'start' && (
              <motion.div
                key={phase === 'think' ? 'think' : 'go'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <p className="font-display text-2xl">{phase === 'think' ? 'Hôm nay mặc gì nhỉ…' : 'Vào phòng thử đồ thôi!'}</p>
                <p className="mt-1 text-sm text-muted">
                  {phase === 'think'
                    ? `${nickname} đang ngắm giá đồ và kệ phụ kiện.`
                    : 'Kể mình nghe hoàn cảnh của bạn, Tủ Đồ sẽ gợi ý bộ hợp nhất.'}
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
