import { Fabric, Seam, Surface } from './Fabric'
import { SkinLimb } from './Skin'
import { SKIN } from './skinTone'
import { DEPTH, Y, onSurface, outlinePath, pathFrom, r1, smoothstep, surfacePath, toScreen } from './rig'
import { aoDaiShape, dressShape, lapels, neckline, outerOpening, outerShape, seatShape, skirtShape, topShape } from './torsoShapes'

// Các món mặc trên thân. Toạ độ tính "nhìn từ trước" rồi chiếu theo góc xoay của khung hình f.
const ys = Y.shoulder

// Cúc áo: chấm tròn trên bề mặt, dẹt lại khi xoay nghiêng
function Buttons({ f, points, widthAt, r = 1.7, color, back = false }) {
  return points.map(([x, y]) => {
    const p = onSurface(f, x, y, widthAt(y), back)
    if (p.vis <= 0.05) return null
    return (
      <ellipse
        key={`${x}-${y}`}
        cx={r1(p.x)}
        cy={r1(p.y)}
        rx={r1(r * Math.min(1, Math.max(0.3, p.vis)))}
        ry={r}
        fill={color}
        opacity={Math.min(1, p.vis * 3)}
      />
    )
  })
}

// Chi tiết nét mảnh trên mặt trước/sau
function SurfaceSeam({ f, cmds, widthAt, back = false, color, width, opacity, dash }) {
  const { d, vis } = surfacePath(f, cmds, widthAt, back)
  return (
    <Surface vis={vis}>
      <Seam d={d} color={color} width={width} opacity={opacity} dash={dash} />
    </Surface>
  )
}

// Mảnh vải nằm trên bề mặt (lá cổ áo, ve áo, túi…)
function SurfacePiece({ f, cmds, widthAt, paint, back = false, shading = 'h' }) {
  const { d, vis } = surfacePath(f, cmds, widthAt, back)
  return (
    <Surface vis={vis}>
      <Fabric d={d} paint={paint} shading={shading} />
    </Surface>
  )
}

const columnPoints = (x, from, to, step) => {
  const points = []
  for (let y = from; y <= to; y += step) points.push([x, y])
  return points
}

/** Phần thân người que (dưới quần áo): bóng thân mờ thể hiện vóc dáng + cổ, vai, cột sống, hông. */
export function BodyTorso({ f }) {
  const { body } = f
  const ghost = outlinePath(f, [
    ['M', 7, ys - 10],
    ['C', 14, ys - 6, body.shoulder - 6, ys - 2, body.shoulder, ys + 3],
    ['C', body.shoulder + 1, ys + 14, body.chest, Y.chest - 14, body.chest, Y.chest],
    ['C', body.chest, Y.chest + 22, body.waist, Y.waist - 20, body.waist, Y.waist],
    ['C', body.waist, Y.waist + 18, body.hip, Y.hip - 18, body.hip, Y.hip],
    ['Q', body.hip, Y.hip + 22, 0, Y.hip + 24],
    ['Q', -body.hip, Y.hip + 22, -body.hip, Y.hip],
    ['C', -body.hip, Y.hip - 18, -body.waist, Y.waist + 18, -body.waist, Y.waist],
    ['C', -body.waist, Y.waist - 20, -body.chest, Y.chest + 22, -body.chest, Y.chest],
    ['C', -body.chest, Y.chest - 14, -body.shoulder - 1, ys + 14, -body.shoulder, ys + 3],
    ['C', -body.shoulder + 6, ys - 2, -14, ys - 6, -7, ys - 10],
    ['Z'],
  ])
  const { L: armL, R: armR } = f.arms
  const { L: legL, R: legR } = f.legs
  return (
    <g>
      {/* Bóng thân màu da trong suốt cho thấy vóc dáng, khung người que màu da phía trên */}
      {/* Lớp nền che những gì nằm sau thân (tóc dài, tay phía sau) như một ma-nơ-canh thật */}
      <path d={ghost} style={{ fill: 'var(--bg)' }} />
      <path d={ghost} fill={SKIN.base} fillOpacity="0.28" stroke={SKIN.line} strokeOpacity="0.35" strokeWidth="1" />
      <SkinLimb d={`M ${r1(f.neck.x)} ${r1(f.head.y + 18)} L ${r1(f.neck.x)} ${r1(f.hipY)}`} width={11} />
      <SkinLimb d={`M ${r1(armL.shoulder.x)} ${r1(armL.shoulder.y)} L ${r1(armR.shoulder.x)} ${r1(armR.shoulder.y)}`} width={10} />
      <SkinLimb d={`M ${r1(legL.hip.x)} ${r1(legL.hip.y)} L ${r1(legR.hip.x)} ${r1(legR.hip.y)}`} width={10} />
    </g>
  )
}

