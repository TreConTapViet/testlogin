// Quần áo & phụ kiện vẽ bằng SVG (khung 100x100).
// c = màu chính, d = màu chi tiết. Các chi tiết đã được căn để nằm gọn trong hình.

const OUTLINE = { stroke: 'rgba(40,24,12,0.22)', strokeWidth: 1.4, strokeLinejoin: 'round', strokeLinecap: 'round' }
const SHADE = 'rgba(0,0,0,0.07)'
const SHINE = 'rgba(255,255,255,0.45)'

export function TShirt({ c, d }) {
  return (
    <>
      <path d="M38 14 Q50 24 62 14 L80 20 L94 36 L82 46 L74 39 L74 88 Q50 92 26 88 L26 39 L18 46 L6 36 L20 20 Z" fill={c} {...OUTLINE} />
      <path d="M64 42 H72 V86 H64 Z" fill={SHADE} />
      <path d="M38 14 Q50 24 62 14" fill="none" stroke={d} strokeWidth="3" strokeLinecap="round" />
      <path d="M8.6 33 L20.6 43 M91.4 33 L79.4 43" stroke={d} strokeWidth="2" strokeLinecap="round" />
      <path d="M58 36 H67 V44 Q62.5 46.5 58 44 Z" fill={d} opacity="0.8" />
    </>
  )
}

export function Shirt({ c, d }) {
  return (
    <>
      <path d="M36 12 L22 18 L10 58 L19 62 L28 34 L28 90 L72 90 L72 34 L81 62 L90 58 L78 18 L64 12 L50 22 Z" fill={c} {...OUTLINE} />
      <path d="M36 12 L50 22 L41 27 Z M64 12 L50 22 L59 27 Z" fill={d} />
      <path d="M50 22 V90" stroke={d} strokeWidth="1.2" />
      {[32, 44, 56, 68, 80].map((y) => (
        <circle key={y} cx="50" cy={y} r="1.7" fill="#fff" stroke={d} strokeWidth="0.8" />
      ))}
      <path d="M11.2 54.2 L20.2 58.2 M88.8 54.2 L79.8 58.2" stroke={d} strokeWidth="2" strokeLinecap="round" />
      <path d="M56 32 H66 V41 H56 Z" fill="none" stroke={d} strokeWidth="0.9" />
    </>
  )
}

export function Hoodie({ c, d }) {
  return (
    <>
      <path d="M34 20 Q50 6 66 20 L80 24 L92 64 L82 67 L74 40 L74 90 L26 90 L26 40 L18 67 L8 64 L20 24 Z" fill={c} {...OUTLINE} />
      <path d="M36 20 Q50 9 64 20 Q50 31 36 20 Z" fill={d} opacity="0.55" />
      <path d="M45 27 L44 44 M55 27 L56 44" stroke={d} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="44" cy="44.5" r="1.4" fill={d} />
      <circle cx="56" cy="44.5" r="1.4" fill={d} />
      <path d="M36 66 Q50 61 64 66 L67 83 H33 Z" fill={d} opacity="0.28" />
      <path d="M26 85 H74 V90 H26 Z" fill={d} opacity="0.35" />
      <path d="M9.2 60.2 L19.1 63.2 M90.8 60.2 L80.9 63.2" stroke={d} strokeWidth="2.4" strokeLinecap="round" opacity="0.5" />
    </>
  )
}

export function Dress({ c, d }) {
  return (
    <>
      <path d="M40 8 L44 8 L46 20 L54 20 L56 8 L60 8 L62 24 Q64 34 60 42 L84 90 Q50 98 16 90 L40 42 Q36 34 38 24 Z" fill={c} {...OUTLINE} />
      <path d="M46 20 Q50 23 54 20" fill="none" stroke={d} strokeWidth="1" />
      <path d="M40 42 Q50 46.5 60 42" fill="none" stroke={d} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M45 50 L40 92 M50 48 V94 M55 50 L60 92" stroke="rgba(0,0,0,0.08)" strokeWidth="1.4" />
    </>
  )
}

export function Skirt({ c, d }) {
  return (
    <>
      <path d="M33 22 H67 L84 84 Q50 92 16 84 Z" fill={c} {...OUTLINE} />
      <path d="M42 23 L36 86 M50 23 V88 M58 23 L64 86" stroke="rgba(0,0,0,0.1)" strokeWidth="1.3" />
      <rect x="32" y="14" width="36" height="8" rx="2" fill={d} />
    </>
  )
}

