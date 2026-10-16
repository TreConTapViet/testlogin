import { COLOR_GROUPS, COLOR_SCHEMES, FASHION_COLORS, PATTERNS, colorName } from '../../data/fashionPalette'
import { SLOTS, SLOT_ORDER, WARDROBE_BY_ID } from '../../data/wardrobe'
import { cn } from '../../lib/cn'
import { CloseIcon } from '../icons'
import ItemIcon from './ItemIcon'

// Họa tiết chỉ áp cho món bằng vải; màu phụ dùng cho họa tiết hoặc chi tiết riêng của món
const FABRIC_SLOTS = new Set(['top', 'outer', 'bottom', 'dress', 'scarf', 'neckwear', 'hat', 'bag'])
const PATTERN_NEEDS_SECOND = new Set(['stripe-h', 'stripe-v', 'caro', 'gingham', 'dots', 'floral'])

// Chỉ hiện ô màu phụ khi màu đó thực sự được vẽ ra
function secondLabel(item, pattern) {
  if (item.kind === 'aodai') return 'Màu quần lụa'
  if (PATTERN_NEEDS_SECOND.has(pattern)) return 'Màu họa tiết'
  if (item.shape.graphic) return 'Màu hình in'
  if (item.slot === 'shoes') return 'Màu đế & chi tiết'
  if (item.slot === 'watch') return 'Màu mặt đồng hồ'
  if (item.slot === 'belt') return 'Màu khoá'
  if (item.slot === 'hat' && ['wide', 'fedora', 'conical'].includes(item.shape.type)) return 'Màu dây mũ'
  return null
}

const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase()

function Swatches({ label, value, onPick }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold text-muted">{label}</p>
      {COLOR_GROUPS.map((group) => (
        <div key={group.id} className="mb-1.5 flex flex-wrap gap-1" role="group" aria-label={`${label}: ${group.label}`}>
          {FASHION_COLORS.filter((color) => color.group === group.id).map((color) => {
            const active = same(color.hex, value)
            return (
              <button
                key={color.id}
                type="button"
                title={color.name}
                aria-label={color.name}
                aria-pressed={active}
                onClick={() => onPick(color.hex)}
                className={cn(
                  'h-5 w-5 cursor-pointer rounded-full border border-black/10 transition-transform hover:scale-110 dark:border-white/15',
                  active && 'ring-2 ring-accent ring-offset-2 ring-offset-bg',
                )}
                style={{ background: color.hex }}
              />
            )
          })}
        </div>
      ))}
      <label className="mt-1 inline-flex cursor-pointer items-center gap-2 text-xs text-muted hover:text-ink">
        <span className="relative h-[22px] w-[22px] overflow-hidden rounded-full border border-line" style={{ background: value }}>
          <input type="color" value={value} onChange={(event) => onPick(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label={`${label}: tự chọn màu`} />
        </span>
        Tự chọn · {colorName(value)}
      </label>
    </div>
  )
}

/**
 * Bảng chỉnh đồ đang mặc: chọn món → đổi màu chính, họa tiết (kẻ sọc, caro, chấm bi…), màu phụ;
 * phối màu nhanh cho cả bộ theo bánh xe màu.
 */
export default function PieceEditor({ worn, selectedSlot, onSelect, onChange, onRemove, onScheme, canReset, onReset, onClear }) {
  const slots = SLOT_ORDER.filter((slot) => worn[slot])
  const piece = selectedSlot ? worn[selectedSlot] : null
  const item = piece ? WARDROBE_BY_ID[piece.itemId] : null
  const second = item ? secondLabel(item, piece.pattern) : null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Đang mặc · {slots.length}</h2>
        {slots.length > 0 && (
          <button type="button" onClick={onClear} className="cursor-pointer text-xs text-muted hover:text-ink">
            Cởi hết
          </button>
        )}
      </div>

      {slots.length === 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-muted">Chọn một bộ gợi ý hoặc bấm món đồ trong “Tủ đồ” để mặc cho ma-nơ-canh.</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {slots.map((slot) => {
            const current = WARDROBE_BY_ID[worn[slot].itemId]
            const active = slot === selectedSlot
            return (
              <li key={slot}>
                <span className={cn('flex items-center rounded-full border pr-1 transition-colors', active ? 'border-accent bg-accent/10' : 'border-line')}>
                  <button
                    type="button"
                    onClick={() => onSelect(slot)}
                    aria-pressed={active}
                    title={current.name}
                    className="flex cursor-pointer items-center gap-1 rounded-full py-0.5 pl-0.5 pr-1.5 text-[11.5px] font-medium"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-white/80 dark:bg-white/10">
                      <ItemIcon item={current} piece={worn[slot]} className="h-5 w-5" />
                    </span>
                    {SLOTS[slot]}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(slot)}
                    aria-label={`Cởi ${current.name.toLowerCase()}`}
                    className="grid h-5 w-5 cursor-pointer place-items-center rounded-full text-muted hover:bg-ink/10 hover:text-ink"
                  >
                    <CloseIcon className="h-3 w-3" />
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <div className="thin-scroll -mx-1 mt-3 min-h-0 flex-1 overflow-y-auto px-1">
        {item && (
          <section aria-label={`Chỉnh ${item.name}`} className="border-t border-line pt-3">
            <p className="text-[13px] font-semibold">{item.name}</p>
            <div className="mt-2.5 flex flex-col gap-3">
              <Swatches label="Màu chính" value={piece.color} onPick={(color) => onChange(selectedSlot, { color })} />
              {FABRIC_SLOTS.has(item.slot) && item.kind !== 'aodai' && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-muted">Họa tiết</p>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Họa tiết">
                    {PATTERNS.map((pattern) => (
                      <button
                        key={pattern.id}
                        type="button"
                        role="radio"
                        aria-checked={piece.pattern === pattern.id}
                        onClick={() => onChange(selectedSlot, { pattern: pattern.id })}
                        className={cn(
                          'cursor-pointer rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
                          piece.pattern === pattern.id ? 'border-accent bg-accent text-white' : 'border-line hover:border-accent/50',
                        )}
                      >
                        {pattern.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {second && <Swatches label={second} value={piece.color2} onPick={(color2) => onChange(selectedSlot, { color2 })} />}
            </div>
          </section>
        )}

        {slots.length > 0 && (
          <section aria-label="Phối màu nhanh" className="mt-3 border-t border-line pt-3">
            <p className="text-[13px] font-semibold">Phối màu nhanh cho cả bộ</p>
            <p className="mt-0.5 text-[11px] text-muted">
              Lấy màu {item ? `của ${item.name.toLowerCase()}` : 'đang chọn'} làm gốc, áp quy tắc 60-30-10.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {COLOR_SCHEMES.map((scheme) => (
                <button
                  key={scheme.id}
                  type="button"
                  title={scheme.hint}
                  onClick={() => onScheme(scheme.id)}
                  className="cursor-pointer rounded-full border border-line px-2.5 py-1 text-[11.5px] font-medium transition-colors hover:border-accent/60 hover:text-accent"
                >
                  {scheme.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {canReset && (
          <button type="button" onClick={onReset} className="mt-3 cursor-pointer text-xs font-medium text-accent hover:underline">
            ↺ Về màu gốc của bộ gợi ý
          </button>
        )}
      </div>
    </div>
  )
}
