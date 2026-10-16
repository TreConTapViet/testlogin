import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

export function ColorDot({ swatch }) {
  return <span className="h-4 w-4 shrink-0 rounded-full border border-black/15" style={{ background: swatch }} />
}

/** Nhóm nút chọn nhiều (phong cách, màu sắc...). */
export default function ChipGroup({ label, options, selected, onToggle, renderIcon }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option.id)
        return (
          <motion.button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option.id)}
            whileTap={{ scale: 0.94 }}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors',
              active
                ? 'border-accent bg-accent text-white'
                : 'border-line bg-white/60 text-ink hover:border-accent/50 dark:bg-white/[0.04]',
            )}
          >
            {renderIcon?.(option)}
            {option.label}
          </motion.button>
        )
      })}
    </div>
  )
}
