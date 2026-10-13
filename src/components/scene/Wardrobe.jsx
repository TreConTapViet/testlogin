import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { STUFFED_SECONDS } from '../../lib/scene'
import ClothIcon from '../clothes/ClothIcon'
import { CLOTHES_BY_ID } from '../clothes/catalog'

const FRAME = 14 // độ dày khung tủ (px)
const OPEN_ANGLE = 108
const PANEL_SHADOW =
  'inset 0 0 0 1px rgba(0,0,0,0.12), inset 0 3px 8px rgba(255,255,255,0.16), inset 0 -4px 10px rgba(0,0,0,0.14)'
const HIDE_BACKFACE = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }

// ---------- Chuyển động "tủ chật": rung nhẹ, mạnh dần qua 3 đợt rồi nổ ----------
const round = (value) => Math.round(value * 100) / 100
const bump = (t, center, width) => Math.max(0, 1 - Math.abs(t - center) / width)
const smoothstep = (from, to, t) => {
  const x = Math.min(1, Math.max(0, (t - from) / (to - from)))
  return x * x * (3 - 2 * x)
}

function buildShake(steps) {
  const frames = { x: [], rotate: [], scaleY: [], doorLeft: [], doorRight: [] }
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const edge = i === 0 || i === steps
    const energy = 0.3 * bump(t, 0.16, 0.12) + 0.6 * bump(t, 0.46, 0.14) + smoothstep(0.66, 1, t)
    const rattle = edge ? 0 : i % 2 === 0 ? 1 : -1
    frames.x.push(round(rattle * energy * 2.6))
    frames.rotate.push(edge ? 0 : round(Math.sin(t * Math.PI * 10) * energy * 0.6))
    frames.scaleY.push(round(1 + energy * 0.012))
    // Cánh cửa bị đồ bên trong đẩy hé ra từng nhịp
    const push = i === 0 ? 0 : 1.2 + energy * 7 + Math.max(0, Math.sin(t * Math.PI * 12)) * energy * 6
    frames.doorLeft.push(round(-push))
    frames.doorRight.push(round(push * 0.9))
  }
  return frames
}

const SHAKE = buildShake(64)

const REST = { x: 0, rotate: 0, scaleY: 1 }
const CABINET = {
  closed: REST,
  stuffed: {
    x: SHAKE.x,
    rotate: SHAKE.rotate,
    scaleY: SHAKE.scaleY,
    transition: { duration: STUFFED_SECONDS, ease: 'linear' },
  },
  burst: { x: 0, rotate: 0, scaleY: [null, 0.965, 1.015, 1], transition: { duration: 0.7, ease: 'easeOut' } },
  settle: REST,
  open: REST,
  auth: REST,
}

function doorVariants(direction, shakeFrames) {
  const ease = [0.65, 0, 0.35, 1]
  return {
    closed: { rotateY: 0 },
    stuffed: { rotateY: shakeFrames, transition: { duration: STUFFED_SECONDS, ease: 'linear' } },
    // Bật tung ra, đập lại, nảy nhẹ rồi đóng
    burst: {
      rotateY: [null, direction * 74, direction * 74, 0, direction * 5, 0],
      transition: {
        duration: 1.1,
        times: [0, 0.13, 0.42, 0.72, 0.86, 1],
        ease: ['easeOut', 'linear', 'easeIn', 'easeOut', 'easeIn'],
      },
    },
    settle: { rotateY: 0, transition: { duration: 0.3 } },
    open: { rotateY: direction * OPEN_ANGLE, transition: { duration: 1.5, ease } },
    auth: { rotateY: direction * OPEN_ANGLE, transition: { duration: 0.8, ease } },
  }
}

const LEFT_DOOR = doorVariants(-1, SHAKE.doorLeft)
const RIGHT_DOOR = doorVariants(1, SHAKE.doorRight)

