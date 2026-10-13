import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import { useAuth } from '../../context/contexts'
import { useDismiss } from '../../hooks/useDismiss'
import { LogoutIcon, Spinner } from '../icons'

export default function UserMenu({ user }) {
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const rootRef = useRef(null)

  const close = useCallback(() => setOpen(false), [])
  useDismiss(rootRef, open, close)

  // Array.from để không cắt đôi emoji/ký tự đặc biệt
  const initial = (Array.from((user.nickname || user.email || '?').trim())[0] ?? '?').toUpperCase()

  const handleSignOut = async () => {
    setBusy(true)
    try {
      await signOut()
    } catch {
      setBusy(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Tài khoản"
        className="glass flex h-11 cursor-pointer items-center gap-2 rounded-full pl-1.5 pr-3.5"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-sm font-semibold text-white">{initial}</span>
        )}
        <span className="hidden max-w-[120px] truncate text-sm font-medium md:block">{user.nickname}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="glass absolute right-0 top-[calc(100%+8px)] z-50 w-64 origin-top-right rounded-2xl p-2"
          >
            <div className="px-3 py-2">
              <p className="truncate font-medium">{user.nickname}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-line" />
            <button
              type="button"
              onClick={handleSignOut}
              disabled={busy}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-ink/5 disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? <Spinner className="h-4 w-4 animate-spin" /> : <LogoutIcon className="h-4 w-4" />}
              Đăng xuất
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
