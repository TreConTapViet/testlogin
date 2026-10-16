import { SKIN } from './skinTone'

// Chi (tay, chân, cổ, vai) màu da: viền đậm → màu da → vệt sáng lệch lên trên bên trái,
// nhìn như một khối tròn mượt thay vì nét kẻ phẳng
export function SkinLimb({ d, width }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={SKIN.line} strokeWidth={width + 1.6} />
      <path d={d} stroke={SKIN.base} strokeWidth={width} />
      <path d={d} stroke={SKIN.light} strokeWidth={width * 0.32} strokeOpacity="0.75" transform="translate(-1.2 -0.6)" />
    </g>
  )
}

// Đầu tròn không mặt: tô gradient như được chiếu sáng từ trên bên trái
export function SkinHead({ x, y, r, uid }) {
  const id = `${uid}-skin-head`
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="38%" cy="32%" r="78%">
          <stop offset="0" stopColor={SKIN.light} />
          <stop offset="0.55" stopColor={SKIN.base} />
          <stop offset="1" stopColor={SKIN.shade} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} stroke={SKIN.line} strokeWidth="1.2" />
    </g>
  )
}
