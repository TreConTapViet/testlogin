import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { useAuth } from '../../context/contexts'
import { cn } from '../../lib/cn'
import { EyeIcon, EyeOffIcon, GoogleIcon, LockIcon, MailIcon, Spinner, UserIcon } from '../icons'
import Field from './Field'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const NICKNAME_MAX = 24
const PASSWORD_MIN = 6
const FIELD_ORDER = ['nickname', 'email', 'password']

const MODES = [
  { id: 'login', label: 'Đăng nhập' },
  { id: 'register', label: 'Đăng ký' },
]

const COPY = {
  login: { title: 'Chào mừng trở lại', subtitle: 'Đăng nhập để mở tủ đồ của bạn.', submit: 'Đăng nhập' },
  register: { title: 'Tạo tủ đồ của bạn', subtitle: 'Chỉ mất vài giây để bắt đầu phối đồ.', submit: 'Tạo tài khoản' },
}

function validate(mode, values) {
  const errors = {}
  if (mode === 'register') {
    const nickname = values.nickname.trim()
    if (!nickname) errors.nickname = 'Hãy đặt một biệt danh để tủ đồ chào bạn nhé.'
    else if (nickname.length > NICKNAME_MAX) errors.nickname = `Biệt danh tối đa ${NICKNAME_MAX} ký tự.`
  }
  const email = values.email.trim()
  if (!email) errors.email = 'Vui lòng nhập email.'
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Email chưa đúng định dạng.'
  if (!values.password) errors.password = 'Vui lòng nhập mật khẩu.'
  else if (mode === 'register' && values.password.length < PASSWORD_MIN) {
    errors.password = `Mật khẩu cần ít nhất ${PASSWORD_MIN} ký tự.`
  }
  return errors
}

