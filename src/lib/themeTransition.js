// Đổi giao diện sáng/tối không giật:
// - Tắt mọi CSS transition trong lúc đổi (class "theme-switching") để chữ, nền, kính mờ đổi màu cùng một lúc.
// - Trình duyệt hỗ trợ View Transitions: chụp giao diện cũ, giao diện mới lộ dần từ phải sang trái
//   (keyframes "theme-reveal" trong index.css); lớp hiệu ứng sao/ánh sáng chạy cùng nhịp phía trên.
export const THEME_REVEAL_MS = 1150
// Đường cong giống cubic-bezier(0.65, 0, 0.35, 1) trong CSS
export const THEME_REVEAL_EASE = [0.65, 0, 0.35, 1]

export function switchTheme(next, commit) {
  const root = document.documentElement
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const apply = (animated) => {
    root.classList.add('theme-switching')
    root.classList.toggle('dark', next === 'dark')
    root.style.colorScheme = next
    commit(animated)
  }
  const release = () => root.classList.remove('theme-switching')

  if (reduced || typeof document.startViewTransition !== 'function') {
    // Không có View Transitions (hoặc người dùng giảm chuyển động): đổi ngay, vẫn không giật
    apply(!reduced)
    requestAnimationFrame(() => requestAnimationFrame(release))
    return
  }
  root.dataset.themeFx = next
  const transition = document.startViewTransition(() => apply(true))
  transition.finished.finally(() => {
    release()
    delete root.dataset.themeFx
  })
}
