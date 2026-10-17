export const TOP_BAR_HEIGHT = 76

// Thời lượng từng bước của màn mở đầu (ms), tính từ lúc màn tải xong
export const INTRO = {
  appearMs: 1500, // tủ gỗ từ từ hiện ra, xoay nhẹ về chính diện
  stuffedMs: 2900, // tủ chật rung mạnh dần trong khi camera tiến lại gần
  burstMs: 1050, // nổ tung, quần áo 3D văng ra phủ kín màn hình
  sweepMs: 2400, // áo đồng phục SGU bay ngang màn hình như lá cờ (lướt chậm qua giữa), rồi cửa tủ mở
}

export const STUFFED_SECONDS = INTRO.stuffedMs / 1000

// Tủ đủ cao để chứa form đăng ký, vẫn vừa màn hình laptop 720px
export function getWardrobeSize(viewportWidth, viewportHeight) {
  const width = Math.round(Math.min(440, Math.max(330, viewportWidth * 0.3)))
  const height = Math.round(Math.min(650, Math.max(480, viewportHeight - TOP_BAR_HEIGHT - 56)))
  return { width, height }
}

// Độ dày khung tủ (px): lòng tủ nơi đặt form = kích thước tủ trừ khung hai bên
export const WARDROBE_FRAME = 14

// Chiều sâu của tủ gỗ 3D (px)
export const wardrobeDepth = (wardrobeWidth) => Math.min(170, Math.round(wardrobeWidth * 0.42))

// Tâm của tủ (cũng là điểm quần áo bung ra)
export function getStageCenter(viewportWidth, viewportHeight) {
  return { x: viewportWidth / 2, y: TOP_BAR_HEIGHT + (viewportHeight - TOP_BAR_HEIGHT) / 2 }
}
