import { useCallback, useEffect, useMemo, useState } from 'react'
import { writeString } from '../lib/storage'
import { ThemeContext } from './contexts'

// index.html đã gắn class "dark" trước khi React chạy, nên lấy luôn trạng thái đó làm gốc
const getInitialTheme = () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    // Chỉ lưu khi người dùng tự chọn; chưa chọn thì đi theo cài đặt của máy
    writeString('theme', next)
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext value={value}>{children}</ThemeContext>
}
