import { WARDROBE_BY_ID } from '../../data/wardrobe'
import { BackpackPack, BackpackStraps, CrossbodyBag, NecklaceWear, ScarfWear, TieWear, ToteBag } from './Accessories'
import { HairPieces } from './Hair'
import { resolveHair } from './hairShapes'
import { HeadFigure } from './HeadWear'
import { ArmFigure, LegFigure } from './LimbWear'
import PatternDefs from './PatternDefs'
import { isTucked, paintOf, sleeveLayers, solidPaint } from './paint'
import { DEPTH, GROUND, Y, leanTransform, r1, shoulderJoint, tiltTransform, torsoHalf } from './rig'
import { aoDaiShape, dressShape, outerShape, seatShape, skirtShape, topShape } from './torsoShapes'
import { AoDaiWear, BeltWear, BodyTorso, DressWear, OuterWear, PantsSeat, SkirtWear, TopWear } from './TorsoWear'

// Quần lụa mặc cùng áo dài (màu phụ của áo dài)
const AO_DAI_PANTS = { id: 'quan-ao-dai', kind: 'pants', shape: { fit: 'wide', length: 'long', style: 'trousers' } }

/**
 * Vẽ toàn bộ ma-nơ-canh từ một khung hình đã chiếu (f) và các món đang mặc.
 * Thứ tự vẽ theo chiều sâu: tay/ba lô phía sau → chân → thân & quần áo → đầu → tay phía trước.
 * ghost = true: chỉ vẽ quần áo, ẩn người que (dùng cho icon kiểu "ma-nơ-canh vô hình").
 */
