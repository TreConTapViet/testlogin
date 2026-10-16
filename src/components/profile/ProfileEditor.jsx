import { motion, useScroll, useTransform } from 'framer-motion'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useProfile } from '../../context/contexts'
import { COLOR_OPTIONS, GENDER_OPTIONS, STYLE_OPTIONS, labelsOf } from '../../data/styleOptions'
import { cn } from '../../lib/cn'
import { TOP_BAR_HEIGHT } from '../../lib/scene'
import {
  HEIGHT_RANGE,
  WEIGHT_RANGE,
  bodyBalanceById,
  bodyBalanceOf,
  calcBmi,
  parseMeasure,
  roundTo,
} from '../../services/bodyProfile'
import { profileErrorMessage, toDate } from '../../services/profileStore'
import { fallbackStyleProfile, generateStyleProfile } from '../../services/stylist'
import ClothIcon from '../clothes/ClothIcon'
import { CLOTHES, CLOTHES_BY_ID } from '../clothes/catalog'
import { ArrowRightIcon, ChevronDownIcon, LockIcon, Spinner } from '../icons'
import BodyBalanceGauge from './BodyBalanceGauge'
import ChipGroup, { ColorDot } from './ChipGroup'
import StyleSummary from './StyleSummary'
import UserAvatar from '../UserAvatar'

const EASE = [0.22, 1, 0.36, 1]
const DESCRIPTION_MAX = 500
const TOP_FADE = `linear-gradient(to bottom, transparent ${TOP_BAR_HEIGHT - 36}px, #000 ${TOP_BAR_HEIGHT + 20}px)`
const SAVED_AT = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })

const asList = (value) => (Array.isArray(value) ? value : [])

function initialForm(profile) {
  const input = profile?.styleInput ?? {}
  return {
    gender: profile?.gender ?? '',
    height: profile?.heightCm != null ? String(profile.heightCm) : '',
    weight: profile?.weightKg != null ? String(profile.weightKg) : '',
    styles: asList(input.styles),
    favoriteColors: asList(input.favoriteColors),
    avoidColors: asList(input.avoidColors),
    favoriteItems: asList(input.favoriteItems),
    description: typeof input.description === 'string' ? input.description : '',
  }
}

const inRange = (value, range) => value >= range.min && value <= range.max

// Giới tính, chiều cao, cân nặng là phần bắt buộc
function validateBody(form) {
  const errors = {}
  if (!form.gender) errors.gender = 'Hãy chọn giới tính.'
  if (!form.height.trim()) errors.height = 'Vui lòng nhập chiều cao.'
  else if (!inRange(parseMeasure(form.height), HEIGHT_RANGE))
    errors.height = `Chiều cao từ ${HEIGHT_RANGE.min} đến ${HEIGHT_RANGE.max} cm.`
  if (!form.weight.trim()) errors.weight = 'Vui lòng nhập cân nặng.'
  else if (!inRange(parseMeasure(form.weight), WEIGHT_RANGE))
    errors.weight = `Cân nặng từ ${WEIGHT_RANGE.min} đến ${WEIGHT_RANGE.max} kg.`
  return errors
}

// BMI xem trước ngay khi gõ (chỉ khi số đo hợp lệ)
function previewBmi(form) {
  const height = parseMeasure(form.height)
  const weight = parseMeasure(form.weight)
  return inRange(height, HEIGHT_RANGE) && inRange(weight, WEIGHT_RANGE) ? calcBmi(height, weight) : null
}

