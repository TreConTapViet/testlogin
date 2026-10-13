import { useEffect } from 'react'

// Đóng menu/popup khi bấm ra ngoài hoặc nhấn Esc
export function useDismiss(ref, open, onClose) {
  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClose()
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [ref, open, onClose])
}