// Mũ trùm của hoodie: phía trước là vòng vải quanh cổ, quay lưng thì thấy mũ thả sau lưng
const hoodFront = (nw) => [
  ['M', -nw - 9, ys - 3],
  ['C', -nw - 12, ys - 24, nw + 12, ys - 24, nw + 9, ys - 3],
  ['Q', 0, ys - 10, -nw - 9, ys - 3],
  ['Z'],
]
const hoodBack = (nw) => [
  ['M', -nw - 7, ys - 8],
  ['C', -nw - 15, ys + 36, nw + 15, ys + 36, nw + 7, ys - 8],
  ['Q', 0, ys - 2, -nw - 7, ys - 8],
  ['Z'],
]

// Cổ lọ / cổ đứng: ống vải tròn quanh cổ (không co theo độ dày thân)
function NeckTube({ f, nw, top, paint, ribs }) {
  const map = (x, y) => [f.axisX + x, y + f.lift]
  const d = pathFrom(
    [['M', -nw + 1.5, top], ['Q', 0, top + 2.5, nw - 1.5, top], ['L', nw, ys - 7], ['Q', 0, ys - 4, -nw, ys - 7], ['Z']],
    map,
  )
  return (
    <g>
      <Fabric d={d} paint={paint} />
      {ribs &&
        [-0.7, -0.35, 0, 0.35, 0.7].map((ratio) => {
          const a = onSurface(f, ratio * (nw - 1.5), top + 2, nw - 1.5, false, 1)
          const b = onSurface(f, ratio * nw, ys - 7, nw, false, 1)
          if (a.vis <= 0.05) return null
          return <Seam key={ratio} d={`M ${r1(a.x)} ${r1(a.y)} L ${r1(b.x)} ${r1(b.y)}`} color={paint.dark} opacity={0.5} />
        })}
    </g>
  )
}

// Cổ áo + nẹp cúc + túi ngực dùng chung cho áo và đầm
function Neckline({ f, neck, nw, hemY, widthAt, paint, buttons }) {
  if (neck === 'turtle') return <NeckTube f={f} nw={nw - 1} top={ys - 24} paint={paint} ribs />
  const shapes = neckline(neck, nw)
  const inner = surfacePath(f, shapes.inner, widthAt)
  const placket = { collar: ys + 11, cuban: ys + 28, polo: ys + 4, henley: ys + 2 }[neck]
  const placketEnd = { polo: ys + 28, henley: ys + 24 }[neck] ?? hemY - 6
  return (
    <g>
      <Surface vis={inner.vis}>
        <path d={inner.d} fill={paint.deep} />
      </Surface>
      {shapes.trim && <SurfaceSeam f={f} cmds={shapes.trim} widthAt={widthAt} color={paint.dark} width={2.4} opacity={0.9} />}
      {placket != null && (
        <>
          <SurfaceSeam f={f} cmds={[['M', 0, placket], ['L', 0, placketEnd]]} widthAt={widthAt} color={paint.line} opacity={0.6} />
          {buttons && (
            <Buttons
              f={f}
              points={columnPoints(1.6, placket + 6, placketEnd - 2, neck === 'polo' || neck === 'henley' ? 9 : 20)}
              widthAt={widthAt}
              color={paint.dark}
            />
          )}
        </>
      )}
      {shapes.collar?.map((cmds, index) => (
        <SurfacePiece key={index} f={f} cmds={cmds} widthAt={widthAt} paint={paint} />
      ))}
    </g>
  )
}

