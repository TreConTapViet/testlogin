import { lazy } from 'react'
import FloatingClothes from '../scene/FloatingClothes'

// Phần 3D (three.js) nặng nên chỉ tải khi cần, và chỉ một lần cho cả ứng dụng.
// Máy không có WebGL hoặc tải lỗi thì quay về bản 2D cũ, không làm hỏng màn hình.

let webglSupport = null

export function supportsWebGL() {
  if (webglSupport === null) {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      webglSupport = Boolean(gl)
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {
      webglSupport = false
    }
  }
  return webglSupport
}

let modulesPromise = null
let scenePromise = null

/** Chỉ tải mã nguồn (dùng để báo tiến độ ở màn tải). */
export function loadScene3DModules() {
  if (!modulesPromise) {
    modulesPromise = supportsWebGL()
      ? Promise.all([import('./IntroScene3D'), import('./Clothes3D'), import('./clothAssets'), import('./sguShirt')])
          .then(([intro, clothes, assets, shirt]) => ({
            IntroScene3D: intro.default,
            Clothes3D: clothes.default,
            prepareClothAssets: assets.prepareClothAssets,
            loadSguLogo: shirt.loadSguLogo,
          }))
          .catch((error) => {
            console.warn('Không tải được phần 3D, dùng bản 2D.', error)
            return null
          })
      : Promise.resolve(null)
  }
  return modulesPromise
}

/** Tải mã nguồn + dựng sẵn hình khối/vân quần áo + logo SGU. Trả về null nếu không dùng được 3D. */
export function loadScene3D() {
  if (!scenePromise) {
    scenePromise = loadScene3DModules().then(async (modules) => {
      if (!modules) return null
      try {
        await Promise.all([modules.prepareClothAssets(), modules.loadSguLogo()])
        return modules
      } catch (error) {
        console.warn('Không dựng được quần áo 3D, dùng bản 2D.', error)
        return null
      }
    })
  }
  return scenePromise
}

const Nothing = () => null

// Màn chào chỉ dùng cảnh 3D khi loadScene3D() đã trả về module (xem Welcome); dự phòng: không vẽ gì
export const LazyIntroScene3D = lazy(() => loadScene3D().then((modules) => ({ default: modules?.IntroScene3D ?? Nothing })))
export const LazyClothes3D = lazy(() => loadScene3D().then((modules) => ({ default: modules?.Clothes3D ?? FloatingClothes })))
