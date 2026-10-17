import { createElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { isLiteDevice } from '../../hooks/useLiteMode'
import { CLOTHES } from '../clothes/catalog'

// Quần áo 3D dựng thẳng từ hình SVG có sẵn (khung 100x100):
// các mảng tô đặc được đùn thành khối có vát cạnh tròn (kiểu "phồng" như Spline),
// nét vẽ thò ra ngoài (quai túi, gọng kính, tua khăn) thành ống tròn,
// còn chính hình SVG được vẽ lên mặt khối làm vân/chi tiết.

const OUTLINE_STROKE = 'rgba(40,24,12,0.22)'
// Điện thoại/máy tính bảng: vân nhỏ hơn, khối ít đỉnh hơn (đặt lúc dựng, xem prepareClothAssets)
// Ít đỉnh vừa đủ cho món đồ cỡ ~100–150px: cạnh vát 2 nấc, đường cong 6 đoạn (nhẹ hơn ~4 lần so với 4 nấc / 12 đoạn)
let TEXTURE_SIZE = 512
let EXTRUDE = { depth: 4, bevelEnabled: true, bevelThickness: 3, bevelSize: 1.6, bevelSegments: 2, curveSegments: 6 }
let TUBE_RADIAL = 6
const MIN_TUBE_STROKE = 1.2 // nét mảnh hơn chỉ là chi tiết vẽ, không cần thành ống

function alphaOf(color) {
  const match = /rgba\(([^)]+)\)/.exec(color)
  return match ? parseFloat(match[1].split(',')[3]) : 1
}

const isSolid = (color, opacity) => Boolean(color) && color !== 'none' && alphaOf(color) >= 1 && opacity >= 1

// Render các hình SVG của catalog ra chuỗi (dùng chung cho cả hình khối lẫn vân bề mặt)
function renderMarkup() {
  const host = document.createElement('div')
  const root = createRoot(host)
  flushSync(() => {
    root.render(
      createElement(
        'div',
        null,
        CLOTHES.map((item) =>
          createElement(
            'svg',
            { key: item.id, 'data-id': item.id, viewBox: '0 0 100 100', width: TEXTURE_SIZE, height: TEXTURE_SIZE },
            createElement(item.Shape, { c: item.color, d: item.detail }),
          ),
        ),
      ),
    )
  })
  const serializer = new XMLSerializer()
  const markup = {}
  host.querySelectorAll('svg').forEach((svg) => {
    markup[svg.dataset.id] = serializer.serializeToString(svg)
  })
  root.unmount()
  return markup
}

// Chiếu phẳng từ mặt trước: mặt trước/sau lấy đúng hình vẽ, cạnh bên lấy màu ở mép
function setPlanarUv(geometry) {
  const position = geometry.attributes.position
  const uv = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i += 1) {
    uv[i * 2] = position.getX(i) / 100
    uv[i * 2 + 1] = 1 - position.getY(i) / 100
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
}

// Về toạ độ 3D: tâm ở giữa, cạnh 1 đơn vị, trục y hướng lên.
// Lật y và z cùng lúc để mặt tam giác không bị đảo chiều.
function normalize(geometry) {
  geometry.translate(-50, -50, 0)
  geometry.scale(0.01, -0.01, -0.01)
  return geometry
}

function curveFromPoints(points) {
  const unique = points.filter((point, index) => index === 0 || point.distanceTo(points[index - 1]) > 0.01)
  if (unique.length < 2) return null
  return new THREE.CatmullRomCurve3(
    unique.map((point) => new THREE.Vector3(point.x, point.y, 0)),
    false,
    'centripetal',
  )
}