/** Áo (lớp trong): áo thun, sơ mi, polo, len, hoodie, áo kiểu, croptop, hai dây, corset… */
export function TopWear({ f, item, paint }) {
  const { shape } = item
  const geo = topShape(f.body, shape)
  const w = geo.widthAt
  const backView = f.c < 0
  return (
    <g>
      {shape.neck === 'hood' && !backView && <Fabric d={outlinePath(f, hoodFront(geo.nw))} paint={paint} />}
      <Fabric d={outlinePath(f, geo.cmds)} paint={paint} shading="hv" />

      {/* Nếp gấp nhẹ hai bên eo */}
      {shape.length !== 'crop' && (
        <g>
          {[-1, 1].map((side) => (
            <Seam
              key={side}
              d={outlinePath(f, [['M', side * (geo.wa - 3), Y.waist - 4], ['Q', side * (geo.wa - 8), Y.waist + 2, side * (geo.wa - 13), Y.waist + 1]])}
              color={paint.dark}
              opacity={0.45}
            />
          ))}
        </g>
      )}

      {geo.strap ? (
        // Dây áo: phía trước và phía sau
        [false, true].map((back) =>
          [-1, 1].map((side) => {
            const { d, vis } = surfacePath(f, [['M', side * (geo.nw + 7), ys + 16], ['L', side * (geo.nw + 4), ys - 7]], w, back)
            return (
              <Surface key={`${back}-${side}`} vis={vis}>
                <path d={d} stroke={paint.line} strokeWidth="3.6" strokeLinecap="round" fill="none" />
                <path d={d} stroke={paint.base} strokeWidth="2.4" strokeLinecap="round" fill="none" />
              </Surface>
            )
          }),
        )
      ) : (
        <Neckline f={f} neck={shape.neck} nw={geo.nw} hemY={geo.hemY} widthAt={w} paint={paint} buttons={shape.buttons || shape.neck === 'polo' || shape.neck === 'henley'} />
      )}

      {shape.seams &&
        [-15, -7, 7, 15].map((x) => (
          <SurfaceSeam key={x} f={f} cmds={[['M', x, ys + 18], ['Q', x * 0.7, Y.chest + 26, x * 0.85, geo.hemY - 1]]} widthAt={w} color={paint.dark} opacity={0.7} />
        ))}

      {shape.pocket && (
        <SurfaceSeam
          f={f}
          cmds={[['M', geo.ch - 18, Y.chest - 4], ['L', geo.ch - 8, Y.chest - 4], ['L', geo.ch - 8, Y.chest + 8], ['Q', geo.ch - 13, Y.chest + 10.5, geo.ch - 18, Y.chest + 8], ['Z']]}
          widthAt={w}
          color={paint.line}
          opacity={0.7}
        />
      )}

      {shape.graphic && (() => {
        const p = onSurface(f, 0, Y.chest + 10, w(Y.chest + 10))
        if (p.vis <= 0.05) return null
        const sx = Math.min(1, p.vis)
        return (
          <g opacity={Math.min(1, p.vis * 3)} transform={`translate(${r1(p.x)} ${r1(p.y)}) scale(${r1(sx * 100) / 100} 1)`}>
            <circle r="10" fill={paint.second} />
            <circle cy="-2" r="4" fill="#fff" opacity="0.75" />
            <path d="M-9 4 Q-4.5 0 0 4 T 9 4" stroke="#fff" strokeWidth="1.6" fill="none" opacity="0.8" />
          </g>
        )
      })()}

      {shape.kangaroo && (
        <SurfaceSeam
          f={f}
          cmds={[['M', -15, Y.waist + 16], ['L', 15, Y.waist + 16], ['L', 19, Y.hip + 8], ['L', -19, Y.hip + 8], ['Z']]}
          widthAt={w}
          color={paint.line}
          opacity={0.75}
        />
      )}
      {shape.neck === 'hood' && !backView && (
        <SurfaceSeam f={f} cmds={[['M', -4, ys + 2], ['L', -5, ys + 30], ['M', 4, ys + 2], ['L', 5, ys + 30]]} widthAt={w} color={paint.light} width={1.4} opacity={0.95} />
      )}

      {/* Bo gấu áo len/hoodie hoặc đường may gấu */}
      <Seam
        d={outlinePath(f, [['M', -geo.hw + 1, geo.hemY - (shape.ribbed ? 6 : 2.5)], ['Q', 0, geo.hemY + (shape.ribbed ? -3 : 0.5), geo.hw - 1, geo.hemY - (shape.ribbed ? 6 : 2.5)]])}
        color={paint.dark}
        width={shape.ribbed ? 1.2 : 0.9}
        opacity={0.5}
      />

      {/* Mặt sau: cầu vai sơ mi, mũ hoodie */}
      {['collar', 'cuban', 'polo'].includes(shape.neck) && (
        <SurfaceSeam f={f} cmds={[['M', -geo.sh + 7, ys + 13], ['Q', 0, ys + 16, geo.sh - 7, ys + 13]]} widthAt={w} back color={paint.dark} opacity={0.6} />
      )}
      {shape.neck === 'hood' && <SurfacePiece f={f} cmds={hoodBack(geo.nw)} widthAt={w} paint={paint} back />}
    </g>
  )
}

