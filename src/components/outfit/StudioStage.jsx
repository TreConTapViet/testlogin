import { animate, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'
import Mannequin from './Mannequin'
import { POSES } from './rig'

const VIEWS = [
  { label: 'Trước', angle: 0 },
  { label: 'Nghiêng', angle: 90 },
  { label: 'Sau', angle: 180 },
]

function PoseButtons({ pose, onPose, vertical }) {
  return POSES.map((option) => (
    <button
      key={option.id}
      type="button"
      role="radio"
      aria-checked={pose === option.id}
      onClick={() => onPose(option.id)}
      className={cn(
        'cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
        vertical && 'text-left',
        pose === option.id ? 'bg-accent text-white' : 'text-muted hover:text-ink',
      )}
    >
      {option.label}
    </button>
  ))
}

/** Khung ma-nơ-canh: kéo để xoay 0–180°, nút xem trước/nghiêng/sau, các dáng tạo kiểu. */
export default function StudioStage({ body, worn, hair, pose, onPose, turn, bounce, showHairHint = false, onOpenHair }) {
  const [angle, setAngle] = useState(() => Math.round(turn.get()))

  useEffect(() => turn.on('change', (value) => setAngle(Math.round(value))), [turn])

  const turnTo = (target) => animate(turn, target, { type: 'spring', stiffness: 90, damping: 18 })
  const showcase = () => animate(turn, [turn.get(), 180, 0], { duration: 2.6, ease: 'easeInOut' })

  return (
    <div className="relative flex h-full min-h-[460px] flex-col">
      <div className="relative min-h-0 flex-1">
        {/* Ánh đèn mờ phía sau ma-nơ-canh */}
        <div className="pointer-events-none absolute inset-x-[12%] bottom-[4%] top-[4%] rounded-full bg-[radial-gradient(closest-side,var(--glow-1),transparent)] opacity-80" />
        <Mannequin body={body} worn={worn} hair={hair} pose={pose} turn={turn} bounce={bounce} className="absolute inset-0" />
        {/* Vào phòng thử lần đầu: mời chọn kiểu tóc (không hỏi trước ở hồ sơ) */}
        {showHairHint && (
          <motion.button
            type="button"
            onClick={onOpenHair}
            className="glass absolute right-0 top-8 z-10 flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-accent"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, scale: [1, 1.05, 1] }}
            transition={{ opacity: { duration: 0.3 }, y: { duration: 0.3 }, scale: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M8.5 7.5 20 18M8.5 16.5 20 6" />
            </svg>
            Chọn kiểu tóc cho ma-nơ-canh
          </motion.button>
        )}
        <p className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-bg/60 px-3 py-1 text-[11px] text-muted backdrop-blur">
          Kéo ngang để xoay · {angle}°
        </p>
        {/* Dáng tạo kiểu: cột dọc bên trái khung (màn hình rộng) */}
        <div
          className="glass absolute left-0 top-1/2 hidden -translate-y-1/2 flex-col gap-0.5 rounded-2xl p-1 md:flex"
          role="radiogroup"
          aria-label="Dáng tạo kiểu"
        >
          <span className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Dáng</span>
          <PoseButtons pose={pose} onPose={onPose} vertical />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <div className="glass flex items-center gap-1 rounded-full p-1" role="group" aria-label="Góc nhìn">
          {VIEWS.map((view) => (
            <button
              key={view.angle}
              type="button"
              onClick={() => turnTo(view.angle)}
              className={cn(
                'cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                Math.abs(angle - view.angle) < 8 ? 'bg-ink text-bg' : 'text-muted hover:text-ink',
              )}
            >
              {view.label}
            </button>
          ))}
          <button type="button" onClick={showcase} className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10">
            Xoay 180°
          </button>
          <input
            type="range"
            min="0"
            max="180"
            value={angle}
            onChange={(event) => {
              turn.stop()
              turn.set(Number(event.target.value))
            }}
            aria-label="Góc xoay ma-nơ-canh"
            className="mx-2 w-24 accent-[var(--accent)]"
          />
        </div>
        {/* Màn hình hẹp: dáng tạo kiểu nằm dưới */}
        <div className="glass flex flex-wrap justify-center gap-1 rounded-3xl p-1 md:hidden" role="radiogroup" aria-label="Dáng tạo kiểu">
          <PoseButtons pose={pose} onPose={onPose} />
        </div>
      </div>
    </div>
  )
}