export function Pants({ c, d }) {
  return (
    <>
      <path d="M30 10 H70 L74 92 H55 L50 36 L45 92 H26 Z" fill={c} {...OUTLINE} />
      <path d="M30 10 H70 L70.4 17 H29.6 Z" fill={d} />
      <path d="M50 17 V33" stroke={d} strokeWidth="1.2" />
      <path d="M36 17 Q36 25 29.3 26 M64 17 Q64 25 70.7 26" fill="none" stroke={d} strokeWidth="1.2" />
      <path d="M37 34 L35.5 90 M63 34 L64.5 90" stroke="rgba(0,0,0,0.08)" strokeWidth="1.3" />
    </>
  )
}

export function Shorts({ c, d }) {
  return (
    <>
      <path d="M24 22 H76 L82 72 H56 L50 46 L44 72 H18 Z" fill={c} {...OUTLINE} />
      <path d="M24 22 H76 L76.8 29 H23.2 Z" fill={d} />
      <path d="M48 29 L46.5 35 M52 29 L53.5 35" stroke={d} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M18.6 67 H45.2 M54.8 67 H81.4" stroke={d} strokeWidth="1.5" opacity="0.6" />
    </>
  )
}

export function Jacket({ c, d }) {
  return (
    <>
      <path d="M34 12 L50 34 L66 12 Z" fill="#f7f3ec" {...OUTLINE} />
      <path d="M48.5 15 H51.5 L52.5 21 L50 32 L47.5 21 Z" fill={d} />
      <path d="M34 12 L18 18 L7 74 L17 76 L27 38 L27 92 L73 92 L73 38 L83 76 L93 74 L82 18 L66 12 L50 34 Z" fill={c} {...OUTLINE} />
      <path d="M34 12 L50 34 L40 30 Z M66 12 L50 34 L60 30 Z" fill={d} opacity="0.55" />
      <path d="M50 34 V92" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
      <circle cx="50" cy="58" r="1.8" fill={d} />
      <circle cx="50" cy="70" r="1.8" fill={d} />
      <path d="M32 70 H44 V73 H32 Z M56 70 H68 V73 H56 Z" fill={d} opacity="0.6" />
      <path d="M7.8 70.1 L17.8 72.1 M92.2 70.1 L82.2 72.1" stroke={d} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </>
  )
}

export function Sneaker({ c, d }) {
  return (
    <>
      <path d="M10 64 Q9 46 21 43 L37 41 Q47 54 66 57 L86 61 Q94 63 93 71 L10 71 Z" fill={c} {...OUTLINE} />
      <path d="M10 52 Q9.5 46 14 44 L19 43.5 L19 62 L10 62 Z" fill={d} />
      <path d="M38 51 L43 47.5 M43.5 54.5 L48.5 51 M49.5 57 L54 54" stroke={d} strokeWidth="2" strokeLinecap="round" />
      <path d="M76 59.5 Q90 61 93 68" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" />
      <path d="M8 70 H95 Q95.5 77.5 89 78 H14 Q8 78 8 70 Z" fill="#f2efe8" {...OUTLINE} />
      <path d="M10 73.5 H93" stroke={d} strokeWidth="1.2" opacity="0.6" />
    </>
  )
}

export function Heel({ c, d }) {
  return (
    <>
      <path d="M14 44 Q32 44 52 62 L86 70 Q93 72 91 78 L58 78 Q42 68 24 66 L22 90 L16 90 L14 64 Z" fill={c} {...OUTLINE} />
      <path d="M24 66 L22 90 L16 90 L14.5 70 Z" fill={d} />
      <path d="M18 47.5 Q32 48 47 60" fill="none" stroke={SHINE} strokeWidth="2" strokeLinecap="round" />
      <path d="M70 67 Q82 69 88 72.5" fill="none" stroke={SHINE} strokeWidth="1.6" strokeLinecap="round" />
    </>
  )
}

export function Boot({ c, d }) {
  return (
    <>
      <path d="M28 8 H52 V56 Q56 62 70 64 L84 67 Q92 69 91 80 H28 Z" fill={c} {...OUTLINE} />
      <rect x="27" y="8" width="26" height="7" rx="1.5" fill={d} />
      <path d="M44 16 V60" stroke={d} strokeWidth="1" strokeDasharray="2 2" />
      <rect x="26" y="80" width="67" height="8" rx="2" fill={d} />
    </>
  )
}