// ---------- Các bộ phận của tủ ----------
function Door({ side, phase, initial }) {
  const isLeft = side === 'left'
  const corners = isLeft ? 'rounded-l-[10px]' : 'rounded-r-[10px]'
  return (
    <motion.div
      className="relative h-full w-1/2"
      style={{ transformOrigin: isLeft ? 'left center' : 'right center', transformStyle: 'preserve-3d' }}
      variants={isLeft ? LEFT_DOOR : RIGHT_DOOR}
      initial={initial}
      animate={phase}
    >
      {/* Mặt ngoài */}
      <div
        className={cn('wood-door absolute inset-0 overflow-hidden', corners, isLeft ? 'border-r' : 'border-l', 'border-black/25')}
        style={HIDE_BACKFACE}
      >
        <div className="absolute inset-x-[14%] top-[6%] h-[60%] rounded-md" style={{ boxShadow: PANEL_SHADOW }} />
        <div className="absolute inset-x-[14%] bottom-[6%] h-[22%] rounded-md" style={{ boxShadow: PANEL_SHADOW }} />
        <span
          className={cn('absolute top-1/2 h-16 w-2 -translate-y-1/2 rounded-full', isLeft ? 'right-3' : 'left-3')}
          style={{
            background: 'linear-gradient(90deg, #f3d48a, var(--brass) 50%, #9a7330)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.35)',
          }}
        />
      </div>
      {/* Mặt trong: cánh trái gắn gương, cánh phải gỗ trơn */}
      <div
        className={cn('absolute inset-0 overflow-hidden', corners)}
        style={{ ...HIDE_BACKFACE, transform: 'rotateY(180deg)', background: 'var(--wood-lo)' }}
      >
        {isLeft ? (
          <div
            className="absolute inset-[10%] rounded-md"
            style={{
              background: 'linear-gradient(135deg, #f4f7fa 0%, #c9d3dc 42%, #eef2f6 55%, #b7c2cc 100%)',
              boxShadow: 'inset 0 0 0 3px rgba(0,0,0,0.1)',
            }}
          />
        ) : (
          <div className="absolute inset-x-[14%] inset-y-[6%] rounded-md" style={{ boxShadow: PANEL_SHADOW }} />
        )}
      </div>
    </motion.div>
  )
}

const HANGER_POSITIONS = [0.2, 0.4, 0.62, 0.82]

