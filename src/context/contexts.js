import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)
export const ThemeContext = createContext(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth phải được dùng bên trong <AuthProvider>')
  return value
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme phải được dùng bên trong <ThemeProvider>')
  return value
}