export default function MannequinFigure({ f, worn, uid, hair = null, ghost = false }) {
  const { body } = f
  const items = {}
  const paints = {}
  for (const [slot, piece] of Object.entries(worn)) {
    if (!piece) continue
    items[slot] = WARDROBE_BY_ID[piece.itemId]
    paints[slot] = paintOf(uid, slot, piece)
  }
  const { top, dress, bottom, outer, bag } = items
  const aodai = dress?.kind === 'aodai'
  const tucked = isTucked(worn)

  // Bề mặt mà phụ kiện cổ/ngực bám vào: áo → đầm/áo dài → thân người
  let carrier = (y) => torsoHalf(body, y) + 1
  if (top) carrier = topShape(body, top.shape).widthAt
  else if (aodai) carrier = aoDaiShape(body, body.gender).widthAt
  else if (dress) carrier = dressShape(body, dress.shape).widthAt
  const outerW = outer ? outerShape(body, outer.shape.style).widthAt : null
  const onTop = (y) => (outerW ? outerW(y) : carrier(y))

  // Thắt lưng nằm ở cạp quần/váy, eo đầm, hoặc eo áo
  let belt = null
  if (items.belt) {
    if (bottom?.kind === 'pants') {
      const seat = seatShape(body, bottom)
      belt = { y: seat.top + 0.5, half: seat.wb + 0.8 }
    } else if (bottom?.kind === 'skirt') {
      const skirt = skirtShape(body, bottom.shape)
      belt = { y: skirt.top, half: skirt.wb + 0.8 }
    } else if (dress && !aodai) {
      belt = { y: Y.waist - 3, half: dressShape(body, dress.shape).wa + 1 }
    } else {
      belt = { y: Y.waist + 2, half: carrier(Y.waist + 2) + 0.8 }
    }
  }
  const beltOverTop = tucked || !top || top.shape.length === 'crop'

  // Chân: ống quần (quần hoặc quần lụa áo dài) + giày
  const legPants = bottom?.kind === 'pants'
    ? { item: bottom, paint: paints.bottom }
    : aodai
      ? { item: AO_DAI_PANTS, paint: solidPaint(uid, worn.dress.color2 ?? '#fbfbf9') }
      : null
  const shoe = items.shoes ? { item: items.shoes, paint: paints.shoes } : null

  // Tay: các lớp tay áo, đồng hồ (tay phải màn hình), vòng tay + túi cầm tay (tay trái màn hình)
  const chestOf = {
    top: top ? topShape(body, top.shape).ch : 0,
    dress: aodai ? aoDaiShape(body, body.gender).ch : dress ? dressShape(body, dress.shape).ch : 0,
    outer: outer ? outerShape(body, outer.shape.style).ch : 0,
  }
  const sleeves = sleeveLayers(worn).map((layer) => ({ layer, paint: paints[layer.slot], ch: chestOf[layer.slot] }))
  const heldBag = bag && (bag.shape.type === 'handbag' || bag.shape.type === 'clutch') ? { item: bag, paint: paints.bag } : null
  const arms = ['L', 'R'].map((key) => ({
    key,
    arm: f.arms[key],
    watch: key === 'R' && items.watch ? paints.watch : null,
    bracelet: key === 'L' && items.bracelet ? paints.bracelet : null,
    held: key === 'L' ? heldBag : null,
  }))
  const behind = -0.3 * shoulderJoint(body)
  const backArms = arms.filter(({ arm }) => arm.depth < behind).sort((a, b) => a.arm.depth - b.arm.depth)
  const frontArms = arms.filter(({ arm }) => arm.depth >= behind).sort((a, b) => a.arm.depth - b.arm.depth)
  const legs = [f.legs.L, f.legs.R].sort((a, b) => a.depth - b.depth)

  // Tóc: đội mũ thì phần tóc trên đỉnh ép xuống
  const hairSpec = hair && !ghost ? resolveHair(hair, { hat: Boolean(items.hat) }) : null

  const backpack = bag?.shape.type === 'backpack'
  const packInFront = backpack && -(body.chest * DEPTH + 7) * f.c > 0
  const lean = leanTransform(f)

  const renderArm = ({ key, arm, watch, bracelet, held }) => (
    <ArmFigure key={key} f={f} arm={arm} sleeves={sleeves} watch={watch} bracelet={bracelet} held={held} ghost={ghost} />
  )

  return (
    <g>
      <PatternDefs uid={uid} worn={worn} />
      {!ghost && <ellipse cx={r1(f.axisX)} cy={GROUND + 2} rx="46" ry="6" fill="currentColor" opacity="0.09" />}

      <g transform={lean}>
        {/* Tóc dài / đuôi ngựa nằm sau lưng khi ma-nơ-canh quay mặt về phía người xem */}
        {hairSpec && (
          <g transform={tiltTransform(f)}>
            <HairPieces f={f} hair={hairSpec} layer="behind" />
          </g>
        )}
        {backArms.map(renderArm)}
        {backpack && !packInFront && <BackpackPack f={f} paint={paints.bag} />}
        {aodai && <AoDaiWear f={f} paint={paints.dress} part="panel" />}
      </g>

      {legs.map((leg) => (
        <LegFigure key={leg.side} f={f} leg={leg} pants={legPants} shoe={shoe} ghost={ghost} />
      ))}

      <g transform={lean}>
        {!ghost && <BodyTorso f={f} />}
        {aodai && <PantsSeat f={f} item={AO_DAI_PANTS} paint={legPants.paint} />}
        {top && tucked && <TopWear f={f} item={top} paint={paints.top} />}
        {bottom?.kind === 'pants' && <PantsSeat f={f} item={bottom} paint={paints.bottom} />}
        {bottom?.kind === 'skirt' && <SkirtWear f={f} item={bottom} paint={paints.bottom} />}
        {belt && !beltOverTop && <BeltWear f={f} paint={paints.belt} y={belt.y} half={belt.half} />}
        {top && !tucked && <TopWear f={f} item={top} paint={paints.top} />}
        {dress && !aodai && <DressWear f={f} item={dress} paint={paints.dress} />}
        {aodai && <AoDaiWear f={f} paint={paints.dress} part="main" />}
        {belt && beltOverTop && <BeltWear f={f} paint={paints.belt} y={belt.y} half={belt.half} />}
        {items.necklace && <NecklaceWear f={f} item={items.necklace} paint={paints.necklace} widthAt={carrier} />}
        {items.neckwear && <TieWear f={f} item={items.neckwear} paint={paints.neckwear} widthAt={carrier} />}
        {outer && <OuterWear f={f} item={outer} paint={paints.outer} uid={uid} />}
        {items.scarf && <ScarfWear f={f} item={items.scarf} paint={paints.scarf} widthAt={onTop} />}
        {bag?.shape.type === 'tote' && <ToteBag f={f} paint={paints.bag} />}
        {bag?.shape.type === 'crossbody' && <CrossbodyBag f={f} paint={paints.bag} widthAt={onTop} />}
        {backpack && <BackpackStraps f={f} paint={paints.bag} widthAt={onTop} chest={body.chest + (outer ? 10 : 4)} />}
        {backpack && packInFront && <BackpackPack f={f} paint={paints.bag} />}
        <HeadFigure
          f={f}
          ghost={ghost}
          uid={uid}
          hair={hairSpec}
          hat={items.hat ? { item: items.hat, paint: paints.hat } : null}
          glasses={items.glasses ? { item: items.glasses, paint: paints.glasses } : null}
          earrings={items.earrings ? { item: items.earrings, paint: paints.earrings } : null}
        />
        {frontArms.map(renderArm)}
      </g>
    </g>
  )
}