function Section({ rootRef, sectionRef, index, eyebrow, title, description, badge, children }) {
  return (
    <motion.section
      ref={sectionRef}
      className="glass rounded-[28px] p-6 md:p-8"
      initial={{ opacity: 0, y: 56 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ root: rootRef, once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            {String(index).padStart(2, '0')} · {eyebrow}
          </p>
          <h2 className="mt-2 font-display text-[28px] leading-tight">{title}</h2>
          {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
        </div>
        {badge && (
          <span className="shrink-0 rounded-full bg-accent/12 px-3 py-1 text-xs font-semibold text-accent">{badge}</span>
        )}
      </div>
      {children}
    </motion.section>
  )
}

function MeasureField({ id, label, unit, placeholder, value, onChange, error }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label} <span className="text-accent">*</span>
      </label>
      <div
        className={cn(
          'flex h-12 items-center gap-2 rounded-xl border bg-white/75 px-4 transition-colors dark:bg-white/[0.06]',
          error ? 'border-red-400/80' : 'border-line focus-within:border-accent/60',
        )}
      >
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted/60"
        />
        <span className="text-sm text-muted">{unit}</span>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Trang hồ sơ (trang duy nhất có cuộn): số đo bắt buộc, độ cân bằng cơ thể, phong cách.
 * Khi lưu, Gemini chuẩn hoá phong cách thành JSON rồi ghi vào users/{uid}.profile.
 */
export default function ProfileEditor({ user, profile, loadFailed, onBack, onOpenOutfit }) {
  const { saveProfile } = useProfile()
  const scrollRef = useRef(null)
  const contentRef = useRef(null)
  const lenisRef = useRef(null)
  const bodyRef = useRef(null)
  const formStartRef = useRef(null)
  const summaryRef = useRef(null)
  const [saved, setSaved] = useState(profile)
  const [form, setForm] = useState(() => initialForm(profile))
  const [errors, setErrors] = useState({})
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(null) // 'ai' | 'db' | null
  const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }

  // Cuộn mượt bằng Lenis, chỉ trong khung của trang hồ sơ
  useEffect(() => {
    const lenis = new Lenis({
      wrapper: scrollRef.current,
      content: contentRef.current,
      eventsTarget: scrollRef.current,
      autoRaf: true,
      lerp: 0.09,
    })
    lenisRef.current = lenis
    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // Phím tắt: hồ sơ đã lưu (không còn thay đổi chưa lưu) → bấm P để sang thẳng phòng phối đồ
  const shortcutReady = Boolean(onOpenOutfit && saved?.heightCm && saved?.weightKg) && !dirty && !saving
  const onShortcut = useEffectEvent((event) => {
    if (!shortcutReady || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
    if (event.key !== 'p' && event.key !== 'P') return
    const target = event.target
    if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
    event.preventDefault()
    onOpenOutfit()
  })
  useEffect(() => {
    const listener = (event) => onShortcut(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  const { scrollY, scrollYProgress } = useScroll({ container: scrollRef })
  const heroY = useTransform(scrollY, [0, 500], [0, -110])
  const heroOpacity = useTransform(scrollY, [0, 420], [1, 0.15])
  const driftSlow = useTransform(scrollY, [0, 700], [0, -140])
  const driftFast = useTransform(scrollY, [0, 700], [0, -260])

  const scrollToSection = (ref) => {
    const target = ref.current
    if (!target) return
    if (lenisRef.current) lenisRef.current.scrollTo(target, { offset: -(TOP_BAR_HEIGHT + 24) })
    else target.scrollIntoView({ behavior: 'smooth' })
  }

  const touch = () => {
    setDirty(true)
    setNotice(null)
  }

  const setMeasure = (field) => (event) => {
    const { value } = event.target
    setForm((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
    touch()
  }

  const chooseGender = (id) => {
    setForm((current) => ({ ...current, gender: id }))
    if (errors.gender) setErrors((current) => ({ ...current, gender: undefined }))
    touch()
  }

  // Một màu không thể vừa "thích" vừa "tránh"
  const toggle = (field, id, opposite) => {
    setForm((current) => {
      const has = current[field].includes(id)
      const next = { ...current, [field]: has ? current[field].filter((item) => item !== id) : [...current[field], id] }
      if (!has && opposite) next[opposite] = current[opposite].filter((item) => item !== id)
      return next
    })
    touch()
  }

  const handleSave = async () => {
    if (saving) return
    const nextErrors = validateBody(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setNotice({ type: 'error', text: 'Vui lòng điền đủ phần Thông tin cơ thể (bắt buộc).' })
      scrollToSection(bodyRef)
      return
    }

    const heightCm = roundTo(parseMeasure(form.height))
    const weightKg = roundTo(parseMeasure(form.weight))
    const bmi = calcBmi(heightCm, weightKg)
    const styleInput = {
      styles: form.styles,
      favoriteColors: form.favoriteColors,
      avoidColors: form.avoidColors,
      favoriteItems: form.favoriteItems,
      description: form.description.trim(),
    }
    // AI nhận nhãn tiếng Việt thay vì mã
    const labels = {
      gender: GENDER_OPTIONS.find((option) => option.id === form.gender)?.label ?? '',
      styles: labelsOf(STYLE_OPTIONS, styleInput.styles),
      favoriteColors: labelsOf(COLOR_OPTIONS, styleInput.favoriteColors),
      avoidColors: labelsOf(COLOR_OPTIONS, styleInput.avoidColors),
      favoriteItems: styleInput.favoriteItems.map((id) => CLOTHES_BY_ID[id]?.label).filter(Boolean),
      description: styleInput.description,
    }

    setNotice(null)
    setSaving('ai')
    let style
    let aiProcessed = true
    try {
      style = await generateStyleProfile(labels)
    } catch (error) {
      console.warn('AI chưa phân tích được phong cách, lưu theo lựa chọn của người dùng:', error)
      style = fallbackStyleProfile(labels)
      aiProcessed = false
    }

    const data = {
      gender: form.gender,
      heightCm,
      weightKg,
      bmi,
      bodyBalance: bodyBalanceOf(bmi).id,
      style,
      styleInput,
      aiProcessed,
    }
    setSaving('db')
    try {
      await saveProfile(data)
      setSaved({ ...data, updatedAt: new Date() })
      setDirty(false)
      setNotice({
        type: 'success',
        text:
          (aiProcessed
            ? 'Đã lưu! Trợ lý AI đã ghi nhớ phong cách của bạn.'
            : 'Đã lưu hồ sơ. AI chưa phân tích được phần mô tả lúc này, các lựa chọn của bạn vẫn được ghi nhớ.') +
          (onOpenOutfit ? ' Bấm “Đi phối đồ” (phím P) để vào phòng thử ngay.' : ''),
      })
      // Chờ mục tóm tắt hiện ra rồi cuộn tới
      setTimeout(() => scrollToSection(summaryRef), 150)
    } catch (error) {
      console.error('Lưu hồ sơ lỗi:', error)
      setNotice({ type: 'error', text: profileErrorMessage(error) })
    } finally {
      setSaving(null)
    }
  }

  const bmiPreview = previewBmi(form)
  const savedBalance = bodyBalanceById(saved?.bodyBalance)
  const savedGender = GENDER_OPTIONS.find((option) => option.id === saved?.gender)?.label
  const savedAt = toDate(saved?.updatedAt)

  const statusText =
    saving === 'ai'
      ? 'Trợ lý AI đang đọc và ghi nhớ phong cách của bạn…'
      : saving === 'db'
        ? 'Đang lưu hồ sơ…'
        : notice
          ? notice.text
          : dirty
            ? 'Bạn có thay đổi chưa lưu.'
            : savedAt
              ? `Đã lưu lúc ${SAVED_AT.format(savedAt)}.`
              : 'Điền giới tính, chiều cao, cân nặng (bắt buộc) rồi bấm Lưu hồ sơ.'

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5 } }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      {/* Thanh tiến trình cuộn */}
      <motion.div
        className="absolute inset-x-0 z-30 h-[3px] origin-left bg-accent"
        style={{ top: TOP_BAR_HEIGHT, scaleX: scrollYProgress }}
      />

      {/* Nội dung mờ dần khi cuộn vào dưới thanh trên cùng */}
      <div ref={scrollRef} className="thin-scroll absolute inset-0 overflow-y-auto" style={{ maskImage: TOP_FADE, WebkitMaskImage: TOP_FADE }}>
        <div ref={contentRef}>
          {/* ---------- Phần mở đầu ---------- */}
          <section
            className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center"
            style={{ paddingTop: TOP_BAR_HEIGHT }}
          >
            <button
              type="button"
              onClick={onBack}
              className="glass absolute left-5 z-10 flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink md:left-8"
              style={{ top: TOP_BAR_HEIGHT + 12 }}
            >
              <ArrowRightIcon className="h-4 w-4 rotate-180" />
              Trang chính
            </button>

            <motion.div className="pointer-events-none absolute left-[9%] top-[24%] w-24" style={{ y: driftSlow, rotate: -12 }}>
              <ClothIcon item={CLOTHES_BY_ID.hat} className="aspect-square w-full" />
            </motion.div>
            <motion.div className="pointer-events-none absolute right-[10%] top-[28%] w-20" style={{ y: driftFast, rotate: 10 }}>
              <ClothIcon item={CLOTHES_BY_ID.handbag} className="aspect-square w-full" />
            </motion.div>
            <motion.div className="pointer-events-none absolute bottom-[16%] left-[16%] w-20" style={{ y: driftFast, rotate: 8 }}>
              <ClothIcon item={CLOTHES_BY_ID.sneaker} className="aspect-square w-full" />
            </motion.div>
            <motion.div className="pointer-events-none absolute bottom-[18%] right-[15%] w-20" style={{ y: driftSlow, rotate: -8 }}>
              <ClothIcon item={CLOTHES_BY_ID.scarf} className="aspect-square w-full" />
            </motion.div>

            <motion.div className="relative flex flex-col items-center" style={{ y: heroY, opacity: heroOpacity }}>
              <UserAvatar user={user} className="h-24 w-24 shadow-lg" initialClass="font-display text-4xl font-normal" />
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-accent">Hồ sơ của bạn</p>
              <h1 className="mt-3 font-display text-5xl leading-tight md:text-6xl">{user.nickname}</h1>
              <p className="mt-2 text-sm text-muted">{user.email}</p>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
                <LockIcon className="h-3.5 w-3.5" /> Thông tin này chỉ mình bạn xem được.
              </p>

              {saved ? (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {[savedGender, savedBalance?.label, ...asList(saved.style?.styles).slice(0, 3)].filter(Boolean).map((tag) => (
                    <span key={tag} className="glass rounded-full px-3 py-1.5 text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">
                  Bạn chưa có hồ sơ. Cập nhật số đo và phong cách để trợ lý AI gợi ý trang phục chuẩn hơn nhé.
                </p>
              )}

              <button
                type="button"
                onClick={() => scrollToSection(formStartRef)}
                className="mt-10 flex cursor-pointer flex-col items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-ink"
              >
                {saved ? 'Cuộn xuống để xem và chỉnh sửa' : 'Cuộn xuống để cập nhật hồ sơ'}
                <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
                  <ChevronDownIcon className="h-5 w-5" />
                </motion.span>
              </button>
            </motion.div>
          </section>

          {/* ---------- Các mục của hồ sơ ---------- */}
          <div ref={formStartRef} className="mx-auto flex max-w-3xl flex-col gap-8 px-5">
            {loadFailed && (
              <p className="rounded-2xl bg-amber-500/12 px-5 py-4 text-sm text-amber-800 dark:text-amber-200">
                Chưa tải được hồ sơ đã lưu (có thể do mất kết nối). Nếu lưu bây giờ, hồ sơ mới sẽ thay cho hồ sơ cũ.
              </p>
            )}

            <Section
              rootRef={scrollRef}
              sectionRef={bodyRef}
              index={1}
              eyebrow="Thông tin cơ thể"
              title="Số đo của bạn"
              description="Giúp trợ lý AI và ma-nơ-canh hiểu vóc dáng của bạn."
              badge="Bắt buộc"
            >
              <p className="mb-2 text-sm font-medium">
                Giới tính <span className="text-accent">*</span>
              </p>
              <div role="radiogroup" aria-label="Giới tính" className="grid grid-cols-3 gap-2">
                {GENDER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={form.gender === option.id}
                    onClick={() => chooseGender(option.id)}
                    className={cn(
                      'h-12 cursor-pointer rounded-xl border text-sm font-medium transition-colors',
                      form.gender === option.id
                        ? 'border-accent bg-accent text-white'
                        : 'border-line bg-white/60 hover:border-accent/50 dark:bg-white/[0.04]',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors.gender && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.gender}</p>}

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <MeasureField
                  id="profile-height"
                  label="Chiều cao"
                  unit="cm"
                  placeholder="Ví dụ: 165"
                  value={form.height}
                  onChange={setMeasure('height')}
                  error={errors.height}
                />
                <MeasureField
                  id="profile-weight"
                  label="Cân nặng"
                  unit="kg"
                  placeholder="Ví dụ: 55"
                  value={form.weight}
                  onChange={setMeasure('weight')}
                  error={errors.weight}
                />
              </div>
            </Section>

            <Section
              rootRef={scrollRef}
              index={2}
              eyebrow="Độ cân bằng cơ thể"
              title="Vóc dáng hiện tại"
              description="Tính tự động từ chiều cao và cân nặng."
            >
              <BodyBalanceGauge bmi={bmiPreview} />
            </Section>

            <Section
              rootRef={scrollRef}
              index={3}
              eyebrow="Phong cách"
              title="Gu ăn mặc của bạn"
              description="Chọn bao nhiêu tuỳ thích."
            >
              <ChipGroup
                label="Phong cách yêu thích"
                options={STYLE_OPTIONS}
                selected={form.styles}
                onToggle={(id) => toggle('styles', id)}
              />
            </Section>

            <Section rootRef={scrollRef} index={4} eyebrow="Màu sắc" title="Màu bạn thích và muốn tránh">
              <p className="mb-3 text-sm font-medium">Màu bạn thích</p>
              <ChipGroup
                label="Màu bạn thích"
                options={COLOR_OPTIONS}
                selected={form.favoriteColors}
                onToggle={(id) => toggle('favoriteColors', id, 'avoidColors')}
                renderIcon={(option) => <ColorDot swatch={option.swatch} />}
              />
              <p className="mb-3 mt-6 text-sm font-medium">Màu bạn muốn tránh</p>
              <ChipGroup
                label="Màu bạn muốn tránh"
                options={COLOR_OPTIONS}
                selected={form.avoidColors}
                onToggle={(id) => toggle('avoidColors', id, 'favoriteColors')}
                renderIcon={(option) => <ColorDot swatch={option.swatch} />}
              />
            </Section>

            <Section
              rootRef={scrollRef}
              index={5}
              eyebrow="Món đồ"
              title="Món bạn hay mặc"
              description="Chạm để chọn những món bạn thích dùng nhất."
            >
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {CLOTHES.map((item) => {
                  const active = form.favoriteItems.includes(item.id)
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle('favoriteItems', item.id)}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.96 }}
                      className={cn(
                        'relative flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-colors',
                        active ? 'border-accent bg-accent/10' : 'border-line bg-white/50 hover:border-accent/40 dark:bg-white/[0.03]',
                      )}
                    >
                      <ClothIcon item={item} className="h-12 w-12" />
                      <span className="text-[11px] leading-tight">{item.label}</span>
                      {active && (
                        <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-accent text-[10px] text-white">
                          ✓
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </Section>

            <Section
              rootRef={scrollRef}
              index={6}
              eyebrow="Kể thêm cho AI"
              title="Điều gì làm nên phong cách của bạn?"
              description="Không bắt buộc. Viết tự nhiên như đang kể cho stylist nghe."
            >
              <textarea
                data-lenis-prevent
                spellCheck={false}
                value={form.description}
                onChange={(event) => {
                  const { value } = event.target
                  setForm((current) => ({ ...current, description: value }))
                  touch()
                }}
                maxLength={DESCRIPTION_MAX}
                rows={5}
                aria-label="Mô tả thêm về phong cách"
                placeholder="Ví dụ: Mình thích mặc rộng rãi, hay đi xe máy nên ưu tiên quần dài; không thích đồ bó và màu quá chói…"
                className="w-full resize-none rounded-2xl border border-line bg-white/75 p-4 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent/60 dark:bg-white/[0.06]"
              />
              <div className="mt-2 flex justify-between gap-4 text-xs text-muted">
                <span className="shrink-0 tabular-nums">
                  {form.description.length}/{DESCRIPTION_MAX}
                </span>
              </div>
            </Section>

            {saved?.style && (
              <Section
                rootRef={scrollRef}
                sectionRef={summaryRef}
                index={7}
                eyebrow="Tủ Đồ đã ghi nhớ"
                title="Hồ sơ phong cách của bạn"
                badge={saved.aiProcessed ? 'Phân tích bởi AI' : null}
              >
                <StyleSummary style={saved.style} />
              </Section>
            )}
          </div>

          {/* ---------- Thanh lưu dính dưới đáy ---------- */}
          {/* Màn hình hẹp: chừa góc phải cho bong bóng trợ lý AI để không che nút lưu */}
          <div className="pointer-events-none sticky bottom-5 z-20 mt-10 px-5 pb-5 max-md:pr-[92px]">
            <div className="glass pointer-events-auto mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
              <p
                role="status"
                className={cn(
                  'min-w-0 flex-1 text-sm',
                  notice?.type === 'error' && 'text-red-600 dark:text-red-400',
                  notice?.type === 'success' && 'text-emerald-700 dark:text-emerald-300',
                  !notice && 'text-muted',
                )}
              >
                {statusText}
              </p>
              {shortcutReady && (
                <motion.button
                  type="button"
                  onClick={onOpenOutfit}
                  aria-keyshortcuts="P"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(194,96,63,0.8)] transition-opacity hover:opacity-90"
                >
                  Đi phối đồ
                  <kbd className="rounded-md bg-white/20 px-1.5 py-0.5 font-sans text-[11px]">P</kbd>
                </motion.button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving !== null}
                className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-ink px-5 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
              >
                {saving && <Spinner className="h-4 w-4 animate-spin" />}
                {saving === 'ai' ? 'AI đang ghi nhớ…' : saving === 'db' ? 'Đang lưu…' : 'Lưu hồ sơ'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
