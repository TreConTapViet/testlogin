import { AnimatePresence, motion, useMotionValue } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRightIcon, HangerIcon } from '../components/icons'
import ContextForm from '../components/outfit/ContextForm'
import Mannequin from '../components/outfit/Mannequin'
import OutfitEntrance from '../components/outfit/OutfitEntrance'
import { bodyFromProfile } from '../components/outfit/rig'
import Studio from '../components/outfit/Studio'
import { useCity, useProfile } from '../context/contexts'
import { seasonFromWeather } from '../data/outfitContexts'
import { useWeather } from '../hooks/useWeather'
import { TOP_BAR_HEIGHT } from '../lib/scene'
import { readString, writeString } from '../lib/storage'
import { bodyBalanceById } from '../services/bodyProfile'
import { contextErrorMessage, loadContexts, normalizeContext, saveContext } from '../services/contextStore'
import { loadHair } from '../services/hairStore'

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
}

function Loading() {
  return (
    <motion.div className="absolute inset-0 grid place-items-center" {...fade}>
      <motion.span
        className="glass grid h-16 w-16 place-items-center rounded-full"
        animate={{ opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      >
        <HangerIcon className="h-7 w-7 text-accent" />
      </motion.span>
    </motion.div>
  )
}

// Chưa có số đo thì ma-nơ-canh chưa có vóc dáng: mời cập nhật hồ sơ trước
function NeedProfile({ onOpenProfile, onBack }) {
  return (
    <motion.div className="absolute inset-0 grid place-items-center px-6" style={{ paddingTop: TOP_BAR_HEIGHT }} {...fade}>
      <div className="glass max-w-md rounded-[28px] p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/12 text-accent">
          <HangerIcon className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-[28px] leading-tight">Ma-nơ-canh chưa biết vóc dáng của bạn</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Lưu hồ sơ (giới tính, chiều cao, cân nặng) để ma-nơ-canh có đúng form người và quần áo vừa vặn với bạn nhé.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <button type="button" onClick={onBack} className="h-11 cursor-pointer rounded-xl border border-line px-5 text-sm font-medium hover:border-accent/50">
            Về trang chính
          </button>
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-ink px-5 text-sm font-semibold text-bg hover:opacity-90"
          >
            Cập nhật hồ sơ <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Đầu phòng thử: câu hỏi hoàn cảnh bên trái, ma-nơ-canh (chưa mặc gì) đứng chờ bên phải
function ContextStage({ user, profile, initial, contexts, weatherHint, saving, notice, onSubmit, onSuggestAll, onBack }) {
  const body = useMemo(() => bodyFromProfile(profile), [profile])
  const turn = useMotionValue(0)
  // Ma-nơ-canh đang chờ cũng để kiểu tóc đã chọn lần trước (hoặc kiểu mặc định)
  const [hair] = useState(() => loadHair(user.uid, profile.gender).hair)
  const balance = bodyBalanceById(profile.bodyBalance)
  return (
    <motion.div className="absolute inset-0" style={{ paddingTop: TOP_BAR_HEIGHT }} {...fade}>
      <button
        type="button"
        onClick={onBack}
        className="glass absolute left-5 z-10 flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink md:left-8"
        style={{ top: TOP_BAR_HEIGHT + 12 }}
      >
        <ArrowRightIcon className="h-4 w-4 rotate-180" />
        Trang chính
      </button>
      <div className="mx-auto grid h-full max-w-[1120px] items-center gap-6 px-5 pb-6 pt-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:pt-14">
        <div className="flex max-h-full min-h-0 flex-col">
          <ContextForm
            nickname={user.nickname}
            initial={initial}
            history={contexts.history}
            weatherHint={weatherHint}
            saving={saving}
            onSubmit={onSubmit}
            onSuggestAll={onSuggestAll}
          />
          {notice && <p className="mt-2 text-center text-xs text-amber-700 dark:text-amber-300">{notice}</p>}
        </div>
        <div className="relative hidden h-full max-h-[620px] min-h-[420px] lg:block" aria-label="Ma-nơ-canh của bạn">
          <div className="pointer-events-none absolute inset-x-6 bottom-10 top-10 rounded-full bg-[radial-gradient(closest-side,var(--glow-2),transparent)]" />
          <Mannequin body={body} worn={{}} hair={hair} pose="chong-hong" turn={turn} className="absolute inset-x-0 bottom-12 top-0" />
          <p className="absolute inset-x-0 bottom-2 text-center text-xs text-muted">
            Ma-nơ-canh của bạn{balance ? ` · ${balance.label.toLowerCase()}` : ''} · đang chờ đồ
          </p>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Phòng phối đồ: cảnh vào cửa hàng → câu hỏi hoàn cảnh (lưu lại) → phòng phối với ma-nơ-canh.
 * Nhận user qua props để hiệu ứng thoát vẫn có dữ liệu khi đăng xuất.
 */
export default function OutfitPage({ user, onBack, onOpenProfile }) {
  const { profile, status } = useProfile()
  const { city } = useCity()
  const { data: weather } = useWeather(city)
  const visitedKey = `tudo:outfit-visited:${user.uid}`
  const [returning] = useState(() => readString(visitedKey) === '1')
  const [stage, setStage] = useState('entrance')
  const [contexts, setContexts] = useState({ current: null, history: [] })
  const [session, setSession] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const hasBody = Boolean(profile?.heightCm && profile?.weightKg)

  // Hoàn cảnh đã lưu (để chọn lại nhanh)
  useEffect(() => {
    let active = true
    loadContexts(user.uid)
      .then((saved) => {
        if (active) setContexts(saved)
      })
      .catch((error) => console.warn('Chưa tải được hoàn cảnh đã lưu:', error))
    return () => {
      active = false
    }
  }, [user.uid])

  const enter = () => {
    writeString(visitedKey, '1')
    setStage('context')
  }

  const submitContext = async (form) => {
    setSaving(true)
    setNotice(null)
    try {
      setContexts(await saveContext(user.uid, form, contexts.history))
    } catch (error) {
      console.error('Lưu hoàn cảnh lỗi:', error)
      setNotice(contextErrorMessage(error))
    } finally {
      setSaving(false)
    }
    setSession({ context: normalizeContext(form), mode: 'context', key: Date.now() })
    setStage('studio')
  }

  const suggestAll = () => {
    setSession({ context: null, mode: 'all', key: Date.now() })
    setStage('studio')
  }

  const weatherHint = weather ? { season: seasonFromWeather(weather.temp), text: `Hôm nay ở ${city.name} ${weather.temp}°C` } : null

  let content
  if (status === 'loading') content = <Loading key="loading" />
  else if (!hasBody) content = <NeedProfile key="need-profile" onOpenProfile={onOpenProfile} onBack={onBack} />
  else if (stage === 'entrance') content = <OutfitEntrance key="entrance" nickname={user.nickname} returning={returning} onDone={enter} />
  else if (stage === 'context' || !session)
    content = (
      <ContextStage
        key="context"
        user={user}
        profile={profile}
        initial={session?.context ?? undefined}
        contexts={contexts}
        weatherHint={weatherHint}
        saving={saving}
        notice={notice}
        onSubmit={submitContext}
        onSuggestAll={suggestAll}
        onBack={onBack}
      />
    )
  else
    content = (
      <Studio
        key={session.key}
        uid={user.uid}
        profile={profile}
        context={session.context}
        mode={session.mode}
        weather={weather}
        city={city}
        notice={notice}
        onEditContext={() => setStage('context')}
      />
    )

  return (
    <motion.main
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.4 } }}
      exit={{ opacity: 0, scale: 0.97, filter: 'blur(8px)', transition: { duration: 0.45 } }}
    >
      <AnimatePresence mode="wait">{content}</AnimatePresence>
    </motion.main>
  )
}
