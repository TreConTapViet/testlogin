import { motion } from 'framer-motion'
import { useTheme } from '../../context/contexts'
import { cn } from '../../lib/cn'
import { MoonIcon, SunIcon } from '../icons'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Giao diện tối"
      title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      onClick={toggleTheme}
      className="glass relative h-11 w-[76px] shrink-0 cursor-pointer rounded-full"
    >
      <SunIcon className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-opacity', isDark ? 'opacity-40' : 'opacity-0')} />
      <MoonIcon className={cn('absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-opacity', isDark ? 'opacity-0' : 'opacity-40')} />
      <motion.span
        className={cn(
          'absolute left-1 top-1 grid h-[34px] w-[34px] place-items-center rounded-full shadow-md',
          isDark ? 'bg-[#2c2a38] text-[#e8e2ff]' : 'bg-white text-[#e2a01f]',
        )}
        initial={false}
        animate={{ x: isDark ? 32 : 0, rotate: isDark ? 0 : 90 }}
        transition={{ type: 'spring', stiffness: 480, damping: 32 }}
      >
        {isDark ? <MoonIcon className="h-[18px] w-[18px]" /> : <SunIcon className="h-[18px] w-[18px]" />}
      </motion.span>
    </button>
  )
}
