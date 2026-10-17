import { useSyncExternalStore } from 'react'

// Điện thoại (màn hẹp) hoặc máy tính bảng cảm ứng: chạy bản nhẹ của các cảnh 3D
const LITE_QUERY = '(max-width: 767px), (pointer: coarse) and (max-width: 1024px)'

export const isLiteDevice = () => typeof window !== 'undefined' && window.matchMedia(LITE_QUERY).matches

function subscribe(onChange) {
  const media = window.matchMedia(LITE_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/** true trên điện thoại / máy tính bảng: ít vật thể 3D hơn, độ phân giải thấp hơn, bỏ hiệu ứng nặng. */
export function useLiteMode() {
  return useSyncExternalStore(subscribe, isLiteDevice)
}