// Chi tiết riêng từng kiểu áo khoác (vẽ bên trong vùng đã khoét phần mở)
function OuterDetails({ f, geo, paint, style }) {
  const w = geo.widthAt
  const { spec, ch, hemY } = geo
  const seam = (cmds, props = {}) => <SurfaceSeam f={f} cmds={cmds} widthAt={w} color={paint.line} opacity={0.6} {...props} />
  const flapPocket = (x, y, wide = 12) =>
    seam([['M', x - wide / 2, y], ['L', x + wide / 2, y], ['L', x + wide / 2, y + 4], ['L', x - wide / 2, y + 4], ['Z']])
  switch (style) {
    case 'blazer':
      return (
        <>
          {flapPocket(-(ch - 12), Y.hip - 4, 13)}
          {flapPocket(ch - 12, Y.hip - 4, 13)}
          {seam([['M', -(ch - 8), Y.chest + 4], ['L', -(ch - 18), Y.chest + 4]], { width: 1.4 })}
          <Buttons f={f} points={[[1.5, spec.bp + 1], [1.5, spec.bp + 17]]} widthAt={w} r={2} color={paint.deep} />
        </>
      )
    case 'trench':
      return (
        <>
          <Buttons f={f} points={[[-8, Y.chest + 16], [8, Y.chest + 16], [-8, Y.chest + 36], [8, Y.chest + 36], [-8, Y.hip + 30], [8, Y.hip + 30]]} widthAt={w} r={2} color={paint.deep} />
          {seam([['M', -(ch - 4), ys + 6], ['Q', -(ch - 10), Y.chest + 6, -(ch - 18), Y.chest + 10]])}
          {seam([['M', 0, Y.hip + 50], ['L', 0, hemY - 2]], { back: true })}
        </>
      )
    case 'coat':
      return (
        <>
          <Buttons f={f} points={[[3, spec.bp + 12], [3, spec.bp + 36], [3, spec.bp + 60]]} widthAt={w} r={2.1} color={paint.deep} />
          {seam([['M', -(ch - 6), Y.hip + 4], ['L', -(ch - 18), Y.hip + 1]], { width: 1.4 })}
          {seam([['M', ch - 6, Y.hip + 4], ['L', ch - 18, Y.hip + 1]], { width: 1.4 })}
          {seam([['M', 0, Y.waist], ['L', 0, hemY - 2]], { back: true })}
        </>
      )
    case 'denim':
    case 'utility':
      return (
        <>
          {flapPocket(-(ch - 13), Y.chest - 2, 12)}
          {flapPocket(ch - 13, Y.chest - 2, 12)}
          {style === 'utility' && flapPocket(-(ch - 13), Y.hip - 8, 14)}
          {style === 'utility' && flapPocket(ch - 13, Y.hip - 8, 14)}
          {seam([['M', -(geo.hw - 1), hemY - 7], ['L', geo.hw - 1, hemY - 7]])}
          {seam([['M', -(geo.nw + 4), ys + 14], ['L', -(ch - 5), ys + 16]], { back: true })}
          <Buttons f={f} points={columnPoints(8, ys + 12, hemY - 10, style === 'denim' ? 18 : 15)} widthAt={w} r={1.8} color={paint.deep} />
        </>
      )
    case 'overshirt':
      return (
        <>
          {flapPocket(-(ch - 13), Y.chest - 2, 11)}
          {flapPocket(ch - 13, Y.chest - 2, 11)}
          <Buttons f={f} points={columnPoints(7, ys + 12, hemY - 8, 17)} widthAt={w} r={1.7} color={paint.deep} />
        </>
      )
    case 'leather':
      return (
        <>
          {seam([['M', 6, ys + 4], ['L', 5, hemY - 1]], { color: paint.light, width: 1.3, opacity: 0.8 })}
          {seam([['M', -(ch - 9), Y.chest + 2], ['L', -(ch - 15), Y.waist - 6]], { color: paint.light, width: 1.2, opacity: 0.7 })}
          {seam([['M', -(ch - 12), Y.chest - 12], ['Q', -(ch - 16), Y.chest + 8, -(ch - 20), Y.waist]], { color: '#fff', width: 2, opacity: 0.16 })}
        </>
      )
    case 'bomber':
      return (
        <>
          <Seam d={outlinePath(f, [['M', -geo.hw + 1, hemY - 4], ['Q', 0, hemY - 1, geo.hw - 1, hemY - 4]])} color={paint.dark} width={5} opacity={0.45} />
          <Seam d={outlinePath(f, [['M', -geo.nw - 3, ys - 9], ['Q', 0, ys - 3, geo.nw + 3, ys - 9]])} color={paint.dark} width={4} opacity={0.55} />
          {seam([['M', -(ch - 6), Y.chest - 2], ['L', -(ch - 14), Y.chest + 6]], { width: 1.6 })}
        </>
      )
    case 'cardigan':
      return (
        <>
          <Buttons f={f} points={columnPoints(0.5, spec.vy + 5, hemY - 8, 14)} widthAt={w} r={1.8} color={paint.deep} />
          {seam([['M', -(geo.hw - 1), hemY - 5], ['L', geo.hw - 1, hemY - 5]], { color: paint.dark, width: 1.2 })}
        </>
      )
    case 'puffer':
      return (
        <>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
            const y = ys + 18 + index * 15
            if (y > hemY - 6) return null
            const half = w(y) - 0.5
            return <Seam key={y} d={outlinePath(f, [['M', -half, y], ['Q', 0, y + 2.5, half, y]])} color={paint.dark} width={1.2} opacity={0.55} />
          })}
          <Seam d={pathFrom([['M', -geo.nw - 3, ys - 13], ['L', geo.nw + 3, ys - 13], ['L', geo.nw + 4, ys - 3], ['L', -geo.nw - 4, ys - 3], ['Z']], (x, y) => [f.axisX + x, y + f.lift])} color={paint.line} width={1} opacity={0.6} />
          {seam([['M', 0, ys - 4], ['L', 0, hemY - 1]], { color: paint.deep, width: 1.3, opacity: 0.85 })}
        </>
      )
    case 'vest':
      return (
        <>
          <Buttons f={f} points={columnPoints(0.5, spec.vy + 4, hemY - 10, 12)} widthAt={w} r={1.7} color={paint.deep} />
          {seam([['M', -(ch - 9), Y.waist + 10], ['L', -(ch - 19), Y.waist + 8]], { width: 1.3 })}
          {seam([['M', ch - 9, Y.waist + 10], ['L', ch - 19, Y.waist + 8]], { width: 1.3 })}
        </>
      )
    default:
      return null
  }
}

