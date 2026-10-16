import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../lib/firebase'
import { toAuthError } from '../services/authErrors'
import {
  demoGoogleSignIn,
  demoResetPassword,
  demoSignIn,
  demoSignOut,
  demoSignUp,
  demoUpdateAccount,
  getDemoSession,
} from '../services/mockAuth'
import { AuthContext } from './contexts'

const isDemo = !isFirebaseConfigured

function fromFirebaseUser(fbUser, nicknameHint) {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    nickname: fbUser.displayName || nicknameHint || fbUser.email?.split('@')[0] || 'bạn',
    photoURL: fbUser.photoURL,
    avatar: null,
    provider: fbUser.providerData.some((info) => info.providerId === 'google.com') ? 'google' : 'password',
  }
}

// Ghi hồ sơ lên Firestore mà không chặn giao diện: Firestore chưa bật thì đăng nhập vẫn chạy bình thường
function saveProfile(uid, data) {
  return setDoc(doc(db, 'users', uid), data, { merge: true }).catch((error) => {
    console.warn('Chưa ghi được hồ sơ lên Firestore:', error)
  })
}

// Mọi lỗi (Firebase hay demo) đều được đổi sang AuthError có thông báo tiếng Việt
async function guard(task) {
  try {
    return await task()
  } catch (error) {
    throw toAuthError(error)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (isDemo ? getDemoSession() : null))
  const [ready, setReady] = useState(isDemo)
  // Biệt danh vừa nhập lúc đăng ký: onAuthStateChanged có thể chạy trước khi updateProfile xong
  const nicknameHint = useRef(null)

  useEffect(() => {
    if (isDemo) return undefined
    let active = true
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setUser(null)
        setReady(true)
        return
      }
      setUser(fromFirebaseUser(fbUser, nicknameHint.current))
      setReady(true)
      // Biệt danh và avatar chuẩn nằm trong Firestore (người dùng tự đổi trong menu tài khoản)
      getDoc(doc(db, 'users', fbUser.uid))
        .then((snapshot) => {
          const data = snapshot.exists() ? snapshot.data() : {}
          if (active && (data.nickname || data.avatar)) {
            setUser((current) =>
              current?.uid === fbUser.uid
                ? { ...current, nickname: data.nickname || current.nickname, avatar: data.avatar ?? null }
                : current,
            )
          }
        })
        .catch(() => {
          // Firestore chưa sẵn sàng: giữ tên lấy từ tài khoản
        })
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const signUp = useCallback(
    ({ nickname, email, password }) =>
      guard(async () => {
        if (isDemo) {
          setUser(await demoSignUp({ nickname, email, password }))
          return
        }
        nicknameHint.current = nickname
        try {
          const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password)
          try {
            await updateProfile(fbUser, { displayName: nickname })
          } catch (error) {
            console.warn('Chưa cập nhật được tên hiển thị:', error)
          }
          setUser((current) => (current?.uid === fbUser.uid ? { ...current, nickname } : current))
          saveProfile(fbUser.uid, { nickname, email, provider: 'password', createdAt: serverTimestamp() })
        } finally {
          nicknameHint.current = null
        }
      }),
    [],
  )

  const signIn = useCallback(
    ({ email, password }) =>
      guard(async () => {
        if (isDemo) {
          setUser(await demoSignIn({ email, password }))
          return
        }
        await signInWithEmailAndPassword(auth, email, password)
      }),
    [],
  )

  const signInWithGoogle = useCallback(
    () =>
      guard(async () => {
        if (isDemo) {
          setUser(await demoGoogleSignIn())
          return
        }
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        const { user: fbUser } = await signInWithPopup(auth, provider)
        // Lần đầu vào bằng Google: tạo hồ sơ với biệt danh là tên tài khoản Google
        getDoc(doc(db, 'users', fbUser.uid))
          .then((snapshot) => {
            if (snapshot.exists()) return undefined
            return saveProfile(fbUser.uid, {
              nickname: fbUser.displayName || fbUser.email?.split('@')[0] || 'bạn',
              email: fbUser.email,
              provider: 'google',
              createdAt: serverTimestamp(),
            })
          })
          .catch(() => {
            // Firestore chưa sẵn sàng: bỏ qua, lần sau đăng nhập sẽ thử lại
          })
      }),
    [],
  )

  const resetPassword = useCallback(
    (email) =>
      guard(async () => {
        if (isDemo) {
          await demoResetPassword()
          return
        }
        await sendPasswordResetEmail(auth, email)
      }),
    [],
  )

  const signOut = useCallback(
    () =>
      guard(async () => {
        if (isDemo) {
          demoSignOut()
          setUser(null)
          return
        }
        await firebaseSignOut(auth)
      }),
    [],
  )

  // Đổi biệt danh / avatar của tài khoản đang đăng nhập (patch: { nickname?, avatar? })
  const uid = user?.uid
  const updateAccount = useCallback(
    async (patch) => {
      if (!uid) throw new Error('Chưa đăng nhập')
      if (isDemo) {
        setUser(demoUpdateAccount(patch))
        return
      }
      await setDoc(doc(db, 'users', uid), patch, { merge: true })
      setUser((current) => (current?.uid === uid ? { ...current, ...patch } : current))
    },
    [uid],
  )

  const value = useMemo(
    () => ({ user, ready, isDemo, signUp, signIn, signInWithGoogle, resetPassword, signOut, updateAccount }),
    [user, ready, signUp, signIn, signInWithGoogle, resetPassword, signOut, updateAccount],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
