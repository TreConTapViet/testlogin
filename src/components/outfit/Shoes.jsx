import { isLight, shade } from '../../lib/color'
import { pathFrom } from './rig'

// Giày vẽ theo mặt nghiêng (u: gót -9 → mũi 23, v: mặt đất 0 → lên trên âm), chiếu theo hướng bàn chân.
// Bề ngang của giày tạo bằng nét viền dày = bề rộng bàn chân × độ quay ngang → nhìn chính diện thành khối giày,
// nhìn nghiêng thành dáng giày, xoay tới đâu khối giày biến đổi tới đó.

const SHOE_W = 15

const sole = (thick, toe = 23) => [
  ['M', -10, -thick],
  ['L', toe, -thick],
  ['C', toe + 2, -thick, toe + 2.5, 0, toe, 0],
  ['L', -9, 0],
  ['C', -11, 0, -11.5, -thick, -10, -thick],
  ['Z'],
]
const laces = (y) => [
  ['M', 1, y],
  ['L', 3, y + 2.4],
  ['M', 4, y + 0.6],
  ['L', 6, y + 3],
  ['M', 7, y + 1.3],
  ['L', 9, y + 3.7],
]
const DRESS_UPPER = [
  ['M', -9, -1.6],
  ['C', -10, -9, -8, -12.5, -4, -12.5],
  ['L', 4, -11.5],
  ['C', 10, -10, 16, -7, 21, -4.5],
  ['C', 24, -3, 24, -1.6, 22, -1.4],
  ['L', -9, -1.4],
  ['Z'],
]
const LOW_UPPER = [
  ['M', -9, -1.6],
  ['C', -10, -8, -8, -10.5, -4, -10.5],
  ['L', 3, -10],
  ['C', 10, -9.5, 16, -6.5, 21, -4],
  ['C', 24, -2.5, 24, -1.4, 22, -1.2],
  ['L', -9, -1.2],
  ['Z'],
]
const BOOT_UPPER = [
  ['M', -9, -2],
  ['L', -9.5, -27],
  ['C', -9.5, -29, -7, -29.5, -5, -29.5],
  ['L', 3, -29.5],
  ['C', 5, -29.5, 5.5, -28, 5.2, -26],
  ['L', 4.6, -16],
  ['C', 8, -13, 15, -8, 20.5, -5],
  ['C', 24, -3, 24, -1.5, 22, -1.2],
  ['L', -9, -1.2],
  ['Z'],
]
const BLOCK_HEEL = (height) => [['M', -9.5, -2], ['L', -3.5, -2], ['L', -4, 0], ['L', -9, 0], ['Z'], ['M', -9.5, 0], ['L', -9.5, -height]]
const PUMP = (heel) => [
  ['M', -8, -heel - 1],
  ['C', -9, -heel - 5, -8, -heel - 8.5, -5, -heel - 8],
  ['L', -2.5, -heel - 6.5],
  ['C', 2, -heel * 0.7 - 3, 6, -7.5, 9, -6.8],
  ['C', 14, -6, 19, -4, 22.5, -1.6],
  ['C', 24, -0.6, 23, 0.2, 21, 0],
  ['L', 9, 0],
  ['C', 4, -1.5, 0, -heel * 0.5, -8, -heel - 0.5],
  ['Z'],
]
const STILETTO = (heel) => [['M', -8.2, -heel], ['L', -6.4, -heel], ['L', -6.2, 0], ['L', -7.1, 0], ['Z']]