/** Áo khoác mặc ngoài: phần mở phía trước được khoét bằng mask để thấy áo bên trong. */
export function OuterWear({ f, item, paint, uid }) {
  const style = item.shape.style
  const geo = outerShape(f.body, style)
  const w = geo.widthAt
  const d = outlinePath(f, geo.cmds)
  const opening = outerOpening(geo)
  const open = opening ? surfacePath(f, opening, w) : null
  const useMask = open && open.vis > -0.1
  const maskId = `${uid}-outer-mask`
  const clipId = `${uid}-outer-clip`
  const hasLapels = geo.spec.open === 'lapel'
  const collar = geo.spec.collar ? neckline(style === 'leather' ? 'cuban' : 'collar', geo.nw - 1).collar : null
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={d} />
        </clipPath>
        {useMask && (
          <mask id={maskId} maskUnits="userSpaceOnUse" x="-80" y="-80" width="420" height="640">
            <rect x="-80" y="-80" width="420" height="640" fill="#fff" />
            <path d={open.d} fill="#000" />
          </mask>
        )}
      </defs>
      <g mask={useMask ? `url(#${maskId})` : undefined}>
        <Fabric d={d} paint={paint} shading="hv" />
        <OuterDetails f={f} geo={geo} paint={paint} style={style} />
        {/* Mép vải dọc phần mở (nửa ngoài của nét bị mask che nên chỉ còn mép trên vải) */}
        {useMask && (
          <g clipPath={`url(#${clipId})`}>
            <path d={open.d} fill="none" stroke={paint.line} strokeWidth="2.2" strokeLinejoin="round" />
          </g>
        )}
      </g>
      {item.shape.style === 'trench' && (
        <Fabric
          d={outlinePath(f, [['M', -(w(Y.waist) + 0.5), Y.waist - 3], ['L', w(Y.waist) + 0.5, Y.waist - 3], ['L', w(Y.waist + 6) + 0.5, Y.waist + 4], ['L', -(w(Y.waist + 6) + 0.5), Y.waist + 4], ['Z']])}
          paint={paint}
        />
      )}
      {hasLapels &&
        lapels(geo).map((cmds, index) => (
          <g key={index}>
            <SurfacePiece f={f} cmds={cmds} widthAt={w} paint={paint} />
          </g>
        ))}
      {collar?.map((cmds, index) => (
        <SurfacePiece key={index} f={f} cmds={cmds} widthAt={w} paint={paint} />
      ))}
    </g>
  )
}