export function Handbag({ c, d }) {
  return (
    <>
      <path d="M33 38 Q33 12 50 12 Q67 12 67 38" fill="none" stroke={d} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M18 36 H82 L88 86 Q88 90 84 90 H16 Q12 90 12 86 Z" fill={c} {...OUTLINE} />
      <path d="M18 36 H82 L80 56 Q50 64 20 56 Z" fill={d} opacity="0.3" />
      <circle cx="50" cy="58" r="4" fill={d} />
      <circle cx="50" cy="58" r="1.6" fill="#fff" opacity="0.6" />
    </>
  )
}

export function Tote({ c, d }) {
  return (
    <>
      <path d="M30 36 C30 4 48 4 48 36 M52 36 C52 4 70 4 70 36" fill="none" stroke={d} strokeWidth="3" strokeLinecap="round" />
      <rect x="16" y="34" width="68" height="58" rx="5" fill={c} {...OUTLINE} />
      <rect x="16" y="50" width="68" height="9" fill={d} opacity="0.35" />
    </>
  )
}

export function Hat({ c, d }) {
  return (
    <>
      <ellipse cx="50" cy="66" rx="45" ry="12.5" fill={c} {...OUTLINE} />
      <ellipse cx="50" cy="64" rx="28" ry="6" fill={SHADE} />
      <path d="M27 65 Q27 30 50 30 Q73 30 73 65 Z" fill={c} {...OUTLINE} />
      <path d="M27 56 Q50 61 73 56 L73 64 Q50 69 27 64 Z" fill={d} />
    </>
  )
}

export function Scarf({ c, d }) {
  return (
    <>
      <path d="M53 45 L65 90 L51 93 L45 47 Z" fill={c} {...OUTLINE} />
      <path d="M46.6 58 H56.3 M48.1 70 H59.5 M49.7 82 H62.7" stroke={d} strokeWidth="2.2" />
      <path d="M53 92.6 v4 M56.5 91.8 v4 M60 91.1 v4 M63.5 90.3 v4" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 24 Q50 44 80 24 L82 36 Q50 58 18 36 Z" fill={c} {...OUTLINE} />
      <path d="M19 30 Q50 51 81 30" fill="none" stroke={d} strokeWidth="2" />
    </>
  )
}

export function Sunglasses({ c, d }) {
  return (
    <>
      <path d="M8 40 H92" stroke={d} strokeWidth="3" strokeLinecap="round" />
      <path d="M11 40 H44 Q44 64 27.5 64 Q11 64 11 40 Z" fill={c} {...OUTLINE} />
      <path d="M56 40 H89 Q89 64 72.5 64 Q56 64 56 40 Z" fill={c} {...OUTLINE} />
      <path d="M44 43 Q50 38 56 43" fill="none" stroke={d} strokeWidth="3" strokeLinecap="round" />
      <path d="M16 45 L24 45 M61 45 L69 45" stroke="rgba(255,255,255,0.55)" strokeWidth="2.2" strokeLinecap="round" />
    </>
  )
}

export function Tie({ c, d }) {
  return (
    <>
      <path d="M46 22 H54 L64 78 L50 94 L36 78 Z" fill={c} {...OUTLINE} />
      <path d="M43 50 L57 44 M41 62 L59 55 M39 74 L61 67" stroke={d} strokeWidth="2.4" opacity="0.7" />
      <path d="M42 10 H58 L54 22 H46 Z" fill={d} {...OUTLINE} />
    </>
  )
}

export function Watch({ c, d }) {
  return (
    <>
      <rect x="39" y="4" width="22" height="92" rx="7" fill={d} />
      <circle cx="50" cy="80" r="1.3" fill="rgba(0,0,0,0.25)" />
      <circle cx="50" cy="87" r="1.3" fill="rgba(0,0,0,0.25)" />
      <rect x="70" y="47" width="5" height="6" rx="1.5" fill={c} />
      <circle cx="50" cy="50" r="21" fill={c} {...OUTLINE} />
      <circle cx="50" cy="50" r="16" fill="#fffdf8" />
      <path d="M50 36.5 V39 M63.5 50 H61 M50 63.5 V61 M36.5 50 H39" stroke={d} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M50 50 V40.5 M50 50 L57 54" stroke="#2a2622" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="50" cy="50" r="1.6" fill="#2a2622" />
    </>
  )
}
