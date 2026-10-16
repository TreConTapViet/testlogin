import { hexToHsl, mix, shade } from '../../lib/color'

function Flower({ x, y, r, color }) {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((angle) => (
        <circle
          key={angle}
          cx={x + Math.sin((angle * Math.PI) / 180) * r * 1.1}
          cy={y - Math.cos((angle * Math.PI) / 180) * r * 1.1}
          r={r}
          fill={color}
        />
      ))}
      <circle cx={x} cy={y} r={r * 0.62} fill="#f6d77c" />
    </g>
  )
}

// Vân vải theo màu nền: len (đan chữ V), denim (vân chéo) không cần màu phụ
const texture = (color, amount) => (hexToHsl(color).l < 22 ? shade(color, amount) : shade(color, -amount))

/** Họa tiết vải (userSpaceOnUse: xoay theo ống tay/ống quần, nghiêng theo thân). */
function FabricPattern({ id, piece }) {
  const a = piece.color
  const b = piece.color2
  const common = { id, patternUnits: 'userSpaceOnUse' }
  switch (piece.pattern) {
    case 'stripe-h':
      return (
        <pattern {...common} width="8" height="8">
          <rect width="8" height="8" fill={a} />
          <rect y="5" width="8" height="3" fill={b} />
        </pattern>
      )
    case 'stripe-v':
      return (
        <pattern {...common} width="8" height="8">
          <rect width="8" height="8" fill={a} />
          <rect x="5" width="3" height="8" fill={b} />
        </pattern>
      )
    case 'caro':
      return (
        <pattern {...common} width="18" height="18">
          <rect width="18" height="18" fill={a} />
          <rect y="2" width="18" height="7" fill={b} opacity="0.5" />
          <rect x="2" width="7" height="18" fill={b} opacity="0.5" />
          <path d="M0 13.5 H18 M13.5 0 V18" stroke={mix(a, '#ffffff', 0.55)} strokeWidth="0.9" opacity="0.8" />
        </pattern>
      )
    case 'gingham':
      return (
        <pattern {...common} width="8" height="8">
          <rect width="8" height="8" fill={a} />
          <rect width="4" height="8" fill={b} opacity="0.42" />
          <rect width="8" height="4" fill={b} opacity="0.42" />
        </pattern>
      )
    case 'dots':
      return (
        <pattern {...common} width="10" height="10">
          <rect width="10" height="10" fill={a} />
          <circle cx="2.5" cy="2.5" r="1.4" fill={b} />
          <circle cx="7.5" cy="7.5" r="1.4" fill={b} />
        </pattern>
      )
    case 'floral': {
      const leaf = mix(b, '#4f7a4a', 0.55)
      return (
        <pattern {...common} width="20" height="20">
          <rect width="20" height="20" fill={a} />
          <Flower x={5} y={5} r={1.7} color={b} />
          <Flower x={15} y={14} r={1.3} color={b} />
          <ellipse cx="9.5" cy="7.5" rx="1.8" ry="0.8" transform="rotate(35 9.5 7.5)" fill={leaf} />
          <ellipse cx="11" cy="15.5" rx="1.6" ry="0.7" transform="rotate(-30 11 15.5)" fill={leaf} />
        </pattern>
      )
    }
    case 'denim':
      return (
        <pattern {...common} width="6" height="6">
          <rect width="6" height="6" fill={a} />
          <path d="M-1 1 L1 -1 M0 6 L6 0 M5 7 L7 5" stroke={mix(a, '#ffffff', 0.4)} strokeWidth="0.9" opacity="0.45" />
        </pattern>
      )
    case 'knit':
      return (
        <pattern {...common} width="6" height="7">
          <rect width="6" height="7" fill={a} />
          <path d="M0 0.5 L3 3.5 L6 0.5" fill="none" stroke={texture(a, 16)} strokeWidth="0.9" opacity="0.75" />
        </pattern>
      )
    default:
      return null
  }
}

/** Gradient đổ bóng dùng chung + họa tiết riêng cho từng món đang mặc (id theo vị trí). */
export default function PatternDefs({ uid, worn }) {
  return (
    <defs>
      {/* Bóng ngang: hai mép tối, sáng lệch trái như có đèn chiếu từ trên bên trái */}
      <linearGradient id={`${uid}-sh`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.24" />
        <stop offset="0.16" stopColor="#000" stopOpacity="0.07" />
        <stop offset="0.4" stopColor="#fff" stopOpacity="0.13" />
        <stop offset="0.72" stopColor="#000" stopOpacity="0.02" />
        <stop offset="1" stopColor="#000" stopOpacity="0.27" />
      </linearGradient>
      {/* Bóng dọc: phía dưới tối dần */}
      <linearGradient id={`${uid}-sv`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.1" />
        <stop offset="0.55" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.16" />
      </linearGradient>
      {Object.entries(worn).map(([slot, piece]) =>
        piece && piece.pattern && piece.pattern !== 'solid' ? (
          <FabricPattern key={`${slot}-${piece.pattern}`} id={`${uid}-p-${slot}`} piece={piece} />
        ) : null,
      )}
    </defs>
  )
}