/** Đầm: thân + chân váy một mảnh, cổ áo, dây, đai eo, cúc. */
export function DressWear({ f, item, paint }) {
  const { shape } = item
  const geo = dressShape(f.body, shape)
  const w = geo.widthAt
  const folds = shape.skirt === 'bodycon' ? [] : [-0.62, -0.22, 0.22, 0.62]
  return (
    <g>
      <Fabric d={outlinePath(f, geo.cmds, true)} paint={paint} shading="hv" />
      {folds.map((ratio) => (
        <Seam
          key={ratio}
          d={outlinePath(f, [['M', ratio * geo.wa, Y.waist + 10], ['Q', ratio * geo.hip, Y.hip + 20, ratio * geo.hw * 0.92, geo.hemY - 3]], true)}
          color={paint.dark}
          opacity={0.4}
        />
      ))}
      {geo.strap ? (
        <>
          {[false, true].map((back) =>
            [-1, 1].map((side) => {
              const { d, vis } = surfacePath(f, [['M', side * (geo.ch - 7), ys + 16], ['L', side * (geo.nw + 4), ys - 7]], w, back)
              return (
                <Surface key={`${back}-${side}`} vis={vis}>
                  <path d={d} stroke={paint.line} strokeWidth="3.4" strokeLinecap="round" fill="none" />
                  <path d={d} stroke={paint.base} strokeWidth="2.2" strokeLinecap="round" fill="none" />
                </Surface>
              )
            }),
          )}
          {shape.neck === 'cowl' &&
            [ys + 24, ys + 32].map((y) => (
              <SurfaceSeam key={y} f={f} cmds={[['M', -(geo.ch - 9), y - 6], ['Q', 0, y + 8, geo.ch - 9, y - 6]]} widthAt={w} color={paint.dark} opacity={0.55} />
            ))}
        </>
      ) : (
        <Neckline f={f} neck={shape.neck} nw={geo.nw} hemY={Y.waist} widthAt={w} paint={paint} buttons={shape.buttons} />
      )}
      {shape.belt && (
        <>
          <Fabric
            d={outlinePath(f, [['M', -(geo.wa + 0.6), Y.waist - 4], ['L', geo.wa + 0.6, Y.waist - 4], ['L', geo.wa + 1, Y.waist + 4], ['L', -(geo.wa + 1), Y.waist + 4], ['Z']])}
            paint={paint}
          />
          <SurfacePiece
            f={f}
            cmds={[['M', -9, Y.waist], ['Q', -15, Y.waist - 8, -16, Y.waist + 1], ['Q', -15, Y.waist + 8, -9, Y.waist], ['M', -9, Y.waist + 1], ['L', -12, Y.waist + 22], ['L', -8, Y.waist + 20], ['Z']]}
            widthAt={w}
            paint={paint}
          />
        </>
      )}
      {shape.buttons && (
        <Buttons f={f} points={columnPoints(1.6, Y.waist + 10, geo.hemY - 12, 22)} widthAt={w} color={paint.dark} />
      )}
    </g>
  )
}

