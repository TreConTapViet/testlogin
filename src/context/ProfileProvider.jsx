import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadProfile, saveProfileData } from '../services/profileStore'
import { ProfileContext, useAuth } from './contexts'

/**
 * Hồ sơ của người dùng đang đăng nhập (chiều cao, cân nặng, BMI ẩn, phong cách...).
 * status: 'idle' (chưa đăng nhập) | 'loading' | 'ready' | 'error' (không tải được)
 */
export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const [state, setState] = useState({ uid: null, profile: null, status: 'idle' })

  useEffect(() => {
    if (!uid) return undefined
    let active = true
    loadProfile(uid)
      .then((profile) => {
        if (active) setState({ uid, profile, status: 'ready' })
      })
      .catch((error) => {
        console.warn('Chưa tải được hồ sơ:', error)
        if (active) setState({ uid, profile: null, status: 'error' })
      })
    return () => {
      active = false
    }
  }, [uid])

  // Dữ liệu của tài khoản khác (vừa đăng xuất/đổi tài khoản) không bao giờ lộ ra
  const isCurrent = state.uid === uid
  const profile = isCurrent ? state.profile : null
  const status = isCurrent ? state.status : uid ? 'loading' : 'idle'

  const saveProfile = useCallback(
    async (data) => {
      if (!uid) throw new Error('Chưa đăng nhập')
      await saveProfileData(uid, data)
      setState({ uid, profile: { ...data, updatedAt: new Date() }, status: 'ready' })
    },
    [uid],
  )

  const value = useMemo(() => ({ profile, status, saveProfile }), [profile, status, saveProfile])

  return <ProfileContext value={value}>{children}</ProfileContext>
}
