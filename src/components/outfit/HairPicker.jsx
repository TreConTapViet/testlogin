import { animate, useMotionValue } from 'framer-motion'
import { memo, useEffect, useId, useState } from 'react'
import { HAIRSTYLES, HAIR_COLORS } from '../../data/hairstyles'
import { cn } from '../../lib/cn'
import { HairCap, HairPieces } from './Hair'
import { resolveHair } from './hairShapes'
import { SkinHead, SkinLimb } from './Skin'

const RAD = Math.PI / 180
const HEAD = { x: 120, y: 78, r: 25 }
const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase()

// Khung hình tối giản chỉ có đầu (đủ cho bộ vẽ tóc)
const headFrame = (turn) => ({ head: HEAD, turn, c: Math.cos(turn * RAD), s: Math.sin(turn * RAD), tilt: 0, neck: { x: 120, y: 120 } })

// Chiều dài khung icon theo độ dài tóc
function reachOf(style) {
  if (style.long) return Math.min(style.long.length, 72)
  if (style.tie?.type === 'braid' || style.tie?.type === 'ponytail' || style.tie?.type === 'side-pony') return 62
  return 34
}

/** Icon bán thân: đầu màu da + kiểu tóc, nhìn chéo 3/4; rê chuột thì xoay để thấy phía sau. */
const HairIcon = memo(function HairIcon({ style, color, fluff, active }) {
  const uid = `hi${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const turn = useMotionValue(22)
  const [angle, setAngle] = useState(22)

  useEffect(() => turn.on('change', (value) => setAngle(value)), [turn])
  useEffect(() => {
    const controls = active
      ? animate(turn, [22, 150, 22], { duration: 2, ease: 'easeInOut' })
      : animate(turn, 22, { duration: 0.35, ease: 'easeOut' })
    return () => controls.stop()
  }, [active, turn])

  const hair = resolveHair({ styleId: style.id, color, fluff })
  const f = headFrame(angle)
  const reach = reachOf(style)
  return (
    <svg viewBox={`62 ${32} 116 ${54 + reach}`} className="h-full w-full" aria-hidden="true" focusable="false">
      <HairPieces f={f} hair={hair} layer="behind" still />
      <SkinLimb d={`M 120 100 L 120 ${HEAD.y + reach + 20}`} width={10} />
      {reach > 40 && <SkinLimb d="M 94 120 L 146 120" width={10} />}
      <SkinHead x={HEAD.x} y={HEAD.y} r={HEAD.r} uid={uid} />
      <HairCap f={f} hair={hair} still />
      <HairPieces f={f} hair={hair} layer="front" still />
    </svg>
  )
})

function HairGroup({ title, source, styles, hair, hovered, setHovered, onChange }) {
  return (
    <section aria-label={title} className="mb-3">
      <h3 className="sticky top-0 z-10 mb-1 bg-bg/95 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent backdrop-blur">
        {title} · {styles.length}
        <span className="ml-1.5 font-normal normal-case tracking-normal text-muted">{source}</span>
      </h3>
      <ul className="flex flex-col">
        {styles.map((style) => {
          const active = hair.styleId === style.id
          return (
            <li key={style.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ styleId: style.id })}
                onMouseEnter={() => setHovered(style.id)}
                onFocus={() => setHovered(style.id)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors',
                  active ? 'bg-accent/10' : 'hover:bg-ink/[0.04]',
                )}
              >
                <span className={cn('h-14 w-12 shrink-0 overflow-hidden rounded-xl', active ? 'bg-white/90 dark:bg-white/10' : 'bg-white/60 dark:bg-white/[0.05]')}>
                  <HairIcon style={style} color={hair.color} fluff={hair.fluff} active={hovered === style.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{style.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted">{style.face}</span>
                </span>
                <span
                  className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold',
                    active ? 'bg-accent text-white' : 'border border-line text-muted',
                  )}
                  aria-hidden="true"
                >
                  {active ? '✓' : '+'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/**
 * Chọn kiểu tóc cho ma-nơ-canh ngay trong phòng thử: kiểu tóc (nam theo Liêm Barber, nữ theo Thế Giới Nệm),
 * màu tóc và độ bồng bềnh.
 */
export default function HairPicker({ gender, hair, onChange }) {
  const [everyone, setEveryone] = useState(false)
  const [hovered, setHovered] = useState(null)
  const showMen = gender !== 'nu' || everyone
  const showWomen = gender !== 'nam' || everyone
  const groups = [
    { id: 'nam', title: 'Tóc nam', source: 'theo Liêm Barber Shop', styles: HAIRSTYLES.filter((style) => style.gender === 'nam') },
    { id: 'nu', title: 'Tóc nữ', source: 'theo Thế Giới Nệm', styles: HAIRSTYLES.filter((style) => style.gender === 'nu') },
  ]
  // Giới tính của người dùng xếp trước
  const ordered = gender === 'nu' ? [groups[1], groups[0]] : groups
  const fluffPercent = Math.round(hair.fluff * 100)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="text-xs leading-relaxed text-muted">Chọn kiểu tóc bạn thích, ma-nơ-canh đổi ngay. Lần sau vào phòng thử vẫn giữ nguyên.</p>

      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-semibold text-muted">Màu tóc</p>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Màu tóc">
          {HAIR_COLORS.map((color) => {
            const active = same(color.hex, hair.color)
            return (
              <button
                key={color.id}
                type="button"
                title={color.name}
                aria-label={color.name}
                aria-pressed={active}
                onClick={() => onChange({ color: color.hex })}
                className={cn(
                  'h-[22px] w-[22px] cursor-pointer rounded-full border border-black/10 transition-transform hover:scale-110 dark:border-white/15',
                  active && 'ring-2 ring-accent ring-offset-2 ring-offset-bg',
                )}
                style={{ background: color.hex }}
              />
            )
          })}
          <label className="relative h-[22px] w-[22px] cursor-pointer overflow-hidden rounded-full border border-dashed border-line" title="Tự chọn màu tóc">
            <input
              type="color"
              value={hair.color}
              onChange={(event) => onChange({ color: event.target.value })}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Tự chọn màu tóc"
            />
            <span className="grid h-full w-full place-items-center text-[11px] text-muted">+</span>
          </label>
        </div>
      </div>

      <label className="mt-3 block">
        <span className="mb-1 flex items-baseline justify-between text-[11px] font-semibold text-muted">
          Độ bồng bềnh <span className="font-normal tabular-nums">{fluffPercent}%</span>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={fluffPercent}
          onChange={(event) => onChange({ fluff: Number(event.target.value) / 100 })}
          className="w-full accent-[var(--accent)]"
          aria-label="Độ bồng bềnh của tóc"
        />
        <span className="flex justify-between text-[10.5px] text-muted">
          <span>Ôm gọn</span>
          <span>Bồng bềnh</span>
        </span>
      </label>

      {gender !== 'khac' && (
        <label className="mb-1 mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={everyone} onChange={(event) => setEveryone(event.target.checked)} className="accent-[var(--accent)]" />
          Hiện cả kiểu tóc của giới tính khác
        </label>
      )}

      <div className="thin-scroll -mx-2 mt-1 min-h-0 flex-1 overflow-y-auto px-2" onMouseLeave={() => setHovered(null)}>
        {ordered
          .filter((group) => (group.id === 'nam' ? showMen : showWomen))
          .map((group) => (
            <HairGroup key={group.id} {...group} hair={hair} hovered={hovered} setHovered={setHovered} onChange={onChange} />
          ))}
      </div>
    </div>
  )
}
