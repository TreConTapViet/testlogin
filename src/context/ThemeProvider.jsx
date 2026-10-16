import { useCallback, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import ThemeTransitionFx from '../components/ThemeTransitionFx'
import { switchTheme } from '../lib/themeTransition'
import { writeString } from '../lib/storage'
import { ThemeContext } from './contexts'

// index.html đã gắn class "dark" trước khi React chạy, nên lấy luôn trạng thái đó làm gốc
const getInitialTheme = () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)
  // Hiệu ứng đang chạy khi đổi giao diện: { id, to } hoặc null
  const [fx, setFx] = useState(null)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    // Class "dark" được đổi cùng lúc với React vẽ lại (không đợi useEffect) để không có khung hình lệch màu
    switchTheme(next, (animated) =>
      flushSync(() => {
        setTheme(next)
        if (animated) setFx({ id: Date.now(), to: next })
      }),
    )
    // Chỉ lưu khi người dùng tự chọn; chưa chọn thì đi theo cài đặt của máy
    writeString('theme', next)
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return (
    <ThemeContext value={value}>
      {children}
      <ThemeTransitionFx fx={fx} onDone={() => setFx(null)} />
    </ThemeContext>
  )
}
