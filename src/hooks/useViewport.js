import { useSyncExternalStore } from 'react'

function subscribe(onChange) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

// Trả về chuỗi để React so sánh được giữa các lần đọc
const getSnapshot = () => `${window.innerWidth}x${window.innerHeight}`

export function useViewport() {
  const [width, height] = useSyncExternalStore(subscribe, getSnapshot).split('x').map(Number)
  return { width, height }
}
