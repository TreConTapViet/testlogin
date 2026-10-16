import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useEffectEvent, useRef } from 'react'

/** Hộp xác nhận nhỏ ở giữa màn hình (Esc hoặc bấm nền để quay lại). */
export default function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  const confirmRef = useRef(null)
  const cancel = useEffectEvent(() => onCancel())

  useEffect(() => {
    if (!open) return undefined
    confirmRef.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') cancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm"
          className="absolute inset-0 z-40 grid place-items-center bg-black/25 px-5 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onCancel()
          }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            className="glass w-full max-w-md rounded-3xl p-6 text-center shadow-2xl"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent/12 text-2xl text-accent" aria-hidden="true">
              ?
            </span>
            <h2 id="confirm-title" className="mt-4 font-display text-[22px] leading-snug">
              {title}
            </h2>
            <p id="confirm-message" className="mt-2 text-sm leading-relaxed text-muted">
              {message}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={onCancel}
                className="h-11 cursor-pointer rounded-xl border border-line px-5 text-sm font-medium transition-colors hover:border-accent/50"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={onConfirm}
                className="h-11 cursor-pointer rounded-xl bg-ink px-5 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
