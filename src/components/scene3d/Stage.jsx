import { Environment, Lightformer, PerformanceMonitor, PerspectiveCamera } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { CAMERA_FOV, cameraDistance } from './camera'

export function PixelCamera() {
  const height = useThree((state) => state.size.height)
  const distance = cameraDistance(height)
  return <PerspectiveCamera makeDefault fov={CAMERA_FOV} position={[0, 0, distance]} near={1} far={distance * 4} />
}

// Ánh sáng studio mềm kiểu Spline: đèn hộp tạo phản chiếu dịu, không cần tải ảnh HDR từ mạng
export function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[0.4, 0.8, 1]} intensity={1.35} />
      <directionalLight position={[-0.6, -0.3, 0.6]} intensity={0.35} color="#f3d6cf" />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 6]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.1} position={[-6, 0, 3]} scale={[3, 8, 1]} color="#f6dcd4" />
        <Lightformer form="rect" intensity={1.1} position={[6, 0, 3]} scale={[3, 8, 1]} color="#dbe7d8" />
        <Lightformer form="circle" intensity={0.6} position={[0, -5, 2]} scale={4} />
      </Environment>
    </>
  )
}

/**
 * Tự hạ độ phân giải khi máy không theo kịp (khung hình tụt), tự nâng lại khi đã ổn.
 * onChange(dpr) cập nhật dpr của Canvas.
 */
export function AdaptiveQuality({ max, onChange }) {
  return (
    <PerformanceMonitor
      flipflops={3}
      onDecline={() => onChange(1)}
      onIncline={() => onChange(max)}
      onFallback={() => onChange(1)}
    />
  )
}