const SHOES = {
  sneaker: {
    upper: [['M', -9, -3], ['C', -10, -10, -8, -15.5, -3, -15.5], ['L', 5, -13], ['C', 11, -12, 16, -10, 20, -7], ['C', 23, -5, 24, -3, 22, -2.5], ['L', -9, -2.5], ['Z']],
    sole: sole(3.5),
    soleColor: 'white',
    details: [
      { cmds: laces(-13.4), color: 'lace', width: 1.1 },
      { cmds: [['M', 14, -9.6], ['Q', 16.5, -4.5, 22, -3]], color: 'line' },
      { cmds: [['M', -6, -8], ['Q', 2, -6, 10, -4]], color: 'second', width: 1.6 },
    ],
  },
  chunky: {
    upper: [['M', -9, -6], ['C', -10, -12, -8, -17, -3, -17], ['L', 5, -15], ['C', 11, -14, 16, -12, 20, -9.5], ['C', 23.5, -7.5, 24.5, -6, 22.5, -5.5], ['L', -9, -5.5], ['Z']],
    sole: sole(6.5, 23.5),
    soleColor: 'white',
    details: [
      { cmds: [['M', -9, -9], ['Q', 0, -12, 8, -8], ['L', 14, -7], ['Q', 4, -5, -9, -6.5], ['Z']], fill: 'second' },
      { cmds: laces(-15.2), color: 'lace', width: 1.1 },
    ],
  },
  runner: {
    upper: [['M', -9, -4], ['C', -10, -11, -8, -15, -3.5, -15], ['L', 4, -12.5], ['C', 11, -11, 17, -8.5, 21, -6.5], ['C', 24, -5, 24, -3.5, 22, -3.5], ['L', -9, -3.5], ['Z']],
    sole: [['M', -10, -4.5], ['C', -3, -5.5, 6, -3, 23, -4.5], ['C', 25, -4.5, 25, 0, 23, 0], ['L', -9, 0], ['C', -11, 0, -11.5, -4.5, -10, -4.5], ['Z']],
    soleColor: 'second',
    details: [
      { cmds: laces(-12.8), color: 'lace', width: 1.1 },
      { cmds: [['M', -7, -7], ['Q', 3, -10, 13, -6]], color: 'second', width: 1.5 },
    ],
  },
  oxford: {
    upper: DRESS_UPPER,
    sole: sole(1.6, 22.5),
    soleColor: 'deep',
    heel: BLOCK_HEEL(3),
    gloss: true,
    details: [
      { cmds: [['M', 2, -11.4], ['L', 6.5, -10.1], ['M', 2.4, -10], ['L', 6.6, -8.8]], color: 'line', width: 0.9 },
      { cmds: [['M', 13, -8.5], ['C', 14, -6, 14, -3, 13, -1.6]], color: 'line' },
    ],
  },
  derby: {
    upper: DRESS_UPPER,
    sole: sole(2, 22.5),
    soleColor: 'deep',
    heel: BLOCK_HEEL(3),
    gloss: true,
    details: [
      { cmds: [['M', -1, -12.4], ['C', 3, -12, 7, -10.5, 9, -8.5]], color: 'line' },
      { cmds: laces(-12), color: 'line', width: 0.9 },
    ],
  },
  loafer: {
    upper: LOW_UPPER,
    sole: sole(1.8, 22.5),
    soleColor: 'deep',
    heel: BLOCK_HEEL(2.6),
    gloss: true,
    details: [
      { cmds: [['M', 2.5, -10.2], ['Q', 7, -8.6, 11, -8.6]], color: 'deep', width: 2.4 },
      { cmds: [['M', 9, -8], ['Q', 15, -9, 20, -4.5]], color: 'line', width: 0.8 },
    ],
  },
  boat: {
    upper: LOW_UPPER,
    sole: sole(2.4, 22.5),
    soleColor: 'white',
    details: [
      { cmds: [['M', -8.5, -9.5], ['Q', 0, -11.5, 6, -10]], color: 'light', width: 1.2 },
      { cmds: [['M', 8, -8.4], ['Q', 14, -9.6, 20, -4.6]], color: 'line', width: 0.9 },
    ],
  },
  chelsea: {
    upper: BOOT_UPPER,
    sole: sole(2.6, 22.5),
    soleColor: 'second',
    heel: BLOCK_HEEL(4),
    gloss: true,
    details: [
      { cmds: [['M', -3, -27], ['L', -1, -14], ['L', 3, -14], ['L', 3.5, -27], ['Z']], fill: 'second' },
      { cmds: [['M', -9.5, -29], ['L', -11, -33], ['L', -8.5, -33.5], ['Z']], fill: 'deep' },
    ],
  },
  tallboot: {
    upper: BOOT_UPPER,
    sole: sole(2.6, 22.5),
    soleColor: 'deep',
    heel: BLOCK_HEEL(5),
    gloss: true,
    shaft: true,
    details: [],
  },
  heel: {
    upper: PUMP(9),
    heel: STILETTO(9),
    gloss: true,
    details: [],
  },
  slingback: {
    upper: [['M', 1, -6.5], ['C', 5, -7.5, 10, -6.6, 14, -6], ['C', 18.5, -5, 21.5, -3, 23.5, -1.2], ['C', 24.2, -0.4, 23, 0.2, 21, 0], ['L', 9, 0], ['C', 5.5, -1.5, 3, -3.5, 1, -5], ['Z']],
    heel: STILETTO(6),
    details: [
      { cmds: [['M', -7.5, -13], ['Q', -9.8, -9.5, -7, -7]], color: 'base', width: 1.8, rawWidth: true },
      { cmds: [['M', -8, -6.4], ['C', -4, -4, 2, -2, 9, 0]], color: 'deep', width: 1.6, rawWidth: true },
    ],
  },
  flat: {
    upper: [['M', -8, -2], ['C', -9, -7, -7, -9, -4, -8.5], ['L', 0, -7.5], ['C', 3, -8.5, 9, -8, 14, -6.5], ['C', 19, -5, 22.5, -3.5, 23, -1.8], ['C', 23.5, -0.5, 22, 0, 20, 0], ['L', -8, 0], ['Z']],
    sole: sole(1.2, 22),
    soleColor: 'deep',
    details: [{ cmds: [['M', 5, -8.6], ['Q', 3, -11, 6.5, -10], ['Q', 10, -11, 8, -8.4]], color: 'deep', width: 1.2 }],
  },
  sandal: {
    sole: sole(2.6, 22),
    soleColor: 'base',
    bare: true,
    straps: [
      [['M', 8, -2.5], ['Q', 10.5, -10, 13, -2.5]],
      [['M', 14.5, -2.5], ['Q', 17, -8, 19.5, -2.5]],
      [['M', -6, -2.5], ['Q', -8, -9, -4.5, -9.5]],
    ],
    details: [],
  },
  wedge: {
    sole: [['M', -9.5, -11], ['L', 22, -2.6], ['C', 24, -2, 24, 0, 22, 0], ['L', -9, 0], ['C', -10.5, 0, -10.5, -11, -9.5, -11], ['Z']],
    soleColor: 'second',
    bare: true,
    straps: [
      [['M', 1, -9], ['Q', 7, -15, 13, -4.6]],
      [['M', -7.5, -11.5], ['Q', -2, -21, 3.5, -12.5]],
    ],
    details: [{ cmds: [['M', -8, -5.5], ['L', 20, -1.4]], color: 'line', width: 0.7 }],
  },
  slide: {
    sole: sole(2.8, 22),
    soleColor: 'deep',
    bare: true,
    straps: [[['M', 5, -2.8], ['C', 6, -12, 15, -12, 17, -2.8]]],
    strapWidth: 5,
    details: [],
  },
}