export default function AuthPanel() {
  const { signIn, signUp, signInWithGoogle, resetPassword, isDemo } = useAuth()
  const [mode, setMode] = useState('login')
  const [values, setValues] = useState({ nickname: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null) // { type: 'error' | 'info', text }
  const [pending, setPending] = useState(null) // 'submit' | 'google' | 'reset' | null
  const [showPassword, setShowPassword] = useState(false)
  const nicknameRef = useRef(null)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const focusedOnce = useRef(false)

  const busy = pending !== null
  const copy = COPY[mode]

  const updateField = (field) => (event) => {
    const { value } = event.target
    setValues((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
    if (message?.type === 'error') setMessage(null)
  }

  const switchMode = (next) => {
    if (next === mode || busy) return
    setMode(next)
    setErrors({})
    setMessage(null)
  }

  const showError = (error) => {
    if (!error.silent) setMessage({ type: 'error', text: error.message })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (busy) return
    const nextErrors = validate(mode, values)
    setErrors(nextErrors)
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field])
    if (firstInvalid) {
      const refs = { nickname: nicknameRef, email: emailRef, password: passwordRef }
      refs[firstInvalid].current?.focus()
      return
    }

    setMessage(null)
    setPending('submit')
    const email = values.email.trim().toLowerCase()
    try {
      if (mode === 'login') await signIn({ email, password: values.password })
      else await signUp({ nickname: values.nickname.trim(), email, password: values.password })
      // Thành công: App tự chuyển sang trang chính, giữ trạng thái "đang xử lý" cho tới lúc đó
    } catch (error) {
      setPending(null)
      showError(error)
    }
  }

  const handleGoogle = async () => {
    if (busy) return
    setMessage(null)
    setPending('google')
    try {
      await signInWithGoogle()
    } catch (error) {
      setPending(null)
      showError(error)
    }
  }

  const handleForgotPassword = async () => {
    if (busy) return
    const email = values.email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(email)) {
      setErrors((current) => ({ ...current, email: 'Nhập email của bạn để nhận liên kết đặt lại mật khẩu.' }))
      emailRef.current?.focus()
      return
    }
    setMessage(null)
    setPending('reset')
    try {
      await resetPassword(email)
      setMessage({
        type: 'info',
        text: isDemo
          ? 'Chế độ demo chưa gửi được email. Hãy kết nối Firebase để dùng tính năng này.'
          : `Nếu ${email} đã đăng ký, bạn sẽ nhận được thư đặt lại mật khẩu trong ít phút.`,
      })
    } catch (error) {
      showError(error)
    } finally {
      setPending(null)
    }
  }

  return (
    <motion.div
      className="mx-auto my-auto flex w-full max-w-[340px] flex-col"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
      onAnimationComplete={() => {
        if (focusedOnce.current) return
        focusedOnce.current = true
        emailRef.current?.focus({ preventScroll: true })
      }}
    >
      <div
        role="tablist"
        aria-label="Chọn đăng nhập hoặc đăng ký"
        className="relative grid grid-cols-2 rounded-full bg-ink/[0.06] p-1"
      >
        {/* Viên trượt dùng x thay cho layoutId: không bị lệch khi form được gắn lại sau lúc đăng xuất */}
        <motion.span
          aria-hidden="true"
          className="absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm dark:bg-white/[0.12]"
          initial={false}
          animate={{ x: mode === 'login' ? '0%' : '100%' }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            onClick={() => switchMode(item.id)}
            className={cn(
              'relative h-9 cursor-pointer rounded-full text-sm font-medium transition-colors',
              mode === item.id ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          className="mt-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          <h2 className="font-display text-[26px] leading-tight">{copy.title}</h2>
          <p className="mt-1 text-[13px] text-muted">{copy.subtitle}</p>
        </motion.div>
      </AnimatePresence>

      <form noValidate onSubmit={handleSubmit} className="mt-4 flex flex-col">
        <AnimatePresence initial={false}>
          {mode === 'register' && (
            <motion.div
              key="nickname"
              className="overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Field
                ref={nicknameRef}
                id="auth-nickname"
                name="nickname"
                autoComplete="nickname"
                placeholder="Biệt danh của bạn"
                aria-label="Biệt danh"
                maxLength={40}
                value={values.nickname}
                onChange={updateField('nickname')}
                error={errors.nickname}
                icon={<UserIcon className="h-[18px] w-[18px]" />}
                className="pb-2.5"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Field
          ref={emailRef}
          id="auth-email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="Email của bạn"
          aria-label="Email"
          value={values.email}
          onChange={updateField('email')}
          error={errors.email}
          icon={<MailIcon className="h-[18px] w-[18px]" />}
          className="pb-2.5"
        />

        <Field
          ref={passwordRef}
          id="auth-password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder={mode === 'login' ? 'Mật khẩu' : `Mật khẩu (ít nhất ${PASSWORD_MIN} ký tự)`}
          aria-label="Mật khẩu"
          value={values.password}
          onChange={updateField('password')}
          error={errors.password}
          icon={<LockIcon className="h-[18px] w-[18px]" />}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="shrink-0 cursor-pointer rounded-md p-1 text-muted transition-colors hover:text-ink"
            >
              {showPassword ? <EyeOffIcon className="h-[18px] w-[18px]" /> : <EyeIcon className="h-[18px] w-[18px]" />}
            </button>
          }
        />

        {mode === 'login' && (
          <div className="mt-1.5 flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={busy}
              className="cursor-pointer text-xs text-muted transition-colors hover:text-accent disabled:cursor-wait"
            >
              {pending === 'reset' ? 'Đang gửi…' : 'Quên mật khẩu?'}
            </button>
          </div>
        )}

        <AnimatePresence>
          {message && (
            <motion.p
              key={message.text}
              role={message.type === 'error' ? 'alert' : 'status'}
              className={cn(
                'mt-3 rounded-xl px-3 py-2 text-xs leading-relaxed',
                message.type === 'error'
                  ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                  : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
              )}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {message.text}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={busy}
          className="mt-4 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        >
          {pending === 'submit' && <Spinner className="h-4 w-4 animate-spin" />}
          {copy.submit}
        </button>
      </form>

      <div className="my-3.5 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted">
        <span className="h-px flex-1 bg-line" />
        hoặc
        <span className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="flex h-11 cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-line bg-white/80 text-sm font-medium text-ink transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-70 dark:bg-white/[0.06] dark:hover:bg-white/10"
      >
        {pending === 'google' ? <Spinner className="h-[18px] w-[18px] animate-spin" /> : <GoogleIcon className="h-[18px] w-[18px]" />}
        Tiếp tục với Google
      </button>

      {isDemo && (
        <p className="mt-3 text-center text-[11px] text-muted" title="Chưa kết nối Firebase">
          Chế độ demo: tài khoản chỉ lưu trên trình duyệt này.
        </p>
      )}
    </motion.div>
  )
}