function Hangers() {
  return HANGER_POSITIONS.map((position, index) => (
    <motion.svg
      key={position}
      viewBox="0 0 40 30"
      className="absolute top-[18px] h-[30px] w-10 text-[#b3aa9d] dark:text-[#75695d]"
      style={{ left: `calc(${position * 100}% - 20px)`, transformOrigin: '50% 10%' }}
      animate={{ rotate: [-4, 4] }}
      transition={{ duration: 2.4 + index * 0.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <path
        d="M17 4.5a3.2 3.2 0 1 1 3 4.2V11M20 11 4 22q-1.5 1.5 1 2h30q2.5-.5 1-2L20 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  ))
}

// Quần áo nhồi kín bên trong: nhìn thấy qua khe cửa khi cửa bị đẩy hé
const CRAMMED = [
  ['jacket', 2, 4, -14, 0.52],
  ['dress', 46, 0, 10, 0.54],
  ['scarf', 28, 10, -22, 0.36],
  ['tote', 70, 8, 14, 0.34],
  ['hoodie', 14, 28, 8, 0.52],
  ['pants', 54, 26, -10, 0.52],
  ['shirt', -6, 50, -6, 0.5],
  ['skirt', 38, 48, 12, 0.46],
  ['tshirt', 62, 56, -8, 0.44],
  ['shorts', 10, 72, 6, 0.42],
  ['handbag', 46, 74, -12, 0.38],
  ['boot', 72, 76, 10, 0.32],
]

function Crammed() {
  return (
    <motion.div className="absolute inset-0" exit={{ opacity: 0, scale: 1.12, transition: { duration: 0.25 } }}>
      {CRAMMED.map(([id, left, top, rotate, size]) => (
        <ClothIcon
          key={id}
          item={CLOTHES_BY_ID[id]}
          className="absolute aspect-square"
          style={{ left: `${left}%`, top: `${top}%`, width: `${size * 100}%`, rotate: `${rotate}deg` }}
        />
      ))}
    </motion.div>
  )
}

function Folded({ color, width, tilt }) {
  return (
    <div
      className="h-4 rounded-[6px] shadow-[0_2px_3px_rgba(0,0,0,0.18)]"
      style={{ width, background: color, rotate: `${tilt}deg` }}
    >
      <div className="mx-auto mt-[5px] h-px w-[78%] bg-black/15" />
    </div>
  )
}

// Đồ chất đống trên nóc tủ
function TopPile() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 bottom-[calc(100%+8px)]"
      exit={{ opacity: 0, y: -60, rotate: -8, transition: { duration: 0.45, ease: 'easeOut' } }}
    >
      <motion.div
        className="absolute bottom-0 left-[10%] flex w-[46%] flex-col items-center"
        style={{ transformOrigin: '50% 100%' }}
        animate={{ rotate: [0, -1.6, 1.2, -2.2, 1.6, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ClothIcon item={CLOTHES_BY_ID.hat} className="-mb-4 aspect-square w-16" style={{ rotate: '8deg' }} />
        <Folded color="#f4c9b5" width="72%" tilt={4} />
        <Folded color="#9fb59a" width="90%" tilt={-3} />
        <Folded color="#6d8fb3" width="82%" tilt={1.5} />
      </motion.div>
      <motion.div
        className="absolute -bottom-3 right-[12%] w-14"
        style={{ transformOrigin: '50% 80%' }}
        animate={{ rotate: [-8, -3, -10, -4, -8] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ClothIcon item={CLOTHES_BY_ID.sneaker} className="aspect-square w-14" />
      </motion.div>
    </motion.div>
  )
}

// Tay áo, đuôi khăn, dây lưng bị kẹt thò ra khe cửa
function Peeks() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
      aria-hidden="true"
    >
      <motion.svg
        viewBox="0 0 40 70"
        className="absolute w-[46px]"
        style={{ left: '50%', top: '24%', marginLeft: -6, transformOrigin: '6px 4px' }}
        animate={{ rotate: [10, 16, 7, 14, 10] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M2 2 L16 4 L26 60 L13 64 Z" fill="#dfe8f3" stroke="rgba(40,24,12,0.22)" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M12.3 60.1 L25.2 56.1" stroke="#6f86a6" strokeWidth="2.4" strokeLinecap="round" />
      </motion.svg>
      <motion.svg
        viewBox="0 0 30 80"
        className="absolute w-[34px]"
        style={{ left: '50%', top: '52%', marginLeft: -18, transformOrigin: '18px 2px' }}
        animate={{ rotate: [-6, 3, -8, 2, -6] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M8 1 L20 1 L25 66 L11 70 Z" fill="#cfa9d6" stroke="rgba(40,24,12,0.22)" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M9 22 H21.5 M10 44 H23.2" stroke="#7c5a86" strokeWidth="2" />
        <path d="M13 69.4v5 M17 68.3v5 M21 67.1v5" stroke="#cfa9d6" strokeWidth="1.6" strokeLinecap="round" />
      </motion.svg>
      <motion.svg
        viewBox="0 0 16 44"
        className="absolute w-[18px]"
        style={{ left: '50%', top: '76%', marginLeft: -3, transformOrigin: '3px 1px' }}
        animate={{ rotate: [4, -3, 6, -2, 4] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M1 1 L9 1 L12 40 L4 42 Z" fill="#7a5233" />
        <rect x="2.5" y="28" width="10" height="8" rx="1.5" fill="none" stroke="#d8ad57" strokeWidth="1.6" transform="rotate(-4 7.5 32)" />
      </motion.svg>
    </motion.div>
  )
}

// Vầng sáng mềm lúc tủ bung
function Flash({ width, height }) {
  const size = Math.max(width, height) * 1.5
  return (
    <motion.div
      className="pointer-events-none absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: (width - size) / 2,
        top: (height - size) / 2,
        background:
          'radial-gradient(circle, rgba(255,250,240,0.95) 0%, rgba(255,240,220,0.5) 30%, rgba(255,240,220,0) 65%)',
      }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: [0, 0.85, 0], scale: [0.3, 1.1, 1.4] }}
      transition={{ duration: 0.9, times: [0, 0.25, 1], ease: 'easeOut' }}
      exit={{ opacity: 0 }}
    />
  )
}

/**
 * phase: 'stuffed' | 'burst' | 'settle' | 'open' | 'auth'
 * animateIntro = false khi quay lại màn đăng nhập (ví dụ sau khi đăng xuất): tủ hiện sẵn ở trạng thái mở.
 */
export default function Wardrobe({ phase, animateIntro, width, height, children }) {
  const initial = animateIntro ? 'closed' : false

  return (
    <motion.div
      className="pointer-events-auto relative"
      style={{ width, height, transformOrigin: '50% 100%' }}
      variants={CABINET}
      initial={initial}
      animate={phase}
    >
      {/* Bóng đổ trên sàn */}
      <div className="pointer-events-none absolute -bottom-9 left-1/2 h-10 w-[118%] -translate-x-1/2 rounded-[50%] bg-black/20 blur-xl dark:bg-black/60" />

      {/* Chân, đế, thân, nóc */}
      <div className="absolute -bottom-[26px] left-7 h-4 w-7 rounded-b-md" style={{ background: 'var(--wood-deep)' }} />
      <div className="absolute -bottom-[26px] right-7 h-4 w-7 rounded-b-md" style={{ background: 'var(--wood-deep)' }} />
      <div className="wood-trim absolute -bottom-2.5 -left-2 -right-2 h-[18px] rounded-[8px]" />
      <div
        className="wood-frame absolute inset-0 rounded-[18px]"
        style={{ boxShadow: '0 40px 70px -32px var(--cloth-shadow), inset 0 0 0 1px rgba(255,255,255,0.08)' }}
      />
      <div className="wood-trim absolute -left-3 -right-3 -top-3 h-[22px] rounded-[10px] shadow-[0_6px_12px_-6px_rgba(0,0,0,0.45)]" />

      <AnimatePresence>{phase === 'stuffed' && <TopPile key="pile" />}</AnimatePresence>

      {/* Lòng tủ: nơi hiện lời chào và form đăng nhập */}
      <div className="lining absolute overflow-hidden rounded-[12px]" style={{ inset: FRAME }}>
        <div
          className="absolute left-5 right-5 top-6 h-[5px] rounded-full"
          style={{ background: 'linear-gradient(#efe9df, #a39b90)', boxShadow: '0 2px 3px rgba(0,0,0,0.25)' }}
        />
        <Hangers />
        <AnimatePresence>{phase === 'stuffed' && <Crammed key="crammed" />}</AnimatePresence>
        <div className="thin-scroll absolute inset-0 z-10 flex flex-col overflow-y-auto px-6 pb-5 pt-14">{children}</div>
      </div>

      {/* Hai cánh cửa xoay 3D quanh bản lề */}
      <div className="pointer-events-none absolute flex" style={{ inset: FRAME, perspective: 1800 }}>
        <Door side="left" phase={phase} initial={initial} />
        <Door side="right" phase={phase} initial={initial} />
      </div>

      <AnimatePresence>{phase === 'stuffed' && <Peeks key="peeks" />}</AnimatePresence>
      <AnimatePresence>{phase === 'burst' && <Flash key="flash" width={width} height={height} />}</AnimatePresence>
    </motion.div>
  )
}