/** Một chiếc giày gắn ở cổ chân của một chân đã chiếu (leg). */
export function Shoe({ leg, item, paint }) {
  const def = SHOES[item.shape.type] ?? SHOES.sneaker
  const map = (u, v) => [leg.ankle.x + u * leg.fx, leg.ground + v]
  const width = SHOE_W * Math.abs(leg.lx)
  const lace = isLight(paint.base) ? shade(paint.base, -28) : '#f4f1ea'
  const colorOf = (key) =>
    ({ lace, line: paint.line, light: paint.light, deep: paint.deep, base: paint.base, white: '#f4f1ea', second: paint.second ?? paint.deep })[key] ??
    paint.line
  const soleColor = colorOf(def.soleColor ?? 'deep')
  const solid = (cmds, color, extra = 0) => {
    const d = pathFrom(cmds, map)
    return (
      <g>
        <path d={d} fill={paint.line} stroke={paint.line} strokeWidth={width + 2 + extra} strokeLinejoin="round" strokeLinecap="round" />
        <path d={d} fill={color} stroke={color} strokeWidth={width + extra} strokeLinejoin="round" strokeLinecap="round" />
      </g>
    )
  }
  return (
    <g>
      {def.sole && solid(def.sole, soleColor)}
      {def.heel && <path d={pathFrom(def.heel, map)} fill={soleColor} stroke={paint.line} strokeWidth="0.8" strokeLinejoin="round" />}
      {def.upper && (
        <g>
          {solid(def.upper, paint.base)}
          <path d={pathFrom(def.upper, map)} fill={paint.shadeH} />
          {def.gloss && (
            <path
              d={pathFrom([['M', 9, -7.2], ['Q', 15, -6, 19.5, -3.6]], map)}
              stroke="#fff"
              strokeOpacity="0.35"
              strokeWidth={Math.max(1.2, width * 0.25)}
              strokeLinecap="round"
              fill="none"
            />
          )}
        </g>
      )}
      {def.straps?.map((cmds, index) => {
        const d = pathFrom(cmds, map)
        const strap = Math.max(def.strapWidth ?? 3, width)
        return (
          <g key={index} fill="none" strokeLinecap="round">
            <path d={d} stroke={paint.line} strokeWidth={strap + 1.6} />
            <path d={d} stroke={paint.base} strokeWidth={strap} />
          </g>
        )
      })}
      {def.details.map((detail, index) => {
        const d = pathFrom(detail.cmds, map)
        if (detail.fill) return <path key={index} d={d} fill={colorOf(detail.fill)} stroke={paint.line} strokeWidth="0.6" />
        return (
          <path
            key={index}
            d={d}
            fill="none"
            stroke={colorOf(detail.color)}
            strokeWidth={detail.rawWidth ? detail.width : Math.max(detail.width ?? 0.8, (detail.width ?? 0.8) * Math.abs(leg.lx) * 1.4)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      })}
    </g>
  )
}
