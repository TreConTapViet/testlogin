import { motion } from 'framer-motion'
import { memo } from 'react'
import { OCCASIONS, SEASONS, labelOf } from '../../data/outfitContexts'
import { WARDROBE_BY_ID } from '../../data/wardrobe'
import { cn } from '../../lib/cn'
import { makePiece } from '../../services/outfitEngine'
import { SparkIcon } from '../icons'
import ItemIcon from './ItemIcon'

// Thứ tự icon nhỏ trên thẻ: thân → dưới → khoác → giày → phụ kiện
const ICON_ORDER = ['dress', 'top', 'outer', 'bottom', 'shoes', 'bag', 'hat', 'glasses', 'scarf', 'neckwear']

// memo: bấm "Mặc thử" chỉ vẽ lại hai thẻ đổi trạng thái, không vẽ lại cả danh sách icon
const OutfitCard = memo(function OutfitCard({ outfit, active, aiReason, onTry }) {
  const pieces = outfit.items
    .map(([itemId, color, extra]) => ({ item: WARDROBE_BY_ID[itemId], piece: makePiece(itemId, color, extra) }))
    .sort((a, b) => ICON_ORDER.indexOf(a.item.slot) - ICON_ORDER.indexOf(b.item.slot))
  const seasons = outfit.seasons.length === 4 ? 'Quanh năm' : outfit.seasons.map((id) => labelOf(SEASONS, id)).join(', ')
  return (
    <motion.button
      type="button"
      layout="position"
      onClick={() => onTry(outfit)}
      aria-pressed={active}
      className={cn(
        'w-full cursor-pointer rounded-2xl border p-3.5 text-left transition-colors',
        active ? 'border-accent bg-accent/10' : 'border-line bg-white/50 hover:border-accent/40 dark:bg-white/[0.03]',
      )}
    >
      <div className="flex items-center gap-1">
        {pieces.slice(0, 6).map(({ item, piece }) => (
          <span key={item.id} className="grid h-9 w-9 place-items-center rounded-lg bg-white/70 dark:bg-white/[0.06]" title={item.name}>
            <ItemIcon item={item} piece={piece} className="h-8 w-8" />
          </span>
        ))}
      </div>
      <div className="mt-2.5 flex items-start justify-between gap-2">
        <p className="text-[14px] font-semibold leading-snug">{outfit.name}</p>
        {aiReason != null && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">
            <SparkIcon className="h-3 w-3" /> AI chọn
          </span>
        )}
      </div>
      {aiReason && <p className="mt-1 text-xs leading-snug text-accent">{aiReason}</p>}
      <div className="mt-1.5 flex flex-wrap gap-1">
        {outfit.matches.map((match) => (
          <span key={match} className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700 dark:text-emerald-300">
            {match}
          </span>
        ))}
        <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[10.5px] text-muted">{seasons}</span>
      </div>
      <p className="mt-1.5 text-xs leading-snug text-muted">{outfit.note}</p>
      {outfit.changes.length > 0 && (
        <p className="mt-1 text-[11px] italic leading-snug text-muted">Theo sở thích của bạn: {outfit.changes.join('; ')}.</p>
      )}
      <span className="mt-2 inline-block text-xs font-semibold text-accent">{active ? 'Đang mặc thử ✓' : 'Mặc thử →'}</span>
    </motion.button>
  )
})

/**
 * Danh sách bộ gợi ý. mode 'all': mọi hoàn cảnh & mùa, chia nhóm theo dịp.
 * aiPicks: Map id → lý do do AI viết (các bộ AI chọn đứng đầu).
 */
export default function SuggestionList({ suggestions, mode, activeId, aiPicks, onTry }) {
  if (!suggestions.length) {
    return (
      <p className="px-2 py-8 text-center text-sm leading-relaxed text-muted">
        Chưa có bộ nào khớp hoàn toàn với hoàn cảnh này. Bạn thử sửa hoàn cảnh, hoặc tự phối ở tab “Tủ đồ” nhé.
      </p>
    )
  }
  if (mode === 'all') {
    const groups = OCCASIONS.map((occasion) => ({
      occasion,
      outfits: suggestions.filter((outfit) => outfit.occasions[0] === occasion.id),
    })).filter((group) => group.outfits.length)
    return (
      <div className="flex flex-col gap-4">
        {groups.map(({ occasion, outfits }) => (
          <section key={occasion.id} aria-label={occasion.label}>
            <h3 className="sticky top-0 z-10 -mx-1 mb-2 rounded-lg bg-bg/95 px-1 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent backdrop-blur">
              {occasion.label} · {outfits.length}
            </h3>
            <div className="flex flex-col gap-2.5">
              {outfits.map((outfit) => (
                <OutfitCard key={outfit.id} outfit={outfit} active={outfit.id === activeId} aiReason={null} onTry={onTry} />
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2.5">
      {suggestions.map((outfit) => (
        <OutfitCard key={outfit.id} outfit={outfit} active={outfit.id === activeId} aiReason={aiPicks.get(outfit.id) ?? null} onTry={onTry} />
      ))}
    </div>
  )
}
