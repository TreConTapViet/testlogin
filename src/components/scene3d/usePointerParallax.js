import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'

/**
 * Vị trí con trỏ trên cả cửa sổ (-1…1), làm mượt theo thời gian. Đọc trên window vì canvas
 * thường nằm sau tủ đồ / nội dung nên không tự nhận được hết sự kiện chuột. Dùng trong <Canvas>.
 */
export function usePointerParallax() {
  const target = useRef({ x: 0, y: 0 })
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handlePointerMove = (event) => {
      target.current.x = (event.clientX / window.innerWidth) * 2 - 1
      target.current.y = (event.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-delta * 2.5)
    pointer.current.x += (target.current.x - pointer.current.x) * k
    pointer.current.y += (target.current.y - pointer.current.y) * k
  })

  return pointer
}
