const lerp = (from, to, t) => from + (to - from) * t

/**
 * Cỡ và đường bay của áo SGU (toạ độ pixel màn hình): cỡ tràn màn hình nhưng vẫn thấy trọn cổ áo + logo,
 * thân áo đủ rộng để che kín tủ khi bay qua giữa.
 */
export function shirtLayout(width, height) {
  const size = Math.max(height * 1.25, width * 0.8)
  return {
    size,
    // Cổ áo (cách mép trên vân ~9%) gần mép trên màn hình
    centerY: height / 2 - 40 - 0.41 * size,
    travel: width / 2 + size * 0.58,
  }
}

/** Tâm áo theo trục ngang (lệch so với giữa màn hình) ở tiến độ p (0 → 1): bay từ phải sang trái. */
export const shirtOffsetX = (layout, p) => lerp(layout.travel, -layout.travel, p)