// Tà áo dài hướng theo mặt người (tà trước) hoặc lưng (tà sau) khi xoay nghiêng
function panelMap(f, body, sign) {
  const depth = body.hip * DEPTH * 0.9
  return (x, y) => {
    const [px, py] = toScreen(f, x, y)
    return [px + sign * depth * f.s * smoothstep(Y.waist + 6, Y.waist + 40, y), py]
  }
}

/**
 * Áo dài: part 'main' = thân áo + tà phía đang quay về người xem; 'panel' = tà còn lại (nằm sau chân).
 * Quần lụa (màu phụ) vẽ ở phần chân và phần hông.
 */
export function AoDaiWear({ f, paint, part }) {
  const geo = aoDaiShape(f.body, f.body.gender)
  const w = geo.widthAt
  const facing = f.c >= 0 ? 1 : -1
  if (part === 'panel') {
    return <Fabric d={pathFrom(geo.panel, panelMap(f, f.body, -facing))} paint={paint} shading="hv" />
  }
  const closure = surfacePath(f, [['M', -1, ys - 7], ['C', -6, ys + 2, -(geo.ch - 10), ys + 3, -(geo.ch - 2), Y.chest - 8]], w)
  return (
    <g>
      <Fabric d={pathFrom(geo.cmds, panelMap(f, f.body, facing))} paint={paint} shading="hv" />
      <Surface vis={closure.vis}>
        <Seam d={closure.d} color={paint.line} width={1} opacity={0.7} />
      </Surface>
      <Buttons f={f} points={[[-4, ys - 1], [-11, ys + 4], [-18, ys + 9]]} widthAt={w} r={1.3} color={paint.light} />
      <Seam
        d={pathFrom([['M', -(geo.wa - 1.5), geo.slitY + 4], ['C', -(geo.wa - 2), geo.slitY + 60, -(geo.pw - 3), geo.hemY - 60, -(geo.pw - 1.5), geo.hemY - 2]], panelMap(f, f.body, facing))}
        color={paint.dark}
        opacity={0.35}
      />
      <NeckTube f={f} nw={geo.nw} top={ys - 22} paint={paint} />
    </g>
  )
}

