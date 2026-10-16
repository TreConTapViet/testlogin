import { motion, useMotionValue } from 'framer-motion'
import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import { contextSummary, seasonFromWeather } from '../../data/outfitContexts'
import { WARDROBE } from '../../data/wardrobe'
import { cn } from '../../lib/cn'
import { autoSecondary } from '../../lib/color'
import { bodyBalanceById } from '../../services/bodyProfile'
import {
  aiPickerInput,
  applyColorScheme,
  makePiece,
  outfitToWorn,
  suggestOutfits,
  wearPiece,
} from '../../services/outfitEngine'
import { loadHair, saveHair } from '../../services/hairStore'
import { isStylistAvailable, pickOutfitsWithAI } from '../../services/stylist'
import { SparkIcon, Spinner } from '../icons'
import HairPicker from './HairPicker'
import PieceEditor from './PieceEditor'
import { bodyFromProfile } from './rig'
import StudioStage from './StudioStage'
import SuggestionList from './SuggestionList'
import WardrobeList from './WardrobeList'

const EASE = [0.22, 1, 0.36, 1]
const AI_CANDIDATES = 12
const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase()
const mainSlot = (worn) => (worn.dress ? 'dress' : worn.top ? 'top' : (Object.keys(worn)[0] ?? null))

// Một hoàn cảnh chỉ hỏi AI một lần (React StrictMode chạy effect hai lần khi phát triển)
const aiRequests = new Map()
function requestPicks(key, input) {
  if (!aiRequests.has(key)) {
    const request = pickOutfitsWithAI(input)
    request.catch(() => aiRequests.delete(key))
    aiRequests.set(key, request)
  }
  return aiRequests.get(key)
}

/**
 * Phòng phối đồ: trái là danh sách (gợi ý / tủ đồ), giữa là ma-nơ-canh, phải là bảng chỉnh màu & họa tiết.
 * Gợi ý tính theo hồ sơ + hoàn cảnh; nếu có AI thì AI xếp lại và giải thích vì sao hợp.
 */
