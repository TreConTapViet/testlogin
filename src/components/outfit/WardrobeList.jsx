import { useState } from 'react'
import { colorHex } from '../../data/fashionPalette'
import { CATEGORIES, SLOTS, WARDROBE } from '../../data/wardrobe'
import { cn } from '../../lib/cn'
import { makePiece } from '../../services/outfitEngine'
import ItemIcon from './ItemIcon'

const forGender = (item, gender) => gender === 'khac' || item.gender === 'unisex' || item.gender === gender
// Màu gốc của từng món (giữ nguyên tham chiếu để icon không phải vẽ lại khi danh sách cập nhật)
const DEFAULT_PIECES = new Map(WARDROBE.map((item) => [item.id, makePiece(item.id)]))

/**
 * Tủ đồ dạng danh sách: lọc theo nhóm, mỗi dòng có icon động vẽ đúng hình món đồ.
 * Bấm để mặc / cởi; món đang mặc hiện đúng màu đang chọn.
 */
export default function WardrobeList({ gender, worn, onToggle }) {
  const [category, setCategory] = useState('all')
  const [everyone, setEveryone] = useState(false)
  const [hovered, setHovered] = useState(null)

  const visible = WARDROBE.filter((item) => (everyone || forGender(item, gender)) && (category === 'all' || item.category === category))
  const groups = CATEGORIES.map((group) => ({ ...group, items: visible.filter((item) => item.category === group.id) })).filter(
    (group) => group.items.length,
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="thin-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2" role="radiogroup" aria-label="Nhóm đồ">
        {[{ id: 'all', label: 'Tất cả' }, ...CATEGORIES].map((group) => (
          <button
            key={group.id}
            type="button"
            role="radio"
            aria-checked={category === group.id}
            onClick={() => setCategory(group.id)}
            className={cn(
              'shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              category === group.id ? 'border-ink bg-ink text-bg' : 'border-line hover:border-accent/50',
            )}
          >
            {group.label}
          </button>
        ))}
      </div>
      {gender !== 'khac' && (
        <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={everyone} onChange={(event) => setEveryone(event.target.checked)} className="accent-[var(--accent)]" />
          Hiện cả đồ của giới tính khác
        </label>
      )}

      <div className="thin-scroll -mx-2 min-h-0 flex-1 overflow-y-auto px-2" onMouseLeave={() => setHovered(null)}>
        {groups.map((group) => (
          <section key={group.id} aria-label={group.label} className="mb-3">
            <h3 className="sticky top-0 z-10 mb-1 bg-bg/95 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent backdrop-blur">
              {group.label} · {group.items.length}
            </h3>
            <ul className="flex flex-col">
              {group.items.map((item) => {
                const current = worn[item.slot]
                const wearing = current?.itemId === item.id
                const piece = wearing ? current : DEFAULT_PIECES.get(item.id)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={wearing}
                      onClick={() => onToggle(item)}
                      onMouseEnter={() => setHovered(item.id)}
                      onFocus={() => setHovered(item.id)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors',
                        wearing ? 'bg-accent/10' : 'hover:bg-ink/[0.04]',
                      )}
                    >
                      <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-xl', wearing ? 'bg-white/90 dark:bg-white/10' : 'bg-white/60 dark:bg-white/[0.05]')}>
                        <ItemIcon item={item} piece={piece} active={hovered === item.id} className="h-11 w-11" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{item.name}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                          <span className="h-2.5 w-2.5 rounded-full border border-line" style={{ background: piece.color }} />
                          {item.color2 && <span className="h-2.5 w-2.5 rounded-full border border-line" style={{ background: colorHex(piece.color2) }} />}
                          {SLOTS[item.slot]}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold',
                          wearing ? 'bg-accent text-white' : 'border border-line text-muted',
                        )}
                        aria-hidden="true"
                      >
                        {wearing ? '✓' : '+'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
