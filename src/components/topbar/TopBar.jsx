import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../../context/contexts'
import { TOP_BAR_HEIGHT } from '../../lib/scene'
import Logo from '../Logo'
import ThemeToggle from './ThemeToggle'
import UserMenu from './UserMenu'
import WeatherBar from './WeatherBar'

export default function TopBar({ visible }) {
  const { user } = useAuth()

  return (
    <AnimatePresence>
      {visible && (
        <motion.header
          key="topbar"
          className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-end gap-4 px-4 sm:justify-between md:px-8"
          style={{ height: TOP_BAR_HEIGHT }}
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Màn hình hẹp: ẩn logo để thanh thời tiết, nút giao diện và tài khoản vừa một hàng */}
          <Logo className="pointer-events-auto hidden sm:flex" />
          <div className="pointer-events-auto flex items-center gap-2 md:gap-2.5">
            <WeatherBar />
            <ThemeToggle />
            {user && <UserMenu user={user} />}
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  )
}
