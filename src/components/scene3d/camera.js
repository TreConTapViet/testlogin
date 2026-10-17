export const CAMERA_FOV = 30

// Khoảng cách camera để tại z = 0 đúng 1 đơn vị = 1 pixel màn hình (dễ đặt vật theo toạ độ DOM)
export const cameraDistance = (viewportHeight) => viewportHeight / 2 / Math.tan((CAMERA_FOV * Math.PI) / 360)

// Vật ở độ sâu z trông to/nhỏ hơn: nhân với hệ số này để vẫn hiện đúng vị trí & cỡ pixel mong muốn
export const depthFactor = (distance, z) => (distance - z) / distance
