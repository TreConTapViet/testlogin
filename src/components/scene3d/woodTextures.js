import * as THREE from 'three'

// Vân dùng cho tủ gỗ 3D (vẽ bằng canvas, không cần tải ảnh)

function seeded(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function canvasOf(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return [canvas, canvas.getContext('2d')]
}

/**
 * Thớ gỗ xám nhạt (nhân với màu gỗ của vật liệu). UV của khối bo tròn tính bằng pixel
 * nên lặp lại theo `period` pixel.
 */
export function woodGrainTexture(period = 220) {
  const [canvas, context] = canvasOf(256, 256)
  context.fillStyle = '#f4f1ee'
  context.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 46; i += 1) {
    const x = seeded(i) * 256
    const width = 0.6 + seeded(i + 0.3) * 2.4
    context.strokeStyle = `rgba(60,35,15,${0.04 + seeded(i + 0.7) * 0.07})`
    context.lineWidth = width
    context.beginPath()
    for (let y = 0; y <= 256; y += 16) {
      const wobble = Math.sin(y * 0.03 + i) * 3 + Math.sin(y * 0.11 + i * 2) * 1.2
      if (y === 0) context.moveTo(x + wobble, y)
      else context.lineTo(x + wobble, y)
    }
    context.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1 / period, 1 / period)
  texture.anisotropy = 4
  return texture
}

/** Lòng tủ (vải lót sọc mảnh, đổ bóng ở mép trên/dưới) — giống lớp `lining` của bản 2D. */
export function liningTexture(color) {
  const [canvas, context] = canvasOf(128, 512)
  context.fillStyle = color
  context.fillRect(0, 0, 128, 512)
  context.fillStyle = 'rgba(0,0,0,0.022)'
  for (let x = 0; x < 128; x += 10) context.fillRect(x, 0, 2, 512)
  const top = context.createLinearGradient(0, 0, 0, 70)
  top.addColorStop(0, 'rgba(0,0,0,0.34)')
  top.addColorStop(1, 'rgba(0,0,0,0)')
  context.fillStyle = top
  context.fillRect(0, 0, 128, 70)
  const bottom = context.createLinearGradient(0, 512, 0, 470)
  bottom.addColorStop(0, 'rgba(0,0,0,0.24)')
  bottom.addColorStop(1, 'rgba(0,0,0,0)')
  context.fillStyle = bottom
  context.fillRect(0, 470, 128, 42)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** Bóng đổ mềm hình elip dưới chân tủ. */
export function shadowTexture() {
  const [canvas, context] = canvasOf(256, 64)
  const gradient = context.createRadialGradient(128, 32, 0, 128, 32, 128)
  gradient.addColorStop(0, 'rgba(0,0,0,0.9)')
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.35)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  context.setTransform(1, 0, 0, 0.25, 0, 24)
  context.fillStyle = gradient
  context.fillRect(0, -96, 256, 256)
  return new THREE.CanvasTexture(canvas)
}
