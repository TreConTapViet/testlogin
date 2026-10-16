import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)
export const ThemeContext = createContext(null)
export const CityContext = createContext(null)
export const ProfileContext = createContext(null)

export function useProfile() {
  const value = useContext(ProfileContext)
  if (!value) throw new Error('useProfile phải được dùng bên trong <ProfileProvider>')
  return value
}

export function useCity() {
  const value = useContext(CityContext)
  if (!value) throw new Error('useCity phải được dùng bên trong <CityProvider>')
  return value
}

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