/** Phần hông của quần (cạp, túi, khoá); hai ống quần vẽ cùng chân. */
export function PantsSeat({ f, item, paint }) {
  const geo = seatShape(f.body, item)
  const w = geo.widthAt
  const style = item.shape.style
  const seam = (cmds, props = {}) => <SurfaceSeam f={f} cmds={cmds} widthAt={w} color={paint.line} opacity={0.6} {...props} />
  return (
    <g>
      <Fabric d={outlinePath(f, geo.cmds)} paint={paint} shading="hv" />
      <Seam d={outlinePath(f, [['M', -geo.wb, geo.top + 4.5], ['L', geo.wb, geo.top + 4.5]])} color={paint.dark} width={style === 'jogger' ? 2.4 : 1} opacity={0.6} />
      {style === 'jogger' ? (
        seam([['M', -2, geo.top + 4], ['L', -4, geo.top + 16], ['M', 2, geo.top + 4], ['L', 4, geo.top + 15]], { color: paint.light, width: 1.3, opacity: 0.95 })
      ) : (
        <>
          {seam([['M', 1.5, geo.top + 5], ['L', 1.5, geo.crotch - 10], ['Q', 1.5, geo.crotch - 5, -2, geo.crotch - 4]])}
          {[-1, 1].map((side) => (
            <g key={side}>
              {seam([['M', side * (geo.wb - 1.5), geo.top + 3], ['Q', side * (geo.wb - 2), geo.top + 15, side * (geo.hip - 1), geo.top + 19]])}
              {seam([['M', side * (geo.wb - 6), geo.top], ['L', side * (geo.wb - 6), geo.top + 5]], { width: 1.6, color: paint.dark })}
              {style === 'jeans' &&
                seam(
                  [['M', side * 5, Y.hip - 5], ['L', side * 15, Y.hip - 5], ['L', side * 15, Y.hip + 7], ['L', side * 10, Y.hip + 10], ['L', side * 5, Y.hip + 7], ['Z']],
                  { back: true, opacity: 0.7 },
                )}
            </g>
          ))}
        </>
      )}
    </g>
  )
}

/** Chân váy: chữ A, bút chì, xếp ly, maxi. */
export function SkirtWear({ f, item, paint }) {
  const { shape } = item
  const geo = skirtShape(f.body, shape)
  const pleats = shape.shape === 'pleated' ? [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75] : shape.shape === 'pencil' ? [] : [-0.5, 0, 0.5]
  return (
    <g>
      <Fabric d={outlinePath(f, geo.cmds, true)} paint={paint} shading="hv" />
      <Seam d={outlinePath(f, [['M', -geo.wb, geo.top + 5], ['L', geo.wb, geo.top + 5]])} color={paint.dark} width={1.1} opacity={0.6} />
      {pleats.map((ratio) => (
        <Seam
          key={ratio}
          d={outlinePath(f, [['M', ratio * geo.wb, geo.top + 8], ['Q', ratio * geo.hip, Y.hip + 10, ratio * geo.hw * 0.94, geo.hemY - 2]], true)}
          color={paint.dark}
          opacity={shape.shape === 'pleated' ? 0.55 : 0.32}
        />
      ))}
      {shape.shape === 'pencil' && (
        <SurfaceSeam f={f} cmds={[['M', 0, geo.hemY - 22], ['L', 0, geo.hemY]]} widthAt={geo.widthAt} back color={paint.line} opacity={0.7} />
      )}
    </g>
  )
}

/** Thắt lưng: bản da quanh eo + khoá kim loại phía trước. */
export function BeltWear({ f, paint, y, half }) {
  const band = outlinePath(f, [['M', -half, y], ['L', half, y], ['L', half, y + 6], ['L', -half, y + 6], ['Z']])
  const buckle = surfacePath(f, [['M', -4, y - 1], ['L', 4, y - 1], ['L', 4, y + 7], ['L', -4, y + 7], ['Z']], () => half)
  return (
    <g>
      <Fabric d={band} paint={paint} />
      <Surface vis={buckle.vis}>
        <path d={buckle.d} fill="none" stroke={paint.second} strokeWidth="1.7" strokeLinejoin="round" />
      </Surface>
    </g>
  )
}