export default function Studio({ uid, profile, context, mode, weather, city, notice, onEditContext }) {
  const body = useMemo(() => bodyFromProfile(profile), [profile])
  const [suggestions] = useState(() =>
    suggestOutfits({ profile, context, mode, weatherSeason: weather ? seasonFromWeather(weather.temp) : null }),
  )
  const aiEnabled = mode === 'context' && isStylistAvailable && suggestions.length > 1
  const [ai, setAi] = useState(() => ({ status: aiEnabled ? 'loading' : 'off', picks: [] }))
  const [look, setLook] = useState(() => {
    const first = suggestions[0]
    const worn = first ? outfitToWorn(first) : {}
    return { worn, activeId: first?.id ?? null, selected: mainSlot(worn), touched: false, edited: false, hop: 0 }
  })
  const [tab, setTab] = useState('suggest')
  // Kiểu tóc: chọn ngay trong phòng thử (không hỏi ở hồ sơ); saved = false là đang dùng kiểu mặc định
  const [hairState, setHairState] = useState(() => loadHair(uid, profile?.gender))
  const [pose, setPose] = useState('dung-thang')
  const turn = useMotionValue(0)

  const askAI = useEffectEvent((isCancelled) => {
    const candidates = suggestions.slice(0, AI_CANDIDATES)
    const key = JSON.stringify([profile?.updatedAt ?? '', context, candidates.map((outfit) => outfit.id)])
    requestPicks(key, aiPickerInput({ profile, context, candidates, weather, city: city?.name }))
      .then((picks) => {
        if (isCancelled()) return
        setAi({ status: picks.length ? 'done' : 'error', picks })
        // Người dùng chưa tự chọn gì thì mặc luôn bộ AI xếp đầu
        const best = suggestions.find((outfit) => outfit.id === picks[0]?.id)
        if (!best) return
        setLook((current) => {
          if (current.touched || current.activeId === best.id) return current
          const worn = outfitToWorn(best)
          return { worn, activeId: best.id, selected: mainSlot(worn), touched: false, edited: false, hop: current.hop + 1 }
        })
      })
      .catch((error) => {
        if (isCancelled()) return
        console.warn('AI chưa chọn được bộ phối, dùng gợi ý theo quy tắc:', error)
        setAi({ status: 'error', picks: [] })
      })
  })

  useEffect(() => {
    if (!aiEnabled) return undefined
    let cancelled = false
    askAI(() => cancelled)
    return () => {
      cancelled = true
    }
  }, [aiEnabled])

  // Bộ AI chọn đứng đầu (kèm lý do), các bộ còn lại giữ thứ tự điểm
  const aiPicks = useMemo(() => new Map(ai.picks.map((pick) => [pick.id, pick.reason])), [ai.picks])
  const ordered = useMemo(() => {
    if (!aiPicks.size) return suggestions
    const rank = (outfit) => (aiPicks.has(outfit.id) ? ai.picks.findIndex((pick) => pick.id === outfit.id) : AI_CANDIDATES + 1)
    return [...suggestions].sort((a, b) => rank(a) - rank(b))
  }, [suggestions, aiPicks, ai.picks])

  const tryOutfit = useCallback((outfit) => {
    const worn = outfitToWorn(outfit)
    setLook((current) => ({ worn, activeId: outfit.id, selected: mainSlot(worn), touched: true, edited: false, hop: current.hop + 1 }))
  }, [])

  const toggleItem = (item) => {
    setLook((current) => {
      const wearing = current.worn[item.slot]?.itemId === item.id
      if (wearing) {
        const worn = { ...current.worn }
        delete worn[item.slot]
        return { ...current, worn, selected: current.selected === item.slot ? mainSlot(worn) : current.selected, touched: true, edited: true, hop: current.hop + 1 }
      }
      return { ...current, worn: wearPiece(current.worn, makePiece(item.id)), selected: item.slot, touched: true, edited: true, hop: current.hop + 1 }
    })
  }

  const changePiece = (slot, patch) => {
    setLook((current) => {
      const piece = current.worn[slot]
      if (!piece) return current
      const next = { ...piece, ...patch }
      // Màu phụ đang tự động theo màu chính thì đổi theo
      if (patch.color && !patch.color2 && same(piece.color2, autoSecondary(piece.color))) next.color2 = autoSecondary(patch.color)
      return { ...current, worn: { ...current.worn, [slot]: next }, touched: true, edited: true }
    })
  }

  const removePiece = (slot) => {
    setLook((current) => {
      const worn = { ...current.worn }
      delete worn[slot]
      return { ...current, worn, selected: current.selected === slot ? mainSlot(worn) : current.selected, touched: true, edited: true, hop: current.hop + 1 }
    })
  }

  const applyScheme = (schemeId) => {
    setLook((current) => {
      const base = current.worn[current.selected]?.color ?? current.worn[mainSlot(current.worn)]?.color
      if (!base) return current
      return { ...current, worn: applyColorScheme(current.worn, schemeId, base), touched: true, edited: true, hop: current.hop + 1 }
    })
  }

  const updateHair = (patch) => {
    const hair = { ...hairState.hair, ...patch }
    setHairState({ hair, saved: true })
    saveHair(uid, hair)
  }

  const activeOutfit = suggestions.find((outfit) => outfit.id === look.activeId)
  const balance = bodyBalanceById(profile?.bodyBalance)
  const summary = mode === 'all' ? 'Tất cả gợi ý · mọi hoàn cảnh và mọi mùa' : contextSummary(context) || 'Hoàn cảnh riêng của bạn'

  return (
    <motion.div
      className="absolute inset-0 flex flex-col overflow-y-auto lg:overflow-hidden"
      style={{ paddingTop: 76 }}
      initial={{ opacity: 0, scale: 1.03 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      {/* Thanh hoàn cảnh */}
      <div className="mx-4 mt-2 flex flex-wrap items-center gap-2 md:mx-5">
        <span className="glass flex min-w-0 items-center gap-2 rounded-full px-4 py-2 text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Hoàn cảnh</span>
          <span className="truncate font-medium">{summary}</span>
        </span>
        {context?.note && mode !== 'all' && (
          <span className="glass max-w-[260px] truncate rounded-full px-3 py-2 text-xs text-muted" title={context.note}>
            “{context.note}”
          </span>
        )}
        {balance && (
          <span className="glass rounded-full px-3 py-2 text-xs text-muted">
            Ma-nơ-canh theo hồ sơ: {balance.short.toLowerCase()} · {profile.heightCm} cm
          </span>
        )}
        <span className={cn('glass flex items-center gap-1.5 rounded-full px-3 py-2 text-xs', ai.status === 'done' ? 'text-accent' : 'text-muted')}>
          {ai.status === 'loading' ? <Spinner className="h-3.5 w-3.5 animate-spin" /> : <SparkIcon className="h-3.5 w-3.5" />}
          {ai.status === 'loading'
            ? 'AI đang chọn bộ hợp nhất…'
            : ai.status === 'done'
              ? `AI đã chọn ${ai.picks.length} bộ cho bạn`
              : mode === 'all'
                ? `${suggestions.length} bộ phối`
                : 'Gợi ý theo quy tắc phối đồ'}
        </span>
        {notice && <span className="text-xs text-amber-700 dark:text-amber-300">{notice}</span>}
        <button
          type="button"
          onClick={onEditContext}
          className="ml-auto cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-accent/50"
        >
          Sửa hoàn cảnh
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:px-5 lg:grid lg:grid-cols-[340px_minmax(0,1fr)_290px] xl:grid-cols-[360px_minmax(0,1fr)_310px]">
        {/* Trái: gợi ý / tủ đồ */}
        <aside className="glass order-2 flex min-h-[420px] flex-col rounded-[26px] p-4 lg:order-none lg:min-h-0">
          <div className="mb-3 grid grid-cols-3 gap-1 rounded-full bg-ink/[0.05] p-1" role="tablist" aria-label="Danh sách">
            {[
              { id: 'suggest', label: `Gợi ý · ${suggestions.length}` },
              { id: 'wardrobe', label: `Tủ đồ · ${WARDROBE.length}` },
              { id: 'hair', label: 'Kiểu tóc' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={tab === option.id}
                onClick={() => setTab(option.id)}
                className={cn(
                  'cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  tab === option.id ? 'bg-bg text-ink shadow-sm' : 'text-muted hover:text-ink',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {tab === 'suggest' ? (
            <div className="thin-scroll -mx-2 min-h-0 flex-1 overflow-y-auto px-2" role="tabpanel">
              <SuggestionList suggestions={ordered} mode={mode} activeId={look.activeId} aiPicks={aiPicks} onTry={tryOutfit} />
            </div>
          ) : tab === 'wardrobe' ? (
            <WardrobeList gender={profile?.gender ?? 'khac'} worn={look.worn} onToggle={toggleItem} />
          ) : (
            <HairPicker gender={profile?.gender ?? 'khac'} hair={hairState.hair} onChange={updateHair} />
          )}
        </aside>

        {/* Giữa: ma-nơ-canh */}
        <section className="order-1 h-[78vh] min-h-[460px] lg:order-none lg:h-auto lg:min-h-0" aria-label="Ma-nơ-canh">
          <StudioStage
            body={body}
            worn={look.worn}
            hair={hairState.hair}
            pose={pose}
            onPose={setPose}
            turn={turn}
            bounce={look.hop}
            showHairHint={!hairState.saved && tab !== 'hair'}
            onOpenHair={() => setTab('hair')}
          />
        </section>

        {/* Phải: chỉnh màu, họa tiết (chừa góc dưới phải cho bong bóng trợ lý AI) */}
        <aside className="glass order-3 flex min-h-[360px] flex-col rounded-[26px] p-4 lg:order-none lg:mb-[84px] lg:min-h-0">
          <PieceEditor
            worn={look.worn}
            selectedSlot={look.selected}
            onSelect={(slot) => setLook((current) => ({ ...current, selected: slot }))}
            onChange={changePiece}
            onRemove={removePiece}
            onScheme={applyScheme}
            canReset={Boolean(activeOutfit) && look.edited}
            onReset={() => activeOutfit && tryOutfit(activeOutfit)}
            onClear={() => {
              setLook((current) => ({ ...current, worn: {}, selected: null, touched: true, edited: true, hop: current.hop + 1 }))
            }}
          />
        </aside>
      </div>
    </motion.div>
  )
}