function buildGeometry(markup) {
  // Màu bán trong suốt (bóng, viền mảnh) chỉ là vân bề mặt, không dựng khối: bỏ trước khi phân tích
  const { paths } = new SVGLoader().parse(markup.replace(/(fill|stroke)="rgba\([^"]*\)"/g, '$1="none"'))
  const solids = []
  const tubesByColor = new Map()

  for (const path of paths) {
    const style = path.userData.style
    const opacity = style.opacity ?? 1
    if (isSolid(style.fill, style.fillOpacity * opacity)) {
      for (const shape of path.toShapes()) {
        const geometry = new THREE.ExtrudeGeometry(shape, EXTRUDE)
        geometry.translate(0, 0, -EXTRUDE.depth / 2)
        solids.push(geometry)
      }
    } else if (
      style.fill === 'none' &&
      isSolid(style.stroke, style.strokeOpacity * opacity) &&
      style.strokeWidth >= MIN_TUBE_STROKE
    ) {
      for (const subPath of path.subPaths) {
        const curve = curveFromPoints(subPath.getPoints(16))
        if (!curve) continue
        const segments = Math.max(6, Math.ceil(curve.getLength() / 4))
        const tube = new THREE.TubeGeometry(curve, segments, style.strokeWidth / 2, TUBE_RADIAL, false).toNonIndexed()
        const list = tubesByColor.get(style.stroke) ?? []
        list.push(tube)
        tubesByColor.set(style.stroke, list)
      }
    }
  }

  // Các mảng chồng lên nhau có cùng độ dày và cùng vân nên chỗ trùng nhìn liền một khối
  const body = mergeGeometries(solids, false)
  solids.forEach((geometry) => geometry.dispose())
  setPlanarUv(body)
  normalize(body)

  const tubes = [...tubesByColor].map(([color, list]) => {
    const geometry = normalize(mergeGeometries(list, false))
    list.forEach((geometry) => geometry.dispose())
    return { geometry, material: new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.55 }) }
  })

  return { body, tubes }
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

const svgUrl = (markup) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`

async function paintTexture(texture, markup) {
  // Bản không viền dùng để "loang" màu ra ngoài mép: phần vát cạnh lấy đúng màu vải thay vì màu viền tối
  const [image, bleed] = await Promise.all([
    loadImage(svgUrl(markup)),
    loadImage(svgUrl(markup.replaceAll(`stroke="${OUTLINE_STROKE}"`, 'stroke="none"'))),
  ])
  if (!image) return
  const context = texture.image.getContext('2d')
  if (bleed) {
    const unit = TEXTURE_SIZE / 512
    for (const radius of [16 * unit, 11 * unit, 6 * unit]) {
      for (let k = 0; k < 8; k += 1) {
        const angle = (k * Math.PI) / 4
        context.drawImage(bleed, Math.cos(angle) * radius, Math.sin(angle) * radius, TEXTURE_SIZE, TEXTURE_SIZE)
      }
    }
  }
  context.drawImage(image, 0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  texture.needsUpdate = true
}

let assets = null
let readyPromise = null

/** Dựng hình + vân cho toàn bộ catalog (chỉ làm một lần, dùng chung cho mọi màn hình). */
export function prepareClothAssets() {
  if (!readyPromise) {
    if (isLiteDevice()) {
      TEXTURE_SIZE = 256
      EXTRUDE = { ...EXTRUDE, curveSegments: 4 }
      TUBE_RADIAL = 5
    }
    const markup = renderMarkup()
    const painting = []
    assets = {}
    for (const item of CLOTHES) {
      const canvas = document.createElement('canvas')
      canvas.width = TEXTURE_SIZE
      canvas.height = TEXTURE_SIZE
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = 4
      painting.push(paintTexture(texture, markup[item.id]))
      const { body, tubes } = buildGeometry(markup[item.id])
      assets[item.id] = {
        geometry: body,
        material: new THREE.MeshStandardMaterial({ map: texture, roughness: 0.72, metalness: 0 }),
        tubes,
      }
    }
    readyPromise = Promise.all(painting).then(() => assets)
  }
  return readyPromise
}

export const getClothAsset = (id) => assets?.[id] ?? null
