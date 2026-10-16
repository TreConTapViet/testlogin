import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { BODY_BALANCE, GAUGE_STOPS, bodyBalanceOf, gaugePosition } from '../../services/bodyProfile'
import { LockIcon } from '../icons'

const BANDS = BODY_BALANCE.map((level, index) => {
  const start = index === 0 ? 0 : GAUGE_STOPS[index - 1]
  const end = GAUGE_STOPS[index] ?? 1
  return { ...level, center: (start + end) / 2 }
})
const GRADIENT = `linear-gradient(90deg, ${BANDS.map((band) => `${band.color} ${Math.round(band.center * 100)}%`).join(', ')})`

/** "Độ cân bằng cơ thể": chỉ hiện nhóm dáng người và vị trí trên thanh, không hiện con số BMI. */
export default function BodyBalanceGauge({ bmi }) {
  const level = bodyBalanceOf(bmi)
  return (
    <div>
      <div className="min-h-[76px]" aria-live="polite">
        {level ? (
          <>
            <p className="flex items-center gap-2.5 font-display text-[26px] leading-tight">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: level.color }} />
              {level.label}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{level.advice}</p>
          </>
        ) : (
          <p className="text-sm text-muted">Nhập chiều cao và cân nặng ở mục trên để xem độ cân bằng cơ thể của bạn.</p>
        )}
      </div>

      <div className="relative mt-6 h-3 rounded-full" style={{ background: GRADIENT, opacity: level ? 1 : 0.45 }}>
        {level && (
          <motion.span
            className="absolute top-1/2 h-6 w-6 rounded-full border-[3px] border-white shadow-md"
            style={{ background: level.color, marginLeft: -12, marginTop: -12 }}
            initial={false}
            animate={{ left: `${gaugePosition(bmi) * 100}%` }}
            transition={{ type: 'spring', stiffness: 140, damping: 20 }}
          />
        )}
      </div>
      <div className="relative mt-2 h-4 text-[11px] text-muted">
        {BANDS.map((band) => (
          <span
            key={band.id}
            className={cn('absolute -translate-x-1/2 whitespace-nowrap', level?.id === band.id && 'font-semibold text-ink')}
            style={{ left: `${band.center * 100}%` }}
          >
            {band.short}
          </span>
        ))}
      </div>

      <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted">
        <LockIcon className="mt-px h-3.5 w-3.5 shrink-0" />
        Chỉ số BMI được tính tự động và giữ kín: không hiển thị, chỉ giúp trợ lý AI và ma-nơ-canh hiểu vóc dáng của bạn.
      </p>
    </div>
  )
}
