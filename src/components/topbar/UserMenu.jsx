import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import { useAuth } from '../../context/contexts'
import { AVATARS } from '../../data/avatars'
import { useDismiss } from '../../hooks/useDismiss'
import { cn } from '../../lib/cn'
import ClothIcon from '../clothes/ClothIcon'
import { CLOTHES_BY_ID } from '../clothes/catalog'
import { LogoutIcon, Spinner } from '../icons'
import UserAvatar from '../UserAvatar'

const NICKNAME_MAX = 24

// Phần chỉnh sửa trong menu: gắn lại mỗi lần mở menu nên ô biệt danh luôn lấy giá trị mới nhất
function AccountEditor({ user }) {
  const { updateAccount } = useAuth()
  const [nickname, setNickname] = useState(user.nickname)
  const [status, setStatus] = useState(null) // { type: 'saving' | 'saved' | 'error', text? }
  const trimmed = nickname.trim()
  const unchanged = trimmed === user.nickname

  const save = async (patch, label) => {
    setStatus({ type: 'saving' })
    try {
      await updateAccount(patch)
      setStatus({ type: 'saved', text: label })
    } catch (error) {
      console.error('Chưa lưu được tài khoản:', error)
      setStatus({ type: 'error', text: 'Chưa lưu được, bạn thử lại nhé.' })
    }
  }

  const saveNickname = (event) => {
    event.preventDefault()
    if (!trimmed) {
      setStatus({ type: 'error', text: 'Biệt danh không được để trống.' })
      return
    }
    if (unchanged || status?.type === 'saving') return
    save({ nickname: trimmed }, 'Đã đổi biệt danh.')
  }

  return (
    <div className="px-3 pb-2">
      <form onSubmit={saveNickname}>
        <label htmlFor="account-nickname" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          Biệt danh
        </label>
        <div className="flex gap-2">
          <input
            id="account-nickname"
            value={nickname}
            onChange={(event) => {
              setNickname(event.target.value)
              setStatus(null)
            }}
            maxLength={NICKNAME_MAX}
            autoComplete="nickname"
            className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-white/75 px-3 text-sm text-ink outline-none transition-colors focus:border-accent/60 dark:bg-white/[0.06]"
          />
          <button
            type="submit"
            disabled={unchanged || !trimmed || status?.type === 'saving'}
            className="h-9 shrink-0 cursor-pointer rounded-lg bg-ink px-3 text-xs font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-40"
          >
            Lưu
          </button>
        </div>
      </form>

      <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Avatar</p>
          <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Chọn avatar">
            {AVATARS.map((option) => {
              const active = user.avatar === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={CLOTHES_BY_ID[option.id]?.label}
                  title={CLOTHES_BY_ID[option.id]?.label}
                  disabled={status?.type === 'saving'}
                  onClick={() => !active && save({ avatar: option.id }, 'Đã đổi avatar.')}
                  className={cn(
                    'grid aspect-square cursor-pointer place-items-center rounded-full transition-transform hover:scale-110 disabled:cursor-wait',
                    active && 'ring-2 ring-accent ring-offset-2 ring-offset-bg',
                  )}
                  style={{ background: option.bg }}
                >
                  <ClothIcon item={CLOTHES_BY_ID[option.id]} className="h-[70%] w-[70%]" />
                </button>
              )
            })}
          </div>
      </div>

      <p
        role="status"
        className={cn(
          'mt-2 min-h-4 text-xs',
          status?.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-300',
        )}
      >
        {status?.type === 'saving' ? <Spinner className="inline h-3.5 w-3.5 animate-spin text-muted" /> : status?.text}
      </p>
    </div>
  )
}

export default function UserMenu({ user }) {
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const rootRef = useRef(null)

  const close = useCallback(() => setOpen(false), [])
  useDismiss(rootRef, open, close)

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
        <UserAvatar user={user} className="h-8 w-8" />
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
            className="glass absolute right-0 top-[calc(100%+8px)] z-50 w-80 origin-top-right rounded-2xl p-2"
          >
            <div className="flex items-center gap-3 px-3 py-2">
              <UserAvatar user={user} className="h-12 w-12" initialClass="text-lg" />
              <div className="min-w-0">
                <p className="truncate font-medium">{user.nickname}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            </div>
            <div className="my-1 h-px bg-line" />
            <AccountEditor user={user} />
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
