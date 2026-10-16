// Mảnh vải dùng chung: nền (màu/họa tiết) + lớp đổ bóng tạo khối 3D + đường viền mảnh.
// edge: viền riêng (ví dụ ống tay chỉ kẻ hai mép dọc để chỗ nối khuỷu tay liền mạch).
export function Fabric({ d, paint, transform, shading = 'h', outline = true, edge, strokeWidth = 1.1, opacity }) {
  return (
    <g transform={transform} opacity={opacity}>
      <path d={d} fill={paint.fill} />
      {shading.includes('h') && <path d={d} fill={paint.shadeH} />}
      {shading.includes('v') && <path d={d} fill={paint.shadeV} />}
      {outline && (
        <path d={edge ?? d} fill="none" stroke={paint.line} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      )}
    </g>
  )
}

// Khớp nối (khuỷu tay, đầu gối) vẽ dưới hai ống vải: chỉ lấp chỗ hở khi gập
export function Joint({ cy, r, paint }) {
  return (
    <g>
      <circle cx="0" cy={cy} r={r} fill={paint.fill} />
      <circle cx="0" cy={cy} r={r} fill={paint.shadeH} />
    </g>
  )
}

// Chi tiết nằm trên bề mặt thân (cúc, túi, cổ áo…): mờ dần rồi ẩn khi xoay khuất về phía sau
export function Surface({ vis, children }) {
  if (!(vis > 0.02)) return null
  return <g opacity={Math.min(1, vis * 3.2)}>{children}</g>
}

// Đường may / nếp gấp mảnh
export function Seam({ d, color, width = 0.9, opacity = 0.55, dash }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash}
      opacity={opacity}
    />
  )
}
