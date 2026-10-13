export const TOP_BAR_HEIGHT = 76

// Mốc thời gian của màn mở đầu (ms tính từ lúc vào trang)
export const INTRO = {
  burstAt: 2900, // tủ chật rung dần rồi nổ tung
  settleAt: 4050, // hiệu ứng mờ chuyển cảnh
  openAt: 4750, // cửa tủ mở ra với lời chào
}

export const STUFFED_SECONDS = INTRO.burstAt / 1000

// Tủ đủ cao để chứa form đăng ký, vẫn vừa màn hình laptop 720px
export function getWardrobeSize(viewportWidth, viewportHeight) {
  const width = Math.round(Math.min(440, Math.max(330, viewportWidth * 0.3)))
  const height = Math.round(Math.min(650, Math.max(480, viewportHeight - TOP_BAR_HEIGHT - 56)))
  return { width, height }
}

// Tâm của tủ (cũng là điểm quần áo bung ra)
export function getStageCenter(viewportWidth, viewportHeight) {
  return { x: viewportWidth / 2, y: TOP_BAR_HEIGHT + (viewportHeight - TOP_BAR_HEIGHT) / 2 }
}
